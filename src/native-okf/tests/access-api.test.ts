import "server-only";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  answerAuthorizedNativeOkfChat,
} from "../server/access/authorized-chat.ts";
import { NativeOkfAdminRateLimiter } from "../server/access/admin-rate-limit.ts";
import {
  handleAdminDashboardGet,
  handleAdminMutationPost,
  handleAdminSessionDelete,
  handleAdminSessionGet,
  handleAdminSessionPost,
} from "../server/access/admin-service.ts";
import {
  handleResearchAccessGet,
  handleResearchAccessDelete,
  handleResearchAccessPost,
} from "../server/access/access-service.ts";
import type { NativeOkfAccessConfig } from "../server/access/config.ts";
import { hashInvitationCode } from "../server/access/crypto.ts";
import { MemoryNativeOkfOperationalStore } from "../server/access/memory-store.ts";
import {
  NATIVE_OKF_ADMIN_COOKIE,
  NATIVE_OKF_RESEARCHER_COOKIE,
} from "../server/access/sessions.ts";
import type { CreateInvitationInput, QuotaLimits } from "../server/access/types.ts";
import type { RetrievalResult } from "../server/retrieval-types.ts";

const NOW = Date.UTC(2026, 6, 18, 12, 0, 0);
const ORIGIN = "https://native-okf.example";
const SESSION_SECRET = "researcher-session-secret-longer-than-thirty-two-bytes";
const INVITE_SECRET = "invitation-hash-secret-longer-than-thirty-two-bytes";
const ADMIN_SECRET = "administrator-session-secret-longer-than-thirty-two";
const TEST_CODE = "private-test-access-code";
const ADMIN_CODE = "private-administrator-code";
const INVITE_CODE = "private-invitation-code";

const QUOTAS: QuotaLimits = {
  dailyQuestions: 12,
  dailyDiagrams: 3,
  totalQuestions: 25,
  totalDiagrams: 8,
  requestsPerMinute: 20,
  cooldownSeconds: 0,
  maxConcurrent: 2,
};

function config(
  overrides: Partial<NativeOkfAccessConfig> = {},
): NativeOkfAccessConfig {
  return {
    chatEnabled: true,
    accessMode: "test",
    durableStoreRequired: false,
    usageDbPath: "runtime/test-native-okf-usage.sqlite",
    sessionSecret: SESSION_SECRET,
    inviteHashSecret: INVITE_SECRET,
    testAccessCode: TEST_CODE,
    adminAccessCode: ADMIN_CODE,
    adminSessionSecret: ADMIN_SECRET,
    adminConfigured: true,
    trustedProxy: { trustProxy: false },
    publicOrigin: ORIGIN,
    testQuotas: { ...QUOTAS },
    inviteDefaultQuotas: { ...QUOTAS },
    applicationBudgets: {
      dailyMicrodollars: 3_000_000,
      monthlyMicrodollars: 20_000_000,
      maxGlobalConcurrent: 3,
    },
    globalRequestsPerMinute: 12,
    ipRequestsPerHour: 60,
    textRequestReserveMicrodollars: 80_000,
    diagramRequestReserveMicrodollars: 180_000,
    pricing: {
      inputMicrodollarsPerMillion: 1_000_000,
      cachedInputMicrodollarsPerMillion: 250_000,
      outputMicrodollarsPerMillion: 10_000_000,
    },
    inviteDefaultValidDays: 14,
    researcherSessionMaxAgeSeconds: 24 * 60 * 60,
    adminSessionMaxAgeSeconds: 30 * 60,
    reservationTtlMs: 120_000,
    adminMutationsPerMinute: 10,
    ...overrides,
  };
}

function store(): MemoryNativeOkfOperationalStore {
  const value = new MemoryNativeOkfOperationalStore();
  value.initialize();
  return value;
}

class UnavailableOperationalStore extends MemoryNativeOkfOperationalStore {
  override getOperationalPause(): boolean {
    throw new Error("Mock store unavailable.");
  }
}


