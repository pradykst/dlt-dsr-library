import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  OKF_PRESENTATION_VERSION,
  OKF_SCHEMA_VERSION,
  okfAuthorCheckStatuses,
  okfConceptTypes,
  okfConfidenceLabels,
  okfEvidenceTypes,
  okfExtractionStatuses,
  okfExtractionTypes,
  okfGraphSourceReferenceTypes,
  okfGraphValidationStatuses,
  okfRelationPredicates,
  okfReviewStatuses
} from "./schema.ts";
import { validateSourceViews } from "./source-view-validator.ts";
import { readOkfFrontmatter, readOkfYamlDocument } from "./parser.ts";

export const requiredOkfBundleFiles = ["README.md", "index.md", "presentation.yaml", "dsr.md", "evidence.md", "relations.yaml", "aliases.yaml", "graph.json"] as const;

const paperKeys = [
  "schema_version", "type", "paper_id", "slug", "title", "short_title", "authors", "year", "venue", "doi", "doi_url", "source_url",
  "source_pdf_filename", "domain_context", "abstract", "research_problem", "research_objective", "research_questions", "artifact_type",
  "blockchain_dlt_role", "methodology", "theoretical_foundations", "evaluation_method", "key_contributions", "design_knowledge_output",
  "limitations", "notes", "extraction_status", "review_status", "author_check_status", "reviewed_by", "reviewed_at"
] as const;
const collectionFrontmatterKeys = ["schema_version", "type", "paper_id", "extraction_status", "review_status"] as const;
const conceptKeys = ["id", "type", "title", "description", "evidence", "confidence", "extraction_type", "review_status"] as const;
const evidenceKeys = ["id", "supports", "source_location", "quote_or_summary", "evidence_type"] as const;
const relationDocumentKeys = ["schema_version", "paper_id", "relations"] as const;
const relationKeys = ["id", "source", "target", "predicate", "evidence", "confidence", "extraction_type"] as const;
const aliasDocumentKeys = ["schema_version", "paper_id", "aliases"] as const;
const aliasKeys = ["target_id", "terms"] as const;
const graphKeys = ["schema_version", "paper_id", "title", "nodes", "edges", "recommended_paths"] as const;
const graphNodeKeys = ["id", "type", "title"] as const;
const graphEdgeKeys = ["id", "source", "target", "predicate"] as const;
const graphSourceReferenceKeys = ["type", "label", "page", "caption", "validation_status", "validation_notes"] as const;
const presentationKeys = ["presentation_version", "paper_id", "card", "overview", "dsr_summary_grid", "additional_context", "provenance"] as const;
const presentationCardKeys = ["domain_label", "artifact_summary", "dlt_role"] as const;
const presentationOverviewKeys = ["abstract_summary", "research_problem", "research_objective", "methodology", "evaluation_method", "key_contributions", "design_knowledge_output"] as const;
const presentationGridKeys = ["problem", "input_knowledge", "research_process", "key_concepts", "solution", "output_knowledge"] as const;
const presentationContextKeys = ["summary", "limitations"] as const;
const presentationProvenanceKeys = ["migrated_from_legacy_csv", "source_fields", "migration_notes"] as const;
const presentationSourceFieldPaths = new Set([
  "card.domain_label", "card.artifact_summary", "card.dlt_role",
  "overview.abstract_summary", "overview.research_problem", "overview.research_objective", "overview.methodology",
  "overview.evaluation_method", "overview.key_contributions", "overview.design_knowledge_output",
  "dsr_summary_grid.problem", "dsr_summary_grid.input_knowledge", "dsr_summary_grid.research_process",
  "dsr_summary_grid.key_concepts", "dsr_summary_grid.solution", "dsr_summary_grid.output_knowledge",
  "additional_context.summary", "additional_context.limitations"
]);
const forbiddenLiteralPlaceholders = new Set(["not recorded", "n/a", "unknown", "todo", "-"]);

export type OkfSourceValidationIssue = { code: string; file: string; message: string };
export type OkfSourceValidationResult = {
  ok: boolean;
  errors: OkfSourceValidationIssue[];
  counts: { papers: number; concepts: number; evidence: number; relations: number; graph_nodes: number; graph_edges: number; recommended_paths: number };
};

