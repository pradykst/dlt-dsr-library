import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml") as { load: (text: string) => unknown };

const SCHEMA_VERSION = "okf-dsr-v1";
const CANONICAL_TYPES = new Set([
  "Problem",
  "Design Requirement",
  "Design Principle",
  "Design Feature",
  "Artifact",
  "Evaluation",
  "Output Knowledge"
]);
const TYPE_MAP: Record<string, string> = {
  Problem: "Problem",
  Requirement: "Design Requirement",
  DesignRequirement: "Design Requirement",
  "Design Requirement": "Design Requirement",
  DesignPrinciple: "Design Principle",
  "Design Principle": "Design Principle",
  DesignFeature: "Design Feature",
  "Design Feature": "Design Feature",
  Artifact: "Artifact",
  Evaluation: "Evaluation",
  OutputKnowledge: "Output Knowledge",
  "Output Knowledge": "Output Knowledge"
};
const CONTEXT_TYPES = new Set(["ResearchQuestion", "KernelTheory", "Limitation"]);

type LegacyConcept = {
  id: string;
  type: string;
  title: string;
  description: string;
  evidence: string[];
  confidence: string;
  extraction_type: string;
  body: string;
};

type CanonicalConcept = {
  id: string;
  type: string;
  title: string;
  description: string;
  evidence: string[];
  confidence: string;
  extraction_type: string;
  review_status: "unreviewed";
};

type CanonicalRelation = {
  id: string;
  source: string;
  target: string;
  predicate: string;
  evidence: string | null;
  confidence: string;
  extraction_type: "inferred";
};

const args = process.argv.slice(2);
const rootArgIndex = args.indexOf("--root");
const root = rootArgIndex >= 0 && args[rootArgIndex + 1]
  ? path.resolve(args[rootArgIndex + 1])
  : path.join(process.cwd(), "library", "okf");
const papersRoot = path.join(root, "papers");

if (!fs.existsSync(papersRoot)) throw new Error(`OKF papers directory not found: ${papersRoot}`);

const summary = {
  papers: 0,
  concepts_before: 0,
  concepts_after: 0,
  context_records_preserved: 0,
  context_relations_preserved: 0,
  relations_before: 0,
  relations_after: 0,
  evidence: 0,
  recommended_paths: 0
};

for (const entry of fs.readdirSync(papersRoot, { withFileTypes: true }).filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
  normalizePaperBundle(path.join(papersRoot, entry.name), entry.name);
}

console.log(JSON.stringify(summary, null, 2));

