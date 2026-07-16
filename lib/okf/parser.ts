import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import {
  OKF_PRESENTATION_VERSION,
  OKF_SCHEMA_VERSION,
  isOkfConceptType,
  isOkfRelationPredicate,
  normalizeConfidence,
  okfAuthorCheckStatuses,
  okfEvidenceTypes,
  okfExtractionStatuses,
  okfExtractionTypes,
  okfGraphSourceReferenceTypes,
  okfGraphValidationStatuses,
  okfReviewStatuses,
  type OkfAuthorCheckStatus,
  type OkfConcept,
  type OkfEvidenceItem,
  type OkfEvidenceType,
  type OkfExtractionStatus,
  type OkfExtractionType,
  type OkfGraphSourceReference,
  type OkfKnowledgeBase,
  type OkfPaper,
  type OkfPresentation,
  type OkfRelation,
  type OkfReviewStatus,
  type OkfValidationWarning
} from "./schema.ts";
import { readOkfSourceViews } from "./source-view.ts";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml") as { load: (text: string) => unknown };

export function parseOkfLibrary(rootDir = path.join(process.cwd(), "library", "okf")): OkfKnowledgeBase {
  const warnings: OkfValidationWarning[] = [];
  const papers: OkfPaper[] = [];
  const concepts: OkfConcept[] = [];
  const evidence_items: OkfEvidenceItem[] = [];
  const relations: OkfRelation[] = [];
  const papersDir = path.join(rootDir, "papers");

  if (!fs.existsSync(papersDir)) {
    return { papers, concepts, evidence_items, relations, warnings: [{ file: papersDir, message: "OKF papers directory does not exist." }] };
  }

  for (const paperDir of listImmediateDirectories(papersDir)) {
    let paper: OkfPaper | undefined;
    const indexFile = path.join(paperDir, "index.md");
    if (fs.existsSync(indexFile)) {
      const parsed = readMarkdown(indexFile, warnings);
      paper = normalizePaper(parsed.frontmatter, indexFile, parsed.body, warnings);
      papers.push(paper);
    } else warnings.push({ file: paperDir, message: "Missing paper index.md." });

    const presentationFile = path.join(paperDir, "presentation.yaml");
    if (fs.existsSync(presentationFile)) {
      const presentation = parseOkfPresentationFile(presentationFile, warnings);
      if (paper && presentation) {
        if (presentation.paper_id !== paper.paper_id) warnings.push({ file: presentationFile, message: `Presentation paper_id ${presentation.paper_id} does not match ${paper.paper_id}.` });
        else paper.presentation = presentation;
      }
    } else warnings.push({ file: paperDir, message: "Missing presentation.yaml." });

    const graphFile = path.join(paperDir, "graph.json");
    if (paper && fs.existsSync(graphFile)) {
      paper.graph_source_reference = parseOkfGraphSourceReference(graphFile, warnings);
      const sourceViews = readOkfSourceViews(graphFile, warnings);
      if (sourceViews.length) paper.source_views = sourceViews;
    }

    const dsrFile = path.join(paperDir, "dsr.md");
    if (fs.existsSync(dsrFile)) concepts.push(...parseConceptsFile(dsrFile, warnings));
    else warnings.push({ file: paperDir, message: "Missing dsr.md." });

    const evidenceFile = path.join(paperDir, "evidence.md");
    if (fs.existsSync(evidenceFile)) evidence_items.push(...parseEvidenceFile(evidenceFile, warnings));
    else warnings.push({ file: paperDir, message: "Missing evidence.md." });

    const relationsFile = path.join(paperDir, "relations.yaml");
    if (fs.existsSync(relationsFile)) relations.push(...parseRelationsFile(relationsFile, warnings));
    else warnings.push({ file: paperDir, message: "Missing relations.yaml." });
  }

  const kb = { papers, concepts, evidence_items, relations, warnings };
  validateKnowledgeBase(kb);
  return kb;
}

