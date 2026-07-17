import "server-only";

import { loadOkfBundle } from "./parser.ts";
import type { OkfBundle } from "./types.ts";

let cachedBundle: Promise<OkfBundle> | undefined;

/** Returns the process-local canonical bundle snapshot. */
export function getOkfBundle(): Promise<OkfBundle> {
  if (cachedBundle) return cachedBundle;

  const load = loadOkfBundle().catch((error: unknown) => {
    // A transient read failure must not poison the process for all later calls.
    if (cachedBundle === load) cachedBundle = undefined;
    throw error;
  });

  cachedBundle = load;
  return load;
}

/** Explicit invalidation hook for development and deterministic tests. */
export function clearOkfCacheForTests(): void {
  cachedBundle = undefined;
}
