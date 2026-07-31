import "server-only";


import { timingSafeHashEqual } from "./crypto.ts";
import { assertNativeOkfAdministrativeLabel } from "./labels.ts";
import type { NativeOkfOperationalStore, SubjectQuotaSnapshotInput } from "./store.ts";
import {
  assertNonNegativeSafeInteger,
  assertSafeCategory,
  nextUtcDayStartMs,
  utcDayKey,
  utcMonthKey,
} from "./store-utils.ts";
import {
  invitationStatus,
  type AbuseAttemptInput,
  type AbuseDecision,
  type ActiveReservation,
  type AdminAuditInput,
  type AdminAuditRecord,
  type ApplicationBudgetLimits,
  type CreateInvitationInput,
  type DashboardSnapshot,
  type DailyUsageAggregate,
  type InvitationDashboardRow,
  type InvitationPatch,
  type InvitationRecord,
  type QuotaLimits,
  type ReservationBudgetIncreaseDecision,
  type ReservationBudgetIncreaseRequest,
  type ReservationDecision,
  type ReservationReconciliation,
  type ReservationRequest,
  type ReleaseReservationInput,
  type SafeInvitationRecord,
  type StaleReservationCleanupResult,
  type SubjectQuotaSnapshot,
  type UsageEvent,
  type UsageReport,
} from "./types.ts";

const RECENT_ERROR_WINDOW_MS = 7 * 86_400_000;

interface MutableCounter {
  questions: number;
  diagrams: number;
  microdollars: number;
  lastUsedAtMs: number | null;
}

interface DailyCounter {
  questions: number;
  diagrams: number;
}

interface StoredReservation extends ActiveReservation {
  questionCounted: boolean;
  diagramCounted: boolean;
}

interface RateEvent {
  subjectId: string;
  createdAtMs: number;
}

interface AbuseEvent {
  ipSubject: string;
  createdAtMs: number;
}

function cloneQuotas(quotas: QuotaLimits): QuotaLimits {
  return { ...quotas };
}

function validateQuotas(quotas: QuotaLimits): void {
  for (const [name, value] of Object.entries(quotas)) {
    assertNonNegativeSafeInteger(value, name);
  }
  if (quotas.requestsPerMinute < 1 || quotas.maxConcurrent < 1) {
    throw new Error("Rate and concurrency limits must be positive.");
  }
  if (quotas.dailyQuestions > quotas.totalQuestions) {
    throw new Error("Daily question quota cannot exceed total question quota.");
  }
  if (quotas.dailyDiagrams > quotas.totalDiagrams) {
    throw new Error("Daily diagram quota cannot exceed total diagram quota.");
  }
}

function validateInvitationInput(input: CreateInvitationInput): void {
  if (!input.id || input.id.length > 128) throw new Error("Invalid invitation ID.");
  if (!/^[a-f\d]{64}$/i.test(input.codeHash)) {
    throw new Error("Invitation code hash must be an HMAC-SHA-256 hex digest.");
  }
  assertNativeOkfAdministrativeLabel(input.label);
  assertNonNegativeSafeInteger(input.createdAtMs, "createdAtMs");
  assertNonNegativeSafeInteger(input.expiresAtMs, "expiresAtMs");
  if (input.expiresAtMs <= input.createdAtMs) {
    throw new Error("Invitation expiry must follow creation time.");
  }
  validateQuotas(input.quotas);
}

export class MemoryNativeOkfOperationalStore implements NativeOkfOperationalStore {
  readonly kind = "memory" as const;

  private readonly invitations = new Map<string, InvitationRecord>();
  private readonly totals = new Map<string, MutableCounter>();
  private readonly daily = new Map<string, DailyCounter>();
  private readonly reservations = new Map<string, StoredReservation>();
  private readonly usageEvents: UsageEvent[] = [];
  private readonly paidRateEvents: RateEvent[] = [];
  private readonly abuseEvents: AbuseEvent[] = [];
  private readonly audits: AdminAuditRecord[] = [];
  private operationalPaused = false;

  initialize(): void {}
  close(): void {}

  private dailyKey(subjectId: string, nowMs: number): string {
    return `${subjectId}\0${utcDayKey(nowMs)}`;
  }

