import type { LlmProviderStatus } from "../llm/provider.ts";

export const OKF_SCHEMA_VERSION = "okf-dsr-v1" as const;
export const OKF_PRESENTATION_VERSION = "workbench-v1" as const;

export const okfGraphSourceReferenceTypes = ["paper_figure", "paper_table", "okf_relations_projection"] as const;
export const okfGraphValidationStatuses = ["unreviewed", "internally_validated", "author_verified"] as const;
export const okfSourceViewTypes = ["paper_figure", "paper_table"] as const;
export const okfSourceViewDirections = ["LEFT_TO_RIGHT", "RIGHT_TO_LEFT", "TOP_TO_BOTTOM", "BOTTOM_TO_TOP"] as const;
export const okfSourceViewVisualParityValues = ["automatic_approximation", "manually_validated"] as const;

export const okfConceptTypes = [
  "Problem",
  "Design Requirement",
  "Design Principle",
  "Design Feature",
  "Artifact",
  "Evaluation",
  "Output Knowledge"
] as const;

export const okfRelationPredicates = [
  "motivates",
  "requires",
  "addressed_by",
  "satisfies",
  "instantiates",
  "implements",
  "evaluated_by",
  "supported_by",
  "derived_from",
  "contrasts_with",
  "generalizes_to",
  "contributes_to",
  "instantiated_by",
  "supports"
] as const;

export const okfReviewStatuses = ["unreviewed", "internally_reviewed", "author_verified"] as const;
export const okfAuthorCheckStatuses = ["not_requested", "requested", "verified", "disputed"] as const;
export const okfExtractionStatuses = ["indexed_from_canonical_okf", "okf_draft"] as const;
export const okfExtractionTypes = ["explicit", "inferred", "explicit-in-artifact"] as const;
export const okfConfidenceLabels = ["high", "medium-high", "medium", "low"] as const;
export const okfEvidenceTypes = ["quote", "paraphrase", "summary"] as const;

export type OkfConceptType = (typeof okfConceptTypes)[number];
export type OkfRelationPredicate = (typeof okfRelationPredicates)[number];
export type OkfReviewStatus = (typeof okfReviewStatuses)[number];
export type OkfAuthorCheckStatus = (typeof okfAuthorCheckStatuses)[number];
export type OkfExtractionStatus = (typeof okfExtractionStatuses)[number];
export type OkfExtractionType = (typeof okfExtractionTypes)[number];
export type OkfEvidenceType = (typeof okfEvidenceTypes)[number];
export type OkfRelationScope = "paper_level" | "cross_paper" | "query_generated";
export type ConfidenceLabel = (typeof okfConfidenceLabels)[number];

export type OkfPresentation = {
  presentation_version: typeof OKF_PRESENTATION_VERSION;
  paper_id: string;
  card: {
    domain_label: string;
    artifact_summary: string | null;
    dlt_role: string | null;
  };
  overview: {
    abstract_summary: string | null;
    research_problem: string;
    research_objective: string | null;
    methodology: string | null;
    evaluation_method: string[];
    key_contributions: string[];
    design_knowledge_output: string[];
  };
  dsr_summary_grid: {
    problem: string;
    input_knowledge: string;
    research_process: string;
    key_concepts: string[];
    solution: string;
    output_knowledge: string;
  };
  additional_context: {
    summary: string;
    limitations: string[];
  };
  provenance: {
    migrated_from_legacy_csv: boolean;
    source_fields: Record<string, string>;
    migration_notes: string[];
  };
};

export type OkfGraphSourceReference = {
  type: (typeof okfGraphSourceReferenceTypes)[number];
  label: string | null;
  page: number | null;
  caption: string | null;
  validation_status: (typeof okfGraphValidationStatuses)[number];
  validation_notes: string | null;
};

export type OkfSourceViewReference = {
  type: (typeof okfSourceViewTypes)[number];
  label: string;
  page: number;
  caption: string;
  validation_status: (typeof okfGraphValidationStatuses)[number];
  validation_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  author_verification: {
    author_name: string;
    verification_record: string;
  } | null;
};

export type OkfSourceViewLayer = {
  concept_type: OkfConceptType;
  node_ids: string[];
};

export type OkfSourceView = {
  source_view_id: string;
  title: string;
  view_type: (typeof okfSourceViewTypes)[number];
  source_reference: OkfSourceViewReference;
  layers: OkfSourceViewLayer[];
  edge_ids: string[];
  ordering: {
    layer_order: OkfConceptType[];
    node_order: Partial<Record<OkfConceptType, string[]>>;
  };
  layout: {
    direction: (typeof okfSourceViewDirections)[number];
    preserve_source_order: boolean;
    semantic_parity: boolean;
    ordering_parity: boolean;
    visual_parity: (typeof okfSourceViewVisualParityValues)[number];
  };
};

