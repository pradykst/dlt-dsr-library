import type { OkfChatResponse } from "../okf/chat.ts";
import { providerErrorStillConnected, safeBaseUrl } from "./groq.ts";
import { logLlmUsage, readSuccessfulSynthesisCache, summarizeLlmUsage, synthesisCacheKey, writeSuccessfulSynthesisCache } from "./runtime-policy.ts";
import { applyAcceptedStructuredSynthesis } from "./synthesis-result.ts";
import {
  applySynthesisFallback,
  buildCompactSynthesisContext,
  guardStructuredSynthesis,
  structuredSynthesisJsonSchema,
  structuredSynthesisSystemPrompt,
  structuredSynthesisUserPrompt,
  SynthesisValidationError,
  type CompactSynthesisContext
} from "./structured-synthesis.ts";

type GeminiErrorInfo = { message?: string; type?: string };
type GeminiGenerateResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
};

/**
 * Gemini accepts a useful subset of JSON Schema for responseSchema but rejects
 * `additionalProperties`. Keep the provider-neutral schema authoritative and
 * derive this transport-only projection without mutating the canonical object.
 */
export function projectGeminiResponseSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(projectGeminiResponseSchema);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "additionalProperties")
      .map(([key, nested]) => [key, projectGeminiResponseSchema(nested)])
  );
}

export const geminiStructuredSynthesisResponseSchema = projectGeminiResponseSchema(structuredSynthesisJsonSchema);
export async function synthesizeWithGemini(deterministic: OkfChatResponse, preparedContext?: CompactSynthesisContext): Promise<OkfChatResponse> {

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  const configured = Boolean(apiKey && model);
  const baseUrl = process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta";
  if (!configured) {
    return applySynthesisFallback(deterministic, {
      provider: "gemini",
      reason: "Gemini is not configured.",
      validationError: false,
      configured: false,
      connected: false,
      attempted: false,
      model,
      baseUrl: safeBaseUrl(baseUrl)
    });
  }

  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 60_000);
  const maxOutputTokens = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? 2_500);
  const temperature = Number(process.env.GEMINI_TEMPERATURE ?? 0.2);
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
    const cacheKey = synthesisCacheKey("gemini", model, deterministic);
    const cached = readSuccessfulSynthesisCache<unknown>(cacheKey);
    if (cached !== undefined) {
      const cachedStructured = guardStructuredSynthesis(JSON.stringify(cached), {
        provider: "gemini",
        finishReason: "STOP",
        context,
        response: deterministic
      });
      return applyAcceptedStructuredSynthesis(deterministic, cachedStructured, context, {
        provider: "gemini",
        model,
        baseUrl: safeBaseUrl(baseUrl),
        cacheHit: true
      });
    }
    attempted = true;
    const response = await fetch(geminiGenerateContentUrl(baseUrl, model!, apiKey!), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: structuredSynthesisSystemPrompt }] },
        contents: [{ role: "user", parts: [{ text: structuredSynthesisUserPrompt(context) }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: "application/json",
          responseSchema: geminiStructuredSynthesisResponseSchema
        }
      })
    });
    status = response.status;
    const data = await readGeminiJson(response);
    const usage = (data as GeminiGenerateResponse).usageMetadata;
    providerPromptTokens = usage?.promptTokenCount;
    providerOutputTokens = usage?.candidatesTokenCount;
    providerTotalTokens = usage?.totalTokenCount;
    if (!response.ok) {
      const errorInfo = geminiErrorInfo(data);
      rawProviderError = errorInfo.message ?? `Gemini request failed: ${response.status}`;
      rawProviderErrorType = errorInfo.type;
      throw new Error(rawProviderError);
    }

    const content = geminiText(data);
    finishReason = geminiFinishReason(data);
    rawProviderOutput = content || JSON.stringify(data);
    const structured = guardStructuredSynthesis(content, {
      provider: "gemini",
      finishReason,
      context,
      response: deterministic
    });
    const accepted = applyAcceptedStructuredSynthesis(deterministic, structured, context, {
      provider: "gemini",
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
    const reason = error instanceof Error ? error.message : "Unknown Gemini synthesis error";
    const connected = attempted && (validationError || geminiErrorStillConnected(reason, status, rawProviderErrorType));
    if (attempted && context) {
      const usage = summarizeLlmUsage({
        promptChars: structuredSynthesisSystemPrompt.length + structuredSynthesisUserPrompt(context).length,
        outputChars: rawProviderOutput?.length ?? 0,
        promptTokens: providerPromptTokens,
        outputTokens: providerOutputTokens
      });
      logLlmUsage("gemini", model, usage, false);
    }
    return applySynthesisFallback(deterministic, {
      provider: "gemini",
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

export const queryPlannerSystemPrompt = "You are a query interpreter for a DSR OKF library assistant. Classify the user's request into one of the allowed intents. Extract requested element types, named papers, themes, criteria, and output shape. Do not answer the question. Return JSON only.";

export type GeminiQueryPlanRequestResult = {
  attempted: boolean;
  status?: number;
  candidate?: unknown;
  finishReason?: string;
  errorType?: string;
  errorMessage?: string;
  outputChars: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

/**
 * Transport result for the optional planner. The caller owns policy and
 * request-scoped status, so failures are not silently collapsed to undefined.
 */
export async function requestGeminiQueryPlanJson(prompt: unknown): Promise<GeminiQueryPlanRequestResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_PLANNER_MODEL ?? process.env.GEMINI_MODEL;
  if (!apiKey || !model) return { attempted: false, errorType: "not_configured", errorMessage: "Gemini query planner is not configured.", outputChars: 0 };
  const baseUrl = process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.GEMINI_QUERY_PLANNER_TIMEOUT_MS ?? 4_000));
  try {
    const response = await fetch(geminiGenerateContentUrl(baseUrl, model, apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: queryPlannerSystemPrompt }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(prompt) }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 700, responseMimeType: "application/json" }
      })
    });
    const data = await readGeminiJson(response);
    const usage = (data as GeminiGenerateResponse).usageMetadata;
    const finishReason = geminiFinishReason(data);
    if (!response.ok) {
      const error = geminiErrorInfo(data);
      return {
        attempted: true,
        status: response.status,
        finishReason,
        errorType: error.type,
        errorMessage: error.message ?? `Gemini query planner request failed: ${response.status}`,
        outputChars: error.message?.length ?? 0,
        promptTokens: usage?.promptTokenCount,
        completionTokens: usage?.candidatesTokenCount,
        totalTokens: usage?.totalTokenCount
      };
    }
    const content = geminiText(data);
    if (finishReason?.toUpperCase() !== "STOP") {
      return {
        attempted: true,
        status: response.status,
        finishReason,
        errorType: "incomplete_finish_reason",
        errorMessage: `Gemini query planner returned finish reason ${finishReason ?? "missing"}.`,
        outputChars: content.length,
        promptTokens: usage?.promptTokenCount,
        completionTokens: usage?.candidatesTokenCount,
        totalTokens: usage?.totalTokenCount
      };
    }
    if (!content.trim()) {
      return {
        attempted: true,
        status: response.status,
        finishReason,
        errorType: "empty_planner_output",
        errorMessage: "Gemini query planner returned an empty response.",
        outputChars: 0,
        promptTokens: usage?.promptTokenCount,
        completionTokens: usage?.candidatesTokenCount,
        totalTokens: usage?.totalTokenCount
      };
    }
    try {
      return {
        attempted: true,
        status: response.status,
        candidate: JSON.parse(stripJsonFence(content)),
        finishReason,
        outputChars: content.length,
        promptTokens: usage?.promptTokenCount,
        completionTokens: usage?.candidatesTokenCount,
        totalTokens: usage?.totalTokenCount
      };
    } catch {
      return {
        attempted: true,
        status: response.status,
        finishReason,
        errorType: "planner_json_parse_failed",
        errorMessage: "Gemini query planner returned malformed JSON.",
        outputChars: content.length,
        promptTokens: usage?.promptTokenCount,
        completionTokens: usage?.candidatesTokenCount,
        totalTokens: usage?.totalTokenCount
      };
    }
  } catch (error) {
    return {
      attempted: true,
      errorType: error instanceof DOMException && error.name === "AbortError" ? "planner_timeout" : "planner_request_error",
      errorMessage: error instanceof Error ? error.message : "Unknown Gemini query planner error.",
      outputChars: 0
    };
  } finally {
    clearTimeout(timer);
  }
}

