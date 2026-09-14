import "server-only";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  handlePublicNativeOkfChat,
  resetPublicNativeOkfChatConcurrencyForTests,
} from "../server/public-chat.ts";
import { MAX_NATIVE_OKF_REQUEST_BYTES } from "../server/openai/chat.ts";
import {
  clearOpenAiClientForTests,
  setOpenAiClientForTests,
} from "../server/openai/client.ts";
import { clearOpenAiEnvironmentCacheForTests } from "../server/openai/env.ts";
import {
  createInitialNativeOkfConversationState,
  MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGE_CHARACTERS,
  MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES,
  MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_EDGES,
  MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES,
  type NativeOkfChatResponse,
  type NativeOkfConversationState,
  type SynthesisDraftState,
} from "../shared/chat-types.ts";
import {
  compactNativeOkfConversationStateForRequest,
  parseNativeOkfConversationState,
} from "../shared/conversation-state.ts";
import { LEGACY_PUBLIC_REDIRECTS } from "../shared/routes.ts";

const PUBLIC_CHAT_URL = "https://library.example/api/native-okf/chat";
const INTERNAL_CHAT_URL = "http://127.0.0.1:3000/api/native-okf/chat";
const ORIGINAL_PUBLIC_ORIGIN = process.env.NATIVE_OKF_PUBLIC_ORIGIN;

