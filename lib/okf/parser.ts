import fs from "node:fs";
import path from "node:path";
import {
  isOkfConceptType,
  isOkfRelationPredicate,
  normalizeConfidence,
  type OkfConcept,
  type OkfEvidenceItem,
  type OkfKnowledgeBase,
  type OkfPaper,
  type OkfRelation,
  type OkfReviewStatus,
  type OkfValidationWarning
} from "./schema.ts";

const requiredFrontmatter = ["type", "paper_id", "title", "review_status"];
const conceptHeading = /^##\s+([A-Za-z]+):([A-Za-z0-9_.:-]+)\s*$/gm;

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
    const indexFile = path.join(paperDir, "index.md");
    if (fs.existsSync(indexFile)) {
      const parsed = readMarkdown(indexFile, warnings);
      papers.push(normalizePaper(parsed.frontmatter, indexFile, parsed.body, warnings));
    } else {
      warnings.push({ file: paperDir, message: "Missing paper index.md." });
    }

    const dsrFile = path.join(paperDir, "dsr.md");
    if (fs.existsSync(dsrFile)) {
      concepts.push(...parseConceptsFile(dsrFile, warnings));
    } else {
      warnings.push({ file: paperDir, message: "Missing dsr.md." });
    }

    const evidenceFile = path.join(paperDir, "evidence.md");
    if (fs.existsSync(evidenceFile)) {
      evidence_items.push(...parseEvidenceFile(evidenceFile, warnings));
    } else {
      warnings.push({ file: paperDir, message: "Missing evidence.md." });
    }

    const relationsFile = path.join(paperDir, "relations.yaml");
    if (fs.existsSync(relationsFile)) {
      relations.push(...parseRelationsFile(relationsFile, warnings));
    } else {
      warnings.push({ file: paperDir, message: "Missing relations.yaml." });
    }
  }

  validateKnowledgeBase({ papers, concepts, evidence_items, relations, warnings });
  return { papers, concepts, evidence_items, relations, warnings };
}

export function validateKnowledgeBase(kb: OkfKnowledgeBase) {
  const paperIds = new Set(kb.papers.map((paper) => paper.paper_id));
  const conceptIds = new Set(kb.concepts.map((concept) => concept.concept_id));
  const evidenceIds = new Set(kb.evidence_items.map((item) => item.evidence_id));

  for (const concept of kb.concepts) {
    if (!paperIds.has(concept.paper_id)) kb.warnings.push({ file: concept.source_file, message: `Concept ${concept.concept_id} references unknown paper ${concept.paper_id}.` });
    for (const field of ["concept_id", "paper_id", "type", "title", "review_status"] as const) {
      if (!concept[field]) kb.warnings.push({ file: concept.source_file, message: `Concept is missing ${field}.` });
    }
  }

  for (const item of kb.evidence_items) {
    if (!paperIds.has(item.paper_id)) kb.warnings.push({ file: item.source_file, message: `Evidence ${item.evidence_id} references unknown paper ${item.paper_id}.` });
    if (item.concept_id && !conceptIds.has(item.concept_id)) kb.warnings.push({ file: item.source_file, message: `Evidence ${item.evidence_id} references unknown concept ${item.concept_id}.` });
    if (!item.paraphrase && !item.quote) kb.warnings.push({ file: item.source_file, message: `Evidence ${item.evidence_id} needs a quote or paraphrase.` });
  }

  for (const relation of kb.relations) {
    if (!conceptIds.has(relation.source_concept_id)) kb.warnings.push({ file: relation.source_file, message: `Relation ${relation.relation_id} has unknown source ${relation.source_concept_id}.` });
    if (!conceptIds.has(relation.target_concept_id)) kb.warnings.push({ file: relation.source_file, message: `Relation ${relation.relation_id} has unknown target ${relation.target_concept_id}.` });
    if (relation.evidence_id && !evidenceIds.has(relation.evidence_id)) kb.warnings.push({ file: relation.source_file, message: `Relation ${relation.relation_id} references unknown evidence ${relation.evidence_id}.` });
    if (!isOkfRelationPredicate(relation.predicate)) kb.warnings.push({ file: relation.source_file, message: `Relation ${relation.relation_id} uses unsupported predicate ${relation.predicate}.` });
  }
}

