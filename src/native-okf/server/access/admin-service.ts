import "server-only";

import { randomUUID } from "node:crypto";

import type { NativeOkfAdminRateLimiter } from "./admin-rate-limit.ts";
import { createNativeOkfIpSubject } from "./client-ip.ts";
import { timingSafeAccessCodeEqual } from "./access-service.ts";
import type { NativeOkfAccessConfig } from "./config.ts";
import { normalizeNativeOkfAdministrativeLabel } from "./labels.ts";
import {
  clearAdminSessionCookie,
  issueAdminSession,
  serializeAdminSessionCookie,
  verifyAdminSessionCookie,
} from "./sessions.ts";
import { verifyNativeOkfSameOriginMutation } from "./same-origin.ts";
import type { NativeOkfOperationalStore } from "./store.ts";
import type {
  DashboardSnapshot,
  InvitationDashboardRow,
  InvitationPatch,
} from "./types.ts";

const MAX_CODE_LENGTH = 512;
const MAX_JSON_LENGTH = 8_192;
const MAX_QUOTA_VALUE = 1_000_000;
const DAY_MS = 86_400_000;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g;

export interface AdminServiceDependencies {
  config: NativeOkfAccessConfig;
  store: NativeOkfOperationalStore;
  rateLimiter: NativeOkfAdminRateLimiter;
  now?: () => number;
  production?: boolean;
  modelLabel?: string;
}

type ParsedAdminMutation =
  | { action: "pause" | "resume"; invitationId: null }
  | { action: "revoke"; invitationId: string }
  | { action: "extend"; invitationId: string; days: number }
  | {
      action: "adjust";
      invitationId: string;
      patch: InvitationPatch;
    };

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

