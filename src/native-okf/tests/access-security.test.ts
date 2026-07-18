import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import { NativeOkfAdminRateLimiter } from "../server/access/admin-rate-limit.ts";
import { createNativeOkfIpSubject } from "../server/access/client-ip.ts";
import {
  NativeOkfAccessConfigurationError,
  parseNativeOkfAccessConfig,
} from "../server/access/config.ts";
import {
  assertNativeOkfSameOriginMutation,
  NativeOkfSameOriginError,
  verifyNativeOkfSameOriginMutation,
} from "../server/access/same-origin.ts";
import {
  clearAdminSessionCookie,
  clearResearcherSessionCookie,
  issueAdminSession,
  issueResearcherSession,
  NATIVE_OKF_ADMIN_COOKIE,
  NATIVE_OKF_RESEARCHER_COOKIE,
  readCookieValue,
  serializeAdminSessionCookie,
  serializeResearcherSessionCookie,
  verifyAdminSessionCookie,
  verifyAdminSessionToken,
  verifyResearcherSessionCookie,
  verifyResearcherSessionToken,
} from "../server/access/sessions.ts";

const NOW = Date.UTC(2026, 6, 18, 12, 0, 0);
const RESEARCHER_SECRET = "researcher-session-secret-with-more-than-32-bytes";
const ADMIN_SECRET = "independent-admin-session-secret-over-32-bytes";
const IP_HASH_SECRET = "private-ip-hash-secret-with-more-than-32-bytes";

function activePaidEnvironment(
  overrides: Record<string, string> = {},
): Record<string, string> {
  return {
    NATIVE_OKF_CHAT_ENABLED: "true",
    NATIVE_OKF_ACCESS_MODE: "invite",
    NATIVE_OKF_SESSION_SECRET: RESEARCHER_SECRET,
    NATIVE_OKF_INVITE_HASH_SECRET: IP_HASH_SECRET,
    NATIVE_OKF_PUBLIC_ORIGIN: "https://native-okf.example",
    OPENAI_INPUT_USD_PER_MILLION: "1.25",
    OPENAI_CACHED_INPUT_USD_PER_MILLION: "0.25",
    OPENAI_OUTPUT_USD_PER_MILLION: "10.00",
    ...overrides,
  };
}

test("active access reserves and production origin fail closed", () => {
  assert.throws(
    () =>
      parseNativeOkfAccessConfig(
        activePaidEnvironment({
          NATIVE_OKF_TEXT_REQUEST_RESERVE_USD: "0",
        }),
      ),
    NativeOkfAccessConfigurationError,
  );
  assert.throws(
    () =>
      parseNativeOkfAccessConfig(
        activePaidEnvironment({
          NATIVE_OKF_TEXT_REQUEST_RESERVE_USD: "0.08",
          NATIVE_OKF_DIAGRAM_REQUEST_RESERVE_USD: "0.01",
        }),
      ),
    NativeOkfAccessConfigurationError,
  );
  assert.throws(
    () =>
      parseNativeOkfAccessConfig(
        activePaidEnvironment({
          NODE_ENV: "production",
          NATIVE_OKF_PUBLIC_ORIGIN: "http://native-okf.example",
        }),
      ),
    NativeOkfAccessConfigurationError,
  );
  assert.equal(
    parseNativeOkfAccessConfig(
      activePaidEnvironment({
        NODE_ENV: "development",
        NATIVE_OKF_PUBLIC_ORIGIN: "http://localhost:3000",
      }),
    ).publicOrigin,
    "http://localhost:3000",
  );
  assert.throws(
    () =>
      parseNativeOkfAccessConfig({
        NODE_ENV: "production",
        NATIVE_OKF_CHAT_ENABLED: "false",
        NATIVE_OKF_ACCESS_MODE: "disabled",
        NATIVE_OKF_ADMIN_ACCESS_CODE: "private-admin-code",
        NATIVE_OKF_ADMIN_SESSION_SECRET: ADMIN_SECRET,
        NATIVE_OKF_PUBLIC_ORIGIN: "http://native-okf.example",
      }),
    NativeOkfAccessConfigurationError,
  );
});

