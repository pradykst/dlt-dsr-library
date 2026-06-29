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
  | "PAPER_LIST_QUERY"
  | "PAPER_DETAIL_QUERY"
  | "DSR_ELEMENT_QUERY"
  | "DESIGN_RECOMMENDATION_QUERY"
  | "DSR_FLOW_QUERY"
  | "COMPARE_QUERY"
  | "EVIDENCE_QUERY"
  | "UNKNOWN_QUERY";

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

