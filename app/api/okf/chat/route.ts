import { NextResponse } from "next/server";
import { answerOkfChat } from "@/lib/okf/chat.ts";
import { getOkfKnowledgeBaseForChat } from "@/lib/okf/retrieval.ts";
import { synthesizeWithOptionalLlm } from "@/lib/okf/llm.ts";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query : "";
  if (!query.trim()) return NextResponse.json({ error: "Missing query." }, { status: 400 });
  const kb = await getOkfKnowledgeBaseForChat();
  const deterministic = await answerOkfChat(query, kb);
  return NextResponse.json(await synthesizeWithOptionalLlm(deterministic));
}