  private getTotals(subjectId: string): MutableCounter {
    let counter = this.totals.get(subjectId);
    if (!counter) {
      counter = { questions: 0, diagrams: 0, microdollars: 0, lastUsedAtMs: null };
      this.totals.set(subjectId, counter);
    }
    return counter;
  }

  private getDaily(subjectId: string, nowMs: number): DailyCounter {
    const key = this.dailyKey(subjectId, nowMs);
    let counter = this.daily.get(key);
    if (!counter) {
      counter = { questions: 0, diagrams: 0 };
      this.daily.set(key, counter);
    }
    return counter;
  }

  private hydrateInvitation(record: InvitationRecord): InvitationRecord {
    const totals = this.getTotals(record.id);
    return {
      ...record,
      quotas: cloneQuotas(record.quotas),
      questionsUsedTotal: totals.questions,
      diagramsUsedTotal: totals.diagrams,
      attributedMicrodollars: totals.microdollars,
      lastUsedAtMs: totals.lastUsedAtMs,
    };
  }

  private safeInvitation(
    record: InvitationRecord,
    nowMs: number,
  ): SafeInvitationRecord {
    const hydrated = this.hydrateInvitation(record);
    return {
      id: hydrated.id,
      label: hydrated.label,
      createdAtMs: hydrated.createdAtMs,
      expiresAtMs: hydrated.expiresAtMs,
      revokedAtMs: hydrated.revokedAtMs,
      quotas: hydrated.quotas,
      questionsUsedTotal: hydrated.questionsUsedTotal,
      diagramsUsedTotal: hydrated.diagramsUsedTotal,
      attributedMicrodollars: hydrated.attributedMicrodollars,
      lastUsedAtMs: hydrated.lastUsedAtMs,
      status: invitationStatus(record, nowMs),
    };
  }

  createInvitation(input: CreateInvitationInput): InvitationRecord {
    validateInvitationInput(input);
    if (this.invitations.has(input.id)) throw new Error("Invitation ID already exists.");
    for (const invitation of this.invitations.values()) {
      if (invitation.codeHash === input.codeHash) {
        throw new Error("Invitation code hash already exists.");
      }
    }
    const record: InvitationRecord = {
      ...input,
      label: assertNativeOkfAdministrativeLabel(input.label),
      revokedAtMs: null,
      quotas: cloneQuotas(input.quotas),
      questionsUsedTotal: 0,
      diagramsUsedTotal: 0,
      attributedMicrodollars: 0,
      lastUsedAtMs: null,
    };
    this.invitations.set(record.id, record);
    return this.hydrateInvitation(record);
  }

  findInvitationByCodeHash(codeHash: string): InvitationRecord | null {
    for (const invitation of this.invitations.values()) {
      if (timingSafeHashEqual(invitation.codeHash, codeHash)) {
        return this.hydrateInvitation(invitation);
      }
    }
    return null;
  }

  getInvitation(id: string): InvitationRecord | null {
    const invitation = this.invitations.get(id);
    return invitation ? this.hydrateInvitation(invitation) : null;
  }

  listInvitations(nowMs: number): SafeInvitationRecord[] {
    return [...this.invitations.values()]
      .sort((left, right) => left.createdAtMs - right.createdAtMs || left.id.localeCompare(right.id))
      .map((invitation) => this.safeInvitation(invitation, nowMs));
  }

