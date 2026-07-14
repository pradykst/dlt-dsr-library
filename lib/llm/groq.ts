import type { OkfChatResponse } from "../okf/chat.ts";
import { logLlmUsage, readSuccessfulSynthesisCache, summarizeLlmUsage, synthesisCacheKey, writeSuccessfulSynthesisCache } from "./runtime-policy.ts";
import { applyAcceptedStructuredSynthesis } from "./synthesis-result.ts";
import {
  applySynthesisFallback,
  buildCompactSynthesisContext,
  guardStructuredSynthesis,
  structuredSynthesisSystemPrompt,
  structuredSynthesisUserPrompt,
  SynthesisValidationError,
  type CompactSynthesisContext
} from "./structured-synthesis.ts";

export async function synthesizeWithGroq(deterministic: OkfChatResponse, preparedContext?: CompactSynthesisContext): Promise<OkfChatResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;
  const configured = Boolean(apiKey && model);
  const baseUrl = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  if (!configured) {
    return applySynthesisFallback(deterministic, {
      provider: "groq",
      reason: "Groq is not configured.",
      validationError: false,
      configured: false,
      connected: false,
      attempted: false,
      model,
      baseUrl: safeBaseUrl(baseUrl)
    });
  }

  const timeoutMs = Number(process.env.GROQ_TIMEOUT_MS ?? 60_000);
  const maxTokens = Number(process.env.GROQ_MAX_TOKENS ?? 2_200);
  const temperature = Number(process.env.GROQ_TEMPERATURE ?? 0.2);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let context: CompactSynthesisContext | undefined;
  let attempted = false;
  let status: number | undefined;
  let finishReason: string | undefined;
  let rawProviderError: string | undefined;
  let rawProviderErrorType: string | undefined;
  let rawProviderOutput: string | undefined;
  let providerPromptTokens: number | undefined;
  let providerOutputTokens: number | undefined;
  let providerTotalTokens: number | undefined;

  try {
    context = preparedContext ?? buildCompactSynthesisContext(deterministic);
    const cacheKey = synthesisCacheKey("groq", model, deterministic);
    const cached = readSuccessfulSynthesisCache<unknown>(cacheKey);
    if (cached !== undefined) {
      const cachedStructured = guardStructuredSynthesis(JSON.stringify(cached), {
        provider: "groq",
        finishReason: "stop",
        context,
        response: deterministic
      });
      return applyAcceptedStructuredSynthesis(deterministic, cachedStructured, context, {
        provider: "groq",
        model,
        baseUrl: safeBaseUrl(baseUrl),
        cacheHit: true
      });
    }
    attempted = true;
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: structuredSynthesisSystemPrompt },
          { role: "user", content: structuredSynthesisUserPrompt(context) }
        ]
      })
    });
    status = response.status;
    const data = await response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
    providerPromptTokens = data?.usage?.prompt_tokens;
    providerOutputTokens = data?.usage?.completion_tokens;
    providerTotalTokens = data?.usage?.total_tokens;
    if (!response.ok) {
      const errorInfo = providerErrorInfo(data);
      rawProviderError = errorInfo.message ?? `Groq request failed: ${response.status}`;
      rawProviderErrorType = errorInfo.type;
      throw new Error(rawProviderError);
    }

    const content = data?.choices?.[0]?.message?.content;
    finishReason = data?.choices?.[0]?.finish_reason;
    rawProviderOutput = typeof content === "string" ? content : JSON.stringify(data);
    const structured = guardStructuredSynthesis(typeof content === "string" ? content : "", {
      provider: "groq",
      finishReason,
      context,
      response: deterministic
    });
    const accepted = applyAcceptedStructuredSynthesis(deterministic, structured, context, {
      provider: "groq",
      model,
      status,
      baseUrl: safeBaseUrl(baseUrl),
      finishReason,
      rawProviderOutput,
      promptTokens: providerPromptTokens,
      completionTokens: providerOutputTokens,
      totalTokens: providerTotalTokens,
      cacheHit: false
    });
    writeSuccessfulSynthesisCache(cacheKey, structured);
    return accepted;
  } catch (error) {
    const validationError = error instanceof SynthesisValidationError;
    const reason = error instanceof Error ? error.message : "Unknown Groq synthesis error";
    const connected = attempted && (validationError || providerErrorStillConnected(reason, status, rawProviderErrorType));
    if (attempted && context) {
      const usage = summarizeLlmUsage({
        promptChars: structuredSynthesisSystemPrompt.length + structuredSynthesisUserPrompt(context).length,
        outputChars: rawProviderOutput?.length ?? 0,
        promptTokens: providerPromptTokens,
        outputTokens: providerOutputTokens
      });
      logLlmUsage("groq", model, usage, false);
    }
    return applySynthesisFallback(deterministic, {
      provider: "groq",
      reason,
      validationError,
      configured,
      connected,
      attempted,
      status,
      errorType: validationError ? error.code : rawProviderErrorType,
      model,
      baseUrl: safeBaseUrl(baseUrl),
      rawProviderError,
      rawProviderOutput,
      finishReason,
      validationErrors: error instanceof SynthesisValidationError ? error.validationErrors : undefined,
      compactContext: context
    });
  } finally {
    clearTimeout(timer);
  }
}

/** @deprecated Compatibility name; this now returns only the six-field compact context. */
export const buildMarkdownSynthesisContext = buildCompactSynthesisContext;
export const markdownSystemPrompt = structuredSynthesisSystemPrompt;
export function markdownUserPrompt(context: CompactSynthesisContext) {
  return structuredSynthesisUserPrompt(context);
}

/** @deprecated Provider output is guarded and server-rendered; this helper is retained for callers outside synthesis. */
export function scrubDefaultAnswerMarkdown(value: string) {
  return value.trim();
}

function providerErrorInfo(data: unknown): { message?: string; type?: string } {
  if (!data || typeof data !== "object") return {};
  const record = data as Record<string, unknown>;
  const error = record.error;
  if (error && typeof error === "object") {
    const typed = error as { message?: unknown; type?: unknown; code?: unknown };
    return {
      message: typed.message ? String(typed.message) : undefined,
      type: typed.type ? String(typed.type) : typed.code ? String(typed.code) : undefined
    };
  }
  if (typeof record.message === "string") return { message: record.message, type: typeof record.type === "string" ? record.type : undefined };
  if (typeof record.raw === "string") return { message: record.raw.slice(0, 500) };
  return {};
}

export function safeBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/\?.*$/, "");
  }
}

export function providerErrorStillConnected(reason: string, status?: number, errorType?: string) {
  if (status === 429 || status === 503 || errorType === "rate_limit_exceeded" || /rate limit|429|503|high demand/i.test(reason)) return true;
  if (status === 401 || status === 403) return false;
  return !/(request failed:\s*(401|403)|fetch failed|network|abort|timeout|ECONN|ENOTFOUND|ETIMEDOUT)/i.test(reason);
}
