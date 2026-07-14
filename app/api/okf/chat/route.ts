import { NextResponse } from "next/server";
import { answerOkfChat } from "@/lib/okf/chat.ts";
import { getOkfKnowledgeBaseForChat, getOkfKnowledgeBaseLoadMetadata } from "@/lib/okf/retrieval.ts";
import { synthesizeWithOptionalLlm } from "@/lib/okf/llm.ts";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query : "";
  if (!query.trim()) return NextResponse.json({ error: "Missing query." }, { status: 400 });
  const kb = await getOkfKnowledgeBaseForChat();
  const dbMetadata = getOkfKnowledgeBaseLoadMetadata();
  const deterministic = await answerOkfChat(query, kb);
  return NextResponse.json(await synthesizeWithOptionalLlm({ ...deterministic, runtime: { ...deterministic.runtime, provider_configured: false, provider_connected: false, synthesis_attempted: false, synthesis_mode: "structured_okf_answer", provider: "none", ...dbMetadata } }));
}