export function validateOkfSource(rootDir = path.join(process.cwd(), "library", "okf")): OkfSourceValidationResult {
  const errors: OkfSourceValidationIssue[] = [];
  const counts = { papers: 0, concepts: 0, evidence: 0, relations: 0, graph_nodes: 0, graph_edges: 0, recommended_paths: 0 };
  const papersDir = path.join(rootDir, "papers");
  if (!fs.existsSync(papersDir)) {
    issue(errors, "PAPERS_DIRECTORY_MISSING", papersDir, "The OKF papers directory is missing.");
    return { ok: false, errors, counts };
  }

  const globalPaperIds = new Set<string>();
  const globalConceptIds = new Set<string>();
  const globalEvidenceIds = new Set<string>();
  const globalRelationIds = new Set<string>();

  for (const entry of fs.readdirSync(papersDir, { withFileTypes: true }).filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const bundleDir = path.join(papersDir, entry.name);
    const bundleEntries = fs.readdirSync(bundleDir, { withFileTypes: true });
    const actualFiles = bundleEntries.filter((item) => item.isFile()).map((item) => item.name).sort();
    for (const entry of bundleEntries) if (!entry.isFile()) issue(errors, "UNEXPECTED_BUNDLE_ENTRY", path.join(bundleDir, entry.name), `Unexpected non-file bundle entry ${entry.name}.`);
    for (const required of requiredOkfBundleFiles) if (!actualFiles.includes(required)) issue(errors, "REQUIRED_FILE_MISSING", bundleDir, `Missing required file ${required}.`);
    for (const actual of actualFiles) if (!(requiredOkfBundleFiles as readonly string[]).includes(actual)) issue(errors, "UNEXPECTED_BUNDLE_FILE", path.join(bundleDir, actual), `Unexpected bundle file ${actual}.`);
    if (requiredOkfBundleFiles.some((required) => !actualFiles.includes(required))) continue;

    const indexFile = path.join(bundleDir, "index.md");
    const paper = readOkfFrontmatter(indexFile);
    exactKeys(paper, paperKeys, indexFile, "PAPER_KEYS", errors);
    requireSchema(paper, indexFile, errors);
    if (paper.type !== "Paper") issue(errors, "PAPER_TYPE_INVALID", indexFile, "Paper frontmatter type must be Paper.");
    const paperId = stringValue(paper.paper_id);
    if (!paperId) issue(errors, "PAPER_ID_MISSING", indexFile, "paper_id is required.");
    else duplicate(globalPaperIds, paperId, "PAPER_ID_DUPLICATE", indexFile, errors);
    if (paper.slug !== entry.name) issue(errors, "PAPER_SLUG_MISMATCH", indexFile, `slug must match bundle directory ${entry.name}.`);
    validatePaperMetadata(paper, indexFile, errors);
    rejectLiteralPlaceholders(paper, indexFile, "index.md", errors);
    counts.papers += 1;

    const presentationFile = path.join(bundleDir, "presentation.yaml");
    const presentation = readYaml(presentationFile, errors, "PRESENTATION_YAML_INVALID");
    validatePresentation(presentation, paperId, presentationFile, errors);
    rejectLiteralPlaceholders(presentation, presentationFile, "presentation.yaml", errors);

    const dsrFile = path.join(bundleDir, "dsr.md");
    validateCollectionFrontmatter(readOkfFrontmatter(dsrFile), "ConceptCollection", paperId, paper, dsrFile, errors);
    const conceptRows = parseCanonicalCollectionRows(dsrFile, "Concept", errors);
    const conceptById = new Map<string, Record<string, unknown>>();
    for (const concept of conceptRows) {
      exactKeys(concept, conceptKeys, dsrFile, "CONCEPT_KEYS", errors);
      rejectLiteralPlaceholders(concept, dsrFile, "concept", errors);
      const id = stringValue(concept.id);
      validateScopedId(id, paperId, dsrFile, "CONCEPT_ID", errors);
      duplicate(globalConceptIds, id, "CONCEPT_ID_DUPLICATE", dsrFile, errors);
      if (!(okfConceptTypes as readonly unknown[]).includes(concept.type)) issue(errors, "CONCEPT_TYPE_NONCANONICAL", dsrFile, `Concept ${id} uses noncanonical type ${String(concept.type)}.`);
      if (!stringValue(concept.title) || !stringValue(concept.description)) issue(errors, "CONCEPT_TEXT_MISSING", dsrFile, `Concept ${id} requires title and description.`);
      if (!Array.isArray(concept.evidence) || concept.evidence.some((item) => !stringValue(item))) issue(errors, "CONCEPT_EVIDENCE_INVALID", dsrFile, `Concept ${id} evidence must be an array of nonempty evidence IDs.`);
      enumValue(concept.confidence, okfConfidenceLabels, "CONCEPT_CONFIDENCE_INVALID", dsrFile, errors);
      enumValue(concept.extraction_type, okfExtractionTypes, "CONCEPT_EXTRACTION_TYPE_INVALID", dsrFile, errors);
      validateConceptReviewStatus(concept, paper, dsrFile, `Concept ${id}`, errors);
      if (id) conceptById.set(id, concept);
    }
    counts.concepts += conceptRows.length;

    const evidenceFile = path.join(bundleDir, "evidence.md");
    validateCollectionFrontmatter(readOkfFrontmatter(evidenceFile), "EvidenceCollection", paperId, paper, evidenceFile, errors);
    const evidenceRows = parseCanonicalCollectionRows(evidenceFile, "Evidence", errors);
    const evidenceById = new Map<string, Record<string, unknown>>();
    for (const evidence of evidenceRows) {
      exactKeys(evidence, evidenceKeys, evidenceFile, "EVIDENCE_KEYS", errors);
      rejectLiteralPlaceholders(evidence, evidenceFile, "evidence", errors);
      const id = stringValue(evidence.id);
      validateScopedId(id, paperId, evidenceFile, "EVIDENCE_ID", errors);
      duplicate(globalEvidenceIds, id, "EVIDENCE_ID_DUPLICATE", evidenceFile, errors);
      if (!Array.isArray(evidence.supports) || evidence.supports.length === 0 || evidence.supports.some((item) => !stringValue(item))) issue(errors, "EVIDENCE_SUPPORTS_INVALID", evidenceFile, `Evidence ${id} must support at least one nonempty target ID.`);
      if (!stringValue(evidence.source_location)) issue(errors, "EVIDENCE_LOCATION_MISSING", evidenceFile, `Evidence ${id} requires source_location.`);
      if (!stringValue(evidence.quote_or_summary)) issue(errors, "EVIDENCE_TEXT_MISSING", evidenceFile, `Evidence ${id} requires quote_or_summary.`);
      enumValue(evidence.evidence_type, okfEvidenceTypes, "EVIDENCE_TYPE_INVALID", evidenceFile, errors);
      if (id) evidenceById.set(id, evidence);
    }
    counts.evidence += evidenceRows.length;

    for (const concept of conceptRows) {
      const id = stringValue(concept.id);
      for (const evidenceId of stringArray(concept.evidence)) if (!evidenceById.has(evidenceId)) issue(errors, "CONCEPT_EVIDENCE_UNKNOWN", dsrFile, `Concept ${id} references unknown evidence ${evidenceId}.`);
    }
    for (const evidence of evidenceRows) {
      const id = stringValue(evidence.id);
      for (const target of stringArray(evidence.supports)) if (target !== paperId && !conceptById.has(target)) issue(errors, "EVIDENCE_SUPPORT_UNKNOWN", evidenceFile, `Evidence ${id} supports unknown target ${target}.`);
    }

    const relationsFile = path.join(bundleDir, "relations.yaml");
    const relationDocument = readYaml(relationsFile, errors, "RELATIONS_YAML_INVALID");
    rejectLiteralPlaceholders(relationDocument, relationsFile, "relations.yaml", errors);
    exactKeys(relationDocument, relationDocumentKeys, relationsFile, "RELATION_DOCUMENT_KEYS", errors);
    requireSchema(relationDocument, relationsFile, errors);
    if (relationDocument.paper_id !== paperId) issue(errors, "RELATION_PAPER_MISMATCH", relationsFile, "relations.yaml paper_id does not match index.md.");
    const relationRows = Array.isArray(relationDocument.relations) ? relationDocument.relations.map(asRecord) : [];
    if (!Array.isArray(relationDocument.relations)) issue(errors, "RELATIONS_NOT_ARRAY", relationsFile, "relations must be an array.");
    const relationById = new Map<string, Record<string, unknown>>();
    for (const relation of relationRows) {
      exactKeys(relation, relationKeys, relationsFile, "RELATION_KEYS", errors);
      const id = stringValue(relation.id);
      validateScopedId(id, paperId, relationsFile, "RELATION_ID", errors);
      duplicate(globalRelationIds, id, "RELATION_ID_DUPLICATE", relationsFile, errors);
      const source = stringValue(relation.source);
      const target = stringValue(relation.target);
      if (!conceptById.has(source)) issue(errors, "RELATION_SOURCE_UNKNOWN", relationsFile, `Relation ${id} has unknown source ${source}.`);
      if (!conceptById.has(target)) issue(errors, "RELATION_TARGET_UNKNOWN", relationsFile, `Relation ${id} has unknown target ${target}.`);
      enumValue(relation.predicate, okfRelationPredicates, "RELATION_PREDICATE_INVALID", relationsFile, errors);
      enumValue(relation.confidence, okfConfidenceLabels, "RELATION_CONFIDENCE_INVALID", relationsFile, errors);
      enumValue(relation.extraction_type, okfExtractionTypes, "RELATION_EXTRACTION_TYPE_INVALID", relationsFile, errors);
      const evidenceId = relation.evidence == null ? "" : stringValue(relation.evidence);
      if (relation.evidence != null && !evidenceId) issue(errors, "RELATION_EVIDENCE_INVALID", relationsFile, `Relation ${id} evidence must be a scoped evidence ID or null.`);
      if (evidenceId && !evidenceById.has(evidenceId)) issue(errors, "RELATION_EVIDENCE_UNKNOWN", relationsFile, `Relation ${id} references unknown evidence ${evidenceId}.`);
      if (id) relationById.set(id, relation);
    }
    counts.relations += relationRows.length;

    const aliasesFile = path.join(bundleDir, "aliases.yaml");
    const aliasDocument = readYaml(aliasesFile, errors, "ALIASES_YAML_INVALID");
    rejectLiteralPlaceholders(aliasDocument, aliasesFile, "aliases.yaml", errors);
    exactKeys(aliasDocument, aliasDocumentKeys, aliasesFile, "ALIAS_DOCUMENT_KEYS", errors);
    requireSchema(aliasDocument, aliasesFile, errors);
    if (aliasDocument.paper_id !== paperId) issue(errors, "ALIAS_PAPER_MISMATCH", aliasesFile, "aliases.yaml paper_id does not match index.md.");
    const aliasRows = Array.isArray(aliasDocument.aliases) ? aliasDocument.aliases.map(asRecord) : [];
    if (!Array.isArray(aliasDocument.aliases)) issue(errors, "ALIASES_NOT_ARRAY", aliasesFile, "aliases must be an array.");
    for (const alias of aliasRows) {
      exactKeys(alias, aliasKeys, aliasesFile, "ALIAS_KEYS", errors);
      const target = stringValue(alias.target_id);
      if (target !== paperId && !conceptById.has(target)) issue(errors, "ALIAS_TARGET_UNKNOWN", aliasesFile, `Alias target ${target} is not a canonical concept or paper.`);
      if (!Array.isArray(alias.terms) || alias.terms.length === 0 || alias.terms.some((term) => !stringValue(term))) issue(errors, "ALIAS_TERMS_INVALID", aliasesFile, `Alias target ${target} requires nonempty string terms.`);
    }

    const graphFile = path.join(bundleDir, "graph.json");
    const graph = readJson(graphFile, errors, "GRAPH_JSON_INVALID");
    exactKeysAllowOptional(graph, graphKeys, ["source_reference", "source_views"], graphFile, "GRAPH_KEYS", errors);
    rejectLiteralPlaceholders(graph, graphFile, "graph.json", errors);
    requireSchema(graph, graphFile, errors);
    if (graph.paper_id !== paperId) issue(errors, "GRAPH_PAPER_MISMATCH", graphFile, "graph.json paper_id does not match index.md.");
    if (graph.source_reference != null) validateGraphSourceReference(asRecord(graph.source_reference), paper, graphFile, errors);
    const graphNodes = Array.isArray(graph.nodes) ? graph.nodes.map(asRecord) : [];
    const graphEdges = Array.isArray(graph.edges) ? graph.edges.map(asRecord) : [];
    if (!Array.isArray(graph.nodes)) issue(errors, "GRAPH_NODES_NOT_ARRAY", graphFile, "nodes must be an array.");
    if (!Array.isArray(graph.edges)) issue(errors, "GRAPH_EDGES_NOT_ARRAY", graphFile, "edges must be an array.");
    const graphNodeIds = new Set<string>();
    const graphEdgePairs = new Set<string>();
    const graphEdgeIds = new Set<string>();
    for (const node of graphNodes) {
      exactKeys(node, graphNodeKeys, graphFile, "GRAPH_NODE_KEYS", errors);
      const id = stringValue(node.id);
      if (graphNodeIds.has(id)) issue(errors, "GRAPH_NODE_DUPLICATE", graphFile, `Duplicate graph node ${id}.`);
      graphNodeIds.add(id);
      const concept = conceptById.get(id);
      if (!concept) issue(errors, "GRAPH_NODE_UNKNOWN", graphFile, `Graph node ${id} is not a canonical concept.`);
      else {
        if (node.type !== concept.type) issue(errors, "GRAPH_TYPE_MISMATCH", graphFile, `Graph node ${id} type differs from dsr.md.`);
        if (node.title !== concept.title) issue(errors, "GRAPH_TITLE_MISMATCH", graphFile, `Graph node ${id} title differs from dsr.md.`);
      }
    }
    for (const edge of graphEdges) {
      exactKeys(edge, graphEdgeKeys, graphFile, "GRAPH_EDGE_KEYS", errors);
      const id = stringValue(edge.id);
      const source = stringValue(edge.source);
      const target = stringValue(edge.target);
      if (graphEdgeIds.has(id)) issue(errors, "GRAPH_EDGE_DUPLICATE", graphFile, `Duplicate graph edge ${id}.`);
      graphEdgeIds.add(id);
      if (!graphNodeIds.has(source) || !graphNodeIds.has(target)) issue(errors, "GRAPH_EDGE_ENDPOINT_UNKNOWN", graphFile, `Graph edge ${id} has an undeclared endpoint.`);
      const relation = relationById.get(id);
      if (!relation) issue(errors, "GRAPH_EDGE_RELATION_MISSING", graphFile, `Graph edge ${id} has no canonical relation.`);
      else if (relation.source !== source || relation.target !== target || relation.predicate !== edge.predicate) issue(errors, "GRAPH_EDGE_RELATION_MISMATCH", graphFile, `Graph edge ${id} differs from its canonical relation.`);
      graphEdgePairs.add(`${source}\u0000${target}`);
    }
    const recommendedPaths = Array.isArray(graph.recommended_paths) ? graph.recommended_paths : [];
    if (!Array.isArray(graph.recommended_paths)) issue(errors, "RECOMMENDED_PATHS_NOT_ARRAY", graphFile, "recommended_paths must be an array.");
    for (const [pathIndex, candidate] of recommendedPaths.entries()) {
      if (!Array.isArray(candidate) || candidate.length < 2) {
        issue(errors, "RECOMMENDED_PATH_INVALID", graphFile, `Recommended path ${pathIndex + 1} must contain at least two node IDs.`);
        continue;
      }
      if (candidate.some((id) => !stringValue(id))) issue(errors, "RECOMMENDED_PATH_NODE_ID_INVALID", graphFile, `Recommended path ${pathIndex + 1} must contain nonempty string node IDs.`);
      const ids = candidate.map(String);
      for (const id of ids) if (!graphNodeIds.has(id)) issue(errors, "RECOMMENDED_PATH_NODE_UNKNOWN", graphFile, `Recommended path ${pathIndex + 1} references unknown node ${id}.`);
      for (let index = 1; index < ids.length; index += 1) if (!graphEdgePairs.has(`${ids[index - 1]}\u0000${ids[index]}`)) issue(errors, "RECOMMENDED_PATH_EDGE_MISSING", graphFile, `Recommended path ${pathIndex + 1} has no stored edge ${ids[index - 1]} -> ${ids[index]}.`);
    }
    const sourceViewValidation = validateSourceViews(graph.source_views, {
      paper_id: paperId,
      concepts: conceptRows,
      relations: relationRows
    });
    for (const sourceViewIssue of sourceViewValidation.issues) {
      issue(
        errors,
        sourceViewIssue.code,
        graphFile,
        `${sourceViewIssue.path}: ${sourceViewIssue.message}`
      );
    }
    counts.graph_nodes += graphNodes.length;
    counts.graph_edges += graphEdges.length;
    counts.recommended_paths += recommendedPaths.length;
  }

  return { ok: errors.length === 0, errors, counts };
}

