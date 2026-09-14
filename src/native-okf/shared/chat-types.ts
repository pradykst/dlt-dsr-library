export type NativeOkfChatRole = "user" | "assistant";

export interface NativeOkfChatHistoryMessage {
  role: NativeOkfChatRole;
  content: string;
}

/** Shared browser/server boundary for conversational context sent to the model. */
export const MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES = 8;
export const MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGE_CHARACTERS = 2_000;

export function nativeOkfVisibleHistoryExceedsModelContext(
  visibleMessageCount: number,
): boolean {
  return Number.isFinite(visibleMessageCount) &&
    visibleMessageCount > MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES;
}

/** Emergency guards for model-generated diagrams, not desired topology targets. */
export const MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES = 48;
export const MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_EDGES = 96;

/**
 * PRIMARY design-flow relationships. These carry the hierarchical proposal
 * grammar Problem -> Requirement -> Design Principle -> Design Feature ->
 * Artifact. A primary edge must connect two consecutive semantic layers.
 * These are meanings, not layout hints.
 */
export const PRIMARY_SYNTHESIS_RELATIONSHIP_TYPES = [
  "motivates",
  "requires",
  "informs",
  "addresses",
  "addressed by",
  "implements",
  "implemented by",
  "instantiates",
  "instantiated in",
  "evaluates",
  "evaluated by",
  "supports",
  "enables",
  "validates",
] as const;

/**
 * SECONDARY relationships express same-layer dependencies or implementation
 * ordering (Design Principle -> Design Principle, Design Feature <-> Design
 * Feature). A secondary edge is never part of the primary hierarchy: it never
 * satisfies a missing primary parent, never completes a primary path, and is
 * rendered and labelled distinctly from the primary design flow.
 */
export const SECONDARY_SYNTHESIS_RELATIONSHIP_TYPES = [
  "depends on",
  "interoperates with",
] as const;

export const SYNTHESIS_RELATIONSHIP_TYPES = [
  ...PRIMARY_SYNTHESIS_RELATIONSHIP_TYPES,
  ...SECONDARY_SYNTHESIS_RELATIONSHIP_TYPES,
] as const;

export type SynthesisRelationshipType =
  (typeof SYNTHESIS_RELATIONSHIP_TYPES)[number];

export type PrimarySynthesisRelationshipType =
  (typeof PRIMARY_SYNTHESIS_RELATIONSHIP_TYPES)[number];

export type SecondarySynthesisRelationshipType =
  (typeof SECONDARY_SYNTHESIS_RELATIONSHIP_TYPES)[number];

export type SynthesisEdgeStructuralClass = "primary" | "secondary";

const PRIMARY_SYNTHESIS_RELATIONSHIP_SET: ReadonlySet<string> = new Set(
  PRIMARY_SYNTHESIS_RELATIONSHIP_TYPES,
);
const SECONDARY_SYNTHESIS_RELATIONSHIP_SET: ReadonlySet<string> = new Set(
  SECONDARY_SYNTHESIS_RELATIONSHIP_TYPES,
);

/**
 * The single deterministic classifier for a synthesized proposal edge. It maps
 * every member of the CLOSED controlled relationship vocabulary
 * (`SYNTHESIS_RELATIONSHIP_TYPES`) to exactly one structural class, and returns
 * `null` for any unknown or unmapped type. Classification is never inferred
 * from free text: an unmapped type must fail grammar validation. The grammar
 * validator and the renderer both call this, so they can never disagree.
 */
export function synthesisEdgeStructuralClass(
  relationshipType: string,
): SynthesisEdgeStructuralClass | null {
  const type = relationshipType.trim();
  if (PRIMARY_SYNTHESIS_RELATIONSHIP_SET.has(type)) return "primary";
  if (SECONDARY_SYNTHESIS_RELATIONSHIP_SET.has(type)) return "secondary";
  return null;
}

/**
 * Coarse semantic layer of a stage within the PRIMARY design hierarchy. The
 * grammar only constrains transitions between these layers; the finer stage
 * ontology (meta- vs design-requirement) is preserved as node metadata.
 * `null` means the stage is not part of the primary hierarchy.
 */
export type SynthesisPrimaryLayer =
  | "problem"
  | "requirement"
  | "principle"
  | "feature"
  | "artifact"
  | "evaluation"
  | "outcome";

/**
 * Ordered primary hierarchy (fixed semantic ontology). A primary edge is legal
 * only between adjacent roles in this sequence, regardless of which layers a
 * particular graph populates.
 */
export const SYNTHESIS_PRIMARY_LAYER_SEQUENCE = [
  "problem",
  "requirement",
  "principle",
  "feature",
  "artifact",
  "evaluation",
  "outcome",
] as const satisfies readonly SynthesisPrimaryLayer[];

