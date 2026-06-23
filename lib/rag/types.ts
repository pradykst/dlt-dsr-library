export type RagChatRole = "system" | "user" | "assistant";

export type RagChatMessage = {
  role: RagChatRole;
  content: string;
};

export type RagFilters = {
  paper_id?: string;
  element_type?: string;
  chunk_type?: string;
};

export type RagRetrievalIntent =
  | "element_lookup"
  | "paper_lookup"
  | "relation_traversal"
  | "evaluation_summary"
  | "cross_paper_comparison"
  | "design_feature_lookup"
  | "requirement_lookup"
  | "generic_semantic_search";

export type RagQueryType =
  | "corpus_count"
  | "paper_lookup"
  | "concept_usage"
  | "element_type_lookup"
  | "concept_design_feature_lookup"
  | "design_principle_lookup"
  | "relation_path_explanation"
  | "relation_flow"
  | "paper_summary"
  | "comparison"
  | "evidence_search"
  | "evidence_check"
  | "gap_analysis"
  | "decision_support"
  | "general_synthesis";

export type RagQueryPlan = {
  queryType: RagQueryType;
  intents: RagRetrievalIntent[];
  searchTerms: string[];
  requestedElementType?: string;
  paperIdOrTitle?: string;
  relationType?: string;
  relationDirection?: "from" | "to" | "any";
  explicitLabelsOnly: boolean;
};

export type RagChunk = {
  id: string;
  source_type: string | null;
  paper_id: string | null;
  paper_title: string | null;
  chunk_type: string | null;
  element_id: string | null;
  element_type: string | null;
  element_label: string | null;
  relation_type: string | null;
  from_element_id: string | null;
  to_element_id: string | null;
  evidence_quote: string | null;
  page_number: number | null;
  content: string;
  metadata: Record<string, unknown> | null;
  similarity?: number | null;
  distance?: number | null;
  retrievalKind?: "explicit" | "direct_relation" | "evidence" | "related" | "semantic";
  retrievalScore?: number;
  matchReason?: string;
};

export type RagMatchClassification =
  | "formal_label_match"
  | "strong_mechanism_match"
  | "partial_or_related_match"
  | "background_only"
  | "insufficient_evidence";

export type RagEvidencePlanItem = {
  sourceIndex: number;
  sourceId: string;
  chunkId: string;
  paperId: string | null;
  paperTitle: string;
  elementType: string | null;
  elementLabel: string | null;
  relationType: string | null;
  fromElementId: string | null;
  toElementId: string | null;
  evidenceText: string;
  snippet: string;
  matchReason: string;
  matchStrength: number;
  classification: RagMatchClassification;
  chunkType: string | null;
  retrievalKind?: RagChunk["retrievalKind"];
  pageNumber: number | null;
};

export type RagAnswerSection = {
  title: string;
  items: string[];
};

export type RagChatDebug = {
  queryType: RagQueryType | "greeting";
  provider: string;
  model: string;
  retrievalCount: number;
  latencyMs: number;
  answerStatus: "ok" | "no_evidence" | "llm_error" | "retrieval_error" | "greeting" | "fallback";
  warnings?: string[];
};

export type RagSource = {
  sourceIndex: number;
  sourceId: string;
  paperId: string | null;
  paperTitle: string;
  chunkType: string | null;
  elementId: string | null;
  elementType: string | null;
  elementLabel: string | null;
  relationType: string | null;
  fromElementId: string | null;
  toElementId: string | null;
  evidenceQuote: string | null;
  pageNumber: number | null;
  retrievalKind?: RagChunk["retrievalKind"];
  matchClassification?: RagMatchClassification;
  matchReason?: string;
  matchStrength?: number;
  snippet?: string;
};

export type RagChatResponse = {
  answerText: string;
  sections: RagAnswerSection[];
  sources: RagSource[];
  debug: RagChatDebug;
  retrieved?: RagChunk[];
  queryPlan?: RagQueryPlan;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
};
