import type { OkfChatResponse } from "./chat.ts";
import type { QueryPlannerStatus } from "./query-planner.ts";
import { getLlmProviderName, getRequestedLlmProviderName, type LlmProviderName } from "../llm/provider.ts";
import { synthesizeWithGemini } from "../llm/gemini.ts";
import { synthesizeWithGroq } from "../llm/groq.ts";
import { getLlmRuntimePolicy, isLiveLlmWorkAllowed, isLiveSynthesisTestEnabled, isLlmTestRun } from "../llm/runtime-policy.ts";
import {
  buildCompactSynthesisContext,
  buildDeterministicMockSynthesis,
  applySynthesisFallback,
  compactContextSize,
  guardStructuredSynthesis,
  mergeSynthesisIntoAnswerPayload,
  renderStructuredSynthesisMarkdown,
  SynthesisValidationError
} from "../llm/structured-synthesis.ts";


export type LlmProvider = LlmProviderName;

export function getConfiguredLlmProvider(): LlmProvider {
  return getLlmProviderName();
}

export async function synthesizeWithOptionalLlm(deterministic: OkfChatResponse): Promise<OkfChatResponse> {
  const plannerStatus = deterministic.answer_plan?.query_plan.planner_status;
  if (plannerStatus?.attempted) return answerAfterPlannerAttempt(deterministic, plannerStatus);
  const configuredProvider = getConfiguredLlmProvider();
  const requestedProvider = getRequestedLlmProviderName();
  const runtimeProvider = configuredProvider === "none" && requestedProvider !== "none" ? requestedProvider : configuredProvider;
  if (shouldUseStructuredAnswer(deterministic, configuredProvider)) return markStructuredOkfAnswer(deterministic, runtimeProvider, structuredReason(deterministic, configuredProvider));

  let compactContext: ReturnType<typeof buildCompactSynthesisContext>;
  try {
    compactContext = buildCompactSynthesisContext(deterministic);
  } catch (error) {
    const reason = error instanceof SynthesisValidationError
      ? `Live synthesis skipped by context policy (${error.code}): ${error.message}`
      : `Live synthesis skipped because compact context construction failed: ${error instanceof Error ? error.message : "unknown error"}`;
    return markStructuredOkfAnswer(deterministic, runtimeProvider, reason);
  }

  if (configuredProvider === "mock") return synthesizeWithMockLlm(deterministic, compactContext);
  if (configuredProvider === "gemini") return synthesizeWithGemini(deterministic, compactContext);
  if (configuredProvider === "groq") return synthesizeWithGroq(deterministic, compactContext);
  return markStructuredOkfAnswer(deterministic, runtimeProvider, "No live LLM provider is configured.");
}
function shouldUseStructuredAnswer(response: OkfChatResponse, provider: LlmProviderName) {
  if (response.answer_plan?.synthesis_policy === "deterministic") return true;
  if (response.intent !== "DESIGN_REUSE_QUERY" && response.intent !== "DESIGN_REUSE_FLOW_QUERY") return true;
  if (provider === "none") return true;
  if (provider !== "mock" && !isLiveLlmWorkAllowed("synthesis", response.intent, getLlmRuntimePolicy())) return true;
  if ((provider === "gemini" || provider === "groq") && isLlmTestRun() && !isLiveSynthesisTestEnabled(provider)) return true;
  if (envFlag("OKF_DISABLE_LIVE_SYNTHESIS")) return true;
  if (provider === "gemini" && envFlag("GEMINI_DISABLE_LIVE_SYNTHESIS")) return true;
  if (provider === "groq" && envFlag("GROQ_DISABLE_LIVE_SYNTHESIS")) return true;
  if ((envFlag("GEMINI_DAILY_SAFE_MODE") || envFlag("GROQ_DAILY_SAFE_MODE")) && !["DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY"].includes(response.intent)) return true;
  return false;
}

