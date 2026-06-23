import { NextResponse } from "next/server";
import { createQueryEmbedding, getEmbeddingProviderConfig } from "@/lib/rag/embeddings";
import { createChatCompletionResult, getLlmProviderConfig } from "@/lib/rag/llm";
import { readableError } from "@/lib/workbench/api";

type StatusCheck = {
  connected: boolean;
  provider?: string;
  model: string;
  latencyMs?: number;
  error?: string;
};

export async function GET() {
  const [chat, embedding] = await Promise.all([checkChat(), checkEmbedding()]);
  return NextResponse.json({ chat, embedding, checkedAt: new Date().toISOString() });
}

async function checkChat(): Promise<StatusCheck> {
  const startedAt = Date.now();
  let config: ReturnType<typeof getLlmProviderConfig> | undefined;
  try {
    config = getLlmProviderConfig();
    const result = await createChatCompletionResult([
      { role: "system", content: "You are a connection health check. Reply with only the word ok." },
      { role: "user", content: "Reply with only the word ok." }
    ], { maxTokens: 8, conciseRetryMaxTokens: 8 });

    return {
      connected: Boolean(result.content.trim()),
      provider: result.provider,
      model: result.model,
      latencyMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      connected: false,
      provider: config?.provider ?? process.env.CHAT_PROVIDER ?? "auto",
      model: config?.model ?? process.env.FEATHERLESS_MODEL ?? process.env.LLM_MODEL ?? "unconfigured",
      latencyMs: Date.now() - startedAt,
      error: readableError(error)
    };
  }
}

async function checkEmbedding(): Promise<StatusCheck> {
  const startedAt = Date.now();
  const config = getEmbeddingProviderConfig();
  try {
    const vector = await createQueryEmbedding("connection health check");
    return {
      connected: vector.length > 0,
      provider: "embedding-api",
      model: config.model,
      latencyMs: Date.now() - startedAt
    };
  } catch (error) {
    return {
      connected: false,
      provider: "embedding-api",
      model: config.model,
      latencyMs: Date.now() - startedAt,
      error: readableError(error)
    };
  }
}
