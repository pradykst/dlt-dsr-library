import { NextResponse } from "next/server";
import { geminiErrorInfo, geminiGenerateContentUrl, isGeminiRateLimit } from "@/lib/llm/gemini.ts";
import { getRequestedLlmProviderName, isProviderResponseReachable, type LlmProviderName, type LlmProviderStatus } from "@/lib/llm/provider.ts";
import { getConfiguredLlmProvider } from "@/lib/okf/llm.ts";

type ProviderHealthConfig = {
  provider: LlmProviderName;
  apiKey?: string;
  model?: string;
  baseUrl: string;
  timeoutMs: number;
  protocol: "gemini-generate-content" | "chat-completions";
};

type ProviderHealthResult = { connected: boolean; status?: number; error?: string; error_type?: string; cached?: boolean; stale?: boolean };
type ProviderHealthCacheEntry = { result: ProviderHealthResult; checkedAt: number };

const healthCache = new Map<string, ProviderHealthCacheEntry>();
const healthCacheTtlMs = 60_000;
const staleOnTransientMs = 10 * 60_000;

export async function GET(request: Request) {
  const requestedProvider = getRequestedLlmProviderName();
  const configuredProvider = getConfiguredLlmProvider();
  const provider = configuredProvider === "none" ? requestedProvider : configuredProvider;
  if (provider === "mock") {
    const status: LlmProviderStatus = { provider, configured: true, reachable: false, attempted: false, outcome: "configured" };
    return NextResponse.json({
      ok: true,
      ...status,
      provider_configured: status.configured,
      provider_connected: status.reachable,
      status: status.http_status,
      health_mode: "mock",
      base_url: "mock"
    });
  }

  const config = providerConfig(provider);
  const configured = Boolean(config?.apiKey && config.model);
  const liveHealth = shouldRunLiveHealth(new URL(request.url), provider);
  const health: ProviderHealthResult = config && configured
    ? liveHealth ? await cachedProviderHealth(config) : passiveProviderHealth()
    : { connected: false, status: undefined, error: config ? missingConfigError(config.provider) : "No LLM provider configured" };
  const status = canonicalHealthStatus(provider, configured, liveHealth, health);

  return NextResponse.json({
    ok: status.outcome === "not_configured" || status.outcome === "configured" || status.outcome === "reachable",
    ...status,
    error: health.error,
    health_cached: health.cached,
    health_stale: health.stale,
    health_mode: liveHealth ? "live" : "passive",
    base_url: config ? safeBaseUrl(config.baseUrl) : undefined,
    // Compatibility aliases for clients deployed before the canonical contract.
    provider_configured: status.configured,
    provider_connected: status.reachable,
    status: status.http_status,
    provider_error_type: status.error_type
  });
}

function canonicalHealthStatus(provider: LlmProviderName, configured: boolean, liveHealth: boolean, health: ProviderHealthResult): LlmProviderStatus {
  const attempted = liveHealth && configured;
  const reachable = attempted && isProviderResponseReachable(health.status, health.error_type);
  const rateLimited = provider === "gemini" ? isGeminiRateLimit(health.error ?? "", health.status, health.error_type) : health.status === 429 || /rate limit|quota|resource.exhausted/i.test(`${health.error_type ?? ""} ${health.error ?? ""}`);
  const outcome = provider === "none" || !configured
    ? "not_configured"
    : !attempted
      ? "configured"
      : rateLimited
        ? "rate_limited"
        : reachable && health.status !== undefined && health.status >= 200 && health.status < 300
          ? "reachable"
          : "provider_error";
  return { provider, configured, reachable, attempted, http_status: health.status, outcome, error_type: health.error_type, fallback_reason: outcome === "rate_limited" || outcome === "provider_error" ? health.error : undefined };
}
function passiveProviderHealth(): ProviderHealthResult {
  return { connected: false };
}

