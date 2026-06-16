export type RagChatRole = "system" | "user" | "assistant";

export type RagChatMessage = {
  role: RagChatRole;
  content: string;
};

export type RagFilters = {
  paper_id?: string;
  element_type?: string;
  chunk_type?: string;
};

export type RagChunk = {
  id: string;
  source_type: string | null;
  paper_id: string | null;
  paper_title: string | null;
  chunk_type: string | null;
  element_id: string | null;
  element_type: string | null;
  element_label: string | null;
  relation_type: string | null;
  from_element_id: string | null;
  to_element_id: string | null;
  evidence_quote: string | null;
  page_number: number | null;
  content: string;
  metadata: Record<string, unknown> | null;
  similarity?: number | null;
  distance?: number | null;
  retrievalKind?: "explicit" | "direct_relation" | "evidence" | "related";
  retrievalScore?: number;
};

export type RagSource = {
  sourceIndex: number;
  paperId: string | null;
  paperTitle: string;
  chunkType: string | null;
  elementId: string | null;
  elementType: string | null;
  elementLabel: string | null;
  relationType: string | null;
  fromElementId: string | null;
  toElementId: string | null;
  evidenceQuote: string | null;
  pageNumber: number | null;
  retrievalKind?: RagChunk["retrievalKind"];
};
