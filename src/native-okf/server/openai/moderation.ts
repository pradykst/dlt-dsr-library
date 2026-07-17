import "server-only";

import type { NativeOpenAiClient } from "./client.ts";
import type { NativeOpenAiEnvironment } from "./env.ts";
import { normalizeOpenAiError, OpenAiModerationError } from "./errors.ts";

export const OPENAI_MODERATION_MODEL = "omni-moderation-latest";

export async function moderateNativeOkfText(
  text: string,
  environment: Pick<NativeOpenAiEnvironment, "moderationEnabled">,
  client: NativeOpenAiClient,
): Promise<void> {
  if (!environment.moderationEnabled) return;

  try {
    const response = await client.moderations.create({
      model: OPENAI_MODERATION_MODEL,
      input: text,
    });
    if (response.results.some((result) => result.flagged)) {
      throw new OpenAiModerationError();
    }
  } catch (error) {
    if (error instanceof OpenAiModerationError) throw error;
    throw normalizeOpenAiError(error);
  }
}
