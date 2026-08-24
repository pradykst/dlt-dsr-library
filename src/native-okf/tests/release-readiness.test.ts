import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import {
  nextConfigHasReleaseRouteGeneration,
  packageHasProductionStart,
  retrievalDebugHasProductionGate,
  sourceContainsForbiddenRuntimeImport,
  sourceContainsPublicAdminNavigation,
  summarizeReleaseEnvironment,
  validateRequiredReleaseRoutes,
} from "../server/release-readiness.ts";

test("release environment reports credential presence without exposing values", () => {
  const secretText = "release-readiness-must-not-return-this-value";
  const summary = summarizeReleaseEnvironment({
    NATIVE_OKF_CHAT_ENABLED: "true",
    OPENAI_API_KEY: secretText,
  });

  assert.equal(summary.chatEnabled, true);
  assert.equal(summary.chatEnabledRecognized, true);
  assert.equal(summary.requiredConfigurationPresent, true);
  assert.equal(summary.providerPresence.openAiApiKey, true);
  assert.equal(JSON.stringify(summary).includes(secretText), false);

  const defaultOpen = summarizeReleaseEnvironment({
    OPENAI_API_KEY: secretText,
  });
  assert.equal(defaultOpen.chatEnabled, true);
  assert.equal(defaultOpen.chatEnabledRecognized, true);
  assert.equal(defaultOpen.requiredConfigurationPresent, true);

  const invalid = summarizeReleaseEnvironment({
    NATIVE_OKF_CHAT_ENABLED: "maybe",
  });
  assert.equal(invalid.chatEnabled, false);
  assert.equal(invalid.chatEnabledRecognized, false);
  assert.equal(invalid.requiredConfigurationPresent, false);

  const disabled = summarizeReleaseEnvironment({
    NATIVE_OKF_CHAT_ENABLED: "false",
  });
  assert.equal(disabled.chatEnabled, false);
  assert.equal(disabled.chatEnabledRecognized, true);
  assert.equal(disabled.requiredConfigurationPresent, true);
});

test("canonical and compatibility route definitions are complete and loop-free", () => {
  assert.deepEqual(validateRequiredReleaseRoutes(), []);
});

test("static release audits detect forbidden imports and public admin links", () => {
  const forbiddenImportFixture = [
    'import { client } from "../../',
    'legacy/rag/client";',
  ].join("");
  assert.equal(
    sourceContainsForbiddenRuntimeImport(
      forbiddenImportFixture,
    ),
    true,
  );
  assert.equal(
    sourceContainsForbiddenRuntimeImport(
      'import { paperHref } from "../shared/routes.ts";',
    ),
    false,
  );
  assert.equal(
    sourceContainsPublicAdminNavigation('<a href="/admin">Admin</a>'),
    true,
  );
  assert.equal(
    sourceContainsPublicAdminNavigation('<a href="/library">Library</a>'),
    false,
  );
});

test("retrieval debug and Next release configuration checks are conservative", () => {
  const guardedRoute = `
    function disabledResponse() { return Response.json({}, { status: 404 }); }
    export async function GET() {
      if (process.env.NODE_ENV === "production") return disabledResponse();
    }
    export async function POST() {
      if (process.env.NODE_ENV === "production") return disabledResponse();
    }
  `;
  assert.equal(retrievalDebugHasProductionGate(guardedRoute), true);
  assert.equal(retrievalDebugHasProductionGate("export async function GET() {}"), false);

  assert.equal(
    nextConfigHasReleaseRouteGeneration(`
      NATIVE_OKF_CANONICAL_REWRITES;
      NATIVE_OKF_COMPATIBILITY_REDIRECTS;
      outputFileTracingIncludes;
      "knowledge/okf/**/*";
    `),
    true,
  );
  assert.equal(nextConfigHasReleaseRouteGeneration("export default {}"), false);
  assert.equal(
    packageHasProductionStart('{"scripts":{"start":"next start"}}'),
    true,
  );
  assert.equal(
    packageHasProductionStart('{"scripts":{"start":"next dev"}}'),
    false,
  );
  assert.equal(packageHasProductionStart("not JSON"), false);
});