function parseConceptsFile(file: string, warnings: OkfValidationWarning[]): OkfConcept[] {
  const parsed = readMarkdown(file, warnings);
  validateFrontmatter(parsed.frontmatter, file, warnings);
  const sections = splitHeadingSections(parsed.body);
  return sections.flatMap((section) => {
    if (!isOkfConceptType(section.type)) {
      warnings.push({ file, message: `Unsupported concept type ${section.type}.` });
      return [];
    }
    const fields = parseKeyValueBlock(section.content);
    const paperId = String(fields.paper_id ?? parsed.frontmatter.paper_id ?? "UNKNOWN_PAPER");
    const conceptId = normalizeScopedId(paperId, section.id);
    return [{
      concept_id: conceptId,
      paper_id: paperId,
      type: section.type,
      dsr_layer: String(fields.dsr_layer ?? section.type),
      title: String(fields.title ?? titleFromId(section.id)),
      description: String(fields.description ?? ""),
      body_text: stripKeyValueLines(section.content).trim(),
      tags: normalizeList(fields.tags),
      confidence: normalizeConfidence(fields.confidence),
      extraction_type: String(fields.extraction_type ?? "explicit") === "inferred" ? "inferred" : "explicit",
      review_status: normalizeReviewStatus(fields.review_status ?? parsed.frontmatter.review_status),
      source_file: file,
      okf_path: path.relative(process.cwd(), file)
    } satisfies OkfConcept];
  });
}

function parseEvidenceFile(file: string, warnings: OkfValidationWarning[]): OkfEvidenceItem[] {
  const parsed = readMarkdown(file, warnings);
  validateFrontmatter(parsed.frontmatter, file, warnings);
  const sections = splitEvidenceSections(parsed.body);
  return sections.map((section) => {
    const fields = parseKeyValueBlock(section.content);
    const paperId = String(fields.paper_id ?? parsed.frontmatter.paper_id ?? "UNKNOWN_PAPER");
    return {
      evidence_id: normalizeScopedId(paperId, section.id),
      paper_id: paperId,
      concept_id: fields.concept_id ? normalizeScopedId(paperId, String(fields.concept_id)) : undefined,
      page_number: fields.page_number ? Number(fields.page_number) : undefined,
      section: fields.section ? String(fields.section) : undefined,
      quote: fields.quote ? String(fields.quote) : undefined,
      paraphrase: String(fields.paraphrase ?? stripKeyValueLines(section.content).trim()),
      confidence: normalizeConfidence(fields.confidence),
      source_location: fields.source_location ? String(fields.source_location) : undefined,
      source_file: file
    } satisfies OkfEvidenceItem;
  });
}

function parseRelationsFile(file: string, warnings: OkfValidationWarning[]): OkfRelation[] {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const doc = parseSimpleYaml(text);
  const paperId = String(doc.paper_id ?? inferPaperIdFromPath(file));
  const rows = Array.isArray(doc.relations) ? doc.relations as Record<string, unknown>[] : [];
  if (!Array.isArray(doc.relations)) warnings.push({ file, message: "relations.yaml should contain a relations list." });
  return rows.map((row, index) => {
    const id = String(row.relation_id ?? `rel_${String(index + 1).padStart(3, "0")}`);
    const predicate = String(row.predicate ?? "supported_by");
    const relationScope = String(row.relation_scope ?? "paper_level");
    if (!isOkfRelationPredicate(predicate)) warnings.push({ file, message: `Unsupported relation predicate ${predicate}.` });
    return {
      relation_id: normalizeScopedId(paperId, id),
      source_concept_id: normalizeScopedId(paperId, String(row.source_concept_id ?? "missing_source")),
      predicate: isOkfRelationPredicate(predicate) ? predicate : "supported_by",
      target_concept_id: normalizeScopedId(paperId, String(row.target_concept_id ?? "missing_target")),
      evidence_id: row.evidence_id ? normalizeScopedId(paperId, String(row.evidence_id)) : undefined,
      confidence: normalizeConfidence(row.confidence),
      relation_scope: relationScope === "cross_paper" || relationScope === "query_generated" ? relationScope : "paper_level",
      source_file: file
    } satisfies OkfRelation;
  });
}

