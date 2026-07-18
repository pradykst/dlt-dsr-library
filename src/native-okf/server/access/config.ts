import "server-only";

import type {
  ApplicationBudgetLimits,
  NativeOkfAccessMode,
  QuotaLimits,
} from "./types.ts";

export interface NativeOkfUsagePricing {
  inputMicrodollarsPerMillion: number;
  cachedInputMicrodollarsPerMillion: number;
  outputMicrodollarsPerMillion: number;
}

export type NativeOkfTrustedProxyConfig =
  | { trustProxy: false }
  | {
      trustProxy: true;
      header: "x-forwarded-for" | "x-real-ip";
      trustedHops: number;
    };

export interface NativeOkfAccessConfig {
  chatEnabled: boolean;
  accessMode: NativeOkfAccessMode;
  durableStoreRequired: boolean;
  usageDbPath: string;
  sessionSecret: string | null;
  inviteHashSecret: string | null;
  testAccessCode: string | null;
  adminAccessCode: string | null;
  adminSessionSecret: string | null;
  adminConfigured: boolean;
  trustedProxy: NativeOkfTrustedProxyConfig;
  publicOrigin: string | null;
  testQuotas: QuotaLimits;
  inviteDefaultQuotas: QuotaLimits;
  applicationBudgets: ApplicationBudgetLimits;
  globalRequestsPerMinute: number;
  ipRequestsPerHour: number;
  textRequestReserveMicrodollars: number;
  diagramRequestReserveMicrodollars: number;
  pricing: NativeOkfUsagePricing;
  inviteDefaultValidDays: number;
  researcherSessionMaxAgeSeconds: number;
  adminSessionMaxAgeSeconds: number;
  reservationTtlMs: number;
  adminMutationsPerMinute: number;
}

export class NativeOkfAccessConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeOkfAccessConfigurationError";
  }
}

type Environment = Readonly<Record<string, string | undefined>>;

const INTEGER_MAX = 1_000_000;

function optionalBoolean(
  environment: Environment,
  key: string,
  fallback: boolean,
): boolean {
  const value = environment[key]?.trim().toLocaleLowerCase("en");
  if (!value) return fallback;
  if (["1", "true", "yes", "on"].includes(value)) return true;
  if (["0", "false", "no", "off"].includes(value)) return false;
  throw new NativeOkfAccessConfigurationError(`${key} must be true or false.`);
}

function optionalInteger(
  environment: Environment,
  key: string,
  fallback: number,
  minimum = 0,
  maximum = INTEGER_MAX,
): number {
  const value = environment[key]?.trim();
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new NativeOkfAccessConfigurationError(
      `${key} must be an integer between ${minimum} and ${maximum}.`,
    );
  }
  return parsed;
}

/** Parses a non-negative decimal into integer microdollars without float math. */
export function parseUsdToMicrodollars(value: string, key: string): number {
  const normalized = value.trim();
  const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(normalized);
  if (!match) {
    throw new NativeOkfAccessConfigurationError(
      `${key} must be a non-negative USD decimal with at most six decimal places.`,
    );
  }
  const whole = Number(match[1]);
  const fractional = Number((match[2] ?? "").padEnd(6, "0"));
  const result = whole * 1_000_000 + fractional;
  if (!Number.isSafeInteger(result)) {
    throw new NativeOkfAccessConfigurationError(`${key} is too large.`);
  }
  return result;
}

function optionalUsd(
  environment: Environment,
  key: string,
  fallbackUsd: string,
): number {
  return parseUsdToMicrodollars(environment[key]?.trim() || fallbackUsd, key);
}

function optionalPrice(
  environment: Environment,
  key: string,
  required: boolean,
): number {
  const value = environment[key]?.trim();
  if (!value) {
    if (required) {
      throw new NativeOkfAccessConfigurationError(
        `${key} is required while paid native OKF chat is enabled.`,
      );
    }
    return 0;
  }
  return parseUsdToMicrodollars(value, key);
}

function optionalSecret(environment: Environment, key: string): string | null {
  const value = environment[key]?.trim();
  return value || null;
}

function requireSecret(
  value: string | null,
  key: string,
  minimumLength: number,
): string {
  if (!value || value.length < minimumLength) {
    throw new NativeOkfAccessConfigurationError(
      `${key} must contain at least ${minimumLength} characters in the active access mode.`,
    );
  }
  return value;
}