export function validateKnowledgeBase(kb: OkfKnowledgeBase) {
  const paperIds = new Set(kb.papers.map((paper) => paper.paper_id));
  const conceptIds = new Set(kb.concepts.map((concept) => concept.concept_id));
  const evidenceIds = new Set(kb.evidence_items.map((item) => item.evidence_id));
  addDuplicateWarnings(kb.papers.map((paper) => paper.paper_id), "paper", kb.warnings);
  addDuplicateWarnings(kb.concepts.map((concept) => concept.concept_id), "concept", kb.warnings);
  addDuplicateWarnings(kb.evidence_items.map((item) => item.evidence_id), "evidence", kb.warnings);
  addDuplicateWarnings(kb.relations.map((relation) => relation.relation_id), "relation", kb.warnings);

  for (const concept of kb.concepts) {
    if (!paperIds.has(concept.paper_id)) kb.warnings.push({ file: concept.source_file, message: `Concept ${concept.concept_id} references unknown paper ${concept.paper_id}.` });
    for (const evidenceId of concept.evidence_ids) if (!evidenceIds.has(evidenceId)) kb.warnings.push({ file: concept.source_file, message: `Concept ${concept.concept_id} references unknown evidence ${evidenceId}.` });
  }

  for (const item of kb.evidence_items) {
    if (!paperIds.has(item.paper_id)) kb.warnings.push({ file: item.source_file, message: `Evidence ${item.evidence_id} references unknown paper ${item.paper_id}.` });
    for (const target of item.supports) {
      if (target !== item.paper_id && !conceptIds.has(target)) kb.warnings.push({ file: item.source_file, message: `Evidence ${item.evidence_id} supports unknown target ${target}.` });
    }
  }

  for (const relation of kb.relations) {
    if (!conceptIds.has(relation.source_concept_id)) kb.warnings.push({ file: relation.source_file, message: `Relation ${relation.relation_id} has unknown source ${relation.source_concept_id}.` });
    if (!conceptIds.has(relation.target_concept_id)) kb.warnings.push({ file: relation.source_file, message: `Relation ${relation.relation_id} has unknown target ${relation.target_concept_id}.` });
    if (relation.evidence_id && !evidenceIds.has(relation.evidence_id)) kb.warnings.push({ file: relation.source_file, message: `Relation ${relation.relation_id} references unknown evidence ${relation.evidence_id}.` });
    if (!isOkfRelationPredicate(relation.predicate)) kb.warnings.push({ file: relation.source_file, message: `Relation ${relation.relation_id} uses unsupported predicate ${relation.predicate}.` });
  }
}

export function readOkfFrontmatter(file: string) {
  return readMarkdown(file, []).frontmatter;
}

export function parseOkfJsonBlocks(file: string) {
  const parsed = readMarkdown(file, []);
  return splitMarkdownSections(parsed.body).flatMap((section) => {
    const block = section.content.match(/```json\s*\r?\n([\s\S]*?)\r?\n```/i);
    if (!block) return [];
    try {
      return [{ heading: section.heading, level: section.level, value: asRecord(JSON.parse(block[1])), body: section.content.replace(block[0], "").trim() }];
    } catch {
      return [];
    }
  });
}

function parseConceptsFile(file: string, warnings: OkfValidationWarning[]): OkfConcept[] {
  const parsed = readMarkdown(file, warnings);
  const paperId = String(parsed.frontmatter.paper_id ?? inferPaperIdFromPath(file));
  return splitMarkdownSections(parsed.body).filter((section) => section.level === 2 && /^Concept:/i.test(section.heading)).flatMap((section) => {
    const block = section.content.match(/```json\s*\r?\n([\s\S]*?)\r?\n```/i);
    if (!block) {
      warnings.push({ file, message: `Concept section ${section.heading} is missing a JSON data block.` });
      return [];
    }
    let row: Record<string, unknown>;
    try { row = asRecord(JSON.parse(block[1])); }
    catch (error) {
      warnings.push({ file, message: `Concept section ${section.heading} has invalid JSON: ${errorMessage(error)}.` });
      return [];
    }
    const id = String(row.id ?? "");
    const type = String(row.type ?? "");
    if (!id || !isOkfConceptType(type)) {
      warnings.push({ file, message: `Concept section ${section.heading} has invalid id or type ${type}.` });
      return [];
    }
    return [{
      concept_id: id,
      paper_id: paperId,
      type,
      dsr_layer: type,
      title: String(row.title ?? ""),
      description: String(row.description ?? ""),
      body_text: section.content.replace(block[0], "").trim(),
      evidence_ids: stringArray(row.evidence),
      tags: [],
      confidence: normalizeConfidence(row.confidence),
      extraction_type: extractionType(row.extraction_type),
      review_status: reviewStatus(row.review_status),
      source_file: file,
      okf_path: path.relative(process.cwd(), file)
    }];
  });
}

