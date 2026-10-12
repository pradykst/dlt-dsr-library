import "server-only";

import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { OPENAI_MAX_RETRIES, OPENAI_REQUEST_TIMEOUT_MS, type NativeOpenAiClient, type NativeOkfModelStage } from "./client.ts";
import type { NativeOpenAiEnvironment } from "./env.ts";
import { normalizeOpenAiError, RequestTooLargeError } from "./errors.ts";
import { NativeOkfBudgetTimeoutError, NATIVE_OKF_CHAT_BUDGET_MS } from "./request-budget.ts";
import { DEFAULT_RETRIEVAL_LIMITS, MAX_RETRIEVAL_LIMITS } from "../retrieval-config.ts";
import { logNativeOkfModelTurn, logNativeOkfStage } from "../request-log.ts";

/** Includes instructions, history, repair drafts and structured-output schemas. */
// Offline near-cap acceptance reaches 240,812 bytes with canonical evidence,
// structured schema and answer material. Keep approximately 20% headroom.
export const MAX_NATIVE_OKF_MODEL_REQUEST_BYTES = 290_000;

/** Exact whole-request UTF-8 measurement, shared by the guard and offline audit. */
export function nativeOkfModelRequestBytes(body: ResponseCreateParamsNonStreaming): number {
  return Buffer.byteLength(JSON.stringify({ ...body, service_tier: "default" }), "utf8");
}

export interface NativeOkfModelCallMetrics {
  stage: NativeOkfModelStage;
  configuredTimeoutMs: number;
  maxRetries: number;
  errorCode?: string;
  timeoutKind?: string;
  upstreamStatus?: number;
  incompleteReason?: "max_output_tokens" | "content_filter";
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
  stages: NativeOkfStageMetrics[];
  requestBudgetMs: number;
  requestId?: string;
}

export type NativeOkfExecutionStage = "intent-classification" | "retrieval" | "retrieval-assembly"
  | "context-construction" | "diagram-grounding" | "diagram-generation" | "response-validation";
export interface NativeOkfStageMetrics {
  stage: NativeOkfExecutionStage;
  durationMs: number;
  status: "success" | "error";
  errorCode?: string;
}

function tokenCount(value: number | undefined): number | null {
  return Number.isSafeInteger(value) && value! >= 0 ? value! : null;
}

/** One collector per turn; never wraps or mutates the process-global SDK client. */
export class NativeOkfTurnTelemetry {
  private readonly calls: NativeOkfModelCallMetrics[] = [];
  private readonly stages: NativeOkfStageMetrics[] = [];
  private configuration?: NativeOpenAiEnvironment;
  private contextCharacters = 0;
  private contextBudget = 0;
  private sourceCount = 0;
  private readonly requestMode: string;
  private readonly scopeType: "corpus" | "paper";
  private readonly startedAt: number;
  private readonly requestId?: string;

  constructor(
    requestMode: string,
    scopeType: "corpus" | "paper",
    startedAt = performance.now(),
    requestId?: string,
  ) {
    this.requestMode = requestMode;
    this.scopeType = scopeType;
    this.startedAt = startedAt;
    this.requestId = requestId;
  }

  get requestStartedAt(): number { return this.startedAt; }

  private stageEvent(stage: NativeOkfExecutionStage | NativeOkfModelStage, event: "started" | "completed", fields: object = {}): void {
    // Only fixed stage labels, aggregate numbers and normalized error codes enter fields.
    logNativeOkfStage({ requestId: this.requestId, requestMode: this.requestMode, stage, event, ...fields });
  }

  recordStage(stage: NativeOkfExecutionStage, durationMs: number, status: "success" | "error", errorCode?: string): void {
    const metrics = { stage, durationMs: Math.round(durationMs), status, ...(errorCode ? { errorCode } : {}) };
    this.stages.push(metrics);
    this.stageEvent(stage, "completed", metrics);
  }

