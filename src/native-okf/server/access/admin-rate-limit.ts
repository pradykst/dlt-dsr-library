import "server-only";

export type AdminRateLimitDecision =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

const ADMIN_RATE_WINDOW_MS = 60_000;
const MAX_PRUNED_SUBJECTS_PER_CONSUME = 64;
const MAX_TRACKED_ADMIN_SUBJECTS = 4_096;

export class NativeOkfAdminRateLimiter {
  private readonly eventsBySubject = new Map<string, number[]>();

  consume(
    subjectId: string,
    nowMs: number,
    limitPerMinute: number,
  ): AdminRateLimitDecision {
    if (
      !subjectId ||
      !Number.isSafeInteger(nowMs) ||
      nowMs < 0 ||
      !Number.isSafeInteger(limitPerMinute) ||
      limitPerMinute < 1
    ) {
      return { allowed: false, retryAfterMs: ADMIN_RATE_WINDOW_MS };
    }

    const cutoff = nowMs - ADMIN_RATE_WINDOW_MS;
    this.pruneExpiredSubjects(cutoff, nowMs);
    const bucket =
      this.eventsBySubject.has(subjectId) ||
      this.eventsBySubject.size < MAX_TRACKED_ADMIN_SUBJECTS
        ? subjectId
        : "admin-rate-overflow";
    const recent = (this.eventsBySubject.get(bucket) ?? [])
      .filter((timestamp) => timestamp > cutoff && timestamp <= nowMs)
      .sort((left, right) => left - right);

    if (recent.length >= limitPerMinute) {
      this.eventsBySubject.set(bucket, recent);
      return {
        allowed: false,
        retryAfterMs: Math.max(
          1,
          recent[0] + ADMIN_RATE_WINDOW_MS - nowMs,
        ),
      };
    }

    recent.push(nowMs);
    this.eventsBySubject.set(bucket, recent);
    return { allowed: true };
  }

  private pruneExpiredSubjects(cutoff: number, nowMs: number): void {
    const subjects: string[] = [];
    for (const subject of this.eventsBySubject.keys()) {
      subjects.push(subject);
      if (subjects.length >= MAX_PRUNED_SUBJECTS_PER_CONSUME) break;
    }
    for (const subject of subjects) {
      const recent = (this.eventsBySubject.get(subject) ?? []).filter(
        (timestamp) => timestamp > cutoff && timestamp <= nowMs,
      );
      this.eventsBySubject.delete(subject);
      if (recent.length > 0) {
        // Reinsert active buckets at the end so bounded pruning rotates.
        this.eventsBySubject.set(subject, recent);
      }
    }
  }

  trackedSubjectCountForTests(): number {
    return this.eventsBySubject.size;
  }

  clear(): void {
    this.eventsBySubject.clear();
  }
}

const runtimeAdminRateLimiter = new NativeOkfAdminRateLimiter();

export function getNativeOkfAdminRateLimiter(): NativeOkfAdminRateLimiter {
  return runtimeAdminRateLimiter;
}

export function clearNativeOkfAdminRateLimiterForTests(): void {
  runtimeAdminRateLimiter.clear();
}
