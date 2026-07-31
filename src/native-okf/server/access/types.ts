import "server-only";

export const NATIVE_OKF_ACCESS_MODES = ["disabled", "test", "invite"] as const;

export type NativeOkfAccessMode = (typeof NATIVE_OKF_ACCESS_MODES)[number];
export type NativeOkfSubjectKind = "test" | "invite";
export type InvitationStatus = "active" | "expired" | "revoked";
export type ReservationStatus = "active" | "settled" | "released";

export interface QuotaLimits {
  dailyQuestions: number;
  dailyDiagrams: number;
  totalQuestions: number;
  totalDiagrams: number;
  requestsPerMinute: number;
  cooldownSeconds: number;
  maxConcurrent: number;
}

export interface ApplicationBudgetLimits {
  dailyMicrodollars: number;
  monthlyMicrodollars: number;
  maxGlobalConcurrent: number;
}

export interface InvitationRecord {
  id: string;
  codeHash: string;
  label: string;
  createdAtMs: number;
  expiresAtMs: number;
  revokedAtMs: number | null;
  quotas: QuotaLimits;
  questionsUsedTotal: number;
  diagramsUsedTotal: number;
  attributedMicrodollars: number;
  lastUsedAtMs: number | null;
}

export interface SafeInvitationRecord extends Omit<InvitationRecord, "codeHash"> {
  status: InvitationStatus;
}

export interface CreateInvitationInput {
  id: string;
  codeHash: string;
  label: string;
  createdAtMs: number;
  expiresAtMs: number;
  quotas: QuotaLimits;
}

export interface InvitationPatch {
  label?: string;
  expiresAtMs?: number;
  dailyQuestions?: number;
  dailyDiagrams?: number;
  totalQuestions?: number;
  totalDiagrams?: number;
  requestsPerMinute?: number;
  cooldownSeconds?: number;
  maxConcurrent?: number;
}

export interface SubjectQuotaSnapshot {
  subjectId: string;
  utcDay: string;
  questionsUsedToday: number;
  diagramsUsedToday: number;
  questionsUsedTotal: number;
  diagramsUsedTotal: number;
  questionsRemainingToday: number;
  diagramsRemainingToday: number;
  questionsRemainingTotal: number;
  diagramsRemainingTotal: number;
  resetAtMs: number;
  accessExpiresAtMs: number;
}

export interface AbuseAttemptInput {
  ipSubject: string;
  nowMs: number;
  globalRequestsPerMinute: number;
  ipRequestsPerHour: number;
}

export type AbuseDecision =
  | { allowed: true }
  | { allowed: false; reason: "global-rpm" | "ip-hourly"; retryAfterMs: number };

export interface ReservationRequest {
  reservationId: string;
  subjectId: string;
  subjectKind: NativeOkfSubjectKind;
  invitationId: string | null;
  nowMs: number;
  expiresAtMs: number;
  includeDiagram: boolean;
  reserveMicrodollars: number;
  subjectLimits: QuotaLimits;
  applicationLimits: ApplicationBudgetLimits;
  accessExpiresAtMs: number;
}

export type ReservationBlockReason =
  | "operational-pause"
  | "expired"
  | "revoked"
  | "cooldown"
  | "subject-rpm"
  | "subject-concurrency"
  | "global-concurrency"
  | "daily-question-quota"
  | "daily-diagram-quota"
  | "total-question-quota"
  | "total-diagram-quota"
  | "daily-budget"
  | "monthly-budget";

export type ReservationDecision =
  | {
      allowed: true;
      reservation: ActiveReservation;
      quota: SubjectQuotaSnapshot;
    }
  | {
      allowed: false;
      reason: ReservationBlockReason;
      retryAfterMs?: number;
    };

export interface ReservationBudgetIncreaseRequest {
  reservationId: string;
  nowMs: number;
  requiredReservedMicrodollars: number;
  applicationLimits: ApplicationBudgetLimits;
}

export type ReservationBudgetIncreaseDecision =
  | { allowed: true; reservation: ActiveReservation }
  | {
      allowed: false;
      reason: "operational-pause" | "daily-budget" | "monthly-budget";
    };

export interface ActiveReservation {
  id: string;
  subjectId: string;
  subjectKind: NativeOkfSubjectKind;
  invitationId: string | null;
  createdAtMs: number;
  expiresAtMs: number;
  questionUnits: 1;
  diagramUnits: 0 | 1;
  reservedMicrodollars: number;
  status: ReservationStatus;
}

export interface TokenUsageTotals {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  modelCalls: number;
}
export interface ReservationReconciliation {
  reservationId: string;
  completedAtMs: number;
  usage: TokenUsageTotals;
  /** Server-authoritative substantive-turn signal; independent of model calls. */
  questionConsumed: boolean;
  /** Responses calls made for diagram generation or diagram repair only. */
  diagramModelCalls: number;
  /** Server-authoritative feature delivery signal; independent of model calls. */
  diagramDelivered: boolean;
  actualMicrodollars: number;
  usageUnreconciled: boolean;
  latencyMs: number;
  outcomeCategory: string;
  errorCategory: string | null;
}

export interface ReleaseReservationInput {
  reservationId: string;
  releasedAtMs: number;
  releaseQuota: boolean;
  outcomeCategory: string;
  errorCategory: string | null;
}

export interface UsageEvent {
  id: string;
  reservationId: string;
  subjectId: string;
  invitationId: string | null;
  createdAtMs: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  modelCalls: number;
  microdollars: number;
  latencyMs: number;
  outcomeCategory: string;
  errorCategory: string | null;
  usageUnreconciled: boolean;
}

export interface DailyUsageAggregate {
  utcDay: string;
  questions: number;
  diagrams: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  modelCalls: number;
  microdollars: number;
}

export interface SafeErrorAggregate {
  category: string;
  count: number;
}

export interface UsageReport {
  generatedAtMs: number;
  daily: DailyUsageAggregate[];
  estimatedMicrodollarsToday: number;
  estimatedMicrodollarsThisMonth: number;
  questionsToday: number;
  diagramsToday: number;
  modelCallsToday: number;
  activeReservations: number;
  activeReservedMicrodollars: number;
  unreconciledUsageEvents: number;
  recentErrors: SafeErrorAggregate[];
}

export interface InvitationDashboardRow extends SafeInvitationRecord {
  quota: SubjectQuotaSnapshot;
}

export interface DashboardSnapshot extends UsageReport {
  operationalPaused: boolean;
  remainingDailyMicrodollars: number;
  remainingMonthlyMicrodollars: number;
  invitations: InvitationDashboardRow[];
}

export interface AdminAuditRecord {
  id: string;
  createdAtMs: number;
  action: string;
  targetInvitationId: string | null;
  outcomeCategory: string;
}

export type AdminAuditInput = AdminAuditRecord;

export interface StaleReservationCleanupResult {
  settledReservationIds: string[];
  chargedMicrodollars: number;
}

export function invitationStatus(
  invitation: Pick<InvitationRecord, "expiresAtMs" | "revokedAtMs">,
  nowMs: number,
): InvitationStatus {
  if (invitation.revokedAtMs !== null) return "revoked";
  if (invitation.expiresAtMs <= nowMs) return "expired";
  return "active";
}

