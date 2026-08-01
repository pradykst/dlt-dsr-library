import type { NativeOkfChatResponse } from "./chat-types.ts";

export type NativeOkfEvaluationResponse = Pick<
  NativeOkfChatResponse,
  "kind" | "presentationMode" | "insufficientContext"
>;

/** Visibility is derived only from completed responses in the current tab. */
export function shouldShowNativeOkfEvaluationCallout(
  responses: readonly NativeOkfEvaluationResponse[],
): boolean {
  return responses.some(
    (response) =>
      response.kind === "answer" &&
      !response.insufficientContext &&
      (response.presentationMode === "text-primary" ||
        response.presentationMode === "diagram-primary"),
  );
}