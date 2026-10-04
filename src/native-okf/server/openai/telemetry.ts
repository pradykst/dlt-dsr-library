import "server-only";

import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import type { NativeOpenAiClient } from "./client.ts";
import type { NativeOpenAiEnvironment } from "./env.ts";
import { RequestTooLargeError } from "./errors.ts";
import { DEFAULT_RETRIEVAL_LIMITS, MAX_RETRIEVAL_LIMITS } from "../retrieval-config.ts";
import { logNativeOkfModelTurn } from "../request-log.ts";

/** Includes instructions, history, repair drafts and structured-output schemas. */
// Offline near-cap acceptance reaches 240,812 bytes with canonical evidence,
// structured schema and answer material. Keep approximately 20% headroom.
export const MAX_NATIVE_OKF_MODEL_REQUEST_BYTES = 290_000;

/** Exact whole-request UTF-8 measurement, shared by the guard and offline audit. */
export function nativeOkfModelRequestBytes(body: ResponseCreateParamsNonStreaming): number {
  return Buffer.byteLength(JSON.stringify({ ...body, service_tier: "default" }), "utf8");
}

export interface NativeOkfModelCallMetrics {
  model: string;
  reasoningEffort: string | null;
  status: string;
  inputTokens: number | null;
  cachedInputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  totalTokens: number | null;
  requestBytes: number;
  maxOutputTokens: number | null;
  durationMs: number;
}

export interface NativeOkfModelTurnMetrics {
  status: "success" | "error";
  requestMode: string;
  scopeType: "corpus" | "paper";
  model: string;
  reasoningEffort: string;
  maxOutputTokens: number;
  diagramMaxOutputTokens: number;
  groundedContextCharacters: number;
  groundedContextBudget: number;
  groundedSourceCount: number;
  defaultContextBudget: number;
  hardContextBudget: number;
  maxModelRequestBytes: number;
  applicationCommit: string | null;
  buildTimestamp: string | null;
  requestDurationMs: number;
  responseCompletionDurationMs: number;
  firstTextTokenMs: null;
  inputTokens: number | null;
  cachedInputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  totalTokens: number | null;
  calls: NativeOkfModelCallMetrics[];
}

function tokenCount(value: number | undefined): number | null {
  return Number.isSafeInteger(value) && value! >= 0 ? value! : null;
}

/** One collector per turn; never wraps or mutates the process-global SDK client. */
export class NativeOkfTurnTelemetry {
  private readonly calls: NativeOkfModelCallMetrics[] = [];
  private configuration?: NativeOpenAiEnvironment;
  private contextCharacters = 0;
  private contextBudget = 0;
  private sourceCount = 0;
  private readonly requestMode: string;
  private readonly scopeType: "corpus" | "paper";
  private readonly startedAt: number;

  constructor(
    requestMode: string,
    scopeType: "corpus" | "paper",
    startedAt = performance.now(),
  ) {
    this.requestMode = requestMode;
    this.scopeType = scopeType;
    this.startedAt = startedAt;
  }

  observeClient(
    client: NativeOpenAiClient,
    environment: NativeOpenAiEnvironment,
    contextCharacters: number,
    contextBudget: number,
    sourceCount: number,
  ): NativeOpenAiClient {
    this.configuration = environment;
    this.contextCharacters = contextCharacters;
    this.contextBudget = Math.min(contextBudget, MAX_RETRIEVAL_LIMITS.maxContextCharacters);
    this.sourceCount = sourceCount;
    return {
      moderations: client.moderations,
      responses: {
        create: async (body: ResponseCreateParamsNonStreaming) => {
          const standardBody = { ...body, service_tier: "default" as const };
          const requestBytes = nativeOkfModelRequestBytes(standardBody);
          if (requestBytes > MAX_NATIVE_OKF_MODEL_REQUEST_BYTES) {
            throw new RequestTooLargeError(
              "This request contains more evidence and conversation detail than fits the safe model request limit. Narrow the question or selected papers and try again.",
            );
          }
          const startedAt = performance.now();
          const metrics: NativeOkfModelCallMetrics = {
            model: body.model ?? environment.model,
            reasoningEffort: body.reasoning?.effort ?? null,
            status: "error",
            inputTokens: null,
            cachedInputTokens: null,
            outputTokens: null,
            reasoningTokens: null,
            totalTokens: null,
            requestBytes,
            maxOutputTokens: body.max_output_tokens ?? null,
            durationMs: 0,
          };
          try {
            const response = await client.responses.create(standardBody);
            metrics.model = response.model || body.model || environment.model;
            metrics.status = response.status ?? "unknown";
            metrics.inputTokens = tokenCount(response.usage?.input_tokens);
            metrics.cachedInputTokens = tokenCount(response.usage?.input_tokens_details?.cached_tokens);
            metrics.outputTokens = tokenCount(response.usage?.output_tokens);
            metrics.reasoningTokens = tokenCount(response.usage?.output_tokens_details?.reasoning_tokens);
            metrics.totalTokens = tokenCount(response.usage?.total_tokens);
            return response;
          } finally {
            metrics.durationMs = Math.round(performance.now() - startedAt);
            this.calls.push(metrics);
          }
        },
      },
    };
  }

  finish(status: "success" | "error"): NativeOkfModelTurnMetrics | undefined {
    const environment = this.configuration;
    if (!environment || this.calls.length === 0) return undefined;
    const sum = (key: "inputTokens" | "cachedInputTokens" | "outputTokens" | "reasoningTokens" | "totalTokens") =>
      this.calls.some((call) => call[key] === null)
        ? null : this.calls.reduce((total, call) => total + call[key]!, 0);
    const durationMs = Math.round(performance.now() - this.startedAt);
    const metrics: NativeOkfModelTurnMetrics = {
      status,
      requestMode: this.requestMode,
      scopeType: this.scopeType,
      model: environment.model,
      reasoningEffort: environment.reasoningEffort,
      maxOutputTokens: environment.maxOutputTokens,
      diagramMaxOutputTokens: environment.diagramMaxOutputTokens,
      groundedContextCharacters: this.contextCharacters,
      groundedContextBudget: this.contextBudget,
      groundedSourceCount: this.sourceCount,
      defaultContextBudget: DEFAULT_RETRIEVAL_LIMITS.maxContextCharacters,
      hardContextBudget: MAX_RETRIEVAL_LIMITS.maxContextCharacters,
      maxModelRequestBytes: MAX_NATIVE_OKF_MODEL_REQUEST_BYTES,
      applicationCommit: process.env.NATIVE_OKF_BUILD_COMMIT ?? null,
      buildTimestamp: process.env.NATIVE_OKF_BUILD_TIMESTAMP ?? null,
      requestDurationMs: durationMs,
      responseCompletionDurationMs: durationMs,
      firstTextTokenMs: null,
      inputTokens: sum("inputTokens"),
      cachedInputTokens: sum("cachedInputTokens"),
      outputTokens: sum("outputTokens"),
      reasoningTokens: sum("reasoningTokens"),
      totalTokens: sum("totalTokens"),
      calls: this.calls.map((call) => ({ ...call })),
    };
    logNativeOkfModelTurn(metrics);
    return metrics;
  }
}
