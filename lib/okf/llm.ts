import type { OkfChatResponse } from "./chat.ts";
import { getLlmProviderName, getRequestedLlmProviderName, type LlmProviderName } from "../llm/provider.ts";
import { synthesizeWithGemini } from "../llm/gemini.ts";
import { synthesizeWithGroq } from "../llm/groq.ts";
import {
  buildCompactSynthesisContext,
  buildDeterministicMockSynthesis,
  compactContextSize,
  guardStructuredSynthesis,
  mergeSynthesisIntoAnswerPayload,
  renderStructuredSynthesisMarkdown
} from "../llm/structured-synthesis.ts";


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
  if (configuredProvider === "gemini") return synthesizeWithGeminiPrimary(deterministic);
  if (configuredProvider === "groq") return synthesizeWithGroq(deterministic);
  return markStructuredOkfAnswer(deterministic, runtimeProvider, "No live LLM provider is configured.");
}

async function synthesizeWithGeminiPrimary(deterministic: OkfChatResponse): Promise<OkfChatResponse> {
  const gemini = await synthesizeWithGemini(deterministic);
  if (!shouldTryGroqAfterGemini(gemini)) return gemini;
  const groq = await synthesizeWithGroq(deterministic);
  return annotateSecondaryGroqResponse(groq, gemini);
}

function shouldTryGroqAfterGemini(response: OkfChatResponse) {
  if (response.runtime?.provider !== "gemini") return false;
  if (!response.runtime.synthesis_attempted) return false;
  if (!["fallback_rate_limited", "fallback_provider_error"].includes(response.runtime.synthesis_mode)) return false;
  if (!isProviderConfigured("groq")) return false;
  if (envFlag("OKF_DISABLE_SECONDARY_LLM_FALLBACK") || envFlag("GROQ_DISABLE_LIVE_SYNTHESIS")) return false;
  return true;
}

function annotateSecondaryGroqResponse(groq: OkfChatResponse, gemini: OkfChatResponse): OkfChatResponse {
  const primaryFailure = {
    provider: "gemini",
    synthesis_mode: gemini.runtime?.synthesis_mode,
    status: gemini.runtime?.provider_status_code,
    error_type: gemini.runtime?.provider_error_type,
    reason: gemini.runtime?.fallback_reason
  };
  const runtime = groq.runtime ? { ...groq.runtime, fallback_reason: groq.runtime.fallback_reason ?? "Gemini primary provider failed; Groq secondary provider used." } : undefined;
  return {
    ...groq,
    llm_synthesis: groq.llm_synthesis ? { ...groq.llm_synthesis, debug: { ...groq.llm_synthesis.debug, primary_provider_failure: primaryFailure } } : groq.llm_synthesis,
    runtime,
    warnings: [...groq.warnings, `Gemini primary provider failed; Groq secondary provider used. ${gemini.runtime?.fallback_reason ?? "Gemini synthesis was unavailable."}`]
  };
}
function shouldUseStructuredAnswer(response: OkfChatResponse, provider: LlmProviderName) {
  if (response.answer_plan?.synthesis_policy === "deterministic") return true;
  if (response.intent !== "DESIGN_REUSE_QUERY" && response.intent !== "DESIGN_REUSE_FLOW_QUERY") return true;
  if (provider === "none") return true;
  if (envFlag("OKF_DISABLE_LIVE_SYNTHESIS") || envFlag("GEMINI_DISABLE_LIVE_SYNTHESIS") || envFlag("GROQ_DISABLE_LIVE_SYNTHESIS")) return true;
  if ((envFlag("GEMINI_DAILY_SAFE_MODE") || envFlag("GROQ_DAILY_SAFE_MODE")) && !["DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY"].includes(response.intent)) return true;
  return false;
}

