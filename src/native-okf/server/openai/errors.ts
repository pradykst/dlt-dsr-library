import "server-only";

import {
  APIConnectionError,
  APIError,
  AuthenticationError,
  InternalServerError,
  PermissionDeniedError,
  RateLimitError,
} from "openai";

export type NativeOkfChatErrorCode =
  | "invalid_request"
  | "request_too_large"
  | "openai_not_configured"
  | "moderation_blocked"
  | "openai_timeout"
  | "model_refusal"
  | "generation_failed"
  | "ai_provider_unavailable"
  | "ai_provider_rate_limited"
  | "ai_service_quota"
  | "model_output_invalid"
  | "synthesis_validation_failed"
  | "internal_error"
  | "network_or_proxy_error";

export class NativeOkfChatError extends Error {
  readonly code: NativeOkfChatErrorCode;
  readonly status: number;
  readonly publicMessage: string;
  /** A verified upstream HTTP status, only ever set from a real provider response. Safe to expose. */
  readonly upstreamStatus?: number;

  constructor(
    code: NativeOkfChatErrorCode,
    status: number,
    publicMessage: string,
    upstreamStatus?: number,
  ) {
    super(publicMessage);
    this.name = "NativeOkfChatError";
    this.code = code;
    this.status = status;
    this.publicMessage = publicMessage;
    if (upstreamStatus !== undefined) this.upstreamStatus = upstreamStatus;
  }
}

export class NativeOkfRequestError extends NativeOkfChatError {
  constructor(message: string) {
    super("invalid_request", 400, message);
    this.name = "NativeOkfRequestError";
  }
}

export class RequestTooLargeError extends NativeOkfChatError {
  constructor(message: string) {
    super("request_too_large", 413, message);
    this.name = "RequestTooLargeError";
  }
}

export class OpenAiConfigurationError extends NativeOkfChatError {
  constructor(message = "The native OKF assistant is not configured on the server.") {
    super("openai_not_configured", 503, message);
    this.name = "OpenAiConfigurationError";
  }
}

export class OpenAiModerationError extends NativeOkfChatError {
  constructor() {
    super(
      "moderation_blocked",
      422,
      "This request could not be processed by the configured safety checks.",
    );
    this.name = "OpenAiModerationError";
  }
}

export class OpenAiTimeoutError extends NativeOkfChatError {
  constructor() {
    super(
      "openai_timeout",
      504,
      "The model request timed out. Please try again.",
    );
    this.name = "OpenAiTimeoutError";
  }
}

export class OpenAiRefusalError extends NativeOkfChatError {
  constructor() {
    super(
      "model_refusal",
      422,
      "The model declined to produce a response for this request.",
    );
    this.name = "OpenAiRefusalError";
  }
}

/** Legacy catch-all, kept only as the last-resort fallback inside normalizeOpenAiError. */
export class OpenAiGenerationError extends NativeOkfChatError {
  constructor() {
    super(
      "generation_failed",
      502,
      "The model did not return a usable response. Please try again.",
    );
    this.name = "OpenAiGenerationError";
  }
}

/** A verified upstream connection failure, timeout, or HTTP 5xx from the AI provider. */
export class AiProviderUnavailableError extends NativeOkfChatError {
  constructor(upstreamStatus?: number) {
    super(
      "ai_provider_unavailable",
      503,
      "The AI provider is temporarily unavailable. Please retry shortly.",
      upstreamStatus,
    );
    this.name = "AiProviderUnavailableError";
  }
}

/** A verified rate-limit condition reported by the AI provider itself. */
export class AiProviderRateLimitedError extends NativeOkfChatError {
  constructor(upstreamStatus?: number) {
    super(
      "ai_provider_rate_limited",
      429,
      "The AI service is temporarily rate-limited. Please retry shortly.",
      upstreamStatus,
    );
    this.name = "AiProviderRateLimitedError";
  }
}

/** A credit, spend, or organization/project usage limit — distinct from a transient outage. */
export class AiServiceQuotaError extends NativeOkfChatError {
  constructor(upstreamStatus?: number) {
    super(
      "ai_service_quota",
      503,
      "This research service has temporarily reached its AI usage limit.",
      upstreamStatus,
    );
    this.name = "AiServiceQuotaError";
  }
}

