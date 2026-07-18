import "server-only";

import { createHmac } from "node:crypto";

import type { NativeOkfAccessConfig } from "./config.ts";
import type { NativeOkfAdminRateLimiter } from "./admin-rate-limit.ts";
import { createNativeOkfIpSubject } from "./client-ip.ts";
import { hashInvitationCode, timingSafeHashEqual } from "./crypto.ts";
import {
  clearResearcherSessionCookie,
  issueResearcherSession,
  serializeResearcherSessionCookie,
  verifyResearcherSessionCookie,
} from "./sessions.ts";
import { verifyNativeOkfSameOriginMutation } from "./same-origin.ts";
import type { NativeOkfOperationalStore } from "./store.ts";
import {
  invitationStatus,
  type InvitationRecord,
  type QuotaLimits,
  type SubjectQuotaSnapshot,
} from "./types.ts";

const MAX_CODE_LENGTH = 512;
const MAX_JSON_LENGTH = 2_048;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g;

export type ResearchAccessStatus =
  | "authenticated"
  | "available"
  | "disabled"
  | "expired"
  | "revoked";

export interface PublicResearchQuota {
  questionsUsedToday: number;
  diagramsUsedToday: number;
  questionsUsedTotal: number;
  diagramsUsedTotal: number;
  questionsRemainingToday: number;
  diagramsRemainingToday: number;
  questionsRemainingTotal: number;
  diagramsRemainingTotal: number;
  resetAtMs: number;
  accessExpiresAtMs: number;
}

export interface ResearchAccessPayload {
  chatEnabled: boolean;
  accessMode: NativeOkfAccessConfig["accessMode"];
  authenticated: boolean;
  status: ResearchAccessStatus;
  quota?: PublicResearchQuota;
}

export interface ResearchAccessServiceDependencies {
  loginRateLimiter: NativeOkfAdminRateLimiter;
  config: NativeOkfAccessConfig;
  store: NativeOkfOperationalStore;
  now?: () => number;
  production?: boolean;
}

function responseHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("cache-control", "no-store, max-age=0");
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("x-content-type-options", "nosniff");
  headers.set("vary", "Cookie");
  return headers;
}

function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders?: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(extraHeaders),
  });
}

function genericInvalidCode(): Response {
  return jsonResponse(
    { error: "The access code could not be accepted." },
    401,
  );
}

function genericUnavailable(): Response {
  return jsonResponse(
    { error: "Research access is currently unavailable." },
    503,
  );
}

function genericForbidden(): Response {
  return jsonResponse(
    { error: "The request could not be authorized." },
    403,
  );
}

function publicQuota(snapshot: SubjectQuotaSnapshot): PublicResearchQuota {
  return {
    questionsUsedToday: snapshot.questionsUsedToday,
    diagramsUsedToday: snapshot.diagramsUsedToday,
    questionsUsedTotal: snapshot.questionsUsedTotal,
    diagramsUsedTotal: snapshot.diagramsUsedTotal,
    questionsRemainingToday: snapshot.questionsRemainingToday,
    diagramsRemainingToday: snapshot.diagramsRemainingToday,
    questionsRemainingTotal: snapshot.questionsRemainingTotal,
    diagramsRemainingTotal: snapshot.diagramsRemainingTotal,
    resetAtMs: snapshot.resetAtMs,
    accessExpiresAtMs: snapshot.accessExpiresAtMs,
  };
}

function quotaFor(
  dependencies: ResearchAccessServiceDependencies,
  subjectId: string,
  limits: QuotaLimits,
  accessExpiresAtMs: number,
  nowMs: number,
): PublicResearchQuota {
  return publicQuota(
    dependencies.store.getSubjectQuotaSnapshot({
      subjectId,
      limits,
      accessExpiresAtMs,
      nowMs,
    }),
  );
}

function sanitizeCode(value: string): string | null {
  if (value.length > MAX_CODE_LENGTH) {
    return null;
  }
  const sanitized = value.replace(CONTROL_CHARACTERS, "").trim();
  return sanitized.length > 0 && sanitized.length <= MAX_CODE_LENGTH
    ? sanitized
    : null;
}

async function readCode(request: Request): Promise<string | null> {
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return null;
  }
  if (raw.length === 0 || raw.length > MAX_JSON_LENGTH) {
    return null;
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    !("code" in body) ||
    typeof (body as { code?: unknown }).code !== "string"
  ) {
    return null;
  }

  return sanitizeCode((body as { code: string }).code);
}

function hmacCode(secret: string, domain: string, value: string): string {
  return createHmac("sha256", secret)
    .update(domain, "utf8")
    .update("\0", "utf8")
    .update(value, "utf8")
    .digest("hex");
}

