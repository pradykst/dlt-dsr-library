import "server-only";

import type {
  AbuseAttemptInput,
  AbuseDecision,
  ActiveReservation,
  AdminAuditInput,
  AdminAuditRecord,
  ApplicationBudgetLimits,
  CreateInvitationInput,
  DashboardSnapshot,
  InvitationPatch,
  InvitationRecord,
  ReservationBudgetIncreaseDecision,
  ReservationBudgetIncreaseRequest,
  ReservationDecision,
  ReservationReconciliation,
  ReservationRequest,
  ReleaseReservationInput,
  SafeInvitationRecord,
  StaleReservationCleanupResult,
  SubjectQuotaSnapshot,
  UsageEvent,
  UsageReport,
  QuotaLimits,
} from "./types.ts";

export interface SubjectQuotaSnapshotInput {
  subjectId: string;
  nowMs: number;
  limits: QuotaLimits;
  accessExpiresAtMs: number;
}

export interface NativeOkfOperationalStore {
  initialize(): void;
  close(): void;

  createInvitation(input: CreateInvitationInput): InvitationRecord;
  findInvitationByCodeHash(codeHash: string): InvitationRecord | null;
  getInvitation(id: string): InvitationRecord | null;
  listInvitations(nowMs: number): SafeInvitationRecord[];
  updateInvitation(
    id: string,
    patch: InvitationPatch,
    nowMs: number,
  ): SafeInvitationRecord | null;
  revokeInvitation(id: string, revokedAtMs: number): SafeInvitationRecord | null;

  getSubjectQuotaSnapshot(input: SubjectQuotaSnapshotInput): SubjectQuotaSnapshot;
  checkAndRecordAbuseAttempt(input: AbuseAttemptInput): AbuseDecision;
  reservePaidRequest(input: ReservationRequest): ReservationDecision;
  increaseReservationBudget(
    input: ReservationBudgetIncreaseRequest,
  ): ReservationBudgetIncreaseDecision;
  getActiveReservation(id: string): ActiveReservation | null;
  reconcileReservation(input: ReservationReconciliation): UsageEvent;
  releaseReservation(input: ReleaseReservationInput): boolean;
  cleanupStaleReservations(nowMs: number): StaleReservationCleanupResult;

  getOperationalPause(): boolean;
  setOperationalPause(paused: boolean, changedAtMs: number): void;
  recordAdminAudit(input: AdminAuditInput): void;
  listAdminAudit(limit: number): AdminAuditRecord[];

  getUsageReport(nowMs: number): UsageReport;
  getDashboardSnapshot(
    nowMs: number,
    budgets: ApplicationBudgetLimits,
  ): DashboardSnapshot;
}

