import { createHash } from "node:crypto";

import type { OkfChatResponse } from "../okf/chat.ts";
import type { OkfChatIntent } from "../okf/schema.ts";

export const DEFAULT_LLM_MAX_PROMPT_CHARS = 12_000;
export const DEFAULT_LLM_MAX_CONTEXT_EVIDENCE = 15;
export const DEFAULT_LLM_MAX_EVIDENCE_PER_MOVE = 3;
export const DEFAULT_LLM_MAX_MOVES = 7;
export const DEFAULT_LLM_REQUEST_CACHE_TTL_MS = 86_400_000;

export type LlmRuntimePolicy = {
  dailySafeMode: boolean;
  disableLiveSynthesis: boolean;
  maxPromptChars: number;
  maxContextEvidence: number;
  maxEvidencePerMove: number;
  maxMoves: number;
  requestCacheTtlMs: number;
  inputCostPerMillion?: number;
  outputCostPerMillion?: number;
};

export type LlmUsageSummary = {
  prompt_chars: number;
  output_chars: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_tokens_estimated: boolean;
  output_tokens_estimated: boolean;
  estimated_cost_usd?: number;
};

type CacheEntry = {
  value: unknown;
  storedAt: number;
};

const successfulSynthesisCache = new Map<string, CacheEntry>();
const MAX_SUCCESSFUL_SYNTHESIS_CACHE_ENTRIES = 256;

export function getLlmRuntimePolicy(): LlmRuntimePolicy {
  return {
    dailySafeMode: envFlag("LLM_DAILY_SAFE_MODE"),
    disableLiveSynthesis: envFlag("LLM_DISABLE_LIVE_SYNTHESIS"),
    maxPromptChars: boundedInteger("LLM_MAX_PROMPT_CHARS", DEFAULT_LLM_MAX_PROMPT_CHARS, 1_000, 100_000),
    maxContextEvidence: boundedInteger("LLM_MAX_CONTEXT_EVIDENCE", DEFAULT_LLM_MAX_CONTEXT_EVIDENCE, 1, 50),
    maxEvidencePerMove: boundedInteger("LLM_MAX_EVIDENCE_PER_MOVE", DEFAULT_LLM_MAX_EVIDENCE_PER_MOVE, 1, 5),
    maxMoves: boundedInteger("LLM_MAX_MOVES", DEFAULT_LLM_MAX_MOVES, 5, 7),
    requestCacheTtlMs: configuredRequestCacheTtlMs(),
    inputCostPerMillion: optionalNonnegativeNumber("LLM_INPUT_COST_PER_MILLION"),
    outputCostPerMillion: optionalNonnegativeNumber("LLM_OUTPUT_COST_PER_MILLION")
  };
}

/**
 * Central policy for network-backed LLM work. Deterministic answer types are
 * never eligible. Daily safe mode keeps synthesis restricted to canonical
 * design reuse and suppresses the optional planner call.
 */
export function isLiveLlmWorkAllowed(
  purpose: "synthesis" | "planning",
  intent: OkfChatIntent,
  policy = getLlmRuntimePolicy()
) {
  if (policy.disableLiveSynthesis) return false;
  if (purpose === "synthesis") {
    return intent === "DESIGN_REUSE_QUERY" || intent === "DESIGN_REUSE_FLOW_QUERY";
  }
  if (policy.dailySafeMode) return false;
  const eligible = intent === "DESIGN_REUSE_QUERY"
    || intent === "DESIGN_REUSE_FLOW_QUERY"
    || intent === "COMPARISON_QUERY"
    || intent === "EVALUATION_PLANNING_QUERY";
  if (!eligible) return false;
  return true;
}
export function isLlmTestRun() {
  return process.env.npm_lifecycle_event === "test"
    || process.argv.some((arg) => /okf\.test\.ts|node:test|--test/.test(arg));
}

export function isLiveSynthesisTestEnabled(provider: "gemini" | "groq") {
  if (envFlag("OKF_LLM_SYNTHESIS_LIVE_TEST")) return true;
  return envFlag(provider === "gemini" ? "GEMINI_LIVE_TEST" : "GROQ_LIVE_TEST");
}


