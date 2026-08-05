import "server-only";

import { constants as fsConstants } from "node:fs";
import {
  access,
  mkdir,
  open,
  readFile,
  readdir,
  stat,
  unlink,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

import { getOkfBundle } from "./cache.ts";
import { buildReleaseHomeViewModel } from "./release-home.ts";
import { validateOkfBundle } from "./validation.ts";
import {
  NATIVE_OKF_CANONICAL_REWRITES,
  NATIVE_OKF_COMPATIBILITY_REDIRECTS,
  NATIVE_OKF_PUBLIC_ROUTES,
  validateNativeOkfRouteIntegrity,
} from "../shared/routes.ts";
import type { NativeOkfAccessMode } from "./access/types.ts";

const EXPECTED_MARKDOWN_DOCUMENT_COUNT = 404;

const SOURCE_FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const FORBIDDEN_RUNTIME_IMPORT =
  /(?:from\s*|import\s*\(|require\s*\()\s*["'][^"']*(?:supabase|(?:^|[/_-])rag(?:[/_-]|$)|vector|answer-plan|generated-flow|source-view|graph\.json|(?:^|[/_-])legacy(?:[/_-]|$))[^"']*["']/iu;
const PUBLIC_ADMIN_LINK =
  /(?:href\s*=\s*["']\/admin(?:\/|["'])|(?:href|destination)\s*:\s*["']\/admin(?:\/|["']))/iu;

export const DEFAULT_RELEASE_CANONICAL_SOURCE_PATHS = [
  "app/layout.tsx",
  "app/robots.ts",
  "app/sitemap.ts",
  "app/native-okf/layout.tsx",
  "app/native-okf/page.tsx",
  "app/native-okf/chat/page.tsx",
  "app/native-okf/access/page.tsx",
  "app/native-okf/papers",
  "app/native-okf/concepts",
  "app/native-okf/admin",
  "app/native-okf/release-home",
  "app/native-okf/method",
  "components/layout/SiteHeader.tsx",
  "components/layout/SiteFooter.tsx",
  "src/native-okf/components",
  "src/native-okf/server/guided-starters.ts",
  "src/native-okf/shared/evaluation-onboarding.ts",
  "src/native-okf/shared/guided-starters.ts",
  "src/native-okf/shared/public-links.ts",
  "src/native-okf/shared/routes.ts",
] as const;

export const DEFAULT_PUBLIC_NAVIGATION_SOURCE_PATHS = [
  "components/layout/SiteHeader.tsx",
  "components/layout/SiteFooter.tsx",
  "app/native-okf/release-home",
  "app/native-okf/method",
] as const;

const REQUIRED_COMPATIBILITY_REDIRECTS = new Map<string, string>([
  ["/native-okf", "/library"],
  ["/native-okf/chat", "/chat"],
  ["/native-okf/access", "/access"],
  ["/native-okf/papers/:slug", "/papers/:slug"],
  ["/native-okf/concepts/:conceptId*", "/concepts/:conceptId*"],
  ["/native-okf/admin/access", "/admin/access"],
  ["/native-okf/admin", "/admin"],
]);

const REQUIRED_CANONICAL_REWRITES = new Map<string, string>([
  ["/", "/native-okf/release-home"],
  ["/library", "/native-okf"],
  ["/chat", "/native-okf/chat"],
  ["/access", "/native-okf/access"],
  ["/method", "/native-okf/method"],
  ["/papers/:slug", "/native-okf/papers/:slug"],
  ["/concepts/:conceptId*", "/native-okf/concepts/:conceptId*"],
  ["/admin/access", "/native-okf/admin/access"],
  ["/admin", "/native-okf/admin"],
]);

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export interface ReleaseSecretPresence {
  openAiApiKey: boolean;
  researcherSessionSecret: boolean;
  inviteHashSecret: boolean;
  testAccessCode: boolean;
  adminAccessCode: boolean;
  adminSessionSecret: boolean;
}

export interface ReleaseEnvironmentSummary {
  accessMode: NativeOkfAccessMode;
  accessModeRecognized: boolean;
  chatEnabled: boolean;
  chatEnabledRecognized: boolean;
  secretPresence: ReleaseSecretPresence;
  requiredConfigurationPresent: boolean;
}

export interface ReleaseReadinessCheck {
  id: string;
  ok: boolean;
  summary: string;
}

export interface ReleaseReadinessReport {
  ready: boolean;
  checks: ReleaseReadinessCheck[];
  access: ReleaseEnvironmentSummary;
  metrics: {
    markdownDocumentCount: number;
    conceptCount: number;
    paperCount: number;
    resolvedNativeLinkCount: number;
    representedTypeCount: number;
  };
}

export interface ReleaseReadinessOptions {
  cwd?: string;
  environment?: EnvironmentSource;
  usageDbPath?: string;
  canonicalSourcePaths?: readonly string[];
  publicNavigationSourcePaths?: readonly string[];
  nextConfigPath?: string;
  packageJsonPath?: string;
  retrievalDebugRoutePath?: string;
  /** Tests may disable directory creation and supply an already existing parent. */
  createUsageDirectory?: boolean;
}

function isPresent(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function parseBooleanSetting(
  value: string | undefined,
): { value: boolean; recognized: boolean } {
  const normalized = value?.trim().toLocaleLowerCase("en");
  if (!normalized) return { value: false, recognized: true };
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return { value: true, recognized: true };
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return { value: false, recognized: true };
  }
  return { value: false, recognized: false };
}

/**
 * Summarizes named release settings without enumerating the environment and
 * without returning, logging, hashing, or otherwise exposing credential text.
 */
export function summarizeReleaseEnvironment(
  environment: EnvironmentSource,
): ReleaseEnvironmentSummary {
  const requestedMode = environment.NATIVE_OKF_ACCESS_MODE
    ?.trim()
    .toLocaleLowerCase("en");
  const accessModeRecognized =
    !requestedMode ||
    requestedMode === "disabled" ||
    requestedMode === "test" ||
    requestedMode === "invite";
  const accessMode: NativeOkfAccessMode =
    requestedMode === "test" || requestedMode === "invite"
      ? requestedMode
      : "disabled";
  const enabled = parseBooleanSetting(environment.NATIVE_OKF_CHAT_ENABLED);
  const secretPresence = {
    openAiApiKey: isPresent(environment.OPENAI_API_KEY),
    researcherSessionSecret: isPresent(environment.NATIVE_OKF_SESSION_SECRET),
    inviteHashSecret: isPresent(environment.NATIVE_OKF_INVITE_HASH_SECRET),
    testAccessCode: isPresent(environment.NATIVE_OKF_TEST_ACCESS_CODE),
    adminAccessCode: isPresent(environment.NATIVE_OKF_ADMIN_ACCESS_CODE),
    adminSessionSecret: isPresent(environment.NATIVE_OKF_ADMIN_SESSION_SECRET),
  };

  const paidModeActive = enabled.value && accessMode !== "disabled";
  const paidConfigurationPresent =
    !paidModeActive ||
    (secretPresence.openAiApiKey &&
      secretPresence.researcherSessionSecret &&
      (accessMode === "test"
        ? secretPresence.testAccessCode
        : secretPresence.inviteHashSecret));
  const adminPartiallyConfigured =
    secretPresence.adminAccessCode !== secretPresence.adminSessionSecret;

  return {
    accessMode,
    accessModeRecognized,
    chatEnabled: enabled.value,
    chatEnabledRecognized: enabled.recognized,
    secretPresence,
    requiredConfigurationPresent:
      accessModeRecognized &&
      enabled.recognized &&
      paidConfigurationPresent &&
      !adminPartiallyConfigured,
  };
}

/** Project only named settings needed by this audit; never enumerate process.env. */
function readReleaseReadinessEnvironment(): EnvironmentSource {
  return {
    NATIVE_OKF_CHAT_ENABLED: process.env.NATIVE_OKF_CHAT_ENABLED,
    NATIVE_OKF_ACCESS_MODE: process.env.NATIVE_OKF_ACCESS_MODE,
    NATIVE_OKF_USAGE_DB_PATH: process.env.NATIVE_OKF_USAGE_DB_PATH,
    NATIVE_OKF_SESSION_SECRET: process.env.NATIVE_OKF_SESSION_SECRET,
    NATIVE_OKF_INVITE_HASH_SECRET: process.env.NATIVE_OKF_INVITE_HASH_SECRET,
    NATIVE_OKF_TEST_ACCESS_CODE: process.env.NATIVE_OKF_TEST_ACCESS_CODE,
    NATIVE_OKF_ADMIN_ACCESS_CODE: process.env.NATIVE_OKF_ADMIN_ACCESS_CODE,
    NATIVE_OKF_ADMIN_SESSION_SECRET:
      process.env.NATIVE_OKF_ADMIN_SESSION_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };
}

function pathIsWithin(root: string, candidate: string): boolean {
  const difference = relative(root, candidate);
  return (
    difference === "" ||
    (difference !== ".." &&
      !difference.startsWith(`..${sep}`) &&
      !isAbsolute(difference))
  );
}

/**
 * Probes the SQLite parent directory and file permissions without opening or
 * reading the database itself. A temporary sibling file is always removed.
 */
export async function checkUsageDatabaseWritable(options: {
  cwd: string;
  usageDbPath: string;
  createDirectory?: boolean;
}): Promise<boolean> {
  const root = resolve(options.cwd);
  const databasePath = isAbsolute(options.usageDbPath)
    ? resolve(options.usageDbPath)
    : resolve(root, options.usageDbPath);
  const parent = dirname(databasePath);

  try {
    try {
      await stat(parent);
    } catch {
      if (options.createDirectory === false || !pathIsWithin(root, parent)) {
        return false;
      }
      await mkdir(parent, { recursive: true });
    }

    await access(parent, fsConstants.W_OK);
    try {
      await access(databasePath, fsConstants.F_OK);
      await access(databasePath, fsConstants.W_OK);
    } catch (error) {
      const candidate = error as NodeJS.ErrnoException;
      if (candidate.code !== "ENOENT") return false;
    }

    const probePath = resolve(
      parent,
      `.native-okf-readiness-${process.pid}-${randomUUID()}.tmp`,
    );
    let probe: Awaited<ReturnType<typeof open>> | undefined;
    try {
      probe = await open(probePath, "wx", 0o600);
      return true;
    } finally {
      await probe?.close();
      await unlink(probePath).catch(() => undefined);
    }
  } catch {
    return false;
  }
}

function fileExtension(filePath: string): string {
  const match = /\.[^.\\/]+$/u.exec(filePath);
  return match?.[0]?.toLocaleLowerCase("en") ?? "";
}

async function listSourceFiles(
  root: string,
  bundleRelativePaths: readonly string[],
): Promise<string[]> {
  const files = new Set<string>();

  async function visit(absolutePath: string): Promise<void> {
    let metadata: Awaited<ReturnType<typeof stat>>;
    try {
      metadata = await stat(absolutePath);
    } catch {
      return;
    }
    if (metadata.isFile()) {
      if (SOURCE_FILE_EXTENSIONS.has(fileExtension(absolutePath))) {
        files.add(absolutePath);
      }
      return;
    }
    if (!metadata.isDirectory()) return;

    const entries = await readdir(absolutePath, { withFileTypes: true });
    for (const entry of entries.sort((left, right) =>
      left.name.localeCompare(right.name)
    )) {
      if (entry.isSymbolicLink()) continue;
      await visit(resolve(absolutePath, entry.name));
    }
  }

  for (const relativePath of bundleRelativePaths) {
    const candidate = resolve(root, relativePath);
    if (!pathIsWithin(root, candidate)) continue;
    await visit(candidate);
  }

  return [...files].sort();
}

export function sourceContainsForbiddenRuntimeImport(source: string): boolean {
  return FORBIDDEN_RUNTIME_IMPORT.test(source);
}

export function sourceContainsPublicAdminNavigation(source: string): boolean {
  return PUBLIC_ADMIN_LINK.test(source);
}

export function retrievalDebugHasProductionGate(source: string): boolean {
  const disabledReturns404 =
    /function\s+disabledResponse\s*\([^)]*\)[\s\S]{0,500}?404/u.test(source);
  const productionGuards = source.match(
    /if\s*\(\s*process\.env\.NODE_ENV\s*===\s*["']production["']\s*\)\s*return\s+disabledResponse\s*\(\s*\)\s*;/gu,
  );
  return disabledReturns404 && (productionGuards?.length ?? 0) >= 2;
}

export function nextConfigHasReleaseRouteGeneration(source: string): boolean {
  return (
    source.includes("NATIVE_OKF_CANONICAL_REWRITES") &&
    source.includes("NATIVE_OKF_COMPATIBILITY_REDIRECTS") &&
    source.includes("outputFileTracingIncludes") &&
    source.includes("knowledge/okf")
  );
}

export function packageHasProductionStart(source: string): boolean {
  try {
    const parsed = JSON.parse(source) as {
      scripts?: Record<string, unknown>;
    };
    return parsed.scripts?.start === "next start";
  } catch {
    return false;
  }
}

export function validateRequiredReleaseRoutes(): string[] {
  const issues = validateNativeOkfRouteIntegrity();
  const compatibility = new Map(
    NATIVE_OKF_COMPATIBILITY_REDIRECTS.map((route) => [
      route.source,
      route.destination,
    ]),
  );
  const rewrites = new Map(
    NATIVE_OKF_CANONICAL_REWRITES.map((route) => [
      route.source,
      route.destination,
    ]),
  );

  for (const [source, destination] of REQUIRED_COMPATIBILITY_REDIRECTS) {
    if (compatibility.get(source) !== destination) {
      issues.push(
        `Compatibility redirect ${source} must target ${destination}.`,
      );
    }
  }
  for (const [source, destination] of REQUIRED_CANONICAL_REWRITES) {
    if (rewrites.get(source) !== destination) {
      issues.push(`Canonical route ${source} is not generated correctly.`);
    }
  }

  const publicValues = Object.values(NATIVE_OKF_PUBLIC_ROUTES);
  if (publicValues.some((route) => route.startsWith("/native-okf"))) {
    issues.push("A canonical public route retains the native compatibility prefix.");
  }
  return issues;
}

async function sourcesContainPattern(
  root: string,
  paths: readonly string[],
  predicate: (source: string) => boolean,
): Promise<boolean> {
  const files = await listSourceFiles(root, paths);
  for (const file of files) {
    if (predicate(await readFile(file, "utf8"))) return true;
  }
  return false;
}

function check(id: string, ok: boolean, summary: string): ReleaseReadinessCheck {
  return { id, ok, summary };
}

export async function runNativeOkfReleaseReadiness(
  options: ReleaseReadinessOptions = {},
): Promise<ReleaseReadinessReport> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const environment = options.environment ?? readReleaseReadinessEnvironment();
  const accessSummary = summarizeReleaseEnvironment(environment);
  const usageDbPath =
    options.usageDbPath ??
    environment.NATIVE_OKF_USAGE_DB_PATH?.trim() ??
    "runtime/native-okf-usage.sqlite";

  const [validation, bundle, home, storageWritable] = await Promise.all([
    validateOkfBundle({ cwd }),
    getOkfBundle(),
    buildReleaseHomeViewModel(),
    checkUsageDatabaseWritable({
      cwd,
      usageDbPath,
      createDirectory: options.createUsageDirectory ?? true,
    }),
  ]);

  const routeIssues = validateRequiredReleaseRoutes();
  const canonicalSourcePaths =
    options.canonicalSourcePaths ?? DEFAULT_RELEASE_CANONICAL_SOURCE_PATHS;
  const publicNavigationSourcePaths =
    options.publicNavigationSourcePaths ??
    DEFAULT_PUBLIC_NAVIGATION_SOURCE_PATHS;
  const [
    forbiddenImportFound,
    publicAdminLinkFound,
    nextConfigSource,
    packageJsonSource,
    debugSource,
  ] = await Promise.all([
      sourcesContainPattern(
        cwd,
        canonicalSourcePaths,
        sourceContainsForbiddenRuntimeImport,
      ),
      sourcesContainPattern(
        cwd,
        publicNavigationSourcePaths,
        sourceContainsPublicAdminNavigation,
      ),
      readFile(resolve(cwd, options.nextConfigPath ?? "next.config.ts"), "utf8"),
      readFile(resolve(cwd, options.packageJsonPath ?? "package.json"), "utf8"),
      readFile(
        resolve(
          cwd,
          options.retrievalDebugRoutePath ??
            "app/api/native-okf/retrieval-debug/route.ts",
        ),
        "utf8",
      ),
    ]);

  const bundleResolvedLinkCount = bundle.concepts.reduce(
    (total, concept) =>
      total +
      concept.outgoingLinks.filter((link) => link.resolved && !link.external).length,
    0,
  );
  const homepageMetricsConsistent =
    home.metrics.paperCount === validation.paperCount &&
    home.metrics.conceptCount === validation.conceptCount &&
    home.metrics.resolvedNativeLinkCount === bundleResolvedLinkCount &&
    home.metrics.representedTypeCount === Object.keys(validation.countsByType).length;

  const checks = [
    check(
      "okf-valid",
      validation.fatalValidationErrorCount === 0 &&
        validation.brokenLinkWarningCount === 0,
      `${validation.fatalValidationErrorCount} fatal errors; ${validation.brokenLinkWarningCount} broken links`,
    ),
    check(
      "okf-documents",
      validation.markdownFileCount === EXPECTED_MARKDOWN_DOCUMENT_COUNT,
      `${validation.markdownFileCount} Markdown documents discoverable`,
    ),
    check(
      "homepage-metrics",
      homepageMetricsConsistent,
      "Homepage metrics are derived consistently from the native repository",
    ),
    check(
      "canonical-routes",
      routeIssues.length === 0,
      routeIssues.length === 0
        ? "Canonical and compatibility route definitions are complete and loop-free"
        : `${routeIssues.length} route-integrity issue(s)`,
    ),
    check(
      "route-generation",
      nextConfigHasReleaseRouteGeneration(nextConfigSource),
      "Next configuration uses shared release routes and traces native OKF data",
    ),
    check(
      "production-start",
      packageHasProductionStart(packageJsonSource),
      "Package scripts provide the production Next.js start command",
    ),
    check(
      "public-admin-navigation",
      !publicAdminLinkFound,
      "Public navigation contains no administrator link",
    ),
    check(
      "retrieval-debug-production",
      retrievalDebugHasProductionGate(debugSource),
      "Retrieval diagnostics return not-found in production",
    ),
    check(
      "access-mode",
      accessSummary.accessModeRecognized && accessSummary.chatEnabledRecognized,
      `Access mode is recognized (${accessSummary.accessMode})`,
    ),
    check(
      "required-configuration",
      accessSummary.requiredConfigurationPresent,
      "Required active-mode credentials are represented only as presence booleans",
    ),
    check(
      "usage-store-writable",
      storageWritable,
      "SQLite location is writable without opening the operational database",
    ),
    check(
      "canonical-import-isolation",
      !forbiddenImportFound,
      "Canonical release sources contain no forbidden runtime imports",
    ),
  ];

  return {
    ready: checks.every((item) => item.ok),
    checks,
    access: accessSummary,
    metrics: {
      markdownDocumentCount: validation.markdownFileCount,
      conceptCount: home.metrics.conceptCount,
      paperCount: home.metrics.paperCount,
      resolvedNativeLinkCount: home.metrics.resolvedNativeLinkCount,
      representedTypeCount: home.metrics.representedTypeCount,
    },
  };
}

export function formatReleaseReadinessReport(
  report: ReleaseReadinessReport,
): string {
  const checks = report.checks.map(
    (item) => `${item.ok ? "PASS" : "FAIL"} ${item.id}: ${item.summary}`,
  );
  const credentials = Object.entries(report.access.secretPresence).map(
    ([name, present]) => `  ${name}: ${present}`,
  );
  return [
    "Native OKF frontend release readiness",
    `Overall: ${report.ready ? "ready" : "not ready"}`,
    `Access mode: ${report.access.accessMode}`,
    "Credential presence (values are never displayed):",
    ...credentials,
    ...checks,
  ].join("\n");
}
