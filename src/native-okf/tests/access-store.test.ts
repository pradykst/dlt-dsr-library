import "server-only";

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  NativeOkfAccessConfigurationError,
  parseNativeOkfAccessConfig,
  parseUsdToMicrodollars,
} from "../server/access/config.ts";
import {
  generateInvitationCode,
  hashInvitationCode,
  hashIpSubject,
  timingSafeHashEqual,
} from "../server/access/crypto.ts";
import { MemoryNativeOkfOperationalStore } from "../server/access/memory-store.ts";
import { SqliteNativeOkfOperationalStore } from "../server/access/sqlite-store.ts";
import { initializeNativeOkfOperationalStore } from "../server/access/store-singleton.ts";
import type {
  ApplicationBudgetLimits,
  CreateInvitationInput,
  QuotaLimits,
  ReservationRequest,
} from "../server/access/types.ts";

const NOW = Date.UTC(2026, 6, 18, 12, 0, 0);
const HMAC_SECRET = "h".repeat(32);
const SESSION_SECRET = "s".repeat(32);
const PUBLIC_ORIGIN = "https://native-okf.example";

const QUOTAS: QuotaLimits = {
  dailyQuestions: 3,
  dailyDiagrams: 1,
  totalQuestions: 5,
  totalDiagrams: 2,
  requestsPerMinute: 10,
  cooldownSeconds: 0,
  maxConcurrent: 2,
};

const BUDGETS: ApplicationBudgetLimits = {
  dailyMicrodollars: 1_000_000,
  monthlyMicrodollars: 2_000_000,
  maxGlobalConcurrent: 3,
};

function invitation(
  overrides: Partial<CreateInvitationInput> = {},
): CreateInvitationInput {
  return {
    id: "invite-1",
    codeHash: hashInvitationCode("private-invitation-code", HMAC_SECRET),
    label: "Research cohort A",
    createdAtMs: NOW - 1_000,
    expiresAtMs: NOW + 14 * 86_400_000,
    quotas: { ...QUOTAS },
    ...overrides,
  };
}

function reservation(
  id: string,
  overrides: Partial<ReservationRequest> = {},
): ReservationRequest {
  return {
    reservationId: id,
    subjectId: "invite-1",
    subjectKind: "invite",
    invitationId: "invite-1",
    nowMs: NOW,
    expiresAtMs: NOW + 120_000,
    includeDiagram: false,
    reserveMicrodollars: 80_000,
    subjectLimits: { ...QUOTAS },
    applicationLimits: { ...BUDGETS },
    accessExpiresAtMs: NOW + 14 * 86_400_000,
    ...overrides,
  };
}

function completeReservation(
  store: MemoryNativeOkfOperationalStore,
  reservationId: string,
  completedAtMs: number,
  options: {
    microdollars?: number;
    diagramModelCalls?: 0 | 1;
    errorCategory?: string | null;
  } = {},
): void {
  store.reconcileReservation({
    reservationId,
    completedAtMs,
    usage: {
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      modelCalls: 1,
    },
    diagramModelCalls: options.diagramModelCalls ?? 0,
    diagramDelivered: options.diagramModelCalls === 1,
    actualMicrodollars: options.microdollars ?? 0,
    usageUnreconciled: false,
    latencyMs: 0,
    outcomeCategory: "test-complete",
    errorCategory: options.errorCategory ?? null,
  });
}

function activeConfigEnvironment(): Record<string, string> {
  return {
    NATIVE_OKF_CHAT_ENABLED: "true",
    NATIVE_OKF_ACCESS_MODE: "invite",
    NATIVE_OKF_SESSION_SECRET: SESSION_SECRET,
    NATIVE_OKF_INVITE_HASH_SECRET: HMAC_SECRET,
    NATIVE_OKF_PUBLIC_ORIGIN: PUBLIC_ORIGIN,
    OPENAI_INPUT_USD_PER_MILLION: "1.25",
    OPENAI_CACHED_INPUT_USD_PER_MILLION: "0.25",
    OPENAI_OUTPUT_USD_PER_MILLION: "10.00",
  };
}

