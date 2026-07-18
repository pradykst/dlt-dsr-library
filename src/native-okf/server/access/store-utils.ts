import "server-only";

export function utcDayKey(timestampMs: number): string {
  return new Date(timestampMs).toISOString().slice(0, 10);
}

export function utcMonthKey(timestampMs: number): string {
  return new Date(timestampMs).toISOString().slice(0, 7);
}

export function nextUtcDayStartMs(timestampMs: number): number {
  const date = new Date(timestampMs);
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
  );
}

export function assertNonNegativeSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
}

export function assertSafeCategory(value: string, label: string): void {
  if (!/^[a-z0-9][a-z0-9:_-]{0,63}$/i.test(value)) {
    throw new Error(`${label} must be a safe category identifier.`);
  }
}

