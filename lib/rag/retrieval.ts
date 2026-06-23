import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";
import type { RagChunk, RagFilters, RagQueryPlan, RagQueryType, RagRetrievalIntent, RagSource } from "@/lib/rag/types";

const RAG_SELECT = [
  "id",
  "source_type",
  "paper_id",
  "paper_title",
  "chunk_type",
  "element_id",
  "element_type",
  "element_label",
  "relation_type",
  "from_element_id",
  "to_element_id",
  "evidence_quote",
  "page_number",
  "content",
  "metadata"
].join(",");

export type DesignFeatureQuery = {
  kind: "design_feature";
  term: string;
};

export async function matchRagChunks(queryEmbedding: number[], filters: RagFilters) {
  const matchCount = Number.parseInt(process.env.RAG_MATCH_COUNT ?? "8", 10);
  const { data, error } = await getSupabaseAdmin().rpc("match_rag_chunks", {
    query_embedding: queryEmbedding,
    match_count: Number.isFinite(matchCount) ? matchCount : 8,
    filter_json: filters
  });

  if (error) throw error;
  return normalizeChunks(data);
}

export function classifyDesignFeatureQuery(question: string): DesignFeatureQuery | null {
  const patterns = [
    /which\s+papers\s+(?:use|used|include|included|have)\s+(.+?)\s+as\s+(?:a\s+)?design\s+feature/i,
    /(?:use|using|used)\s+(.+?)\s+as\s+(?:a\s+)?design\s+feature/i
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    const term = cleanQueryTerm(match?.[1]);
    if (term) return { kind: "design_feature", term };
  }

  return null;
}

export function planRagQuery(question: string, filters: RagFilters): RagQueryPlan {
  const lowerQuestion = question.toLowerCase();
  const queryType = classifyQueryType(question);
  const designFeatureQuery = classifyDesignFeatureQuery(question);
  const intents = new Set<RagRetrievalIntent>();
  const searchTerms: string[] = [];
  let requestedElementType = filters.element_type;

  if (designFeatureQuery) {
    intents.add("design_feature_lookup");
    intents.add("element_lookup");
    intents.add("relation_traversal");
    searchTerms.push(designFeatureQuery.term);
    requestedElementType = "Design Feature";
  }

  if (/\brequirements?\b/i.test(question)) {
    intents.add("requirement_lookup");
    intents.add("element_lookup");
    requestedElementType = requestedElementType ?? "Design Requirement";
  }
  if (/\bevaluation|evaluated|method\b/i.test(question)) intents.add("evaluation_summary");
  if (/\bcompare|across papers|cross-paper|across the library\b/i.test(lowerQuestion)) intents.add("cross_paper_comparison");
  if (/\brelation|linked|maps?|connects?|instantiated_by|implemented_in|supports|depends_on\b/i.test(lowerQuestion)) intents.add("relation_traversal");
  if (/\bpaper\b|\bpapers\b/i.test(question)) intents.add("paper_lookup");
  intents.add("generic_semantic_search");

  for (const token of extractQuotedTerms(question)) searchTerms.push(token);
  for (const token of extractElementIds(question)) searchTerms.push(token);
  if (searchTerms.length === 0) searchTerms.push(...extractKeywordTerms(question));

  return {
    queryType,
    intents: [...intents],
    searchTerms: unique(searchTerms).slice(0, 6),
    requestedElementType,
    paperIdOrTitle: filters.paper_id,
    relationType: extractRelationType(question),
    relationDirection: "any",
    explicitLabelsOnly: /\bexplicit|explicitly|labeled|labelled|as a design feature\b/i.test(question)
  };
}