/** The API call itself succeeded, but the model's output could not be parsed or used. */
export class ModelOutputInvalidError extends NativeOkfChatError {
  constructor(
    message = "The model's response could not be used. Please try again or rephrase your question.",
  ) {
    super("model_output_invalid", 502, message);
    this.name = "ModelOutputInvalidError";
  }
}

/** The model produced output, but it failed our scholarly/graph validation after one bounded repair attempt. */
export class SynthesisValidationFailedError extends NativeOkfChatError {
  constructor(
    message = "The generated design proposal did not pass validation, so no unverified proposal was shown.",
  ) {
    super("synthesis_validation_failed", 422, message);
    this.name = "SynthesisValidationFailedError";
  }
}

/** Our own application failed, independent of the AI provider. */
export class InternalNativeOkfError extends NativeOkfChatError {
  constructor(
    message = "An internal error occurred while handling this request. Please try again.",
  ) {
    super("internal_error", 500, message);
    this.name = "InternalNativeOkfError";
  }
}

/** The request never reached the AI provider (DNS/proxy/connection reset), as distinct from a provider outage. */
export class NetworkOrProxyError extends NativeOkfChatError {
  constructor() {
    super(
      "network_or_proxy_error",
      502,
      "The request could not reach the AI provider. Please retry shortly.",
    );
    this.name = "NetworkOrProxyError";
  }
}

const QUOTA_UPSTREAM_CODES = new Set([
  "insufficient_quota",
  "billing_hard_limit_reached",
  "billing_not_active",
]);

/**
 * Converts an unknown thrown value into a stable, differentiated NativeOkfChatError.
 *
 * Order matters: a message/name-based timeout check runs first (it must catch synthetic
 * and SDK-internal timeout errors alike), then verified OpenAI SDK error *types* are
 * inspected by `instanceof` and `status`/`code` — never by guessing from message text —
 * before falling back to the generic catch-all.
 */
export function normalizeOpenAiError(error: unknown): NativeOkfChatError {
  if (error instanceof NativeOkfChatError) return error;

  if (error instanceof Error) {
    const name = error.name.toLocaleLowerCase("en");
    const message = error.message.toLocaleLowerCase("en");
    if (
      name.includes("timeout") ||
      message.includes("timed out") ||
      message.includes("timeout")
    ) {
      return new OpenAiTimeoutError();
    }
  }

  if (error instanceof RateLimitError) {
    const upstreamCode = typeof error.code === "string" ? error.code : undefined;
    if (upstreamCode && QUOTA_UPSTREAM_CODES.has(upstreamCode)) {
      return new AiServiceQuotaError(error.status);
    }
    return new AiProviderRateLimitedError(error.status);
  }

  if (error instanceof AuthenticationError || error instanceof PermissionDeniedError) {
    // Our own credentials/config are the problem, not a transient provider issue —
    // never blame this on provider availability.
    return new OpenAiConfigurationError();
  }

  if (error instanceof InternalServerError) {
    return new AiProviderUnavailableError(error.status);
  }

  if (error instanceof APIConnectionError) {
    // No HTTP response was ever received: the request did not reach the provider.
    return new NetworkOrProxyError();
  }

  if (error instanceof APIError) {
    const status = typeof error.status === "number" ? error.status : undefined;
    if (status !== undefined && status >= 500) {
      return new AiProviderUnavailableError(status);
    }
    if (status === 429) {
      return new AiProviderRateLimitedError(status);
    }
  }

  return new OpenAiGenerationError();
}

export interface PublicNativeOkfChatError {
  status: number;
  body: {
    error: string;
    code: NativeOkfChatErrorCode;
  };
}

/** Converts internal failures to a stable response without exposing causes or secrets. */
export function publicNativeOkfChatError(error: unknown): PublicNativeOkfChatError {
  const normalized = normalizeOpenAiError(error);
  return {
    status: normalized.status,
    body: {
      error: normalized.publicMessage,
      code: normalized.code,
    },
  };
}