test("access config defaults invalid or missing mode to disabled", () => {
  const missing = parseNativeOkfAccessConfig({});
  const invalid = parseNativeOkfAccessConfig({
    NATIVE_OKF_CHAT_ENABLED: "true",
    NATIVE_OKF_ACCESS_MODE: "public",
  });
  assert.equal(missing.chatEnabled, false);
  assert.equal(missing.accessMode, "disabled");
  assert.equal(invalid.accessMode, "disabled");
  assert.equal(invalid.durableStoreRequired, false);
  assert.deepEqual(invalid.trustedProxy, { trustProxy: false });
});

test("active invite config validates secrets, pricing, origin and safe defaults", () => {
  const config = parseNativeOkfAccessConfig(activeConfigEnvironment());
  assert.equal(config.accessMode, "invite");
  assert.equal(config.durableStoreRequired, true);
  assert.equal(config.applicationBudgets.dailyMicrodollars, 3_000_000);
  assert.equal(config.applicationBudgets.monthlyMicrodollars, 20_000_000);
  assert.equal(config.textRequestReserveMicrodollars, 80_000);
  assert.equal(config.inviteDefaultQuotas.totalQuestions, 25);
  assert.equal(config.publicOrigin, PUBLIC_ORIGIN);
  assert.deepEqual(config.trustedProxy, { trustProxy: false });
  assert.equal(config.researcherSessionMaxAgeSeconds, 86_400);
  assert.equal(config.adminSessionMaxAgeSeconds, 1_800);
  assert.equal(config.reservationTtlMs, 1_800_000);
  assert.equal(config.adminMutationsPerMinute, 10);
});

test("test mode uses independently configurable hard budgets", () => {
  const config = parseNativeOkfAccessConfig({
    ...activeConfigEnvironment(),
    NATIVE_OKF_ACCESS_MODE: "test",
    NATIVE_OKF_TEST_ACCESS_CODE: "private-test-code",
    NATIVE_OKF_TEST_HARD_DAILY_USD: "1.50",
    NATIVE_OKF_TEST_HARD_MONTHLY_USD: "6.00",
    NATIVE_OKF_HARD_DAILY_USD: "99.00",
    NATIVE_OKF_HARD_MONTHLY_USD: "100.00",
    NATIVE_OKF_RESEARCHER_SESSION_HOURS: "48",
    NATIVE_OKF_ADMIN_SESSION_MINUTES: "60",
    NATIVE_OKF_RESERVATION_TTL_SECONDS: "300",
    NATIVE_OKF_ADMIN_MUTATIONS_PER_MINUTE: "7",
  });
  assert.equal(config.applicationBudgets.dailyMicrodollars, 1_500_000);
  assert.equal(config.applicationBudgets.monthlyMicrodollars, 6_000_000);
  assert.equal(config.researcherSessionMaxAgeSeconds, 172_800);
  assert.equal(config.adminSessionMaxAgeSeconds, 3_600);
  assert.equal(config.reservationTtlMs, 300_000);
  assert.equal(config.adminMutationsPerMinute, 7);
});

test("active safety configuration fails closed", () => {
  const environment = activeConfigEnvironment();
  delete environment.NATIVE_OKF_INVITE_HASH_SECRET;
  assert.throws(
    () => parseNativeOkfAccessConfig(environment),
    NativeOkfAccessConfigurationError,
  );
  assert.throws(
    () =>
      parseNativeOkfAccessConfig({
        ...activeConfigEnvironment(),
        NATIVE_OKF_PUBLIC_ORIGIN: "javascript:unsafe",
      }),
    NativeOkfAccessConfigurationError,
  );
  assert.throws(
    () =>
      parseNativeOkfAccessConfig({
        ...activeConfigEnvironment(),
        NATIVE_OKF_HARD_DAILY_USD: "21",
        NATIVE_OKF_HARD_MONTHLY_USD: "20",
      }),
    NativeOkfAccessConfigurationError,
  );
  assert.throws(
    () =>
      parseNativeOkfAccessConfig({
        ...activeConfigEnvironment(),
        OPENAI_INPUT_USD_PER_MILLION: "0",
      }),
    NativeOkfAccessConfigurationError,
  );
});

