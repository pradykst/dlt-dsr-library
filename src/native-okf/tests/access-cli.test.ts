import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import {
  executeNativeOkfAccessAdmin,
  parseNativeOkfAccessAdminArgs,
  type NativeOkfAccessAdminDependencies,
} from "../../../scripts/native-okf-access-admin.ts";
import { parseNativeOkfAccessConfig } from "../server/access/config.ts";
import { hashInvitationCode } from "../server/access/crypto.ts";
import { MemoryNativeOkfOperationalStore } from "../server/access/memory-store.ts";

const NOW = Date.UTC(2026, 6, 18, 12, 0, 0);
const HASH_SECRET = "invite-hash-secret-".padEnd(32, "x");
const FIXED_CODE = Buffer.alloc(24, 7).toString("base64url");

function fixture(): {
  dependencies: NativeOkfAccessAdminDependencies;
  store: MemoryNativeOkfOperationalStore;
  output: string[];
  setNow: (value: number) => void;
} {
  const store = new MemoryNativeOkfOperationalStore();
  const output: string[] = [];
  let now = NOW;
  let idCounter = 0;
  const config = parseNativeOkfAccessConfig({
    NATIVE_OKF_INVITE_HASH_SECRET: HASH_SECRET,
  });
  return {
    store,
    output,
    setNow: (value) => {
      now = value;
    },
    dependencies: {
      config,
      store,
      nowMs: () => now,
      randomCode: () => FIXED_CODE,
      randomId: () => {
        idCounter += 1;
        return idCounter === 1 ? "invite-1" : `audit-${idCounter - 1}`;
      },
      output: (text) => output.push(text),
    },
  };
}

test("CLI parser validates command-specific options", () => {
  assert.deepEqual(
    parseNativeOkfAccessAdminArgs([
      "create",
      "--label",
      "Cohort A",
      "--valid-days",
      "7",
      "--daily-questions",
      "4",
    ]),
    {
      kind: "create",
      options: {
        label: "Cohort A",
        validDays: 7,
        dailyQuestions: 4,
        dailyDiagrams: undefined,
        totalQuestions: undefined,
        totalDiagrams: undefined,
        requestsPerMinute: undefined,
        cooldownSeconds: undefined,
        maxConcurrent: undefined,
      },
    },
  );
  assert.deepEqual(parseNativeOkfAccessAdminArgs(["usage", "--json"]), {
    kind: "usage",
    json: true,
  });
  assert.throws(() => parseNativeOkfAccessAdminArgs(["create"]));
  assert.throws(() =>
    parseNativeOkfAccessAdminArgs(["update", "--id", "invite-1"]),
  );
  assert.throws(() => parseNativeOkfAccessAdminArgs(["pause", "--json"]));
  assert.throws(() => parseNativeOkfAccessAdminArgs(["unknown"]));
  for (const unsafeLabel of [
    "researcher@example.test",
    "https://example.test/cohort",
    "192.168.10.25",
    "2001:db8::1",
  ]) {
    assert.throws(() =>
      parseNativeOkfAccessAdminArgs([
        "create",
        "--label",
        unsafeLabel,
      ]),
    );
  }
});

test("create prints the high-entropy code exactly once and persists only its HMAC", () => {
  const { dependencies, store, output } = fixture();
  executeNativeOkfAccessAdmin(
    parseNativeOkfAccessAdminArgs([
      "create",
      "--label",
      "Research cohort",
      "--valid-days",
      "10",
    ]),
    dependencies,
  );
  const printed = output.join("");
  assert.equal(printed.split(FIXED_CODE).length - 1, 1);
  assert.equal(printed.includes("hash"), false);
  const invitation = store.getInvitation("invite-1");
  assert.ok(invitation);
  assert.equal(invitation.codeHash, hashInvitationCode(FIXED_CODE, HASH_SECRET));
  assert.notEqual(invitation.codeHash, FIXED_CODE);
  assert.equal(JSON.stringify(store.exportDurableState()).includes(FIXED_CODE), false);
});

test("list reports safe administrative metadata without code or hash", () => {
  const { dependencies, output } = fixture();
  executeNativeOkfAccessAdmin(
    parseNativeOkfAccessAdminArgs(["create", "--label", "Research cohort"]),
    dependencies,
  );
  output.length = 0;
  executeNativeOkfAccessAdmin({ kind: "list" }, dependencies);
  const printed = output.join("");
  assert.match(printed, /invite-1 \| Research cohort \| active/);
  assert.equal(printed.includes(FIXED_CODE), false);
  assert.equal(printed.includes(hashInvitationCode(FIXED_CODE, HASH_SECRET)), false);
});

