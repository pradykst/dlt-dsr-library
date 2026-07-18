import "server-only";

import type {
  Response,
  ResponseCreateParamsNonStreaming,
  ResponseUsage,
} from "openai/resources/responses/responses";

import {
  OPENAI_MAX_RETRIES,
  type NativeOpenAiClient,
} from "../openai/client.ts";
import type { TokenUsageTotals } from "./types.ts";

export type NativeOkfModelCallKind =
  | "answer"
  | "citation-repair"
  | "diagram"
  | "diagram-repair";

export interface NativeOkfUsageCallRecord {
  kind: NativeOkfModelCallKind;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  usageAvailable: boolean;
}

export interface NativeOkfUsageSnapshot extends TokenUsageTotals {
  diagramModelCalls: number;
  missingUsageCalls: number;
  moderationCalls: number;
  calls: readonly NativeOkfUsageCallRecord[];
}

export interface NativeOkfMicrodollarPrices {
  inputMicrodollarsPerMillion: number;
  cachedInputMicrodollarsPerMillion: number;
  outputMicrodollarsPerMillion: number;
}

export interface NativeOkfCostReconciliation {
  actualMicrodollars: number;
  usageUnreconciled: boolean;
  envelopeExceeded: boolean;
  usage: TokenUsageTotals;
  diagramModelCalls: number;
}

export interface NativeOkfUsageTrackingOptions {
  beforeResponseCall?: (
    body: ResponseCreateParamsNonStreaming,
  ) => void | Promise<void>;
}

const TOKENS_PER_MILLION = BigInt(1_000_000);
const RESPONSE_INPUT_BYTE_MULTIPLIER = 2;
const RESPONSE_INPUT_FRAMING_TOKENS = 4_096;
const RESPONSE_MAX_ATTEMPTS = OPENAI_MAX_RETRIES + 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonNegativeSafeInteger(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : undefined;
}

function readUsage(value: unknown): ResponseUsage | undefined {
  if (!isRecord(value)) return undefined;
  const inputTokens = nonNegativeSafeInteger(value.input_tokens);
  const outputTokens = nonNegativeSafeInteger(value.output_tokens);
  if (inputTokens === undefined || outputTokens === undefined) return undefined;

  const inputDetails = isRecord(value.input_tokens_details)
    ? value.input_tokens_details
    : {};
  const cachedTokens = nonNegativeSafeInteger(inputDetails.cached_tokens) ?? 0;

  return {
    input_tokens: inputTokens,
    input_tokens_details: {
      cached_tokens: Math.min(cachedTokens, inputTokens),
      cache_write_tokens:
        nonNegativeSafeInteger(inputDetails.cache_write_tokens) ?? 0,
    },
    output_tokens: outputTokens,
    output_tokens_details: {
      reasoning_tokens:
        isRecord(value.output_tokens_details)
          ? nonNegativeSafeInteger(value.output_tokens_details.reasoning_tokens) ?? 0
          : 0,
    },
    total_tokens:
      nonNegativeSafeInteger(value.total_tokens) ?? inputTokens + outputTokens,
  };
}

function usageFromResponse(response: Response): ResponseUsage | undefined {
  return readUsage(response.usage);
}

function usageFromError(error: unknown): ResponseUsage | undefined {
  if (!isRecord(error)) return undefined;
  const direct = readUsage(error.usage);
  if (direct) return direct;
  if (isRecord(error.response)) {
    const responseUsage = readUsage(error.response.usage);
    if (responseUsage) return responseUsage;
    if (isRecord(error.response.data)) {
      return readUsage(error.response.data.usage);
    }
  }
  return undefined;
}

function isDiagramRequest(body: ResponseCreateParamsNonStreaming): boolean {
  const text = body.text;
  if (!text || !isRecord(text.format)) return false;
  return text.format.type === "json_schema";
}

export class NativeOkfUsageCollector {
  readonly #calls: NativeOkfUsageCallRecord[] = [];
  #textCalls = 0;
  #diagramCalls = 0;
  #moderationCalls = 0;

  nextKind(body: ResponseCreateParamsNonStreaming): NativeOkfModelCallKind {
    if (isDiagramRequest(body)) {
      const kind = this.#diagramCalls === 0 ? "diagram" : "diagram-repair";
      this.#diagramCalls += 1;
      return kind;
    }
    const kind = this.#textCalls === 0 ? "answer" : "citation-repair";
    this.#textCalls += 1;
    return kind;
  }

  record(
    kind: NativeOkfModelCallKind,
    usage: ResponseUsage | undefined,
  ): void {
    this.#calls.push({
      kind,
      inputTokens: usage?.input_tokens ?? 0,
      cachedInputTokens: usage?.input_tokens_details.cached_tokens ?? 0,
      outputTokens: usage?.output_tokens ?? 0,
      usageAvailable: usage !== undefined,
    });
  }

  recordModerationCall(): void {
    this.#moderationCalls += 1;
  }

  snapshot(): NativeOkfUsageSnapshot {
    return {
      inputTokens: this.#calls.reduce((sum, call) => sum + call.inputTokens, 0),
      cachedInputTokens: this.#calls.reduce(
        (sum, call) => sum + call.cachedInputTokens,
        0,
      ),
      outputTokens: this.#calls.reduce((sum, call) => sum + call.outputTokens, 0),
      modelCalls: this.#calls.length,
      diagramModelCalls: this.#calls.filter(
        (call) => call.kind === "diagram" || call.kind === "diagram-repair",
      ).length,
      missingUsageCalls: this.#calls.filter((call) => !call.usageAvailable).length,
      moderationCalls: this.#moderationCalls,
      calls: this.#calls.map((call) => ({ ...call })),
    };
  }
}

