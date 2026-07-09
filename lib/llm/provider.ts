export type LlmProviderName = "none" | "featherless" | "groq" | "openai" | "mock";

export function getLlmProviderName(): LlmProviderName {
  const configured = (process.env.LLM_PROVIDER ?? process.env.CHAT_PROVIDER ?? "none").toLowerCase();
  const provider = isLlmProviderName(configured) ? configured : "none";
  if (process.env.GROQ_MOCK === "true") return "mock";
  if (provider === "mock") return "mock";
  if (provider === "featherless" && process.env.FEATHERLESS_API_KEY && process.env.FEATHERLESS_MODEL) return "featherless";
  if (provider === "groq" && process.env.GROQ_API_KEY && process.env.GROQ_MODEL) return "groq";
  if (provider === "openai" && process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL) return "openai";
  return "none";
}

export function getRequestedLlmProviderName(): LlmProviderName {
  const configured = (process.env.LLM_PROVIDER ?? process.env.CHAT_PROVIDER ?? "none").toLowerCase();
  return isLlmProviderName(configured) ? configured : "none";
}

function isLlmProviderName(value: string): value is LlmProviderName {
  return value === "none" || value === "featherless" || value === "groq" || value === "openai" || value === "mock";
}
