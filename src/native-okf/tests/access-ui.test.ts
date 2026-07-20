import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  nativeOkfChatErrorMessage,
  nativeOkfDiagramQuotaExhausted,
  readNativeOkfPersonalQuota,
  readNativeOkfResearchAccess,
} from "../components/chat/access-ui.ts";
import type { NativeOkfPersonalQuotaMetadata } from "../shared/chat-types.ts";

const QUOTA: NativeOkfPersonalQuotaMetadata = {
  questionsRemainingToday: 7,
  diagramsRemainingToday: 2,
  questionsRemainingTotal: 19,
  diagramsRemainingTotal: 6,
  resetAtMs: Date.UTC(2026, 6, 19),
  accessExpiresAtMs: Date.UTC(2026, 7, 1),
};

test("researcher quota payload accepts only bounded personal counters", () => {
  assert.deepEqual(
    readNativeOkfPersonalQuota({
      ...QUOTA,
      questionsUsedToday: 5,
      estimatedGlobalSpend: "must be ignored",
    }),
    QUOTA,
  );
  assert.equal(
    readNativeOkfPersonalQuota({
      ...QUOTA,
      questionsRemainingToday: -1,
    }),
    null,
  );
  assert.equal(
    readNativeOkfPersonalQuota({
      ...QUOTA,
      diagramsRemainingTotal: 1.5,
    }),
    null,
  );
  assert.equal(readNativeOkfPersonalQuota(null), null);
});

test("diagram exhaustion never disables text allowance", () => {
  assert.equal(nativeOkfDiagramQuotaExhausted(QUOTA), false);
  assert.equal(
    nativeOkfDiagramQuotaExhausted({
      ...QUOTA,
      diagramsRemainingToday: 0,
      questionsRemainingToday: 5,
    }),
    true,
  );
  assert.equal(
    nativeOkfDiagramQuotaExhausted({
      ...QUOTA,
      diagramsRemainingTotal: 0,
      questionsRemainingTotal: 12,
    }),
    true,
  );
  assert.equal(nativeOkfDiagramQuotaExhausted(null), false);
});

test("research access payload exposes authenticated quota and safe states", () => {
  assert.deepEqual(
    readNativeOkfResearchAccess({
      chatEnabled: true,
      authenticated: true,
      status: "authenticated",
      quota: QUOTA,
    }),
    { state: "authenticated", quota: QUOTA },
  );
  assert.deepEqual(
    readNativeOkfResearchAccess({
      chatEnabled: true,
      authenticated: false,
      status: "available",
    }),
    { state: "required", quota: null },
  );
  assert.deepEqual(
    readNativeOkfResearchAccess({
      chatEnabled: true,
      authenticated: false,
      status: "revoked",
    }),
    { state: "revoked", quota: null },
  );
  assert.deepEqual(
    readNativeOkfResearchAccess({
      chatEnabled: false,
      authenticated: false,
      status: "disabled",
    }),
    { state: "disabled", quota: null },
  );
});

test("chat status messages distinguish personal access failures safely", () => {
  assert.match(nativeOkfChatErrorMessage({}, 401), /access is required/iu);
  assert.match(nativeOkfChatErrorMessage({}, 403), /expired or was revoked/iu);
  assert.match(
    nativeOkfChatErrorMessage({ code: "diagram_quota_exhausted" }, 429),
    /Text-only questions remain available/iu,
  );
  assert.match(nativeOkfChatErrorMessage({}, 429), /personal quota/iu);
  assert.match(nativeOkfChatErrorMessage({}, 503), /paused or temporarily unavailable/iu);

  const messages = [401, 403, 429, 503]
    .map((status) => nativeOkfChatErrorMessage({}, status))
    .join(" ");
  assert.doesNotMatch(messages, /global spend|monthly budget|other researcher/iu);
});

test("chat workbench fetches server access and renders quota controls without credential storage", async () => {
  const source = await readFile(
    resolve(process.cwd(), "src/native-okf/components/chat/ChatWorkbench.tsx"),
    "utf8",
  );

  assert.match(source, /fetch\(NATIVE_OKF_API_ROUTES\.access/u);
  assert.match(source, /NATIVE_OKF_API_ROUTES\.chat/u);
  assert.match(source, /href=\{NATIVE_OKF_PUBLIC_ROUTES\.access\}/u);
  assert.doesNotMatch(source, /href="\/native-okf\/access"/u);
  assert.match(source, /disabled=\{pending \|\| diagramQuotaExhausted\}/u);
  assert.match(source, /Text-only questions remain available/u);
  assert.match(source, /setDiagramQuotaBlocked\(true\)/u);
  assert.match(source, /questionsRemainingToday/u);
  assert.match(source, /diagramsRemainingTotal/u);
  assert.match(source, /Questions,[\s\S]*answers,[\s\S]*not[\s\S]*stored/u);
  assert.match(source, /window\.sessionStorage/u);
  assert.match(source, /New chat/u);
  assert.match(source, /Start a new chat/u);
  assert.doesNotMatch(source, /localStorage/u);
});

test("native access route fallbacks remain server-only and nosniff", async () => {
  const routePaths = [
    "app/api/native-okf/access/route.ts",
    "app/api/native-okf/admin/dashboard/route.ts",
    "app/api/native-okf/admin/mutations/route.ts",
    "app/api/native-okf/admin/session/route.ts",
  ] as const;

  for (const routePath of routePaths) {
    const source = await readFile(resolve(process.cwd(), routePath), "utf8");
    assert.match(source, /^import "server-only";/u);
    assert.match(source, /process\.env/u);
    assert.match(source, /"x-content-type-options": "nosniff"/u);
  }
});