function request(
  body: unknown,
  headers: Record<string, string> = {},
  url = PUBLIC_CHAT_URL,
): Request {
  return new Request(url, {
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

function rawRequest(body: string): Request {
  return new Request(PUBLIC_CHAT_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://library.example",
      "sec-fetch-site": "same-origin",
    },
    body,
  });
}

function proposalDraft(nodeCount: number, edgeCount: number): SynthesisDraftState {
  const supportConceptIds = [
    "design-knowledge/stored-requirement",
    "design-knowledge/stored-principle",
    "design-knowledge/stored-feature",
  ];
  const stages = [
    "design-requirement",
    "design-principle",
    "design-feature",
    "artifact",
  ] as const;
  const nodes = Array.from({ length: nodeCount }, (_, index) => ({
    id: `proposal-node-${index}`,
    label: `Proposal element ${index}`,
    description:
      `A bounded proposal description for element ${index} that retains the semantic information required for explanation and refinement.`,
    category: "Proposal element",
    stage: stages[index % stages.length]!,
    order: index,
    group: index % 5 === 0 ? `Branch ${index % 5}` : null,
    provenance: index === 0 ? "user-provided" as const : "synthesized" as const,
    sourcePaths: index === 0 ? [] : supportConceptIds,
    supportConceptIds: index === 0 ? [] : supportConceptIds,
    synthesisRationale: index === 0
      ? null
      : "The stored concepts support this problem-specific proposal element.",
    synthesis: index !== 0,
  }));
  const edges = Array.from({ length: edgeCount }, (_, index) => ({
    source: nodes[index % nodeCount]!.id,
    target: nodes[
      (index + 1 + Math.floor(index / nodeCount)) % nodeCount
    ]!.id,
    label: "supports",
    provenance: "synthesized" as const,
    supportConceptIds,
  }));
  return {
    version: 1,
    problemStatement:
      "A realistic substantial design problem requiring a validated proposal.",
    domain: "A cross-organizational research domain",
    objective: "Create a verifiable and auditable decision-support artifact.",
    constraints: [
      "Preserve privacy",
      "Support interoperability",
      "Maintain auditability",
    ],
    nodes,
    edges,
  };
}

function proposalState(nodeCount: number, edgeCount: number): NativeOkfConversationState {
  return {
    ...createInitialNativeOkfConversationState(),
    lastIntent: "synthesized-flow",
    lastDiagramRequested: true,
    lastSynthesisProblem: {
      version: 1,
      problemStatement:
        "A realistic substantial design problem requiring a validated proposal.",
      displayProblem:
        "A realistic substantial design problem requiring a validated proposal.",
      domain: "A cross-organizational research domain",
      objective: "Create a verifiable and auditable decision-support artifact.",
      outputType: "design-solution",
      constraints: [
        "Preserve privacy",
        "Support interoperability",
        "Maintain auditability",
      ],
      sourcePaperSlugs: [],
    },
    latestValidatedSynthesisDraft: proposalDraft(nodeCount, edgeCount),
  };
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

test.afterEach(() => {
  if (ORIGINAL_PUBLIC_ORIGIN === undefined) {
    delete process.env.NATIVE_OKF_PUBLIC_ORIGIN;
  } else {
    process.env.NATIVE_OKF_PUBLIC_ORIGIN = ORIGINAL_PUBLIC_ORIGIN;
  }
});

test("configured public origin allows a same-origin request behind a reverse proxy", async () => {
  process.env.NATIVE_OKF_PUBLIC_ORIGIN = "https://dsr-library.org";
  const result = await handlePublicNativeOkfChat(
    request(
      { question: "Hello" },
      {
        origin: "https://dsr-library.org",
        "sec-fetch-site": "same-origin",
      },
      INTERNAL_CHAT_URL,
    ),
    { answer: async () => response() },
  );

  assert.equal(result.status, 200);
});

test("configured public origin rejects an attacker origin behind a reverse proxy", async () => {
  process.env.NATIVE_OKF_PUBLIC_ORIGIN = "https://dsr-library.org";
  const result = await handlePublicNativeOkfChat(
    request(
      { question: "Hello" },
      { origin: "https://attacker.example" },
      INTERNAL_CHAT_URL,
    ),
    { answer: async () => response() },
  );

  assert.equal(result.status, 403);
  assert.equal(
    (await result.json() as Record<string, unknown>).code,
    "same_origin_required",
  );
});

test("request origin remains the fallback when no public origin is configured", async () => {
  delete process.env.NATIVE_OKF_PUBLIC_ORIGIN;
  const result = await handlePublicNativeOkfChat(request({ question: "Hello" }), {
    answer: async () => response(),
  });

  assert.equal(result.status, 200);
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

test("compact proposal requests retain semantic refinement state below the transport ceiling", () => {
  const state = proposalState(18, 24);
  const compactState = compactNativeOkfConversationStateForRequest(state);
  const history = Array.from(
    { length: MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES },
    (_, index) => ({
      role: index % 2 === 0 ? "user" as const : "assistant" as const,
      content: "h".repeat(MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGE_CHARACTERS),
    }),
  );
  const fullBody = JSON.stringify({
    question: "Explain the requirement you just added.",
    history,
    diagramPreference: "auto",
    visibleHistoryMessageCount: 10,
    conversationState: state,
  });
  const compactBody = JSON.stringify({
    question: "Explain the requirement you just added.",
    history,
    diagramPreference: "auto",
    visibleHistoryMessageCount: 10,
    conversationState: compactState,
  });
  const byteLength = (value: string) =>
    new TextEncoder().encode(value).byteLength;

  assert.ok(byteLength(compactBody) < byteLength(fullBody));
  assert.ok(byteLength(compactBody) < MAX_NATIVE_OKF_REQUEST_BYTES);
  assert.doesNotMatch(compactBody, /"sourcePaths"|"synthesisDraft"/u);
  const restored = parseNativeOkfConversationState(compactState);
  assert.ok(restored?.latestValidatedSynthesisDraft);
  assert.equal(restored.latestValidatedSynthesisDraft.nodes.length, 18);
  assert.equal(restored.latestValidatedSynthesisDraft.edges.length, 24);
  const synthesizedNode = restored.latestValidatedSynthesisDraft.nodes[1]!;
  assert.deepEqual(
    synthesizedNode.sourcePaths,
    synthesizedNode.supportConceptIds,
  );
  assert.equal(synthesizedNode.synthesis, true);
});

test("the emergency-maximum semantic proposal plus retained history fits the request guard", () => {
  const compactState = compactNativeOkfConversationStateForRequest(
    proposalState(
      MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES,
      MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_EDGES,
    ),
  );
  const body = JSON.stringify({
    question: "q".repeat(2_000),
    history: Array.from(
      { length: MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES },
      (_, index) => ({
        role: index % 2 === 0 ? "user" : "assistant",
        content: "h".repeat(MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGE_CHARACTERS),
      }),
    ),
    diagramPreference: "requested",
    visibleHistoryMessageCount: 20,
    conversationState: compactState,
  });

  assert.ok(
    new TextEncoder().encode(body).byteLength < MAX_NATIVE_OKF_REQUEST_BYTES,
  );
});

test("request transport accepts bytes below and rejects bytes above its hard ceiling", async () => {
  const bodyAt = (byteLength: number) => {
    const prefix = '{"padding":"';
    const suffix = '"}';
    return `${prefix}${"x".repeat(byteLength - prefix.length - suffix.length)}${suffix}`;
  };
  const below = await handlePublicNativeOkfChat(
    rawRequest(bodyAt(MAX_NATIVE_OKF_REQUEST_BYTES - 1)),
    { answer: async () => response() },
  );
  const above = await handlePublicNativeOkfChat(
    rawRequest(bodyAt(MAX_NATIVE_OKF_REQUEST_BYTES + 1)),
    { answer: async () => response() },
  );

  assert.notEqual(below.status, 413);
  assert.equal(above.status, 413);
});

test("stored diagrams and comparison prose are available anonymously", async () => {
  // The diagram itself is still built with zero LLM involvement (unchanged, guaranteed
  // canonical), but the turn now also generates a real grounded answer alongside it, so
  // this end-to-end anonymous-transport test needs a working (mocked) model client.
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalModel = process.env.OPENAI_MODEL;
  process.env.OPENAI_API_KEY = "sk-test-do-not-expose";
  process.env.OPENAI_MODEL = "test-model";
  clearOpenAiEnvironmentCacheForTests();
  setOpenAiClientForTests({
    responses: {
      create: async () => ({
        id: "mock-response",
        object: "response",
        created_at: 0,
        model: "test-model",
        output: [],
        output_text: "The stored records support this request.",
        status: "completed",
      }),
    },
    moderations: {
      create: async () => ({ results: [{ flagged: false }] }),
    },
  } as unknown as Parameters<typeof setOpenAiClientForTests>[0]);
  try {
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
    assert.equal(comparativePayload.diagramMode, null);
    assert.equal(comparativePayload.diagramStatus, null);
    assert.equal(comparativePayload.diagram, undefined);
  } finally {
    clearOpenAiClientForTests();
    process.env.OPENAI_API_KEY = originalApiKey;
    process.env.OPENAI_MODEL = originalModel;
    clearOpenAiEnvironmentCacheForTests();
  }
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
