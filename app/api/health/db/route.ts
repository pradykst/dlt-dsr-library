import { NextResponse } from "next/server";
import { loadOkfKnowledgeBaseFromSupabase } from "@/lib/okf/retrieval.ts";

export async function GET() {
  const kb = await loadOkfKnowledgeBaseFromSupabase();
  if (!kb) return NextResponse.json({ ok: false, connected: false, message: "Supabase OKF knowledge base unavailable or not configured." });
  return NextResponse.json({ ok: true, connected: true, papers: kb.papers.length, concepts: kb.concepts.length, evidence_items: kb.evidence_items.length, relations: kb.relations.length });
}

