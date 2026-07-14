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
  const paperId = String(parsed.frontmatter.paper_id ?? inferPaperIdFromPath(file));
  const sections = splitMarkdownSections(parsed.body).filter((section) => section.level === 2);
  return sections.flatMap((section) => {
    const heading = parseConceptHeading(section.heading);
    const fields = parseStructuredMarkdownFields(section.content);
    const typeValue = String(fields.type ?? heading.type ?? "");
    if (!typeValue) return [];
    if (!isOkfConceptType(typeValue)) {
      warnings.push({ file, message: `Unsupported concept type ${typeValue} in ${section.heading}.` });
      return [];
    }
    const rawConceptId = String(fields.concept_id ?? heading.id);
    if (!rawConceptId) {
      warnings.push({ file, message: `Concept heading ${section.heading} has a Type field but no concept id.` });
      return [];
    }
    const conceptId = normalizeScopedId(paperId, rawConceptId);
    return [{
      concept_id: conceptId,
      paper_id: String(fields.paper_id ?? paperId),
      type: typeValue,
      dsr_layer: String(fields.dsr_layer ?? fields["dsr layer"] ?? typeValue),
      title: String(fields.title ?? titleFromId(unscopedId(conceptId))),
      description: String(fields.description ?? ""),
      body_text: stripStructuredFieldLines(section.content).trim(),
      tags: normalizeList(fields.tags),
      confidence: normalizeConfidence(fields.confidence),
      extraction_type: normalizeExtractionType(fields.extraction_type ?? fields["extraction type"]),
      review_status: normalizeReviewStatus(fields.review_status ?? parsed.frontmatter.review_status),
      source_file: file,
      okf_path: path.relative(process.cwd(), file)
    } satisfies OkfConcept];
  });
}

function parseEvidenceFile(file: string, warnings: OkfValidationWarning[]): OkfEvidenceItem[] {
  const parsed = readMarkdown(file, warnings);
  validateFrontmatter(parsed.frontmatter, file, warnings);
  const paperId = String(parsed.frontmatter.paper_id ?? inferPaperIdFromPath(file));
  const sections = splitMarkdownSections(parsed.body).filter((section) => section.level === 2);
  return sections.flatMap((section) => {
    const headingId = parseEvidenceHeading(section.heading);
    if (!headingId) return [];
    const fields = parseStructuredMarkdownFields(section.content);
    const evidenceId = normalizeScopedId(paperId, String(fields.evidence_id ?? headingId));
    const supportIds = normalizeList(fields.supports ?? fields["supports"]);
    const conceptId = fields.concept_id
      ? normalizeScopedId(paperId, String(fields.concept_id))
      : supportIds[0]
        ? normalizeScopedId(paperId, supportIds[0])
        : undefined;
    return [{
      evidence_id: evidenceId,
      paper_id: String(fields.paper_id ?? paperId),
      concept_id: conceptId,
      page_number: firstNumber(fields.page_number ?? fields.pdf_page ?? fields["pdf page"] ?? fields["pdf pages"]),
      section: fields.section ? String(fields.section) : fields.source ? String(fields.source) : undefined,
      quote: fields.quote && String(fields.quote).toLowerCase() !== "null" ? String(fields.quote) : undefined,
      paraphrase: String(fields.paraphrase ?? stripStructuredFieldLines(section.content).trim()),
      confidence: normalizeConfidence(fields.confidence),
      source_location: fields.source_location ? String(fields.source_location) : undefined,
      source_file: file
    } satisfies OkfEvidenceItem];
  });
}