/**
 * Validate the reusable template with exactly the same rules as a paper bundle.
 * The template lives outside papers/, so it is copied to an isolated temporary
 * library root rather than being exposed to the runtime parser or indexer.
 */
export function validateOkfTemplate(templateDir = path.join(process.cwd(), "library", "okf", "TEMPLATE")): OkfSourceValidationResult {
  const counts = { papers: 0, concepts: 0, evidence: 0, relations: 0, graph_nodes: 0, graph_edges: 0, recommended_paths: 0 };
  if (!fs.existsSync(templateDir)) {
    return {
      ok: false,
      errors: [{ code: "TEMPLATE_DIRECTORY_MISSING", file: templateDir, message: "The canonical OKF template directory is missing." }],
      counts
    };
  }

  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "okf-template-validation-"));
  const temporaryBundle = path.join(temporaryRoot, "papers", "template-paper");
  try {
    fs.mkdirSync(path.dirname(temporaryBundle), { recursive: true });
    fs.cpSync(templateDir, temporaryBundle, { recursive: true });
    const result = validateOkfSource(temporaryRoot);
    return {
      ...result,
      errors: result.errors.map((error) => ({
        ...error,
        file: error.file.startsWith(temporaryBundle)
          ? path.join(templateDir, path.relative(temporaryBundle, error.file))
          : error.file
      }))
    };
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function validatePresentation(document: Record<string, unknown>, paperId: string, file: string, errors: OkfSourceValidationIssue[]) {
  exactKeys(document, presentationKeys, file, "PRESENTATION_KEYS", errors);
  if (document.presentation_version !== OKF_PRESENTATION_VERSION) issue(errors, "PRESENTATION_VERSION_INVALID", file, `presentation_version must be ${OKF_PRESENTATION_VERSION}.`);
  if (document.paper_id !== paperId) issue(errors, "PRESENTATION_PAPER_MISMATCH", file, "presentation.yaml paper_id does not match index.md.");

  const card = asRecord(document.card);
  const overview = asRecord(document.overview);
  const grid = asRecord(document.dsr_summary_grid);
  const context = asRecord(document.additional_context);
  const provenance = asRecord(document.provenance);
  exactKeys(card, presentationCardKeys, file, "PRESENTATION_CARD_KEYS", errors);
  exactKeys(overview, presentationOverviewKeys, file, "PRESENTATION_OVERVIEW_KEYS", errors);
  exactKeys(grid, presentationGridKeys, file, "PRESENTATION_GRID_KEYS", errors);
  exactKeys(context, presentationContextKeys, file, "PRESENTATION_CONTEXT_KEYS", errors);
  exactKeys(provenance, presentationProvenanceKeys, file, "PRESENTATION_PROVENANCE_KEYS", errors);

  requireNonemptyString(card.domain_label, file, "PRESENTATION_DOMAIN_LABEL_INVALID", "card.domain_label", errors);
  validateNullableString(card.artifact_summary, file, "PRESENTATION_ARTIFACT_SUMMARY_INVALID", "card.artifact_summary", errors);
  validateNullableString(card.dlt_role, file, "PRESENTATION_DLT_ROLE_INVALID", "card.dlt_role", errors);
  validateNullableString(overview.abstract_summary, file, "PRESENTATION_ABSTRACT_INVALID", "overview.abstract_summary", errors);
  requireNonemptyString(overview.research_problem, file, "PRESENTATION_RESEARCH_PROBLEM_INVALID", "overview.research_problem", errors);
  validateNullableString(overview.research_objective, file, "PRESENTATION_RESEARCH_OBJECTIVE_INVALID", "overview.research_objective", errors);
  validateNullableString(overview.methodology, file, "PRESENTATION_METHODOLOGY_INVALID", "overview.methodology", errors);

  const publicationArrays = [
    ["overview.evaluation_method", overview.evaluation_method],
    ["overview.key_contributions", overview.key_contributions],
    ["overview.design_knowledge_output", overview.design_knowledge_output],
    ["additional_context.limitations", context.limitations]
  ] as const;
  for (const [field, value] of publicationArrays) validateStringArray(value, true, file, "PRESENTATION_ARRAY_INVALID", field, errors);

  requireNonemptyString(grid.problem, file, "PRESENTATION_GRID_SECTION_EMPTY", "dsr_summary_grid.problem", errors);
  requireNonemptyString(grid.input_knowledge, file, "PRESENTATION_GRID_SECTION_EMPTY", "dsr_summary_grid.input_knowledge", errors);
  requireNonemptyString(grid.research_process, file, "PRESENTATION_GRID_SECTION_EMPTY", "dsr_summary_grid.research_process", errors);
  validateStringArray(grid.key_concepts, false, file, "PRESENTATION_KEY_CONCEPTS_EMPTY", "dsr_summary_grid.key_concepts", errors);
  requireNonemptyString(grid.solution, file, "PRESENTATION_GRID_SECTION_EMPTY", "dsr_summary_grid.solution", errors);
  requireNonemptyString(grid.output_knowledge, file, "PRESENTATION_GRID_SECTION_EMPTY", "dsr_summary_grid.output_knowledge", errors);
  requireNonemptyString(context.summary, file, "PRESENTATION_CONTEXT_SUMMARY_EMPTY", "additional_context.summary", errors);

  if (typeof provenance.migrated_from_legacy_csv !== "boolean") issue(errors, "PRESENTATION_PROVENANCE_MIGRATION_FLAG_INVALID", file, "provenance.migrated_from_legacy_csv must be boolean.");
  const sourceFields = asRecord(provenance.source_fields);
  if (!provenance.source_fields || typeof provenance.source_fields !== "object" || Array.isArray(provenance.source_fields)) {
    issue(errors, "PRESENTATION_SOURCE_FIELDS_INVALID", file, "provenance.source_fields must be a field-path-to-source mapping.");
  }
  for (const [field, source] of Object.entries(sourceFields)) {
    if (!presentationSourceFieldPaths.has(field)) issue(errors, "PRESENTATION_SOURCE_FIELD_PATH_INVALID", file, `Unknown presentation source field path ${field}.`);
    requireNonemptyString(source, file, "PRESENTATION_SOURCE_IDENTIFIER_INVALID", `provenance.source_fields.${field}`, errors);
  }
  validateStringArray(provenance.migration_notes, true, file, "PRESENTATION_MIGRATION_NOTES_INVALID", "provenance.migration_notes", errors);
  const notes = Array.isArray(provenance.migration_notes)
    ? provenance.migration_notes.filter((note): note is string => typeof note === "string")
    : [];
  const emptyPublicationFields = publicationArrays.filter(([, value]) => Array.isArray(value) && value.length === 0).map(([field]) => field);
  const unexplainedEmptyFields = emptyPublicationFields.filter((field) => !notes.some((note) => note.trim().toLowerCase().startsWith(`${field.toLowerCase()}:`)));
  if (unexplainedEmptyFields.length) {
    issue(errors, "PRESENTATION_EMPTY_ARRAY_UNEXPLAINED", file, `Each empty source-dependent array requires a field-specific provenance migration note beginning with its exact field path: ${unexplainedEmptyFields.join(", ")}.`);
  }
}

function validateGraphSourceReference(source: Record<string, unknown>, paper: Record<string, unknown>, file: string, errors: OkfSourceValidationIssue[]) {
  exactKeys(source, graphSourceReferenceKeys, file, "GRAPH_SOURCE_REFERENCE_KEYS", errors);
  enumValue(source.type, okfGraphSourceReferenceTypes, "GRAPH_SOURCE_REFERENCE_TYPE_INVALID", file, errors);
  validateNullableString(source.label, file, "GRAPH_SOURCE_REFERENCE_LABEL_INVALID", "source_reference.label", errors);
  if (source.page !== null && (!Number.isInteger(source.page) || Number(source.page) < 1)) issue(errors, "GRAPH_SOURCE_REFERENCE_PAGE_INVALID", file, "source_reference.page must be a positive integer or null.");
  validateNullableString(source.caption, file, "GRAPH_SOURCE_REFERENCE_CAPTION_INVALID", "source_reference.caption", errors);
  enumValue(source.validation_status, okfGraphValidationStatuses, "GRAPH_SOURCE_REFERENCE_STATUS_INVALID", file, errors);
  validateNullableString(source.validation_notes, file, "GRAPH_SOURCE_REFERENCE_NOTES_INVALID", "source_reference.validation_notes", errors);

  if (source.validation_status === "internally_validated") {
    const covered = paper.review_status === "internally_reviewed" || paper.review_status === "author_verified";
    if (!covered || !stringValue(paper.reviewed_by) || !stringValue(paper.reviewed_at)) issue(errors, "GRAPH_SOURCE_REFERENCE_REVIEW_METADATA_MISSING", file, "internally_validated source references require a covering paper review record.");
  }
  if (source.validation_status === "author_verified") {
    const covered = paper.review_status === "author_verified" && paper.author_check_status === "verified";
    if (!covered || !stringValue(paper.reviewed_by) || !stringValue(paper.reviewed_at)) issue(errors, "GRAPH_SOURCE_REFERENCE_AUTHOR_VERIFICATION_MISSING", file, "author_verified source references require an author-verified paper review record.");
  }
}

function requireNonemptyString(value: unknown, file: string, code: string, field: string, errors: OkfSourceValidationIssue[]) {
  if (typeof value !== "string" || !value.trim()) issue(errors, code, file, `${field} must be a nonempty string.`);
}

function validateNullableString(value: unknown, file: string, code: string, field: string, errors: OkfSourceValidationIssue[]) {
  if (value !== null && (typeof value !== "string" || !value.trim())) issue(errors, code, file, `${field} must be a nonempty string or null.`);
}

function validateStringArray(value: unknown, allowEmpty: boolean, file: string, code: string, field: string, errors: OkfSourceValidationIssue[]) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || value.some((item) => typeof item !== "string" || !item.trim())) {
    issue(errors, code, file, `${field} must be ${allowEmpty ? "an" : "a nonempty"} array of nonempty strings.`);
  }
}

