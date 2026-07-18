import type { NativeOkfPersonalQuotaMetadata } from "../../shared/chat-types.ts";

export type ResearcherAccessState =
  | "checking"
  | "authenticated"
  | "required"
  | "expired"
  | "revoked"
  | "disabled"
  | "unavailable";

export interface NativeOkfResearchAccessView {
  state: ResearcherAccessState;
  quota: NativeOkfPersonalQuotaMetadata | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeCounter(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function readNativeOkfPersonalQuota(
  value: unknown,
): NativeOkfPersonalQuotaMetadata | null {
  if (!isRecord(value)) return null;
  const keys = [
    "questionsRemainingToday",
    "diagramsRemainingToday",
    "questionsRemainingTotal",
    "diagramsRemainingTotal",
    "resetAtMs",
    "accessExpiresAtMs",
  ] as const;
  if (!keys.every((key) => safeCounter(value[key]))) return null;
  return {
    questionsRemainingToday: value.questionsRemainingToday as number,
    diagramsRemainingToday: value.diagramsRemainingToday as number,
    questionsRemainingTotal: value.questionsRemainingTotal as number,
    diagramsRemainingTotal: value.diagramsRemainingTotal as number,
    resetAtMs: value.resetAtMs as number,
    accessExpiresAtMs: value.accessExpiresAtMs as number,
  };
}

export function nativeOkfDiagramQuotaExhausted(
  quota: NativeOkfPersonalQuotaMetadata | null,
): boolean {
  return (
    quota !== null &&
    (quota.diagramsRemainingToday === 0 ||
      quota.diagramsRemainingTotal === 0)
  );
}

export function readNativeOkfResearchAccess(
  value: unknown,
): NativeOkfResearchAccessView | null {
  if (
    !isRecord(value) ||
    typeof value.chatEnabled !== "boolean" ||
    typeof value.authenticated !== "boolean" ||
    typeof value.status !== "string"
  ) {
    return null;
  }
  if (!value.chatEnabled || value.status === "disabled") {
    return { state: "disabled", quota: null };
  }
  if (value.status === "expired") return { state: "expired", quota: null };
  if (value.status === "revoked") return { state: "revoked", quota: null };
  if (!value.authenticated || value.status !== "authenticated") {
    return { state: "required", quota: null };
  }
  const quota = readNativeOkfPersonalQuota(value.quota);
  return quota ? { state: "authenticated", quota } : null;
}

export function formatNativeOkfQuotaTime(timestampMs: number): string {
  const date = new Date(timestampMs);
  if (!Number.isFinite(date.valueOf())) return "Unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function nativeOkfChatErrorMessage(
  payload: unknown,
  status: number,
): string {
  if (status === 401) {
    return "Researcher access is required to use the native OKF assistant.";
  }
  if (status === 403) {
    return "Researcher access has expired or was revoked. Enter a valid access code to continue.";
  }
  if (status === 429) {
    if (isRecord(payload) && payload.code === "diagram_quota_exhausted") {
      return "The diagram allowance is exhausted. Text-only questions remain available.";
    }
    return "A personal quota or request-rate limit was reached. Please wait or review your remaining allowance.";
  }
  if (status === 503) {
    return "The native OKF assistant is paused or temporarily unavailable.";
  }

  if (isRecord(payload)) {
    if (typeof payload.error === "string" && payload.error.length <= 500) {
      return payload.error;
    }
    if (
      isRecord(payload.error) &&
      typeof payload.error.message === "string" &&
      payload.error.message.length <= 500
    ) {
      return payload.error.message;
    }
    if (typeof payload.message === "string" && payload.message.length <= 500) {
      return payload.message;
    }
  }
  return "The native OKF assistant could not complete this request.";
}