export function geminiGenerateContentUrl(baseUrl: string, model: string, apiKey: string) {
  const normalizedModel = model.replace(/^models\//, "");
  return `${baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(normalizedModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

export function geminiErrorInfo(data: unknown): GeminiErrorInfo {
  if (!data || typeof data !== "object") return {};
  const record = data as Record<string, unknown>;
  const error = record.error;
  if (error && typeof error === "object") {
    const typed = error as { message?: unknown; status?: unknown; type?: unknown; code?: unknown };
    return {
      message: typed.message ? String(typed.message) : undefined,
      type: typed.status ? String(typed.status) : typed.type ? String(typed.type) : typed.code ? String(typed.code) : undefined
    };
  }
  if (typeof record.message === "string") return { message: record.message, type: typeof record.status === "string" ? record.status : undefined };
  if (typeof record.raw === "string") return { message: record.raw.slice(0, 500) };
  return {};
}

export function geminiText(data: unknown) {
  const typed = data as GeminiGenerateResponse;
  return typed.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
}

export function geminiFinishReason(data: unknown) {
  return (data as GeminiGenerateResponse).candidates?.[0]?.finishReason;
}

export function isGeminiRateLimit(reason: string, status?: number, errorType?: string) {
  return status === 429 || status === 503 || errorType === "RESOURCE_EXHAUSTED" || errorType === "UNAVAILABLE" || /RESOURCE_EXHAUSTED|UNAVAILABLE|rate limit|quota|429|503|high demand|try again later|temporar|overload/i.test(reason);
}

function geminiErrorStillConnected(reason: string, status?: number, errorType?: string) {
  if (isGeminiRateLimit(reason, status, errorType)) return true;
  return providerErrorStillConnected(reason, status, errorType);
}

async function readGeminiJson(response: Response): Promise<unknown> {
  return response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
}

function stripJsonFence(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}