function readMarkdown(file: string, warnings: OkfValidationWarning[]) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) {
    warnings.push({ file, message: "Missing YAML frontmatter." });
    return { frontmatter: {}, body: text };
  }
  const frontmatter = parseKeyValueBlock(match[1]);
  validateFrontmatter(frontmatter, file, warnings);
  return { frontmatter, body: text.slice(match[0].length) };
}

function validateFrontmatter(frontmatter: Record<string, unknown>, file: string, warnings: OkfValidationWarning[]) {
  for (const field of requiredFrontmatter) {
    if (!frontmatter[field]) warnings.push({ file, message: `Frontmatter missing ${field}.` });
  }
}

function normalizePaper(frontmatter: Record<string, unknown>, file: string, body: string, warnings: OkfValidationWarning[]): OkfPaper {
  validateFrontmatter(frontmatter, file, warnings);
  return {
    paper_id: String(frontmatter.paper_id ?? inferPaperIdFromPath(file)),
    title: String(frontmatter.title ?? "Untitled OKF paper"),
    authors: normalizeList(frontmatter.authors),
    year: frontmatter.year ? Number(frontmatter.year) : undefined,
    source_pdf_path: frontmatter.source_pdf_path ? String(frontmatter.source_pdf_path) : undefined,
    review_status: normalizeReviewStatus(frontmatter.review_status),
    source_file: file,
    body_text: body.trim()
  };
}

function splitHeadingSections(body: string) {
  const matches = Array.from(body.matchAll(conceptHeading));
  return matches.map((match, index) => ({
    type: match[1],
    id: match[2],
    content: body.slice((match.index ?? 0) + match[0].length, matches[index + 1]?.index ?? body.length).trim()
  }));
}

function splitEvidenceSections(body: string) {
  const heading = /^##\s+([A-Za-z0-9_.:-]+)\s*$/gm;
  const matches = Array.from(body.matchAll(heading));
  return matches.map((match, index) => ({
    id: match[1],
    content: body.slice((match.index ?? 0) + match[0].length, matches[index + 1]?.index ?? body.length).trim()
  }));
}

function parseKeyValueBlock(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("- ")) continue;
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) continue;
    result[match[1]] = parseScalar(match[2]);
  }
  return result;
}

function parseSimpleYaml(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let currentList: string | null = null;
  let currentItem: Record<string, unknown> | null = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const listMatch = line.match(/^([A-Za-z0-9_]+):\s*$/);
    if (listMatch) {
      currentList = listMatch[1];
      result[currentList] = [];
      continue;
    }
    if (line.startsWith("- ") && currentList) {
      currentItem = {};
      const list = result[currentList];
      if (Array.isArray(list)) list.push(currentItem);
      const rest = line.slice(2).trim();
      if (rest) assignYamlPair(currentItem, rest);
      continue;
    }
    if (currentItem && /^([A-Za-z0-9_]+):/.test(line)) {
      assignYamlPair(currentItem, line);
      continue;
    }
    const pair = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (pair) result[pair[1]] = parseScalar(pair[2]);
  }
  return result;
}

function assignYamlPair(target: Record<string, unknown>, text: string) {
  const pair = text.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
  if (pair) target[pair[1]] = parseScalar(pair[2]);
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return trimmed.slice(1, -1).split(",").map((item) => unquote(item.trim())).filter(Boolean);
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return unquote(trimmed);
}

function stripKeyValueLines(text: string) {
  return text.split(/\r?\n/).filter((line) => !/^\s*[A-Za-z0-9_]+:\s*/.test(line)).join("\n");
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (!value) return [];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function normalizeReviewStatus(value: unknown): OkfReviewStatus {
  return String(value ?? "draft").toLowerCase() === "reviewed" ? "reviewed" : "draft";
}

function normalizeScopedId(paperId: string, id: string) {
  if (id.includes(":")) return id;
  return `${paperId}:${id}`;
}

function titleFromId(id: string) {
  return id.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferPaperIdFromPath(file: string) {
  return path.basename(path.dirname(file)).replace(/-/g, "_").toUpperCase();
}

function unquote(value: string) {
  return value.replace(/^['"]|['"]$/g, "");
}

function listImmediateDirectories(dir: string) {
  return fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => path.join(dir, entry.name)).sort();
}