test("administrator rate limiter prunes stale subject buckets", () => {
  const limiter = new NativeOkfAdminRateLimiter();
  assert.deepEqual(limiter.consume("stale-a", NOW, 1), { allowed: true });
  assert.deepEqual(limiter.consume("stale-b", NOW, 1), { allowed: true });
  assert.deepEqual(limiter.consume("stale-c", NOW, 1), { allowed: true });
  assert.equal(limiter.trackedSubjectCountForTests(), 3);

  assert.deepEqual(limiter.consume("fresh", NOW + 60_001, 1), {
    allowed: true,
  });
  assert.equal(limiter.trackedSubjectCountForTests(), 1);
  assert.deepEqual(limiter.consume("stale-a", NOW + 60_001, 1), {
    allowed: true,
  });
});

test("researcher sessions contain only a subject ID and bounded expiry", () => {
  const accessExpiresAtMs = NOW + 60 * 60 * 1_000;
  const session = issueResearcherSession({
    subjectId: "invite:01J4SAFE",
    accessExpiresAtMs,
    secret: RESEARCHER_SECRET,
    nowMs: NOW,
    maxAgeSeconds: 2 * 60 * 60,
  });

  assert.equal(session.payload.expiresAtMs, accessExpiresAtMs);
  const encodedPayload = session.token.split(".")[0];
  const decoded = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8"),
  ) as Record<string, unknown>;
  assert.deepEqual(Object.keys(decoded).sort(), ["expiresAtMs", "subjectId"]);
  assert.equal(decoded.subjectId, "invite:01J4SAFE");
  assert.equal(JSON.stringify(decoded).includes("code"), false);
  assert.equal(JSON.stringify(decoded).includes("quota"), false);
});

test("researcher session expiry never exceeds access expiry", () => {
  const session = issueResearcherSession({
    subjectId: "test:private",
    accessExpiresAtMs: NOW + 30 * 24 * 60 * 60 * 1_000,
    secret: RESEARCHER_SECRET,
    nowMs: NOW,
  });
  assert.equal(session.payload.expiresAtMs, NOW + 14 * 24 * 60 * 60 * 1_000);
});

test("signed sessions reject tampering and expiry", () => {
  const session = issueResearcherSession({
    subjectId: "invite:valid",
    accessExpiresAtMs: NOW + 60_000,
    secret: RESEARCHER_SECRET,
    nowMs: NOW,
  });
  assert.deepEqual(
    verifyResearcherSessionToken(session.token, RESEARCHER_SECRET, NOW),
    { valid: true, payload: session.payload },
  );

  const [payload, signature] = session.token.split(".");
  const tamperedPayload = `${payload[0] === "A" ? "B" : "A"}${payload.slice(1)}`;
  assert.equal(
    verifyResearcherSessionToken(
      `${tamperedPayload}.${signature}`,
      RESEARCHER_SECRET,
      NOW,
    ).valid,
    false,
  );
  assert.deepEqual(
    verifyResearcherSessionToken(session.token, RESEARCHER_SECRET, NOW + 60_000),
    { valid: false, reason: "expired" },
  );
});

test("admin sessions are independently signed and short lived", () => {
  const admin = issueAdminSession({ secret: ADMIN_SECRET, nowMs: NOW });
  assert.equal(admin.payload.expiresAtMs, NOW + 30 * 60 * 1_000);
  assert.equal(
    verifyAdminSessionToken(admin.token, ADMIN_SECRET, NOW).valid,
    true,
  );
  assert.equal(
    verifyResearcherSessionToken(admin.token, ADMIN_SECRET, NOW).valid,
    false,
  );
  assert.equal(
    verifyAdminSessionToken(admin.token, RESEARCHER_SECRET, NOW).valid,
    false,
  );
});