function providerConfig(provider: LlmProviderName): ProviderHealthConfig | undefined {
  if (provider === "gemini") return { provider, apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL, baseUrl: process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta", timeoutMs: Number(process.env.GEMINI_HEALTH_TIMEOUT_MS ?? process.env.GEMINI_TIMEOUT_MS ?? 60000), protocol: "gemini-generate-content" };
  if (provider === "groq") return { provider, apiKey: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL, baseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1", timeoutMs: Number(process.env.GROQ_TIMEOUT_MS ?? 60000), protocol: "chat-completions" };
  return undefined;
}

async function cachedProviderHealth(config: ProviderHealthConfig): Promise<ProviderHealthResult> {
  const key = healthCacheKey(config);
  const cached = healthCache.get(key);
  const now = Date.now();
  if (cached && now - cached.checkedAt < healthCacheTtlMs) return { ...cached.result, cached: true };

  const live = await checkProviderConnection(config);
  if (live.connected) {
    healthCache.set(key, { result: { ...live, cached: undefined, stale: undefined }, checkedAt: now });
    return live;
  }

  if (cached && now - cached.checkedAt < staleOnTransientMs && isTransientHealthIssue(config.provider, live)) {
    return { ...cached.result, cached: true, stale: true, status: live.status ?? cached.result.status, error: live.error, error_type: live.error_type };
  }

  return live;
}

function healthCacheKey(config: ProviderHealthConfig) {
  return `${config.provider}:${config.model ?? ""}:${safeBaseUrl(config.baseUrl)}`;
}

async function checkProviderConnection(config: ProviderHealthConfig): Promise<ProviderHealthResult> {
  if (config.protocol === "gemini-generate-content") return checkGeminiConnection(config);
  return checkChatCompletionsConnection(config);
}

async function checkGeminiConnection(config: ProviderHealthConfig): Promise<ProviderHealthResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(geminiGenerateContentUrl(config.baseUrl, config.model ?? "", config.apiKey ?? ""), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Say ok" }] }], generationConfig: { temperature: 0, maxOutputTokens: 5 } })
    });
    if (response.ok) return { connected: true, status: response.status };
    const data = await response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
    const error = geminiErrorInfo(data);
    const message = error.message ?? `Gemini health request failed: ${response.status}`;
    const transient = isGeminiRateLimit(message, response.status, error.type);
    const transientType = response.status === 503 ? "UNAVAILABLE" : "RESOURCE_EXHAUSTED";
    return { connected: transient, status: response.status, error: message, error_type: error.type ?? (transient ? transientType : undefined) };
  } catch (error) {
    return { connected: false, status: undefined, error: error instanceof Error ? error.message : "Gemini health request failed" };
  } finally {
    clearTimeout(timer);
  }
}

async function checkChatCompletionsConnection(config: ProviderHealthConfig): Promise<ProviderHealthResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({ model: config.model, max_tokens: 5, temperature: 0, messages: [{ role: "user", content: "Say ok" }] })
    });
    if (response.ok) return { connected: true, status: response.status };
    const error = await responseErrorInfo(response);
    const rateLimited = response.status === 429 || error.type === "rate_limit_exceeded" || /rate limit|quota/i.test(error.message ?? "");
    return { connected: rateLimited, status: response.status, error: error.message, error_type: error.type ?? (rateLimited ? "rate_limit_exceeded" : undefined) };
  } catch (error) {
    return { connected: false, status: undefined, error: error instanceof Error ? error.message : `${providerLabel(config.provider)} health request failed` };
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
    const type = parsed?.error?.type ?? parsed?.error?.code ?? parsed?.type;
    return { message: typeof message === "string" ? message : `Health request failed: ${response.status}`, type: typeof type === "string" ? type : undefined };
  } catch {
    return { message: text.slice(0, 500) };
  }
}

function isTransientHealthIssue(provider: LlmProviderName, result: ProviderHealthResult) {
  const message = result.error ?? "";
  if (provider === "gemini") return isGeminiRateLimit(message, result.status, result.error_type) || /aborted|abort|timeout|ETIMEDOUT/i.test(message);
  if (provider === "groq") return result.status === 429 || result.error_type === "rate_limit_exceeded" || /rate limit|quota|timeout|aborted|abort/i.test(message);
  return false;
}

function shouldRunLiveHealth(url: URL, provider: LlmProviderName) {
  return url.searchParams.get("live") === "1" || envFlag("LLM_HEALTH_LIVE") || envFlag(`${provider.toUpperCase()}_HEALTH_LIVE`);
}

function envFlag(name: string) {
  return String(process.env[name] ?? "false").toLowerCase() === "true";
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
  if (provider === "gemini") return "Missing GEMINI_API_KEY or GEMINI_MODEL";
  if (provider === "groq") return "Missing GROQ_API_KEY or GROQ_MODEL";
  if (provider === "mock") return undefined;
  return "No LLM provider configured";
}

function providerLabel(provider: LlmProviderName) {
  if (provider === "gemini") return "Gemini";
  if (provider === "groq") return "Groq";
  if (provider === "mock") return "Mock";
  return "LLM";
}