function rejectLiteralPlaceholders(value: unknown, file: string, field: string, errors: OkfSourceValidationIssue[]) {
  if (typeof value === "string") {
    if (forbiddenLiteralPlaceholders.has(value.trim().toLowerCase())) issue(errors, "LITERAL_PLACEHOLDER_FORBIDDEN", file, `${field} uses forbidden placeholder value ${JSON.stringify(value)}; use null for unavailable optional data.`);
    if (!value.trim()) issue(errors, "EMPTY_STRING_FORBIDDEN", file, `${field} must use null rather than an empty or whitespace-only string.`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectLiteralPlaceholders(item, file, `${field}[${index}]`, errors));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) rejectLiteralPlaceholders(item, file, `${field}.${key}`, errors);
  }
}
function validatePaperMetadata(paper: Record<string, unknown>, file: string, errors: OkfSourceValidationIssue[]) {
  if (!stringValue(paper.paper_id) || !stringValue(paper.slug) || !stringValue(paper.title)) issue(errors, "PAPER_REQUIRED_TEXT_MISSING", file, "paper_id, slug, and title are required.");
  validateStringArray(paper.authors, false, file, "PAPER_AUTHORS_INVALID", "authors", errors);
  if (!Number.isInteger(paper.year) || Number(paper.year) < 1) issue(errors, "PAPER_YEAR_INVALID", file, "year must be a positive integer.");
  for (const key of ["research_problem", "research_objective", "research_questions", "theoretical_foundations", "evaluation_method", "key_contributions", "design_knowledge_output", "limitations"]) validateStringArray(paper[key], true, file, "PAPER_ARRAY_FIELD_INVALID", key, errors);
  for (const key of ["short_title", "venue", "doi", "doi_url", "source_url", "source_pdf_filename", "domain_context", "abstract", "artifact_type", "blockchain_dlt_role", "methodology", "notes", "reviewed_by", "reviewed_at"]) validateNullableString(paper[key], file, "PAPER_NULLABLE_TEXT_INVALID", key, errors);
  if (stringValue(paper.doi).startsWith("http://") || stringValue(paper.doi).startsWith("https://")) issue(errors, "PAPER_DOI_FORMAT_INVALID", file, "doi must be stored as the raw DOI, not a URL.");
  if (!paper.doi && paper.doi_url) issue(errors, "PAPER_DOI_URL_WITHOUT_DOI", file, "doi_url cannot be recorded without a raw doi value.");
  enumValue(paper.extraction_status, okfExtractionStatuses, "PAPER_EXTRACTION_STATUS_INVALID", file, errors);
  if (paper.extraction_status !== "okf_draft") issue(errors, "PAPER_SOURCE_EXTRACTION_STATUS_INVALID", file, "Canonical source papers must use extraction_status okf_draft; indexed_from_canonical_okf is reserved for the runtime index.");
  enumValue(paper.author_check_status, okfAuthorCheckStatuses, "PAPER_AUTHOR_CHECK_STATUS_INVALID", file, errors);
  validatePaperReviewStatus(paper, file, `Paper ${String(paper.paper_id)}`, errors);
  if (paper.author_check_status === "verified" && paper.review_status !== "author_verified") issue(errors, "AUTHOR_CHECK_REVIEW_MISMATCH", file, "author_check_status verified requires review_status author_verified.");
  if (paper.review_status === "author_verified" && paper.author_check_status !== "verified") issue(errors, "AUTHOR_VERIFICATION_MISSING", file, "review_status author_verified requires author_check_status verified.");
  if (paper.doi && paper.doi_url !== `https://doi.org/${String(paper.doi)}`) issue(errors, "PAPER_DOI_URL_MISMATCH", file, "doi_url must be the canonical DOI URL when DOI is recorded.");
}

