import type { OkfChatResponse } from "./chat.ts";

export type LlmProvider = "none" | "featherless" | "groq" | "openai";

export function getConfiguredLlmProvider(): LlmProvider {
  const provider = (process.env.LLM_PROVIDER ?? "none").toLowerCase() as LlmProvider;
  if (!provider || provider === "none") return "none";
  if (provider === "featherless" && process.env.FEATHERLESS_API_KEY) return provider;
  if (provider === "groq" && process.env.GROQ_API_KEY) return provider;
  if (provider === "openai" && process.env.OPENAI_API_KEY) return provider;
  return "none";
}

export async function synthesizeWithOptionalLlm(deterministic: OkfChatResponse): Promise<OkfChatResponse> {
  const provider = getConfiguredLlmProvider();
  if (provider === "none") return deterministic;

  // Provider calls are intentionally not implemented until the reviewed prompt and model choice are finalized.
  // The deterministic response remains the safety baseline and contains only retrieved OKF graph data.
  return {
    ...deterministic,
    warnings: [...deterministic.warnings, `LLM_PROVIDER=${provider} is configured, but MVP synthesis is using deterministic output to avoid unsupported claims.`]
  };
}

export const okfSystemPrompt = `You explain only the supplied OKF concepts, evidence items, relations, and flow JSON. Do not invent graph nodes, paper IDs, concept IDs, relations, citations, pages, or claims. If evidence is insufficient, say so explicitly.`;