function parseEvidenceFile(file: string, warnings: OkfValidationWarning[]): OkfEvidenceItem[] {
  const parsed = readMarkdown(file, warnings);
  const paperId = String(parsed.frontmatter.paper_id ?? inferPaperIdFromPath(file));
  return splitMarkdownSections(parsed.body).filter((section) => section.level === 2 && /^Evidence:/i.test(section.heading)).flatMap((section) => {
    const block = section.content.match(/```json\s*\r?\n([\s\S]*?)\r?\n```/i);
    if (!block) {
      warnings.push({ file, message: `Evidence section ${section.heading} is missing a JSON data block.` });
      return [];
    }
    let row: Record<string, unknown>;
    try { row = asRecord(JSON.parse(block[1])); }
    catch (error) {
      warnings.push({ file, message: `Evidence section ${section.heading} has invalid JSON: ${errorMessage(error)}.` });
      return [];
    }
    const supports = stringArray(row.supports);
    const location = optionalString(row.source_location);
    const evidenceType = normalizeEvidenceType(row.evidence_type);
    const text = String(row.quote_or_summary ?? "");
    return [{
      evidence_id: String(row.id ?? ""),
      paper_id: paperId,
      concept_id: supports.find((target) => target !== paperId),
      supports,
      page_number: firstNumber(location),
      section: location,
      quote: evidenceType === "quote" ? text : undefined,
      paraphrase: text,
      evidence_type: evidenceType,
      confidence: "medium",
      source_location: location,
      source_file: file
    }];
  });
}

function parseRelationsFile(file: string, warnings: OkfValidationWarning[]): OkfRelation[] {
  let document: Record<string, unknown>;
  try { document = readOkfYamlDocument(file); }
  catch (error) {
    warnings.push({ file, message: `relations.yaml must contain valid canonical YAML: ${errorMessage(error)}.` });
    return [];
  }
  const rows = Array.isArray(document.relations) ? document.relations.map(asRecord) : [];
  if (!Array.isArray(document.relations)) warnings.push({ file, message: "relations.yaml should contain a relations list." });
  return rows.flatMap((row) => {
    const predicate = String(row.predicate ?? "");
    if (!isOkfRelationPredicate(predicate)) {
      warnings.push({ file, message: `Unsupported relation predicate ${predicate} in ${String(row.id ?? "unknown")}.` });
      return [];
    }
    return [{
      relation_id: String(row.id ?? ""),
      source_concept_id: String(row.source ?? ""),
      predicate,
      target_concept_id: String(row.target ?? ""),
      evidence_id: optionalString(row.evidence),
      confidence: normalizeConfidence(row.confidence),
      extraction_type: extractionType(row.extraction_type),
      relation_scope: "paper_level",
      source_file: file
    }];
  });
}

