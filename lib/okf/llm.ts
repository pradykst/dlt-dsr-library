import type { OkfChatResponse } from "./chat.ts";
import { getLlmProviderName, type LlmProviderName } from "../llm/provider.ts";
import { synthesizeWithCompactFallback, synthesizeWithFeatherless } from "../llm/featherless.ts";
import { synthesizeWithGroq } from "../llm/groq.ts";

export type LlmProvider = LlmProviderName;

export function getConfiguredLlmProvider(): LlmProvider {
  return getLlmProviderName();
}

export async function synthesizeWithOptionalLlm(deterministic: OkfChatResponse): Promise<OkfChatResponse> {
  const provider = getConfiguredLlmProvider();
  if (provider === "featherless") return synthesizeWithFeatherless(deterministic);
  if (provider === "groq") return synthesizeWithGroq(deterministic);
  if (provider === "none") return synthesizeWithCompactFallback(deterministic, "No LLM provider is connected.", false, false, "none");
  return synthesizeWithCompactFallback(deterministic, `LLM_PROVIDER=${provider} is configured, but OKF synthesis is not implemented for that provider.`, false, false, provider);
}

export const okfSystemPrompt = "You explain only the supplied OKF concepts, evidence items, relations, and flow JSON. Do not invent graph nodes, paper IDs, concept IDs, relations, citations, pages, or claims. If evidence is insufficient, say so explicitly.";