import type { RagChatMessage } from "@/lib/rag/types";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
      reasoning_content?: string;
    };
  }>;
};

export async function createChatCompletion(messages: RagChatMessage[]) {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  if (!baseUrl || !apiKey || !model) {
    throw new Error("LLM is not configured. Set LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL.");
  }

  const timeoutMs = numberFromEnv("LLM_TIMEOUT_MS", 90000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: numberFromEnv("LLM_MAX_TOKENS", 700),
        stream: false
      })
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`LLM request timed out after ${timeoutMs}ms.`);
    }
    throw new Error(`LLM fetch failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${details}`);
  }

  const payload = await response.json() as ChatCompletionResponse;
  const message = payload.choices?.[0]?.message;
  const answer = message?.content?.trim();
  if (!answer) {
    if (message?.reasoning_content?.trim()) {
      throw new Error("LLM returned reasoning_content but no final answer. In LM Studio, disable reasoning/thinking for the chat model or use a non-reasoning instruct model.");
    }
    throw new Error("LLM response did not include an answer.");
  }

  return answer;
}

function numberFromEnv(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