export function synthesisPrimaryLayer(
  stage: DiagramStage,
): SynthesisPrimaryLayer | null {
  switch (stage) {
    case "problem":
    case "design-goal":
    case "design-objective":
      return "problem";
    case "meta-requirement":
    case "design-requirement":
    case "requirements":
      return "requirement";
    case "design-principle":
    case "principles":
      return "principle";
    case "design-feature":
    case "features":
      return "feature";
    case "artifact":
      return "artifact";
    case "evaluation":
      return "evaluation";
    case "outcome":
      return "outcome";
    default:
      return null;
  }
}

/**
 * The active conversational scope. `corpus` is the whole library (the default);
 * `papers` restricts every answer, citation, source card, and stored map to an
 * ordered set of 1–5 canonical paper IDs. A stable slug is the trusted identity;
 * a paper title is only display/search metadata and is never
 * accepted from the client as identity.
 */
export type NativeOkfChatScope =
  | { type: "corpus" }
  | { type: "papers"; paperIds: string[] };

export type NativeOkfChatScopeInput = NativeOkfChatScope | { type: "paper"; paperId: string };
export const MAX_NATIVE_OKF_SELECTED_PAPERS = 5;

/** One parser for current requests, legacy sessions and server responses. */
export function normalizeNativeOkfChatScope(value: unknown): NativeOkfChatScope | null {
  if (value === undefined) return { type: "corpus" };
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (input.type === "corpus") {
    return Object.keys(input).length === 1 ? { type: "corpus" } : null;
  }
  const legacy = input.type === "paper";
  if (!legacy && input.type !== "papers") return null;
  if (Object.keys(input).some((key) => key !== "type" && key !== (legacy ? "paperId" : "paperIds"))) return null;
  const ids = legacy ? [input.paperId] : input.paperIds;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string" || !/^[a-z0-9][a-z0-9-]{0,255}$/u.test(id))) return null;
  const paperIds = [...new Set(ids as string[])];
  if (paperIds.length > MAX_NATIVE_OKF_SELECTED_PAPERS) return null;
  return paperIds.length ? { type: "papers", paperIds } : { type: "corpus" };
}

export function nativeOkfChatScopePaperIds(scope: NativeOkfChatScope): string[] {
  return scope.type === "papers" ? scope.paperIds : [];
}

export const NATIVE_OKF_CORPUS_SCOPE: NativeOkfChatScope = { type: "corpus" };

export function nativeOkfChatScopePaperId(
  scope: NativeOkfChatScope | null | undefined,
): string | null {
  return scope?.type === "papers" && scope.paperIds.length === 1 ? scope.paperIds[0]! : null;
}

export interface NativeOkfChatRequest {
  question: string;
  history?: NativeOkfChatHistoryMessage[];
  /**
   * The scope the composer is in when this turn is submitted. Authoritative for
   * the turn; the server still resolves and validates every paper ID against the
   * canonical repository. Omitted by older clients, which are treated as corpus.
   */
  scope?: NativeOkfChatScopeInput;
  /**
   * `auto` lets the server resolve conversational diagram intent. `suppressed`
   * is reserved for an explicit user opt-out; it must not be inferred from an
   * unchecked auto-suggestion.
   */
  diagramPreference?: NativeOkfDiagramPreference;
  /** Number of browser-visible messages before this request was submitted. */
  visibleHistoryMessageCount?: number;
  /** @deprecated Compatibility for older clients; prefer diagramPreference. */
  includeDiagram?: boolean;
  conversationState?: NativeOkfConversationStateInput;
}

export const NATIVE_OKF_DIAGRAM_PREFERENCES = [
  "auto",
  "requested",
  "suppressed",
] as const;

export type NativeOkfDiagramPreference =
  (typeof NATIVE_OKF_DIAGRAM_PREFERENCES)[number];

export const NATIVE_OKF_CONVERSATION_STATE_VERSION = 1 as const;
export const MAX_NATIVE_OKF_ACTIVE_PAPERS = MAX_NATIVE_OKF_SELECTED_PAPERS;
export const MAX_NATIVE_OKF_ACTIVE_STRUCTURED_RESULT_PAPERS = 64;
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
  "comparative-diagram",
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
  // A recoverable DESIGN_SYNTHESIS validation failure that becomes a grounded
  // follow-up question instead of a terminal synthesis error.
  "synthesis-constraint",
] as const;

/**
 * Conservative conversation-level bound on how many times a single design
 * problem may be turned into a synthesis-constraint follow-up before the system
 * fails honestly. One initial attempt plus this many clarification cycles.
 */
export const MAX_NATIVE_OKF_SYNTHESIS_CLARIFICATION_ROUNDS = 2;

export type NativeOkfClarificationKind =
  (typeof NATIVE_OKF_CLARIFICATION_KINDS)[number];