function invitation(
  code: string,
  overrides: Partial<CreateInvitationInput> = {},
): CreateInvitationInput {
  return {
    id: "invite-1",
    codeHash: hashInvitationCode(code, INVITE_SECRET),
    label: "Research cohort A",
    createdAtMs: NOW - 1_000,
    expiresAtMs: NOW + 14 * 86_400_000,
    quotas: { ...QUOTAS },
    ...overrides,
  };
}

function jsonRequest(
  path: string,
  method: "POST" | "DELETE",
  body?: unknown,
  options: {
    cookie?: string;
    origin?: string;
    contentType?: string | null;
  } = {},
): Request {
  const headers = new Headers({
    origin: options.origin ?? ORIGIN,
    "sec-fetch-site": "same-origin",
  });
  const contentType =
    options.contentType === undefined ? "application/json" : options.contentType;
  if (contentType) {
    headers.set("content-type", contentType);
  }
  if (options.cookie) {
    headers.set("cookie", options.cookie);
  }
  return new Request(`${ORIGIN}${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function getRequest(path: string, cookie?: string): Request {
  return new Request(`${ORIGIN}${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

function cookiePair(response: Response, name: string): string {
  const header = response.headers.get("set-cookie");
  assert.ok(header, "Expected Set-Cookie.");
  const pair = header.split(";", 1)[0];
  assert.equal(pair.startsWith(`${name}=`), true);
  return pair;
}

async function responseBody<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

function assertSafeJsonHeaders(response: Response): void {
  assert.equal(
    response.headers.get("cache-control"),
    "no-store, max-age=0",
  );
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
}

function accessDependencies(
  currentConfig: NativeOkfAccessConfig,
  currentStore: MemoryNativeOkfOperationalStore,
  now: () => number = () => NOW,
  limiter = new NativeOkfAdminRateLimiter(),
) {
  return {
    config: currentConfig,
    store: currentStore,
    now,
    production: false,
    loginRateLimiter: limiter,
  };
}

function adminDependencies(
  currentConfig: NativeOkfAccessConfig,
  currentStore: MemoryNativeOkfOperationalStore,
  limiter = new NativeOkfAdminRateLimiter(),
  now: () => number = () => NOW,
) {
  return {
    config: currentConfig,
    store: currentStore,
    rateLimiter: limiter,
    now,
    production: true,
    modelLabel: "mock-model",
  };
}

test("research access defaults disabled and test login is generic, bounded and cookie based", async () => {
  const currentStore = store();
  const disabled = config({ chatEnabled: false, accessMode: "disabled" });
  const disabledGet = await handleResearchAccessGet(
    getRequest("/api/native-okf/access"),
    accessDependencies(disabled, currentStore),
  );
  assertSafeJsonHeaders(disabledGet);
  assert.deepEqual(await responseBody(disabledGet), {
    chatEnabled: false,
    accessMode: "disabled",
    authenticated: false,
    status: "disabled",
  });

  const currentConfig = config();
  const dependencies = accessDependencies(currentConfig, currentStore);
  const invalid = await handleResearchAccessPost(
    jsonRequest("/api/native-okf/access", "POST", { code: "incorrect-code" }),
    dependencies,
  );
  assert.equal(invalid.status, 401);
  assert.deepEqual(await responseBody(invalid), {
    error: "The access code could not be accepted.",
  });

  const overlong = await handleResearchAccessPost(
    jsonRequest("/api/native-okf/access", "POST", { code: "x".repeat(513) }),
    dependencies,
  );
  assert.equal(overlong.status, 401);

  const valid = await handleResearchAccessPost(
    jsonRequest("/api/native-okf/access", "POST", {
      code: `\u0000${TEST_CODE}\u0007`,
    }),
    dependencies,
  );
  assert.equal(valid.status, 200);
  const setCookie = valid.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Lax/);
  assert.equal(setCookie.includes(TEST_CODE), false);
  const cookie = cookiePair(valid, NATIVE_OKF_RESEARCHER_COOKIE);

  const status = await handleResearchAccessGet(
    getRequest("/api/native-okf/access", cookie),
    dependencies,
  );
  const payload = await responseBody<Record<string, unknown>>(status);
  assert.equal(payload.authenticated, true);
  assert.equal(payload.status, "authenticated");
  assert.equal(JSON.stringify(payload).includes(TEST_CODE), false);
  assert.equal(JSON.stringify(payload).includes("subjectId"), false);

  const logout = await handleResearchAccessDelete(
    jsonRequest(
      "/api/native-okf/access",
      "DELETE",
      undefined,
      { cookie, contentType: null },
    ),
    dependencies,
  );
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/);
  assert.equal((logout.headers.get("set-cookie") ?? "").includes(TEST_CODE), false);
});

test("access login enforces exact origin and a bounded opaque login bucket", async () => {
  const currentStore = store();
  const currentConfig = config({ globalRequestsPerMinute: 2 });
  const limiter = new NativeOkfAdminRateLimiter();
  const dependencies = accessDependencies(
    currentConfig,
    currentStore,
    () => NOW,
    limiter,
  );

  const crossOrigin = await handleResearchAccessPost(
    jsonRequest(
      "/api/native-okf/access",
      "POST",
      { code: TEST_CODE },
      { origin: "https://attacker.example" },
    ),
    dependencies,
  );
  assert.equal(crossOrigin.status, 403);

  for (let index = 0; index < 2; index += 1) {
    const response = await handleResearchAccessPost(
      jsonRequest("/api/native-okf/access", "POST", { code: "incorrect" }),
      dependencies,
    );
    assert.equal(response.status, 401);
  }
  const limited = await handleResearchAccessPost(
    jsonRequest("/api/native-okf/access", "POST", { code: "incorrect" }),
    dependencies,
  );
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.has("retry-after"), true);
});