test("trusted proxy headers are disabled by default and explicit when enabled", () => {
  const config = parseNativeOkfAccessConfig({
    ...activeConfigEnvironment(),
    NATIVE_OKF_TRUST_PROXY: "true",
    NATIVE_OKF_TRUSTED_PROXY_HEADER: "x-real-ip",
    NATIVE_OKF_TRUSTED_PROXY_HOPS: "2",
  });
  assert.deepEqual(config.trustedProxy, {
    trustProxy: true,
    header: "x-real-ip",
    trustedHops: 2,
  });
  assert.throws(() =>
    parseNativeOkfAccessConfig({
      ...activeConfigEnvironment(),
      NATIVE_OKF_TRUST_PROXY: "true",
      NATIVE_OKF_TRUSTED_PROXY_HEADER: "forwarded",
    }),
  );
});

test("USD parsing produces exact integer microdollars", () => {
  assert.equal(parseUsdToMicrodollars("0.08", "reserve"), 80_000);
  assert.equal(parseUsdToMicrodollars("3", "budget"), 3_000_000);
  assert.equal(parseUsdToMicrodollars("1.234567", "price"), 1_234_567);
  assert.throws(() => parseUsdToMicrodollars("0.0000001", "price"));
});

test("invitation and IP credentials use domain-separated HMACs", () => {
  const first = generateInvitationCode();
  const second = generateInvitationCode();
  assert.notEqual(first, second);
  assert.equal(Buffer.from(first, "base64url").byteLength, 24);
  const invitationHash = hashInvitationCode(first, HMAC_SECRET);
  const ipHash = hashIpSubject(first, HMAC_SECRET);
  assert.match(invitationHash, /^[a-f\d]{64}$/);
  assert.notEqual(invitationHash, ipHash);
  assert.equal(timingSafeHashEqual(invitationHash, invitationHash), true);
  assert.equal(timingSafeHashEqual(invitationHash, ipHash), false);
  assert.equal(invitationHash.includes(first), false);
});

test("invitation listings never expose code hashes and updates cannot undercut usage", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  const listed = store.listInvitations(NOW);
  assert.equal(listed.length, 1);
  assert.equal("codeHash" in listed[0], false);
  const accepted = store.reservePaidRequest(reservation("r-update"));
  assert.equal(accepted.allowed, true);
  assert.throws(() =>
    store.updateInvitation("invite-1", { totalQuestions: 0 }, NOW),
  );
  const updated = store.updateInvitation(
    "invite-1",
    { label: "Extended cohort", expiresAtMs: NOW + 20 * 86_400_000 },
    NOW,
  );
  assert.equal(updated?.label, "Extended cohort");
  assert.equal(store.revokeInvitation("invite-1", NOW)?.status, "revoked");
  assert.equal(
    store.reservePaidRequest(reservation("r-revoked")).allowed,
    false,
  );
});

test("reservation is atomic across personal and global concurrency", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  const first = store.reservePaidRequest(
    reservation("r-concurrent-1", {
      subjectLimits: { ...QUOTAS, maxConcurrent: 1 },
    }),
  );
  const second = store.reservePaidRequest(
    reservation("r-concurrent-2", {
      subjectLimits: { ...QUOTAS, maxConcurrent: 1 },
    }),
  );
  assert.equal(first.allowed, true);
  assert.deepEqual(second, { allowed: false, reason: "subject-concurrency" });
  assert.equal(store.getUsageReport(NOW).activeReservations, 1);
});

test("subject RPM blocks without creating another reservation", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  const limits = {
    ...QUOTAS,
    requestsPerMinute: 1,
    cooldownSeconds: 0,
    maxConcurrent: 1,
  };
  assert.equal(
    store.reservePaidRequest(
      reservation("r-subject-rpm-1", { subjectLimits: limits }),
    ).allowed,
    true,
  );
  assert.equal(
    store.releaseReservation({
      reservationId: "r-subject-rpm-1",
      releasedAtMs: NOW + 1,
      releaseQuota: true,
      outcomeCategory: "not-dispatched",
      errorCategory: null,
    }),
    true,
  );

  assert.deepEqual(
    store.reservePaidRequest(
      reservation("r-subject-rpm-2", {
        nowMs: NOW + 2,
        expiresAtMs: NOW + 120_002,
        subjectLimits: limits,
      }),
    ),
    { allowed: false, reason: "subject-rpm", retryAfterMs: 60_000 },
  );
  assert.equal(store.getUsageReport(NOW + 2).activeReservations, 0);
  assert.equal(store.getActiveReservation("r-subject-rpm-2"), null);
});