export function readOkfYamlDocument(file: string): Record<string, unknown> {
  const value = yaml.load(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected a YAML mapping at the document root.");
  return value as Record<string, unknown>;
}

export function parseOkfPresentationFile(file: string, warnings: OkfValidationWarning[] = []): OkfPresentation | undefined {
  let document: Record<string, unknown>;
  try { document = readOkfYamlDocument(file); }
  catch (error) {
    warnings.push({ file, message: `presentation.yaml must contain valid canonical YAML: ${errorMessage(error)}.` });
    return undefined;
  }
  if (document.presentation_version !== OKF_PRESENTATION_VERSION) {
    warnings.push({ file, message: `Expected presentation_version ${OKF_PRESENTATION_VERSION}.` });
    return undefined;
  }
  const card = asRecord(document.card);
  const overview = asRecord(document.overview);
  const grid = asRecord(document.dsr_summary_grid);
  const context = asRecord(document.additional_context);
  const provenance = asRecord(document.provenance);
  const sourceFields = asRecord(provenance.source_fields);
  return {
    presentation_version: OKF_PRESENTATION_VERSION,
    paper_id: String(document.paper_id ?? ""),
    card: {
      domain_label: String(card.domain_label ?? ""),
      artifact_summary: nullableString(card.artifact_summary),
      dlt_role: nullableString(card.dlt_role)
    },
    overview: {
      abstract_summary: nullableString(overview.abstract_summary),
      research_problem: String(overview.research_problem ?? ""),
      research_objective: nullableString(overview.research_objective),
      methodology: nullableString(overview.methodology),
      evaluation_method: stringArray(overview.evaluation_method),
      key_contributions: stringArray(overview.key_contributions),
      design_knowledge_output: stringArray(overview.design_knowledge_output)
    },
    dsr_summary_grid: {
      problem: String(grid.problem ?? ""),
      input_knowledge: String(grid.input_knowledge ?? ""),
      research_process: String(grid.research_process ?? ""),
      key_concepts: stringArray(grid.key_concepts),
      solution: String(grid.solution ?? ""),
      output_knowledge: String(grid.output_knowledge ?? "")
    },
    additional_context: {
      summary: String(context.summary ?? ""),
      limitations: stringArray(context.limitations)
    },
    provenance: {
      migrated_from_legacy_csv: provenance.migrated_from_legacy_csv === true,
      source_fields: Object.fromEntries(Object.entries(sourceFields).map(([key, value]) => [key, String(value)])),
      migration_notes: stringArray(provenance.migration_notes)
    }
  };
}

export function parseOkfGraphSourceReference(file: string, warnings: OkfValidationWarning[] = []): OkfGraphSourceReference | undefined {
  let graph: Record<string, unknown>;
  try { graph = asRecord(JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""))); }
  catch (error) {
    warnings.push({ file, message: `graph.json is invalid JSON: ${errorMessage(error)}.` });
    return undefined;
  }
  if (graph.source_reference == null) return undefined;
  const source = asRecord(graph.source_reference);
  if (!(okfGraphSourceReferenceTypes as readonly unknown[]).includes(source.type) || !(okfGraphValidationStatuses as readonly unknown[]).includes(source.validation_status)) {
    warnings.push({ file, message: "graph.json source_reference has an invalid type or validation_status." });
    return undefined;
  }
  return {
    type: source.type as OkfGraphSourceReference["type"],
    label: nullableString(source.label),
    page: typeof source.page === "number" && Number.isInteger(source.page) && source.page > 0 ? source.page : null,
    caption: nullableString(source.caption),
    validation_status: source.validation_status as OkfGraphSourceReference["validation_status"],
    validation_notes: nullableString(source.validation_notes)
  };
}

function normalizePaper(frontmatter: Record<string, unknown>, file: string, body: string, warnings: OkfValidationWarning[]): OkfPaper {
  if (frontmatter.schema_version !== OKF_SCHEMA_VERSION) warnings.push({ file, message: `Expected schema_version ${OKF_SCHEMA_VERSION}.` });
  const sourcePdf = optionalString(frontmatter.source_pdf_filename);
  return {
    schema_version: OKF_SCHEMA_VERSION,
    paper_id: String(frontmatter.paper_id ?? inferPaperIdFromPath(file)),
    slug: String(frontmatter.slug ?? path.basename(path.dirname(file))),
    title: String(frontmatter.title ?? "Untitled OKF paper"),
    short_title: optionalString(frontmatter.short_title),
    authors: stringArray(frontmatter.authors),
    year: optionalNumber(frontmatter.year),
    venue: optionalString(frontmatter.venue),
    doi: optionalString(frontmatter.doi),
    doi_url: optionalString(frontmatter.doi_url),
    source_url: optionalString(frontmatter.source_url),
    source_pdf_path: sourcePdf ?? undefined,
    domain_context: optionalString(frontmatter.domain_context),
    abstract: optionalString(frontmatter.abstract),
    research_problem: stringArray(frontmatter.research_problem),
    research_objective: stringArray(frontmatter.research_objective),
    research_questions: stringArray(frontmatter.research_questions),
    artifact_type: optionalString(frontmatter.artifact_type),
    blockchain_dlt_role: optionalString(frontmatter.blockchain_dlt_role),
    methodology: optionalString(frontmatter.methodology),
    theoretical_foundations: stringArray(frontmatter.theoretical_foundations),
    evaluation_method: stringArray(frontmatter.evaluation_method),
    key_contributions: stringArray(frontmatter.key_contributions),
    design_knowledge_output: stringArray(frontmatter.design_knowledge_output),
    limitations: stringArray(frontmatter.limitations),
    notes: optionalString(frontmatter.notes),
    extraction_status: extractionStatus(frontmatter.extraction_status),
    review_status: reviewStatus(frontmatter.review_status),
    author_check_status: authorCheckStatus(frontmatter.author_check_status),
    reviewed_by: optionalString(frontmatter.reviewed_by),
    reviewed_at: optionalString(frontmatter.reviewed_at),
    source_file: file,
    body_text: body.trim()
  };
}

