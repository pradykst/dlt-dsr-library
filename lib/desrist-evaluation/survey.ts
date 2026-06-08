export type SurveyOption = {
  value: string;
  label: string;
  description?: string;
};

export type LikertKey =
  | "q_usefulness"
  | "q_ease_understanding"
  | "q_traceability"
  | "q_visual_clarity"
  | "q_reuse_intention";

export type DesristEvaluationPayload = {
  role: string;
  dsr_experience: string;
  dlt_experience: string;
  q_usefulness: number;
  q_ease_understanding: number;
  q_traceability: number;
  q_visual_clarity: number;
  q_reuse_intention: number;
  most_useful_part?: string;
  confusing_or_missing?: string;
  improvement_suggestion?: string;
  used_sections?: string[];
  q_comparison_value?: number | null;
  q_trust_credibility?: number | null;
  q_ecommerce_relevance?: number | null;
  q_completeness?: number | null;
  q_recommendation?: number | null;
  improvement_priorities?: string[];
  most_valuable_use_case?: string;
  page_path?: string;
};

export const roleOptions: SurveyOption[] = [
  { value: "professor_senior_researcher", label: "Professor or senior researcher" },
  { value: "phd_researcher", label: "PhD researcher" },
  { value: "master_student", label: "Master student" },
  { value: "practitioner", label: "Practitioner" },
  { value: "other", label: "Other" }
];

export const dsrExperienceOptions: SurveyOption[] = [
  { value: "none", label: "No prior DSR experience" },
  { value: "basic_familiarity", label: "Basic familiarity" },
  { value: "one_project", label: "One DSR project" },
  { value: "multiple_projects", label: "Multiple DSR projects" },
  { value: "teach_review_supervise", label: "Teach, review, or supervise DSR" }
];

export const dltExperienceOptions: SurveyOption[] = [
  { value: "none", label: "No prior DLT experience" },
  { value: "basic", label: "Basic" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "research_professional_expert", label: "Research or professional expert" }
];

export const usedSectionOptions: SurveyOption[] = [
  { value: "paper_library", label: "Paper library" },
  { value: "individual_paper_page", label: "Individual paper page" },
  { value: "requirement_principle_feature_flow", label: "Requirement, principle, feature flow" },
  { value: "evidence_snippets", label: "Evidence snippets" },
  { value: "graph_sankey_visualization", label: "Graph or Sankey visualization" },
  { value: "pattern_comparison", label: "Pattern comparison" },
  { value: "search_filtering", label: "Search or filtering" },
  { value: "ecommerce_instantiation_examples", label: "E-commerce instantiation examples" },
  { value: "short_demo_only", label: "Short demo only" }
];

export const likertItems: Array<{ key: LikertKey; label: string }> = [
  { key: "q_usefulness", label: "The library would help me identify reusable design knowledge for a DSR project." },
  { key: "q_ease_understanding", label: "The structure of papers, requirements, principles, features, artifacts, and evidence was easy to understand." },
  { key: "q_traceability", label: "The library made the connection between extracted design knowledge and source evidence transparent." },
  { key: "q_visual_clarity", label: "The flow visualization helped me understand how design knowledge moves from problem to artifact." },
  { key: "q_reuse_intention", label: "I would consider using this library when designing, reviewing, or teaching a DSR project." }
];

export const improvementPriorityOptions: SurveyOption[] = [
  { value: "better_search_filters", label: "Better search filters" },
  { value: "more_papers", label: "More papers" },
  { value: "more_ecommerce_examples", label: "More e-commerce examples" },
  { value: "better_dsr_explanations", label: "Better DSR explanations" },
  { value: "better_cross_paper_visualization", label: "Better cross-paper visualization" },
  { value: "better_evidence_highlighting", label: "Better evidence highlighting" },
  { value: "export_csv_pdf", label: "Export to CSV or PDF" },
  { value: "doi_based_paper_import", label: "DOI-based paper import" },
  { value: "ai_assisted_mapping", label: "AI-assisted mapping" },
  { value: "manual_reviewer_correction", label: "Manual reviewer correction" },
  { value: "short_tutorial", label: "Short tutorial" },
  { value: "paper_comparison_view", label: "Paper comparison view" },
  { value: "other", label: "Other" }
];

export const valuableUseCaseOptions: SurveyOption[] = [
  { value: "finding_prior_design_knowledge", label: "Finding prior design knowledge" },
  { value: "comparing_design_knowledge_across_papers", label: "Comparing design knowledge across papers" },
  { value: "building_new_dsr_artifact_faster", label: "Building a new DSR artifact faster" },
  { value: "teaching_dsr", label: "Teaching DSR" },
  { value: "reviewing_dsr_papers", label: "Reviewing DSR papers" },
  { value: "developing_dlt_ecommerce_prototypes", label: "Developing DLT e-commerce prototypes" },
  { value: "validating_extracted_design_knowledge", label: "Validating extracted design knowledge" },
  { value: "other", label: "Other" }
];

export const optionSets = {
  role: roleOptions,
  dsr_experience: dsrExperienceOptions,
  dlt_experience: dltExperienceOptions,
  used_sections: usedSectionOptions,
  improvement_priorities: improvementPriorityOptions,
  most_valuable_use_case: valuableUseCaseOptions
};

export function validateDesristEvaluationPayload(input: Partial<DesristEvaluationPayload>) {
  const errors: string[] = [];
  assertOneOf(input.role, roleOptions, "role", errors);
  assertOneOf(input.dsr_experience, dsrExperienceOptions, "dsr_experience", errors);
  assertOneOf(input.dlt_experience, dltExperienceOptions, "dlt_experience", errors);

  for (const item of likertItems) {
    const value = input[item.key];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
      errors.push(`${item.key} must be a number from 1 to 5.`);
    }
  }

  for (const field of ["most_useful_part", "confusing_or_missing", "improvement_suggestion"] as const) {
    const value = input[field];
    if (value && value.length > 1000) errors.push(`${field} must be 1000 characters or fewer.`);
  }

  return errors;
}

function assertOneOf(value: unknown, options: SurveyOption[], field: string, errors: string[]) {
  if (typeof value !== "string" || !options.some((option) => option.value === value)) {
    errors.push(`${field} is required.`);
  }
}
