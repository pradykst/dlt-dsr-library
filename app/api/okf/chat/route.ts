import { NextResponse } from "next/server";
import { answerOkfChat } from "@/lib/okf/chat.ts";
import { synthesizeWithOptionalLlm } from "@/lib/okf/llm.ts";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query : "";
  if (!query.trim()) return NextResponse.json({ error: "Missing query." }, { status: 400 });
  const deterministic = await answerOkfChat(query);
  return NextResponse.json(await synthesizeWithOptionalLlm(deterministic));
}
