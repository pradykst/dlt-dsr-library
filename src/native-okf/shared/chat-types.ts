export type NativeOkfChatRole = "user" | "assistant";

export interface NativeOkfChatHistoryMessage {
  role: NativeOkfChatRole;
  content: string;
}

export interface NativeOkfChatRequest {
  question: string;
  history?: NativeOkfChatHistoryMessage[];
  includeDiagram?: boolean;
  conversationState?: NativeOkfConversationState;
}

export const NATIVE_OKF_CONVERSATION_STATE_VERSION = 1 as const;
export const MAX_NATIVE_OKF_ACTIVE_PAPERS = 3;
export const MAX_NATIVE_OKF_ACTIVE_CONCEPTS = 8;
export const MAX_NATIVE_OKF_ACTIVE_SOURCES = 12;
export const MAX_NATIVE_OKF_PENDING_QUESTION_CHARACTERS = 500;

export const NATIVE_OKF_CONVERSATION_INTENTS = [
  "answer",
  "comparison",
  "stored-diagram",
  "clarification",
] as const;

export type NativeOkfConversationIntent =
  (typeof NATIVE_OKF_CONVERSATION_INTENTS)[number];

export const NATIVE_OKF_CLARIFICATION_KINDS = [
  "missing-domain",
  "missing-output-type",
  "ambiguous-reference",
  "missing-comparison-target",
] as const;

export type NativeOkfClarificationKind =
  (typeof NATIVE_OKF_CLARIFICATION_KINDS)[number];

export interface NativeOkfPendingClarification {
  kind: NativeOkfClarificationKind;
  originalQuestion: string;
}

export interface NativeOkfConversationState {
  version: typeof NATIVE_OKF_CONVERSATION_STATE_VERSION;
  activePaperSlugs: string[];
  activeConceptIds: string[];
  activeSourceIds: string[];
  lastIntent: NativeOkfConversationIntent;
  lastDiagramRequested: boolean;
  pendingClarification: NativeOkfPendingClarification | null;
}

export interface NativeOkfClarification {
  question: string;
  kind: NativeOkfClarificationKind;
}

export function createInitialNativeOkfConversationState(): NativeOkfConversationState {
  return {
    version: NATIVE_OKF_CONVERSATION_STATE_VERSION,
    activePaperSlugs: [],
    activeConceptIds: [],
    activeSourceIds: [],
    lastIntent: "answer",
    lastDiagramRequested: false,
    pendingClarification: null,
  };
}

export interface NativeOkfSourceCard {
  sourceId: string;
  conceptId: string;
  title: string;
  type: string;
  description?: string;
  sourcePaper?: string;
  resource?: string;
}

export const GENERATED_DIAGRAM_STAGES = [
  "problem",
  "requirements",
  "principles",
  "features",
  "artifact",
  "governance",
  "evaluation",
  "outcome",
  "other",
] as const;

export type DiagramStage = (typeof GENERATED_DIAGRAM_STAGES)[number];

export interface GeneratedDiagramNode {
  id: string;
  label: string;
  description: string;
  category: string;
  stage: DiagramStage;
  order: number;
  group: string | null;
  sourcePaths: string[];
  synthesis: boolean;
}

export interface GeneratedDiagramEdge {
  source: string;
  target: string;
  label: string;
}

export interface GeneratedDiagram {
  title: string;
  explanation: string;
  nodes: GeneratedDiagramNode[];
  edges: GeneratedDiagramEdge[];
}

export interface NativeOkfPersonalQuotaMetadata {
  questionsRemainingToday: number;
  diagramsRemainingToday: number;
  questionsRemainingTotal: number;
  diagramsRemainingTotal: number;
  resetAtMs: number;
  accessExpiresAtMs: number;
}

export interface NativeOkfChatResponse {
  kind?: "answer" | "clarification";
  answerMarkdown: string;
  sources: NativeOkfSourceCard[];
  diagram?: GeneratedDiagram;
  clarification?: NativeOkfClarification;
  conversationState?: NativeOkfConversationState;
  insufficientContext: boolean;
  warnings?: string[];
  retrievalDebug?: unknown;
  quota?: NativeOkfPersonalQuotaMetadata;
}
