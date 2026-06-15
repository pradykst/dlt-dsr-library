import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";
import type { RagChunk, RagFilters, RagSource } from "@/lib/rag/types";

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
    pageNumber: chunk.page_number
  }));
}

export function formatRetrievedContext(chunks: RagChunk[]) {
  if (chunks.length === 0) return "No retrieved context.";

  return chunks.map((chunk, index) => {
    const relation = chunk.relation_type
      ? `Relation: ${chunk.relation_type} (${chunk.from_element_id ?? "unknown"} -> ${chunk.to_element_id ?? "unknown"})`
      : "Relation: none stated";
    const evidence = chunk.evidence_quote ? `Evidence: ${chunk.evidence_quote}` : "Evidence: none provided";
    const page = chunk.page_number ? `Page: ${chunk.page_number}` : "Page: not available";

    return [
      `[S${index + 1}]`,
      `Paper: ${chunk.paper_title || chunk.paper_id || "Untitled paper"}`,
      `Chunk type: ${chunk.chunk_type ?? "unknown"}`,
      `Element: ${chunk.element_type ?? "unknown"} ${chunk.element_id ?? ""} ${chunk.element_label ? `- ${chunk.element_label}` : ""}`.trim(),
      relation,
      page,
      evidence,
      `Content: ${chunk.content}`
    ].join("\n");
  }).join("\n\n");
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
      distance: asNumber(item.distance)
    }))
    .filter((chunk) => chunk.content.trim().length > 0);
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
