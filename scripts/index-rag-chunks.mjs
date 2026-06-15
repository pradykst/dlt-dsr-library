import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const embeddingBaseUrl = process.env.EMBEDDING_API_BASE_URL ?? "http://127.0.0.1:1234/v1";
const embeddingApiKey = process.env.EMBEDDING_API_KEY ?? "lm-studio";
const embeddingModel = process.env.EMBEDDING_MODEL ?? "text-embedding-qwen3-embedding-0.6b";
const batchSize = Number.parseInt(process.env.RAG_INDEX_BATCH_SIZE ?? "20", 10);

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const papers = await selectAll("papers", "*");
const elements = await selectAll("elements", "*");
const relations = await selectAll("relations", "*");
const evidence = await selectAll("evidence", "*");

const papersById = new Map(papers.map((paper) => [paper.paper_id, paper]));
const evidenceByPaperAndId = new Map(evidence.map((item) => [`${item.paper_id}:${item.evidence_id}`, item]));
const elementsByPaperAndId = new Map(elements.map((item) => [`${item.paper_id}:${item.element_id}`, item]));

const chunks = [
  ...papers.flatMap(buildPaperChunks),
  ...elements.map(buildElementChunk),
  ...relations.map(buildRelationChunk),
  ...evidence.map(buildEvidenceChunk)
].filter((chunk) => chunk.content.trim().length > 0);

console.log(`Indexing ${chunks.length} RAG chunks from ${papers.length} papers, ${elements.length} elements, ${relations.length} relations, and ${evidence.length} evidence rows.`);

let indexed = 0;
for (let index = 0; index < chunks.length; index += batchSize) {
  const batch = chunks.slice(index, index + batchSize);
  const embedded = await Promise.all(batch.map(async (chunk) => ({
    ...chunk,
    embedding: await createEmbedding(chunk.content)
  })));

  const { error } = await supabase.from("rag_chunks").upsert(embedded, { onConflict: "id" });
  if (error) throw new Error(`rag_chunks upsert failed: ${formatSupabaseError(error)}`);

  indexed += embedded.length;
  console.log(`Indexed ${indexed}/${chunks.length}`);
}

console.log("RAG indexing complete.");

function buildPaperChunks(paper) {
  const title = paperTitle(paper);
  const sections = [
    ["problem", "Problem", paper.problem_description],
    ["input_knowledge", "Input Knowledge", paper.input_knowledge],
    ["research_process", "Research Process", paper.research_process],
    ["key_concepts", "Key Concepts", paper.key_concepts],
    ["solution", "Solution", paper.solution_description],
    ["output_knowledge", "Output Knowledge", paper.output_knowledge],
    ["evaluation", "Evaluation", paper.evaluation_summary],
    ["boundary_conditions", "Boundary Conditions", paper.boundary_conditions]
  ];

  return sections
    .filter(([, , value]) => text(value))
    .map(([sectionKey, label, value]) => ({
      id: deterministicUuid(["paper", paper.paper_id, sectionKey]),
      source_type: "workbench",
      paper_id: paper.paper_id,
      paper_title: title,
      chunk_type: "paper",
      element_id: null,
      element_type: label,
      element_label: label,
      relation_type: null,
      from_element_id: null,
      to_element_id: null,
      evidence_quote: null,
      page_number: null,
      content: [
        `Paper: ${title}`,
        `Section: ${label}`,
        `Content: ${text(value)}`
      ].join("\n"),
      metadata: {
        source_table: "papers",
        field: sectionKey,
        authors: paper.authors,
        year: paper.year,
        domain: paper.domain,
        artifact_type: paper.artifact_type,
        doi_or_url: paper.doi_or_url
      }
    }));
}

function buildElementChunk(element) {
  const paper = papersById.get(element.paper_id);
  const title = paperTitle(paper, element.paper_id);
  const evidenceRow = evidenceByPaperAndId.get(`${element.paper_id}:${element.source_quote_id}`);
  const evidenceQuote = text(evidenceRow?.exact_quote_or_description);

  return {
    id: deterministicUuid(["element", element.paper_id, element.element_id]),
    source_type: "workbench",
    paper_id: element.paper_id,
    paper_title: title,
    chunk_type: "element",
    element_id: element.element_id,
    element_type: element.element_type,
    element_label: element.short_label ?? element.element_name,
    relation_type: null,
    from_element_id: null,
    to_element_id: null,
    evidence_quote: evidenceQuote,
    page_number: parsePageNumber(evidenceRow?.page ?? element.page_or_section),
    content: compactLines([
      `Paper: ${title}`,
      `Element ID: ${element.element_id}`,
      `Element type: ${element.element_type}`,
      `Element label: ${element.element_name ?? element.short_label}`,
      `Element text: ${element.element_text}`,
      `Normalized text: ${element.normalized_text}`,
      `Linked problem: ${element.linked_problem_id}`,
      `Linked requirement: ${element.linked_requirement_id}`,
      `Linked principle: ${element.linked_principle_id}`,
      `Kernel theory or rationale: ${element.kernel_theory_or_rationale}`,
      `Evaluation support: ${element.evaluation_support}`,
      `Evidence: ${evidenceQuote}`
    ]),
    metadata: {
      source_table: "elements",
      source_quote_id: element.source_quote_id,
      page_or_section: element.page_or_section,
      source_status: element.source_status,
      confidence: element.confidence,
      review_status: element.review_status
    }
  };
}