/** Matches the paid-chat test subject without retaining the plaintext code. */
function createTestSubjectId(testAccessCode: string, sessionSecret: string): string {
  const digest = createHmac("sha256", sessionSecret)
    .update("native-okf:test-access-subject:v1:")
    .update(testAccessCode)
    .digest("hex");
  return `test:${digest}`;
}

/** Compares codes through same-length HMAC digests and never persists either code. */
export function timingSafeAccessCodeEqual(
  candidate: string,
  configured: string,
  secret: string,
  domain: "test" | "admin",
): boolean {
  return timingSafeHashEqual(
    hmacCode(secret, `native-okf/${domain}-access/v1`, candidate),
    hmacCode(secret, `native-okf/${domain}-access/v1`, configured),
  );
}

function sameOriginAllowed(request: Request, config: NativeOkfAccessConfig): boolean {
  if (!config.publicOrigin) {
    return false;
  }

  const headers = new Headers(request.headers);
  if (
    request.method.toUpperCase() === "DELETE" &&
    !headers.has("content-type")
  ) {
    headers.set("content-type", "application/json");
  }

  return verifyNativeOkfSameOriginMutation({
    method: request.method,
    headers,
    expectedOrigin: config.publicOrigin,
  }).allowed;
}

function disabledPayload(config: NativeOkfAccessConfig): ResearchAccessPayload {
  return {
    chatEnabled: false,
    accessMode: config.accessMode,
    authenticated: false,
    status: "disabled",
  };
}

function availablePayload(config: NativeOkfAccessConfig): ResearchAccessPayload {
  return {
    chatEnabled: config.chatEnabled,
    accessMode: config.accessMode,
    authenticated: false,
    status: "available",
  };
}

function invitationState(
  invitation: InvitationRecord | null,
  nowMs: number,
): "active" | "expired" | "revoked" {
  if (!invitation) {
    return "revoked";
  }
  return invitationStatus(invitation, nowMs);
}

function operationalPause(
  dependencies: ResearchAccessServiceDependencies,
): boolean | null {
  try {
    return dependencies.store.getOperationalPause();
  } catch {
    return null;
  }
}

async function unsafeHandleResearchAccessGet(
  request: Request,
  dependencies: ResearchAccessServiceDependencies,
): Promise<Response> {
  const { config } = dependencies;
  const nowMs = dependencies.now?.() ?? Date.now();

  if (!config.chatEnabled || config.accessMode === "disabled") {
    return jsonResponse(disabledPayload(config));
  }
  if (!config.sessionSecret) {
    return genericUnavailable();
  }
  const paused = operationalPause(dependencies);
  if (paused === null) {
    return genericUnavailable();
  }
  if (paused) {
    return jsonResponse(disabledPayload(config));
  }

  let session;
  try {
    session = verifyResearcherSessionCookie(
      request.headers.get("cookie"),
      config.sessionSecret,
      nowMs,
    );
  } catch {
    return genericUnavailable();
  }

  if (!session.valid) {
    return jsonResponse({
      ...availablePayload(config),
      status: session.reason === "expired" ? "expired" : "available",
    });
  }

  if (config.accessMode === "test") {
    if (!config.testAccessCode) {
      return genericUnavailable();
    }
    const testSubjectId = createTestSubjectId(config.testAccessCode, config.sessionSecret);
    if (session.payload.subjectId !== testSubjectId) {
      return jsonResponse(availablePayload(config));
    }
    return jsonResponse({
      chatEnabled: true,
      accessMode: config.accessMode,
      authenticated: true,
      status: "authenticated",
      quota: quotaFor(
        dependencies,
        testSubjectId,
        config.testQuotas,
        session.payload.expiresAtMs,
        nowMs,
      ),
    } satisfies ResearchAccessPayload);
  }

  const invitation = dependencies.store.getInvitation(session.payload.subjectId);
  if (!invitation) {
    return jsonResponse({
      chatEnabled: true,
      accessMode: config.accessMode,
      authenticated: false,
      status: "revoked",
    } satisfies ResearchAccessPayload);
  }
  const state = invitationState(invitation, nowMs);
  if (state !== "active") {
    return jsonResponse({
      chatEnabled: true,
      accessMode: config.accessMode,
      authenticated: false,
      status: state,
    } satisfies ResearchAccessPayload);
  }

  return jsonResponse({
    chatEnabled: true,
    accessMode: config.accessMode,
    authenticated: true,
    status: "authenticated",
    quota: quotaFor(
      dependencies,
      invitation.id,
      invitation.quotas,
      session.payload.expiresAtMs,
      nowMs,
    ),
  } satisfies ResearchAccessPayload);
}

