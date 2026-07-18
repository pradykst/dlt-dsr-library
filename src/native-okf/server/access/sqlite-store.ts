import "server-only";

import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Database from "better-sqlite3";

import { MemoryNativeOkfOperationalStore } from "./memory-store.ts";
import type {
  NativeOkfOperationalStore,
  SubjectQuotaSnapshotInput,
} from "./store.ts";
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
} from "./types.ts";

const SQLITE_SCHEMA_VERSION = 1;

export class NativeOkfStoreInitializationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "NativeOkfStoreInitializationError";
  }
}

/**
 * Durable single-instance adapter. All state transitions are synchronous and
 * saved as one SQLite transaction, making a reservation atomic with respect to
 * the one supported Node.js process. The payload contains only fields admitted
 * by the operational-store types; it never accepts prompt or response content.
 */
export class SqliteNativeOkfOperationalStore implements NativeOkfOperationalStore {
  readonly kind = "sqlite" as const;
  readonly absolutePath: string;

  private readonly memory = new MemoryNativeOkfOperationalStore();
  private database: Database.Database | null = null;

  constructor(databasePath: string, cwd = process.cwd()) {
    if (!databasePath.trim() || databasePath === ":memory:") {
      throw new NativeOkfStoreInitializationError(
        "A durable SQLite file path is required for the native OKF operational store.",
      );
    }
    this.absolutePath = resolve(cwd, databasePath);
  }

  initialize(): void {
    if (this.database) return;
    try {
      mkdirSync(dirname(this.absolutePath), { recursive: true });
      const database = new Database(this.absolutePath);
      database.pragma("journal_mode = WAL");
      database.pragma("synchronous = FULL");
      database.pragma("busy_timeout = 5000");
      database.exec(`
        CREATE TABLE IF NOT EXISTS native_okf_store_metadata (
          singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
          schema_version INTEGER NOT NULL,
          updated_at_ms INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS native_okf_store_state (
          singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
          payload_json TEXT NOT NULL,
          FOREIGN KEY (singleton_id)
            REFERENCES native_okf_store_metadata(singleton_id)
            ON DELETE CASCADE
        );
      `);
      database.pragma("foreign_keys = ON");
      const metadata = database
        .prepare(
          "SELECT schema_version AS schemaVersion FROM native_okf_store_metadata WHERE singleton_id = 1",
        )
        .get() as { schemaVersion: number } | undefined;
      if (metadata && metadata.schemaVersion !== SQLITE_SCHEMA_VERSION) {
        database.close();
        throw new NativeOkfStoreInitializationError(
          `Unsupported native OKF operational schema version ${metadata.schemaVersion}.`,
        );
      }
      this.database = database;
      const state = database
        .prepare(
          "SELECT payload_json AS payload FROM native_okf_store_state WHERE singleton_id = 1",
        )
        .get() as { payload: string } | undefined;
      if (state) {
        this.memory.restoreDurableState(state.payload);
      } else {
        this.persist(Date.now());
      }
    } catch (error) {
      this.database?.close();
      this.database = null;
      if (error instanceof NativeOkfStoreInitializationError) throw error;
      throw new NativeOkfStoreInitializationError(
        "The durable native OKF operational store could not initialize.",
        { cause: error },
      );
    }
  }

  private requireDatabase(): Database.Database {
    if (!this.database) {
      throw new NativeOkfStoreInitializationError(
        "The durable native OKF operational store is unavailable.",
      );
    }
    return this.database;
  }

  private persist(updatedAtMs: number): void {
    const database = this.requireDatabase();
    const payload = this.memory.exportDurableState();
    database.transaction(() => {
      database
        .prepare(
          `INSERT INTO native_okf_store_metadata
             (singleton_id, schema_version, updated_at_ms)
           VALUES (1, ?, ?)
           ON CONFLICT(singleton_id) DO UPDATE SET
             schema_version = excluded.schema_version,
             updated_at_ms = excluded.updated_at_ms`,
        )
        .run(SQLITE_SCHEMA_VERSION, updatedAtMs);
      database
        .prepare(
          `INSERT INTO native_okf_store_state (singleton_id, payload_json)
           VALUES (1, ?)
           ON CONFLICT(singleton_id) DO UPDATE SET
             payload_json = excluded.payload_json`,
        )
        .run(payload);
    })();
  }

