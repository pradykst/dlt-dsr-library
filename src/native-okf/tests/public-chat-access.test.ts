import "server-only";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  handlePublicNativeOkfChat,
  resetPublicNativeOkfChatConcurrencyForTests,
} from "../server/public-chat.ts";
import type { NativeOkfChatResponse } from "../shared/chat-types.ts";
import { createInitialNativeOkfConversationState } from "../shared/chat-types.ts";
import { LEGACY_PUBLIC_REDIRECTS } from "../shared/routes.ts";

const PUBLIC_CHAT_URL = "https://library.example/api/native-okf/chat";

function request(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request(PUBLIC_CHAT_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://library.example",
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function response(
  overrides: Partial<NativeOkfChatResponse> = {},
): NativeOkfChatResponse {
  return {
    kind: "answer",
    presentationMode: "text-primary",
    answerMarkdown: "Grounded answer [Source 1]",
    sources: [],
    diagramMode: null,
    diagramStatus: null,
    insufficientContext: false,
    conversationState: createInitialNativeOkfConversationState(),
    ...overrides,
  };
}

test.beforeEach(() => {
  resetPublicNativeOkfChatConcurrencyForTests();
});

test("anonymous same-origin requests delegate to the calibrated chat flow without a cookie", async () => {
  let received: unknown;
  const input = {
    question: "What design principles are represented in the library?",
    includeDiagram: false,
  };
  const result = await handlePublicNativeOkfChat(request(input), {
    environment: {},
    answer: async (value) => {
      received = value;
      return response();
    },
  });

  assert.equal(result.status, 200);
  assert.deepEqual(received, input);
  assert.equal(result.headers.get("set-cookie"), null);
  const payload = await result.json() as Record<string, unknown>;
  assert.equal("quota" in payload, false);
  assert.equal("questionsRemaining" in payload, false);
  assert.equal("diagramsRemaining" in payload, false);
});

test("public chat keeps same-origin, JSON, kill-switch, and request-size controls", async () => {
  const crossOrigin = await handlePublicNativeOkfChat(
    request({ question: "Hello" }, { origin: "https://attacker.example" }),
    { environment: {}, answer: async () => response() },
  );
  assert.equal(crossOrigin.status, 403);

  const disabled = await handlePublicNativeOkfChat(
    request({ question: "Hello" }),
    {
      environment: { NATIVE_OKF_CHAT_ENABLED: "false" },
      answer: async () => response(),
    },
  );
  assert.equal(disabled.status, 503);

  const oversized = await handlePublicNativeOkfChat(
    request({ question: "x" }, { "content-length": "10000000" }),
    { environment: {}, answer: async () => response() },
  );
  assert.equal(oversized.status, 413);
});

test("stored and comparative deterministic diagrams are available anonymously", async () => {
  const stored = await handlePublicNativeOkfChat(request({
    question:
      "Create a design diagram for Blockchain for the IoT showing its requirements, principles, features, and their relationships.",
    includeDiagram: true,
  }), { environment: {} });
  assert.equal(stored.status, 200);
  assert.equal(stored.headers.get("set-cookie"), null);
  const storedPayload = await stored.json() as NativeOkfChatResponse;
  assert.equal(storedPayload.diagramMode, "stored");
  assert.equal(storedPayload.diagramStatus, "success");
  assert.ok((storedPayload.diagram?.nodes.length ?? 0) > 0);

  const comparative = await handlePublicNativeOkfChat(request({
    question:
      "Create a diagram comparing how trust is operationalized in the trust-enabling capacity-exchange paper and the consent self-management paper. Keep the two papers distinguishable.",
    includeDiagram: true,
  }), { environment: {} });
  assert.equal(comparative.status, 200);
  assert.equal(comparative.headers.get("set-cookie"), null);
  const comparativePayload = await comparative.json() as NativeOkfChatResponse;
  assert.equal(comparativePayload.diagramMode, "comparative");
  assert.equal(comparativePayload.diagramStatus, "success");
  assert.ok((comparativePayload.diagram?.nodes.length ?? 0) > 0);
});

test("public transport preserves the synthesized validated-diagram response path", async () => {
  const synthesized = response({
    presentationMode: "diagram-primary",
    answerMarkdown: "Grounded synthesized proposal.",
    diagramMode: "synthesized",
    diagramStatus: "success",
    diagram: {
      title: "Grounded proposal",
      explanation: "A validated proposal.",
      nodes: [],
      edges: [],
    },
  });
  const result = await handlePublicNativeOkfChat(request({
    question: "Help me design an artifact and show the diagram.",
    includeDiagram: true,
  }), {
    environment: {},
    answer: async () => synthesized,
  });
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), synthesized);
});

test("chat page and route contain no access-store or invitation dependency", async () => {
  const [page, workbench, route, publicHandler] = await Promise.all([
    readFile("app/native-okf/chat/page.tsx", "utf8"),
    readFile("src/native-okf/components/chat/ChatWorkbench.tsx", "utf8"),
    readFile("app/api/native-okf/chat/route.ts", "utf8"),
    readFile("src/native-okf/server/public-chat.ts", "utf8"),
  ]);
  const runtime = `${page}\n${workbench}\n${route}\n${publicHandler}`;
  assert.match(publicHandler, /answerNativeOkfChat/u);
  assert.doesNotMatch(
    runtime,
    /better-sqlite3|sqlite-store|store-singleton|researcher invitation|accessCode|questionsRemaining|diagramsRemaining/u,
  );
  assert.equal(
    LEGACY_PUBLIC_REDIRECTS.some(
      (redirect) =>
        redirect.source === "/access" && redirect.destination === "/chat",
    ),
    true,
  );
});