test("invite login rejects invalid, expired and revoked codes and clamps session expiry", async () => {
  const currentStore = store();
  currentStore.createInvitation(
    invitation(INVITE_CODE, { expiresAtMs: NOW + 60 * 60 * 1_000 }),
  );
  currentStore.createInvitation(
    invitation("expired-code", {
      id: "invite-expired",
      createdAtMs: NOW - 2 * 86_400_000,
      expiresAtMs: NOW - 1,
    }),
  );
  currentStore.createInvitation(
    invitation("revoked-code", { id: "invite-revoked" }),
  );
  currentStore.revokeInvitation("invite-revoked", NOW - 1);

  const currentConfig = config({ accessMode: "invite" });
  const dependencies = accessDependencies(currentConfig, currentStore);

  for (const code of ["incorrect", "expired-code", "revoked-code"]) {
    const response = await handleResearchAccessPost(
      jsonRequest("/api/native-okf/access", "POST", { code }),
      dependencies,
    );
    assert.equal(response.status, 401);
    assert.deepEqual(await responseBody(response), {
      error: "The access code could not be accepted.",
    });
  }

  const valid = await handleResearchAccessPost(
    jsonRequest("/api/native-okf/access", "POST", { code: INVITE_CODE }),
    dependencies,
  );
  assert.equal(valid.status, 200);
  const payload = await responseBody<{
    quota: { accessExpiresAtMs: number };
  }>(valid.clone());
  assert.equal(payload.quota.accessExpiresAtMs, NOW + 60 * 60 * 1_000);
  assert.match(valid.headers.get("set-cookie") ?? "", /Max-Age=3600/);
});