export function createUsageTrackingClient(
  baseClient: NativeOpenAiClient,
  collector = new NativeOkfUsageCollector(),
  options: NativeOkfUsageTrackingOptions = {},
): { client: NativeOpenAiClient; collector: NativeOkfUsageCollector } {
  const client: NativeOpenAiClient = {
    responses: {
      create: async (body) => {
        await options.beforeResponseCall?.(body);
        const kind = collector.nextKind(body);
        try {
          const response = await baseClient.responses.create(body);
          collector.record(kind, usageFromResponse(response));
          return response;
        } catch (error) {
          collector.record(kind, usageFromError(error));
          throw error;
        }
      },
    },
    moderations: {
      create: async (body) => {
        collector.recordModerationCall();
        return baseClient.moderations.create(body);
      },
    },
  };
  return { client, collector };
}

function assertPricingInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer.`);
  }
}

/**
 * Conservative pre-dispatch envelope for one Responses call. UTF-8 request
 * bytes are doubled and receive a fixed framing allowance, then the maximum
 * input/cached-input price, output ceiling, and all SDK attempts are reserved.
 */
export function calculateResponseCallEnvelopeMicrodollars(
  body: ResponseCreateParamsNonStreaming,
  prices: NativeOkfMicrodollarPrices,
): number {
  assertPricingInteger(
    prices.inputMicrodollarsPerMillion,
    "input price",
  );
  assertPricingInteger(
    prices.cachedInputMicrodollarsPerMillion,
    "cached input price",
  );
  assertPricingInteger(
    prices.outputMicrodollarsPerMillion,
    "output price",
  );

  const maxOutputTokens = body.max_output_tokens;
  if (
    !Number.isSafeInteger(maxOutputTokens) ||
    (maxOutputTokens as number) <= 0
  ) {
    throw new RangeError(
      "A positive max_output_tokens value is required before dispatch.",
    );
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(body);
  } catch {
    throw new RangeError("The Responses request could not be bounded.");
  }
  const serializedBytes = Buffer.byteLength(serialized, "utf8");
  const inputTokenUpperBound =
    serializedBytes * RESPONSE_INPUT_BYTE_MULTIPLIER +
    RESPONSE_INPUT_FRAMING_TOKENS;
  if (!Number.isSafeInteger(inputTokenUpperBound)) {
    throw new RangeError("The Responses request is too large to bound safely.");
  }

  const upperInputPrice = Math.max(
    prices.inputMicrodollarsPerMillion,
    prices.cachedInputMicrodollarsPerMillion,
  );
  const numerator =
    (BigInt(inputTokenUpperBound) * BigInt(upperInputPrice) +
      BigInt(maxOutputTokens as number) *
        BigInt(prices.outputMicrodollarsPerMillion)) *
    BigInt(RESPONSE_MAX_ATTEMPTS);
  const envelope =
    (numerator + TOKENS_PER_MILLION - BigInt(1)) /
    TOKENS_PER_MILLION;
  if (envelope > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(
      "The Responses request envelope exceeds the safe integer range.",
    );
  }
  return Number(envelope);
}

export function calculateUsageMicrodollars(
  usage: TokenUsageTotals,
  prices: NativeOkfMicrodollarPrices,
): number {
  assertPricingInteger(prices.inputMicrodollarsPerMillion, "input price");
  assertPricingInteger(usage.inputTokens, "input tokens");
  assertPricingInteger(usage.cachedInputTokens, "cached input tokens");
  assertPricingInteger(usage.outputTokens, "output tokens");
  assertPricingInteger(usage.modelCalls, "model calls");
  assertPricingInteger(
    prices.cachedInputMicrodollarsPerMillion,
    "cached input price",
  );
  assertPricingInteger(prices.outputMicrodollarsPerMillion, "output price");

  const cachedTokens = Math.min(usage.inputTokens, usage.cachedInputTokens);
  const uncachedTokens = usage.inputTokens - cachedTokens;
  const numerator =
    BigInt(uncachedTokens) * BigInt(prices.inputMicrodollarsPerMillion) +
    BigInt(cachedTokens) * BigInt(prices.cachedInputMicrodollarsPerMillion) +
    BigInt(usage.outputTokens) * BigInt(prices.outputMicrodollarsPerMillion);
  const microdollars =
    (numerator + TOKENS_PER_MILLION - BigInt(1)) / TOKENS_PER_MILLION;
  if (microdollars > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError("Calculated usage cost exceeds the safe integer range.");
  }
  return Number(microdollars);
}

export function reconcileTrackedUsage(
  snapshot: NativeOkfUsageSnapshot,
  prices: NativeOkfMicrodollarPrices,
  reservedMicrodollars: number,
): NativeOkfCostReconciliation {
  assertPricingInteger(reservedMicrodollars, "reserved microdollars");
  const usage: TokenUsageTotals = {
    inputTokens: snapshot.inputTokens,
    cachedInputTokens: snapshot.cachedInputTokens,
    outputTokens: snapshot.outputTokens,
    modelCalls: snapshot.modelCalls,
  };
  const knownUsageMicrodollars = calculateUsageMicrodollars(usage, prices);
  const envelopeExceeded = knownUsageMicrodollars > reservedMicrodollars;
  const usageUnreconciled =
    snapshot.missingUsageCalls > 0 || envelopeExceeded;
  return {
    actualMicrodollars: usageUnreconciled
      ? Math.max(reservedMicrodollars, knownUsageMicrodollars)
      : knownUsageMicrodollars,
    usageUnreconciled,
    envelopeExceeded,
    usage,
    diagramModelCalls: snapshot.diagramModelCalls,
  };
}
