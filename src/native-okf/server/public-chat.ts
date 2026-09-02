import "server-only";

import type { NativeOkfChatResponse } from "../shared/chat-types.ts";
import {
  answerNativeOkfChat,
  MAX_NATIVE_OKF_REQUEST_BYTES,
} from "./openai/chat.ts";
import {
  NativeOkfRequestError,
  normalizeOpenAiError,
  publicNativeOkfChatError,
  RequestTooLargeError,
} from "./openai/errors.ts";
import { getNativeOkfPublicOrigin } from "./public-origin.ts";
import {
  createNativeOkfRequestId,
  logNativeOkfChatOutcome,
} from "./request-log.ts";

const MAX_CONCURRENT_PUBLIC_CHAT_REQUESTS = 4;

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export interface PublicNativeOkfChatDependencies {
  answer?: (input: unknown) => Promise<NativeOkfChatResponse>;
  environment?: EnvironmentSource;
}

let activePublicChatRequests = 0;

function contentLength(request: Request): number | undefined {
  const rawValue = request.headers.get("content-length");
  if (!rawValue) return undefined;
  const parsed = Number(rawValue);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function chatEnabled(environment: EnvironmentSource): boolean {
  const normalized = environment.NATIVE_OKF_CHAT_ENABLED
    ?.trim()
    .toLocaleLowerCase("en");
  if (!normalized) return true;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  return false;
}

function sameOriginJsonPost(
  request: Request,
  environment: EnvironmentSource,
): boolean {
  if (request.method.toUpperCase() !== "POST") return false;

  let expectedOrigin: string;
  let suppliedOrigin: string;
  try {
    const requestOrigin = new URL(request.url).origin;
    expectedOrigin = getNativeOkfPublicOrigin(
      environment.NATIVE_OKF_PUBLIC_ORIGIN,
      requestOrigin,
    );
    const origin = request.headers.get("origin");
    if (!origin || origin === "null") return false;
    suppliedOrigin = new URL(origin).origin;
  } catch {
    return false;
  }
  if (suppliedOrigin !== expectedOrigin) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite.toLocaleLowerCase("en") !== "same-origin") {
    return false;
  }

  const contentType = request.headers.get("content-type");
  return (
    contentType?.split(";", 1)[0]?.trim().toLocaleLowerCase("en") ===
    "application/json"
  );
}

function jsonResponse(
  body: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return Response.json(body, {
    status,
    headers: { ...RESPONSE_HEADERS, ...headers },
  });
}

export async function handlePublicNativeOkfChat(
  request: Request,
  dependencies: PublicNativeOkfChatDependencies = {},
): Promise<Response> {
  const environment = dependencies.environment ?? process.env;
  if (!chatEnabled(environment)) {
    return jsonResponse(
      {
        error: "The native OKF assistant is temporarily unavailable.",
        code: "service_unavailable",
      },
      503,
    );
  }

  if (!sameOriginJsonPost(request, environment)) {
    return jsonResponse(
      {
        error: "The chat request must come from this site.",
        code: "same_origin_required",
      },
      403,
    );
  }

  const requestId = createNativeOkfRequestId();
  const startedAtMs = Date.now();
  const tooLarge = () =>
    jsonResponse(
      publicNativeOkfChatError(
        new RequestTooLargeError(
          `Request body must not exceed ${MAX_NATIVE_OKF_REQUEST_BYTES} bytes.`,
        ),
      ).body,
      413,
      { "X-Request-Id": requestId },
    );

  const requestBytes = contentLength(request);
  if (
    requestBytes !== undefined &&
    requestBytes > MAX_NATIVE_OKF_REQUEST_BYTES
  ) {
    logNativeOkfChatOutcome({
      requestId,
      status: "error",
      httpStatus: 413,
      durationMs: Date.now() - startedAtMs,
      errorCode: "request_too_large",
    });
    return tooLarge();
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (
      new TextEncoder().encode(rawBody).byteLength >
      MAX_NATIVE_OKF_REQUEST_BYTES
    ) {
      logNativeOkfChatOutcome({
        requestId,
        status: "error",
        httpStatus: 413,
        durationMs: Date.now() - startedAtMs,
        errorCode: "request_too_large",
      });
      return tooLarge();
    }
    body = JSON.parse(rawBody) as unknown;
  } catch {
    body = undefined;
  }
  if (body === undefined) {
    const publicError = publicNativeOkfChatError(
      new NativeOkfRequestError("Request body must contain valid JSON."),
    );
    logNativeOkfChatOutcome({
      requestId,
      status: "error",
      httpStatus: publicError.status,
      durationMs: Date.now() - startedAtMs,
      errorCode: publicError.body.code,
    });
    return jsonResponse(publicError.body, publicError.status, {
      "X-Request-Id": requestId,
    });
  }

  if (activePublicChatRequests >= MAX_CONCURRENT_PUBLIC_CHAT_REQUESTS) {
    logNativeOkfChatOutcome({
      requestId,
      status: "error",
      httpStatus: 429,
      durationMs: Date.now() - startedAtMs,
      errorCode: "concurrency_limited",
    });
    return jsonResponse(
      {
        error: "The assistant is handling other requests. Please try again shortly.",
        code: "concurrency_limited",
      },
      429,
      { "Retry-After": "1", "X-Request-Id": requestId },
    );
  }

  activePublicChatRequests += 1;
  try {
    const response = await (dependencies.answer ?? answerNativeOkfChat)(body);
    logNativeOkfChatOutcome({
      requestId,
      status: "success",
      httpStatus: 200,
      durationMs: Date.now() - startedAtMs,
    });
    return jsonResponse(response, 200, { "X-Request-Id": requestId });
  } catch (error) {
    const publicError = publicNativeOkfChatError(error);
    const upstreamStatus = normalizeOpenAiError(error).upstreamStatus;
    logNativeOkfChatOutcome({
      requestId,
      status: "error",
      httpStatus: publicError.status,
      durationMs: Date.now() - startedAtMs,
      errorCode: publicError.body.code,
      ...(upstreamStatus === undefined ? {} : { upstreamStatus }),
    });
    return jsonResponse(publicError.body, publicError.status, {
      "X-Request-Id": requestId,
    });
  } finally {
    activePublicChatRequests -= 1;
  }
}

export function resetPublicNativeOkfChatConcurrencyForTests(): void {
  activePublicChatRequests = 0;
}