test("update extends expiry and derives total quotas from used plus remaining", () => {
  const { dependencies, store, output, setNow } = fixture();
  executeNativeOkfAccessAdmin(
    parseNativeOkfAccessAdminArgs(["create", "--label", "Initial"]),
    dependencies,
  );
  const invitation = store.getInvitation("invite-1");
  assert.ok(invitation);
  const reservation = store.reservePaidRequest({
    reservationId: "paid-1",
    subjectId: invitation.id,
    subjectKind: "invite",
    invitationId: invitation.id,
    nowMs: NOW + 1,
    expiresAtMs: NOW + 60_000,
    includeDiagram: false,
    reserveMicrodollars: 1,
    subjectLimits: { ...invitation.quotas, cooldownSeconds: 0 },
    applicationLimits: {
      dailyMicrodollars: 1_000_000,
      monthlyMicrodollars: 2_000_000,
      maxGlobalConcurrent: 3,
    },
    accessExpiresAtMs: invitation.expiresAtMs,
  });
  assert.equal(reservation.allowed, true);
  store.reconcileReservation({
    reservationId: "paid-1",
    completedAtMs: NOW + 2,
    usage: {
      inputTokens: 1,
      cachedInputTokens: 0,
      outputTokens: 1,
      modelCalls: 1,
    },
    diagramModelCalls: 0,
    actualMicrodollars: 1,
    usageUnreconciled: false,
    latencyMs: 1,
    outcomeCategory: "complete",
    errorCategory: null,
  });
  setNow(NOW + 3);
  output.length = 0;
  executeNativeOkfAccessAdmin(
    parseNativeOkfAccessAdminArgs([
      "update",
      "--id",
      "invite-1",
      "--label",
      "Extended",
      "--extend-days",
      "2",
      "--remaining-questions",
      "2",
      "--remaining-diagrams",
      "1",
    ]),
    dependencies,
  );
  const updated = store.getInvitation("invite-1");
  assert.equal(updated?.label, "Extended");
  assert.equal(updated?.questionsUsedTotal, 1);
  assert.equal(updated?.quotas.totalQuestions, 3);
  assert.equal(updated?.quotas.totalDiagrams, 1);
  assert.equal(updated?.expiresAtMs, invitation.expiresAtMs + 2 * 86_400_000);
  assert.equal(output.join("").includes(FIXED_CODE), false);
});

test("extending an expired invitation starts from the current time", () => {
  const { dependencies, store, setNow } = fixture();
  executeNativeOkfAccessAdmin(
    parseNativeOkfAccessAdminArgs([
      "create",
      "--label",
      "Expired",
      "--valid-days",
      "1",
    ]),
    dependencies,
  );
  const expiredAtMs = NOW + 86_400_000;
  const updateNowMs = expiredAtMs + 5_000;
  setNow(updateNowMs);
  executeNativeOkfAccessAdmin(
    parseNativeOkfAccessAdminArgs([
      "update",
      "--id",
      "invite-1",
      "--extend-days",
      "2",
    ]),
    dependencies,
  );
  assert.equal(
    store.getInvitation("invite-1")?.expiresAtMs,
    updateNowMs + 2 * 86_400_000,
  );
});

test("revoke invalidates the invitation without revealing its credential", () => {
  const { dependencies, store, output } = fixture();
  executeNativeOkfAccessAdmin(
    parseNativeOkfAccessAdminArgs(["create", "--label", "Revocable"]),
    dependencies,
  );
  output.length = 0;
  executeNativeOkfAccessAdmin(
    parseNativeOkfAccessAdminArgs(["revoke", "--id", "invite-1"]),
    dependencies,
  );
  assert.equal(store.listInvitations(NOW)[0]?.status, "revoked");
  assert.equal(output.join("").includes(FIXED_CODE), false);
});

test("usage JSON, pause, resume and cleanup output only safe aggregates", () => {
  const { dependencies, store, output, setNow } = fixture();
  executeNativeOkfAccessAdmin({ kind: "pause" }, dependencies);
  assert.equal(store.getOperationalPause(), true);
  executeNativeOkfAccessAdmin({ kind: "resume" }, dependencies);
  assert.equal(store.getOperationalPause(), false);

  store.createInvitation({
    id: "stale-invite",
    codeHash: hashInvitationCode("another-private-code", HASH_SECRET),
    label: "Stale test",
    createdAtMs: NOW,
    expiresAtMs: NOW + 86_400_000,
    quotas: dependencies.config.inviteDefaultQuotas,
  });
  store.reservePaidRequest({
    reservationId: "stale-reservation",
    subjectId: "stale-invite",
    subjectKind: "invite",
    invitationId: "stale-invite",
    nowMs: NOW,
    expiresAtMs: NOW + 1,
    includeDiagram: false,
    reserveMicrodollars: 80_000,
    subjectLimits: dependencies.config.inviteDefaultQuotas,
    applicationLimits: dependencies.config.applicationBudgets,
    accessExpiresAtMs: NOW + 86_400_000,
  });
  setNow(NOW + 2);
  executeNativeOkfAccessAdmin({ kind: "cleanup" }, dependencies);
  output.length = 0;
  executeNativeOkfAccessAdmin({ kind: "usage", json: true }, dependencies);
  const serialized = output.join("");
  const report = JSON.parse(serialized) as Record<string, unknown>;
  assert.equal(report.estimatedMicrodollarsToday, 80_000);
  assert.equal(serialized.includes("another-private-code"), false);
  assert.equal(serialized.includes("codeHash"), false);
  assert.equal(serialized.includes("prompt"), false);
  assert.equal(serialized.includes("answer"), false);
});

test("invite commands fail closed without the HMAC secret", () => {
  const { dependencies } = fixture();
  const disabledConfig = parseNativeOkfAccessConfig({});
  assert.throws(() =>
    executeNativeOkfAccessAdmin(
      parseNativeOkfAccessAdminArgs(["create", "--label", "Blocked"]),
      { ...dependencies, config: disabledConfig },
    ),
  );
});