test("global concurrency blocks a second subject without consuming its quota", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  store.createInvitation(
    invitation({
      id: "invite-2",
      codeHash: hashInvitationCode("second-private-code", HMAC_SECRET),
      label: "Research cohort B",
    }),
  );
  const applicationLimits = { ...BUDGETS, maxGlobalConcurrent: 1 };
  assert.equal(
    store.reservePaidRequest(
      reservation("r-global-concurrency-1", {
        applicationLimits,
        subjectLimits: { ...QUOTAS, maxConcurrent: 2 },
      }),
    ).allowed,
    true,
  );

  assert.deepEqual(
    store.reservePaidRequest(
      reservation("r-global-concurrency-2", {
        subjectId: "invite-2",
        invitationId: "invite-2",
        nowMs: NOW + 1,
        expiresAtMs: NOW + 120_001,
        applicationLimits,
        subjectLimits: { ...QUOTAS, maxConcurrent: 2 },
      }),
    ),
    { allowed: false, reason: "global-concurrency" },
  );
  assert.equal(store.getUsageReport(NOW + 1).activeReservations, 1);
  assert.equal(store.getInvitation("invite-2")?.questionsUsedTotal, 0);
});

test("global anonymous RPM blocks deterministically", () => {
  const store = new MemoryNativeOkfOperationalStore();
  assert.deepEqual(
    store.checkAndRecordAbuseAttempt({
      ipSubject: hashIpSubject("192.0.2.10", HMAC_SECRET),
      nowMs: NOW,
      globalRequestsPerMinute: 1,
      ipRequestsPerHour: 10,
    }),
    { allowed: true },
  );
  assert.deepEqual(
    store.checkAndRecordAbuseAttempt({
      ipSubject: hashIpSubject("192.0.2.11", HMAC_SECRET),
      nowMs: NOW + 1,
      globalRequestsPerMinute: 1,
      ipRequestsPerHour: 10,
    }),
    { allowed: false, reason: "global-rpm", retryAfterMs: 60_000 },
  );
  assert.equal(store.getUsageReport(NOW + 1).activeReservations, 0);
});

test("diagram reservation is released when no diagram is delivered", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  assert.equal(
    store.reservePaidRequest(
      reservation("r-no-diagram-call", { includeDiagram: true }),
    ).allowed,
    true,
  );
  store.reconcileReservation({
    reservationId: "r-no-diagram-call",
    completedAtMs: NOW + 1_000,
    usage: {
      inputTokens: 100,
      cachedInputTokens: 10,
      outputTokens: 20,
      modelCalls: 1,
    },
    diagramModelCalls: 0,
    diagramDelivered: false,
    actualMicrodollars: 250,
    usageUnreconciled: false,
    latencyMs: 1_000,
    outcomeCategory: "answer-complete",
    errorCategory: null,
  });
  const quota = store.getSubjectQuotaSnapshot({
    subjectId: "invite-1",
    nowMs: NOW + 1_000,
    limits: QUOTAS,
    accessExpiresAtMs: NOW + 14 * 86_400_000,
  });
  assert.equal(quota.questionsUsedTotal, 1);
  assert.equal(quota.diagramsUsedTotal, 0);
  assert.equal(quota.diagramsRemainingToday, 1);
});

test("moderation-only release consumes no paid question or diagram quota", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  store.reservePaidRequest(
    reservation("r-moderated", { includeDiagram: true }),
  );
  store.reconcileReservation({
    reservationId: "r-moderated",
    completedAtMs: NOW + 500,
    usage: {
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      modelCalls: 0,
    },
    diagramModelCalls: 0,
    diagramDelivered: false,
    actualMicrodollars: 0,
    usageUnreconciled: false,
    latencyMs: 500,
    outcomeCategory: "moderation-blocked",
    errorCategory: "moderation-flagged",
  });
  const quota = store.getSubjectQuotaSnapshot({
    subjectId: "invite-1",
    nowMs: NOW + 500,
    limits: QUOTAS,
    accessExpiresAtMs: NOW + 14 * 86_400_000,
  });
  assert.equal(quota.questionsUsedTotal, 0);
  assert.equal(quota.diagramsUsedTotal, 0);
});