function structuredReason(response: OkfChatResponse, provider: LlmProviderName) {
  if (response.answer_plan?.synthesis_policy === "deterministic") return "Deterministic answer type; live synthesis skipped.";
  if (envFlag("OKF_DISABLE_LIVE_SYNTHESIS")) return "OKF_DISABLE_LIVE_SYNTHESIS=true; structured OKF answer returned.";
  if (envFlag("LLM_DISABLE_LIVE_SYNTHESIS")) return "LLM_DISABLE_LIVE_SYNTHESIS=true; structured OKF answer returned.";
  if ((provider === "gemini" || provider === "groq") && isLlmTestRun() && !isLiveSynthesisTestEnabled(provider)) return "Live provider synthesis is disabled during tests unless explicitly enabled.";
  if (provider === "gemini" && envFlag("GEMINI_DISABLE_LIVE_SYNTHESIS")) return "GEMINI_DISABLE_LIVE_SYNTHESIS=true; structured OKF answer returned.";
  if (provider === "groq" && envFlag("GROQ_DISABLE_LIVE_SYNTHESIS")) return "GROQ_DISABLE_LIVE_SYNTHESIS=true; structured OKF answer returned.";
  if (envFlag("GEMINI_DAILY_SAFE_MODE") && !["DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY"].includes(response.intent)) return "GEMINI_DAILY_SAFE_MODE=true; structured OKF answer returned for this intent.";
  if (envFlag("GROQ_DAILY_SAFE_MODE") && !["DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY"].includes(response.intent)) return "GROQ_DAILY_SAFE_MODE=true; structured OKF answer returned for this intent.";
  if (provider === "none") return "No live LLM provider is configured.";
  return "Structured OKF answer returned.";
}

function answerAfterPlannerAttempt(response: OkfChatResponse, plannerStatus: QueryPlannerStatus): OkfChatResponse {
  const reason = plannerStatus.fallback_reason
    ?? "Optional query planning used the request's one-call LLM budget; live synthesis skipped.";
  if (plannerStatus.outcome === "success") {
    return markStructuredOkfAnswer(response, plannerStatus.provider, reason, plannerStatus);
  }
  return applySynthesisFallback(response, {
    provider: plannerStatus.provider,
    reason,
    validationError: plannerStatus.outcome === "validation_error",
    configured: plannerStatus.configured,
    connected: plannerStatus.reachable,
    attempted: plannerStatus.attempted,
    synthesisAttempted: false,
    status: plannerStatus.http_status,
    errorType: plannerStatus.error_type,
    model: plannerStatus.model,
    finishReason: plannerStatus.finish_reason,
    plannerStatus
  });
}

function markStructuredOkfAnswer(response: OkfChatResponse, provider: LlmProviderName, reason: string, plannerStatus?: QueryPlannerStatus): OkfChatResponse {
  const provider_configured = plannerStatus?.configured ?? isProviderConfigured(provider);
  const provider_status = {
    provider,
    configured: provider_configured,
    reachable: plannerStatus?.reachable ?? false,
    attempted: plannerStatus?.attempted ?? false,
    ...(plannerStatus?.http_status !== undefined ? { http_status: plannerStatus.http_status } : {}),
    ...(plannerStatus?.error_type ? { error_type: plannerStatus.error_type } : {}),
    outcome: provider_configured && provider !== "none" ? "synthesis_skipped" as const : "not_configured" as const,
    fallback_reason: reason
  };
  const answer_payload = response.answer_payload ? { ...response.answer_payload, synthesis_mode: "structured_okf_answer" as const } : response.answer_payload;
  return {
    ...response,
    answer_payload,
    runtime: { ...response.runtime, provider_configured, provider_connected: plannerStatus?.reachable ?? false, synthesis_attempted: false, synthesis_mode: "structured_okf_answer", provider, fallback_reason: reason, provider_status_code: plannerStatus?.http_status, provider_error_type: plannerStatus?.error_type, provider_status },
    warnings: [...response.warnings, "Structured OKF answer rendered without live LLM synthesis."]
  };
}

function synthesizeWithMockLlm(response: OkfChatResponse, compactContext: ReturnType<typeof buildCompactSynthesisContext>): OkfChatResponse {
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