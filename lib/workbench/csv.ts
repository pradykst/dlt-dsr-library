import Papa from "papaparse";
import {
  allowedExtractionStatuses,
  allowedRelationTypes,
  allowedSourceStatuses,
  elementHeaders,
  evidenceHeaders,
  paperHeaders,
  relationHeaders
} from "@/lib/workbench/schema";
import type { Paper, WorkbenchElement, WorkbenchEvidence, WorkbenchRelation } from "@/lib/workbench/types";

export type CsvKind = "papers" | "elements" | "relations" | "evidence";

export type WorkbenchValidation = {
  errors: string[];
  warnings: string[];
  counts: Record<CsvKind, number>;
  paperId?: string;
};

const elementOrder = new Map([
  ["Problem", 0],
  ["Design Requirement", 1],
  ["Design Principle", 2],
  ["Design Feature", 3],
  ["Artifact", 4],
  ["Evaluation", 5],
  ["Output Claim", 6],
  ["Kernel Theory", 7],
  ["Boundary Condition", 8],
  ["Future Work", 9]
]);

const mainTypes = new Set([
  "Problem",
  "Design Requirement",
  "Design Principle",
  "Design Feature",
  "Artifact",
  "Evaluation",
  "Output Claim"
]);

const headersByKind: Record<CsvKind, string[]> = {
  papers: paperHeaders,
  elements: elementHeaders,
  relations: relationHeaders,
  evidence: evidenceHeaders
};

export function parseCsvText(text: string) {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim()
  });
  return {
    rows: parsed.data.filter((row) => Object.values(row).some(Boolean)),
    errors: parsed.errors.map((error) => `Row ${error.row ?? "unknown"}: ${error.message}`)
  };
}

export async function parseCsvFile(file: File) {
  return parseCsvText(await file.text());
}

export function missingHeaders(kind: CsvKind, rows: Record<string, string>[]) {
  const actual = new Set(Object.keys(rows[0] ?? {}));
  return headersByKind[kind].filter((header) => !actual.has(header));
}

export function validateWorkbenchRows(rows: {
  papers: Record<string, string>[];
  elements: Record<string, string>[];
  relations: Record<string, string>[];
  evidence: Record<string, string>[];
}): WorkbenchValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts = {
    papers: rows.papers.length,
    elements: rows.elements.length,
    relations: rows.relations.length,
    evidence: rows.evidence.length
  };

  for (const kind of Object.keys(headersByKind) as CsvKind[]) {
    const missing = missingHeaders(kind, rows[kind]);
    if (missing.length) errors.push(`${kind} CSV is missing required headers: ${missing.join(", ")}`);
  }

  if (rows.papers.length !== 1) errors.push("Papers CSV must contain exactly one paper row.");

  const paperIds = new Set<string>();
  for (const kind of Object.keys(rows) as CsvKind[]) {
    for (const row of rows[kind]) {
      if (row.Paper_ID) paperIds.add(row.Paper_ID);
    }
  }
  if (paperIds.size !== 1) errors.push("All uploaded CSVs must reference exactly one shared Paper_ID.");
  const paperId = [...paperIds][0];

  const duplicateElementIds = duplicates(rows.elements.map((row) => row.Element_ID).filter(Boolean));
  if (duplicateElementIds.length) errors.push(`Duplicate Element_ID values: ${duplicateElementIds.join(", ")}`);

  const duplicateRelationIds = duplicates(rows.relations.map((row) => row.Relation_ID).filter(Boolean));
  if (duplicateRelationIds.length) errors.push(`Duplicate Relation_ID values: ${duplicateRelationIds.join(", ")}`);

  const duplicateEvidenceIds = duplicates(rows.evidence.map((row) => row.Evidence_ID).filter(Boolean));
  if (duplicateEvidenceIds.length) errors.push(`Duplicate Evidence_ID values: ${duplicateEvidenceIds.join(", ")}`);

  const elementIds = new Set(rows.elements.map((row) => row.Element_ID).filter(Boolean));
  const evidenceIds = new Set(rows.evidence.map((row) => row.Evidence_ID).filter(Boolean));
  for (const relation of rows.relations) {
    if (relation.Source_Node_ID && !elementIds.has(relation.Source_Node_ID)) {
      errors.push(`Relation ${relation.Relation_ID} source node ${relation.Source_Node_ID} does not exist in elements.`);
    }
    if (relation.Target_Node_ID && !elementIds.has(relation.Target_Node_ID)) {
      errors.push(`Relation ${relation.Relation_ID} target node ${relation.Target_Node_ID} does not exist in elements.`);
    }
    if (relation.Evidence_ID && !evidenceIds.has(relation.Evidence_ID)) {
      warnings.push(`Relation ${relation.Relation_ID} references evidence ${relation.Evidence_ID}, which is not present in the evidence CSV.`);
    }
  }

  for (const kind of Object.keys(rows) as CsvKind[]) {
    for (const row of rows[kind]) {
      if (row.Source_Status && !allowedSourceStatuses.includes(row.Source_Status)) {
        warnings.push(`${kind} row ${row.Paper_ID ?? ""} has uncommon Source_Status "${row.Source_Status}".`);
      }
    }
  }

  for (const relation of rows.relations) {
    if (relation.Relation_Type && !allowedRelationTypes.includes(relation.Relation_Type)) {
      warnings.push(`Relation ${relation.Relation_ID} has uncommon Relation_Type "${relation.Relation_Type}".`);
    }
  }

  const extractionStatus = rows.papers[0]?.Overall_Extraction_Status;
  if (extractionStatus && !allowedExtractionStatuses.includes(extractionStatus)) {
    warnings.push(`Paper extraction status "${extractionStatus}" is not in the configured status list.`);
  }

  return { errors, warnings, counts, paperId };
}

