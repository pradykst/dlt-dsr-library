import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";
import type { RagChunk, RagFilters, RagQueryPlan, RagRetrievalIntent, RagSource } from "@/lib/rag/types";

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
    intents: [...intents],
    searchTerms: unique(searchTerms).slice(0, 6),
    requestedElementType,
    paperIdOrTitle: filters.paper_id,
    relationType: extractRelationType(question),
    relationDirection: "any",
    explicitLabelsOnly: /\bexplicit|explicitly|labeled|labelled|as a design feature\b/i.test(question)
  };
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
    retrievalKind: chunk.retrievalKind
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
  const stopwords = new Set(["which", "papers", "paper", "use", "uses", "used", "as", "a", "an", "the", "what", "how", "show", "compare", "across", "library", "current", "workbench"]);
  return question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopwords.has(word))
    .slice(0, 4);
}

function extractRelationType(question: string) {
  const relationTypes = ["instantiated_by", "implemented_in", "supports", "depends_on", "addressed_by", "evaluated_by", "derived_from", "justified_by"];
  return relationTypes.find((type) => question.toLowerCase().includes(type));
}