function normalizePaperBundle(bundleDir: string, slug: string) {
  const indexPath = path.join(bundleDir, "index.md");
  const dsrPath = path.join(bundleDir, "dsr.md");
  const evidencePath = path.join(bundleDir, "evidence.md");
  const relationsPath = path.join(bundleDir, "relations.yaml");
  const aliasesPath = path.join(bundleDir, "aliases.yaml");
  const graphPath = path.join(bundleDir, "graph.json");

  const indexDocument = readFrontmatterDocument(indexPath);
  if (indexDocument.frontmatter.schema_version === SCHEMA_VERSION) return;
  const paperId = String(indexDocument.frontmatter.paper_id ?? slug.replace(/-/g, "_").toUpperCase());
  const sourcePdf = stringOrNull(indexDocument.frontmatter.source_pdf_filename ?? indexDocument.frontmatter.source_pdf_path ?? indexDocument.frontmatter.source_pdf);
  const concepts = parseLegacyConcepts(dsrPath, paperId);
  const legacyEvidence = parseLegacyEvidence(evidencePath, paperId, sourcePdf);
  const evidenceIds = new Set(legacyEvidence.map((item) => item.id));
  const conceptEvidence = new Map<string, string[]>();
  for (const concept of concepts) {
    for (const evidenceId of concept.evidence) {
      const resolvedEvidenceId = resolveLegacyEvidenceReference(paperId, evidenceId, evidenceIds);
      if (!resolvedEvidenceId) continue;
      conceptEvidence.set(resolvedEvidenceId, unique([...(conceptEvidence.get(resolvedEvidenceId) ?? []), concept.id]));
    }
  }
  const canonicalConcepts: CanonicalConcept[] = concepts.flatMap((concept) => {
    const canonicalType = TYPE_MAP[concept.type];
    if (!canonicalType || !CANONICAL_TYPES.has(canonicalType)) return [];
    return [{
      id: concept.id,
      type: canonicalType,
      title: concept.title,
      description: concept.description,
      evidence: unique(concept.evidence.flatMap((id) => {
        const resolvedEvidenceId = resolveLegacyEvidenceReference(paperId, id, evidenceIds);
        return resolvedEvidenceId ? [resolvedEvidenceId] : [];
      })),
      confidence: normalizeConfidence(concept.confidence),
      extraction_type: normalizeExtractionType(concept.extraction_type),
      review_status: "unreviewed"
    }];
  });
  const canonicalConceptIds = new Set(canonicalConcepts.map((concept) => concept.id));
  const contextConcepts = concepts.filter((concept) => CONTEXT_TYPES.has(concept.type));

  const canonicalEvidence = legacyEvidence.map((item) => {
    const linked = unique([
      ...item.supports.map((id: string) => scoped(paperId, id)),
      ...(conceptEvidence.get(item.id) ?? [])
    ]).filter((id) => canonicalConceptIds.has(id));
    return {
      id: item.id,
      supports: linked.length ? linked : [paperId],
      source_location: item.source_location,
      quote_or_summary: item.quote_or_summary,
      evidence_type: normalizeEvidenceType(item.evidence_type)
    };
  });

  const relationDocument = yamlObject(yaml.load(fs.readFileSync(relationsPath, "utf8")));
  const relationRows = Array.isArray(relationDocument.relations) ? relationDocument.relations.map(asObject) : [];
  const contextRelations = relationRows.flatMap((row, index) => {
    const source = scoped(paperId, String(row.source ?? row.source_concept_id ?? ""));
    const target = scoped(paperId, String(row.target ?? row.target_concept_id ?? ""));
    if (canonicalConceptIds.has(source) && canonicalConceptIds.has(target)) return [];
    const evidenceValue = row.evidence ?? row.evidence_id;
    return [{
      id: scoped(paperId, String(row.id ?? row.relation_id ?? `rel_${String(index + 1).padStart(3, "0")}`)),
      source,
      target,
      predicate: String(row.predicate ?? "supported_by"),
      evidence: evidenceValue ? scoped(paperId, String(evidenceValue)) : null,
      confidence: normalizeConfidence(row.confidence)
    }];
  });
  const canonicalRelations: CanonicalRelation[] = relationRows.flatMap((row, index) => {
    const source = scoped(paperId, String(row.source ?? row.source_concept_id ?? ""));
    const target = scoped(paperId, String(row.target ?? row.target_concept_id ?? ""));
    if (!canonicalConceptIds.has(source) || !canonicalConceptIds.has(target)) return [];
    const evidenceValue = row.evidence ?? row.evidence_id;
    const evidence = evidenceValue ? scoped(paperId, String(evidenceValue)) : null;
    return [{
      id: scoped(paperId, String(row.id ?? row.relation_id ?? `rel_${String(index + 1).padStart(3, "0")}`)),
      source,
      target,
      predicate: String(row.predicate ?? "supported_by"),
      evidence: evidence && evidenceIds.has(evidence) ? evidence : null,
      confidence: normalizeConfidence(row.confidence),
      extraction_type: "inferred"
    }];
  });
  const relationByTriple = new Map(canonicalRelations.map((relation) => [triple(relation.source, relation.target, relation.predicate), relation]));

  const oldGraph = asObject(JSON.parse(fs.readFileSync(graphPath, "utf8")));
  const oldEdges = Array.isArray(oldGraph.edges) ? oldGraph.edges.map(asObject) : [];
  const graphEdges = uniqueBy(oldEdges.flatMap((edge) => {
    const source = scoped(paperId, String(edge.source ?? ""));
    const target = scoped(paperId, String(edge.target ?? ""));
    const predicate = String(edge.predicate ?? "");
    const relation = relationByTriple.get(triple(source, target, predicate));
    return relation ? [{ id: relation.id, source, target, predicate }] : [];
  }), (edge) => edge.id);
  const graphNodeIds = new Set(graphEdges.flatMap((edge) => [edge.source, edge.target]));
  const conceptById = new Map(canonicalConcepts.map((concept) => [concept.id, concept]));
  const graphNodes = [...graphNodeIds].sort().flatMap((id) => {
    const concept = conceptById.get(id);
    return concept ? [{ id, type: concept.type, title: concept.title }] : [];
  });
  const edgePairs = new Set(graphEdges.map((edge) => `${edge.source}\u0000${edge.target}`));
  const legacyPaths = Array.isArray(oldGraph.recommended_main_flow)
    ? [oldGraph.recommended_main_flow]
    : Array.isArray(oldGraph.recommended_main_paths)
      ? oldGraph.recommended_main_paths
      : Array.isArray(oldGraph.recommended_paths)
        ? oldGraph.recommended_paths
        : [];
  const recommendedPaths = legacyPaths
    .flatMap((candidate) => splitStoredSegments(
      Array.isArray(candidate) ? candidate.map((id) => scoped(paperId, String(id))).filter((id) => graphNodeIds.has(id)) : [],
      edgePairs
    ))
    .filter((candidate) => candidate.length >= 2);

  const aliases = parseLegacyAliases(aliasesPath, paperId)
    .filter((item) => item.target_id === paperId || canonicalConceptIds.has(item.target_id));

  const problems = canonicalConcepts.filter((concept) => concept.type === "Problem");
  const artifacts = canonicalConcepts.filter((concept) => concept.type === "Artifact");
  const evaluations = canonicalConcepts.filter((concept) => concept.type === "Evaluation");
  const outputs = canonicalConcepts.filter((concept) => concept.type === "Output Knowledge");
  const researchQuestions = contextConcepts.filter((concept) => concept.type === "ResearchQuestion");
  const theories = contextConcepts.filter((concept) => concept.type === "KernelTheory");
  const limitations = contextConcepts.filter((concept) => concept.type === "Limitation");
  const doi = stringOrNull(indexDocument.frontmatter.doi);
  const paperMetadata = {
    schema_version: SCHEMA_VERSION,
    type: "Paper",
    paper_id: paperId,
    slug,
    title: String(indexDocument.frontmatter.title ?? "Untitled OKF paper"),
    short_title: stringOrNull(indexDocument.frontmatter.short_title) ?? String(indexDocument.frontmatter.title ?? "Untitled OKF paper"),
    authors: stringArray(indexDocument.frontmatter.authors),
    year: numberOrNull(indexDocument.frontmatter.year),
    venue: stringOrNull(indexDocument.frontmatter.venue ?? indexDocument.frontmatter.journal),
    doi,
    doi_url: doi ? `https://doi.org/${doi}` : null,
    source_url: stringOrNull(indexDocument.frontmatter.source_url),
    source_pdf_filename: sourcePdf,
    domain_context: stringOrNull(indexDocument.frontmatter.primary_domain) ?? problems[0]?.title ?? null,
    abstract: null,
    research_problem: problems.map((item) => item.title),
    research_objective: stringArray(indexDocument.frontmatter.research_objective),
    research_questions: researchQuestions.map((item) => item.title),
    artifact_type: stringOrNull(indexDocument.frontmatter.artifact_name) ?? artifacts[0]?.title ?? null,
    blockchain_dlt_role: null,
    methodology: stringOrNull(indexDocument.frontmatter.research_method) ?? theories.find((item) => /method|design science|dsr/i.test(item.title))?.title ?? null,
    theoretical_foundations: theories.map((item) => item.title),
    evaluation_method: evaluations.map((item) => item.title),
    key_contributions: outputs.map((item) => item.title),
    design_knowledge_output: outputs.map((item) => item.title),
    limitations: limitations.map((item) => item.title),
    notes: null,
    extraction_status: "okf_draft",
    review_status: "unreviewed",
    author_check_status: "not_requested",
    reviewed_by: null,
    reviewed_at: null
  };

  const preservedContext = renderPreservedContext(contextConcepts, contextRelations);
  const indexBody = [indexDocument.body.trim(), preservedContext].filter(Boolean).join("\n\n");
  fs.writeFileSync(indexPath, `${renderFrontmatter(paperMetadata)}\n${indexBody}\n`, "utf8");
  fs.writeFileSync(dsrPath, renderConceptFile(paperId, canonicalConcepts, concepts), "utf8");
  fs.writeFileSync(evidencePath, renderEvidenceFile(paperId, canonicalEvidence), "utf8");
  fs.writeFileSync(relationsPath, `${JSON.stringify({ schema_version: SCHEMA_VERSION, paper_id: paperId, relations: canonicalRelations }, null, 2)}\n`, "utf8");
  fs.writeFileSync(aliasesPath, `${JSON.stringify({ schema_version: SCHEMA_VERSION, paper_id: paperId, aliases }, null, 2)}\n`, "utf8");
  fs.writeFileSync(graphPath, `${JSON.stringify({
    schema_version: SCHEMA_VERSION,
    paper_id: paperId,
    title: String(oldGraph.title ?? paperMetadata.title),
    nodes: graphNodes,
    edges: graphEdges,
    recommended_paths: recommendedPaths
  }, null, 2)}\n`, "utf8");

  summary.papers += 1;
  summary.concepts_before += concepts.length;
  summary.concepts_after += canonicalConcepts.length;
  summary.context_records_preserved += contextConcepts.length;
  summary.context_relations_preserved += contextRelations.length;
  summary.relations_before += relationRows.length;
  summary.relations_after += canonicalRelations.length;
  summary.evidence += canonicalEvidence.length;
  summary.recommended_paths += recommendedPaths.length;
}

