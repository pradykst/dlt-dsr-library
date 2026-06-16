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

export async function createChatCompletion(messages: RagChatMessage[], options: ChatCompletionOptions = {}) {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  if (!baseUrl || !apiKey || !model) {
    throw new Error("LLM is not configured. Set LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL.");
  }

  const maxTokens = options.maxTokens ?? numberFromEnv("LLM_MAX_TOKENS", 4096);
  const firstAttempt = await requestChatCompletion({
    baseUrl,
    apiKey,
    model,
    messages,
    maxTokens,
    conciseRetry: false
  });

  const firstAnswer = extractAnswer(firstAttempt);
  const firstFinishReason = firstAttempt.choices?.[0]?.finish_reason;
  if (firstAnswer && firstFinishReason !== "length") return firstAnswer;

  if (firstFinishReason === "length" || !firstAnswer) {
    const retry = await requestChatCompletion({
      baseUrl,
      apiKey,
      model,
      messages,
      maxTokens: options.conciseRetryMaxTokens ?? Math.max(maxTokens, 4096),
      conciseRetry: true
    });
    const retryAnswer = extractAnswer(retry);
    const retryFinishReason = retry.choices?.[0]?.finish_reason;
    if (retryAnswer && retryFinishReason !== "length") return retryAnswer;
    if (retryFinishReason === "length") {
      throw new Error("LLM response hit the token limit twice. Try a narrower question or increase LLM_MAX_TOKENS.");
    }
  }

  const message = firstAttempt.choices?.[0]?.message;
  if (message?.reasoning_content?.trim()) {
    throw new Error("LLM returned reasoning_content but no final answer. The request adds /no_think for Qwen models; if this continues, disable reasoning/thinking in LM Studio or use a non-reasoning instruct model.");
  }
  throw new Error("LLM response did not include an answer.");
}

async function requestChatCompletion({
  baseUrl,
  apiKey,
  model,
  messages,
  maxTokens,
  conciseRetry
}: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: RagChatMessage[];
  maxTokens: number;
  conciseRetry: boolean;
}) {
  const timeoutMs = numberFromEnv("LLM_TIMEOUT_MS", 900000);
  const controller = new AbortController();
  const timeout = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
  const preparedMessages = prepareMessages(conciseRetry ? withConciseRetryInstruction(messages) : messages, model);

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
        temperature: 0.2,
        max_tokens: maxTokens,
        stream: false,
        ...(shouldDisableThinking(model) ? {
          enable_thinking: false,
          chat_template_kwargs: { enable_thinking: false },
          reasoning: { effort: "none" }
        } : {})
      })
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`LLM request timed out after ${timeoutMs}ms.`);
    }
    throw new Error(`LLM fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${details}`);
  }

  return await response.json() as ChatCompletionResponse;
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

function prepareMessages(messages: RagChatMessage[], model: string): RagChatMessage[] {
  const disableThinking = shouldDisableThinking(model);
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
    content: `${prepared[lastUserIndex].content}\n\nRetry instruction: Return the final answer only, under 220 words, using the requested section headings and citations. Do not include reasoning.`
  };
  return prepared;
}