function buildRelationChunk(relation) {
  const paper = papersById.get(relation.paper_id);
  const title = paperTitle(paper, relation.paper_id);
  const source = elementsByPaperAndId.get(`${relation.paper_id}:${relation.source_node_id}`);
  const target = elementsByPaperAndId.get(`${relation.paper_id}:${relation.target_node_id}`);
  const evidenceRow = evidenceByPaperAndId.get(`${relation.paper_id}:${relation.evidence_id}`);
  const evidenceQuote = text(evidenceRow?.exact_quote_or_description);

  return {
    id: deterministicUuid(["relation", relation.paper_id, relation.relation_id]),
    source_type: "workbench",
    paper_id: relation.paper_id,
    paper_title: title,
    chunk_type: "relation",
    element_id: relation.relation_id,
    element_type: "Relation",
    element_label: `${relation.source_node_id} ${relation.relation_type ?? "relates_to"} ${relation.target_node_id}`,
    relation_type: relation.relation_type,
    from_element_id: relation.source_node_id,
    to_element_id: relation.target_node_id,
    evidence_quote: evidenceQuote,
    page_number: parsePageNumber(evidenceRow?.page),
    content: compactLines([
      `Paper: ${title}`,
      `Relation ID: ${relation.relation_id}`,
      `Relation type: ${relation.relation_type}`,
      `From: ${relation.source_node_id} (${relation.source_node_type ?? source?.element_type}) ${source?.short_label ?? source?.element_name ?? ""}`,
      `To: ${relation.target_node_id} (${relation.target_node_type ?? target?.element_type}) ${target?.short_label ?? target?.element_name ?? ""}`,
      `Evidence ID: ${relation.evidence_id}`,
      `Evidence: ${evidenceQuote}`
    ]),
    metadata: {
      source_table: "relations",
      relation_id: relation.relation_id,
      evidence_id: relation.evidence_id,
      source_status: relation.source_status,
      confidence: relation.confidence,
      diagram_include: relation.diagram_include,
      diagram_view: relation.diagram_view,
      review_status: relation.review_status
    }
  };
}

function buildEvidenceChunk(evidenceRow) {
  const paper = papersById.get(evidenceRow.paper_id);
  const title = paperTitle(paper, evidenceRow.paper_id);

  return {
    id: deterministicUuid(["evidence", evidenceRow.paper_id, evidenceRow.evidence_id]),
    source_type: "workbench",
    paper_id: evidenceRow.paper_id,
    paper_title: title,
    chunk_type: "evidence",
    element_id: evidenceRow.evidence_id,
    element_type: "Evidence",
    element_label: evidenceRow.evidence_type,
    relation_type: null,
    from_element_id: null,
    to_element_id: null,
    evidence_quote: evidenceRow.exact_quote_or_description,
    page_number: parsePageNumber(evidenceRow.page),
    content: compactLines([
      `Paper: ${title}`,
      `Evidence ID: ${evidenceRow.evidence_id}`,
      `Evidence type: ${evidenceRow.evidence_type}`,
      `Quote or description: ${evidenceRow.exact_quote_or_description}`,
      `Page: ${evidenceRow.page}`,
      `Section: ${evidenceRow.section}`,
      `Elements supported: ${evidenceRow.element_ids_supported}`,
      `Relations supported: ${evidenceRow.relation_ids_supported}`,
      `Citation note: ${evidenceRow.citation_note}`
    ]),
    metadata: {
      source_table: "evidence",
      evidence_id: evidenceRow.evidence_id,
      section: evidenceRow.section,
      element_ids_supported: evidenceRow.element_ids_supported,
      relation_ids_supported: evidenceRow.relation_ids_supported,
      source_status: evidenceRow.source_status,
      evidence_strength: evidenceRow.evidence_strength
    }
  };
}

async function selectAll(table, columns) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`${table} select failed: ${formatSupabaseError(error)}`);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

async function createEmbedding(input) {
  const response = await fetch(`${embeddingBaseUrl.replace(/\/$/, "")}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${embeddingApiKey}`
    },
    body: JSON.stringify({
      model: embeddingModel,
      input
    })
  });

  if (!response.ok) {
    throw new Error(`Embedding request failed (${response.status}): ${await response.text()}`);
  }

  const payload = await response.json();
  const embedding = payload?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Embedding response did not include a vector.");
  }
  return embedding;
}

function deterministicUuid(parts) {
  const hash = createHash("sha256").update(parts.join(":")).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.toString("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` || randomUUID();
}

function paperTitle(paper, fallback = "Untitled paper") {
  return text(paper?.short_title) ?? text(paper?.full_citation) ?? fallback;
}

function compactLines(lines) {
  return lines.filter((line) => !line.endsWith(": null") && !line.endsWith(": undefined") && !line.endsWith(": ")).join("\n");
}

function text(value) {
  if (typeof value !== "string") return value == null ? null : String(value);
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parsePageNumber(value) {
  const match = text(value)?.match(/\d+/);
  if (!match) return null;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatSupabaseError(error) {
  return [error.message, error.details, error.hint, error.code].filter(Boolean).join(" ");
}

function loadEnvFile(filename) {
  const filePath = resolve(process.cwd(), filename);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [rawKey, ...rawValueParts] = trimmed.split("=");
    const key = rawKey.trim();
    const rawValue = rawValueParts.join("=").trim();
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