function validateCollectionFrontmatter(frontmatter: Record<string, unknown>, expectedType: string, paperId: string, paper: Record<string, unknown>, file: string, errors: OkfSourceValidationIssue[]) {
  exactKeys(frontmatter, collectionFrontmatterKeys, file, "COLLECTION_FRONTMATTER_KEYS", errors);
  requireSchema(frontmatter, file, errors);
  if (frontmatter.type !== expectedType) issue(errors, "COLLECTION_TYPE_INVALID", file, `Expected collection type ${expectedType}.`);
  if (frontmatter.paper_id !== paperId) issue(errors, "COLLECTION_PAPER_MISMATCH", file, "Collection paper_id does not match index.md.");
  if (frontmatter.extraction_status !== "okf_draft") issue(errors, "COLLECTION_EXTRACTION_STATUS_INVALID", file, "Canonical source collections must use extraction_status okf_draft.");
  enumValue(frontmatter.review_status, okfReviewStatuses, "COLLECTION_REVIEW_STATUS_INVALID", file, errors);
  if (frontmatter.review_status !== paper.review_status) issue(errors, "COLLECTION_REVIEW_STATUS_MISMATCH", file, "Collection review_status must match its paper review record.");
}

function validatePaperReviewStatus(value: Record<string, unknown>, file: string, label: string, errors: OkfSourceValidationIssue[]) {
  enumValue(value.review_status, okfReviewStatuses, "REVIEW_STATUS_INVALID", file, errors);
  if (value.review_status === "unreviewed") {
    if (value.reviewed_by != null || value.reviewed_at != null) issue(errors, "UNREVIEWED_HAS_REVIEW_METADATA", file, `${label} is unreviewed but has review metadata.`);
    return;
  }
  if (!stringValue(value.reviewed_by) || !stringValue(value.reviewed_at)) issue(errors, "REVIEW_METADATA_MISSING", file, `${label} cannot be ${String(value.review_status)} without reviewed_by and reviewed_at.`);
}