  updateInvitation(
    id: string,
    patch: InvitationPatch,
    nowMs: number,
  ): SafeInvitationRecord | null {
    const invitation = this.invitations.get(id);
    if (!invitation) return null;
    const daily = this.getDaily(id, nowMs);
    const totals = this.getTotals(id);
    const nextQuotas: QuotaLimits = {
      dailyQuestions: patch.dailyQuestions ?? invitation.quotas.dailyQuestions,
      dailyDiagrams: patch.dailyDiagrams ?? invitation.quotas.dailyDiagrams,
      totalQuestions: patch.totalQuestions ?? invitation.quotas.totalQuestions,
      totalDiagrams: patch.totalDiagrams ?? invitation.quotas.totalDiagrams,
      requestsPerMinute: patch.requestsPerMinute ?? invitation.quotas.requestsPerMinute,
      cooldownSeconds: patch.cooldownSeconds ?? invitation.quotas.cooldownSeconds,
      maxConcurrent: patch.maxConcurrent ?? invitation.quotas.maxConcurrent,
    };
    validateQuotas(nextQuotas);
    if (
      nextQuotas.dailyQuestions < daily.questions ||
      nextQuotas.dailyDiagrams < daily.diagrams ||
      nextQuotas.totalQuestions < totals.questions ||
      nextQuotas.totalDiagrams < totals.diagrams
    ) {
      throw new Error("Quota cannot be reduced below already reserved or used units.");
    }
    if (patch.expiresAtMs !== undefined && patch.expiresAtMs < invitation.expiresAtMs) {
      throw new Error("Invitation expiry may only be extended.");
    }
    const nextLabel =
      patch.label === undefined
        ? invitation.label
        : assertNativeOkfAdministrativeLabel(patch.label);
    invitation.label = nextLabel;
    invitation.expiresAtMs = patch.expiresAtMs ?? invitation.expiresAtMs;
    invitation.quotas = nextQuotas;
    return this.safeInvitation(invitation, nowMs);
  }

  revokeInvitation(id: string, revokedAtMs: number): SafeInvitationRecord | null {
    const invitation = this.invitations.get(id);
    if (!invitation) return null;
    assertNonNegativeSafeInteger(revokedAtMs, "revokedAtMs");
    invitation.revokedAtMs ??= revokedAtMs;
    return this.safeInvitation(invitation, revokedAtMs);
  }

  getSubjectQuotaSnapshot(input: SubjectQuotaSnapshotInput): SubjectQuotaSnapshot {
    const totals = this.getTotals(input.subjectId);
    const daily = this.getDaily(input.subjectId, input.nowMs);
    return {
      subjectId: input.subjectId,
      utcDay: utcDayKey(input.nowMs),
      questionsUsedToday: daily.questions,
      diagramsUsedToday: daily.diagrams,
      questionsUsedTotal: totals.questions,
      diagramsUsedTotal: totals.diagrams,
      questionsRemainingToday: Math.max(0, input.limits.dailyQuestions - daily.questions),
      diagramsRemainingToday: Math.max(0, input.limits.dailyDiagrams - daily.diagrams),
      questionsRemainingTotal: Math.max(0, input.limits.totalQuestions - totals.questions),
      diagramsRemainingTotal: Math.max(0, input.limits.totalDiagrams - totals.diagrams),
      resetAtMs: nextUtcDayStartMs(input.nowMs),
      accessExpiresAtMs: input.accessExpiresAtMs,
    };
  }

  checkAndRecordAbuseAttempt(input: AbuseAttemptInput): AbuseDecision {
    if (!/^[a-f\d]{64}$/i.test(input.ipSubject)) {
      throw new Error("Only a hashed IP subject may be stored.");
    }
    const minuteStart = input.nowMs - 60_000;
    const hourStart = input.nowMs - 3_600_000;
    const firstRecentIndex = this.abuseEvents.findIndex(
      (event) => event.createdAtMs >= hourStart,
    );
    if (firstRecentIndex === -1) this.abuseEvents.length = 0;
    else if (firstRecentIndex > 0) this.abuseEvents.splice(0, firstRecentIndex);
    const globalCount = this.abuseEvents.filter(
      (event) => event.createdAtMs > minuteStart,
    ).length;
    const ipCount = this.abuseEvents.filter(
      (event) => event.ipSubject === input.ipSubject && event.createdAtMs > hourStart,
    ).length;
    this.abuseEvents.push({ ipSubject: input.ipSubject, createdAtMs: input.nowMs });
    if (globalCount >= input.globalRequestsPerMinute) {
      return { allowed: false, reason: "global-rpm", retryAfterMs: 60_000 };
    }
    if (ipCount >= input.ipRequestsPerHour) {
      return { allowed: false, reason: "ip-hourly", retryAfterMs: 3_600_000 };
    }
    return { allowed: true };
  }