function classifyQueryType(question: string): RagQueryType {
  const lowerQuestion = question.toLowerCase();
  if (/\bcompare|versus| vs\.? |difference|similarities\b/i.test(lowerQuestion)) return "comparison";
  if (/\bflow|path|relation|linked|maps?|connects?|instantiated_by|implemented_in|supports|depends_on\b/i.test(lowerQuestion)) return "relation_path_explanation";
  if (/\bhow many\b|\bnumber of\b|\bcount\b/i.test(lowerQuestion) && /\bpaper|papers\b/i.test(lowerQuestion)) return "corpus_count";
  if (/\bsummary|summarize|overview|tell me about\b/i.test(lowerQuestion)) return "paper_summary";
  if (/\bdesign principles?\b/i.test(lowerQuestion)) return "design_principle_lookup";
  if (/\bdesign features?\b|\buse|uses|used|include|includes|including\b/i.test(lowerQuestion)) return "concept_design_feature_lookup";
  if (/\bevidence|quote|source|citation\b/i.test(lowerQuestion)) return "evidence_search";
  if (/\bpaper|papers\b/i.test(lowerQuestion)) return "paper_lookup";
  return "general_synthesis";
}
export async function lookupPaperMetadataChunks(terms: string[], filters: RagFilters) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("papers")
    .select("paper_id,short_title,full_citation,year,authors,domain,artifact_type,blockchain_dlt_role,key_concepts,solution_description,output_knowledge,evaluation_summary,boundary_conditions")
    .limit(200);
  if (filters.paper_id) query = query.eq("paper_id", filters.paper_id);

  const { data, error } = await query;
  if (error) throw error;

  const rows: Record<string, unknown>[] = Array.isArray(data)
    ? data.filter((row) => Boolean(row) && typeof row === "object").map((row) => row as Record<string, unknown>)
    : [];
  const normalizedTerms = terms.map(normalizeLabel).filter((term) => term.length > 0);
  const matchedRows = rows
    .map((row) => ({ row, score: scorePaperMetadata(row, normalizedTerms) }))
    .filter(({ score }) => normalizedTerms.length === 0 || score > 0)
    .sort((a, b) => b.score - a.score);

  return matchedRows.map(({ row, score }, index) => {
    const paperId = asString(row.paper_id);
    const title = asString(row.short_title) ?? asString(row.full_citation) ?? paperId ?? "Untitled paper";
    const role = asString(row.blockchain_dlt_role);
    const content = compactLines([
      `Paper: ${title}`,
      `Paper ID: ${paperId}`,
      `Year: ${asString(row.year)}`,
      `Authors: ${asString(row.authors)}`,
      `Domain: ${asString(row.domain)}`,
      `Artifact type: ${asString(row.artifact_type)}`,
      `Blockchain/DLT role: ${role}`,
      `Key concepts: ${asString(row.key_concepts)}`,
      `Solution: ${asString(row.solution_description)}`,
      `Output knowledge: ${asString(row.output_knowledge)}`,
      `Evaluation: ${asString(row.evaluation_summary)}`,
      `Boundary conditions: ${asString(row.boundary_conditions)}`
    ]);

    return {
      id: `paper-metadata-${paperId ?? index}`,
      source_type: "workbench",
      paper_id: paperId,
      paper_title: title,
      chunk_type: "paper",
      element_id: paperId,
      element_type: "Paper metadata",
      element_label: title,
      relation_type: null,
      from_element_id: null,
      to_element_id: null,
      evidence_quote: role || asString(row.key_concepts),
      page_number: null,
      content,
      metadata: {
        source_table: "papers",
        year: asString(row.year),
        domain: asString(row.domain),
        artifact_type: asString(row.artifact_type),
        blockchain_dlt_role: role
      },
      retrievalKind: "explicit" as const,
      retrievalScore: 120 + score,
      matchReason: normalizedTerms.length
        ? `Paper metadata matches ${normalizedTerms.join(", ")}`
        : "Paper metadata row from the corpus"
    } satisfies RagChunk;
  });
}
export async function lookupDesignFeatureChunks(term: string, filters: RagFilters) {
  return lookupElementChunks(term, { ...filters, element_type: "Design Feature" }, true);
}