test("diagram quota is consumed only when includeDiagram is true", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  store.reservePaidRequest(reservation("r-diagram", { includeDiagram: true }));
  store.reconcileReservation({
    reservationId: "r-diagram",
    completedAtMs: NOW + 100,
    usage: { inputTokens: 10, cachedInputTokens: 0, outputTokens: 10, modelCalls: 2 },
    diagramModelCalls: 1,
    diagramDelivered: true,
    actualMicrodollars: 100,
    usageUnreconciled: false,
    latencyMs: 100,
    outcomeCategory: "complete",
    errorCategory: null,
  });
  const blockedDiagram = store.reservePaidRequest(
    reservation("r-diagram-2", { nowMs: NOW + 200, includeDiagram: true }),
  );
  const allowedText = store.reservePaidRequest(
    reservation("r-text", { nowMs: NOW + 200 }),
  );
  assert.deepEqual(blockedDiagram, {
    allowed: false,
    reason: "daily-diagram-quota",
  });
  assert.equal(allowedText.allowed, true);
});

test("lifetime question quota blocks after the UTC daily window resets", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  const limits = {
    ...QUOTAS,
    dailyQuestions: 1,
    totalQuestions: 1,
  };
  assert.equal(
    store.reservePaidRequest(
      reservation("r-total-question-1", { subjectLimits: limits }),
    ).allowed,
    true,
  );
  completeReservation(store, "r-total-question-1", NOW + 1);

  const nextDay = NOW + 86_400_000;
  assert.deepEqual(
    store.reservePaidRequest(
      reservation("r-total-question-2", {
        nowMs: nextDay,
        expiresAtMs: nextDay + 120_000,
        subjectLimits: limits,
      }),
    ),
    { allowed: false, reason: "total-question-quota" },
  );
  const quota = store.getSubjectQuotaSnapshot({
    subjectId: "invite-1",
    nowMs: nextDay,
    limits,
    accessExpiresAtMs: NOW + 14 * 86_400_000,
  });
  assert.equal(quota.questionsUsedToday, 0);
  assert.equal(quota.questionsUsedTotal, 1);
});

test("lifetime diagram quota blocks after the UTC daily window resets", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  const limits = {
    ...QUOTAS,
    dailyQuestions: 2,
    totalQuestions: 5,
    dailyDiagrams: 1,
    totalDiagrams: 1,
  };
  assert.equal(
    store.reservePaidRequest(
      reservation("r-total-diagram-1", {
        includeDiagram: true,
        subjectLimits: limits,
      }),
    ).allowed,
    true,
  );
  completeReservation(store, "r-total-diagram-1", NOW + 1, {
    diagramModelCalls: 1,
  });

  const nextDay = NOW + 86_400_000;
  assert.deepEqual(
    store.reservePaidRequest(
      reservation("r-total-diagram-2", {
        nowMs: nextDay,
        expiresAtMs: nextDay + 120_000,
        includeDiagram: true,
        subjectLimits: limits,
      }),
    ),
    { allowed: false, reason: "total-diagram-quota" },
  );
  const quota = store.getSubjectQuotaSnapshot({
    subjectId: "invite-1",
    nowMs: nextDay,
    limits,
    accessExpiresAtMs: NOW + 14 * 86_400_000,
  });
  assert.equal(quota.diagramsUsedToday, 0);
  assert.equal(quota.diagramsUsedTotal, 1);
});

test("hard budgets include active reservations before any model call", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  const budgets = { ...BUDGETS, dailyMicrodollars: 100_000 };
  assert.equal(
    store.reservePaidRequest(
      reservation("r-budget-1", {
        reserveMicrodollars: 60_000,
        applicationLimits: budgets,
      }),
    ).allowed,
    true,
  );
  assert.deepEqual(
    store.reservePaidRequest(
      reservation("r-budget-2", {
        nowMs: NOW + 1,
        reserveMicrodollars: 60_000,
        applicationLimits: budgets,
      }),
    ),
    { allowed: false, reason: "daily-budget" },
  );
});