function parseLegacyConcepts(file: string, paperId: string): LegacyConcept[] {
  const document = readFrontmatterDocument(file);
  const sections = splitLevelTwoSections(document.body);
  return sections.flatMap((section) => {
    const fence = section.content.match(/```ya?ml\s*\r?\n([\s\S]*?)\r?\n```/i);
    if (fence) {
      const row = yamlObject(yaml.load(fence[1]));
      const type = String(row.type ?? "");
      if (!type) return [];
      const rawId = String(row.id ?? row.concept_id ?? section.heading.replace(/^Concept:\s*/i, ""));
      return [{
        id: scoped(paperId, rawId),
        type,
        title: String(row.title ?? titleFromId(rawId)),
        description: String(row.description ?? ""),
        evidence: stringArray(row.evidence),
        confidence: String(row.confidence ?? "low"),
        extraction_type: String(row.extraction_type ?? "explicit"),
        body: section.content.replace(fence[0], "").replace(/^\s*---\s*$/gm, "").trim()
      }];
    }
    const fields = boldFields(section.content);
    const type = String(fields.type ?? "");
    if (!type || (!TYPE_MAP[type] && !CONTEXT_TYPES.has(type))) return [];
    const rawId = section.heading.replace(/^Concept:\s*/i, "").trim();
    return [{
      id: scoped(paperId, rawId),
      type,
      title: String(fields.title ?? titleFromId(rawId)),
      description: proseWithoutBoldFields(section.content),
      evidence: [],
      confidence: String(fields.confidence ?? "low"),
      extraction_type: String(fields.extraction_type ?? "explicit"),
      body: proseWithoutBoldFields(section.content)
    }];
  });
}