export async function lookupElementChunks(term: string, filters: RagFilters, explicitLabelOnly = false) {
  const supabase = getSupabaseAdmin();
  const pattern = ilikePattern(term);
  let query = supabase
    .from("rag_chunks")
    .select(RAG_SELECT)
    .eq("chunk_type", "element")
    .ilike("element_label", pattern)
    .limit(20);

  if (filters.element_type) query = query.ilike("element_type", `%${filters.element_type}%`);
  query = applyFilters(query, filters);
  const { data, error } = await query;
  if (error) throw error;

  return normalizeChunks(data)
    .filter((chunk) => !explicitLabelOnly || isExplicitElementMatch(chunk, term))
    .map((chunk) => ({
      ...chunk,
      retrievalKind: "explicit" as const,
      retrievalScore: scoreChunk(chunk, term, [], "explicit")
    }));
}

export async function lookupExactLabelChunks(terms: string[], filters: RagFilters) {
  const chunks: RagChunk[] = [];
  for (const term of terms) {
    const supabase = getSupabaseAdmin();
    const pattern = ilikePattern(term);
    let query = supabase
      .from("rag_chunks")
      .select(RAG_SELECT)
      .eq("chunk_type", "element")
      .or(`element_label.ilike.${pattern},content.ilike.${pattern}`)
      .limit(30);
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;

    chunks.push(...normalizeChunks(data)
      .filter((chunk) => isExplicitElementMatch(chunk, term) || labelMatches(chunk, term))
      .map((chunk) => ({
        ...chunk,
        retrievalKind: isExplicitElementMatch(chunk, term) ? "explicit" as const : "related" as const,
        retrievalScore: scoreChunk(chunk, term, [], isExplicitElementMatch(chunk, term) ? "explicit" : "related"),
        matchReason: isExplicitElementMatch(chunk, term) ? `Normalized label match for "${term}"` : `Label/content match for "${term}"`
      })));
  }
  return dedupeChunks(chunks);
}
export async function lookupRelatedDesignFeatureChunks(term: string, filters: RagFilters, explicitChunks: RagChunk[] = []) {
  return lookupRelatedElementChunks(term, { ...filters, element_type: "Design Feature" }, explicitChunks);
}

export async function lookupRelatedElementChunks(term: string, filters: RagFilters, explicitChunks: RagChunk[] = []) {
  const supabase = getSupabaseAdmin();
  const pattern = ilikePattern(term);
  const explicitIds = new Set(explicitChunks.map((chunk) => chunk.id));
  let query = supabase
    .from("rag_chunks")
    .select(RAG_SELECT)
    .eq("chunk_type", "element")
    .or(`element_label.ilike.${pattern},content.ilike.${pattern},evidence_quote.ilike.${pattern}`)
    .limit(20);

  if (filters.element_type) query = query.ilike("element_type", `%${filters.element_type}%`);
  query = applyFilters(query, filters);
  const { data, error } = await query;
  if (error) throw error;

  return normalizeChunks(data)
    .filter((chunk) => !explicitIds.has(chunk.id))
    .filter((chunk) => !isExplicitElementMatch(chunk, term))
    .map((chunk) => ({
      ...chunk,
      retrievalKind: "related" as const,
      retrievalScore: scoreChunk(chunk, term, [], "related")
    }));
}

export async function lookupKeywordChunks(terms: string[], filters: RagFilters) {
  const supabase = getSupabaseAdmin();
  const chunks: RagChunk[] = [];

  for (const term of terms) {
    const pattern = ilikePattern(term);
    let query = supabase
      .from("rag_chunks")
      .select(RAG_SELECT)
      .or(`element_label.ilike.${pattern},content.ilike.${pattern},evidence_quote.ilike.${pattern},paper_title.ilike.${pattern},element_id.ilike.${pattern}`)
      .limit(20);
    query = applyFilters(query, filters);
    const { data, error } = await query;
    if (error) throw error;
    chunks.push(...normalizeChunks(data).map((chunk) => ({
      ...chunk,
      retrievalKind: chunk.retrievalKind ?? "related" as const,
      retrievalScore: scoreChunk(chunk, term, [], chunk.retrievalKind ?? "related")
    })));
  }

  return dedupeChunks(chunks);
}

