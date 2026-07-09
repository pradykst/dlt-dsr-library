export const okfConceptTypes = [
  "Paper",
  "Problem",
  "ResearchQuestion",
  "DesignRequirement",
  "DesignPrinciple",
  "DesignFeature",
  "Artifact",
  "Evaluation",
  "OutputKnowledge",
  "KernelTheory",
  "Limitation"
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

export type OkfConceptType = (typeof okfConceptTypes)[number];
export type OkfRelationPredicate = (typeof okfRelationPredicates)[number];
export type OkfReviewStatus = "draft" | "reviewed";
export type OkfExtractionType = "explicit" | "inferred" | "explicit-in-artifact";
export type OkfRelationScope = "paper_level" | "cross_paper" | "query_generated";
export type ConfidenceLabel = "high" | "medium-high" | "medium" | "low";

export type OkfPaper = {
  paper_id: string;
  title: string;
  authors?: string[];
  year?: number;
  source_pdf_path?: string;
  review_status: OkfReviewStatus;
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
  page_number?: number;
  section?: string;
  quote?: string;
  paraphrase: string;
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

export type OkfFlowNode = {
  id: string;
  label: string;
  type: OkfConceptType | "Evidence";
  concept_id?: string;
  evidence_id?: string;
  paper_id?: string;
  confidence: ConfidenceLabel;
  query_generated?: boolean;
};

export type OkfFlowEdge = {
  source: string;
  target: string;
  predicate: OkfRelationPredicate;
  relation_id?: string;
  confidence: ConfidenceLabel;
};

export type OkfFlow = {
  flow_id: string;
  title: string;
  nodes: OkfFlowNode[];
  edges: OkfFlowEdge[];
};

export type OkfChatIntent =
  | "LIBRARY_STATS_QUERY"
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
  reused_requirement?: string;
  reused_principle?: string;
  candidate_feature?: string;
  artifact_pattern?: string;
  supporting_paper_ids: string[];
  evidence_ids: string[];
  adaptation_status: "stored" | "mixed" | "query_generated";
  adaptation_note: string;
  confidence: ConfidenceLabel;
};

export type OkfProviderName = "none" | "featherless" | "groq" | "openai" | "mock";
export type OkfSynthesisMode = "featherless" | "groq" | "mock" | "structured_okf_answer" | "fallback_rate_limited" | "fallback_provider_error" | "fallback_validation_error";

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
  db_loaded_from?: "supabase" | "local_okf_fallback";
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




