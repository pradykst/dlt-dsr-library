import { NextResponse } from "next/server";
import { buildOkfFlow } from "@/lib/okf/flow.ts";
import { parseOkfLibrary } from "@/lib/okf/parser.ts";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query : "OKF flow";
  const selectedIds = Array.isArray(body.concept_ids) ? body.concept_ids.map(String) : [];
  const kb = parseOkfLibrary();
  const selected = selectedIds.length ? kb.concepts.filter((concept) => selectedIds.includes(concept.concept_id)) : kb.concepts.slice(0, 12);
  return NextResponse.json({ flow: buildOkfFlow(query, selected, kb), warnings: kb.warnings });
}