export type OkfPaper = {
  schema_version: typeof OKF_SCHEMA_VERSION;
  paper_id: string;
  slug: string;
  title: string;
  short_title?: string | null;
  authors?: string[];
  year?: number;
  venue?: string | null;
  doi?: string | null;
  doi_url?: string | null;
  source_url?: string | null;
  source_pdf_path?: string;
  domain_context?: string | null;
  abstract?: string | null;
  research_problem: string[];
  research_objective: string[];
  research_questions: string[];
  artifact_type?: string | null;
  blockchain_dlt_role?: string | null;
  methodology?: string | null;
  theoretical_foundations: string[];
  evaluation_method: string[];
  key_contributions: string[];
  design_knowledge_output: string[];
  limitations: string[];
  notes?: string | null;
  extraction_status: OkfExtractionStatus;
  review_status: OkfReviewStatus;
  author_check_status: OkfAuthorCheckStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  last_indexed_at?: string | null;
  presentation?: OkfPresentation;
  graph_source_reference?: OkfGraphSourceReference;
  source_views?: OkfSourceView[];
  source_file: string;
  body_text?: string;
};

export type OkfConcept = {
  concept_id: string;
  paper_id: string;
  type: OkfConceptType;
  dsr_layer: string;
  title: string;
  description: string;
  body_text: string;
  evidence_ids: string[];
  tags: string[];
  confidence: ConfidenceLabel;
  extraction_type: OkfExtractionType;
  review_status: OkfReviewStatus;
  source_file: string;
  okf_path?: string;
  query_generated?: boolean;
};

export type OkfEvidenceItem = {
  evidence_id: string;
  paper_id: string;
  concept_id?: string;
  supports: string[];
  page_number?: number;
  section?: string;
  quote?: string;
  paraphrase: string;
  evidence_type: OkfEvidenceType;
  confidence: ConfidenceLabel;
  source_location?: string;
  source_file: string;
};

export type OkfRelation = {
  relation_id: string;
  source_concept_id: string;
  predicate: OkfRelationPredicate;
  target_concept_id: string;
  evidence_id?: string;
  confidence: ConfidenceLabel;
  extraction_type: OkfExtractionType;
  relation_scope: OkfRelationScope;
  source_file: string;
};
export type OkfValidationWarning = {
  file: string;
  message: string;
};

export type OkfKnowledgeBase = {
  papers: OkfPaper[];
  concepts: OkfConcept[];
  evidence_items: OkfEvidenceItem[];
  relations: OkfRelation[];
  warnings: OkfValidationWarning[];
};

export type FlowGraphLayer =
  | "Problem"
  | "Requirement"
  | "Principle"
  | "Feature"
  | "Artifact"
  | "Evaluation"
  | "OutputKnowledge";

export type FlowGraphMode = "stored_paper_flow" | "query_generated_flow" | "mixed_reuse_flow";
export type FlowGraphProvenance = "stored" | "query_generated" | "mixed";

export type FlowGraphNode = {
  id: string;
  label: string;
  layer: FlowGraphLayer;
  paper_id?: string;
  concept_id?: string;
  provenance: FlowGraphProvenance;
  confidence: ConfidenceLabel;
  evidence_ids: string[];
  short_description?: string;
};

export type FlowGraphEdge = {
  id: string;
  source: string;
  target: string;
  predicate: string;
  relation_id?: string;
  provenance: FlowGraphProvenance;
  stored_provenance?: "source_view_explicit" | "explicit" | "explicit_in_artifact" | "inferred";
  source_view_ids?: string[];
  confidence: ConfidenceLabel;
  evidence_ids: string[];
};

export type FlowGraph = {
  graph_id: string;
  title: string;
  mode: FlowGraphMode;
  layers: FlowGraphLayer[];
  stored_flow_source?: "graph_json" | "okf_relations_fallback";
  nodes: FlowGraphNode[];
  edges: FlowGraphEdge[];
  evidence_refs: OkfEvidenceRef[];
  warnings: string[];
};

export type OkfFlowNode = FlowGraphNode & {
  type: OkfConceptType | "Evidence";
  evidence_id?: string;
  query_generated?: boolean;
};

export type OkfFlowEdge = FlowGraphEdge;

export type OkfFlow = Omit<FlowGraph, "nodes" | "edges"> & {
  flow_id: string;
  nodes: OkfFlowNode[];
  edges: OkfFlowEdge[];
};