/** Stable, secret-free cache key for a provider synthesis request. */
export function synthesisCacheKey(provider: string, model: string | undefined, response: OkfChatResponse) {
  const plan = response.answer_plan;
  const summary = {
    provider,
    model: model ?? "",
    user_query: plan?.user_query ?? response.interpreted_problem ?? "",
    answer_plan: {
      intent: plan?.intent ?? response.intent,
      selected_papers: (plan?.selected_papers ?? []).map((paper) => paper.paper_id),
      design_moves: (plan?.design_moves ?? []).map((move) => ({
        id: move.id,
        title: move.title,
        what_to_build: move.what_to_build,
        reused_requirement: move.reused_requirement,
        reused_principle: move.reused_principle,
        candidate_feature: move.candidate_feature,
        artifact_pattern: move.artifact_pattern,
        supporting_paper_ids: move.supporting_paper_ids,
        evidence_ids: move.evidence_ids,
        evidence_summaries: move.evidence_summaries,
        adaptation_status: move.adaptation_status,
        confidence: move.confidence
      }))
    }
  };
  return createHash("sha256").update(stableJson(summary)).digest("hex");
}

export function readSuccessfulSynthesisCache<T>(key: string, policy = getLlmRuntimePolicy()): T | undefined {
  if (policy.requestCacheTtlMs <= 0) return undefined;
  const cached = successfulSynthesisCache.get(key);
  if (!cached) return undefined;
  if (Date.now() - cached.storedAt >= policy.requestCacheTtlMs) {
    successfulSynthesisCache.delete(key);
    return undefined;
  }
  return cached.value as T;
}

export function writeSuccessfulSynthesisCache(key: string, value: unknown, policy = getLlmRuntimePolicy()) {
  if (policy.requestCacheTtlMs <= 0) return;
  successfulSynthesisCache.delete(key);
  successfulSynthesisCache.set(key, { value, storedAt: Date.now() });
  pruneExpiredCache(policy.requestCacheTtlMs);
}

/** Exposed for isolated tests and operational reset hooks. */
export function clearSuccessfulSynthesisCache() {
  successfulSynthesisCache.clear();
}

export function summarizeLlmUsage(input: {
  promptChars: number;
  outputChars: number;
  promptTokens?: number;
  outputTokens?: number;
}, policy = getLlmRuntimePolicy()): LlmUsageSummary {
  const inputTokens = validTokenCount(input.promptTokens) ?? approximateTokens(input.promptChars);
  const outputTokens = validTokenCount(input.outputTokens) ?? approximateTokens(input.outputChars);
  const result: LlmUsageSummary = {
    prompt_chars: input.promptChars,
    output_chars: input.outputChars,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: inputTokens + outputTokens,
    input_tokens_estimated: validTokenCount(input.promptTokens) === undefined,
    output_tokens_estimated: validTokenCount(input.outputTokens) === undefined
  };
  if (policy.inputCostPerMillion !== undefined && policy.outputCostPerMillion !== undefined) {
    result.estimated_cost_usd = roundCost(
      (inputTokens / 1_000_000) * policy.inputCostPerMillion
      + (outputTokens / 1_000_000) * policy.outputCostPerMillion
    );
  }
  return result;
}

export function logLlmUsage(provider: string, model: string | undefined, usage: LlmUsageSummary, cacheHit: boolean) {
  console.info("[okf-llm-usage]", {
    provider,
    model: model ?? "unknown",
    cache_hit: cacheHit,
    ...usage
  });
}

function pruneExpiredCache(ttlMs: number) {
  const now = Date.now();
  for (const [key, entry] of successfulSynthesisCache) {
    if (now - entry.storedAt >= ttlMs) successfulSynthesisCache.delete(key);
  }
  while (successfulSynthesisCache.size > MAX_SUCCESSFUL_SYNTHESIS_CACHE_ENTRIES) {
    const oldestKey = successfulSynthesisCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    successfulSynthesisCache.delete(oldestKey);
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function configuredRequestCacheTtlMs() {
  const isTestRun = isLlmTestRun();
  if (isTestRun && process.env.LLM_REQUEST_CACHE_TTL_MS === undefined) return 0;
  return boundedInteger("LLM_REQUEST_CACHE_TTL_MS", DEFAULT_LLM_REQUEST_CACHE_TTL_MS, 0, 7 * 86_400_000);
}
function envFlag(name: string) {
  return String(process.env[name] ?? "false").trim().toLowerCase() === "true";
}

function boundedInteger(name: string, fallback: number, min: number, max: number) {
  const parsed = Number(process.env[name]);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function optionalNonnegativeNumber(name: string) {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function validTokenCount(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : undefined;
}

function approximateTokens(characters: number) {
  return Math.max(1, Math.ceil(Math.max(0, characters) / 4));
}

function roundCost(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}
