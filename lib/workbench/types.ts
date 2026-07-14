export type Paper = {
  paper_id: string;
  slug?: string;
  canonical_source?: "okf";
  short_title: string | null;
  full_citation: string | null;
  year: number | null;
  authors: string | null;
  doi_or_url: string | null;
  source_document?: string | null;
  domain: string | null;
  artifact_type: string | null;
  blockchain_dlt_role: string | null;
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
  review_status: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  concept_counts?: Partial<Record<WorkbenchDsrGroupKey, number>>;
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
  review_status: string | null;
  notes: string | null;
  short_label: string | null;
  display_order: number | null;
  main_diagram_include: boolean | null;
  extended_diagram_include: boolean | null;
  created_at?: string;
  updated_at?: string;
  canonical_type?: WorkbenchDsrGroupKey | "Research Question" | "Kernel Theory" | "Limitation";
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
  review_status: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  provenance?: "graph_json" | "okf_relation" | "inferred";
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
  canonical_field?: "quote" | "paraphrase";
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

export type WorkbenchFlowGraph = {
  stored_flow_source: "graph_json" | "okf_relations_fallback";
  recommended: {
    nodes: WorkbenchElement[];
    relations: WorkbenchRelation[];
  };
  focused: {
    nodes: WorkbenchElement[];
    relations: WorkbenchRelation[];
  };
  full: {
    nodes: WorkbenchElement[];
    relations: WorkbenchRelation[];
  };
  layer_counts: Partial<Record<WorkbenchDsrGroupKey, number>>;
  warnings: string[];
};

export type ChangeRequest = {
  id?: string;
  paper_id: string;
  target_table: "papers" | "elements" | "relations" | "evidence";
  target_row_key: string;
  target_field: string;
  old_value: string | null;
  proposed_value: string;
  reason: string | null;
  evidence_note: string | null;
  submitted_by_name: string | null;
  submitted_by_email?: string | null;
  submitted_by_role: string | null;
  status: "pending" | "accepted" | "rejected" | "needs_clarification";
  admin_decision_note?: string | null;
  decided_by?: string | null;
  decided_at?: string | null;
  created_at?: string;
  updated_at?: string;
  target_okf_path?: string | null;
  canonical_workflow?: "git_change_required";
};

export type PaperBundle = {
  ok?: true;
  paper: Paper;
  elements: WorkbenchElement[];
  relations: WorkbenchRelation[];
  evidence: WorkbenchEvidence[];
  dsrGrid?: WorkbenchDsrGroup[];
  flowGraph?: WorkbenchFlowGraph;
  changeRequestsCount: number;
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
