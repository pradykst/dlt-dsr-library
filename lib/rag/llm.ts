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

  const timeoutMs = numberFromEnv("LLM_TIMEOUT_MS", 900000);
  const controller = new AbortController();
  const timeout = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

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
        messages: prepareMessages(messages, model),
        temperature: 0.2,
        max_tokens: numberFromEnv("LLM_MAX_TOKENS", 2048),
        stream: false
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

  const payload = await response.json() as ChatCompletionResponse;
  const message = payload.choices?.[0]?.message;
  const answer = message?.content?.trim();
  if (!answer) {
    if (message?.reasoning_content?.trim()) {
      throw new Error("LLM returned reasoning_content but no final answer. The request now adds /no_think for Qwen models; if this continues, disable reasoning/thinking in LM Studio or use a non-reasoning instruct model.");
    }
    throw new Error("LLM response did not include an answer.");
  }

  return answer;
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
    content: `${prepared[lastUserIndex].content}\n\n/no_think`
  };
  return prepared;
}

function shouldDisableThinking(model: string) {
  const configured = process.env.LLM_DISABLE_THINKING;
  if (configured) return ["1", "true", "yes"].includes(configured.toLowerCase());
  return model.toLowerCase().includes("qwen");
}
