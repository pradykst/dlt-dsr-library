import "server-only";

import type { ReservationBlockReason } from "./types.ts";

export type NativeOkfAccessErrorCode =
  | "access_required"
  | "access_expired"
  | "access_revoked"
  | "rate_limited"
  | "quota_exhausted"
  | "diagram_quota_exhausted"
  | "service_paused"
  | "service_unavailable";

export class NativeOkfAccessError extends Error {
  readonly code: NativeOkfAccessErrorCode;
  readonly status: 401 | 403 | 429 | 503;
  readonly publicMessage: string;
  readonly retryAfterMs?: number;

  constructor(
    code: NativeOkfAccessErrorCode,
    status: 401 | 403 | 429 | 503,
    publicMessage: string,
    retryAfterMs?: number,
  ) {
    super(publicMessage);
    this.name = "NativeOkfAccessError";
    this.code = code;
    this.status = status;
    this.publicMessage = publicMessage;
    this.retryAfterMs = retryAfterMs;
  }
}

export function accessRequiredError(): NativeOkfAccessError {
  return new NativeOkfAccessError(
    "access_required",
    401,
    "Researcher access is required for the native OKF assistant.",
  );
}

export function serviceUnavailableError(): NativeOkfAccessError {
  return new NativeOkfAccessError(
    "service_unavailable",
    503,
    "The native OKF assistant is temporarily unavailable.",
  );
}

export function servicePausedError(): NativeOkfAccessError {
  return new NativeOkfAccessError(
    "service_paused",
    503,
    "The native OKF assistant is currently paused.",
  );
}

export function reservationBlockError(
  reason: ReservationBlockReason,
  retryAfterMs?: number,
): NativeOkfAccessError {
  if (reason === "expired") {
    return new NativeOkfAccessError(
      "access_expired",
      403,
      "Researcher access has expired.",
    );
  }
  if (reason === "revoked") {
    return new NativeOkfAccessError(
      "access_revoked",
      403,
      "Researcher access is no longer valid.",
    );
  }
  if (
    reason === "operational-pause" ||
    reason === "global-concurrency" ||
    reason === "daily-budget" ||
    reason === "monthly-budget"
  ) {
    return servicePausedError();
  }
  if (
    reason === "daily-diagram-quota" ||
    reason === "total-diagram-quota"
  ) {
    return new NativeOkfAccessError(
      "diagram_quota_exhausted",
      429,
      "The diagram allowance is exhausted. Text-only questions remain available while question quota remains.",
      retryAfterMs,
    );
  }
  if (
    reason === "daily-question-quota" ||
    reason === "total-question-quota"
  ) {
    return new NativeOkfAccessError(
      "quota_exhausted",
      429,
      "The researcher question allowance is exhausted.",
      retryAfterMs,
    );
  }
  return new NativeOkfAccessError(
    "rate_limited",
    429,
    "Please wait before making another native OKF assistant request.",
    retryAfterMs,
  );
}

export function publicNativeOkfAccessError(error: NativeOkfAccessError): {
  status: number;
  body: { error: string; code: NativeOkfAccessErrorCode };
  retryAfterSeconds?: number;
} {
  return {
    status: error.status,
    body: { error: error.publicMessage, code: error.code },
    ...(error.retryAfterMs === undefined
      ? {}
      : {
          retryAfterSeconds: Math.max(
            1,
            Math.ceil(error.retryAfterMs / 1_000),
          ),
        }),
  };
}
