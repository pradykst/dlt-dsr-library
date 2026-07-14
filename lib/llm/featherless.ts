import type { OkfChatResponse } from "../okf/chat.ts";
import { buildCompactSynthesisContext } from "./structured-synthesis.ts";

const DEPRECATION_REASON = "Featherless synthesis is no longer a selectable OKF provider; the deterministic structured answer was retained.";

/** @deprecated Featherless is intentionally not selectable and this function never performs a live call. */
export async function synthesizeWithFeatherless(deterministic: OkfChatResponse): Promise<OkfChatResponse> {
  return deprecatedStructuredFallback(deterministic, DEPRECATION_REASON);
}

/** @deprecated Compatibility alias for callers that previously inspected provider context. */
export const buildSynthesisContext = buildCompactSynthesisContext;

/** @deprecated Compatibility fallback; provider arguments are ignored because no request is attempted. */
export function synthesizeWithCompactFallback(response: OkfChatResponse, reason = DEPRECATION_REASON): OkfChatResponse {
  return deprecatedStructuredFallback(response, reason);
}

function deprecatedStructuredFallback(response: OkfChatResponse, reason: string): OkfChatResponse {
  const answerPayload = response.answer_payload ? { ...response.answer_payload, synthesis_mode: "structured_okf_answer" as const } : response.answer_payload;
  return {
    ...response,
    answer: response.answer,
    answer_payload: answerPayload,
    runtime: {
      ...response.runtime,
      provider_configured: false,
      provider_connected: false,
      synthesis_attempted: false,
      synthesis_mode: "structured_okf_answer",
      provider: "none",
      fallback_reason: reason,
      provider_status: {
        provider: "none",
        configured: false,
        reachable: false,
        attempted: false,
        outcome: "not_configured",
        fallback_reason: reason
      }
    },
    warnings: [...response.warnings, reason]
  };
}