function validateConceptReviewStatus(concept: Record<string, unknown>, paper: Record<string, unknown>, file: string, label: string, errors: OkfSourceValidationIssue[]) {
  enumValue(concept.review_status, okfReviewStatuses, "REVIEW_STATUS_INVALID", file, errors);
  if (concept.review_status === "unreviewed") return;
  const paperHasReviewRecord = stringValue(paper.reviewed_by) && stringValue(paper.reviewed_at);
  const coveredByPaperReview = concept.review_status === "internally_reviewed"
    ? paper.review_status === "internally_reviewed" || paper.review_status === "author_verified"
    : concept.review_status === "author_verified" && paper.review_status === "author_verified";
  if (!paperHasReviewRecord || !coveredByPaperReview) issue(errors, "CONCEPT_REVIEW_RECORD_MISSING", file, `${label} cannot be ${String(concept.review_status)} without a covering paper review record.`);
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], file: string, code: string, errors: OkfSourceValidationIssue[]) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  const missing = wanted.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !wanted.includes(key));
  if (missing.length || extra.length) issue(errors, code, file, `Expected exact keys. Missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}.`);
}

function exactKeysAllowOptional(value: Record<string, unknown>, required: readonly string[], optional: readonly string[], file: string, code: string, errors: OkfSourceValidationIssue[]) {
  const actual = Object.keys(value).sort();
  const allowed = [...required, ...optional];
  const missing = required.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !allowed.includes(key));
  if (missing.length || extra.length) issue(errors, code, file, `Expected required keys with optional ${optional.join(", ") || "none"}. Missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}.`);
}
function requireSchema(value: Record<string, unknown>, file: string, errors: OkfSourceValidationIssue[]) {
  if (value.schema_version !== OKF_SCHEMA_VERSION) issue(errors, "SCHEMA_VERSION_INVALID", file, `schema_version must be ${OKF_SCHEMA_VERSION}.`);
}