  reservePaidRequest(input: ReservationRequest): ReservationDecision {
    if (this.operationalPaused) return { allowed: false, reason: "operational-pause" };
    if (input.accessExpiresAtMs <= input.nowMs) return { allowed: false, reason: "expired" };
    if (this.reservations.has(input.reservationId)) {
      throw new Error("Reservation ID already exists.");
    }
    assertNonNegativeSafeInteger(input.reserveMicrodollars, "reserveMicrodollars");
    validateQuotas(input.subjectLimits);

    if (input.subjectKind === "invite") {
      const invitation = input.invitationId
        ? this.invitations.get(input.invitationId)
        : undefined;
      if (!invitation || invitation.id !== input.subjectId) {
        return { allowed: false, reason: "revoked" };
      }
      const status = invitationStatus(invitation, input.nowMs);
      if (status === "revoked") return { allowed: false, reason: "revoked" };
      if (status === "expired") return { allowed: false, reason: "expired" };
    }

    const oneMinuteAgo = input.nowMs - 60_000;
    for (let index = this.paidRateEvents.length - 1; index >= 0; index -= 1) {
      if (this.paidRateEvents[index].createdAtMs <= oneMinuteAgo) {
        this.paidRateEvents.splice(index, 1);
      }
    }
    const recent = this.paidRateEvents.filter(
      (event) => event.subjectId === input.subjectId && event.createdAtMs > oneMinuteAgo,
    );
    const latest = recent.reduce(
      (maximum, event) => Math.max(maximum, event.createdAtMs),
      Number.NEGATIVE_INFINITY,
    );
    const cooldownMs = input.subjectLimits.cooldownSeconds * 1_000;
    if (latest > Number.NEGATIVE_INFINITY && input.nowMs - latest < cooldownMs) {
      return {
        allowed: false,
        reason: "cooldown",
        retryAfterMs: cooldownMs - (input.nowMs - latest),
      };
    }
    if (recent.length >= input.subjectLimits.requestsPerMinute) {
      return { allowed: false, reason: "subject-rpm", retryAfterMs: 60_000 };
    }

    const active = [...this.reservations.values()].filter(
      (reservation) => reservation.status === "active",
    );
    if (
      active.filter((reservation) => reservation.subjectId === input.subjectId).length >=
      input.subjectLimits.maxConcurrent
    ) {
      return { allowed: false, reason: "subject-concurrency" };
    }
    if (active.length >= input.applicationLimits.maxGlobalConcurrent) {
      return { allowed: false, reason: "global-concurrency" };
    }

    const daily = this.getDaily(input.subjectId, input.nowMs);
    const totals = this.getTotals(input.subjectId);
    if (daily.questions + 1 > input.subjectLimits.dailyQuestions) {
      return { allowed: false, reason: "daily-question-quota" };
    }
    if (totals.questions + 1 > input.subjectLimits.totalQuestions) {
      return { allowed: false, reason: "total-question-quota" };
    }
    if (input.includeDiagram && daily.diagrams + 1 > input.subjectLimits.dailyDiagrams) {
      return { allowed: false, reason: "daily-diagram-quota" };
    }
    if (input.includeDiagram && totals.diagrams + 1 > input.subjectLimits.totalDiagrams) {
      return { allowed: false, reason: "total-diagram-quota" };
    }

    const day = utcDayKey(input.nowMs);
    const month = utcMonthKey(input.nowMs);
    const daySpent = this.usageEvents
      .filter((event) => utcDayKey(event.createdAtMs) === day)
      .reduce((sum, event) => sum + event.microdollars, 0);
    const monthSpent = this.usageEvents
      .filter((event) => utcMonthKey(event.createdAtMs) === month)
      .reduce((sum, event) => sum + event.microdollars, 0);
    const activeReserved = active.reduce(
      (sum, reservation) => sum + reservation.reservedMicrodollars,
      0,
    );
    if (
      daySpent + activeReserved + input.reserveMicrodollars >
      input.applicationLimits.dailyMicrodollars
    ) {
      return { allowed: false, reason: "daily-budget" };
    }
    if (
      monthSpent + activeReserved + input.reserveMicrodollars >
      input.applicationLimits.monthlyMicrodollars
    ) {
      return { allowed: false, reason: "monthly-budget" };
    }

    daily.questions += 1;
    totals.questions += 1;
    if (input.includeDiagram) {
      daily.diagrams += 1;
      totals.diagrams += 1;
    }
    totals.lastUsedAtMs = input.nowMs;
    const reservation: StoredReservation = {
      id: input.reservationId,
      subjectId: input.subjectId,
      subjectKind: input.subjectKind,
      invitationId: input.invitationId,
      createdAtMs: input.nowMs,
      expiresAtMs: input.expiresAtMs,
      questionUnits: 1,
      diagramUnits: input.includeDiagram ? 1 : 0,
      reservedMicrodollars: input.reserveMicrodollars,
      status: "active",
      questionCounted: true,
      diagramCounted: input.includeDiagram,
    };
    this.reservations.set(reservation.id, reservation);
    this.paidRateEvents.push({ subjectId: input.subjectId, createdAtMs: input.nowMs });
    return {
      allowed: true,
      reservation: { ...reservation },
      quota: this.getSubjectQuotaSnapshot({
        subjectId: input.subjectId,
        nowMs: input.nowMs,
        limits: input.subjectLimits,
        accessExpiresAtMs: input.accessExpiresAtMs,
      }),
    };
  }

