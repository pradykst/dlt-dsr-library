import { normalizeNativeOkfChatScope, type NativeOkfChatScope } from "./chat-types.ts";
import type {
  NativeOkfChatResponse,
  NativeOkfConversationState,
} from "./chat-types.ts";
import { parseNativeOkfConversationState } from "./conversation-state.ts";
import type { DiagramIntentToggleState } from "./diagram-intent.ts";

export const NATIVE_OKF_CHAT_SESSION_KEY =
  "native-okf-chat-session:v1";
export const MAX_NATIVE_OKF_SESSION_MESSAGES = 32;
export const MAX_NATIVE_OKF_SESSION_MESSAGE_CHARACTERS = 12_000;
export const MAX_NATIVE_OKF_SESSION_SERIALIZED_CHARACTERS = 100_000;

export interface NativeOkfStoredChatMessage {
  scope?: NativeOkfChatScope;
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: NativeOkfChatResponse;
}

export interface NativeOkfChatSessionPayload {
  version: 1;
  conversationId: string;
  messages: NativeOkfStoredChatMessage[];
  conversationState: NativeOkfConversationState;
  diagramPreference: DiagramIntentToggleState;
}

interface StorageReader {
  getItem(key: string): string | null;
}

interface StorageWriter {
  setItem(key: string, value: string): void;
}

interface StorageRemover {
  removeItem(key: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
}

function safeConversationId(value: unknown): value is string {
  return typeof value === "string" &&
    /^[a-z0-9-]{8,80}$/iu.test(value);
}

function safeDiagramPreference(
  value: unknown,
): DiagramIntentToggleState | null {
  if (
    !isRecord(value) ||
    typeof value.enabled !== "boolean" ||
    typeof value.autoEnabled !== "boolean" ||
    !(
      value.manuallyDisabledFor === null ||
      (
        typeof value.manuallyDisabledFor === "string" &&
        value.manuallyDisabledFor.length <= 2_000
      )
    )
  ) {
    return null;
  }
  return {
    enabled: value.enabled,
    autoEnabled: value.autoEnabled,
    manuallyDisabledFor: value.manuallyDisabledFor,
  };
}

function safeStoredResponse(
  value: unknown,
): NativeOkfChatResponse | undefined {
  if (!isRecord(value)) return undefined;
  if (
    typeof value.answerMarkdown !== "string" ||
    !Array.isArray(value.sources) ||
    typeof value.insufficientContext !== "boolean"
  ) {
    return undefined;
  }
  return value as unknown as NativeOkfChatResponse;
}

function safeStoredMessage(
  value: unknown,
): NativeOkfStoredChatMessage | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    value.id.length > 100 ||
    (value.role !== "user" && value.role !== "assistant") ||
    typeof value.content !== "string" ||
    value.content.length === 0 ||
    value.content.length >
      MAX_NATIVE_OKF_SESSION_MESSAGE_CHARACTERS
  ) {
    return null;
  }
  const response = safeStoredResponse(value.response);
  const scope = normalizeNativeOkfChatScope(value.scope);
  if (!scope) return null;
  return {
    ...(value.scope === undefined ? {} : { scope }),
    id: value.id,
    role: value.role,
    content: value.content,
    ...(response ? { response } : {}),
  };
}

function parsePayload(value: unknown): NativeOkfChatSessionPayload | null {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !safeConversationId(value.conversationId) ||
    !Array.isArray(value.messages)
  ) {
    return null;
  }
  const conversationState = parseNativeOkfConversationState(
    value.conversationState,
  );
  const diagramPreference = safeDiagramPreference(
    value.diagramPreference,
  );
  if (!conversationState || !diagramPreference) return null;
  const messages = value.messages
    .slice(-MAX_NATIVE_OKF_SESSION_MESSAGES)
    .map(safeStoredMessage);
  if (messages.some((message) => message === null)) return null;
  return {
    version: 1,
    conversationId: value.conversationId,
    messages: messages as NativeOkfStoredChatMessage[],
    conversationState,
    diagramPreference,
  };
}