function parseLegacyEvidence(file: string, paperId: string, sourcePdf: string | null) {
  const document = readFrontmatterDocument(file);
  return splitLevelTwoSections(document.body).flatMap((section) => {
    const headingId = section.heading.replace(/^Evidence:\s*/i, "").trim();
    if (!/^(?:[A-Z0-9_]+:)?ev[_-]/i.test(headingId)) return [];
    const fence = section.content.match(/```ya?ml\s*\r?\n([\s\S]*?)\r?\n```/i);
    if (fence) {
      const row = yamlObject(yaml.load(fence[1]));
      const rawId = String(row.id ?? row.evidence_id ?? headingId);
      const supports = stringArray(row.supports ?? row.concept_ids ?? row.concept_id);
      const page = row.page_number ?? row.pdf_page ?? row["pdf page"] ?? row["pdf pages"];
      const sectionName = stringOrNull(row.section ?? row.source);
      const sourceLocation = stringOrNull(row.source_location) ?? joinLocation(sourcePdf, page, sectionName);
      return [{
        id: scoped(paperId, rawId),
        supports,
        source_location: sourceLocation,
        quote_or_summary: String(row.quote_or_summary ?? row.quote ?? row.paraphrase ?? "").trim(),
        evidence_type: normalizeEvidenceType(row.quote ? "quote" : row.evidence_type)
      }];
    }
    const fields = boldFields(section.content);
    const body = proseWithoutBoldFields(section.content);
    const location = joinLocation(
      stringOrNull(fields.source) ?? sourcePdf,
      fields.pdf_pages ?? fields.pdf_page ?? fields.page,
      null
    );
    return [{
      id: scoped(paperId, headingId),
      supports: stringArray(fields.supports),
      source_location: location,
      quote_or_summary: body,
      evidence_type: normalizeEvidenceType(fields.evidence_type)
    }];
  });
}

