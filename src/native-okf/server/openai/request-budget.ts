import "server-only";

import {
  OPENAI_MAX_RETRIES, OPENAI_REQUEST_TIMEOUT_MS,
  type NativeOpenAiClient, type NativeOkfModelRequestOptions, type NativeOkfModelStage,
} from "./client.ts";
import { OpenAiTimeoutError } from "./errors.ts";

// The chat route has a supported 300s Vercel duration. Leave time to validate,
// moderate and serialize a result rather than hitting the platform's hard kill.
export const NATIVE_OKF_CHAT_BUDGET_MS = 250_000;
export const NATIVE_OKF_RESPONSE_RESERVE_MS = 10_000;
export const SYNTHESIS_REQUEST_TIMEOUT_MS = 120_000;
export const SYNTHESIS_QUALITY_REVIEW_TIMEOUT_MS = 15_000;
export const REFINEMENT_REVIEW_TIMEOUT_MS = 20_000;

export type NativeOkfTimeoutKind = "stage_deadline" | "request_deadline" | "request_cancelled";

export class NativeOkfBudgetTimeoutError extends OpenAiTimeoutError {
  readonly timeoutKind: NativeOkfTimeoutKind;
  readonly timeoutMs: number;
  constructor(timeoutKind: NativeOkfTimeoutKind, timeoutMs: number) {
    super();
    this.timeoutKind = timeoutKind;
    this.timeoutMs = timeoutMs;
    this.name = "NativeOkfBudgetTimeoutError";
  }
}

export function nativeOkfModelCallOptions(stage: NativeOkfModelStage): NativeOkfModelRequestOptions {
  const synthesized = stage.startsWith("synthesis-") || stage.startsWith("refinement-");
  const timeout = stage === "synthesis-quality-review" ? SYNTHESIS_QUALITY_REVIEW_TIMEOUT_MS
    : stage === "refinement-review" || stage === "moderation" ? REFINEMENT_REVIEW_TIMEOUT_MS
    : synthesized ? SYNTHESIS_REQUEST_TIMEOUT_MS : OPENAI_REQUEST_TIMEOUT_MS;
  return { nativeOkfStage: stage, timeout,
    maxRetries: synthesized || stage === "moderation" ? 0 : OPENAI_MAX_RETRIES };
}

/** Per-turn deadline; covers the whole response body, not just fetch headers. */
export function withNativeOkfRequestBudget(
  client: NativeOpenAiClient,
  options: { startedAt?: number; signal?: AbortSignal; now?: () => number; moderationEnabled?: boolean } = {},
): NativeOpenAiClient {
  const now = options.now ?? (() => performance.now());
  const deadline = (options.startedAt ?? now()) + NATIVE_OKF_CHAT_BUDGET_MS;

  async function execute<T>(
    stage: NativeOkfModelStage,
    requestOptions: NativeOkfModelRequestOptions | undefined,
    invoke: (sdkOptions: NativeOkfModelRequestOptions) => Promise<T>,
  ): Promise<T> {
    const policy = nativeOkfModelCallOptions(stage);
    const outputModerationReserve = options.moderationEnabled && stage !== "moderation" ? REFINEMENT_REVIEW_TIMEOUT_MS : 0;
    const remaining = Math.floor(deadline - now() - NATIVE_OKF_RESPONSE_RESERVE_MS - outputModerationReserve);
    if (remaining <= 0) throw new NativeOkfBudgetTimeoutError("request_deadline", 0);
    // Preserve the text path's existing SDK retry behavior, including backoff.
    // Synthesis has one transport attempt; only validation can request a repair.
    const callLimit = policy.maxRetries === 0 ? policy.timeout! : policy.timeout! * (OPENAI_MAX_RETRIES + 1) + 5_000;
    const timeoutMs = Math.min(callLimit, remaining);
    const controller = new AbortController();
    const signals = [options.signal, requestOptions?.signal].filter((signal): signal is AbortSignal => Boolean(signal));
    let rejectDeadline!: (error: NativeOkfBudgetTimeoutError) => void;
    const interrupted = new Promise<never>((_, reject) => { rejectDeadline = reject; });
    const cancel = () => {
      rejectDeadline(new NativeOkfBudgetTimeoutError("request_cancelled", timeoutMs));
      controller.abort();
    };
    if (signals.some((signal) => signal.aborted)) throw new NativeOkfBudgetTimeoutError("request_cancelled", 0);
    for (const signal of signals) signal.addEventListener("abort", cancel, { once: true });
    const timer = setTimeout(() => {
      // Settle our typed error first, before the SDK's abort rejection.
      rejectDeadline(new NativeOkfBudgetTimeoutError(timeoutMs < callLimit ? "request_deadline" : "stage_deadline", timeoutMs));
      controller.abort();
    }, timeoutMs);
    try {
      const { nativeOkfStage: _stage, ...sdkOptions } = requestOptions ?? {};
      void _stage;
      return await Promise.race([
        invoke({ ...sdkOptions, timeout: Math.min(policy.timeout!, timeoutMs), maxRetries: policy.maxRetries, signal: controller.signal }),
        interrupted,
      ]);
    } finally {
      clearTimeout(timer);
      for (const signal of signals) signal.removeEventListener("abort", cancel);
    }
  }

  return {
    responses: { create: (body, requestOptions) => execute(requestOptions?.nativeOkfStage ?? "text-generation", requestOptions,
      (sdkOptions) => client.responses.create(body, sdkOptions)) },
    moderations: { create: (body, requestOptions) => execute("moderation", requestOptions,
      (sdkOptions) => client.moderations.create(body, sdkOptions)) },
  };
}
