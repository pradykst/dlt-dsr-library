import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

type Provider = "none" | "featherless" | "groq" | "openai";

type Config = {
  provider: Provider;
  apiKey?: string;
  model?: string;
  baseUrl: string;
  timeoutMs: number;
};

const requested = providerName(process.env.LLM_PROVIDER ?? process.env.CHAT_PROVIDER ?? "none");
const config = providerConfig(requested);
if (!config) {
  console.log(JSON.stringify({ ok: true, provider: "none", provider_configured: false, provider_connected: false }, null, 2));
  process.exit(0);
}

const provider_configured = Boolean(config.apiKey && config.model);
if (!provider_configured) {
  console.error(JSON.stringify({ ok: false, provider: config.provider, provider_configured, provider_connected: false, error: missingConfigError(config.provider), base_url: safeBaseUrl(config.baseUrl) }, null, 2));
  process.exit(1);
}

const result = await checkProviderConnection(config);
const payload = { ok: result.connected, provider: config.provider, provider_configured, provider_connected: result.connected, status: result.status, error: result.error, base_url: safeBaseUrl(config.baseUrl) };
console.log(JSON.stringify(payload, null, 2));
if (!result.connected) process.exit(1);

function providerName(value: string): Provider {
  const normalized = value.toLowerCase();
  return normalized === "featherless" || normalized === "groq" || normalized === "openai" || normalized === "none" ? normalized : "none";
}

function providerConfig(provider: Provider): Config | undefined {
  if (provider === "groq") return { provider, apiKey: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL, baseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1", timeoutMs: Number(process.env.GROQ_TIMEOUT_MS ?? 60000) };
  if (provider === "featherless") return { provider, apiKey: process.env.FEATHERLESS_API_KEY, model: process.env.FEATHERLESS_MODEL, baseUrl: process.env.FEATHERLESS_BASE_URL ?? "https://api.featherless.ai/v1", timeoutMs: Number(process.env.FEATHERLESS_TIMEOUT_MS ?? 60000) };
  if (provider === "openai") return { provider, apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL, baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1", timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS ?? 60000) };
  return undefined;
}

async function checkProviderConnection(config: Config) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({ model: config.model, max_tokens: 5, temperature: 0, messages: [{ role: "user", content: "Say ok" }] })
    });
    return { connected: response.ok, status: response.status, error: response.ok ? undefined : await responseErrorMessage(response) };
  } catch (error) {
    return { connected: false, status: undefined, error: error instanceof Error ? error.message : "LLM health request failed" };
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

function missingConfigError(provider: Provider) {
  if (provider === "groq") return "Missing GROQ_API_KEY or GROQ_MODEL";
  if (provider === "featherless") return "Missing FEATHERLESS_API_KEY or FEATHERLESS_MODEL";
  if (provider === "openai") return "Missing OPENAI_API_KEY or OPENAI_MODEL";
  return "No LLM provider configured";
}