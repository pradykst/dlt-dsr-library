import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  clearNativeOkfChatSession,
  createNativeOkfLocalConversationId,
  MAX_NATIVE_OKF_SESSION_MESSAGES,
  MAX_NATIVE_OKF_SESSION_SERIALIZED_CHARACTERS,
  NATIVE_OKF_CHAT_SESSION_KEY,
  parseNativeOkfChatSession,
  readNativeOkfChatSession,
  serializeNativeOkfChatSession,
  writeNativeOkfChatSession,
  type NativeOkfChatSessionPayload,
} from "../shared/chat-session.ts";
import {
  createInitialNativeOkfConversationState,
  type NativeOkfChatResponse,
} from "../shared/chat-types.ts";
import { INITIAL_DIAGRAM_INTENT_TOGGLE_STATE } from "../shared/diagram-intent.ts";

class MemorySessionStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function answerResponse(): NativeOkfChatResponse {
  return {
    kind: "answer",
    presentationMode: "text-primary",
    diagramStatus: null,
    answerMarkdown: "Grounded answer [[S1]].",
    sources: [
      {
        sourceId: "S1",
        conceptId: "papers/example",
        title: "Example",
        type: "paper",
      },
    ],
    insufficientContext: false,
    conversationState: createInitialNativeOkfConversationState(),
    retrievalDebug: { sourceBody: "must not persist" },
  };
}

function payload(): NativeOkfChatSessionPayload {
  return {
    version: 1,
    conversationId: "conversation-test-1234",
    messages: [
      {
        id: "user-1",
        role: "user",
        content: "Explain the example.",
      },
      {
        id: "assistant-2",
        role: "assistant",
        content: "Grounded answer [[S1]].",
        response: answerResponse(),
      },
    ],
    conversationState: {
      ...createInitialNativeOkfConversationState(),
      activePaperSlugs: ["example"],
      activeConceptIds: ["papers/example"],
      activeSourceIds: ["papers/example"],
    },
    diagramPreference: INITIAL_DIAGRAM_INTENT_TOGGLE_STATE,
  };
}

test("same-tab session messages and focus round-trip without debug data", () => {
  const storage = new MemorySessionStorage();
  assert.equal(writeNativeOkfChatSession(storage, payload()), true);

  const raw = storage.getItem(NATIVE_OKF_CHAT_SESSION_KEY) ?? "";
  assert.doesNotMatch(raw, /sourceBody/u);

  const restored = readNativeOkfChatSession(storage);
  assert.ok(restored);
  assert.equal(restored.messages.length, 2);
  assert.deepEqual(restored.conversationState.activePaperSlugs, [
    "example",
  ]);
  assert.equal(restored.diagramPreference.enabled, false);
});

test("corrupted or unsupported session data fails safely", () => {
  for (const value of [
    "{broken",
    JSON.stringify({ version: 2 }),
    JSON.stringify({
      ...payload(),
      conversationId: "contains personal information@example.com",
    }),
    "x".repeat(
      MAX_NATIVE_OKF_SESSION_SERIALIZED_CHARACTERS + 1,
    ),
  ]) {
    assert.equal(parseNativeOkfChatSession(value), null);
  }

  const throwingStorage = {
    getItem(): string | null {
      throw new Error("storage unavailable");
    },
  };
  assert.equal(readNativeOkfChatSession(throwingStorage), null);
});

test("serialized session data is bounded and retains only recent messages", () => {
  const oversized: NativeOkfChatSessionPayload = {
    ...payload(),
    messages: Array.from(
      { length: MAX_NATIVE_OKF_SESSION_MESSAGES + 20 },
      (_, index) => ({
        id: `message-${index}`,
        role: index % 2 === 0 ? "user" as const : "assistant" as const,
        content: `message ${index} ${"x".repeat(4_000)}`,
        ...(index % 2 === 0
          ? {}
          : { response: answerResponse() }),
      }),
    ),
  };

  const serialized = serializeNativeOkfChatSession(oversized);
  assert.ok(serialized);
  assert.ok(
    serialized.length <=
      MAX_NATIVE_OKF_SESSION_SERIALIZED_CHARACTERS,
  );
  const restored = parseNativeOkfChatSession(serialized);
  assert.ok(restored);
  assert.ok(
    restored.messages.length <= MAX_NATIVE_OKF_SESSION_MESSAGES,
  );
  assert.match(
    restored.messages.at(-1)?.content ?? "",
    /message 51/u,
  );
});

test("New chat storage clear removes only the conversation key", () => {
  const storage = new MemorySessionStorage();
  storage.setItem("unrelated", "preserve");
  writeNativeOkfChatSession(storage, payload());

  clearNativeOkfChatSession(storage);

  assert.equal(storage.getItem(NATIVE_OKF_CHAT_SESSION_KEY), null);
  assert.equal(storage.getItem("unrelated"), "preserve");
});

test("local conversation IDs are non-personal bounded identifiers", () => {
  const id = createNativeOkfLocalConversationId();
  assert.match(id, /^conversation-[a-z0-9-]+$/iu);
  assert.ok(id.length <= 80);
});

test("chat UI uses sessionStorage, exposes New chat, and never stores credentials", async () => {
  const source = await readFile(
    resolve(
      process.cwd(),
      "src/native-okf/components/chat/ChatWorkbench.tsx",
    ),
    "utf8",
  );

  assert.match(source, /window\.sessionStorage/u);
  assert.match(source, />\s*New chat\s*</u);
  assert.match(source, /clearNativeOkfChatSession/u);
  assert.match(source, /createInitialNativeOkfConversationState/u);
  assert.match(source, /INITIAL_DIAGRAM_INTENT_TOGGLE_STATE/u);
  assert.doesNotMatch(source, /localStorage/u);
  assert.doesNotMatch(
    source,
    /document\.cookie|accessCode|sessionSecret|invitationCode/u,
  );
});

test("canonical chat path adds no server-side conversation persistence", async () => {
  const paths = [
    "app/api/native-okf/chat/route.ts",
    "src/native-okf/server/openai/chat.ts",
    "src/native-okf/server/public-chat.ts",
  ] as const;
  const source = (
    await Promise.all(
      paths.map((path) =>
        readFile(resolve(process.cwd(), path), "utf8")
      ),
    )
  ).join("\n");

  assert.doesNotMatch(
    source,
    /(?:insert|update|save|persist)(?:Prompt|Answer|Message|Conversation|Chat)/u,
  );
  assert.doesNotMatch(source, /localStorage/u);
  assert.match(source, /store:\s*false/u);
});