function structuredReason(response: OkfChatResponse, provider: LlmProviderName) {
  if (response.answer_plan?.synthesis_policy === "deterministic") return "Deterministic answer type; live synthesis skipped.";
  if (envFlag("OKF_DISABLE_LIVE_SYNTHESIS")) return "OKF_DISABLE_LIVE_SYNTHESIS=true; structured OKF answer returned.";
  if (envFlag("GEMINI_DISABLE_LIVE_SYNTHESIS")) return "GEMINI_DISABLE_LIVE_SYNTHESIS=true; structured OKF answer returned.";
  if (envFlag("GROQ_DISABLE_LIVE_SYNTHESIS")) return "GROQ_DISABLE_LIVE_SYNTHESIS=true; structured OKF answer returned.";
  if (envFlag("GEMINI_DAILY_SAFE_MODE") && !["DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY"].includes(response.intent)) return "GEMINI_DAILY_SAFE_MODE=true; structured OKF answer returned for this intent.";
  if (envFlag("GROQ_DAILY_SAFE_MODE") && !["DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY"].includes(response.intent)) return "GROQ_DAILY_SAFE_MODE=true; structured OKF answer returned for this intent.";
  if (provider === "none") return "No live LLM provider is configured.";
  return "Structured OKF answer returned.";
}

function markStructuredOkfAnswer(response: OkfChatResponse, provider: LlmProviderName, reason: string): OkfChatResponse {
  const provider_configured = isProviderConfigured(provider);
  const provider_status = {
    provider,
    configured: provider_configured,
    reachable: false,
    attempted: false,
    outcome: provider_configured && provider !== "none" ? "synthesis_skipped" as const : "not_configured" as const,
    fallback_reason: reason
  };
  const answer_payload = response.answer_payload ? { ...response.answer_payload, synthesis_mode: "structured_okf_answer" as const } : response.answer_payload;
  return {
    ...response,
    answer_payload,
    runtime: { ...response.runtime, provider_configured, provider_connected: false, synthesis_attempted: false, synthesis_mode: "structured_okf_answer", provider, fallback_reason: reason, provider_status },
    warnings: [...response.warnings, "Structured OKF answer rendered without live LLM synthesis."]
  };
}

function synthesizeWithMockLlm(response: OkfChatResponse): OkfChatResponse {
  const compactContext = buildCompactSynthesisContext(response);
  const generated = buildDeterministicMockSynthesis(compactContext);
  const synthesis = guardStructuredSynthesis(JSON.stringify(generated), {
    provider: "mock",
    finishReason: "STOP",
    context: compactContext,
    response
  });
  const answer = renderStructuredSynthesisMarkdown(synthesis, compactContext);
  const answer_payload = mergeSynthesisIntoAnswerPayload(response, synthesis, "mock");
  const provider_status = {
    provider: "mock" as const,
    configured: true,
    reachable: true,
    attempted: true,
    outcome: "synthesis_used" as const
  };
  return {
    ...response,
    answer,
    answer_payload,
    llm_synthesis: {
      synthesis_mode: "mock",
      answer_markdown: answer,
      provider_metadata: { provider: "mock", model: "mock-okf-synthesis" },
      debug: {
        mock: true,
        guard_outcome: "accepted",
        compact_context: compactContext,
        compact_context_chars: compactContextSize(compactContext)
      }
    },
    runtime: { ...response.runtime, provider_configured: true, provider_connected: true, synthesis_attempted: true, synthesis_mode: "mock", provider: "mock", provider_status },
    warnings: [...response.warnings, "Mock structured synthesis passed the production schema and AnswerGuard; no live provider was called."]
  };
}

function isProviderConfigured(provider: LlmProviderName) {
  if (provider === "mock") return true;
  if (provider === "gemini") return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL);
  if (provider === "groq") return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_MODEL);
  return false;
}

function envFlag(name: string) {
  return String(process.env[name] ?? "false").toLowerCase() === "true";
}

export const okfSystemPrompt = "You explain only the supplied OKF concepts, evidence items, relations, and flow JSON. Do not invent graph nodes, paper IDs, concept IDs, relations, citations, pages, or claims. If evidence is insufficient, say so explicitly.";