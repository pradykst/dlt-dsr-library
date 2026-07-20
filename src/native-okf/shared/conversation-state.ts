import {
  createInitialNativeOkfConversationState,
  MAX_NATIVE_OKF_ACTIVE_CONCEPTS,
  MAX_NATIVE_OKF_ACTIVE_PAPERS,
  MAX_NATIVE_OKF_ACTIVE_SOURCES,
  MAX_NATIVE_OKF_PENDING_QUESTION_CHARACTERS,
  NATIVE_OKF_CLARIFICATION_KINDS,
  NATIVE_OKF_CONVERSATION_INTENTS,
  type NativeOkfClarificationKind,
  type NativeOkfConversationIntent,
  type NativeOkfConversationState,
} from "./chat-types.ts";

const STATE_KEYS = new Set([
  "version",
  "activePaperSlugs",
  "activeConceptIds",
  "activeSourceIds",
  "lastIntent",
  "lastDiagramRequested",
  "pendingClarification",
]);
const PENDING_KEYS = new Set(["kind", "originalQuestion"]);
const MAX_IDENTIFIER_CHARACTERS = 256;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function sanitize(value: string): string {
  return value
    .replace(/\u0000/gu, "")
    .replace(
      /[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu,
      "",
    )
    .replace(/\r\n?/gu, "\n")
    .trim();
}

function boundedStrings(
  value: unknown,
  maximumItems: number,
): string[] | null {
  if (!Array.isArray(value)) return null;
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") return null;
    const normalized = sanitize(item);
    if (
      normalized === "" ||
      normalized.length > MAX_IDENTIFIER_CHARACTERS
    ) {
      return null;
    }
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
    if (result.length >= maximumItems) break;
  }
  return result;
}

function isIntent(value: unknown): value is NativeOkfConversationIntent {
  return typeof value === "string" &&
    NATIVE_OKF_CONVERSATION_INTENTS.some(
      (candidate) => candidate === value,
    );
}

function isClarificationKind(
  value: unknown,
): value is NativeOkfClarificationKind {
  return typeof value === "string" &&
    NATIVE_OKF_CLARIFICATION_KINDS.some(
      (candidate) => candidate === value,
    );
}

export function parseNativeOkfConversationState(
  value: unknown,
): NativeOkfConversationState | null {
  if (!isRecord(value) || !hasOnlyKeys(value, STATE_KEYS)) {
    return null;
  }
  if (value.version !== 1) return null;

  const activePaperSlugs = boundedStrings(
    value.activePaperSlugs,
    MAX_NATIVE_OKF_ACTIVE_PAPERS,
  );
  const activeConceptIds = boundedStrings(
    value.activeConceptIds,
    MAX_NATIVE_OKF_ACTIVE_CONCEPTS,
  );
  const activeSourceIds = boundedStrings(
    value.activeSourceIds,
    MAX_NATIVE_OKF_ACTIVE_SOURCES,
  );
  if (
    activePaperSlugs === null ||
    activeConceptIds === null ||
    activeSourceIds === null ||
    !isIntent(value.lastIntent) ||
    typeof value.lastDiagramRequested !== "boolean"
  ) {
    return null;
  }

  let pendingClarification: NativeOkfConversationState["pendingClarification"] =
    null;
  if (value.pendingClarification !== null) {
    if (
      !isRecord(value.pendingClarification) ||
      !hasOnlyKeys(value.pendingClarification, PENDING_KEYS) ||
      !isClarificationKind(value.pendingClarification.kind) ||
      typeof value.pendingClarification.originalQuestion !== "string"
    ) {
      return null;
    }
    const originalQuestion = sanitize(
      value.pendingClarification.originalQuestion,
    );
    if (
      originalQuestion === "" ||
      originalQuestion.length >
        MAX_NATIVE_OKF_PENDING_QUESTION_CHARACTERS
    ) {
      return null;
    }
    pendingClarification = {
      kind: value.pendingClarification.kind,
      originalQuestion,
    };
  }

  return {
    version: 1,
    activePaperSlugs,
    activeConceptIds,
    activeSourceIds,
    lastIntent: value.lastIntent,
    lastDiagramRequested: value.lastDiagramRequested,
    pendingClarification,
  };
}

export function readNativeOkfConversationStateOrInitial(
  value: unknown,
): NativeOkfConversationState {
  return (
    parseNativeOkfConversationState(value) ??
    createInitialNativeOkfConversationState()
  );
}