test("researcher and admin cookies have separate secure attributes", () => {
  const researcher = issueResearcherSession({
    subjectId: "invite:cookie",
    accessExpiresAtMs: NOW + 60_000,
    secret: RESEARCHER_SECRET,
    nowMs: NOW,
  });
  const admin = issueAdminSession({ secret: ADMIN_SECRET, nowMs: NOW });
  const researcherCookie = serializeResearcherSessionCookie(researcher, {
    production: true,
    nowMs: NOW,
  });
  const adminCookie = serializeAdminSessionCookie(admin, {
    production: true,
    nowMs: NOW,
  });

  assert.match(researcherCookie, new RegExp(`^${NATIVE_OKF_RESEARCHER_COOKIE}=`));
  assert.match(researcherCookie, /; HttpOnly;/);
  assert.match(researcherCookie, /; SameSite=Lax;/);
  assert.match(researcherCookie, /; Secure$/);
  assert.match(adminCookie, new RegExp(`^${NATIVE_OKF_ADMIN_COOKIE}=`));
  assert.match(adminCookie, /; HttpOnly;/);
  assert.match(adminCookie, /; SameSite=Strict;/);
  assert.match(adminCookie, /; Secure$/);
  assert.equal(researcherCookie.includes("invite:cookie"), false);
});

test("cookie readers reject duplicates and cookie verification is explicit", () => {
  const session = issueResearcherSession({
    subjectId: "invite:cookie-read",
    accessExpiresAtMs: NOW + 60_000,
    secret: RESEARCHER_SECRET,
    nowMs: NOW,
  });
  const header = `unrelated=1; ${NATIVE_OKF_RESEARCHER_COOKIE}=${session.token}`;
  assert.equal(readCookieValue(header, NATIVE_OKF_RESEARCHER_COOKIE), session.token);
  assert.equal(
    verifyResearcherSessionCookie(header, RESEARCHER_SECRET, NOW).valid,
    true,
  );
  assert.equal(
    verifyResearcherSessionCookie(
      `${header}; ${NATIVE_OKF_RESEARCHER_COOKIE}=${session.token}`,
      RESEARCHER_SECRET,
      NOW,
    ).valid,
    false,
  );

  const admin = issueAdminSession({ secret: ADMIN_SECRET, nowMs: NOW });
  assert.equal(
    verifyAdminSessionCookie(
      `${NATIVE_OKF_ADMIN_COOKIE}=${admin.token}`,
      ADMIN_SECRET,
      NOW,
    ).valid,
    true,
  );
});

test("clearing cookies preserves server-only security attributes", () => {
  assert.match(clearResearcherSessionCookie(true), /HttpOnly; SameSite=Lax;/);
  assert.match(clearResearcherSessionCookie(true), /Max-Age=0/);
  assert.match(clearResearcherSessionCookie(true), /Secure$/);
  assert.match(clearAdminSessionCookie(true), /HttpOnly; SameSite=Strict;/);
});

test("short session secrets fail closed", () => {
  assert.throws(
    () =>
      issueResearcherSession({
        subjectId: "test:short",
        accessExpiresAtMs: NOW + 60_000,
        secret: "short",
        nowMs: NOW,
      }),
    /at least 32 bytes/,
  );
});

test("proxy headers are ignored unless explicitly trusted", () => {
  const direct = createNativeOkfIpSubject(
    {
      headers: { "x-forwarded-for": "203.0.113.99" },
      directAddress: "198.51.100.10",
    },
    { trustProxy: false },
    IP_HASH_SECRET,
  );
  const sameDirect = createNativeOkfIpSubject(
    { headers: {}, directAddress: "198.51.100.10" },
    { trustProxy: false },
    IP_HASH_SECRET,
  );
  assert.equal(direct.source, "direct");
  assert.equal(direct.ipSubject, sameDirect.ipSubject);
  assert.equal(JSON.stringify(direct).includes("198.51.100.10"), false);
  assert.equal(JSON.stringify(direct).includes("203.0.113.99"), false);
});

test("trusted proxy resolution uses the configured header and hop count", () => {
  const trusted = createNativeOkfIpSubject(
    {
      headers: {
        "x-forwarded-for": "198.18.0.1, 203.0.113.77",
        "x-real-ip": "192.0.2.9",
      },
      directAddress: "10.0.0.5",
    },
    { trustProxy: true, header: "x-forwarded-for", trustedHops: 1 },
    IP_HASH_SECRET,
  );
  const expected = createNativeOkfIpSubject(
    { headers: {}, directAddress: "203.0.113.77" },
    { trustProxy: false },
    IP_HASH_SECRET,
  );
  assert.equal(trusted.source, "trusted-proxy");
  assert.equal(trusted.ipSubject, expected.ipSubject);
});