  increaseReservationBudget(
    input: ReservationBudgetIncreaseRequest,
  ): ReservationBudgetIncreaseDecision {
    if (this.operationalPaused) {
      return { allowed: false, reason: "operational-pause" };
    }
    assertNonNegativeSafeInteger(
      input.requiredReservedMicrodollars,
      "requiredReservedMicrodollars",
    );
    const reservation = this.reservations.get(input.reservationId);
    if (!reservation || reservation.status !== "active") {
      throw new Error("Active reservation not found.");
    }
    if (
      input.requiredReservedMicrodollars <=
      reservation.reservedMicrodollars
    ) {
      return { allowed: true, reservation: { ...reservation } };
    }

    const day = utcDayKey(input.nowMs);
    const month = utcMonthKey(input.nowMs);
    const daySpent = this.usageEvents
      .filter((event) => utcDayKey(event.createdAtMs) === day)
      .reduce((sum, event) => sum + event.microdollars, 0);
    const monthSpent = this.usageEvents
      .filter((event) => utcMonthKey(event.createdAtMs) === month)
      .reduce((sum, event) => sum + event.microdollars, 0);
    const otherActiveReserved = [...this.reservations.values()]
      .filter(
        (candidate) =>
          candidate.status === "active" &&
          candidate.id !== reservation.id,
      )
      .reduce(
        (sum, candidate) => sum + candidate.reservedMicrodollars,
        0,
      );

    if (
      daySpent +
        otherActiveReserved +
        input.requiredReservedMicrodollars >
      input.applicationLimits.dailyMicrodollars
    ) {
      return { allowed: false, reason: "daily-budget" };
    }
    if (
      monthSpent +
        otherActiveReserved +
        input.requiredReservedMicrodollars >
      input.applicationLimits.monthlyMicrodollars
    ) {
      return { allowed: false, reason: "monthly-budget" };
    }

    reservation.reservedMicrodollars =
      input.requiredReservedMicrodollars;
    return { allowed: true, reservation: { ...reservation } };
  }

  getActiveReservation(id: string): ActiveReservation | null {
    const reservation = this.reservations.get(id);
    return reservation?.status === "active" ? { ...reservation } : null;
  }

  private decrementReservedQuota(reservation: StoredReservation, question: boolean, diagram: boolean): void {
    const totals = this.getTotals(reservation.subjectId);
    const daily = this.getDaily(reservation.subjectId, reservation.createdAtMs);
    if (question && reservation.questionCounted) {
      daily.questions = Math.max(0, daily.questions - 1);
      totals.questions = Math.max(0, totals.questions - 1);
      reservation.questionCounted = false;
    }
    if (diagram && reservation.diagramCounted) {
      daily.diagrams = Math.max(0, daily.diagrams - 1);
      totals.diagrams = Math.max(0, totals.diagrams - 1);
      reservation.diagramCounted = false;
    }
  }

