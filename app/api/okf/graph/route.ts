import { NextResponse } from "next/server";
import { parseOkfLibrary } from "@/lib/okf/parser.ts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paperId = searchParams.get("paperId");
  const kb = parseOkfLibrary();
  const concepts = kb.concepts.filter((concept) => !paperId || concept.paper_id === paperId);
  const ids = new Set(concepts.map((concept) => concept.concept_id));
  const relations = kb.relations.filter((relation) => ids.has(relation.source_concept_id) && ids.has(relation.target_concept_id));
  return NextResponse.json({ nodes: concepts, edges: relations, warnings: kb.warnings });
}
