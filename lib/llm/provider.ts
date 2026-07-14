export type LlmProviderOutcome =
  | "not_configured"
  | "configured"
  | "reachable"
  | "synthesis_skipped"
  | "synthesis_used"
  | "rate_limited"
  | "validation_error"
  | "provider_error";

/**
 * Canonical provider state shared by chat responses, health checks, and the UI.
 * `reachable` reports a usable provider endpoint/credential path. A successful
 * response and transient capacity errors (for example 429/503) are reachable;
 * authentication/authorization failures are not. Configuration alone never
 * makes it true. `attempted` reports an actual provider/health request.
 */
export type LlmProviderStatus = {
  provider: LlmProviderName;
  configured: boolean;
  reachable: boolean;
  attempted: boolean;
  http_status?: number;
  outcome: LlmProviderOutcome;
  error_type?: string;
  fallback_reason?: string;
};
export type LlmProviderName = "none" | "gemini" | "groq" | "mock";

/** Keep chat fallbacks and health checks aligned on provider reachability. */
export function isProviderResponseReachable(status?: number, errorType?: string) {
  if (status === undefined) return false;
  if (status === 401 || status === 403) return false;
  return !/auth(?:entication|orization)?|unauthenticated|permission[_ -]?denied|invalid[_ -]?(?:api[_ -]?)?key/i.test(errorType ?? "");
}

export function getLlmProviderName(): LlmProviderName {
  const configured = (process.env.LLM_PROVIDER ?? process.env.CHAT_PROVIDER ?? "none").toLowerCase();
  const provider = isLlmProviderName(configured) ? configured : "none";
  if (process.env.GROQ_MOCK === "true") return "mock";
  if (provider === "mock") return "mock";
  if (provider === "gemini" && process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL) return "gemini";
  if (provider === "groq" && process.env.GROQ_API_KEY && process.env.GROQ_MODEL) return "groq";
  return "none";
}

export function getRequestedLlmProviderName(): LlmProviderName {
  const configured = (process.env.LLM_PROVIDER ?? process.env.CHAT_PROVIDER ?? "none").toLowerCase();
  return isLlmProviderName(configured) ? configured : "none";
}

function isLlmProviderName(value: string): value is LlmProviderName {
  return value === "none" || value === "gemini" || value === "groq" || value === "mock";
}
