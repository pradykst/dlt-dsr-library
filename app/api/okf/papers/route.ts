import { NextResponse } from "next/server";
import { parseOkfLibrary } from "@/lib/okf/parser.ts";

export async function GET() {
  const kb = parseOkfLibrary();
  return NextResponse.json({ papers: kb.papers, warnings: kb.warnings });
}