test("research GET revalidates invite revocation, expiry and operational pause", async () => {
  const currentStore = store();
  currentStore.createInvitation(
    invitation(INVITE_CODE, { expiresAtMs: NOW + 2_000 }),
  );
  let clock = NOW;
  const currentConfig = config({ accessMode: "invite" });
  const dependencies = accessDependencies(
    currentConfig,
    currentStore,
    () => clock,
  );

  const login = await handleResearchAccessPost(
    jsonRequest("/api/native-okf/access", "POST", { code: INVITE_CODE }),
    dependencies,
  );
  const cookie = cookiePair(login, NATIVE_OKF_RESEARCHER_COOKIE);

  currentStore.revokeInvitation("invite-1", NOW + 1);
  const revoked = await handleResearchAccessGet(
    getRequest("/api/native-okf/access", cookie),
    dependencies,
  );
  assert.equal((await responseBody<{ status: string }>(revoked)).status, "revoked");

  const expiryStore = store();
  expiryStore.createInvitation(
    invitation(INVITE_CODE, { expiresAtMs: NOW + 2_000 }),
  );
  const expiryDependencies = accessDependencies(
    currentConfig,
    expiryStore,
    () => clock,
  );
  const expiryLogin = await handleResearchAccessPost(
    jsonRequest("/api/native-okf/access", "POST", { code: INVITE_CODE }),
    expiryDependencies,
  );
  const expiryCookie = cookiePair(expiryLogin, NATIVE_OKF_RESEARCHER_COOKIE);
  clock = NOW + 2_001;
  const expired = await handleResearchAccessGet(
    getRequest("/api/native-okf/access", expiryCookie),
    expiryDependencies,
  );
  assert.equal((await responseBody<{ status: string }>(expired)).status, "expired");

  const pauseStore = store();
  pauseStore.setOperationalPause(true, NOW);
  const paused = await handleResearchAccessGet(
    getRequest("/api/native-okf/access"),
    accessDependencies(config(), pauseStore),
  );
  assert.deepEqual(await responseBody(paused), {
    chatEnabled: false,
    accessMode: "test",
    authenticated: false,
    status: "disabled",
  });
  const pausedPost = await handleResearchAccessPost(
    jsonRequest("/api/native-okf/access", "POST", { code: TEST_CODE }),
    accessDependencies(config(), pauseStore),
  );
  assert.equal(pausedPost.status, 503);
});

test("research access POST cookie is accepted by the paid-chat authorization path", async () => {
  const currentStore = store();
  const currentConfig = config({
    testQuotas: { ...QUOTAS, requestsPerMinute: 100 },
    globalRequestsPerMinute: 100,
  });
  const access = await handleResearchAccessPost(
    jsonRequest("/api/native-okf/access", "POST", { code: TEST_CODE }),
    accessDependencies(currentConfig, currentStore),
  );
  const cookie = cookiePair(access, NATIVE_OKF_RESEARCHER_COOKIE);

  const retrieval = {
    noMatch: false,
    warnings: [],
    finalConcepts: [],
  } as unknown as RetrievalResult;
  const response = await answerAuthorizedNativeOkfChat(
    { question: "Explain the grounded fixture." },
    {
      config: currentConfig,
      getStore: () => currentStore,
      cookieHeader: cookie,
      ipSubject: "a".repeat(64),
      now: () => NOW,
      retrieve: async () => retrieval,
      answer: async () => ({
        answerMarkdown: "Grounded fixture answer.",
        sources: [],
        insufficientContext: false,
      }),
      loadOpenAiEnvironment: () =>
        ({
          model: "mock-model",
          moderationEnabled: false,
        }) as never,
      getOpenAiClient: () =>
        ({
          responses: { create: async () => assert.fail("No model call expected.") },
          moderations: { create: async () => assert.fail("No moderation call expected.") },
        }) as never,
      createReservationId: () => "reservation:access-api-integration",
    },
  );
  assert.equal(response.insufficientContext, false);
  assert.equal(response.quota?.questionsRemainingTotal, QUOTAS.totalQuestions);
});