  private mutate<T>(updatedAtMs: number, operation: () => T): T {
    this.requireDatabase();
    const previous = this.memory.exportDurableState();
    try {
      const result = operation();
      this.persist(updatedAtMs);
      return result;
    } catch (error) {
      this.memory.restoreDurableState(previous);
      throw error;
    }
  }

  close(): void {
    if (!this.database) return;
    this.persist(Date.now());
    this.database.close();
    this.database = null;
  }

  createInvitation(input: CreateInvitationInput): InvitationRecord {
    return this.mutate(input.createdAtMs, () => this.memory.createInvitation(input));
  }

  findInvitationByCodeHash(codeHash: string): InvitationRecord | null {
    return this.memory.findInvitationByCodeHash(codeHash);
  }

  getInvitation(id: string): InvitationRecord | null {
    return this.memory.getInvitation(id);
  }

  listInvitations(nowMs: number): SafeInvitationRecord[] {
    return this.memory.listInvitations(nowMs);
  }

  updateInvitation(
    id: string,
    patch: InvitationPatch,
    nowMs: number,
  ): SafeInvitationRecord | null {
    return this.mutate(nowMs, () => this.memory.updateInvitation(id, patch, nowMs));
  }

  revokeInvitation(id: string, revokedAtMs: number): SafeInvitationRecord | null {
    return this.mutate(revokedAtMs, () =>
      this.memory.revokeInvitation(id, revokedAtMs),
    );
  }

  getSubjectQuotaSnapshot(input: SubjectQuotaSnapshotInput): SubjectQuotaSnapshot {
    return this.memory.getSubjectQuotaSnapshot(input);
  }

  checkAndRecordAbuseAttempt(input: AbuseAttemptInput): AbuseDecision {
    return this.mutate(input.nowMs, () => this.memory.checkAndRecordAbuseAttempt(input));
  }

  reservePaidRequest(input: ReservationRequest): ReservationDecision {
    return this.mutate(input.nowMs, () => this.memory.reservePaidRequest(input));
  }

  increaseReservationBudget(
    input: ReservationBudgetIncreaseRequest,
  ): ReservationBudgetIncreaseDecision {
    return this.mutate(input.nowMs, () =>
      this.memory.increaseReservationBudget(input),
    );
  }

  getActiveReservation(id: string): ActiveReservation | null {
    return this.memory.getActiveReservation(id);
  }

  reconcileReservation(input: ReservationReconciliation): UsageEvent {
    return this.mutate(input.completedAtMs, () =>
      this.memory.reconcileReservation(input),
    );
  }

  releaseReservation(input: ReleaseReservationInput): boolean {
    return this.mutate(input.releasedAtMs, () =>
      this.memory.releaseReservation(input),
    );
  }

  cleanupStaleReservations(nowMs: number): StaleReservationCleanupResult {
    return this.mutate(nowMs, () => this.memory.cleanupStaleReservations(nowMs));
  }

  getOperationalPause(): boolean {
    return this.memory.getOperationalPause();
  }

  setOperationalPause(paused: boolean, changedAtMs: number): void {
    this.mutate(changedAtMs, () => this.memory.setOperationalPause(paused, changedAtMs));
  }

  recordAdminAudit(input: AdminAuditInput): void {
    this.mutate(input.createdAtMs, () => this.memory.recordAdminAudit(input));
  }

  listAdminAudit(limit: number): AdminAuditRecord[] {
    return this.memory.listAdminAudit(limit);
  }

  getUsageReport(nowMs: number): UsageReport {
    return this.memory.getUsageReport(nowMs);
  }

  getDashboardSnapshot(
    nowMs: number,
    budgets: ApplicationBudgetLimits,
  ): DashboardSnapshot {
    return this.memory.getDashboardSnapshot(nowMs, budgets);
  }
}

