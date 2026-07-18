import "server-only";

import { pathToFileURL } from "node:url";

import type { NativeOkfAccessConfig } from "../src/native-okf/server/access/config.ts";
import {
  generateInvitationCode,
  generateInvitationId,
  hashInvitationCode,
} from "../src/native-okf/server/access/crypto.ts";
import { normalizeNativeOkfAdministrativeLabel } from "../src/native-okf/server/access/labels.ts";
import { readNativeOkfAccessRuntimeConfig } from "../src/native-okf/server/access/runtime.ts";
import { getNativeOkfOperationalStore } from "../src/native-okf/server/access/store-singleton.ts";
import type { NativeOkfOperationalStore } from "../src/native-okf/server/access/store.ts";
import type {
  InvitationPatch,
  QuotaLimits,
  SafeInvitationRecord,
} from "../src/native-okf/server/access/types.ts";

type CreateOptions = {
  label: string;
  validDays?: number;
  dailyQuestions?: number;
  dailyDiagrams?: number;
  totalQuestions?: number;
  totalDiagrams?: number;
  requestsPerMinute?: number;
  cooldownSeconds?: number;
  maxConcurrent?: number;
};

type UpdateOptions = {
  id: string;
  label?: string;
  extendDays?: number;
  dailyQuestions?: number;
  dailyDiagrams?: number;
  remainingQuestions?: number;
  remainingDiagrams?: number;
  requestsPerMinute?: number;
  cooldownSeconds?: number;
  maxConcurrent?: number;
};

export type NativeOkfAccessAdminCommand =
  | { kind: "create"; options: CreateOptions }
  | { kind: "list" }
  | { kind: "update"; options: UpdateOptions }
  | { kind: "revoke"; id: string }
  | { kind: "usage"; json: boolean }
  | { kind: "pause" }
  | { kind: "resume" }
  | { kind: "cleanup" };

export interface NativeOkfAccessAdminDependencies {
  config: NativeOkfAccessConfig;
  store: NativeOkfOperationalStore;
  nowMs: () => number;
  randomCode: () => string;
  randomId: () => string;
  output: (text: string) => void;
}

const VALUE_OPTIONS = new Set([
  "--id",
  "--label",
  "--valid-days",
  "--extend-days",
  "--daily-questions",
  "--daily-diagrams",
  "--total-questions",
  "--total-diagrams",
  "--remaining-questions",
  "--remaining-diagrams",
  "--rpm",
  "--cooldown-seconds",
  "--concurrency",
]);

function parseOptions(tokens: string[], allowJson = false): Map<string, string> {
  const options = new Map<string, string>();
  for (let index = 0; index < tokens.length; index += 1) {
    const key = tokens[index];
    if (allowJson && key === "--json") {
      if (options.has(key)) throw new Error("--json may be supplied only once.");
      options.set(key, "true");
      continue;
    }
    if (!VALUE_OPTIONS.has(key)) throw new Error(`Unknown option: ${key}`);
    if (options.has(key)) throw new Error(`${key} may be supplied only once.`);
    const value = tokens[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`${key} requires a value.`);
    }
    options.set(key, value);
    index += 1;
  }
  return options;
}

function requiredString(
  options: Map<string, string>,
  key: string,
  maximumLength: number,
): string {
  const value = options.get(key)?.trim();
  if (!value) throw new Error(`${key} is required.`);
  if (value.length > maximumLength) {
    throw new Error(`${key} must contain at most ${maximumLength} characters.`);
  }
  return value;
}

