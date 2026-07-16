import type { WorkbenchDsrMatrix } from "../okf/workbench-matrix.ts";
import type { OkfGraphSourceReference, OkfPresentation, OkfSourceView, OkfSourceViewReference } from "../okf/schema.ts";
import type { CanonicalFlowProjectionMode, CanonicalFlowProjectionSource } from "../okf/flow-projection.ts";

export type WorkbenchExtractionStatus = "indexed_from_canonical_okf" | "okf_draft";
export type WorkbenchReviewStatus = "unreviewed" | "internally_reviewed" | "author_verified";
export type WorkbenchAuthorCheckStatus = "not_requested" | "requested" | "verified" | "disputed";

export type WorkbenchPaperCounts = {
  requirements: number;
  principles: number;
  features: number;
  concepts: number;
  evidence: number;
  relations: number;
};

export type Paper = {
  paper_id: string;
  slug?: string;
  canonical_source?: "okf";
  schema_version?: string;
  title: string;
  short_title: string | null;
  full_citation: string | null;
  year: number | null;
  authors: string | null;
  authors_list?: string[];
  venue?: string | null;
  doi?: string | null;
  doi_url?: string | null;
  source_url?: string | null;
  doi_or_url: string | null;
  source_document?: string | null;
  domain: string | null;
  abstract?: string | null;
  research_problem?: string | null;
  research_objective?: string | null;
  artifact_type: string | null;
  blockchain_dlt_role: string | null;
  methodology?: string | null;
  evaluation_method?: string | null;
  key_contributions?: string[];
  design_knowledge_output?: string | null;
  limitations?: string[];
  problem_description: string | null;
  input_knowledge: string | null;
  research_process: string | null;
  key_concepts: string | null;
  solution_description: string | null;
  output_knowledge: string | null;
  evaluation_summary: string | null;
  boundary_conditions: string | null;
  overall_extraction_status: string | null;
  overall_confidence: number | null;
  coder: string | null;
  date_coded: string | null;
  reviewer: string | null;
  extraction_status?: WorkbenchExtractionStatus;
  review_status: WorkbenchReviewStatus | null;
  author_check_status?: WorkbenchAuthorCheckStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  last_indexed_at?: string | null;
  notes: string | null;
  presentation?: OkfPresentation;
  created_at?: string;
  updated_at?: string;
  concept_counts?: Partial<Record<WorkbenchDsrGroupKey, number>>;
  counts?: WorkbenchPaperCounts;
  canonical_paths?: {
    index: string;
    presentation: string;
    dsr: string;
    evidence: string;
    relations: string;
    aliases: string;
    graph: string;
  };
};

export type WorkbenchElement = {
  id?: string;
  paper_id: string;
  element_id: string;
  element_type: string | null;
  element_name: string | null;
  element_text: string | null;
  normalized_text: string | null;
  source_status: string | null;
  source_quote_id: string | null;
  page_or_section: string | null;
  linked_problem_id: string | null;
  linked_requirement_id: string | null;
  linked_principle_id: string | null;
  kernel_theory_or_rationale: string | null;
  evaluation_support: string | null;
  confidence: number | null;
  coder: string | null;
  review_status: WorkbenchReviewStatus | null;
  notes: string | null;
  short_label: string | null;
  display_order: number | null;
  main_diagram_include: boolean | null;
  extended_diagram_include: boolean | null;
  created_at?: string;
  updated_at?: string;
  canonical_type?: WorkbenchDsrGroupKey;
  confidence_label?: string;
  evidence_count?: number;
  evidence_ids?: string[];
  okf_path?: string;
  canonical_field?: "description" | "body_text";
};

export type WorkbenchRelation = {
  id?: string;
  paper_id: string;
  relation_id: string;
  source_node_id: string;
  source_node_type: string | null;
  relation_type: string | null;
  target_node_id: string;
  target_node_type: string | null;
  evidence_id: string | null;
  source_status: string | null;
  confidence: number | null;
  diagram_include: boolean | null;
  diagram_view: string | null;
  review_status: WorkbenchReviewStatus | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  provenance?: "graph_json" | "okf_relation" | "inferred" | "source_view";
  extraction_type?: "explicit" | "explicit-in-artifact" | "inferred";
  source_view_ids?: string[];
  okf_path?: string;
};

