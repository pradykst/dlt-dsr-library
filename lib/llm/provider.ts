export type LlmProviderName = "none" | "featherless" | "groq" | "openai";

export function getLlmProviderName(): LlmProviderName {
  const provider = (process.env.LLM_PROVIDER ?? process.env.CHAT_PROVIDER ?? "none").toLowerCase() as LlmProviderName;
  if (provider === "featherless" && process.env.FEATHERLESS_API_KEY) return "featherless";
  if (provider === "groq" && process.env.GROQ_API_KEY) return "groq";
  if (provider === "openai" && process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