function parseLegacyAliases(file: string, paperId: string) {
  const raw = fs.readFileSync(file, "utf8").replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/, "");
  const document = yamlObject(yaml.load(raw) ?? {});
  const aliases = document.aliases;
  if (Array.isArray(aliases)) {
    return aliases.flatMap((value) => {
      const row = asObject(value);
      const target = row.target_id ?? row.concept_id;
      return target ? [{ target_id: scoped(paperId, String(target)), terms: stringArray(row.terms) }] : [];
    });
  }
  if (!aliases || typeof aliases !== "object") return [];
  return Object.entries(aliases as Record<string, unknown>).flatMap(([target, terms]) => {
    if (target === "paper") return [{ target_id: paperId, terms: stringArray(terms) }];
    return [{ target_id: scoped(paperId, target), terms: stringArray(terms) }];
  });
}

function renderConceptFile(paperId: string, concepts: CanonicalConcept[], legacy: LegacyConcept[]) {
  const bodyById = new Map(legacy.map((item) => [item.id, item.body]));
  const sections = concepts.map((concept) => {
    const body = bodyById.get(concept.id)?.trim();
    return [`## Concept: ${concept.id}`, "", "```json", JSON.stringify(concept, null, 2), "```", body ? `\n### Source-preserved explanation\n\n${body}` : ""].filter(Boolean).join("\n");
  });
  return `${renderFrontmatter({ schema_version: SCHEMA_VERSION, type: "ConceptCollection", paper_id: paperId, extraction_status: "okf_draft", review_status: "unreviewed" })}\n# Canonical DSR Concepts\n\n${sections.join("\n\n---\n\n")}\n`;
}

function renderEvidenceFile(paperId: string, evidence: Array<Record<string, unknown>>) {
  const sections = evidence.map((item) => [`## Evidence: ${item.id}`, "", "```json", JSON.stringify(item, null, 2), "```"].join("\n"));
  return `${renderFrontmatter({ schema_version: SCHEMA_VERSION, type: "EvidenceCollection", paper_id: paperId, extraction_status: "okf_draft", review_status: "unreviewed" })}\n# Canonical Evidence Items\n\n${sections.join("\n\n---\n\n")}\n`;
}

