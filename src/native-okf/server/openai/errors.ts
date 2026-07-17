import "server-only";

export type NativeOkfChatErrorCode =
  | "invalid_request"
  | "openai_not_configured"
  | "moderation_blocked"
  | "openai_timeout"
  | "model_refusal"
  | "generation_failed";

export class NativeOkfChatError extends Error {
  readonly code: NativeOkfChatErrorCode;
  readonly status: number;
  readonly publicMessage: string;

  constructor(
    code: NativeOkfChatErrorCode,
    status: number,
    publicMessage: string,
  ) {
    super(publicMessage);
    this.name = "NativeOkfChatError";
    this.code = code;
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

export class NativeOkfRequestError extends NativeOkfChatError {
  constructor(message: string) {
    super("invalid_request", 400, message);
    this.name = "NativeOkfRequestError";
  }
}

export class OpenAiConfigurationError extends NativeOkfChatError {
  constructor(message = "The native OKF assistant is not configured on the server.") {
    super("openai_not_configured", 503, message);
    this.name = "OpenAiConfigurationError";
  }
}

export class OpenAiModerationError extends NativeOkfChatError {
  constructor() {
    super(
      "moderation_blocked",
      422,
      "This request could not be processed by the configured safety checks.",
    );
    this.name = "OpenAiModerationError";
  }
}

export class OpenAiTimeoutError extends NativeOkfChatError {
  constructor() {
    super(
      "openai_timeout",
      504,
      "The model request timed out. Please try again.",
    );
    this.name = "OpenAiTimeoutError";
  }
}

export class OpenAiRefusalError extends NativeOkfChatError {
  constructor() {
    super(
      "model_refusal",
      422,
      "The model declined to produce a response for this request.",
    );
    this.name = "OpenAiRefusalError";
  }
}

export class OpenAiGenerationError extends NativeOkfChatError {
  constructor() {
    super(
      "generation_failed",
      502,
      "The model did not return a usable response. Please try again.",
    );
    this.name = "OpenAiGenerationError";
  }
}

export function normalizeOpenAiError(error: unknown): NativeOkfChatError {
  if (error instanceof NativeOkfChatError) return error;

  if (error instanceof Error) {
    const name = error.name.toLocaleLowerCase("en");
    const message = error.message.toLocaleLowerCase("en");
    if (
      name.includes("timeout") ||
      message.includes("timed out") ||
      message.includes("timeout")
    ) {
      return new OpenAiTimeoutError();
    }
  }

  return new OpenAiGenerationError();
}

export interface PublicNativeOkfChatError {
  status: number;
  body: {
    error: string;
    code: NativeOkfChatErrorCode;
  };
}

/** Converts internal failures to a stable response without exposing causes or secrets. */
export function publicNativeOkfChatError(error: unknown): PublicNativeOkfChatError {
  const normalized = normalizeOpenAiError(error);
  return {
    status: normalized.status,
    body: {
      error: normalized.publicMessage,
      code: normalized.code,
    },
  };
}
