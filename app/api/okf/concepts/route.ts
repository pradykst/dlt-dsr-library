import { NextResponse } from "next/server";
import { parseOkfLibrary } from "@/lib/okf/parser.ts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paperId = searchParams.get("paperId");
  const type = searchParams.get("type");
  const kb = parseOkfLibrary();
  const concepts = kb.concepts.filter((concept) => (!paperId || concept.paper_id === paperId) && (!type || concept.type === type));
  return NextResponse.json({ concepts, warnings: kb.warnings });
}
