import type { OkfChatResponse } from "./chat.ts";
import { getLlmProviderName, type LlmProviderName } from "../llm/provider.ts";
import { synthesizeWithFeatherless } from "../llm/featherless.ts";

export type LlmProvider = LlmProviderName;

export function getConfiguredLlmProvider(): LlmProvider {
  return getLlmProviderName();
}

export async function synthesizeWithOptionalLlm(deterministic: OkfChatResponse): Promise<OkfChatResponse> {
  const provider = getConfiguredLlmProvider();
  if (provider === "featherless") return synthesizeWithFeatherless(deterministic);
  if (provider === "none") return deterministic;
  return { ...deterministic, warnings: [...deterministic.warnings, `LLM_PROVIDER=${provider} is configured, but only Featherless synthesis is implemented for OKF reuse answers.`] };
}

export const okfSystemPrompt = "You explain only the supplied OKF concepts, evidence items, relations, and flow JSON. Do not invent graph nodes, paper IDs, concept IDs, relations, citations, pages, or claims. If evidence is insufficient, say so explicitly.";