function sameOriginAllowed(
  request: Request,
  config: NativeOkfAccessConfig,
): boolean {
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

function adminConfigured(config: NativeOkfAccessConfig): boolean {
  return Boolean(
    config.adminConfigured &&
      config.adminAccessCode &&
      config.adminSessionSecret,
  );
}

function adminAuthentication(
  request: Request,
  dependencies: AdminServiceDependencies,
):
  | { authenticated: true; subjectId: string }
  | { authenticated: false } {
  if (
    !adminConfigured(dependencies.config) ||
    !dependencies.config.adminSessionSecret
  ) {
    return { authenticated: false };
  }

  try {
    const verification = verifyAdminSessionCookie(
      request.headers.get("cookie"),
      dependencies.config.adminSessionSecret,
      dependencies.now?.() ?? Date.now(),
    );
    return verification.valid
      ? { authenticated: true, subjectId: verification.payload.subjectId }
      : { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}

function genericAdminRequired(): Response {
  return jsonResponse(
    { error: "Administrator access is required." },
    401,
  );
}

function genericAdminInvalid(): Response {
  return jsonResponse(
    { error: "Administrator access could not be granted." },
    401,
  );
}

function genericForbidden(): Response {
  return jsonResponse(
    { error: "The request could not be authorized." },
    403,
  );
}

function genericUnavailable(): Response {
  return jsonResponse(
    { error: "Administrative controls are currently unavailable." },
    503,
  );
}

function genericMutationFailure(status = 400): Response {
  return jsonResponse(
    { error: "The administrative change could not be applied." },
    status,
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

async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | null> {
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
  return typeof body === "object" && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : null;
}

async function readAdminCode(request: Request): Promise<string | null> {
  const body = await readJsonObject(request);
  if (
    !body ||
    Object.keys(body).length !== 1 ||
    typeof body.code !== "string"
  ) {
    return null;
  }
  return sanitizeCode(body.code);
}

function hasExactKeys(
  body: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(body).sort();
  const wanted = [...expected].sort();
  return (
    actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
  );
}

function boundedInteger(
  value: unknown,
  minimum: number,
  maximum = MAX_QUOTA_VALUE,
): number | null {
  return Number.isSafeInteger(value) &&
    (value as number) >= minimum &&
    (value as number) <= maximum
    ? (value as number)
    : null;
}

function invitationId(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 128 ||
    !/^[A-Za-z0-9:_-]+$/.test(value)
  ) {
    return null;
  }
  return value;
}

function parseQuotaPatch(value: unknown): InvitationPatch | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const body = value as Record<string, unknown>;
  const allowed = new Set([
    "dailyQuestions",
    "dailyDiagrams",
    "totalQuestions",
    "totalDiagrams",
    "requestsPerMinute",
    "cooldownSeconds",
    "maxConcurrent",
    "label",
  ]);
  const keys = Object.keys(body);
  if (
    keys.length === 0 ||
    keys.some((key) => !allowed.has(key))
  ) {
    return null;
  }

  const patch: InvitationPatch = {};
  const minimums: Record<string, number> = {
    dailyQuestions: 1,
    dailyDiagrams: 0,
    totalQuestions: 1,
    totalDiagrams: 0,
    requestsPerMinute: 1,
    cooldownSeconds: 0,
    maxConcurrent: 1,
  };
  for (const [key, minimum] of Object.entries(minimums)) {
    if (!(key in body)) {
      continue;
    }
    const parsed = boundedInteger(body[key], minimum);
    if (parsed === null) {
      return null;
    }
    (patch as Record<string, unknown>)[key] = parsed;
  }

  if ("label" in body) {
    if (typeof body.label !== "string") {
      return null;
    }
    const label = normalizeNativeOkfAdministrativeLabel(body.label);
    if (!label) {
      return null;
    }
    patch.label = label;
  }

  return patch;
}

async function parseMutation(
  request: Request,
): Promise<ParsedAdminMutation | null> {
  const body = await readJsonObject(request);
  if (!body || typeof body.action !== "string") {
    return null;
  }

  if (body.action === "pause" || body.action === "resume") {
    return hasExactKeys(body, ["action"])
      ? { action: body.action, invitationId: null }
      : null;
  }

  const id = invitationId(body.invitationId);
  if (!id) {
    return null;
  }

  if (body.action === "revoke") {
    return hasExactKeys(body, ["action", "invitationId"])
      ? { action: "revoke", invitationId: id }
      : null;
  }

  if (body.action === "extend") {
    if (!hasExactKeys(body, ["action", "invitationId", "days"])) {
      return null;
    }
    const days = boundedInteger(body.days, 1, 365);
    return days === null
      ? null
      : { action: "extend", invitationId: id, days };
  }

  if (body.action === "adjust") {
    if (!hasExactKeys(body, ["action", "invitationId", "patch"])) {
      return null;
    }
    const patch = parseQuotaPatch(body.patch);
    return patch
      ? { action: "adjust", invitationId: id, patch }
      : null;
  }

  return null;
}

function safeAudit(
  dependencies: AdminServiceDependencies,
  action: string,
  targetInvitationId: string | null,
  outcomeCategory: string,
  nowMs: number,
): void {
  try {
    dependencies.store.recordAdminAudit({
      id: randomUUID(),
      createdAtMs: nowMs,
      action,
      targetInvitationId,
      outcomeCategory,
    });
  } catch {
    // A content-free audit failure must never expose storage details.
  }
}

function safeModelLabel(value: string | undefined): string | undefined {
  const sanitized = value?.replace(CONTROL_CHARACTERS, "").trim();
  return sanitized ? sanitized.slice(0, 120) : undefined;
}

function safeInvitation(
  invitation: InvitationDashboardRow,
): InvitationDashboardRow {
  return {
    id: invitation.id,
    label: invitation.label,
    createdAtMs: invitation.createdAtMs,
    expiresAtMs: invitation.expiresAtMs,
    revokedAtMs: invitation.revokedAtMs,
    quotas: { ...invitation.quotas },
    questionsUsedTotal: invitation.questionsUsedTotal,
    diagramsUsedTotal: invitation.diagramsUsedTotal,
    attributedMicrodollars: invitation.attributedMicrodollars,
    lastUsedAtMs: invitation.lastUsedAtMs,
    status: invitation.status,
    quota: { ...invitation.quota },
  };
}

function safeSnapshot(snapshot: DashboardSnapshot): DashboardSnapshot {
  return {
    generatedAtMs: snapshot.generatedAtMs,
    daily: snapshot.daily.map((day) => ({ ...day })),
    estimatedMicrodollarsToday: snapshot.estimatedMicrodollarsToday,
    estimatedMicrodollarsThisMonth: snapshot.estimatedMicrodollarsThisMonth,
    questionsToday: snapshot.questionsToday,
    diagramsToday: snapshot.diagramsToday,
    modelCallsToday: snapshot.modelCallsToday,
    activeReservations: snapshot.activeReservations,
    activeReservedMicrodollars: snapshot.activeReservedMicrodollars,
    unreconciledUsageEvents: snapshot.unreconciledUsageEvents,
    recentErrors: snapshot.recentErrors.map((error) => ({ ...error })),
    operationalPaused: snapshot.operationalPaused,
    remainingDailyMicrodollars: snapshot.remainingDailyMicrodollars,
    remainingMonthlyMicrodollars: snapshot.remainingMonthlyMicrodollars,
    invitations: snapshot.invitations.map(safeInvitation),
  };
}

export async function handleAdminSessionGet(
  request: Request,
  dependencies: AdminServiceDependencies,
): Promise<Response> {
  if (!adminConfigured(dependencies.config)) {
    return jsonResponse({ authenticated: false, status: "unavailable" });
  }
  const authentication = adminAuthentication(request, dependencies);
  return jsonResponse({
    authenticated: authentication.authenticated,
    status: authentication.authenticated ? "authenticated" : "required",
  });
}

export async function handleAdminSessionPost(
  request: Request,
  dependencies: AdminServiceDependencies,
): Promise<Response> {
  const { config } = dependencies;
  const nowMs = dependencies.now?.() ?? Date.now();

  if (!sameOriginAllowed(request, config)) {
    return genericForbidden();
  }
  if (
    !adminConfigured(config) ||
    !config.adminAccessCode ||
    !config.adminSessionSecret
  ) {
    return genericUnavailable();
  }

  const loginSubject = createNativeOkfIpSubject(
    { headers: request.headers },
    config.trustedProxy,
    config.adminSessionSecret,
  ).ipSubject;
  const loginRate = dependencies.rateLimiter.consume(
    `admin-login:${loginSubject}`,
    nowMs,
    config.adminMutationsPerMinute,
  );
  if (!loginRate.allowed) {
    return jsonResponse(
      { error: "Too many administrator access attempts. Please wait." },
      429,
      { "retry-after": String(Math.max(1, Math.ceil(loginRate.retryAfterMs / 1_000))) },
    );
  }
  const code = await readAdminCode(request);
  if (
    !code ||
    !timingSafeAccessCodeEqual(
      code,
      config.adminAccessCode,
      config.adminSessionSecret,
      "admin",
    )
  ) {
    return genericAdminInvalid();
  }

  const session = issueAdminSession({
    secret: config.adminSessionSecret,
    nowMs,
    maxAgeSeconds: config.adminSessionMaxAgeSeconds,
  });
  return jsonResponse(
    { authenticated: true, status: "authenticated" },
    200,
    {
      "set-cookie": serializeAdminSessionCookie(session, {
        production: dependencies.production ?? false,
        nowMs,
      }),
    },
  );
}

export async function handleAdminSessionDelete(
  request: Request,
  dependencies: AdminServiceDependencies,
): Promise<Response> {
  if (!sameOriginAllowed(request, dependencies.config)) {
    return genericForbidden();
  }
  return jsonResponse(
    { authenticated: false, status: "required" },
    200,
    {
      "set-cookie": clearAdminSessionCookie(
        dependencies.production ?? false,
      ),
    },
  );
}

export async function handleAdminDashboardGet(
  request: Request,
  dependencies: AdminServiceDependencies,
): Promise<Response> {
  if (!adminAuthentication(request, dependencies).authenticated) {
    return genericAdminRequired();
  }

  const nowMs = dependencies.now?.() ?? Date.now();
  let snapshot: DashboardSnapshot;
  try {
    snapshot = safeSnapshot(
      dependencies.store.getDashboardSnapshot(
        nowMs,
        dependencies.config.applicationBudgets,
      ),
    );
  } catch {
    return genericUnavailable();
  }

  const modelLabel = safeModelLabel(dependencies.modelLabel);
  return jsonResponse({
    chatEnabled: dependencies.config.chatEnabled,
    accessMode: dependencies.config.accessMode,
    ...(modelLabel ? { modelLabel } : {}),
    dailyBudgetMicrodollars:
      dependencies.config.applicationBudgets.dailyMicrodollars,
    monthlyBudgetMicrodollars:
      dependencies.config.applicationBudgets.monthlyMicrodollars,
    ...snapshot,
  });
}

export async function handleAdminMutationPost(
  request: Request,
  dependencies: AdminServiceDependencies,
): Promise<Response> {
  const nowMs = dependencies.now?.() ?? Date.now();
  const attemptRate = dependencies.rateLimiter.consume(
    adminMutationAttemptSubject(request, dependencies.config),
    nowMs,
    dependencies.config.adminMutationsPerMinute,
  );
  if (!attemptRate.allowed) {
    return jsonResponse(
      { error: "Too many administrative changes. Please wait." },
      429,
      {
        "retry-after": String(
          Math.max(1, Math.ceil(attemptRate.retryAfterMs / 1_000)),
        ),
      },
    );
  }
  const authentication = adminAuthentication(request, dependencies);
  if (!authentication.authenticated) {
    safeAudit(dependencies, "mutation", null, "unauthorized", nowMs);
    return genericAdminRequired();
  }
  if (!sameOriginAllowed(request, dependencies.config)) {
    safeAudit(dependencies, "mutation", null, "origin-rejected", nowMs);
    return genericForbidden();
  }

  const rate = dependencies.rateLimiter.consume(
    authentication.subjectId,
    nowMs,
    dependencies.config.adminMutationsPerMinute,
  );
  if (!rate.allowed) {
    safeAudit(dependencies, "mutation", null, "rate-limited", nowMs);
    return jsonResponse(
      { error: "Too many administrative changes. Please wait." },
      429,
      { "retry-after": String(Math.max(1, Math.ceil(rate.retryAfterMs / 1_000))) },
    );
  }

  const mutation = await parseMutation(request);
  if (!mutation) {
    safeAudit(dependencies, "mutation", null, "validation-failed", nowMs);
    return genericMutationFailure();
  }

  try {
    if (mutation.action === "pause" || mutation.action === "resume") {
      dependencies.store.setOperationalPause(
        mutation.action === "pause",
        nowMs,
      );
    } else if (mutation.action === "revoke") {
      if (
        !dependencies.store.revokeInvitation(
          mutation.invitationId,
          nowMs,
        )
      ) {
        safeAudit(
          dependencies,
          mutation.action,
          mutation.invitationId,
          "not-found",
          nowMs,
        );
        return genericMutationFailure(404);
      }
    } else if (mutation.action === "extend") {
      const invitation = dependencies.store.getInvitation(
        mutation.invitationId,
      );
      if (!invitation || invitation.revokedAtMs !== null) {
        safeAudit(
          dependencies,
          mutation.action,
          mutation.invitationId,
          "not-found",
          nowMs,
        );
        return genericMutationFailure(404);
      }
      const baseline = Math.max(nowMs, invitation.expiresAtMs);
      const expiresAtMs = baseline + mutation.days * DAY_MS;
      if (
        !Number.isSafeInteger(expiresAtMs) ||
        !dependencies.store.updateInvitation(
          mutation.invitationId,
          { expiresAtMs },
          nowMs,
        )
      ) {
        throw new Error("Invitation extension failed.");
      }
    } else if (mutation.action === "adjust") {
      if (
        !dependencies.store.updateInvitation(
          mutation.invitationId,
          mutation.patch,
          nowMs,
        )
      ) {
        safeAudit(
          dependencies,
          mutation.action,
          mutation.invitationId,
          "not-found",
          nowMs,
        );
        return genericMutationFailure(404);
      }
    }

    dependencies.store.recordAdminAudit({
      id: randomUUID(),
      createdAtMs: nowMs,
      action: mutation.action,
      targetInvitationId: mutation.invitationId,
      outcomeCategory: "success",
    });
    return jsonResponse({ ok: true, action: mutation.action });
  } catch {
    safeAudit(
      dependencies,
      mutation.action,
      mutation.invitationId,
      "failed",
      nowMs,
    );
    return genericMutationFailure();
  }
}

function adminMutationAttemptSubject(
  request: Request,
  config: NativeOkfAccessConfig,
): string {
  if (!config.adminSessionSecret) {
    return "admin-mutation-attempt:unconfigured";
  }
  try {
    const ipSubject = createNativeOkfIpSubject(
      { headers: request.headers },
      config.trustedProxy,
      config.adminSessionSecret,
    ).ipSubject;
    return `admin-mutation-attempt:${ipSubject}`;
  } catch {
    return "admin-mutation-attempt:opaque";
  }
}