  reconcileReservation(input: ReservationReconciliation): UsageEvent {
    const reservation = this.reservations.get(input.reservationId);
    if (!reservation || reservation.status !== "active") {
      throw new Error("Active reservation not found.");
    }
    for (const [name, value] of Object.entries(input.usage)) {
      assertNonNegativeSafeInteger(value, name);
    }
    assertNonNegativeSafeInteger(input.diagramModelCalls, "diagramModelCalls");
    if (typeof input.questionConsumed !== "boolean") {
      throw new Error("questionConsumed must be a boolean.");
    }
    if (typeof input.diagramDelivered !== "boolean") {
      throw new Error("diagramDelivered must be a boolean.");
    }
    if (input.diagramModelCalls > input.usage.modelCalls) {
      throw new Error("Diagram model calls cannot exceed total model calls.");
    }
    assertNonNegativeSafeInteger(input.actualMicrodollars, "actualMicrodollars");
    assertNonNegativeSafeInteger(input.latencyMs, "latencyMs");
    assertSafeCategory(input.outcomeCategory, "outcomeCategory");
    if (input.errorCategory !== null) assertSafeCategory(input.errorCategory, "errorCategory");

    this.decrementReservedQuota(
      reservation,
      !input.questionConsumed,
      !input.diagramDelivered,
    );
    reservation.status = "settled";
    const chargedMicrodollars = input.usageUnreconciled
      ? Math.max(input.actualMicrodollars, reservation.reservedMicrodollars)
      : input.actualMicrodollars;
    const totals = this.getTotals(reservation.subjectId);
    totals.microdollars += chargedMicrodollars;
    totals.lastUsedAtMs = input.completedAtMs;
    const event: UsageEvent = {
      id: `usage:${reservation.id}`,
      reservationId: reservation.id,
      subjectId: reservation.subjectId,
      invitationId: reservation.invitationId,
      createdAtMs: input.completedAtMs,
      ...input.usage,
      microdollars: chargedMicrodollars,
      latencyMs: input.latencyMs,
      outcomeCategory: input.outcomeCategory,
      errorCategory: input.errorCategory,
      usageUnreconciled: input.usageUnreconciled,
    };
    this.usageEvents.push(event);
    return { ...event };
  }

  releaseReservation(input: ReleaseReservationInput): boolean {
    const reservation = this.reservations.get(input.reservationId);
    if (!reservation || reservation.status !== "active") return false;
    assertSafeCategory(input.outcomeCategory, "outcomeCategory");
    if (input.errorCategory !== null) assertSafeCategory(input.errorCategory, "errorCategory");
    if (input.releaseQuota) {
      this.decrementReservedQuota(reservation, true, true);
      reservation.status = "released";
      return true;
    }

    // A paid attempt whose normal usage reconciliation failed must never become
    // free. Retain its quota and conservatively charge the complete allowance.
    reservation.status = "settled";
    const totals = this.getTotals(reservation.subjectId);
    totals.microdollars += reservation.reservedMicrodollars;
    totals.lastUsedAtMs = input.releasedAtMs;
    this.usageEvents.push({
      id: `unreconciled:${reservation.id}`,
      reservationId: reservation.id,
      subjectId: reservation.subjectId,
      invitationId: reservation.invitationId,
      createdAtMs: input.releasedAtMs,
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      modelCalls: 1,
      microdollars: reservation.reservedMicrodollars,
      latencyMs: Math.max(0, input.releasedAtMs - reservation.createdAtMs),
      outcomeCategory: input.outcomeCategory,
      errorCategory: input.errorCategory,
      usageUnreconciled: true,
    });
    return true;
  }

  cleanupStaleReservations(nowMs: number): StaleReservationCleanupResult {
    const settledReservationIds: string[] = [];
    let chargedMicrodollars = 0;
    for (const reservation of this.reservations.values()) {
      if (reservation.status !== "active" || reservation.expiresAtMs > nowMs) continue;
      reservation.status = "settled";
      settledReservationIds.push(reservation.id);
      chargedMicrodollars += reservation.reservedMicrodollars;
      const totals = this.getTotals(reservation.subjectId);
      totals.microdollars += reservation.reservedMicrodollars;
      totals.lastUsedAtMs = nowMs;
      this.usageEvents.push({
        id: `stale:${reservation.id}`,
        reservationId: reservation.id,
        subjectId: reservation.subjectId,
        invitationId: reservation.invitationId,
        createdAtMs: nowMs,
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        modelCalls: 0,
        microdollars: reservation.reservedMicrodollars,
        latencyMs: Math.max(0, nowMs - reservation.createdAtMs),
        outcomeCategory: "stale-reservation",
        errorCategory: "usage-unreconciled",
        usageUnreconciled: true,
      });
    }
    return { settledReservationIds, chargedMicrodollars };
  }