export async function lookupDirectSupportChunks(explicitChunks: RagChunk[], term: string, filters: RagFilters) {
  const elementIds = unique(explicitChunks.map((chunk) => chunk.element_id).filter(Boolean));
  const paperIds = unique(explicitChunks.map((chunk) => chunk.paper_id).filter(Boolean));
  if (elementIds.length === 0 || paperIds.length === 0) return [];

  const supabase = getSupabaseAdmin();
  const relationQuery = applyFilters(
    supabase
      .from("rag_chunks")
      .select(RAG_SELECT)
      .eq("chunk_type", "relation")
      .in("paper_id", paperIds)
      .limit(50),
    filters
  );
  const evidenceQuery = applyFilters(
    supabase
      .from("rag_chunks")
      .select(RAG_SELECT)
      .eq("chunk_type", "evidence")
      .in("paper_id", paperIds)
      .limit(50),
    filters
  );

  const [relationsResult, evidenceResult] = await Promise.all([relationQuery, evidenceQuery]);
  if (relationsResult.error) throw relationsResult.error;
  if (evidenceResult.error) throw evidenceResult.error;

  const relations = normalizeChunks(relationsResult.data)
    .filter((chunk) => relationTouchesElement(chunk, elementIds))
    .filter((chunk) => mentionsTermOrElement(chunk, term, elementIds))
    .map((chunk) => ({
      ...chunk,
      retrievalKind: "direct_relation" as const,
      retrievalScore: scoreChunk(chunk, term, elementIds, "direct_relation")
    }));

  const evidence = normalizeChunks(evidenceResult.data)
    .filter((chunk) => mentionsTermOrElement(chunk, term, elementIds))
    .map((chunk) => ({
      ...chunk,
      retrievalKind: "evidence" as const,
      retrievalScore: scoreChunk(chunk, term, elementIds, "evidence")
    }));

  return [...relations, ...evidence];
}

export async function lookupRelationFlowChunks(terms: string[], filters: RagFilters) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("rag_chunks")
    .select(RAG_SELECT)
    .in("chunk_type", ["relation", "element", "evidence"])
    .limit(120);
  query = applyFilters(query, filters);

  const { data, error } = await query;
  if (error) throw error;

  const normalizedTerms = terms.map(normalizeLabel).filter(Boolean);
  return normalizeChunks(data)
    .map((chunk) => ({
      ...chunk,
      retrievalKind: chunk.chunk_type === "relation" ? "direct_relation" as const : chunk.chunk_type === "evidence" ? "evidence" as const : "related" as const,
      retrievalScore: scoreRelationFlowChunk(chunk, normalizedTerms),
      matchReason: chunk.chunk_type === "relation"
        ? "Relation-flow retrieval from matched paper/context"
        : "Element/evidence retrieved to explain the relation flow"
    }))
    .filter((chunk) => (chunk.retrievalScore ?? 0) > 0)
    .sort((a, b) => (b.retrievalScore ?? 0) - (a.retrievalScore ?? 0));
}
export async function lookupRelationExpansionChunks(seedChunks: RagChunk[], filters: RagFilters) {
  const elementIds = unique(seedChunks.map((chunk) => chunk.element_id).filter(Boolean));
  const paperIds = unique(seedChunks.map((chunk) => chunk.paper_id).filter(Boolean));
  if (elementIds.length === 0 || paperIds.length === 0) return [];

  const supabase = getSupabaseAdmin();
  const relationQuery = applyFilters(
    supabase
      .from("rag_chunks")
      .select(RAG_SELECT)
      .eq("chunk_type", "relation")
      .in("paper_id", paperIds)
      .limit(80),
    filters
  );
  const evidenceQuery = applyFilters(
    supabase
      .from("rag_chunks")
      .select(RAG_SELECT)
      .eq("chunk_type", "evidence")
      .in("paper_id", paperIds)
      .limit(80),
    filters
  );

  const [relationsResult, evidenceResult] = await Promise.all([relationQuery, evidenceQuery]);
  if (relationsResult.error) throw relationsResult.error;
  if (evidenceResult.error) throw evidenceResult.error;

  const relations = normalizeChunks(relationsResult.data)
    .filter((chunk) => relationTouchesElement(chunk, elementIds))
    .map((chunk) => ({
      ...chunk,
      retrievalKind: "direct_relation" as const,
      retrievalScore: scoreChunk(chunk, "", elementIds, "direct_relation"),
      matchReason: "Relation-aware expansion from a matched element"
    }));

  const evidence = normalizeChunks(evidenceResult.data)
    .filter((chunk) => elementIds.some((id) => lower(chunk.content).includes(lower(id))))
    .map((chunk) => ({
      ...chunk,
      retrievalKind: "evidence" as const,
      retrievalScore: scoreChunk(chunk, "", elementIds, "evidence"),
      matchReason: "Evidence expansion from a matched element"
    }));

  return dedupeChunks([...relations, ...evidence]);
}
export function curateRetrievedChunks(chunks: RagChunk[], options?: { term?: string; explicitElementIds?: string[] }) {
  const term = options?.term ?? "";
  const explicitElementIds = options?.explicitElementIds ?? [];
  const sourceLimit = numberFromEnv("RAG_SOURCE_LIMIT", 5);

  return dedupeChunks(chunks)
    .filter((chunk) => keepChunk(chunk, term, explicitElementIds))
    .map((chunk) => ({
      ...chunk,
      retrievalScore: chunk.retrievalScore ?? scoreChunk(chunk, term, explicitElementIds, chunk.retrievalKind)
    }))
    .sort((a, b) => (b.retrievalScore ?? 0) - (a.retrievalScore ?? 0))
    .slice(0, sourceLimit);
}

