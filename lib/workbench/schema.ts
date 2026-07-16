export const workbenchChangeTargetTypes = ["paper", "presentation", "concept", "relation", "evidence", "graph"] as const;
export const workbenchChangeStatuses = ["open", "accepted_for_git_change", "rejected", "resolved_after_reindex"] as const;

export const workbenchChangeFields = {
  paper: ["title", "short_title", "authors", "year", "venue", "doi", "doi_url", "source_url", "source_pdf_filename", "domain_context", "abstract", "research_problem", "research_objective", "artifact_type", "blockchain_dlt_role", "methodology", "evaluation_method", "key_contributions", "design_knowledge_output", "limitations", "notes", "extraction_status", "review_status", "author_check_status"],
  concept: ["id", "type", "title", "description", "evidence", "confidence", "extraction_type", "review_status"],
  presentation: [
    "card.domain_label",
    "card.artifact_summary",
    "card.dlt_role",
    "overview.abstract_summary",
    "overview.research_problem",
    "overview.research_objective",
    "overview.methodology",
    "overview.evaluation_method",
    "overview.key_contributions",
    "overview.design_knowledge_output",
    "dsr_summary_grid.problem",
    "dsr_summary_grid.input_knowledge",
    "dsr_summary_grid.research_process",
    "dsr_summary_grid.key_concepts",
    "dsr_summary_grid.solution",
    "dsr_summary_grid.output_knowledge",
    "additional_context.summary",
    "additional_context.limitations"
  ],
  relation: ["id", "source", "target", "predicate", "evidence", "confidence", "extraction_type"],
  evidence: ["id", "supports", "source_location", "quote_or_summary", "evidence_type"],
  graph: ["nodes", "edges", "recommended_paths", "source_reference"]
} as const;

export function isWorkbenchChangeTarget(type: string, field: string) {
  if (!(type in workbenchChangeFields)) return false;
  return (workbenchChangeFields[type as keyof typeof workbenchChangeFields] as readonly string[]).includes(field);
}
export const allowedSourceStatuses = ["AS", "PAR", "INF", "NR", "NA", "UNC"];
export const allowedRelationTypes = [
  "motivates",
  "derived_from",
  "justified_by",
  "addressed_by",
  "instantiated_by",
  "implemented_in",
  "evaluated_by",
  "supports",
  "depends_on",
  "conflicts_with",
  "generalizes_to"
];
export const allowedExtractionStatuses = [
  "Not Started",
  "In Progress",
  "Ready for Peer Review",
  "Under Review",
  "Resolved",
  "Imported to Library"
];

export const paperHeaders = [
  "Paper_ID",
  "Short_Title",
  "Full_Citation",
  "Year",
  "Authors",
  "DOI_or_URL",
  "Domain",
  "Artifact_Type",
  "Blockchain_DLT_Role",
  "Problem_Description",
  "Input_Knowledge",
  "Research_Process",
  "Key_Concepts",
  "Solution_Description",
  "Output_Knowledge",
  "Evaluation_Summary",
  "Boundary_Conditions",
  "Overall_Extraction_Status",
  "Overall_Confidence_1_3",
  "Coder",
  "Date_Coded",
  "Reviewer",
  "Review_Status",
  "Notes"
];

export const elementHeaders = [
  "Paper_ID",
  "Element_ID",
  "Element_Type",
  "Element_Name",
  "Element_Text_Author_or_Paraphrased",
  "Normalized_Text_For_Library",
  "Source_Status",
  "Source_Quote_ID",
  "Page_or_Section",
  "Linked_Problem_ID",
  "Linked_Requirement_ID",
  "Linked_Principle_ID",
  "Kernel_Theory_or_Rationale",
  "Evaluation_Support",
  "Confidence_1_3",
  "Coder",
  "Review_Status",
  "Notes"
];

export const relationHeaders = [
  "Paper_ID",
  "Relation_ID",
  "Source_Node_ID",
  "Source_Node_Type",
  "Relation_Type",
  "Target_Node_ID",
  "Target_Node_Type",
  "Evidence_ID",
  "Source_Status",
  "Confidence_1_3",
  "Diagram_Include",
  "Review_Status",
  "Notes"
];

export const evidenceHeaders = [
  "Paper_ID",
  "Evidence_ID",
  "Evidence_Type",
  "Exact_Quote_or_Description",
  "Page",
  "Section",
  "Element_IDs_Supported",
  "Relation_IDs_Supported",
  "Citation_Note",
  "Source_Status",
  "Evidence_Strength_1_3",
  "Coder",
  "Notes"
];

export const editableFields = {
  papers: [
    "title",
    "source_pdf_path",
    "short_title",
    "full_citation",
    "year",
    "authors",
    "doi_or_url",
    "domain",
    "artifact_type",
    "blockchain_dlt_role",
    "problem_description",
    "input_knowledge",
    "research_process",
    "key_concepts",
    "solution_description",
    "output_knowledge",
    "evaluation_summary",
    "boundary_conditions",
    "overall_extraction_status",
    "overall_confidence",
    "coder",
    "date_coded",
    "reviewer",
    "review_status",
    "notes"
  ],
  elements: [
    "title",
    "description",
    "body_text",
    "element_type",
    "element_name",
    "element_text",
    "normalized_text",
    "source_status",
    "source_quote_id",
    "page_or_section",
    "linked_problem_id",
    "linked_requirement_id",
    "linked_principle_id",
    "kernel_theory_or_rationale",
    "evaluation_support",
    "confidence",
    "review_status",
    "notes",
    "short_label"
  ],
  relations: [
    "source_concept_id",
    "predicate",
    "target_concept_id",
    "source_node_id",
    "source_node_type",
    "relation_type",
    "target_node_id",
    "target_node_type",
    "evidence_id",
    "source_status",
    "confidence",
    "diagram_include",
    "diagram_view",
    "review_status",
    "notes"
  ],
  evidence: [
    "quote",
    "paraphrase",
    "evidence_type",
    "exact_quote_or_description",
    "page",
    "section",
    "element_ids_supported",
    "relation_ids_supported",
    "citation_note",
    "source_status",
    "evidence_strength",
    "notes"
  ]
} as const;
