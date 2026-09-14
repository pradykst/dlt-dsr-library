import {
  createInitialNativeOkfConversationState,
  normalizeNativeOkfChatScope,
  MAX_NATIVE_OKF_ACTIVE_CONCEPTS,
  MAX_NATIVE_OKF_ACTIVE_PAPERS,
  MAX_NATIVE_OKF_ACTIVE_SOURCES,
  MAX_NATIVE_OKF_ACTIVE_STRUCTURED_RESULT_PAPERS,
  MAX_NATIVE_OKF_PENDING_QUESTION_CHARACTERS,
  MAX_NATIVE_OKF_SYNTHESIS_CLARIFICATION_ROUNDS,
  NATIVE_OKF_CLARIFICATION_KINDS,
  NATIVE_OKF_CONVERSATION_INTENTS,
  type NativeOkfClarificationKind,
  type NativeOkfConversationIntent,
  type NativeOkfConversationState,
  type NativeOkfConversationStateInput,
} from "./chat-types.ts";
import {
  parseSynthesisDraftState,
  parseSynthesisProblemState,
} from "./synthesis-draft.ts";
import { normalizeSynthesisProblemDisplay } from "./synthesis-problem-display.ts";

const STATE_KEYS = new Set([
  "version",
  "scope",
  "activePaperSlugs",
  "activeComparisonPaperSlugs",
  "activeStructuredResultPaperSlugs",
  "activeConceptIds",
  "activeSourceIds",
  "lastIntent",
  "lastDiagramRequested",
  "pendingClarification",
  "synthesisClarificationRounds",
  "lastSynthesisProblem",
  "latestValidatedSynthesisDraft",
  "synthesisDraft",
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

  const scope = normalizeNativeOkfChatScope(value.scope);
  if (scope === null) return null;

  const activePaperSlugs = boundedStrings(
    value.activePaperSlugs,
    MAX_NATIVE_OKF_ACTIVE_PAPERS,
  );
  const activeComparisonPaperSlugs = value.activeComparisonPaperSlugs === undefined
    ? []
    : boundedStrings(
        value.activeComparisonPaperSlugs,
        MAX_NATIVE_OKF_ACTIVE_PAPERS,
      );
  const activeStructuredResultPaperSlugs =
    value.activeStructuredResultPaperSlugs === undefined
      ? []
      : boundedStrings(
          value.activeStructuredResultPaperSlugs,
          MAX_NATIVE_OKF_ACTIVE_STRUCTURED_RESULT_PAPERS,
        );
  const activeConceptIds = boundedStrings(
    value.activeConceptIds,
    MAX_NATIVE_OKF_ACTIVE_CONCEPTS,
  );
  const activeSourceIds = value.activeSourceIds === undefined
    ? []
    : boundedStrings(
        value.activeSourceIds,
        MAX_NATIVE_OKF_ACTIVE_SOURCES,
      );
  if (
    activePaperSlugs === null ||
    activeComparisonPaperSlugs === null ||
    activeStructuredResultPaperSlugs === null ||
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

  const legacyDraft =
    value.synthesisDraft === undefined || value.synthesisDraft === null
      ? null
      : parseSynthesisDraftState(value.synthesisDraft);
  const latestValidatedSynthesisDraft =
    value.latestValidatedSynthesisDraft === undefined ||
      value.latestValidatedSynthesisDraft === null
      ? legacyDraft
      : parseSynthesisDraftState(value.latestValidatedSynthesisDraft);
  const explicitProblem =
    value.lastSynthesisProblem === undefined || value.lastSynthesisProblem === null
      ? null
      : parseSynthesisProblemState(value.lastSynthesisProblem);
  const lastSynthesisProblem = explicitProblem ??
    (latestValidatedSynthesisDraft
      ? {
          version: 1 as const,
          problemStatement: latestValidatedSynthesisDraft.problemStatement,
          displayProblem: normalizeSynthesisProblemDisplay(
            latestValidatedSynthesisDraft.problemStatement,
          ),
          domain: latestValidatedSynthesisDraft.domain,
          objective: latestValidatedSynthesisDraft.objective,
          outputType: "design-solution",
          constraints: latestValidatedSynthesisDraft.constraints,
          sourcePaperSlugs: [],
        }
      : null);

  if (
    (value.latestValidatedSynthesisDraft !== undefined &&
      value.latestValidatedSynthesisDraft !== null &&
      latestValidatedSynthesisDraft === null) ||
    (value.lastSynthesisProblem !== undefined &&
      value.lastSynthesisProblem !== null &&
      explicitProblem === null)
  ) {
    return null;
  }

  // A bounded, self-limiting counter — clamp rather than reject so an older or
  // hand-edited session never fails to parse over it.
  const synthesisClarificationRounds =
    typeof value.synthesisClarificationRounds === "number" &&
      Number.isFinite(value.synthesisClarificationRounds)
      ? Math.min(
          MAX_NATIVE_OKF_SYNTHESIS_CLARIFICATION_ROUNDS,
          Math.max(0, Math.floor(value.synthesisClarificationRounds)),
        )
      : 0;

  return {
    version: 1,
    scope,
    activePaperSlugs,
    activeComparisonPaperSlugs,
    activeStructuredResultPaperSlugs,
    activeConceptIds,
    activeSourceIds,
    lastIntent: value.lastIntent,
    lastDiagramRequested: value.lastDiagramRequested,
    pendingClarification,
    synthesisClarificationRounds,
    lastSynthesisProblem,
    latestValidatedSynthesisDraft,
    synthesisDraft: null,
  };
}

/**
 * Remove request-only duplication while retaining the complete semantic draft.
 * The in-tab response/session state remains unchanged and fully descriptive.
 */
export function compactNativeOkfConversationStateForRequest(
  state: NativeOkfConversationState,
): NativeOkfConversationStateInput {
  const draft = state.latestValidatedSynthesisDraft ?? state.synthesisDraft;
  const compactDraft = draft
    ? {
        version: draft.version,
        problemStatement: draft.problemStatement,
        domain: draft.domain,
        objective: draft.objective,
        constraints: draft.constraints,
        nodes: draft.nodes.map((node) => ({
          id: node.id,
          label: node.label,
          description: node.description,
          category: node.category,
          stage: node.stage,
          order: node.order,
          ...(node.group === null ? {} : { group: node.group }),
          provenance: node.provenance,
          supportConceptIds: node.supportConceptIds,
          ...(node.synthesisRationale === null
            ? {}
            : { synthesisRationale: node.synthesisRationale }),
        })),
        edges: draft.edges,
      }
    : null;
  return {
    version: state.version,
    scope: state.scope,
    activePaperSlugs: state.activePaperSlugs,
    activeComparisonPaperSlugs: state.activeComparisonPaperSlugs ?? [],
    activeStructuredResultPaperSlugs:
      state.activeStructuredResultPaperSlugs ?? [],
    activeConceptIds: state.activeConceptIds,
    lastIntent: state.lastIntent,
    lastDiagramRequested: state.lastDiagramRequested,
    pendingClarification: state.pendingClarification,
    ...(state.synthesisClarificationRounds
      ? { synthesisClarificationRounds: state.synthesisClarificationRounds }
      : {}),
    ...(compactDraft
      ? { latestValidatedSynthesisDraft: compactDraft }
      : state.lastSynthesisProblem
        ? { lastSynthesisProblem: state.lastSynthesisProblem }
        : {}),
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