export type OkfChatIntent =
  | "LIBRARY_STATS_QUERY"
  | "LIBRARY_COVERAGE_QUERY"
  | "PAPER_DISCOVERY_QUERY"
  | "PAPER_ELEMENT_QUERY"
  | "DESIGN_REUSE_FLOW_QUERY"
  | "DESIGN_REUSE_QUERY"
  | "DSR_FLOW_QUERY"
  | "EVIDENCE_QUERY"
  | "COMPARISON_QUERY"
  | "IMPLEMENTATION_LIFECYCLE_QUERY"
  | "EVALUATION_PLANNING_QUERY"
  | "LIBRARY_OVERVIEW_QUERY"
  | "NEGATIVE_OR_EXISTENCE_QUERY"
  | "CLARIFICATION_QUERY";

export type OkfTaskType =
  | "library_stats"
  | "library_coverage"
  | "paper_discovery"
  | "paper_element"
  | "dsr_flow"
  | "design_reuse"
  | "design_reuse_flow"
  | "evidence"
  | "comparison"
  | "implementation_lifecycle"
  | "evaluation_planning"
  | "library_overview"
  | "existence"
  | "clarification";

export type OkfReuseFlowRow = {
  row_id: string;
  requirement_label: string;
  principle_label: string;
  feature_label: string;
  artifact_pattern: string;
  supporting_papers: string[];
  evidence_ids: string[];
  concept_ids: string[];
  adaptation_text: string;
  adaptation_status: "stored" | "query_generated" | "mixed";
  confidence: ConfidenceLabel;
};

export type OkfPaperSupport = {
  paper_id: string;
  title: string;
  reason: string;
  score: number;
};

export type OkfEvidenceRef = {
  evidence_id: string;
  paper_id: string;
  concept_id?: string;
  excerpt: string;
  section?: string;
  page_number?: number;
  confidence: ConfidenceLabel;
  relation_path?: string;
};

export type DesignMove = {
  id: string;
  title: string;
  what_to_build: string;
  reused_requirement: string;
  reused_principle: string;
  candidate_feature: string;
  artifact_pattern: string;
  supporting_paper_ids: string[];
  evidence_ids: string[];
  evidence_summaries: string[];
  adaptation_status: "stored" | "mixed" | "query_generated";
  adaptation_note: string;
  confidence: ConfidenceLabel;
};

export type OkfProviderName = "none" | "gemini" | "groq" | "mock" | "featherless" | "openai";
export type OkfSynthesisMode = "gemini" | "featherless" | "groq" | "mock" | "structured_okf_answer" | "fallback_rate_limited" | "fallback_provider_error" | "fallback_validation_error";

export type DecisionSupportAnswer = {
  synthesis_mode: OkfSynthesisMode;
  title: string;
  direct_answer: string;
  design_moves: DesignMove[];
  architecture_direction?: string;
  limitations: string[];
  source_papers: OkfPaperSupport[];
  evidence_refs: OkfEvidenceRef[];
  query_generated_notes: string[];
  debug?: Record<string, unknown>;
};

export type OkfAnswerPayload = DecisionSupportAnswer;


export type LlmSynthesisResult = {
  synthesis_mode: OkfSynthesisMode;
  answer_markdown: string;
  provider_metadata: {
    provider: OkfProviderName;
    model?: string;
    status?: number;
    error_type?: string;
    base_url?: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    prompt_chars?: number;
    completion_chars?: number;
    prompt_tokens_estimated?: boolean;
    completion_tokens_estimated?: boolean;
    estimated_cost_usd?: number;
    cache_hit?: boolean;
  };
  debug?: Record<string, unknown>;
};
export type OkfRuntimeMetadata = {
  provider_configured: boolean;
  provider_connected: boolean;
  synthesis_attempted: boolean;
  synthesis_mode: OkfSynthesisMode;
  provider?: OkfProviderName;
  fallback_reason?: string;
  provider_status_code?: number;
  provider_error_type?: string;
  provider_status?: LlmProviderStatus;
  db_loaded_from?: "supabase" | "local_okf_fallback";
  key_type?: "service_role" | "anon" | "unavailable";
  row_count?: number;
  warning?: string;
  db_error_code?: string;
  db_error_message?: string;
};

export function isOkfConceptType(value: string): value is OkfConceptType {
  return (okfConceptTypes as readonly string[]).includes(value);
}

export function isOkfRelationPredicate(value: string): value is OkfRelationPredicate {
  return (okfRelationPredicates as readonly string[]).includes(value);
}

export function normalizeConfidence(value: unknown): ConfidenceLabel {
  const normalized = String(value ?? "low").toLowerCase();
  if (normalized === "high" || normalized === "medium-high" || normalized === "medium" || normalized === "low") return normalized;
  if (normalized === "3") return "high";
  if (normalized === "2") return "medium";
  return "low";
}