export function curateDesignFeatureQueryChunks(chunks: {
  explicitMatches: RagChunk[];
  directRelations: RagChunk[];
  relatedMatches: RagChunk[];
}) {
  const sourceLimit = numberFromEnv("RAG_SOURCE_LIMIT", 5);
  const explicitMatches = sortByScore(chunks.explicitMatches);
  const relatedMatches = sortByScore(chunks.relatedMatches);
  const reservedRelatedSlots = Math.min(relatedMatches.length, 2);
  const remainingAfterExplicit = Math.max(0, sourceLimit - explicitMatches.length);
  const directLimit = Math.max(0, remainingAfterExplicit - reservedRelatedSlots);
  const directRelations = sortByScore(chunks.directRelations).slice(0, directLimit);

  return dedupeChunks([
    ...explicitMatches,
    ...directRelations,
    ...relatedMatches
  ]).slice(0, sourceLimit);
}

export function toRagSources(chunks: RagChunk[]): RagSource[] {
  return chunks.map((chunk, index) => ({
    sourceIndex: index + 1,
    sourceId: `S${index + 1}`,
    paperId: chunk.paper_id,
    paperTitle: chunk.paper_title || chunk.paper_id || "Untitled paper",
    chunkType: chunk.chunk_type,
    elementId: chunk.element_id,
    elementType: chunk.element_type,
    elementLabel: chunk.element_label,
    relationType: chunk.relation_type,
    fromElementId: chunk.from_element_id,
    toElementId: chunk.to_element_id,
    evidenceQuote: chunk.evidence_quote,
    pageNumber: chunk.page_number,
    retrievalKind: chunk.retrievalKind,
    matchReason: chunk.matchReason,
    matchStrength: chunk.retrievalScore,
    snippet: truncate(chunk.evidence_quote || chunk.content, 260)
  }));
}

export function formatRetrievedContext(chunks: RagChunk[], maxContentChars = numberFromEnv("RAG_CHUNK_MAX_CHARS", 1200)) {
  if (chunks.length === 0) return "No retrieved context.";

  return chunks.map((chunk, index) => {
    const relation = chunk.relation_type
      ? `Relation: ${chunk.relation_type} (${chunk.from_element_id ?? "unknown"} -> ${chunk.to_element_id ?? "unknown"})`
      : "Relation: none stated";
    const relationDirection = chunk.relation_type
      ? `Direction statement: The workbench maps ${chunk.from_element_id ?? "unknown"} to ${chunk.to_element_id ?? "unknown"} via ${chunk.relation_type}.`
      : null;
    const evidence = chunk.evidence_quote ? `Evidence: ${chunk.evidence_quote}` : "Evidence: none provided";
    const page = chunk.page_number ? `Page: ${chunk.page_number}` : "Page: not available";

    return [
      `[S${index + 1}]`,
      `Paper: ${chunk.paper_title || chunk.paper_id || "Untitled paper"}`,
      `Chunk type: ${chunk.chunk_type ?? "unknown"}`,
      `Element: ${chunk.element_type ?? "unknown"} ${chunk.element_id ?? ""} ${chunk.element_label ? `- ${chunk.element_label}` : ""}`.trim(),
      `Match kind: ${chunk.retrievalKind ?? "related"}`,
      relation,
      relationDirection,
      page,
      evidence,
      `Content: ${truncate(chunk.content, maxContentChars)}`
    ].join("\n");
  }).join("\n\n");
}

