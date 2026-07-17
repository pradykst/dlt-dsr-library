import "server-only";

import { OpenAiConfigurationError } from "./errors.ts";

export const OPENAI_REASONING_EFFORTS = [
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
] as const;

export type OpenAiReasoningEffort = (typeof OPENAI_REASONING_EFFORTS)[number];

export interface NativeOpenAiEnvironment {
  apiKey: string;
  model: string;
  reasoningEffort: OpenAiReasoningEffort;
  moderationEnabled: boolean;
  maxOutputTokens: number;
  diagramMaxOutputTokens: number;
}

const DEFAULT_MAX_OUTPUT_TOKENS = 1_800;
const DEFAULT_DIAGRAM_MAX_OUTPUT_TOKENS = 4_096;
const MIN_OUTPUT_TOKENS = 128;
const MAX_OUTPUT_TOKENS = 16_384;

let cachedEnvironment: NativeOpenAiEnvironment | undefined;

function requiredValue(
  environment: NodeJS.ProcessEnv,
  key: "OPENAI_API_KEY" | "OPENAI_MODEL",
): string {
  const value = environment[key]?.trim();
  if (!value) {
    throw new OpenAiConfigurationError(
      `${key} is not configured for the native OKF assistant.`,
    );
  }
  return value;
}

function optionalBoolean(value: string | undefined, key: string): boolean {
  if (value === undefined || value.trim() === "") return false;
  const normalized = value.trim().toLocaleLowerCase("en");
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  throw new OpenAiConfigurationError(`${key} must be true or false.`);
}

function optionalInteger(
  value: string | undefined,
  fallback: number,
  key: string,
): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < MIN_OUTPUT_TOKENS ||
    parsed > MAX_OUTPUT_TOKENS
  ) {
    throw new OpenAiConfigurationError(
      `${key} must be an integer between ${MIN_OUTPUT_TOKENS} and ${MAX_OUTPUT_TOKENS}.`,
    );
  }
  return parsed;
}

function reasoningEffort(value: string | undefined): OpenAiReasoningEffort {
  const normalized = (value?.trim() || "medium").toLocaleLowerCase("en");
  if ((OPENAI_REASONING_EFFORTS as readonly string[]).includes(normalized)) {
    return normalized as OpenAiReasoningEffort;
  }
  throw new OpenAiConfigurationError(
    `OPENAI_REASONING_EFFORT must be one of: ${OPENAI_REASONING_EFFORTS.join(", ")}.`,
  );
}

/** Reads only the explicitly supported OpenAI variables and never enumerates env. */
export function readOpenAiEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): NativeOpenAiEnvironment {
  if (environment === process.env && cachedEnvironment) return cachedEnvironment;

  const parsed: NativeOpenAiEnvironment = {
    apiKey: requiredValue(environment, "OPENAI_API_KEY"),
    model: requiredValue(environment, "OPENAI_MODEL"),
    reasoningEffort: reasoningEffort(environment.OPENAI_REASONING_EFFORT),
    moderationEnabled: optionalBoolean(
      environment.OPENAI_ENABLE_MODERATION,
      "OPENAI_ENABLE_MODERATION",
    ),
    maxOutputTokens: optionalInteger(
      environment.OPENAI_MAX_OUTPUT_TOKENS,
      DEFAULT_MAX_OUTPUT_TOKENS,
      "OPENAI_MAX_OUTPUT_TOKENS",
    ),
    diagramMaxOutputTokens: Math.max(
      DEFAULT_DIAGRAM_MAX_OUTPUT_TOKENS,
      optionalInteger(
        environment.OPENAI_DIAGRAM_MAX_OUTPUT_TOKENS,
        DEFAULT_DIAGRAM_MAX_OUTPUT_TOKENS,
        "OPENAI_DIAGRAM_MAX_OUTPUT_TOKENS",
      ),
    ),
  };

  if (environment === process.env) cachedEnvironment = parsed;
  return parsed;
}

export function clearOpenAiEnvironmentCacheForTests(): void {
  cachedEnvironment = undefined;
}
