import { NextResponse } from "next/server";
import { getOkfKnowledgeBaseLoadMetadata, loadOkfKnowledgeBaseFromSupabase, supabaseClockSkewMessage } from "@/lib/okf/retrieval.ts";

export async function GET() {
  const kb = await loadOkfKnowledgeBaseFromSupabase();
  const metadata = getOkfKnowledgeBaseLoadMetadata();
  if (!kb) {
    const message = metadata.db_error_code === "PGRST303" ? supabaseClockSkewMessage() : metadata.db_error_message ?? "Supabase OKF knowledge base unavailable or not configured.";
    return NextResponse.json({ ok: false, connected: false, message, ...metadata });
  }
  return NextResponse.json({ ok: true, connected: true, db_loaded_from: "supabase", papers: kb.papers.length, concepts: kb.concepts.length, evidence_items: kb.evidence_items.length, relations: kb.relations.length });
}
