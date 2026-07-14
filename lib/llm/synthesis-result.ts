import type { OkfChatResponse } from "../okf/chat.ts";
import type { LlmSynthesisResult } from "../okf/schema.ts";
import {
  compactContextSize,
  mergeSynthesisIntoAnswerPayload,
  redactAndTruncate,
  renderStructuredSynthesisMarkdown,
  structuredSynthesisSystemPrompt,
  type CompactSynthesisContext,
  type StructuredLlmSynthesis
} from "./structured-synthesis.ts";
import { logLlmUsage, summarizeLlmUsage } from "./runtime-policy.ts";

type AcceptedSynthesisOptions = {
  provider: "gemini" | "groq";
  model?: string;
  status?: number;
  baseUrl?: string;
  finishReason?: string;
  rawProviderOutput?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cacheHit: boolean;
};

export function applyAcceptedStructuredSynthesis(
  deterministic: OkfChatResponse,
  structured: StructuredLlmSynthesis,
  context: CompactSynthesisContext,
  options: AcceptedSynthesisOptions
): OkfChatResponse {
  const answerMarkdown = renderStructuredSynthesisMarkdown(structured, context);
  const answerPayload = mergeSynthesisIntoAnswerPayload(deterministic, structured, options.provider);
  const contextChars = compactContextSize(context);
  const promptChars = structuredSynthesisSystemPrompt.length + contextChars;
  const outputChars = options.rawProviderOutput?.length ?? JSON.stringify(structured).length;
  const usage = summarizeLlmUsage({
    promptChars,
    outputChars,
    promptTokens: options.promptTokens,
    outputTokens: options.completionTokens
  });

  // Provider total token counts can include provider-specific accounting. Keep
  // the canonical input/output values while retaining the raw total separately.
  if (options.cacheHit) delete usage.estimated_cost_usd;
  logLlmUsage(options.provider, options.model, usage, options.cacheHit);
  const synthesis: LlmSynthesisResult = {
    synthesis_mode: options.provider,
    answer_markdown: answerMarkdown,
    provider_metadata: {
      provider: options.provider,
      model: options.model,
      status: options.status,
      base_url: options.baseUrl,
      prompt_tokens: usage.input_tokens,
      completion_tokens: usage.output_tokens,
      total_tokens: options.totalTokens ?? usage.total_tokens,
      prompt_chars: usage.prompt_chars,
      completion_chars: usage.output_chars,
      prompt_tokens_estimated: usage.input_tokens_estimated,
      completion_tokens_estimated: usage.output_tokens_estimated,
      estimated_cost_usd: usage.estimated_cost_usd,
      cache_hit: options.cacheHit
    },
    debug: {
      guard_outcome: "accepted",
      finish_reason: options.finishReason,
      cache_hit: options.cacheHit,
      usage,
      structured_output: structured,
      raw_provider_output: options.cacheHit ? undefined : redactAndTruncate(options.rawProviderOutput),
      compact_context: context,
      compact_context_chars: contextChars
    }
  };

  const attempted = !options.cacheHit;
  const reachable = !options.cacheHit;
  return {
    ...deterministic,
    answer: answerMarkdown,
    answer_payload: answerPayload,
    llm_synthesis: synthesis,
    runtime: {
      ...deterministic.runtime,
      provider_configured: true,
      provider_connected: reachable,
      synthesis_attempted: attempted,
      synthesis_mode: options.provider,
      provider: options.provider,
      provider_status_code: options.status,
      provider_status: {
        provider: options.provider,
        configured: true,
        reachable,
        attempted,
        http_status: options.status,
        outcome: "synthesis_used"
      }
    },
    warnings: [
      ...deterministic.warnings,
      options.cacheHit
        ? `${providerLabel(options.provider)} structured synthesis was served from the validated request cache.`
        : `${providerLabel(options.provider)} structured synthesis passed AnswerGuard and was rendered by the server.`
    ]
  };
}

function providerLabel(provider: "gemini" | "groq") {
  return provider === "gemini" ? "Gemini" : "Groq";
}
