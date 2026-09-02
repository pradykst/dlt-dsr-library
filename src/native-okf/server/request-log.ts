import "server-only";

/**
 * Minimal structured operational logging for the native OKF chat endpoint.
 *
 * Deliberately excludes user question/answer text and any retrieved source content —
 * only safe, aggregate metadata needed to diagnose latency and failure classes.
 */
export interface NativeOkfChatLogEntry {
  requestId: string;
  status: "success" | "error";
  httpStatus: number;
  durationMs: number;
  errorCode?: string;
  upstreamStatus?: number;
}

export function createNativeOkfRequestId(): string {
  return crypto.randomUUID();
}

export function logNativeOkfChatOutcome(entry: NativeOkfChatLogEntry): void {
  const line = {
    at: new Date().toISOString(),
    scope: "native-okf-chat",
    ...entry,
  };
  if (entry.status === "error") {
    console.error(JSON.stringify(line));
  } else {
    console.info(JSON.stringify(line));
  }
}