export function formatQueryPlan(plan: RagQueryPlan) {
  return [
    `Query type: ${plan.queryType}`,
    `Intents: ${plan.intents.join(", ")}`,
    `Search terms: ${plan.searchTerms.length ? plan.searchTerms.join(", ") : "none"}`,
    `Requested element type: ${plan.requestedElementType ?? "none"}`,
    `Paper filter: ${plan.paperIdOrTitle ?? "none"}`,
    `Relation type: ${plan.relationType ?? "none"}`,
    `Relation direction: ${plan.relationDirection ?? "any"}`,
    `Explicit labels requested: ${plan.explicitLabelsOnly ? "yes" : "no"}`
  ].join("\n");
}

function normalizeChunks(data: unknown): RagChunk[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: asString(item.id) ?? crypto.randomUUID(),
      source_type: asString(item.source_type),
      paper_id: asString(item.paper_id),
      paper_title: asString(item.paper_title),
      chunk_type: asString(item.chunk_type),
      element_id: asString(item.element_id),
      element_type: asString(item.element_type),
      element_label: asString(item.element_label),
      relation_type: asString(item.relation_type),
      from_element_id: asString(item.from_element_id),
      to_element_id: asString(item.to_element_id),
      evidence_quote: asString(item.evidence_quote),
      page_number: asNumber(item.page_number),
      content: asString(item.content) ?? "",
      metadata: asMetadata(item.metadata),
      similarity: asNumber(item.similarity),
      distance: asNumber(item.distance),
      retrievalKind: asRetrievalKind(item.retrievalKind),
      retrievalScore: asNumber(item.retrievalScore) ?? undefined
    }))
    .filter((chunk) => chunk.content.trim().length > 0);
}

function applyFilters<T extends {
  eq: (column: string, value: string) => T;
}>(query: T, filters: RagFilters) {
  let next = query;
  if (filters.paper_id) next = next.eq("paper_id", filters.paper_id);
  if (filters.element_type) next = next.eq("element_type", filters.element_type);
  if (filters.chunk_type) next = next.eq("chunk_type", filters.chunk_type);
  return next;
}