test("admin authentication is independent, generic and production-cookie hardened", async () => {
  const currentStore = store();
  const currentConfig = config();
  const dependencies = adminDependencies(currentConfig, currentStore);

  const noSession = await handleAdminSessionGet(
    getRequest("/api/native-okf/admin/session"),
    dependencies,
  );
  assert.deepEqual(await responseBody(noSession), {
    authenticated: false,
    status: "required",
  });

  const invalid = await handleAdminSessionPost(
    jsonRequest("/api/native-okf/admin/session", "POST", { code: "incorrect" }),
    dependencies,
  );
  assert.equal(invalid.status, 401);

  const valid = await handleAdminSessionPost(
    jsonRequest("/api/native-okf/admin/session", "POST", { code: ADMIN_CODE }),
    dependencies,
  );
  assertSafeJsonHeaders(valid);
  assert.equal(valid.status, 200);
  const setCookie = valid.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /SameSite=Strict/);
  assert.match(setCookie, /Secure/);
  assert.equal(setCookie.includes(ADMIN_CODE), false);
  const adminCookie = cookiePair(valid, NATIVE_OKF_ADMIN_COOKIE);

  const authenticated = await handleAdminSessionGet(
    getRequest("/api/native-okf/admin/session", adminCookie),
    dependencies,
  );
  assert.equal(
    (await responseBody<{ authenticated: boolean }>(authenticated)).authenticated,
    true,
  );

  const researcherLogin = await handleResearchAccessPost(
    jsonRequest("/api/native-okf/access", "POST", { code: TEST_CODE }),
    accessDependencies(currentConfig, currentStore),
  );
  const researcherCookie = cookiePair(
    researcherLogin,
    NATIVE_OKF_RESEARCHER_COOKIE,
  );
  const independent = await handleAdminSessionGet(
    getRequest("/api/native-okf/admin/session", researcherCookie),
    dependencies,
  );
  assert.equal(
    (await responseBody<{ authenticated: boolean }>(independent)).authenticated,
    false,
  );

  const logout = await handleAdminSessionDelete(
    jsonRequest(
      "/api/native-okf/admin/session",
      "DELETE",
      undefined,
      { cookie: adminCookie, contentType: null },
    ),
    dependencies,
  );
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/);
});

async function authenticatedAdmin(
  currentConfig: NativeOkfAccessConfig,
  currentStore: MemoryNativeOkfOperationalStore,
  limiter = new NativeOkfAdminRateLimiter(),
) {
  const dependencies = adminDependencies(currentConfig, currentStore, limiter);
  const login = await handleAdminSessionPost(
    jsonRequest("/api/native-okf/admin/session", "POST", { code: ADMIN_CODE }),
    dependencies,
  );
  return {
    dependencies,
    cookie: cookiePair(login, NATIVE_OKF_ADMIN_COOKIE),
  };
}