function readTrustedProxy(
  environment: Environment,
): NativeOkfTrustedProxyConfig {
  const trustProxy = optionalBoolean(
    environment,
    "NATIVE_OKF_TRUST_PROXY",
    false,
  );
  if (!trustProxy) return { trustProxy: false };
  const header =
    environment.NATIVE_OKF_TRUSTED_PROXY_HEADER?.trim().toLocaleLowerCase(
      "en",
    ) || "x-forwarded-for";
  if (header !== "x-forwarded-for" && header !== "x-real-ip") {
    throw new NativeOkfAccessConfigurationError(
      "NATIVE_OKF_TRUSTED_PROXY_HEADER must be x-forwarded-for or x-real-ip.",
    );
  }
  return {
    trustProxy: true,
    header,
    trustedHops: optionalInteger(
      environment,
      "NATIVE_OKF_TRUSTED_PROXY_HOPS",
      1,
      1,
      10,
    ),
  };
}

function readPublicOrigin(
  environment: Environment,
  required: boolean,
  requireHttps: boolean,
): string | null {
  const value = environment.NATIVE_OKF_PUBLIC_ORIGIN?.trim();
  if (!value) {
    if (required) {
      throw new NativeOkfAccessConfigurationError(
        "NATIVE_OKF_PUBLIC_ORIGIN is required for active paid or admin browser access.",
      );
    }
    return null;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new NativeOkfAccessConfigurationError(
      "NATIVE_OKF_PUBLIC_ORIGIN must be a valid HTTP(S) origin.",
    );
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.origin !== value.replace(/\/$/, "")
  ) {
    throw new NativeOkfAccessConfigurationError(
      "NATIVE_OKF_PUBLIC_ORIGIN must be an HTTP(S) origin without a path, query or fragment.",
    );
  }
  if (requireHttps && url.protocol !== "https:") {
    throw new NativeOkfAccessConfigurationError(
      "NATIVE_OKF_PUBLIC_ORIGIN must use HTTPS in production.",
    );
  }
  return url.origin;
}

function readAccessMode(value: string | undefined): NativeOkfAccessMode {
  const normalized = value?.trim().toLocaleLowerCase("en");
  if (normalized === "test" || normalized === "invite") return normalized;
  return "disabled";
}

function quotaProfile(
  environment: Environment,
  prefix: "NATIVE_OKF_TEST" | "NATIVE_OKF_INVITE",
  defaults: Pick<
    QuotaLimits,
    "dailyQuestions" | "dailyDiagrams" | "totalQuestions" | "totalDiagrams"
  >,
  shared: Pick<QuotaLimits, "requestsPerMinute" | "cooldownSeconds" | "maxConcurrent">,
): QuotaLimits {
  return {
    dailyQuestions: optionalInteger(
      environment,
      `${prefix}_DAILY_QUESTIONS`,
      defaults.dailyQuestions,
      1,
    ),
    dailyDiagrams: optionalInteger(
      environment,
      `${prefix}_DAILY_DIAGRAMS`,
      defaults.dailyDiagrams,
      0,
    ),
    totalQuestions: optionalInteger(
      environment,
      `${prefix}_TOTAL_QUESTIONS`,
      defaults.totalQuestions,
      1,
    ),
    totalDiagrams: optionalInteger(
      environment,
      `${prefix}_TOTAL_DIAGRAMS`,
      defaults.totalDiagrams,
      0,
    ),
    ...shared,
  };
}

function validateQuotaConsistency(quotas: QuotaLimits, label: string): void {
  if (quotas.dailyQuestions > quotas.totalQuestions) {
    throw new NativeOkfAccessConfigurationError(
      `${label} daily question quota cannot exceed its total quota.`,
    );
  }
  if (quotas.dailyDiagrams > quotas.totalDiagrams) {
    throw new NativeOkfAccessConfigurationError(
      `${label} daily diagram quota cannot exceed its total quota.`,
    );
  }
}

/**
 * Parses only an explicitly supplied environment record. It never reads or
 * enumerates process.env, which keeps secret access centralized in the caller.
 */
