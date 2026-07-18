import "server-only";

export type NativeOkfSameOriginFailureReason =
  | "unsafe-method-required"
  | "invalid-expected-origin"
  | "missing-origin"
  | "invalid-origin"
  | "origin-mismatch"
  | "cross-site-fetch"
  | "unsupported-content-type";

export type NativeOkfSameOriginResult =
  | { allowed: true }
  | { allowed: false; reason: NativeOkfSameOriginFailureReason };

export interface NativeOkfSameOriginInput {
  method: string;
  headers: Headers | Record<string, string | string[] | undefined>;
  expectedOrigin: string;
}

export class NativeOkfSameOriginError extends Error {
  readonly status = 403;
  readonly code = "native_okf_same_origin_required";

  constructor() {
    super("The administrative request could not be authorized.");
    this.name = "NativeOkfSameOriginError";
  }
}

function getHeader(
  headers: NativeOkfSameOriginInput["headers"],
  name: string,
): string | null {
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name);
  }
  const record = headers as Record<string, string | string[] | undefined>;
  const key = Object.keys(record).find(
    (candidate) => candidate.toLowerCase() === name,
  );
  if (!key) return null;
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function normalizeConfiguredOrigin(value: string): string | null {
  try {
    const parsed = new URL(value);
    const withoutTrailingSlash = value.endsWith("/") ? value.slice(0, -1) : value;
    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash ||
      withoutTrailingSlash !== parsed.origin
    ) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export function verifyNativeOkfSameOriginMutation(
  input: NativeOkfSameOriginInput,
): NativeOkfSameOriginResult {
  if (!new Set(["POST", "PUT", "PATCH", "DELETE"]).has(input.method.toUpperCase())) {
    return { allowed: false, reason: "unsafe-method-required" };
  }

  const expectedOrigin = normalizeConfiguredOrigin(input.expectedOrigin);
  if (!expectedOrigin) {
    return { allowed: false, reason: "invalid-expected-origin" };
  }

  const originHeader = getHeader(input.headers, "origin");
  if (!originHeader) return { allowed: false, reason: "missing-origin" };

  let suppliedOrigin: string;
  try {
    const parsed = new URL(originHeader);
    if (originHeader === "null" || parsed.origin === "null") {
      return { allowed: false, reason: "invalid-origin" };
    }
    suppliedOrigin = parsed.origin;
  } catch {
    return { allowed: false, reason: "invalid-origin" };
  }
  if (suppliedOrigin !== expectedOrigin) {
    return { allowed: false, reason: "origin-mismatch" };
  }

  const fetchSite = getHeader(input.headers, "sec-fetch-site");
  if (fetchSite && fetchSite.toLowerCase() !== "same-origin") {
    return { allowed: false, reason: "cross-site-fetch" };
  }

  const contentType = getHeader(input.headers, "content-type");
  if (!contentType || contentType.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    return { allowed: false, reason: "unsupported-content-type" };
  }

  return { allowed: true };
}

export function assertNativeOkfSameOriginMutation(
  input: NativeOkfSameOriginInput,
): void {
  if (!verifyNativeOkfSameOriginMutation(input).allowed) {
    throw new NativeOkfSameOriginError();
  }
}