function readMarkdown(file: string, warnings: OkfValidationWarning[]) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) {
    warnings.push({ file, message: "Missing YAML frontmatter." });
    return { frontmatter: {}, body: text };
  }
  return { frontmatter: parseFrontmatterBlock(match[1], file, warnings), body: text.slice(match[0].length) };
}

function parseFrontmatterBlock(text: string, file: string, warnings: OkfValidationWarning[]) {
  const result: Record<string, unknown> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) continue;
    const match = rawLine.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) {
      warnings.push({ file, message: `Unsupported multiline or malformed frontmatter line: ${rawLine.trim()}.` });
      continue;
    }
    result[match[1]] = parseCanonicalScalar(match[2]);
  }
  return result;
}

function parseCanonicalScalar(value: string): unknown {
  const trimmed = value.trim();
  try { return JSON.parse(trimmed); }
  catch { return trimmed.replace(/^['"]|['"]$/g, ""); }
}

function splitMarkdownSections(body: string) {
  const matches = Array.from(body.matchAll(/^(#{1,2})\s+(.+?)\s*$/gm));
  return matches.map((match, index) => ({
    level: match[1].length,
    heading: match[2].trim(),
    content: body.slice((match.index ?? 0) + match[0].length, matches[index + 1]?.index ?? body.length).trim()
  }));
}

function extractionType(value: unknown): OkfExtractionType {
  return (okfExtractionTypes as readonly unknown[]).includes(value) ? value as OkfExtractionType : "inferred";
}

function extractionStatus(value: unknown): OkfExtractionStatus {
  return (okfExtractionStatuses as readonly unknown[]).includes(value) ? value as OkfExtractionStatus : "okf_draft";
}

function reviewStatus(value: unknown): OkfReviewStatus {
  return (okfReviewStatuses as readonly unknown[]).includes(value) ? value as OkfReviewStatus : "unreviewed";
}

function authorCheckStatus(value: unknown): OkfAuthorCheckStatus {
  return (okfAuthorCheckStatuses as readonly unknown[]).includes(value) ? value as OkfAuthorCheckStatus : "not_requested";
}

function normalizeEvidenceType(value: unknown): OkfEvidenceType {
  return (okfEvidenceTypes as readonly unknown[]).includes(value) ? value as OkfEvidenceType : "summary";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value == null || value === "") return [];
  return [String(value)];
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function firstNumber(value: unknown) {
  if (value == null) return undefined;
  const match = String(value).match(/\bpage\s+(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

function addDuplicateWarnings(ids: string[], kind: string, warnings: OkfValidationWarning[]) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) warnings.push({ file: kind, message: `Duplicate ${kind} id ${id}.` });
    seen.add(id);
  }
}

function inferPaperIdFromPath(file: string) {
  return path.basename(path.dirname(file)).replace(/-/g, "_").toUpperCase();
}

function listImmediateDirectories(dir: string) {
  return fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => path.join(dir, entry.name)).sort();
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}