export function parseNativeOkfAccessConfig(
  environment: Environment,
): NativeOkfAccessConfig {
  const chatEnabled = optionalBoolean(
    environment,
    "NATIVE_OKF_CHAT_ENABLED",
    false,
  );
  const accessMode = readAccessMode(environment.NATIVE_OKF_ACCESS_MODE);
  const paidModeEnabled = chatEnabled && accessMode !== "disabled";
  const production =
    environment.NODE_ENV?.trim().toLocaleLowerCase("en") === "production";

  const sessionSecret = optionalSecret(environment, "NATIVE_OKF_SESSION_SECRET");
  const inviteHashSecret = optionalSecret(
    environment,
    "NATIVE_OKF_INVITE_HASH_SECRET",
  );
  const testAccessCode = optionalSecret(
    environment,
    "NATIVE_OKF_TEST_ACCESS_CODE",
  );
  const adminAccessCode = optionalSecret(
    environment,
    "NATIVE_OKF_ADMIN_ACCESS_CODE",
  );
  const adminSessionSecret = optionalSecret(
    environment,
    "NATIVE_OKF_ADMIN_SESSION_SECRET",
  );

  if (paidModeEnabled) {
    requireSecret(sessionSecret, "NATIVE_OKF_SESSION_SECRET", 32);
    if (accessMode === "test") {
      requireSecret(testAccessCode, "NATIVE_OKF_TEST_ACCESS_CODE", 12);
    } else {
      requireSecret(inviteHashSecret, "NATIVE_OKF_INVITE_HASH_SECRET", 32);
    }
  }

  const hasAnyAdminSecret = adminAccessCode !== null || adminSessionSecret !== null;
  if (hasAnyAdminSecret) {
    requireSecret(adminAccessCode, "NATIVE_OKF_ADMIN_ACCESS_CODE", 12);
    requireSecret(adminSessionSecret, "NATIVE_OKF_ADMIN_SESSION_SECRET", 32);
  }

  const requestsPerMinute = optionalInteger(
    environment,
    "NATIVE_OKF_PER_INVITE_RPM",
    4,
    1,
    10_000,
  );
  const cooldownSeconds = optionalInteger(
    environment,
    "NATIVE_OKF_REQUEST_COOLDOWN_SECONDS",
    5,
    0,
    3_600,
  );
  const maxConcurrent = optionalInteger(
    environment,
    "NATIVE_OKF_MAX_CONCURRENT_PER_INVITE",
    1,
    1,
    100,
  );
  const sharedQuotaControls = {
    requestsPerMinute,
    cooldownSeconds,
    maxConcurrent,
  };

  const testQuotas = quotaProfile(
    environment,
    "NATIVE_OKF_TEST",
    {
      dailyQuestions: 20,
      dailyDiagrams: 5,
      totalQuestions: 100,
      totalDiagrams: 25,
    },
    sharedQuotaControls,
  );
  const inviteDefaultQuotas = quotaProfile(
    environment,
    "NATIVE_OKF_INVITE",
    {
      dailyQuestions: 12,
      dailyDiagrams: 3,
      totalQuestions: 25,
      totalDiagrams: 8,
    },
    sharedQuotaControls,
  );
  validateQuotaConsistency(testQuotas, "Test");
  validateQuotaConsistency(inviteDefaultQuotas, "Invite");

  const dailyBudgetKey =
    accessMode === "test"
      ? "NATIVE_OKF_TEST_HARD_DAILY_USD"
      : "NATIVE_OKF_HARD_DAILY_USD";
  const monthlyBudgetKey =
    accessMode === "test"
      ? "NATIVE_OKF_TEST_HARD_MONTHLY_USD"
      : "NATIVE_OKF_HARD_MONTHLY_USD";
  const applicationBudgets: ApplicationBudgetLimits = {
    dailyMicrodollars: optionalUsd(
      environment,
      dailyBudgetKey,
      accessMode === "test" ? "2.00" : "3.00",
    ),
    monthlyMicrodollars: optionalUsd(
      environment,
      monthlyBudgetKey,
      accessMode === "test" ? "8.00" : "20.00",
    ),
    maxGlobalConcurrent: optionalInteger(
      environment,
      "NATIVE_OKF_MAX_GLOBAL_CONCURRENT",
      3,
      1,
      1_000,
    ),
  };
  if (applicationBudgets.dailyMicrodollars > applicationBudgets.monthlyMicrodollars) {
    throw new NativeOkfAccessConfigurationError(
      "The daily hard budget cannot exceed the monthly hard budget.",
    );
  }

  const textRequestReserveMicrodollars = optionalUsd(
    environment,
    "NATIVE_OKF_TEXT_REQUEST_RESERVE_USD",
    "0.08",
  );
  const diagramRequestReserveMicrodollars = optionalUsd(
    environment,
    "NATIVE_OKF_DIAGRAM_REQUEST_RESERVE_USD",
    "0.18",
  );
  if (
    paidModeEnabled &&
    (textRequestReserveMicrodollars <= 0 ||
      diagramRequestReserveMicrodollars <= 0)
  ) {
    throw new NativeOkfAccessConfigurationError(
      "Paid native OKF chat requires positive text and diagram request reserves.",
    );
  }
  if (
    paidModeEnabled &&
    diagramRequestReserveMicrodollars < textRequestReserveMicrodollars
  ) {
    throw new NativeOkfAccessConfigurationError(
      "The diagram request reserve cannot be lower than the text request reserve.",
    );
  }

  const pricing = {
    inputMicrodollarsPerMillion: optionalPrice(
      environment,
      "OPENAI_INPUT_USD_PER_MILLION",
      paidModeEnabled,
    ),
    cachedInputMicrodollarsPerMillion: optionalPrice(
      environment,
      "OPENAI_CACHED_INPUT_USD_PER_MILLION",
      paidModeEnabled,
    ),
    outputMicrodollarsPerMillion: optionalPrice(
      environment,
      "OPENAI_OUTPUT_USD_PER_MILLION",
      paidModeEnabled,
    ),
  };
  if (
    paidModeEnabled &&
    Object.values(pricing).some(
      (microdollarsPerMillion) => microdollarsPerMillion <= 0,
    )
  ) {
    throw new NativeOkfAccessConfigurationError(
      "All configured OpenAI prices must be greater than zero while paid chat is enabled.",
    );
  }
  const trustedProxy = readTrustedProxy(environment);
  const publicOrigin = readPublicOrigin(
    environment,
    paidModeEnabled || hasAnyAdminSecret,
    production && (paidModeEnabled || hasAnyAdminSecret),
  );
  const researcherSessionMaxAgeSeconds =
    optionalInteger(
      environment,
      "NATIVE_OKF_RESEARCHER_SESSION_HOURS",
      24,
      1,
      336,
    ) * 3_600;
  const adminSessionMaxAgeSeconds =
    optionalInteger(
      environment,
      "NATIVE_OKF_ADMIN_SESSION_MINUTES",
      30,
      1,
      120,
    ) * 60;
  const reservationTtlMs =
    optionalInteger(
      environment,
      "NATIVE_OKF_RESERVATION_TTL_SECONDS",
      1_800,
      60,
      3_600,
    ) * 1_000;
  const adminMutationsPerMinute = optionalInteger(
    environment,
    "NATIVE_OKF_ADMIN_MUTATIONS_PER_MINUTE",
    10,
    1,
    1_000,
  );
  return {
    chatEnabled,
    accessMode,
    durableStoreRequired: accessMode === "invite",
    usageDbPath:
      environment.NATIVE_OKF_USAGE_DB_PATH?.trim() ||
      "runtime/native-okf-usage.sqlite",
    sessionSecret,
    inviteHashSecret,
    testAccessCode,
    adminAccessCode,
    adminSessionSecret,
    trustedProxy,
    publicOrigin,
    adminConfigured: hasAnyAdminSecret,
    testQuotas,
    inviteDefaultQuotas,
    applicationBudgets,
    globalRequestsPerMinute: optionalInteger(
      environment,
      "NATIVE_OKF_GLOBAL_RPM",
      12,
      1,
      100_000,
    ),
    ipRequestsPerHour: optionalInteger(
      environment,
      "NATIVE_OKF_IP_REQUESTS_PER_HOUR",
      60,
      1,
      1_000_000,
    ),
    textRequestReserveMicrodollars,
    diagramRequestReserveMicrodollars,
    pricing,
    inviteDefaultValidDays: optionalInteger(
      environment,
      "NATIVE_OKF_INVITE_DEFAULT_VALID_DAYS",
      14,
      1,
      365,
    ),
    researcherSessionMaxAgeSeconds,
    adminSessionMaxAgeSeconds,
    reservationTtlMs,
    adminMutationsPerMinute,
  };
}