export type WorkbenchEvidence = {
  id?: string;
  paper_id: string;
  evidence_id: string;
  evidence_type: string | null;
  exact_quote_or_description: string | null;
  page: string | null;
  section: string | null;
  element_ids_supported: string | null;
  relation_ids_supported: string | null;
  citation_note: string | null;
  source_status: string | null;
  evidence_strength: number | null;
  coder: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  concept_id?: string | null;
  confidence_label?: string;
  okf_path?: string;
  canonical_field?: "quote_or_summary";
};

export type WorkbenchDsrGroupKey =
  | "Problem"
  | "Design Requirement"
  | "Design Principle"
  | "Design Feature"
  | "Artifact"
  | "Evaluation"
  | "Output Knowledge";

export type WorkbenchDsrGroup = {
  key: WorkbenchDsrGroupKey;
  label: string;
  concepts: WorkbenchElement[];
};

export type WorkbenchFlowView = {
  mode: CanonicalFlowProjectionMode;
  title: string;
  subtitle: string;
  projection_source: CanonicalFlowProjectionSource;
  source_view_id: string | null;
  source_reference: OkfSourceViewReference | OkfGraphSourceReference | null;
  nodes: WorkbenchElement[];
  relations: WorkbenchRelation[];
  layers: WorkbenchDsrGroupKey[];
  ordered_node_ids: string[];
  evidence_ids: string[];
  validation: {
    structurally_valid: boolean;
    semantic_status: "unreviewed" | "internally_validated" | "author_verified" | "not_applicable";
    visual_parity: "automatic_approximation" | "manually_validated" | "not_applicable";
  };
  warnings: string[];
  layout_hints: {
    direction: OkfSourceView["layout"]["direction"];
    preserve_source_order: boolean;
  };
};

export type WorkbenchFlowGraph = {
  stored_flow_source: "graph_json" | "okf_relations_fallback";
  source_reference?: OkfGraphSourceReference | null;
  source_views: WorkbenchFlowView[];
  recommended: WorkbenchFlowView;
  /** Compatibility projection for the existing matrix/flow validator. Not a visible Workbench mode. */
  focused: {
    nodes: WorkbenchElement[];
    relations: WorkbenchRelation[];
  };
  full: WorkbenchFlowView;
  layer_counts: Partial<Record<WorkbenchDsrGroupKey, number>>;
  warnings: string[];
};

export type WorkbenchChangeTargetType = "paper" | "presentation" | "concept" | "relation" | "evidence" | "graph";
export type WorkbenchChangeStatus = "open" | "accepted_for_git_change" | "rejected" | "resolved_after_reindex";

export type ChangeRequest = {
  id?: string;
  paper_id: string;
  target_type: WorkbenchChangeTargetType;
  target_id: string;
  field: string;
  current_value: string | null;
  proposed_value: string;
  reason: string | null;
  evidence_note?: string | null;
  submitted_by_name: string | null;
  submitted_by_email?: string | null;
  submitted_by_role: string | null;
  status: WorkbenchChangeStatus;
  admin_decision_note?: string | null;
  decided_by?: string | null;
  decided_at?: string | null;
  created_at?: string;
  updated_at?: string;
  target_okf_path?: string | null;
  canonical_workflow?: "git_change_required";
  target_table?: "papers" | "elements" | "relations" | "evidence";
  target_row_key?: string;
  target_field?: string;
  old_value?: string | null;
};

export type PaperBundle = {
  ok?: true;
  paper: Paper;
  presentation?: OkfPresentation;
  elements: WorkbenchElement[];
  relations: WorkbenchRelation[];
  evidence: WorkbenchEvidence[];
  dsrGrid?: WorkbenchDsrGroup[];
  dsrMatrix?: WorkbenchDsrMatrix;
  flowGraph?: WorkbenchFlowGraph;
  changeRequestsCount?: number;
  runtime?: {
    db_loaded_from: "supabase" | "local_okf_fallback";
    key_type: "service_role" | "anon" | "unavailable";
  };
  canonical_change_notice?: string;
};

export type ImportPayload = {
  adminSecret: string;
  papersRows: Record<string, string>[];
  elementsRows: Record<string, string>[];
  relationsRows: Record<string, string>[];
  evidenceRows: Record<string, string>[];
};

export type ImportSummary = {
  paper_id: string;
  rows_papers: number;
  rows_elements: number;
  rows_relations: number;
  rows_evidence: number;
  warnings: string[];
};