test("invalid proxy chains fail to an opaque conservative subject", () => {
  const invalid = createNativeOkfIpSubject(
    { headers: { "x-forwarded-for": "not-an-ip" } },
    { trustProxy: true, header: "x-forwarded-for", trustedHops: 1 },
    IP_HASH_SECRET,
  );
  const missing = createNativeOkfIpSubject(
    { headers: {} },
    { trustProxy: false },
    IP_HASH_SECRET,
  );
  assert.equal(invalid.source, "unresolved");
  assert.equal(invalid.ipSubject, missing.ipSubject);
  assert.match(invalid.ipSubject, /^[a-f0-9]{64}$/);
});

test("IP HMAC rejects weak secrets and domain-separates stored subjects", () => {
  assert.throws(
    () =>
      createNativeOkfIpSubject(
        { headers: {}, directAddress: "127.0.0.1" },
        { trustProxy: false },
        "short",
      ),
    /at least 32 bytes/,
  );
  const first = createNativeOkfIpSubject(
    { headers: {}, directAddress: "127.0.0.1" },
    { trustProxy: false },
    IP_HASH_SECRET,
  );
  const second = createNativeOkfIpSubject(
    { headers: {}, directAddress: "127.0.0.1" },
    { trustProxy: false },
    `${IP_HASH_SECRET}-different`,
  );
  assert.notEqual(first.ipSubject, second.ipSubject);
});

const SAME_ORIGIN_REQUEST = {
  method: "POST",
  expectedOrigin: "https://native-okf.example",
  headers: {
    origin: "https://native-okf.example",
    "content-type": "application/json; charset=utf-8",
    "sec-fetch-site": "same-origin",
  },
} as const;

test("strict same-origin mutation validation accepts valid JSON requests", () => {
  assert.deepEqual(verifyNativeOkfSameOriginMutation(SAME_ORIGIN_REQUEST), {
    allowed: true,
  });
  assert.doesNotThrow(() =>
    assertNativeOkfSameOriginMutation(SAME_ORIGIN_REQUEST),
  );
});

test("strict same-origin mutation validation rejects missing or foreign origins", () => {
  assert.deepEqual(
    verifyNativeOkfSameOriginMutation({
      ...SAME_ORIGIN_REQUEST,
      headers: { "content-type": "application/json" },
    }),
    { allowed: false, reason: "missing-origin" },
  );
  assert.deepEqual(
    verifyNativeOkfSameOriginMutation({
      ...SAME_ORIGIN_REQUEST,
      headers: {
        ...SAME_ORIGIN_REQUEST.headers,
        origin: "https://attacker.example",
      },
    }),
    { allowed: false, reason: "origin-mismatch" },
  );
});

test("strict same-origin mutation validation rejects cross-site fetch metadata", () => {
  assert.deepEqual(
    verifyNativeOkfSameOriginMutation({
      ...SAME_ORIGIN_REQUEST,
      headers: {
        ...SAME_ORIGIN_REQUEST.headers,
        "sec-fetch-site": "cross-site",
      },
    }),
    { allowed: false, reason: "cross-site-fetch" },
  );
});

test("strict same-origin mutation validation rejects simple form content", () => {
  assert.deepEqual(
    verifyNativeOkfSameOriginMutation({
      ...SAME_ORIGIN_REQUEST,
      headers: {
        ...SAME_ORIGIN_REQUEST.headers,
        "content-type": "application/x-www-form-urlencoded",
      },
    }),
    { allowed: false, reason: "unsupported-content-type" },
  );
});

test("same-origin assertion exposes only a generic authorization error", () => {
  assert.throws(
    () =>
      assertNativeOkfSameOriginMutation({
        ...SAME_ORIGIN_REQUEST,
        headers: {
          ...SAME_ORIGIN_REQUEST.headers,
          origin: "null",
        },
      }),
    (error: unknown) =>
      error instanceof NativeOkfSameOriginError &&
      error.status === 403 &&
      !error.message.includes("origin"),
  );
});
