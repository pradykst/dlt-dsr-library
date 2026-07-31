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
export const MAX_NATIVE_OKF_SYNTHESIS_PROBLEM_CHARACTERS = 800;
export const MAX_NATIVE_OKF_SYNTHESIS_DOMAIN_CHARACTERS = 120;
export const MAX_NATIVE_OKF_SYNTHESIS_OBJECTIVE_CHARACTERS = 300;
export const MAX_NATIVE_OKF_SYNTHESIS_CONSTRAINTS = 6;
export const MAX_NATIVE_OKF_SYNTHESIS_CONSTRAINT_CHARACTERS = 200;

export const NATIVE_OKF_CONVERSATION_INTENTS = [
  "answer",
  "comparison",
  "stored-diagram",
  "synthesized-flow",
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
  lastSynthesisProblem?: SynthesisProblemState | null;
  latestValidatedSynthesisDraft?: SynthesisDraftState | null;
  /**
   * Accepted only as a session-contract migration placeholder. New responses
   * never place a draft here; validated drafts live in the field above.
   */
  synthesisDraft: SynthesisDraftState | null;
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
    lastSynthesisProblem: null,
    latestValidatedSynthesisDraft: null,
    synthesisDraft: null,
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
  "design-goal",
  "design-objective",
  "meta-requirement",
  "design-requirement",
  "requirements",
  "design-principle",
  "principles",
  "design-feature",
  "features",
  "artifact",
  "governance",
  "evaluation",
  "outcome",
  "other",
] as const;

export type DiagramStage = (typeof GENERATED_DIAGRAM_STAGES)[number];

export const DIAGRAM_NODE_PROVENANCE = [
  "user-provided",
  "stored",
  "synthesized",
] as const;
export type DiagramNodeProvenance =
  (typeof DIAGRAM_NODE_PROVENANCE)[number];

export const DIAGRAM_EDGE_PROVENANCE = ["stored", "synthesized"] as const;
export type DiagramEdgeProvenance =
  (typeof DIAGRAM_EDGE_PROVENANCE)[number];

export interface GeneratedDiagramNode {
  id: string;
  label: string;
  description: string;
  category: string;
  stage: DiagramStage;
  order: number;
  group: string | null;
  provenance: DiagramNodeProvenance;
  sourcePaths: string[];
  supportConceptIds: string[];
  synthesisRationale: string | null;
  /** Retained for the accepted renderer contract; provenance is authoritative. */
  synthesis: boolean;
}

export interface GeneratedDiagramEdge {
  source: string;
  target: string;
  label: string;
  provenance: DiagramEdgeProvenance;
  supportConceptIds: string[];
}

export interface GeneratedDiagram {
  title: string;
  explanation: string;
  nodes: GeneratedDiagramNode[];
  edges: GeneratedDiagramEdge[];
}

export interface SynthesisDraftState {
  version: 1;
  problemStatement: string;
  domain: string | null;
  objective: string | null;
  constraints: string[];
  nodes: GeneratedDiagramNode[];
  edges: GeneratedDiagramEdge[];
}

export interface SynthesisProblemState {
  version: 1;
  problemStatement: string;
  domain: string | null;
  objective: string | null;
  outputType: "design-solution" | "explanatory-theory" | null;
  constraints: string[];
  sourcePaperSlugs: string[];
}

export type NativeOkfDiagramMode = "stored" | "synthesized";
export type NativeOkfPresentationMode =
  | "text-primary"
  | "diagram-primary"
  | "clarification"
  | "no-match"
  | "safe-error";
export type NativeOkfDiagramStatus =
  | "success"
  | "evidence-fallback"
  | "failed"
  | null;
export type NativeOkfSafeDiagnosticCode =
  | "answer-presentation-invalid"
  | "stored-map-unavailable"
  | "synthesis-plan-invalid"
  | "synthesis-plan-repair-failed";

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
  presentationMode: NativeOkfPresentationMode;
  answerMarkdown: string;
  deterministicSummary?: string;
  sources: NativeOkfSourceCard[];
  diagram?: GeneratedDiagram;
  diagramMode?: NativeOkfDiagramMode | null;
  diagramStatus: NativeOkfDiagramStatus;
  diagnosticCode?: NativeOkfSafeDiagnosticCode;
  synthesisDraft?: SynthesisDraftState;
  clarification?: NativeOkfClarification;
  conversationState?: NativeOkfConversationState;
  insufficientContext: boolean;
  warnings?: string[];
  retrievalDebug?: unknown;
  quota?: NativeOkfPersonalQuotaMetadata;
}