function optionalInteger(
  options: Map<string, string>,
  key: string,
  minimum: number,
  maximum: number,
): number | undefined {
  const value = options.get(key);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${key} must be an integer between ${minimum} and ${maximum}.`);
  }
  return parsed;
}

function assertOnly(options: Map<string, string>, allowed: string[]): void {
  const permitted = new Set(allowed);
  for (const key of options.keys()) {
    if (!permitted.has(key)) throw new Error(`${key} is not valid for this command.`);
  }
}

export function parseNativeOkfAccessAdminArgs(
  argv: string[],
): NativeOkfAccessAdminCommand {
  const [command, ...tokens] = argv;
  if (!command) throw new Error("An administrative command is required.");
  const options = parseOptions(tokens, command === "usage");

  if (command === "create") {
    assertOnly(options, [
      "--label",
      "--valid-days",
      "--daily-questions",
      "--daily-diagrams",
      "--total-questions",
      "--total-diagrams",
      "--rpm",
      "--cooldown-seconds",
      "--concurrency",
    ]);
    return {
      kind: "create",
      options: {
        label: requiredNeutralLabel(options, "--label"),
        validDays: optionalInteger(options, "--valid-days", 1, 365),
        dailyQuestions: optionalInteger(options, "--daily-questions", 1, 1_000_000),
        dailyDiagrams: optionalInteger(options, "--daily-diagrams", 0, 1_000_000),
        totalQuestions: optionalInteger(options, "--total-questions", 1, 1_000_000),
        totalDiagrams: optionalInteger(options, "--total-diagrams", 0, 1_000_000),
        requestsPerMinute: optionalInteger(options, "--rpm", 1, 10_000),
        cooldownSeconds: optionalInteger(options, "--cooldown-seconds", 0, 3_600),
        maxConcurrent: optionalInteger(options, "--concurrency", 1, 100),
      },
    };
  }
  if (command === "list") {
    assertOnly(options, []);
    return { kind: "list" };
  }
  if (command === "update") {
    assertOnly(options, [
      "--id",
      "--label",
      "--extend-days",
      "--daily-questions",
      "--daily-diagrams",
      "--remaining-questions",
      "--remaining-diagrams",
      "--rpm",
      "--cooldown-seconds",
      "--concurrency",
    ]);
    const parsed: UpdateOptions = {
      id: requiredString(options, "--id", 128),
      label: optionalNeutralLabel(options, "--label"),
      extendDays: optionalInteger(options, "--extend-days", 1, 3_650),
      dailyQuestions: optionalInteger(options, "--daily-questions", 1, 1_000_000),
      dailyDiagrams: optionalInteger(options, "--daily-diagrams", 0, 1_000_000),
      remainingQuestions: optionalInteger(
        options,
        "--remaining-questions",
        0,
        1_000_000,
      ),
      remainingDiagrams: optionalInteger(
        options,
        "--remaining-diagrams",
        0,
        1_000_000,
      ),
      requestsPerMinute: optionalInteger(options, "--rpm", 1, 10_000),
      cooldownSeconds: optionalInteger(options, "--cooldown-seconds", 0, 3_600),
      maxConcurrent: optionalInteger(options, "--concurrency", 1, 100),
    };
    if (Object.values(parsed).filter((value) => value !== undefined).length === 1) {
      throw new Error("The update command requires at least one change.");
    }
    return { kind: "update", options: parsed };
  }
  if (command === "revoke") {
    assertOnly(options, ["--id"]);
    return { kind: "revoke", id: requiredString(options, "--id", 128) };
  }
  if (command === "usage") {
    assertOnly(options, ["--json"]);
    return { kind: "usage", json: options.has("--json") };
  }
  if (["pause", "resume", "cleanup"].includes(command)) {
    assertOnly(options, []);
    return { kind: command as "pause" | "resume" | "cleanup" };
  }
  throw new Error(`Unknown administrative command: ${command}`);
}

function inviteSecret(config: NativeOkfAccessConfig): string {
  const secret = config.inviteHashSecret;
  if (!secret || secret.length < 32) {
    throw new Error(
      "NATIVE_OKF_INVITE_HASH_SECRET must be configured for invitation administration.",
    );
  }
  return secret;
}

function validateGeneratedCode(code: string): void {
  let bytes: Buffer;
  try {
    bytes = Buffer.from(code, "base64url");
  } catch {
    throw new Error("Invitation code generation failed.");
  }
  if (bytes.byteLength < 24) {
    throw new Error("Invitation codes must contain at least 192 bits of entropy.");
  }
}

function quotasFromCreate(
  defaults: QuotaLimits,
  options: CreateOptions,
): QuotaLimits {
  return {
    dailyQuestions: options.dailyQuestions ?? defaults.dailyQuestions,
    dailyDiagrams: options.dailyDiagrams ?? defaults.dailyDiagrams,
    totalQuestions: options.totalQuestions ?? defaults.totalQuestions,
    totalDiagrams: options.totalDiagrams ?? defaults.totalDiagrams,
    requestsPerMinute:
      options.requestsPerMinute ?? defaults.requestsPerMinute,
    cooldownSeconds: options.cooldownSeconds ?? defaults.cooldownSeconds,
    maxConcurrent: options.maxConcurrent ?? defaults.maxConcurrent,
  };
}

function invitationLine(invitation: SafeInvitationRecord, nowMs: number): string {
  const expiry = new Date(invitation.expiresAtMs).toISOString();
  const snapshotStatus = invitation.status;
  return [
    invitation.id,
    invitation.label,
    snapshotStatus,
    `expires=${expiry}`,
    `questions=${invitation.questionsUsedTotal}/${invitation.quotas.totalQuestions}`,
    `diagrams=${invitation.diagramsUsedTotal}/${invitation.quotas.totalDiagrams}`,
    `asOf=${new Date(nowMs).toISOString()}`,
  ].join(" | ");
}

function audit(
  dependencies: NativeOkfAccessAdminDependencies,
  action: string,
  targetInvitationId: string | null,
  nowMs: number,
): void {
  dependencies.store.recordAdminAudit({
    id: dependencies.randomId(),
    createdAtMs: nowMs,
    action,
    targetInvitationId,
    outcomeCategory: "success",
  });
}

export function executeNativeOkfAccessAdmin(
  command: NativeOkfAccessAdminCommand,
  dependencies: NativeOkfAccessAdminDependencies,
): void {
  const nowMs = dependencies.nowMs();
  if (command.kind === "create") {
    const secret = inviteSecret(dependencies.config);
    const code = dependencies.randomCode();
    validateGeneratedCode(code);
    const id = dependencies.randomId();
    const validDays =
      command.options.validDays ?? dependencies.config.inviteDefaultValidDays;
    const created = dependencies.store.createInvitation({
      id,
      codeHash: hashInvitationCode(code, secret),
      label: command.options.label,
      createdAtMs: nowMs,
      expiresAtMs: nowMs + validDays * 86_400_000,
      quotas: quotasFromCreate(
        dependencies.config.inviteDefaultQuotas,
        command.options,
      ),
    });
    audit(dependencies, "invite-create", created.id, nowMs);
    dependencies.output(
      [
        `Created invitation ${created.id} (${created.label}).`,
        `Invitation code (shown once): ${code}`,
        `Expires: ${new Date(created.expiresAtMs).toISOString()}`,
      ].join("\n") + "\n",
    );
    return;
  }

  if (command.kind === "list") {
    inviteSecret(dependencies.config);
    const invitations = dependencies.store.listInvitations(nowMs);
    dependencies.output(
      invitations.length === 0
        ? "No invitations.\n"
        : invitations.map((item) => invitationLine(item, nowMs)).join("\n") +
            "\n",
    );
    return;
  }

  if (command.kind === "update") {
    inviteSecret(dependencies.config);
    const existing = dependencies.store.getInvitation(command.options.id);
    if (!existing) throw new Error("Invitation not found.");
    const totalQuestions =
      command.options.remainingQuestions === undefined
        ? undefined
        : existing.questionsUsedTotal + command.options.remainingQuestions;
    const totalDiagrams =
      command.options.remainingDiagrams === undefined
        ? undefined
        : existing.diagramsUsedTotal + command.options.remainingDiagrams;
    const patch: InvitationPatch = {
      label: command.options.label,
      expiresAtMs:
        command.options.extendDays === undefined
          ? undefined
          : Math.max(nowMs, existing.expiresAtMs) +
            command.options.extendDays * 86_400_000,
      dailyQuestions:
        command.options.dailyQuestions ??
        (totalQuestions === undefined
          ? undefined
          : Math.min(existing.quotas.dailyQuestions, totalQuestions)),
      dailyDiagrams:
        command.options.dailyDiagrams ??
        (totalDiagrams === undefined
          ? undefined
          : Math.min(existing.quotas.dailyDiagrams, totalDiagrams)),
      totalQuestions,
      totalDiagrams,
      requestsPerMinute: command.options.requestsPerMinute,
      cooldownSeconds: command.options.cooldownSeconds,
      maxConcurrent: command.options.maxConcurrent,
    };
    const updated = dependencies.store.updateInvitation(existing.id, patch, nowMs);
    if (!updated) throw new Error("Invitation not found.");
    audit(dependencies, "invite-update", updated.id, nowMs);
    dependencies.output(`Updated invitation ${updated.id} (${updated.label}).\n`);
    return;
  }

  if (command.kind === "revoke") {
    inviteSecret(dependencies.config);
    const revoked = dependencies.store.revokeInvitation(command.id, nowMs);
    if (!revoked) throw new Error("Invitation not found.");
    audit(dependencies, "invite-revoke", revoked.id, nowMs);
    dependencies.output(`Revoked invitation ${revoked.id}.\n`);
    return;
  }

  if (command.kind === "usage") {
    const report = dependencies.store.getUsageReport(nowMs);
    if (command.json) {
      dependencies.output(JSON.stringify(report, null, 2) + "\n");
    } else {
      dependencies.output(
        [
          `Usage as of ${new Date(nowMs).toISOString()}`,
          `Estimated today: ${report.estimatedMicrodollarsToday} microdollars`,
          `Estimated month: ${report.estimatedMicrodollarsThisMonth} microdollars`,
          `Questions today: ${report.questionsToday}`,
          `Diagrams today: ${report.diagramsToday}`,
          `Model calls today: ${report.modelCallsToday}`,
          `Active reservations: ${report.activeReservations}`,
          `Unreconciled events: ${report.unreconciledUsageEvents}`,
        ].join("\n") + "\n",
      );
    }
    return;
  }

  if (command.kind === "pause" || command.kind === "resume") {
    const paused = command.kind === "pause";
    dependencies.store.setOperationalPause(paused, nowMs);
    audit(dependencies, paused ? "operational-pause" : "operational-resume", null, nowMs);
    dependencies.output(`Native OKF paid chat ${paused ? "paused" : "resumed"}.\n`);
    return;
  }

  const result = dependencies.store.cleanupStaleReservations(nowMs);
  audit(dependencies, "reservation-cleanup", null, nowMs);
  dependencies.output(
    `Settled ${result.settledReservationIds.length} stale reservation(s); ` +
      `charged ${result.chargedMicrodollars} microdollars.\n`,
  );
}

function isDirectExecution(): boolean {
  const entry = process.argv[1];
  return Boolean(entry && import.meta.url === pathToFileURL(entry).href);
}

function main(): void {
  const command = parseNativeOkfAccessAdminArgs(process.argv.slice(2));
  const config = readNativeOkfAccessRuntimeConfig();
  const store = getNativeOkfOperationalStore(config);
  try {
    executeNativeOkfAccessAdmin(command, {
      config,
      store,
      nowMs: Date.now,
      randomCode: generateInvitationCode,
      randomId: generateInvitationId,
      output: (text) => process.stdout.write(text),
    });
  } finally {
    store.close();
  }
}

if (isDirectExecution()) {
  try {
    main();
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Administrative command failed."}\n`,
    );
    process.exitCode = 1;
  }
}

function requiredNeutralLabel(
  options: Map<string, string>,
  key: string,
): string {
  const label = normalizeNativeOkfAdministrativeLabel(
    requiredString(options, key, 120),
  );
  if (!label) {
    throw new Error(
      `${key} must be a neutral label using letters, digits, spaces, periods, underscores, or hyphens.`,
    );
  }
  return label;
}

function optionalNeutralLabel(
  options: Map<string, string>,
  key: string,
): string | undefined {
  return options.has(key) ? requiredNeutralLabel(options, key) : undefined;
}