  measureStageSync<T>(stage: NativeOkfExecutionStage, operation: () => T): T {
    const start = performance.now();
    this.stageEvent(stage, "started");
    try { const result = operation(); this.recordStage(stage, performance.now() - start, "success"); return result; }
    catch (error) { this.recordStage(stage, performance.now() - start, "error", normalizeOpenAiError(error).code); throw error; }
  }

  async measureStage<T>(stage: NativeOkfExecutionStage, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    this.stageEvent(stage, "started");
    try { const result = await operation(); this.recordStage(stage, performance.now() - start, "success"); return result; }
    catch (error) { this.recordStage(stage, performance.now() - start, "error", normalizeOpenAiError(error).code); throw error; }
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
      moderations: { create: async (body, requestOptions) => {
        const start = performance.now();
        this.stageEvent("moderation", "started");
        try {
          const result = await client.moderations.create(body, requestOptions);
          this.stageEvent("moderation", "completed", { durationMs: Math.round(performance.now() - start), status: "success" });
          return result;
        } catch (error) {
          this.stageEvent("moderation", "completed", { durationMs: Math.round(performance.now() - start), status: "error", errorCode: normalizeOpenAiError(error).code });
          throw error;
        }
      } },
      responses: {
        create: async (body: ResponseCreateParamsNonStreaming, requestOptions) => {
          const standardBody = { ...body, service_tier: "default" as const };
          const requestBytes = nativeOkfModelRequestBytes(standardBody);
          if (requestBytes > MAX_NATIVE_OKF_MODEL_REQUEST_BYTES) {
            throw new RequestTooLargeError(
              "This request contains more evidence and conversation detail than fits the safe model request limit. Narrow the question or selected papers and try again.",
            );
          }
          const startedAt = performance.now();
          const metrics: NativeOkfModelCallMetrics = {
            stage: requestOptions?.nativeOkfStage ?? "text-generation",
            configuredTimeoutMs: requestOptions?.timeout ?? OPENAI_REQUEST_TIMEOUT_MS,
            maxRetries: requestOptions?.maxRetries ?? OPENAI_MAX_RETRIES,
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
          this.stageEvent(metrics.stage, "started", { configuredTimeoutMs: metrics.configuredTimeoutMs, maxRetries: metrics.maxRetries, requestBytes });
          try {
            const response = await client.responses.create(standardBody, requestOptions);
            metrics.model = response.model || body.model || environment.model;
            metrics.status = response.status ?? "unknown";
            const incompleteReason = response.incomplete_details?.reason;
            if (incompleteReason === "max_output_tokens" || incompleteReason === "content_filter") metrics.incompleteReason = incompleteReason;
            metrics.inputTokens = tokenCount(response.usage?.input_tokens);
            metrics.cachedInputTokens = tokenCount(response.usage?.input_tokens_details?.cached_tokens);
            metrics.outputTokens = tokenCount(response.usage?.output_tokens);
            metrics.reasoningTokens = tokenCount(response.usage?.output_tokens_details?.reasoning_tokens);
            metrics.totalTokens = tokenCount(response.usage?.total_tokens);
            return response;
          } catch (error) {
            const normalized = normalizeOpenAiError(error);
            metrics.errorCode = normalized.code;
            metrics.upstreamStatus = normalized.upstreamStatus;
            if (error instanceof NativeOkfBudgetTimeoutError) metrics.timeoutKind = error.timeoutKind;
            else if (normalized.code === "openai_timeout") metrics.timeoutKind = "provider_timeout";
            throw error;
          } finally {
            metrics.durationMs = Math.round(performance.now() - startedAt);
            this.calls.push(metrics);
            this.stageEvent(metrics.stage, "completed", metrics);
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
      stages: this.stages.map((stage) => ({ ...stage })),
      requestBudgetMs: NATIVE_OKF_CHAT_BUDGET_MS,
      ...(this.requestId ? { requestId: this.requestId } : {}),
    };
    logNativeOkfModelTurn(metrics);
    return metrics;
  }
}