async function unsafeHandleResearchAccessPost(
  request: Request,
  dependencies: ResearchAccessServiceDependencies,
): Promise<Response> {
  const { config } = dependencies;
  const nowMs = dependencies.now?.() ?? Date.now();
  const production = dependencies.production ?? false;

  if (!sameOriginAllowed(request, config)) {
    return genericForbidden();
  }
  if (!config.chatEnabled || config.accessMode === "disabled") {
    return genericUnavailable();
  }
  if (!config.sessionSecret) {
    return genericUnavailable();
  }
  const paused = operationalPause(dependencies);
  if (paused === null || paused) {
    return genericUnavailable();
  }
  const loginSubject = createNativeOkfIpSubject(
    { headers: request.headers },
    config.trustedProxy,
    config.sessionSecret,
  ).ipSubject;
  const loginRate = dependencies.loginRateLimiter.consume(
    `researcher-login:${loginSubject}`,
    nowMs,
    Math.min(12, config.globalRequestsPerMinute),
  );
  if (!loginRate.allowed) {
    return jsonResponse(
      { error: "Too many access attempts. Please wait." },
      429,
      { "retry-after": String(Math.max(1, Math.ceil(loginRate.retryAfterMs / 1_000))) },
    );
  }

  const code = await readCode(request);
  if (!code) {
    return genericInvalidCode();
  }

  if (config.accessMode === "test") {
    if (
      !config.testAccessCode ||
      !timingSafeAccessCodeEqual(
        code,
        config.testAccessCode,
        config.sessionSecret,
        "test",
      )
    ) {
      return genericInvalidCode();
    }

    const accessExpiresAtMs =
      nowMs + config.researcherSessionMaxAgeSeconds * 1_000;
    const testSubjectId = createTestSubjectId(config.testAccessCode, config.sessionSecret);
    const session = issueResearcherSession({
      subjectId: testSubjectId,
      accessExpiresAtMs,
      secret: config.sessionSecret,
      nowMs,
      maxAgeSeconds: config.researcherSessionMaxAgeSeconds,
    });
    return jsonResponse(
      {
        chatEnabled: true,
        accessMode: config.accessMode,
        authenticated: true,
        status: "authenticated",
        quota: quotaFor(
          dependencies,
          testSubjectId,
          config.testQuotas,
          session.payload.expiresAtMs,
          nowMs,
        ),
      } satisfies ResearchAccessPayload,
      200,
      {
        "set-cookie": serializeResearcherSessionCookie(session, {
          production,
          nowMs,
        }),
      },
    );
  }

  if (!config.inviteHashSecret) {
    return genericUnavailable();
  }
  const codeHash = hashInvitationCode(code, config.inviteHashSecret);
  const invitation = dependencies.store.findInvitationByCodeHash(codeHash);
  if (!invitation || invitationStatus(invitation, nowMs) !== "active") {
    return genericInvalidCode();
  }

  const session = issueResearcherSession({
    subjectId: invitation.id,
    accessExpiresAtMs: invitation.expiresAtMs,
    secret: config.sessionSecret,
    nowMs,
    maxAgeSeconds: config.researcherSessionMaxAgeSeconds,
  });
  return jsonResponse(
    {
      chatEnabled: true,
      accessMode: config.accessMode,
      authenticated: true,
      status: "authenticated",
      quota: quotaFor(
        dependencies,
        invitation.id,
        invitation.quotas,
        session.payload.expiresAtMs,
        nowMs,
      ),
    } satisfies ResearchAccessPayload,
    200,
    {
      "set-cookie": serializeResearcherSessionCookie(session, {
        production,
        nowMs,
      }),
    },
  );
}

export async function handleResearchAccessGet(
  request: Request,
  dependencies: ResearchAccessServiceDependencies,
): Promise<Response> {
  try {
    return await unsafeHandleResearchAccessGet(request, dependencies);
  } catch {
    return genericUnavailable();
  }
}

export async function handleResearchAccessPost(
  request: Request,
  dependencies: ResearchAccessServiceDependencies,
): Promise<Response> {
  try {
    return await unsafeHandleResearchAccessPost(request, dependencies);
  } catch {
    return genericUnavailable();
  }
}
export async function handleResearchAccessDelete(
  request: Request,
  dependencies: ResearchAccessServiceDependencies,
): Promise<Response> {
  const { config } = dependencies;
  if (!sameOriginAllowed(request, config)) {
    return genericForbidden();
  }

  const payload =
    !config.chatEnabled || config.accessMode === "disabled"
      ? disabledPayload(config)
      : availablePayload(config);
  return jsonResponse(payload, 200, {
    "set-cookie": clearResearcherSessionCookie(
      dependencies.production ?? false,
    ),
  });
}

