import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const NATIVE_OKF_RESEARCHER_COOKIE = "native_okf_access";
export const NATIVE_OKF_ADMIN_COOKIE = "native_okf_admin";

const MINIMUM_SESSION_SECRET_BYTES = 32;
const RESEARCHER_SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;
const ADMIN_SESSION_DEFAULT_AGE_SECONDS = 30 * 60;
const ADMIN_SESSION_MAX_AGE_SECONDS = 2 * 60 * 60;

type SessionNamespace = "researcher" | "admin";

export interface NativeOkfSessionPayload {
  subjectId: string;
  expiresAtMs: number;
}

export interface IssuedNativeOkfSession {
  token: string;
  payload: NativeOkfSessionPayload;
}

export type NativeOkfSessionFailureReason =
  | "missing"
  | "malformed"
  | "invalid-signature"
  | "invalid-payload"
  | "expired";

export type NativeOkfSessionVerification =
  | { valid: true; payload: NativeOkfSessionPayload }
  | { valid: false; reason: NativeOkfSessionFailureReason };

export interface ResearcherSessionIssueInput {
  subjectId: string;
  accessExpiresAtMs: number;
  secret: string;
  nowMs?: number;
  maxAgeSeconds?: number;
}

export interface AdminSessionIssueInput {
  secret: string;
  nowMs?: number;
  maxAgeSeconds?: number;
}

export interface SessionCookieOptions {
  production: boolean;
  nowMs?: number;
}

function assertStrongSecret(secret: string): void {
  if (Buffer.byteLength(secret, "utf8") < MINIMUM_SESSION_SECRET_BYTES) {
    throw new Error(
      `Native OKF session secrets must be at least ${MINIMUM_SESSION_SECRET_BYTES} bytes.`,
    );
  }
}

function isValidSubjectId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 200 &&
    /^[A-Za-z0-9:_-]+$/.test(value)
  );
}

function encodePayload(payload: NativeOkfSessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function signatureFor(
  encodedPayload: string,
  secret: string,
  namespace: SessionNamespace,
): Buffer {
  return createHmac("sha256", secret)
    .update(`native-okf:${namespace}:session:v1.`)
    .update(encodedPayload)
    .digest();
}

function signPayload(
  payload: NativeOkfSessionPayload,
  secret: string,
  namespace: SessionNamespace,
): string {
  assertStrongSecret(secret);
  const encodedPayload = encodePayload(payload);
  const signature = signatureFor(encodedPayload, secret, namespace).toString(
    "base64url",
  );
  return `${encodedPayload}.${signature}`;
}

function verifyToken(
  token: string | null | undefined,
  secret: string,
  namespace: SessionNamespace,
  nowMs: number,
): NativeOkfSessionVerification {
  assertStrongSecret(secret);
  if (!token) return { valid: false, reason: "missing" };

  const parts = token.split(".");
  if (parts.length !== 2 || parts.some((part) => part.length === 0)) {
    return { valid: false, reason: "malformed" };
  }

  const [encodedPayload, encodedSignature] = parts;
  let suppliedSignature: Buffer;
  try {
    suppliedSignature = Buffer.from(encodedSignature, "base64url");
  } catch {
    return { valid: false, reason: "malformed" };
  }

  const expectedSignature = signatureFor(encodedPayload, secret, namespace);
  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    return { valid: false, reason: "invalid-signature" };
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
  } catch {
    return { valid: false, reason: "invalid-payload" };
  }

  if (
    typeof candidate !== "object" ||
    candidate === null ||
    Array.isArray(candidate)
  ) {
    return { valid: false, reason: "invalid-payload" };
  }

  const keys = Object.keys(candidate).sort();
  if (
    keys.length !== 2 ||
    keys[0] !== "expiresAtMs" ||
    keys[1] !== "subjectId"
  ) {
    return { valid: false, reason: "invalid-payload" };
  }

  const { subjectId, expiresAtMs } = candidate as Record<string, unknown>;
  if (
    !isValidSubjectId(subjectId) ||
    typeof expiresAtMs !== "number" ||
    !Number.isSafeInteger(expiresAtMs) ||
    expiresAtMs <= 0
  ) {
    return { valid: false, reason: "invalid-payload" };
  }

  if (expiresAtMs <= nowMs) return { valid: false, reason: "expired" };
  return { valid: true, payload: { subjectId, expiresAtMs } };
}

function boundedMaxAge(
  requested: number | undefined,
  fallback: number,
  maximum: number,
): number {
  const value = requested ?? fallback;
  if (!Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    throw new Error(`Session max age must be between 1 and ${maximum} seconds.`);
  }
  return value;
}