export interface NativeOkfPendingClarification {
  kind: NativeOkfClarificationKind;
  originalQuestion: string;
}

export interface NativeOkfConversationState {
  version: typeof NATIVE_OKF_CONVERSATION_STATE_VERSION;
  /**
   * The persisted conversational scope. Defaults to corpus. A `papers` scope
   * survives follow-up turns until the researcher switches paper or returns to
   * All papers; New Chat resets it to corpus.
   */
  scope: NativeOkfChatScope;
  activePaperSlugs: string[];
  /** Explicitly compared papers; supporting retrieval never expands this set. */
  activeComparisonPaperSlugs?: string[];
  /** Exhaustive paper identities returned by the latest structured set query. */
  activeStructuredResultPaperSlugs?: string[];
  activeConceptIds: string[];
  activeSourceIds: string[];
  lastIntent: NativeOkfConversationIntent;
  lastDiagramRequested: boolean;
  pendingClarification: NativeOkfPendingClarification | null;
  /**
   * How many synthesis-constraint follow-ups the current design problem has
   * already produced. Reset to 0 whenever a non-clarification turn completes.
   */
  synthesisClarificationRounds?: number;
  lastSynthesisProblem?: SynthesisProblemState | null;
  latestValidatedSynthesisDraft?: SynthesisDraftState | null;
  /**
   * Accepted only as a session-contract migration placeholder. New responses
   * never place a draft here; validated drafts live in the field above.
   */
  synthesisDraft: SynthesisDraftState | null;
}

/**
 * Compact browser-to-server form. Omitted draft fields are deterministically
 * reconstructed by the shared parser and do not carry layout or UI state.
 */
export interface CompactNativeOkfSynthesisDraftNode extends Omit<
  GeneratedDiagramNode,
  "group" | "sourcePaths" | "synthesisRationale" | "synthesis"
> {
  group?: string | null;
  synthesisRationale?: string | null;
}

export interface CompactNativeOkfSynthesisDraftState extends Omit<
  SynthesisDraftState,
  "nodes"
> {
  nodes: CompactNativeOkfSynthesisDraftNode[];
}

export interface NativeOkfConversationStateInput extends Omit<
  NativeOkfConversationState,
  | "scope"
  | "activeSourceIds"
  | "lastSynthesisProblem"
  | "latestValidatedSynthesisDraft"
  | "synthesisDraft"
> {
  scope?: NativeOkfChatScopeInput;
  activeSourceIds?: string[];
  lastSynthesisProblem?: SynthesisProblemState | null;
  latestValidatedSynthesisDraft?:
    | SynthesisDraftState
    | CompactNativeOkfSynthesisDraftState
    | null;
  synthesisDraft?: SynthesisDraftState | null;
}

export interface NativeOkfClarification {
  question: string;
  kind: NativeOkfClarificationKind;
}

export function createInitialNativeOkfConversationState(): NativeOkfConversationState {
  return {
    version: NATIVE_OKF_CONVERSATION_STATE_VERSION,
    scope: { type: "corpus" },
    activePaperSlugs: [],
    activeComparisonPaperSlugs: [],
    activeStructuredResultPaperSlugs: [],
    activeConceptIds: [],
    activeSourceIds: [],
    lastIntent: "answer",
    lastDiagramRequested: false,
    pendingClarification: null,
    synthesisClarificationRounds: 0,
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
  "evaluation",
  "outcome",
  "other",
] as const;

export type DiagramStage = (typeof GENERATED_DIAGRAM_STAGES)[number];

/**
 * Closed ontology for problem-specific proposals. The broader renderer list
 * remains available for exact stored producer types, but models and refinement
 * patches may only choose an established DSR stage from this set.
 */
export const SYNTHESIS_DIAGRAM_STAGES = [
  "problem",
  "design-goal",
  "design-objective",
  "meta-requirement",
  "design-requirement",
  "design-principle",
  "design-feature",
  "artifact",
  "evaluation",
  "outcome",
] as const satisfies readonly DiagramStage[];

export type SynthesisDiagramStage =
  (typeof SYNTHESIS_DIAGRAM_STAGES)[number];

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
  /** Deterministic researcher-facing form; never used as retrieval evidence. */
  displayProblem?: string;
  domain: string | null;
  objective: string | null;
  outputType: "design-solution" | "explanatory-theory" | null;
  constraints: string[];
  sourcePaperSlugs: string[];
}

export type NativeOkfDiagramMode = "stored" | "comparative" | "synthesized";
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
  /**
   * The scope in effect after this turn. Mirrors `conversationState.scope`; the
   * client uses it to keep the visible scope chip in sync, including when the
   * server transitions a paper-scoped turn back to corpus for an explicit
   * broaden request.
   */
  scope?: NativeOkfChatScope;
  insufficientContext: boolean;
  warnings?: string[];
  retrievalDebug?: unknown;
}
