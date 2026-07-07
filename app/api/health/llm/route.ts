import { NextResponse } from "next/server";
import { getConfiguredLlmProvider } from "@/lib/okf/llm.ts";
import { getRequestedLlmProviderName, type LlmProviderName } from "@/lib/llm/provider.ts";

type ProviderHealthConfig = {
  provider: LlmProviderName;
  apiKey?: string;
  model?: string;
  baseUrl: string;
  timeoutMs: number;
};

export async function GET() {
  const requestedProvider = getRequestedLlmProviderName();
  const provider = getConfiguredLlmProvider() === "none" ? requestedProvider : getConfiguredLlmProvider();
  const config = providerConfig(provider);
  const provider_configured = Boolean(config?.apiKey && config.model);
  const health = config && provider_configured ? await checkProviderConnection(config) : { connected: false, status: undefined as number | undefined, error: config ? missingConfigError(config.provider) : "No LLM provider configured" };
  return NextResponse.json({
    ok: provider === "none" || health.connected,
    provider,
    provider_configured,
    provider_connected: health.connected,
    status: health.status,
    error: health.error,
    base_url: config ? safeBaseUrl(config.baseUrl) : undefined
  });
}

function providerConfig(provider: LlmProviderName): ProviderHealthConfig | undefined {
  if (provider === "groq") return { provider, apiKey: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL, baseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1", timeoutMs: Number(process.env.GROQ_TIMEOUT_MS ?? 60000) };
  if (provider === "featherless") return { provider, apiKey: process.env.FEATHERLESS_API_KEY, model: process.env.FEATHERLESS_MODEL, baseUrl: process.env.FEATHERLESS_BASE_URL ?? "https://api.featherless.ai/v1", timeoutMs: Number(process.env.FEATHERLESS_HEALTH_TIMEOUT_MS ?? process.env.FEATHERLESS_TIMEOUT_MS ?? 60000) };
  if (provider === "openai") return { provider, apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL, baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1", timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS ?? 60000) };
  return undefined;
}

async function checkProviderConnection(config: ProviderHealthConfig) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({ model: config.model, max_tokens: 5, temperature: 0, messages: [{ role: "user", content: "Say ok" }] })
    });
    const error = response.ok ? undefined : await responseErrorMessage(response);
    return { connected: response.ok, status: response.status, error };
  } catch (error) {
    return { connected: false, status: undefined, error: error instanceof Error ? error.message : `${providerLabel(config.provider)} health request failed` };
  } finally {
    clearTimeout(timer);
  }
}

async function responseErrorMessage(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return `Health request failed: ${response.status}`;
  try {
    const parsed = JSON.parse(text);
    const message = parsed?.error?.message ?? parsed?.message ?? text;
    return typeof message === "string" ? message : `Health request failed: ${response.status}`;
  } catch {
    return text.slice(0, 500);
  }
}

function safeBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/\?.*$/, "");
  }
}

function missingConfigError(provider: LlmProviderName) {
  if (provider === "groq") return "Missing GROQ_API_KEY or GROQ_MODEL";
  if (provider === "featherless") return "Missing FEATHERLESS_API_KEY or FEATHERLESS_MODEL";
  if (provider === "openai") return "Missing OPENAI_API_KEY or OPENAI_MODEL";
  return "No LLM provider configured";
}

function providerLabel(provider: LlmProviderName) {
  if (provider === "groq") return "Groq";
  if (provider === "featherless") return "Featherless";
  if (provider === "openai") return "OpenAI";
  return "LLM";
}