test("monthly hard budget blocks when the current UTC day still permits spend", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(
    invitation({ createdAtMs: NOW - 2 * 86_400_000 }),
  );
  const budgets = {
    ...BUDGETS,
    dailyMicrodollars: 1_000_000,
    monthlyMicrodollars: 100_000,
  };
  const previousDay = NOW - 86_400_000;
  assert.equal(
    store.reservePaidRequest(
      reservation("r-monthly-budget-1", {
        nowMs: previousDay,
        expiresAtMs: previousDay + 120_000,
        reserveMicrodollars: 60_000,
        applicationLimits: budgets,
      }),
    ).allowed,
    true,
  );
  completeReservation(store, "r-monthly-budget-1", previousDay + 1, {
    microdollars: 60_000,
  });

  assert.deepEqual(
    store.reservePaidRequest(
      reservation("r-monthly-budget-2", {
        reserveMicrodollars: 60_000,
        applicationLimits: budgets,
      }),
    ),
    { allowed: false, reason: "monthly-budget" },
  );
  assert.equal(store.getUsageReport(NOW).activeReservations, 0);
  assert.equal(store.getActiveReservation("r-monthly-budget-2"), null);
});

test("recent dashboard errors use a deterministic trailing seven-day window", () => {
  const store = new MemoryNativeOkfOperationalStore();
  const windowStart = NOW - 7 * 86_400_000;
  store.createInvitation(
    invitation({ createdAtMs: windowStart - 2_000 }),
  );

  const recordError = (
    reservationId: string,
    eventAtMs: number,
    errorCategory: string,
  ): void => {
    assert.equal(
      store.reservePaidRequest(
        reservation(reservationId, {
          nowMs: eventAtMs - 1,
          expiresAtMs: eventAtMs + 120_000,
        }),
      ).allowed,
      true,
    );
    completeReservation(store, reservationId, eventAtMs, { errorCategory });
  };

  recordError("r-error-old", windowStart - 1, "old-error");
  recordError("r-error-boundary", windowStart, "recent-error");
  recordError("r-error-new", NOW - 1_000, "new-error");
  recordError("r-error-now", NOW, "recent-error");

  assert.deepEqual(store.getUsageReport(NOW).recentErrors, [
    { category: "recent-error", count: 2 },
    { category: "new-error", count: 1 },
  ]);
});

test("unreconciled usage charges the complete reservation conservatively", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  store.reservePaidRequest(
    reservation("r-unreconciled", { reserveMicrodollars: 180_000 }),
  );
  const event = store.reconcileReservation({
    reservationId: "r-unreconciled",
    completedAtMs: NOW + 2_000,
    usage: { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, modelCalls: 1 },
    diagramModelCalls: 0,
    diagramDelivered: false,
    actualMicrodollars: 0,
    usageUnreconciled: true,
    latencyMs: 2_000,
    outcomeCategory: "usage-missing",
    errorCategory: "usage-unreconciled",
  });
  assert.equal(event.microdollars, 180_000);
  const dashboard = store.getDashboardSnapshot(NOW + 2_000, BUDGETS);
  assert.equal(dashboard.unreconciledUsageEvents, 1);
  assert.equal(dashboard.estimatedMicrodollarsToday, 180_000);
});
test("failed paid reconciliation finalization retains quota and charges reserve", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  store.reservePaidRequest(
    reservation("r-finalize-failed", {
      includeDiagram: true,
      reserveMicrodollars: 180_000,
    }),
  );
  assert.equal(
    store.releaseReservation({
      reservationId: "r-finalize-failed",
      releasedAtMs: NOW + 2_000,
      releaseQuota: false,
      outcomeCategory: "reconciliation-failed",
      errorCategory: "usage-unreconciled",
    }),
    true,
  );
  const quota = store.getSubjectQuotaSnapshot({
    subjectId: "invite-1",
    nowMs: NOW + 2_000,
    limits: QUOTAS,
    accessExpiresAtMs: NOW + 14 * 86_400_000,
  });
  const report = store.getUsageReport(NOW + 2_000);
  assert.equal(quota.questionsUsedTotal, 1);
  assert.equal(quota.diagramsUsedTotal, 1);
  assert.equal(report.activeReservations, 0);
  assert.equal(report.estimatedMicrodollarsToday, 180_000);
  assert.equal(report.unreconciledUsageEvents, 1);
});


test("stale reservations retain quota and charge their full allowance", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  store.reservePaidRequest(
    reservation("r-stale", { expiresAtMs: NOW + 1_000, reserveMicrodollars: 80_000 }),
  );
  const cleaned = store.cleanupStaleReservations(NOW + 2_000);
  assert.deepEqual(cleaned.settledReservationIds, ["r-stale"]);
  assert.equal(cleaned.chargedMicrodollars, 80_000);
  assert.equal(store.getUsageReport(NOW + 2_000).activeReservations, 0);
  assert.equal(store.getInvitation("invite-1")?.questionsUsedTotal, 1);
});

