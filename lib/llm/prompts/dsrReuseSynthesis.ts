/**
 * Compatibility exports for older imports. The active providers and this module
 * share the single structured synthesis schema and prompt implementation.
 */
export {
  llmMoveExplanationSchema as designMoveSchema,
  structuredLlmSynthesisSchema as decisionSupportAnswerSchema,
  structuredSynthesisSystemPrompt as dsrReuseSystemPrompt,
  type StructuredLlmSynthesis as LlmAnswerPayload
} from "../structured-synthesis.ts";

import {
  parseStructuredSynthesisJson,
  structuredSynthesisUserPrompt,
  type CompactSynthesisContext
} from "../structured-synthesis.ts";

export const parseDecisionSupportJson = parseStructuredSynthesisJson;

export function decisionSupportUserPrompt(context: CompactSynthesisContext) {
  return structuredSynthesisUserPrompt(context);
}