function scoreRelationFlowChunk(chunk: RagChunk, terms: string[]) {
  let score = 0;
  const text = normalizeLabel(`${chunk.element_type ?? ""} ${chunk.element_label ?? ""} ${chunk.content} ${chunk.evidence_quote ?? ""}`);
  if (chunk.chunk_type === "relation") score += 120;
  if (chunk.chunk_type === "element") score += 60;
  if (chunk.chunk_type === "evidence") score += 45;
  if (chunk.relation_type) score += 35;
  if (chunk.relation_type === "instantiated_by") score += 90;
  if (chunk.relation_type === "implemented_in") score += 60;
  if (chunk.relation_type === "addressed_by" || chunk.relation_type === "derived_from") score += 35;
  if (/^DP\d+/i.test(chunk.from_element_id ?? "") || /^DP\d+/i.test(chunk.to_element_id ?? "")) score += 35;
  if (/^DF\d+/i.test(chunk.from_element_id ?? "") || /^DF\d+/i.test(chunk.to_element_id ?? "")) score += 45;
  if (/design principle|design feature|design requirement|requirement|artifact|output|problem/.test(normalizeLabel(chunk.element_type))) score += 25;
  for (const term of terms) {
    if (containsFullPhrase(text, term)) score += 18;
  }
  return score;
}
function scorePaperMetadata(row: Record<string, unknown>, terms: string[]) {
  if (terms.length === 0) return 1;
  const titleText = normalizeLabel([row.short_title, row.full_citation].map((value) => typeof value === "string" || typeof value === "number" ? String(value) : "").join(" "));
  const fieldText = normalizeLabel([
    row.short_title,
    row.full_citation,
    row.domain,
    row.artifact_type,
    row.blockchain_dlt_role,
    row.key_concepts,
    row.solution_description,
    row.output_knowledge,
    row.evaluation_summary,
    row.boundary_conditions
  ].map((value) => typeof value === "string" || typeof value === "number" ? String(value) : "").join(" "));

  return terms.reduce((score, term) => {
    if (!term) return score;
    if (containsFullPhrase(titleText, term)) score += 45;
    else if (containsFullPhrase(fieldText, term)) score += 20;

    const tokens = term.split(/\s+/).filter((token) => token.length > 2 && !isPaperHintStopword(token));
    const titleHits = tokens.filter((token) => containsFullPhrase(titleText, token)).length;
    const fieldHits = tokens.filter((token) => containsFullPhrase(fieldText, token)).length;
    if (tokens.length > 0) {
      score += titleHits * 12;
      score += fieldHits * 4;
      if (titleHits >= Math.min(2, tokens.length)) score += 20;
    }
    return score;
  }, 0);
}

function isPaperHintStopword(value: string) {
  return ["paper", "study", "article", "the", "about", "with", "using", "based"].includes(value);
}

