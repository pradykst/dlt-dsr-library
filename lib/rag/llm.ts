import type { RagChatMessage } from "@/lib/rag/types";

type ChatCompletionResponse = {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      content?: string;
      reasoning_content?: string;
    };
  }>;
};

export type ChatCompletionOptions = {
  maxTokens?: number;
  conciseRetryMaxTokens?: number;
};

export type ChatCompletionResult = {
  content: string;
  provider: string;
  model: string;
  latencyMs: number;
  finishReason?: string;
};

type ProviderConfig = {
  provider: "featherless" | "local";
  baseUrl: string;
  apiKey: string;
  model: string;
};

export class LlmProviderError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code = "llm_error", status?: number) {
    super(message);
    this.name = "LlmProviderError";
    this.code = code;
    this.status = status;
  }
}

export function getLlmProviderConfig(): Omit<ProviderConfig, "apiKey"> {
  const config = resolveProviderConfig();
  return {
    provider: config.provider,
    baseUrl: config.baseUrl,
    model: config.model
  };
}

export async function createChatCompletion(messages: RagChatMessage[], options: ChatCompletionOptions = {}) {
  const result = await createChatCompletionResult(messages, options);
  return result.content;
}

export async function createChatCompletionResult(messages: RagChatMessage[], options: ChatCompletionOptions = {}): Promise<ChatCompletionResult> {
  const config = resolveProviderConfig();
  const startedAt = Date.now();
  const maxTokens = options.maxTokens ?? numberFromEnv("LLM_MAX_TOKENS", 1200);
  const firstAttempt = await requestChatCompletion({
    ...config,
    messages,
    maxTokens,
    conciseRetry: false
  });

  const firstAnswer = extractAnswer(firstAttempt);
  const firstFinishReason = firstAttempt.choices?.[0]?.finish_reason;
  if (firstAnswer && firstFinishReason !== "length") {
    return {
      content: firstAnswer,
      provider: config.provider,
      model: config.model,
      latencyMs: Date.now() - startedAt,
      finishReason: firstFinishReason
    };
  }

  if (firstFinishReason === "length" || !firstAnswer) {
    const retry = await requestChatCompletion({
      ...config,
      messages,
      maxTokens: options.conciseRetryMaxTokens ?? Math.min(Math.max(maxTokens, 1600), 2400),
      conciseRetry: true
    });
    const retryAnswer = extractAnswer(retry);
    const retryFinishReason = retry.choices?.[0]?.finish_reason;
    if (retryAnswer && retryFinishReason !== "length") {
      return {
        content: retryAnswer,
        provider: config.provider,
        model: config.model,
        latencyMs: Date.now() - startedAt,
        finishReason: retryFinishReason
      };
    }
    if (retryFinishReason === "length") {
      throw new LlmProviderError("The model response hit the token limit twice. Try a narrower question or increase LLM_MAX_TOKENS.", "llm_length");
    }
  }

  throw new LlmProviderError("The model response did not include visible assistant content.", "llm_empty");
}

async function requestChatCompletion({
  provider,
  baseUrl,
  apiKey,
  model,
  messages,
  maxTokens,
  conciseRetry
}: ProviderConfig & {
  messages: RagChatMessage[];
  maxTokens: number;
  conciseRetry: boolean;
}) {
  const timeoutMs = numberFromEnv(provider === "featherless" ? "FEATHERLESS_TIMEOUT_MS" : "LLM_TIMEOUT_MS", provider === "featherless" ? 60000 : 120000);
  const controller = new AbortController();
  const timeout = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
  const preparedMessages = prepareMessages(conciseRetry ? withConciseRetryInstruction(messages) : messages, provider, model);

  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: timeoutMs > 0 ? controller.signal : undefined,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: preparedMessages,
        temperature: 0.15,
        max_tokens: maxTokens,
        stream: false,
        ...(provider === "local" && shouldDisableThinking(model) ? {
          enable_thinking: false,
          chat_template_kwargs: { enable_thinking: false },
          reasoning: { effort: "none" }
        } : {})
      })
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new LlmProviderError(`LLM request timed out after ${timeoutMs}ms.`, "llm_timeout");
    }
    throw new LlmProviderError(`LLM fetch failed: ${error instanceof Error ? error.message : String(error)}`, "llm_fetch");
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  const responseText = await response.text();

  if (!response.ok) {
    const details = sanitizeProviderError(responseText);
    throw new LlmProviderError(`LLM request failed (${response.status}): ${details}`, "llm_http", response.status);
  }

  const parsed = parseChatCompletionResponse(responseText);
  if (parsed) return parsed;

  throw new LlmProviderError(
    `LLM provider returned invalid JSON: ${sanitizeProviderError(responseText)}`,
    "llm_invalid_json"
  );
}