function parseRelationsFile(file: string, warnings: OkfValidationWarning[]): OkfRelation[] {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const doc = parseSimpleYaml(text);
  const paperId = String(doc.paper_id ?? inferPaperIdFromPath(file));
  const rows = Array.isArray(doc.relations) ? doc.relations as Record<string, unknown>[] : [];
  if (!Array.isArray(doc.relations)) warnings.push({ file, message: "relations.yaml should contain a relations list." });
  return rows.flatMap((row, index) => {
    const id = String(row.relation_id ?? `rel_${String(index + 1).padStart(3, "0")}`);
    const relationId = normalizeScopedId(paperId, id);
    const predicate = String(row.predicate ?? "supported_by");
    const relationScope = String(row.relation_scope ?? "paper_level");
    const source = row.source_concept_id ?? row.source;
    const target = row.target_concept_id ?? row.target;
    const evidence = row.evidence_id ?? row.evidence;
    if (!source || !target) {
      warnings.push({
        file,
        message: `Malformed relation ${relationId}: missing ${!source ? "source" : "target"} concept id.`
      });
      return [];
    }
    if (!isOkfRelationPredicate(predicate)) warnings.push({ file, message: `Unsupported relation predicate ${predicate} in ${relationId}.` });
    return [{
      relation_id: relationId,
      source_concept_id: normalizeScopedId(paperId, String(source)),
      predicate: isOkfRelationPredicate(predicate) ? predicate : "supported_by",
      target_concept_id: normalizeScopedId(paperId, String(target)),
      evidence_id: evidence ? normalizeScopedId(paperId, String(evidence)) : undefined,
      confidence: normalizeConfidence(row.confidence),
      relation_scope: relationScope === "cross_paper" || relationScope === "query_generated" ? relationScope : "paper_level",
      source_file: file
    } satisfies OkfRelation];
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

function splitMarkdownSections(body: string) {
  const heading = /^(#{1,2})\s+(.+?)\s*$/gm;
  const matches = Array.from(body.matchAll(heading));
  return matches.map((match, index) => ({
    level: match[1].length,
    heading: match[2].trim(),
    content: body.slice((match.index ?? 0) + match[0].length, matches[index + 1]?.index ?? body.length).trim()
  }));
}

function parseConceptHeading(heading: string) {
  const conceptMatch = heading.match(/^Concept:\s*(.+)$/i);
  if (conceptMatch) return { id: conceptMatch[1].trim() };
  const typedMatch = heading.match(/^([A-Za-z]+):([A-Za-z0-9_.:-]+)$/);
  if (typedMatch) return { type: typedMatch[1], id: typedMatch[2] };
  return { id: heading.trim() };
}

function parseEvidenceHeading(heading: string) {
  const evidenceMatch = heading.match(/^Evidence:\s*(.+)$/i);
  return (evidenceMatch ? evidenceMatch[1] : heading).trim();
}

function parseStructuredMarkdownFields(content: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const fence of content.matchAll(/```ya?ml\s*\r?\n([\s\S]*?)\r?\n```/gi)) {
    Object.assign(fields, parseKeyValueBlock(fence[1]));
  }
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    const bold = line.match(/^\*\*([^*]+?):\*\*\s*(.*?)\s*$/);
    if (bold) fields[normalizeFieldKey(bold[1])] = parseScalar(bold[2]);
  }
  Object.assign(fields, parseKeyValueBlock(content.replace(/```[\s\S]*?```/g, "")));
  return fields;
}

function stripStructuredFieldLines(content: string) {
  return content
    .replace(/```ya?ml\s*\r?\n[\s\S]*?\r?\n```/gi, "")
    .split(/\r?\n/)
    .filter((line) => !/^\s*\*\*[^*]+?:\*\*/.test(line))
    .filter((line) => !/^\s*[A-Za-z0-9_]+:\s*/.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

function parseKeyValueBlock(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("- ")) continue;
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) continue;
    result[normalizeFieldKey(match[1])] = parseScalar(match[2]);
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
      currentList = normalizeFieldKey(listMatch[1]);
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
    if (pair) result[normalizeFieldKey(pair[1])] = parseScalar(pair[2]);
  }
  return result;
}

function assignYamlPair(target: Record<string, unknown>, text: string) {
  const pair = text.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
  if (pair) target[normalizeFieldKey(pair[1])] = parseScalar(pair[2]);
}

function normalizeFieldKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizeExtractionType(value: unknown) {
  const normalized = String(value ?? "explicit").toLowerCase();
  if (normalized === "inferred") return "inferred";
  if (normalized === "explicit-in-artifact") return "explicit-in-artifact";
  return "explicit";
}

function firstNumber(value: unknown) {
  if (value === undefined || value === null) return undefined;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return trimmed.slice(1, -1).split(",").map((item) => unquote(item.trim())).filter(Boolean);
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return undefined;
  return unquote(trimmed);
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
  const cleanId = id.trim();
  if (cleanId.includes(":")) return cleanId;
  return `${paperId}:${cleanId}`;
}

function unscopedId(id: string) {
  return id.includes(":") ? id.split(":").slice(1).join(":") : id;
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