function compactLines(lines: string[]) {
  return lines.filter((line) => !line.endsWith(": null") && !line.endsWith(": undefined") && !line.endsWith(": ")).join("\n");
}
function cleanQueryTerm(value: string | undefined) {
  const cleaned = value
    ?.replace(/[?!.]+$/g, "")
    .replace(/^["']|["']$/g, "")
    .trim();
  return cleaned || null;
}

function ilikePattern(value: string) {
  return `%${value.replace(/[%,]/g, " ").replace(/\s+/g, " ").trim()}%`;
}

function keepChunk(chunk: RagChunk, term: string, explicitElementIds: string[]) {
  if (!term) return chunk.chunk_type !== "paper" || Boolean(chunk.similarity);
  if (chunk.retrievalKind === "explicit" || chunk.retrievalKind === "evidence") return true;
  if (chunk.retrievalKind === "direct_relation") return relationTouchesElement(chunk, explicitElementIds) && mentionsTermOrElement(chunk, term, explicitElementIds);
  if (chunk.chunk_type === "relation") return relationTouchesElement(chunk, explicitElementIds) && mentionsTermOrElement(chunk, term, explicitElementIds);
  if (chunk.chunk_type === "paper") return !explicitElementIds.length && textMatches(chunk, term);
  return textMatches(chunk, term);
}

function scoreChunk(chunk: RagChunk, term: string, explicitElementIds: string[], kind = chunk.retrievalKind) {
  let score = 0;
  if (typeof chunk.similarity === "number") score += chunk.similarity * 10;
  if (typeof chunk.distance === "number") score += Math.max(0, 10 - chunk.distance);

  if (kind === "explicit") score += 100;
  if (kind === "direct_relation") score += 80;
  if (kind === "evidence") score += 55;
  if (kind === "related") score += 40;
  if (kind === "semantic") score += 25;

  if (isDesignFeature(chunk)) score += 35;
  if (term && labelMatches(chunk, term)) score += 35;
  if (term && textMatches(chunk, term)) score += 15;
  if (explicitElementIds.includes(chunk.element_id ?? "")) score += 20;
  if (relationTouchesElement(chunk, explicitElementIds)) score += 20;
  if (chunk.chunk_type === "paper") score -= 30;
  if (chunk.chunk_type === "relation" && !relationTouchesElement(chunk, explicitElementIds)) score -= 30;

  return score;
}

function isDesignFeature(chunk: RagChunk) {
  return lower(chunk.element_type).includes("design feature");
}

function isExplicitElementMatch(chunk: RagChunk, term: string) {
  if (chunk.chunk_type !== "element") return false;
  const label = normalizeLabel(chunk.element_label);
  const normalizedTerm = normalizeLabel(term);
  if (!label || !normalizedTerm) return false;
  if (label === normalizedTerm) return true;
  if (containsFullPhrase(label, normalizedTerm)) return true;
  return normalizedTerm.length >= 6 && label.length >= 6 && containsFullPhrase(normalizedTerm, label);
}

export function normalizeLabel(value: string | null | undefined) {
  const normalized = value
    ?.toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(safeSingularize)
    .join(" ")
    .trim();
  return normalized ?? "";
}

function containsFullPhrase(value: string, phrase: string) {
  return new RegExp(`(^|\\s)${escapeRegExp(phrase)}($|\\s)`).test(value);
}

function safeSingularize(value: string) {
  if (value.length <= 4) return value;
  if (value.endsWith("ies")) return `${value.slice(0, -3)}y`;
  if (value.endsWith("s") && !value.endsWith("ss")) return value.slice(0, -1);
  return value;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function labelMatches(chunk: RagChunk, term: string) {
  return lower(chunk.element_label).includes(lower(term));
}

function textMatches(chunk: RagChunk, term: string) {
  const needle = lower(term);
  return [
    chunk.element_label,
    chunk.content,
    chunk.evidence_quote
  ].some((value) => lower(value).includes(needle));
}

function mentionsTermOrElement(chunk: RagChunk, term: string, elementIds: string[]) {
  if (term && textMatches(chunk, term)) return true;
  return elementIds.some((id) => lower(chunk.content).includes(lower(id)) || chunk.from_element_id === id || chunk.to_element_id === id);
}

function relationTouchesElement(chunk: RagChunk, elementIds: string[]) {
  if (elementIds.length === 0) return false;
  return elementIds.includes(chunk.from_element_id ?? "") || elementIds.includes(chunk.to_element_id ?? "");
}

function dedupeChunks(chunks: RagChunk[]) {
  const seen = new Set<string>();
  const result: RagChunk[] = [];
  for (const chunk of chunks) {
    if (seen.has(chunk.id)) continue;
    seen.add(chunk.id);
    result.push(chunk);
  }
  return result;
}

function sortByScore(chunks: RagChunk[]) {
  return [...chunks].sort((a, b) => (b.retrievalScore ?? 0) - (a.retrievalScore ?? 0));
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function lower(value: string | null | undefined) {
  return value?.toLowerCase() ?? "";
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asMetadata(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function asRetrievalKind(value: unknown): RagChunk["retrievalKind"] {
  if (value === "explicit" || value === "direct_relation" || value === "evidence" || value === "related" || value === "semantic") return value;
  return undefined;
}

function truncate(value: string, maxLength: number) {
  const clean = value.trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trim()}...`;
}

function numberFromEnv(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function extractQuotedTerms(question: string) {
  return [...question.matchAll(/["']([^"']{2,80})["']/g)].map((match) => match[1].trim());
}

function extractElementIds(question: string) {
  return [...question.matchAll(/\b(?:DP|DR|DF|A|EVAL|OK|REL)\d+\b/gi)].map((match) => match[0].toUpperCase());
}

function extractKeywordTerms(question: string) {
  const stopwords = new Set(["which", "papers", "paper", "use", "uses", "used", "using", "as", "a", "an", "the", "what", "how", "many", "number", "count", "show", "compare", "across", "library", "current", "workbench", "with", "that", "have", "based"]);
  return question
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({ original: word, normalized: word.toLowerCase() }))
    .filter(({ original, normalized }) => (normalized.length > 3 || /^[A-Z0-9]{2,}$/.test(original)) && !stopwords.has(normalized))
    .map(({ original, normalized }) => /^[A-Z0-9]{2,}$/.test(original) ? original : normalized)
    .slice(0, 6);
}

function extractRelationType(question: string) {
  const relationTypes = ["instantiated_by", "implemented_in", "supports", "depends_on", "addressed_by", "evaluated_by", "derived_from", "justified_by"];
  return relationTypes.find((type) => question.toLowerCase().includes(type));
}






