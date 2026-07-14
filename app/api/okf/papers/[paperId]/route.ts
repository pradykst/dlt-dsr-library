import { NextResponse } from "next/server";
import { parseOkfLibrary } from "@/lib/okf/parser.ts";

export async function GET(_: Request, { params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const kb = parseOkfLibrary();
  const paper = kb.papers.find((item) => item.paper_id === paperId);
  if (!paper) return NextResponse.json({ error: "Paper not found." }, { status: 404 });
  return NextResponse.json({
    paper,
    concepts: kb.concepts.filter((concept) => concept.paper_id === paperId),
    evidence_items: kb.evidence_items.filter((item) => item.paper_id === paperId),
    relations: kb.relations.filter((relation) => relation.source_concept_id.startsWith(`${paperId}:`)),
    warnings: kb.warnings
  });
}
