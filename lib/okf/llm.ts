import type { OkfChatResponse } from "./chat.ts";
import { getLlmProviderName, getRequestedLlmProviderName, type LlmProviderName } from "../llm/provider.ts";
import { synthesizeWithFeatherless } from "../llm/featherless.ts";
import { synthesizeWithGroq } from "../llm/groq.ts";

export type LlmProvider = LlmProviderName;

export function getConfiguredLlmProvider(): LlmProvider {
  return getLlmProviderName();
}

export async function synthesizeWithOptionalLlm(deterministic: OkfChatResponse): Promise<OkfChatResponse> {
  const configuredProvider = getConfiguredLlmProvider();
  const requestedProvider = getRequestedLlmProviderName();
  const runtimeProvider = configuredProvider === "none" && requestedProvider !== "none" ? requestedProvider : configuredProvider;
  if (shouldUseStructuredAnswer(deterministic, configuredProvider)) return markStructuredOkfAnswer(deterministic, runtimeProvider, structuredReason(deterministic, configuredProvider));
  if (configuredProvider === "mock") return synthesizeWithMockLlm(deterministic);
  if (configuredProvider === "featherless") return synthesizeWithFeatherless(deterministic);
  if (configuredProvider === "groq") return synthesizeWithGroq(deterministic);
  return markStructuredOkfAnswer(deterministic, runtimeProvider, "No live LLM provider is configured.");
}

function shouldUseStructuredAnswer(response: OkfChatResponse, provider: LlmProviderName) {
  if (response.answer_plan?.synthesis_policy === "deterministic") return true;
  if (provider === "none") return true;
  if (envFlag("GROQ_DISABLE_LIVE_SYNTHESIS")) return true;
  if (envFlag("GROQ_DAILY_SAFE_MODE") && !["DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY"].includes(response.intent)) return true;
  return false;
}

function structuredReason(response: OkfChatResponse, provider: LlmProviderName) {
  if (response.answer_plan?.synthesis_policy === "deterministic") return "Deterministic answer type; live synthesis skipped.";
  if (envFlag("GROQ_DISABLE_LIVE_SYNTHESIS")) return "GROQ_DISABLE_LIVE_SYNTHESIS=true; structured OKF answer returned.";
  if (envFlag("GROQ_DAILY_SAFE_MODE") && !["DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY"].includes(response.intent)) return "GROQ_DAILY_SAFE_MODE=true; structured OKF answer returned for this intent.";
  if (provider === "none") return "No live LLM provider is configured.";
  return "Structured OKF answer returned.";
}

function markStructuredOkfAnswer(response: OkfChatResponse, provider: LlmProviderName, reason: string): OkfChatResponse {
  const provider_configured = isProviderConfigured(provider);
  const answer_payload = response.answer_payload ? { ...response.answer_payload, synthesis_mode: "structured_okf_answer" as const } : response.answer_payload;
  return {
    ...response,
    answer_payload,
    runtime: { ...response.runtime, provider_configured, provider_connected: provider_configured, synthesis_attempted: false, synthesis_mode: "structured_okf_answer", provider, fallback_reason: reason },
    warnings: [...response.warnings, "Structured OKF answer rendered without live LLM synthesis."]
  };
}

function synthesizeWithMockLlm(response: OkfChatResponse): OkfChatResponse {
  const answer = response.answer.startsWith("#") ? response.answer : `# Mock OKF synthesis\n\n${response.answer}`;
  return {
    ...response,
    answer,
    llm_synthesis: {
      synthesis_mode: "mock",
      answer_markdown: answer,
      provider_metadata: { provider: "mock", model: "mock-okf-synthesis", status: 200 },
      debug: { mock: true, answer_plan: response.answer_plan }
    },
    runtime: { ...response.runtime, provider_configured: true, provider_connected: true, synthesis_attempted: true, synthesis_mode: "mock", provider: "mock" },
    warnings: [...response.warnings, "Mock LLM synthesis used; no live provider was called."]
  };
}

function isProviderConfigured(provider: LlmProviderName) {
  if (provider === "mock") return true;
  if (provider === "featherless") return Boolean(process.env.FEATHERLESS_API_KEY && process.env.FEATHERLESS_MODEL);
  if (provider === "groq") return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_MODEL);
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL);
  return false;
}

function envFlag(name: string) {
  return String(process.env[name] ?? "false").toLowerCase() === "true";
}

export const okfSystemPrompt = "You explain only the supplied OKF concepts, evidence items, relations, and flow JSON. Do not invent graph nodes, paper IDs, concept IDs, relations, citations, pages, or claims. If evidence is insufficient, say so explicitly.";