export function issueResearcherSession(
  input: ResearcherSessionIssueInput,
): IssuedNativeOkfSession {
  const nowMs = input.nowMs ?? Date.now();
  if (!isValidSubjectId(input.subjectId)) {
    throw new Error("Invalid Native OKF researcher subject ID.");
  }
  if (
    !Number.isSafeInteger(input.accessExpiresAtMs) ||
    input.accessExpiresAtMs <= nowMs
  ) {
    throw new Error("Native OKF access must expire in the future.");
  }
  const maxAgeSeconds = boundedMaxAge(
    input.maxAgeSeconds,
    RESEARCHER_SESSION_MAX_AGE_SECONDS,
    RESEARCHER_SESSION_MAX_AGE_SECONDS,
  );
  const expiresAtMs = Math.min(
    input.accessExpiresAtMs,
    nowMs + maxAgeSeconds * 1_000,
  );
  const payload = { subjectId: input.subjectId, expiresAtMs };
  return {
    payload,
    token: signPayload(payload, input.secret, "researcher"),
  };
}

export function issueAdminSession(
  input: AdminSessionIssueInput,
): IssuedNativeOkfSession {
  const nowMs = input.nowMs ?? Date.now();
  const maxAgeSeconds = boundedMaxAge(
    input.maxAgeSeconds,
    ADMIN_SESSION_DEFAULT_AGE_SECONDS,
    ADMIN_SESSION_MAX_AGE_SECONDS,
  );
  const payload = {
    subjectId: "native-okf-admin",
    expiresAtMs: nowMs + maxAgeSeconds * 1_000,
  };
  return {
    payload,
    token: signPayload(payload, input.secret, "admin"),
  };
}

export function verifyResearcherSessionToken(
  token: string | null | undefined,
  secret: string,
  nowMs = Date.now(),
): NativeOkfSessionVerification {
  return verifyToken(token, secret, "researcher", nowMs);
}

export function verifyAdminSessionToken(
  token: string | null | undefined,
  secret: string,
  nowMs = Date.now(),
): NativeOkfSessionVerification {
  return verifyToken(token, secret, "admin", nowMs);
}

export function readCookieValue(
  cookieHeader: string | null | undefined,
  cookieName: string,
): string | null {
  if (!cookieHeader) return null;
  const matches = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${cookieName}=`))
    .map((part) => part.slice(cookieName.length + 1));
  return matches.length === 1 && matches[0].length > 0 ? matches[0] : null;
}

export function verifyResearcherSessionCookie(
  cookieHeader: string | null | undefined,
  secret: string,
  nowMs = Date.now(),
): NativeOkfSessionVerification {
  return verifyResearcherSessionToken(
    readCookieValue(cookieHeader, NATIVE_OKF_RESEARCHER_COOKIE),
    secret,
    nowMs,
  );
}

export function verifyAdminSessionCookie(
  cookieHeader: string | null | undefined,
  secret: string,
  nowMs = Date.now(),
): NativeOkfSessionVerification {
  return verifyAdminSessionToken(
    readCookieValue(cookieHeader, NATIVE_OKF_ADMIN_COOKIE),
    secret,
    nowMs,
  );
}

function serializeCookie(
  name: string,
  session: IssuedNativeOkfSession,
  sameSite: "Lax" | "Strict",
  options: SessionCookieOptions,
): string {
  const nowMs = options.nowMs ?? Date.now();
  const maxAge = Math.max(
    0,
    Math.floor((session.payload.expiresAtMs - nowMs) / 1_000),
  );
  const attributes = [
    `${name}=${session.token}`,
    "Path=/",
    "HttpOnly",
    `SameSite=${sameSite}`,
    `Max-Age=${maxAge}`,
    `Expires=${new Date(session.payload.expiresAtMs).toUTCString()}`,
  ];
  if (options.production) attributes.push("Secure");
  return attributes.join("; ");
}

export function serializeResearcherSessionCookie(
  session: IssuedNativeOkfSession,
  options: SessionCookieOptions,
): string {
  return serializeCookie(
    NATIVE_OKF_RESEARCHER_COOKIE,
    session,
    "Lax",
    options,
  );
}

export function serializeAdminSessionCookie(
  session: IssuedNativeOkfSession,
  options: SessionCookieOptions,
): string {
  return serializeCookie(NATIVE_OKF_ADMIN_COOKIE, session, "Strict", options);
}

function serializeClearedCookie(
  name: string,
  sameSite: "Lax" | "Strict",
  production: boolean,
): string {
  const attributes = [
    `${name}=`,
    "Path=/",
    "HttpOnly",
    `SameSite=${sameSite}`,
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];
  if (production) attributes.push("Secure");
  return attributes.join("; ");
}

export function clearResearcherSessionCookie(production: boolean): string {
  return serializeClearedCookie(
    NATIVE_OKF_RESEARCHER_COOKIE,
    "Lax",
    production,
  );
}

export function clearAdminSessionCookie(production: boolean): string {
  return serializeClearedCookie(NATIVE_OKF_ADMIN_COOKIE, "Strict", production);
}