function renderPreservedContext(items: LegacyConcept[], relations: Array<{ id: string; source: string; target: string; predicate: string; evidence: string | null; confidence: string }>) {
  if (!items.length && !relations.length) return "";
  const groups = [
    ["Research questions and objectives", "ResearchQuestion"],
    ["Theoretical foundations", "KernelTheory"],
    ["Limitations", "Limitation"]
  ] as const;
  const sections = groups.flatMap(([heading, type]) => {
    const matching = items.filter((item) => item.type === type);
    if (!matching.length) return [];
    return [[`### ${heading}`, ...matching.map((item) => [
        `#### ${item.id}: ${item.title}`,
        item.description,
        item.body,
        item.evidence.length ? `Evidence: ${item.evidence.join(", ")}` : ""
      ].filter(Boolean).join("\n\n"))]
      .join("\n\n")];
  });
  const contextualLinks = relations.length ? [
    "### Contextual links excluded from the canonical graph",
    "",
    "These source-preserved legacy links touch a research question/objective, theoretical foundation, limitation, or unresolved legacy record. They remain human-readable context only and are not canonical graph edges.",
    "",
    ...relations.map((relation) => `- \`${relation.id}\`: \`${relation.source}\` — **${relation.predicate}** → \`${relation.target}\`${relation.evidence ? `; evidence \`${relation.evidence}\`` : ""}; confidence ${relation.confidence}.`)
  ].join("\n") : "";
  return ["## Preserved paper-level context", "", "These records are retained as paper metadata/prose under `okf-dsr-v1`; they are not canonical seven-layer DSR concepts and do not create canonical graph nodes or edges.", "", ...sections, contextualLinks].filter(Boolean).join("\n");
}

function readFrontmatterDocument(file: string) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return { frontmatter: {}, body: text };
  return { frontmatter: yamlObject(yaml.load(match[1]) ?? {}), body: text.slice(match[0].length) };
}

function splitLevelTwoSections(body: string) {
  const matches = Array.from(body.matchAll(/^(#{1,2})\s+(.+?)\s*$/gm));
  return matches.flatMap((match, index) => match[1].length === 2 ? [{
    heading: match[2].trim(),
    content: body.slice((match.index ?? 0) + match[0].length, matches[index + 1]?.index ?? body.length).trim()
  }] : []);
}

function boldFields(content: string) {
  const fields: Record<string, unknown> = {};
  for (const match of content.matchAll(/^\*\*([^*]+?):\*\*\s*(.*?)\s*$/gm)) {
    fields[match[1].trim().toLowerCase().replace(/\s+/g, "_")] = match[2].trim().replace(/\s{2,}$/, "");
  }
  return fields;
}

function proseWithoutBoldFields(content: string) {
  return content.split(/\r?\n/).filter((line) => !/^\*\*[^*]+?:\*\*/.test(line.trim())).join("\n").replace(/^\s*---\s*$/gm, "").trim();
}

function splitStoredSegments(pathIds: string[], edgePairs: Set<string>) {
  if (pathIds.length < 2) return [];
  const segments: string[][] = [];
  let current = [pathIds[0]];
  for (let index = 1; index < pathIds.length; index += 1) {
    const previous = pathIds[index - 1];
    const next = pathIds[index];
    if (edgePairs.has(`${previous}\u0000${next}`)) current.push(next);
    else {
      if (current.length >= 2) segments.push(current);
      current = [next];
    }
  }
  if (current.length >= 2) segments.push(current);
  return segments;
}

function renderFrontmatter(value: Record<string, unknown>) {
  return `---\n${Object.entries(value).map(([key, item]) => `${key}: ${JSON.stringify(item)}`).join("\n")}\n---\n`;
}

function joinLocation(source: string | null, page: unknown, section: string | null) {
  const parts = [source, page == null ? null : `page ${String(page)}`, section].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function yamlObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asObject(value: unknown): Record<string, unknown> {
  return yamlObject(value);
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (value == null || value === "") return [];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function stringOrNull(value: unknown) {
  if (value == null || value === "") return null;
  return String(value).trim() || null;
}

function numberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function scoped(paperId: string, id: string) {
  const clean = id.trim();
  return clean.includes(":") || clean === paperId ? clean : `${paperId}:${clean}`;
}

function resolveLegacyEvidenceReference(paperId: string, id: string, evidenceIds: Set<string>) {
  const candidate = scoped(paperId, id);
  if (evidenceIds.has(candidate)) return candidate;
  const suffix = candidate.split(":").at(-1)?.replace(/^ev_\d+_/i, "");
  if (!suffix) return null;
  const matches = [...evidenceIds].filter((evidenceId) => evidenceId.split(":").at(-1)?.replace(/^ev_\d+_/i, "") === suffix);
  return matches.length === 1 ? matches[0] : null;
}

function normalizeConfidence(value: unknown) {
  const normalized = String(value ?? "low").toLowerCase();
  return ["high", "medium-high", "medium", "low"].includes(normalized) ? normalized : "low";
}

function normalizeEvidenceType(value: unknown) {
  const normalized = String(value ?? "paraphrase").toLowerCase();
  if (normalized.includes("quote")) return "quote";
  if (normalized.includes("paraphrase")) return "paraphrase";
  return "summary";
}
function normalizeExtractionType(value: unknown) {
  const normalized = String(value ?? "explicit").toLowerCase();
  return ["explicit", "inferred", "explicit-in-artifact"].includes(normalized) ? normalized : "inferred";
}

function titleFromId(id: string) {
  return id.split(":").at(-1)?.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()) ?? id;
}

function triple(source: string, target: string, predicate: string) {
  return `${source}\u0000${target}\u0000${predicate}`;
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function uniqueBy<T>(values: T[], key: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const id = key(value);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