export function mapPaper(row: Record<string, string>): Paper {
  return {
    paper_id: required(row.Paper_ID),
    title: text(row.Full_Citation) ?? text(row.Short_Title) ?? required(row.Paper_ID),
    short_title: text(row.Short_Title),
    full_citation: text(row.Full_Citation),
    year: int(row.Year),
    authors: text(row.Authors),
    doi_or_url: text(row.DOI_or_URL),
    domain: text(row.Domain),
    artifact_type: text(row.Artifact_Type),
    blockchain_dlt_role: text(row.Blockchain_DLT_Role),
    problem_description: text(row.Problem_Description),
    input_knowledge: text(row.Input_Knowledge),
    research_process: text(row.Research_Process),
    key_concepts: text(row.Key_Concepts),
    solution_description: text(row.Solution_Description),
    output_knowledge: text(row.Output_Knowledge),
    evaluation_summary: text(row.Evaluation_Summary),
    boundary_conditions: text(row.Boundary_Conditions),
    overall_extraction_status: text(row.Overall_Extraction_Status),
    overall_confidence: int(row.Overall_Confidence_1_3),
    coder: text(row.Coder),
    date_coded: text(row.Date_Coded),
    reviewer: text(row.Reviewer),
    review_status: legacyReviewStatus(row.Review_Status),
    notes: text(row.Notes)
  };
}

export function mapElement(row: Record<string, string>, index: number): WorkbenchElement {
  const elementType = text(row.Element_Type);
  const labelSource = text(row.Element_Name) ?? text(row.Normalized_Text_For_Library);
  const order = (elementOrder.get(elementType ?? "") ?? 99) * 1000 + index;
  return {
    paper_id: required(row.Paper_ID),
    element_id: required(row.Element_ID),
    element_type: elementType,
    element_name: text(row.Element_Name),
    element_text: text(row.Element_Text_Author_or_Paraphrased),
    normalized_text: text(row.Normalized_Text_For_Library),
    source_status: text(row.Source_Status),
    source_quote_id: text(row.Source_Quote_ID),
    page_or_section: text(row.Page_or_Section),
    linked_problem_id: text(row.Linked_Problem_ID),
    linked_requirement_id: text(row.Linked_Requirement_ID),
    linked_principle_id: text(row.Linked_Principle_ID),
    kernel_theory_or_rationale: text(row.Kernel_Theory_or_Rationale),
    evaluation_support: text(row.Evaluation_Support),
    confidence: int(row.Confidence_1_3),
    coder: text(row.Coder),
    review_status: legacyReviewStatus(row.Review_Status),
    notes: text(row.Notes),
    short_label: labelSource ? labelSource.slice(0, 50) : row.Element_ID,
    display_order: order,
    main_diagram_include: mainTypes.has(elementType ?? ""),
    extended_diagram_include: true
  };
}

export function mapRelation(row: Record<string, string>): WorkbenchRelation {
  const diagramToken = text(row.Diagram_Include);
  const include = toBoolean(diagramToken);
  return {
    paper_id: required(row.Paper_ID),
    relation_id: required(row.Relation_ID),
    source_node_id: required(row.Source_Node_ID),
    source_node_type: text(row.Source_Node_Type),
    relation_type: text(row.Relation_Type),
    target_node_id: required(row.Target_Node_ID),
    target_node_type: text(row.Target_Node_Type),
    evidence_id: text(row.Evidence_ID),
    source_status: text(row.Source_Status),
    confidence: int(row.Confidence_1_3),
    diagram_include: include,
    diagram_view: diagramToken?.toLowerCase() === "extended" ? "Extended" : include ? "Main" : "Hidden",
    review_status: legacyReviewStatus(row.Review_Status),
    notes: text(row.Notes)
  };
}

export function mapEvidence(row: Record<string, string>): WorkbenchEvidence {
  return {
    paper_id: required(row.Paper_ID),
    evidence_id: required(row.Evidence_ID),
    evidence_type: text(row.Evidence_Type),
    exact_quote_or_description: text(row.Exact_Quote_or_Description),
    page: text(row.Page),
    section: text(row.Section),
    element_ids_supported: text(row.Element_IDs_Supported),
    relation_ids_supported: text(row.Relation_IDs_Supported),
    citation_note: text(row.Citation_Note),
    source_status: text(row.Source_Status),
    evidence_strength: int(row.Evidence_Strength_1_3),
    coder: text(row.Coder),
    notes: text(row.Notes)
  };
}

export function includesToken(value: string | null | undefined, token: string) {
  if (!value) return false;
  return value.split(/[;,|\s]+/).map((item) => item.trim()).filter(Boolean).includes(token);
}

function duplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicate = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicate.add(value);
    seen.add(value);
  }
  return [...duplicate];
}

function legacyReviewStatus(value: string | undefined | null) {
  void value;
  return "unreviewed" as const;
}

function text(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function int(value: string | undefined | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function required(value: string | undefined | null) {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error("Missing required CSV value.");
  return trimmed;
}

function toBoolean(value: string | null) {
  const normalized = value?.toLowerCase();
  if (normalized === "yes" || normalized === "true" || normalized === "main" || normalized === "extended") return true;
  if (normalized === "no" || normalized === "false" || normalized === "hidden") return false;
  return false;
}
