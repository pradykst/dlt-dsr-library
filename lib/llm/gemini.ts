import type { OkfChatResponse } from "../okf/chat.ts";
import type { LlmSynthesisResult } from "../okf/schema.ts";
import { providerErrorStillConnected, safeBaseUrl } from "./groq.ts";
import {
  applySynthesisFallback,
  buildCompactSynthesisContext,
  guardStructuredSynthesis,
  mergeSynthesisIntoAnswerPayload,
  redactAndTruncate,
  renderStructuredSynthesisMarkdown,
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

export async function synthesizeWithGemini(deterministic: OkfChatResponse): Promise<OkfChatResponse> {
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

  try {
    context = buildCompactSynthesisContext(deterministic);
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
          responseSchema: structuredSynthesisJsonSchema
        }
      })
    });
    status = response.status;
    const data = await readGeminiJson(response);
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
    const answerMarkdown = renderStructuredSynthesisMarkdown(structured, context);
    const answerPayload = mergeSynthesisIntoAnswerPayload(deterministic, structured, "gemini");
    const usage = (data as GeminiGenerateResponse).usageMetadata;
    const synthesis: LlmSynthesisResult = {
      synthesis_mode: "gemini",
      answer_markdown: answerMarkdown,
      provider_metadata: {
        provider: "gemini",
        model,
        status,
        base_url: safeBaseUrl(baseUrl),
        prompt_tokens: usage?.promptTokenCount,
        completion_tokens: usage?.candidatesTokenCount,
        total_tokens: usage?.totalTokenCount
      },
      debug: {
        guard_outcome: "accepted",
        finish_reason: finishReason,
        structured_output: structured,
        raw_provider_output: redactAndTruncate(rawProviderOutput),
        compact_context: context,
        compact_context_chars: JSON.stringify(context).length
      }
    };
    return {
      ...deterministic,
      answer: answerMarkdown,
      answer_payload: answerPayload,
      llm_synthesis: synthesis,
      runtime: {
        ...deterministic.runtime,
        provider_configured: true,
        provider_connected: true,
        synthesis_attempted: true,
        synthesis_mode: "gemini",
        provider: "gemini",
        provider_status_code: status,
        provider_status: { provider: "gemini", configured: true, reachable: true, attempted: true, http_status: status, outcome: "synthesis_used" }
      },
      warnings: [...deterministic.warnings, "Gemini structured synthesis passed AnswerGuard and was rendered by the server."]
    };
  } catch (error) {
    const validationError = error instanceof SynthesisValidationError;
    const reason = error instanceof Error ? error.message : "Unknown Gemini synthesis error";
    const connected = attempted && (validationError || geminiErrorStillConnected(reason, status, rawProviderErrorType));
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
      compactContext: context
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function requestGeminiQueryPlanJson(prompt: unknown): Promise<unknown | undefined> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_PLANNER_MODEL ?? process.env.GEMINI_MODEL;
  if (!apiKey || !model) return undefined;
  const baseUrl = process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.GEMINI_QUERY_PLANNER_TIMEOUT_MS ?? 4_000));
  try {
    const response = await fetch(geminiGenerateContentUrl(baseUrl, model, apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "You are a query interpreter for a DSR OKF library assistant. Classify the user's request into one of the allowed intents. Extract requested element types, named papers, themes, criteria, and output shape. Do not answer the question. Return JSON only." }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(prompt) }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 700, responseMimeType: "application/json" }
      })
    });
    if (!response.ok) return undefined;
    const data = await readGeminiJson(response);
    if (geminiFinishReason(data)?.toUpperCase() !== "STOP") return undefined;
    const content = geminiText(data);
    return content.trim() ? JSON.parse(stripJsonFence(content)) : undefined;
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