function parseChatCompletionResponse(responseText: string) {
  try {
    return JSON.parse(responseText) as ChatCompletionResponse;
  } catch {
    const repaired = repairDuplicateContentJson(responseText);
    if (!repaired || repaired === responseText) return null;
    try {
      return JSON.parse(repaired) as ChatCompletionResponse;
    } catch {
      return null;
    }
  }
}

function repairDuplicateContentJson(responseText: string) {
  return responseText
    .replace(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"\s*"content"\s*:\s*""/g, '"content":"$1"')
    .replace(/"content"\s*:\s*""\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"/g, '"content":"$1"');
}

function resolveProviderConfig(): ProviderConfig {
  const requested = (process.env.CHAT_PROVIDER ?? inferDefaultProvider()).toLowerCase();
  if (requested === "featherless") {
    const baseUrl = process.env.FEATHERLESS_BASE_URL ?? "https://api.featherless.ai/v1";
    const apiKey = process.env.FEATHERLESS_API_KEY;
    const model = process.env.FEATHERLESS_MODEL;
    if (!apiKey || !model) {
      throw new LlmProviderError("Featherless is not configured. Set FEATHERLESS_API_KEY and FEATHERLESS_MODEL.", "llm_config");
    }
    return { provider: "featherless", baseUrl, apiKey, model };
  }

  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!baseUrl || !apiKey || !model) {
    throw new LlmProviderError("Local LLM is not configured. Set LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL, or set CHAT_PROVIDER=featherless.", "llm_config");
  }
  return { provider: "local", baseUrl, apiKey, model };
}

function inferDefaultProvider() {
  return process.env.FEATHERLESS_API_KEY && process.env.FEATHERLESS_MODEL ? "featherless" : "local";
}

function extractAnswer(payload: ChatCompletionResponse) {
  const message = payload.choices?.[0]?.message;
  const answer = message?.content?.trim();
  return answer || null;
}

function numberFromEnv(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function prepareMessages(messages: RagChatMessage[], provider: ProviderConfig["provider"], model: string): RagChatMessage[] {
  const disableThinking = provider === "local" && shouldDisableThinking(model);
  if (!disableThinking) return messages;

  const prepared = [...messages];
  const lastUserIndex = prepared.findLastIndex((message) => message.role === "user");
  if (lastUserIndex === -1 || prepared[lastUserIndex].content.includes("/no_think")) return prepared;

  prepared[lastUserIndex] = {
    ...prepared[lastUserIndex],
    content: `/no_think\n\n${prepared[lastUserIndex].content}\n\n/no_think`
  };
  return prepared;
}

function shouldDisableThinking(model: string) {
  const configured = process.env.LLM_DISABLE_THINKING;
  if (configured) return ["1", "true", "yes"].includes(configured.toLowerCase());
  return model.toLowerCase().includes("qwen");
}

function withConciseRetryInstruction(messages: RagChatMessage[]): RagChatMessage[] {
  const prepared = [...messages];
  const lastUserIndex = prepared.findLastIndex((message) => message.role === "user");
  if (lastUserIndex === -1) return prepared;
  prepared[lastUserIndex] = {
    ...prepared[lastUserIndex],
    content: `${prepared[lastUserIndex].content}\n\nRetry instruction: Return visible final answer text only, under 180 words, with citations. Do not include hidden reasoning or JSON.`
  };
  return prepared;
}

function sanitizeProviderError(value: string) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [redacted]")
    .slice(0, 800);
}