test("cooldown, subject RPM, hashed-IP and operational pause block safely", () => {
  const cooldownStore = new MemoryNativeOkfOperationalStore();
  cooldownStore.createInvitation(invitation());
  cooldownStore.reservePaidRequest(
    reservation("r-cooldown-1", {
      subjectLimits: { ...QUOTAS, cooldownSeconds: 5 },
    }),
  );
  const cooldown = cooldownStore.reservePaidRequest(
    reservation("r-cooldown-2", {
      nowMs: NOW + 1_000,
      subjectLimits: { ...QUOTAS, cooldownSeconds: 5 },
    }),
  );
  assert.equal(cooldown.allowed, false);
  if (!cooldown.allowed) assert.equal(cooldown.reason, "cooldown");

  const ipSubject = hashIpSubject("192.0.2.1", HMAC_SECRET);
  assert.equal(
    cooldownStore.checkAndRecordAbuseAttempt({
      ipSubject,
      nowMs: NOW,
      globalRequestsPerMinute: 10,
      ipRequestsPerHour: 1,
    }).allowed,
    true,
  );
  const ipBlocked = cooldownStore.checkAndRecordAbuseAttempt({
    ipSubject,
    nowMs: NOW + 1,
    globalRequestsPerMinute: 10,
    ipRequestsPerHour: 1,
  });
  assert.deepEqual(ipBlocked, {
    allowed: false,
    reason: "ip-hourly",
    retryAfterMs: 3_600_000,
  });
  assert.throws(() =>
    cooldownStore.checkAndRecordAbuseAttempt({
      ipSubject: "192.0.2.1",
      nowMs: NOW,
      globalRequestsPerMinute: 10,
      ipRequestsPerHour: 10,
    }),
  );

  cooldownStore.setOperationalPause(true, NOW);
  assert.deepEqual(cooldownStore.reservePaidRequest(reservation("r-paused")), {
    allowed: false,
    reason: "operational-pause",
  });
});

test("paid rate history is pruned to the active one-minute window", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  assert.equal(store.reservePaidRequest(reservation("r-rate-old")).allowed, true);
  assert.equal(
    store.releaseReservation({
      reservationId: "r-rate-old",
      releasedAtMs: NOW + 1,
      releaseQuota: true,
      outcomeCategory: "not-dispatched",
      errorCategory: null,
    }),
    true,
  );
  const nextNow = NOW + 60_001;
  assert.equal(
    store.reservePaidRequest(
      reservation("r-rate-current", {
        nowMs: nextNow,
        expiresAtMs: nextNow + 120_000,
      }),
    ).allowed,
    true,
  );
  const state = JSON.parse(store.exportDurableState()) as {
    paidRateEvents: Array<{ createdAtMs: number }>;
  };
  assert.deepEqual(state.paidRateEvents, [{ subjectId: "invite-1", createdAtMs: nextNow }]);
});

test("store initialization settles stale reservations conservatively", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.createInvitation(invitation());
  assert.equal(
    store.reservePaidRequest(
      reservation("r-startup-stale", {
        expiresAtMs: NOW + 1,
        reserveMicrodollars: 80_000,
      }),
    ).allowed,
    true,
  );
  assert.equal(store.getUsageReport(NOW).activeReservations, 1);
  assert.equal(initializeNativeOkfOperationalStore(store, NOW + 2), store);
  const report = store.getUsageReport(NOW + 2);
  assert.equal(report.activeReservations, 0);
  assert.equal(report.estimatedMicrodollarsToday, 80_000);
  assert.equal(report.unreconciledUsageEvents, 1);
});

