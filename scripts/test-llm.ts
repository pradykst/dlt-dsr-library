import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

type Provider = "none" | "gemini" | "groq" | "mock";

type Config = {
  provider: Provider;
  apiKey?: string;
  model?: string;
  baseUrl: string;
  timeoutMs: number;
  protocol: "gemini-generate-content" | "chat-completions";
};

const requested = providerName(process.env.LLM_PROVIDER ?? process.env.CHAT_PROVIDER ?? "none");
const config = providerConfig(requested);
if (!config) {
  console.log(JSON.stringify({ ok: true, provider: requested, provider_configured: requested === "mock", provider_connected: requested === "mock" }, null, 2));
  process.exit(0);
}

const provider_configured = Boolean(config.apiKey && config.model);
if (!provider_configured) {
  console.error(JSON.stringify({ ok: false, provider: config.provider, provider_configured, provider_connected: false, error: missingConfigError(config.provider), base_url: safeBaseUrl(config.baseUrl) }, null, 2));
  process.exit(1);
}

const result = await checkProviderConnection(config);
const payload = { ok: result.connected, provider: config.provider, provider_configured, provider_connected: result.connected, status: result.status, error: result.error, provider_error_type: result.error_type, base_url: safeBaseUrl(config.baseUrl) };
console.log(JSON.stringify(payload, null, 2));
if (!result.connected) process.exit(1);

function providerName(value: string): Provider {
  const normalized = value.toLowerCase();
  return normalized === "gemini" || normalized === "groq" || normalized === "mock" || normalized === "none" ? normalized : "none";
}

function providerConfig(provider: Provider): Config | undefined {
  if (provider === "gemini") return { provider, apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL, baseUrl: process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta", timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS ?? 60000), protocol: "gemini-generate-content" };
  if (provider === "groq") return { provider, apiKey: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL, baseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1", timeoutMs: Number(process.env.GROQ_TIMEOUT_MS ?? 60000), protocol: "chat-completions" };
  return undefined;
}

async function checkProviderConnection(config: Config) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = config.protocol === "gemini-generate-content" ? await fetch(geminiGenerateContentUrl(config.baseUrl, config.model ?? "", config.apiKey ?? ""), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Say ok" }] }], generationConfig: { temperature: 0, maxOutputTokens: 5 } })
    }) : await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({ model: config.model, max_tokens: 5, temperature: 0, messages: [{ role: "user", content: "Say ok" }] })
    });
    if (response.ok) return { connected: true, status: response.status };
    const error = await responseErrorInfo(response);
    const rateLimited = response.status === 429 || error.type === "RESOURCE_EXHAUSTED" || error.type === "rate_limit_exceeded" || /RESOURCE_EXHAUSTED|rate limit|quota/i.test(error.message ?? "");
    return { connected: rateLimited, status: response.status, error: error.message, error_type: error.type ?? (rateLimited && config.provider === "gemini" ? "RESOURCE_EXHAUSTED" : rateLimited ? "rate_limit_exceeded" : undefined) };
  } catch (error) {
    return { connected: false, status: undefined, error: error instanceof Error ? error.message : "LLM health request failed" };
  } finally {
    clearTimeout(timer);
  }
}

async function responseErrorInfo(response: Response): Promise<{ message?: string; type?: string }> {
  const text = await response.text().catch(() => "");
  if (!text) return { message: `Health request failed: ${response.status}` };
  try {
    const parsed = JSON.parse(text);
    const message = parsed?.error?.message ?? parsed?.message ?? text;
    const type = parsed?.error?.status ?? parsed?.error?.type ?? parsed?.error?.code ?? parsed?.type;
    return { message: typeof message === "string" ? message : `Health request failed: ${response.status}`, type: typeof type === "string" ? type : undefined };
  } catch {
    return { message: text.slice(0, 500) };
  }
}

function geminiGenerateContentUrl(baseUrl: string, model: string, apiKey: string) {
  const normalizedModel = model.replace(/^models\//, "");
  return `${baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(normalizedModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
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
  if (provider === "gemini") return "Missing GEMINI_API_KEY or GEMINI_MODEL";
  if (provider === "groq") return "Missing GROQ_API_KEY or GROQ_MODEL";
  return "No LLM provider configured";
}