test("admin dashboard returns only the exact safe aggregate snapshot", async () => {
  const currentStore = store();
  currentStore.createInvitation(invitation(INVITE_CODE));
  const currentConfig = config({ accessMode: "invite" });
  const { dependencies, cookie } = await authenticatedAdmin(
    currentConfig,
    currentStore,
  );

  const response = await handleAdminDashboardGet(
    getRequest("/api/native-okf/admin/dashboard", cookie),
    dependencies,
  );
  assert.equal(response.status, 200);
  const payload = await responseBody<Record<string, unknown>>(response);
  assert.equal(payload.chatEnabled, true);
  assert.equal(payload.accessMode, "invite");
  assert.equal(payload.modelLabel, "mock-model");
  assert.equal(payload.dailyBudgetMicrodollars, 3_000_000);
  assert.equal(Array.isArray(payload.invitations), true);

  const serialized = JSON.stringify(payload);
  for (const forbidden of [
    "codeHash",
    INVITE_CODE,
    ADMIN_CODE,
    "promptText",
    "answerText",
    "retrievedContext",
    "ipAddress",
    "cookieValue",
    "apiKey",
    "organization",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("admin mutations require independent auth and exact same-origin JSON", async () => {
  const currentStore = store();
  currentStore.createInvitation(invitation(INVITE_CODE));
  const currentConfig = config({ accessMode: "invite" });
  const limiter = new NativeOkfAdminRateLimiter();
  const { dependencies, cookie } = await authenticatedAdmin(
    currentConfig,
    currentStore,
    limiter,
  );

  const unauthorized = await handleAdminMutationPost(
    jsonRequest("/api/native-okf/admin/mutations", "POST", { action: "pause" }),
    adminDependencies(currentConfig, currentStore, limiter),
  );
  assert.equal(unauthorized.status, 401);

  const crossOrigin = await handleAdminMutationPost(
    jsonRequest(
      "/api/native-okf/admin/mutations",
      "POST",
      { action: "pause" },
      { cookie, origin: "https://attacker.example" },
    ),
    dependencies,
  );
  assert.equal(crossOrigin.status, 403);

  const wrongType = await handleAdminMutationPost(
    jsonRequest(
      "/api/native-okf/admin/mutations",
      "POST",
      { action: "pause" },
      { cookie, contentType: "text/plain" },
    ),
    dependencies,
  );
  assert.equal(wrongType.status, 403);

  const pause = await handleAdminMutationPost(
    jsonRequest(
      "/api/native-okf/admin/mutations",
      "POST",
      { action: "pause" },
      { cookie },
    ),
    dependencies,
  );
  assert.equal(pause.status, 200);
  assert.equal(currentStore.getOperationalPause(), true);

  const resume = await handleAdminMutationPost(
    jsonRequest(
      "/api/native-okf/admin/mutations",
      "POST",
      { action: "resume" },
      { cookie },
    ),
    dependencies,
  );
  assert.equal(resume.status, 200);
  assert.equal(currentStore.getOperationalPause(), false);

  const previousExpiry = currentStore.getInvitation("invite-1")?.expiresAtMs ?? 0;
  const extend = await handleAdminMutationPost(
    jsonRequest(
      "/api/native-okf/admin/mutations",
      "POST",
      { action: "extend", invitationId: "invite-1", days: 7 },
      { cookie },
    ),
    dependencies,
  );
  assert.equal(extend.status, 200);
  assert.equal(
    currentStore.getInvitation("invite-1")?.expiresAtMs,
    previousExpiry + 7 * 86_400_000,
  );

  const adjust = await handleAdminMutationPost(
    jsonRequest(
      "/api/native-okf/admin/mutations",
      "POST",
      {
        action: "adjust",
        invitationId: "invite-1",
        patch: {
          dailyQuestions: 15,
          totalQuestions: 30,
          label: "Adjusted cohort",
        },
      },
      { cookie },
    ),
    dependencies,
  );
  assert.equal(adjust.status, 200);
  assert.equal(currentStore.getInvitation("invite-1")?.quotas.dailyQuestions, 15);
  assert.equal(currentStore.getInvitation("invite-1")?.label, "Adjusted cohort");

  const rawIpLabel = await handleAdminMutationPost(
    jsonRequest(
      "/api/native-okf/admin/mutations",
      "POST",
      {
        action: "adjust",
        invitationId: "invite-1",
        patch: { label: "192.168.10.25" },
      },
      { cookie },
    ),
    dependencies,
  );
  assert.equal(rawIpLabel.status, 400);
  assert.equal(currentStore.getInvitation("invite-1")?.label, "Adjusted cohort");

  const revoke = await handleAdminMutationPost(
    jsonRequest(
      "/api/native-okf/admin/mutations",
      "POST",
      { action: "revoke", invitationId: "invite-1" },
      { cookie },
    ),
    dependencies,
  );
  assert.equal(revoke.status, 200);
  assert.equal(currentStore.listInvitations(NOW)[0].status, "revoked");
  assert.equal(
    currentStore.listAdminAudit(20).some((audit) => audit.outcomeCategory === "success"),
    true,
  );
});

test("admin mutation and login rates are bounded without exposing credentials", async () => {
  const currentStore = store();
  const currentConfig = config({ adminMutationsPerMinute: 2 });
  const loginLimiter = new NativeOkfAdminRateLimiter();
  const loginDependencies = adminDependencies(
    currentConfig,
    currentStore,
    loginLimiter,
  );

  for (let index = 0; index < 2; index += 1) {
    const response = await handleAdminSessionPost(
      jsonRequest("/api/native-okf/admin/session", "POST", { code: "incorrect" }),
      loginDependencies,
    );
    assert.equal(response.status, 401);
  }
  const loginLimited = await handleAdminSessionPost(
    jsonRequest("/api/native-okf/admin/session", "POST", { code: "incorrect" }),
    loginDependencies,
  );
  assert.equal(loginLimited.status, 429);

  const anonymousStore = store();
  const anonymousLimiter = new NativeOkfAdminRateLimiter();
  const anonymousDependencies = adminDependencies(
    currentConfig,
    anonymousStore,
    anonymousLimiter,
  );
  for (let index = 0; index < 2; index += 1) {
    const response = await handleAdminMutationPost(
      jsonRequest("/api/native-okf/admin/mutations", "POST", {
        action: "pause",
      }),
      anonymousDependencies,
    );
    assert.equal(response.status, 401);
  }
  const anonymousLimited = await handleAdminMutationPost(
    jsonRequest("/api/native-okf/admin/mutations", "POST", {
      action: "pause",
    }),
    anonymousDependencies,
  );
  assert.equal(anonymousLimited.status, 429);
  assert.equal(anonymousStore.listAdminAudit(20).length, 2);

  const mutationLimiter = new NativeOkfAdminRateLimiter();
  const { dependencies, cookie } = await authenticatedAdmin(
    currentConfig,
    currentStore,
    mutationLimiter,
  );
  for (let index = 0; index < 2; index += 1) {
    const response = await handleAdminMutationPost(
      jsonRequest(
        "/api/native-okf/admin/mutations",
        "POST",
        { action: index === 0 ? "pause" : "resume" },
        { cookie },
      ),
      dependencies,
    );
    assert.equal(response.status, 200);
  }
  const limited = await handleAdminMutationPost(
    jsonRequest(
      "/api/native-okf/admin/mutations",
      "POST",
      { action: "pause" },
      { cookie },
    ),
    dependencies,
  );
  assert.equal(limited.status, 429);
  const serialized = JSON.stringify(await responseBody(limited));
  assert.equal(serialized.includes(ADMIN_CODE), false);
  assert.equal(serialized.includes("codeHash"), false);
});


test("research access fails closed when durable operational state is unavailable", async () => {
  const currentStore = new UnavailableOperationalStore();
  currentStore.initialize();
  const dependencies = accessDependencies(config(), currentStore);

  const getResponse = await handleResearchAccessGet(
    getRequest("/api/native-okf/access"),
    dependencies,
  );
  assert.equal(getResponse.status, 503);
  assert.deepEqual(await responseBody(getResponse), {
    error: "Research access is currently unavailable.",
  });

  const postResponse = await handleResearchAccessPost(
    jsonRequest("/api/native-okf/access", "POST", { code: TEST_CODE }),
    dependencies,
  );
  assert.equal(postResponse.status, 503);
});

test("private admin page verifies the independent server cookie before rendering", () => {
  const source = readFileSync("app/native-okf/admin/page.tsx", "utf8");
  const verification = source.indexOf("verifyAdminSessionCookie(");
  const dashboard = source.indexOf("<AdminDashboard");
  assert.equal(source.includes("await cookies()"), true);
  assert.equal(source.includes("redirect(\"/native-okf/admin/access\")"), true);
  assert.equal(verification >= 0 && dashboard > verification, true);
});