test("runtime store is process-global across separately evaluated route bundles", async () => {
  const directory = mkdtempSync(join(tmpdir(), "native-okf-singleton-"));
  const databasePath = join(directory, "usage.sqlite");
  type StoreSingletonModule = typeof import("../server/access/store-singleton.ts");
  const firstModuleUrl = new URL(
    "../server/access/store-singleton.ts?route-bundle=chat",
    import.meta.url,
  );
  const secondModuleUrl = new URL(
    "../server/access/store-singleton.ts?route-bundle=admin",
    import.meta.url,
  );

  const firstModule = (await import(firstModuleUrl.href)) as StoreSingletonModule;
  const secondModule = (await import(secondModuleUrl.href)) as StoreSingletonModule;

  try {
    firstModule.clearNativeOkfOperationalStoreForTests();
    const first = firstModule.getNativeOkfOperationalStore({ usageDbPath: databasePath });
    const second = secondModule.getNativeOkfOperationalStore({
      usageDbPath: databasePath,
    });

    assert.equal(second, first);
    assert.throws(
      () =>
        secondModule.getNativeOkfOperationalStore({
          usageDbPath: join(directory, "another.sqlite"),
        }),
      /already initialized with another path/,
    );
  } finally {
    firstModule.clearNativeOkfOperationalStoreForTests();
    assert.equal(resolve(directory).startsWith(resolve(tmpdir())), true);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("SQLite adapter persists only privacy-bounded operational state", () => {
  const directory = mkdtempSync(join(tmpdir(), "native-okf-store-"));
  const absoluteDirectory = resolve(directory);
  assert.equal(absoluteDirectory.startsWith(resolve(tmpdir())), true);
  const databasePath = join(directory, "usage.sqlite");
  const plaintextCode = "plaintext-code-must-not-persist";
  const questionSentinel = "private researcher question must not persist";
  try {
    const first = new SqliteNativeOkfOperationalStore(databasePath);
    first.initialize();
    first.createInvitation(
      invitation({ codeHash: hashInvitationCode(plaintextCode, HMAC_SECRET) }),
    );
    first.setOperationalPause(true, NOW);
    first.recordAdminAudit({
      id: "audit-1",
      createdAtMs: NOW,
      action: "pause",
      targetInvitationId: null,
      outcomeCategory: "success",
    });
    first.close();

    const reopened = new SqliteNativeOkfOperationalStore(databasePath);
    reopened.initialize();
    assert.equal(reopened.getOperationalPause(), true);
    assert.equal(reopened.listInvitations(NOW).length, 1);
    assert.equal(reopened.listAdminAudit(10).length, 1);
    reopened.close();

    const databaseBytes = readFileSync(databasePath).toString("latin1");
    assert.equal(databaseBytes.includes(plaintextCode), false);
    assert.equal(databaseBytes.includes(questionSentinel), false);
    assert.equal(databaseBytes.includes("private researcher answer"), false);
  } finally {
    assert.equal(resolve(directory).startsWith(resolve(tmpdir())), true);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("reservation budget increases are atomic across competing active requests", () => {
  const store = new MemoryNativeOkfOperationalStore();
  store.initialize();
  store.createInvitation(invitation());

  const tightBudgets: ApplicationBudgetLimits = {
    dailyMicrodollars: 200_000,
    monthlyMicrodollars: 500_000,
    maxGlobalConcurrent: 3,
  };
  assert.equal(
    store.reservePaidRequest(
      reservation("budget-grow-1", {
        reserveMicrodollars: 80_000,
        applicationLimits: tightBudgets,
      }),
    ).allowed,
    true,
  );
  const firstIncrease = store.increaseReservationBudget({
    reservationId: "budget-grow-1",
    nowMs: NOW,
    requiredReservedMicrodollars: 150_000,
    applicationLimits: tightBudgets,
  });
  assert.equal(firstIncrease.allowed, true);
  if (!firstIncrease.allowed) {
    throw new Error("Expected the first budget increase to succeed.");
  }
  assert.equal(firstIncrease.reservation.reservedMicrodollars, 150_000);

  assert.equal(
    store.reservePaidRequest(
      reservation("budget-grow-2", {
        reserveMicrodollars: 40_000,
        applicationLimits: tightBudgets,
      }),
    ).allowed,
    true,
  );
  const blockedIncrease = store.increaseReservationBudget({
    reservationId: "budget-grow-1",
    nowMs: NOW,
    requiredReservedMicrodollars: 170_000,
    applicationLimits: tightBudgets,
  });
  assert.deepEqual(blockedIncrease, {
    allowed: false,
    reason: "daily-budget",
  });
  assert.equal(
    store.getActiveReservation("budget-grow-1")
      ?.reservedMicrodollars,
    150_000,
  );
});