  getOperationalPause(): boolean {
    return this.operationalPaused;
  }

  setOperationalPause(paused: boolean, changedAtMs: number): void {
    void changedAtMs;
    this.operationalPaused = paused;
  }

  recordAdminAudit(input: AdminAuditInput): void {
    if (!input.id) throw new Error("Audit ID is required.");
    assertSafeCategory(input.action, "action");
    assertSafeCategory(input.outcomeCategory, "outcomeCategory");
    this.audits.push({ ...input });
  }

  listAdminAudit(limit: number): AdminAuditRecord[] {
    assertNonNegativeSafeInteger(limit, "limit");
    return [...this.audits]
      .sort((left, right) => right.createdAtMs - left.createdAtMs)
      .slice(0, Math.min(limit, 1_000))
      .map((audit) => ({ ...audit }));
  }

  getUsageReport(nowMs: number): UsageReport {
    const aggregates = new Map<string, DailyUsageAggregate>();
    for (const reservation of this.reservations.values()) {
      if (reservation.status === "released") continue;
      const day = utcDayKey(reservation.createdAtMs);
      const row = aggregates.get(day) ?? {
        utcDay: day,
        questions: 0,
        diagrams: 0,
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        modelCalls: 0,
        microdollars: 0,
      };
      if (reservation.questionCounted) row.questions += 1;
      if (reservation.diagramCounted) row.diagrams += 1;
      aggregates.set(day, row);
    }
    for (const event of this.usageEvents) {
      const day = utcDayKey(event.createdAtMs);
      const row = aggregates.get(day) ?? {
        utcDay: day,
        questions: 0,
        diagrams: 0,
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        modelCalls: 0,
        microdollars: 0,
      };
      row.inputTokens += event.inputTokens;
      row.cachedInputTokens += event.cachedInputTokens;
      row.outputTokens += event.outputTokens;
      row.modelCalls += event.modelCalls;
      row.microdollars += event.microdollars;
      aggregates.set(day, row);
    }
    const day = utcDayKey(nowMs);
    const month = utcMonthKey(nowMs);
    const active = [...this.reservations.values()].filter(
      (reservation) => reservation.status === "active",
    );
    const recentErrorStartMs = nowMs - RECENT_ERROR_WINDOW_MS;
    const recentErrors = new Map<string, number>();
    for (const event of this.usageEvents) {
      if (
        event.createdAtMs < recentErrorStartMs ||
        event.createdAtMs > nowMs
      ) {
        continue;
      }
      if (event.errorCategory) {
        recentErrors.set(
          event.errorCategory,
          (recentErrors.get(event.errorCategory) ?? 0) + 1,
        );
      }
    }
    return {
      generatedAtMs: nowMs,
      daily: [...aggregates.values()].sort((left, right) => left.utcDay.localeCompare(right.utcDay)),
      estimatedMicrodollarsToday: this.usageEvents
        .filter((event) => utcDayKey(event.createdAtMs) === day)
        .reduce((sum, event) => sum + event.microdollars, 0),
      estimatedMicrodollarsThisMonth: this.usageEvents
        .filter((event) => utcMonthKey(event.createdAtMs) === month)
        .reduce((sum, event) => sum + event.microdollars, 0),
      questionsToday: [...this.reservations.values()].filter(
        (reservation) =>
          reservation.status !== "released" &&
          reservation.questionCounted &&
          utcDayKey(reservation.createdAtMs) === day,
      ).length,
      diagramsToday: [...this.reservations.values()].filter(
        (reservation) =>
          reservation.status !== "released" &&
          reservation.diagramCounted &&
          utcDayKey(reservation.createdAtMs) === day,
      ).length,
      modelCallsToday: this.usageEvents
        .filter((event) => utcDayKey(event.createdAtMs) === day)
        .reduce((sum, event) => sum + event.modelCalls, 0),
      activeReservations: active.length,
      activeReservedMicrodollars: active.reduce(
        (sum, reservation) => sum + reservation.reservedMicrodollars,
        0,
      ),
      unreconciledUsageEvents: this.usageEvents.filter(
        (event) => event.usageUnreconciled,
      ).length,
      recentErrors: [...recentErrors.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category)),
    };
  }

  getDashboardSnapshot(
    nowMs: number,
    budgets: ApplicationBudgetLimits,
  ): DashboardSnapshot {
    const report = this.getUsageReport(nowMs);
    const invitations: InvitationDashboardRow[] = [...this.invitations.values()]
      .map((invitation) => ({
        ...this.safeInvitation(invitation, nowMs),
        quota: this.getSubjectQuotaSnapshot({
          subjectId: invitation.id,
          nowMs,
          limits: invitation.quotas,
          accessExpiresAtMs: invitation.expiresAtMs,
        }),
      }))
      .sort((left, right) => left.label.localeCompare(right.label) || left.id.localeCompare(right.id));
    return {
      ...report,
      operationalPaused: this.operationalPaused,
      remainingDailyMicrodollars: Math.max(
        0,
        budgets.dailyMicrodollars -
          report.estimatedMicrodollarsToday -
          report.activeReservedMicrodollars,
      ),
      remainingMonthlyMicrodollars: Math.max(
        0,
        budgets.monthlyMicrodollars -
          report.estimatedMicrodollarsThisMonth -
          report.activeReservedMicrodollars,
      ),
      invitations,
    };
  }
  /** Opaque persistence payload used only by the durable SQLite adapter. */
  exportDurableState(): string {
    return JSON.stringify({
      schemaVersion: 1,
      invitations: [...this.invitations.entries()],
      totals: [...this.totals.entries()],
      daily: [...this.daily.entries()],
      reservations: [...this.reservations.entries()],
      usageEvents: this.usageEvents,
      paidRateEvents: this.paidRateEvents,
      abuseEvents: this.abuseEvents,
      audits: this.audits,
      operationalPaused: this.operationalPaused,
    });
  }

  /** Restores only the adapter-owned, privacy-bounded operational state. */
  restoreDurableState(serialized: string): void {
    const parsed: unknown = JSON.parse(serialized);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Native OKF operational database state is malformed.");
    }
    const state = parsed as Record<string, unknown>;
    const entryArrays = [
      state.invitations,
      state.totals,
      state.daily,
      state.reservations,
    ];
    const valueArrays = [
      state.usageEvents,
      state.paidRateEvents,
      state.abuseEvents,
      state.audits,
    ];
    if (
      state.schemaVersion !== 1 ||
      entryArrays.some((value) => !Array.isArray(value)) ||
      valueArrays.some((value) => !Array.isArray(value)) ||
      typeof state.operationalPaused !== "boolean"
    ) {
      throw new Error(
        "Native OKF operational database state has an unsupported schema.",
      );
    }
    this.invitations.clear();
    this.totals.clear();
    this.daily.clear();
    this.reservations.clear();
    this.usageEvents.length = 0;
    this.paidRateEvents.length = 0;
    this.abuseEvents.length = 0;
    this.audits.length = 0;
    for (const [key, value] of state.invitations as [
      string,
      InvitationRecord,
    ][]) {
      this.invitations.set(key, {
        ...value,
        label: assertNativeOkfAdministrativeLabel(value.label),
      });
    }
    for (const [key, value] of state.totals as [string, MutableCounter][]) {
      this.totals.set(key, value);
    }
    for (const [key, value] of state.daily as [string, DailyCounter][]) {
      this.daily.set(key, value);
    }
    for (const [key, value] of state.reservations as [
      string,
      StoredReservation,
    ][]) {
      this.reservations.set(key, value);
    }
    this.usageEvents.push(...(state.usageEvents as UsageEvent[]));
    this.paidRateEvents.push(...(state.paidRateEvents as RateEvent[]));
    this.abuseEvents.push(...(state.abuseEvents as AbuseEvent[]));
    this.audits.push(...(state.audits as AdminAuditRecord[]));
    this.operationalPaused = state.operationalPaused;
  }

}