function readYaml(file: string, errors: OkfSourceValidationIssue[], code: string) {
  try { return readOkfYamlDocument(file); }
  catch (error) {
    issue(errors, code, file, error instanceof Error ? error.message : String(error));
    return {};
  }
}
function readJson(file: string, errors: OkfSourceValidationIssue[], code: string) {
  try { return asRecord(JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""))); }
  catch (error) {
    issue(errors, code, file, error instanceof Error ? error.message : String(error));
    return {};
  }
}

function parseCanonicalCollectionRows(
  file: string,
  kind: "Concept" | "Evidence",
  errors: OkfSourceValidationIssue[]
): Record<string, unknown>[] {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const body = text.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/, "");
  const headingPattern = /^(#{1,6})\s+(.+?)\s*$/gm;
  const allHeadings = Array.from(body.matchAll(headingPattern));
  const expectedHeading = new RegExp(`^${kind}:\\s*(.+)$`, "i");

  for (const heading of allHeadings) {
    if (expectedHeading.test(heading[2].trim()) && heading[1].length !== 2) {
      issue(errors, `${kind.toUpperCase()}_SECTION_LEVEL_INVALID`, file, `${kind} section ${heading[2].trim()} must use a level-two heading.`);
    }
  }

  const runtimeHeadings = Array.from(body.matchAll(/^(#{1,2})\s+(.+?)\s*$/gm));
  const rows: Record<string, unknown>[] = [];
  for (const [index, heading] of runtimeHeadings.entries()) {
    if (heading[1].length !== 2) continue;
    const headingText = heading[2].trim();
    const content = body.slice((heading.index ?? 0) + heading[0].length, runtimeHeadings[index + 1]?.index ?? body.length).trim();
    const blocks = Array.from(content.matchAll(/```json\s*\r?\n([\s\S]*?)\r?\n```/gi));
    const expected = headingText.match(expectedHeading);

    if (!expected) {
      if (blocks.length) issue(errors, `${kind.toUpperCase()}_SECTION_HEADING_INVALID`, file, `JSON data under ${headingText} is invisible to the runtime parser; expected a level-two ${kind}: <id> heading.`);
      continue;
    }
    if (blocks.length !== 1) {
      issue(errors, `${kind.toUpperCase()}_JSON_BLOCK_COUNT_INVALID`, file, `${kind} section ${headingText} must contain exactly one valid json code block; found ${blocks.length}.`);
      continue;
    }

    try {
      const parsed = JSON.parse(blocks[0][1]);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        issue(errors, `${kind.toUpperCase()}_JSON_OBJECT_INVALID`, file, `${kind} section ${headingText} must contain a JSON object.`);
        continue;
      }
      const row = parsed as Record<string, unknown>;
      if (stringValue(row.id) !== expected[1].trim()) {
        issue(errors, `${kind.toUpperCase()}_SECTION_ID_MISMATCH`, file, `${kind} heading id ${expected[1].trim()} does not match JSON id ${stringValue(row.id) || "<missing>"}.`);
      }
      rows.push(row);
    } catch (error) {
      issue(errors, `${kind.toUpperCase()}_JSON_INVALID`, file, `${kind} section ${headingText} has invalid JSON: ${error instanceof Error ? error.message : String(error)}.`);
    }
  }

  if (!rows.length) issue(errors, `${kind.toUpperCase()}_COLLECTION_EMPTY`, file, `${kind} collection must contain at least one runtime-readable item.`);
  return rows;
}

function validateScopedId(id: string, paperId: string, file: string, prefix: string, errors: OkfSourceValidationIssue[]) {
  if (!id.startsWith(`${paperId}:`) || id.length <= paperId.length + 1) issue(errors, `${prefix}_UNSCOPED`, file, `${id || "<missing>"} must be fully scoped to ${paperId}.`);
}

function enumValue(value: unknown, allowed: readonly unknown[], code: string, file: string, errors: OkfSourceValidationIssue[]) {
  if (!allowed.includes(value)) issue(errors, code, file, `${String(value)} is not allowed.`);
}

function duplicate(set: Set<string>, id: string, code: string, file: string, errors: OkfSourceValidationIssue[]) {
  if (!id) return;
  if (set.has(id)) issue(errors, code, file, `Duplicate id ${id}.`);
  set.add(id);
}

function issue(errors: OkfSourceValidationIssue[], code: string, file: string, message: string) {
  errors.push({ code, file, message });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}