function compactResponse(
  response: NativeOkfChatResponse | undefined,
): NativeOkfChatResponse | undefined {
  if (!response) return undefined;
  const safe = { ...response };
  delete safe.retrievalDebug;
  delete safe.conversationState;
  // The validated latest draft is stored once in the session conversation state.
  delete safe.synthesisDraft;
  return safe;
}

function compactPayload(
  payload: NativeOkfChatSessionPayload,
): NativeOkfChatSessionPayload {
  return {
    version: 1,
    conversationId: payload.conversationId,
    messages: payload.messages
      .slice(-MAX_NATIVE_OKF_SESSION_MESSAGES)
      .flatMap((message) => {
        if (
          message.content.length === 0 ||
          message.content.length >
            MAX_NATIVE_OKF_SESSION_MESSAGE_CHARACTERS
        ) {
          return [];
        }
        return [{
          ...(message.scope ? { scope: message.scope } : {}),
          id: message.id.slice(0, 100),
          role: message.role,
          content: message.content,
          ...(message.response
            ? { response: compactResponse(message.response) }
            : {}),
        }];
      }),
    conversationState: payload.conversationState,
    diagramPreference: payload.diagramPreference,
  };
}

export function serializeNativeOkfChatSession(
  payload: NativeOkfChatSessionPayload,
): string | null {
  const bounded = compactPayload(payload);
  let serialized: string;
  try {
    serialized = JSON.stringify(bounded);
  } catch {
    return null;
  }
  while (
    serialized.length >
      MAX_NATIVE_OKF_SESSION_SERIALIZED_CHARACTERS &&
    bounded.messages.length > 1
  ) {
    bounded.messages.splice(0, Math.min(2, bounded.messages.length - 1));
    serialized = JSON.stringify(bounded);
  }
  if (
    serialized.length >
      MAX_NATIVE_OKF_SESSION_SERIALIZED_CHARACTERS
  ) {
    bounded.messages = bounded.messages.map((message) => ({
      ...(message.scope ? { scope: message.scope } : {}),
      id: message.id,
      role: message.role,
      content: message.content,
    }));
    serialized = JSON.stringify(bounded);
  }
  return serialized.length <=
      MAX_NATIVE_OKF_SESSION_SERIALIZED_CHARACTERS
    ? serialized
    : null;
}

export function parseNativeOkfChatSession(
  serialized: string | null,
): NativeOkfChatSessionPayload | null {
  if (
    serialized === null ||
    serialized.length === 0 ||
    serialized.length >
      MAX_NATIVE_OKF_SESSION_SERIALIZED_CHARACTERS
  ) {
    return null;
  }
  try {
    return parsePayload(JSON.parse(serialized) as unknown);
  } catch {
    return null;
  }
}

/**
 * The paper-page chat drawer keeps its own session under a per-paper key so it
 * never collides with the main chat's conversation.
 */
export function readNativeOkfChatSession(
  storage: StorageReader,
  key: string = NATIVE_OKF_CHAT_SESSION_KEY,
): NativeOkfChatSessionPayload | null {
  try {
    return parseNativeOkfChatSession(storage.getItem(key));
  } catch {
    return null;
  }
}

export function writeNativeOkfChatSession(
  storage: StorageWriter,
  payload: NativeOkfChatSessionPayload,
  key: string = NATIVE_OKF_CHAT_SESSION_KEY,
): boolean {
  const serialized = serializeNativeOkfChatSession(payload);
  if (!serialized) return false;
  try {
    storage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

export function clearNativeOkfChatSession(
  storage: StorageRemover,
  key: string = NATIVE_OKF_CHAT_SESSION_KEY,
): void {
  try {
    storage.removeItem(key);
  } catch {
    // Browser storage may be disabled. New chat still clears memory.
  }
}

export function createNativeOkfLocalConversationId(): string {
  const randomValue =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 14)}`;
  return `conversation-${randomValue}`;
}
