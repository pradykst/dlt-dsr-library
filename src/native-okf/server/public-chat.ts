import "server-only";

import type { NativeOkfChatResponse } from "../shared/chat-types.ts";
import {
  answerNativeOkfChat,
  MAX_NATIVE_OKF_REQUEST_BYTES,
} from "./openai/chat.ts";
import {
  NativeOkfRequestError,
  publicNativeOkfChatError,
} from "./openai/errors.ts";

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

function sameOriginJsonPost(request: Request): boolean {
  if (request.method.toUpperCase() !== "POST") return false;

  let expectedOrigin: string;
  let suppliedOrigin: string;
  try {
    expectedOrigin = new URL(request.url).origin;
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

  if (!sameOriginJsonPost(request)) {
    return jsonResponse(
      {
        error: "The chat request must come from this site.",
        code: "same_origin_required",
      },
      403,
    );
  }

  const requestBytes = contentLength(request);
  if (
    requestBytes !== undefined &&
    requestBytes > MAX_NATIVE_OKF_REQUEST_BYTES
  ) {
    return jsonResponse(
      {
        error: `Request body must not exceed ${MAX_NATIVE_OKF_REQUEST_BYTES} bytes.`,
        code: "invalid_request",
      },
      413,
    );
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (
      new TextEncoder().encode(rawBody).byteLength >
      MAX_NATIVE_OKF_REQUEST_BYTES
    ) {
      return jsonResponse(
        {
          error: `Request body must not exceed ${MAX_NATIVE_OKF_REQUEST_BYTES} bytes.`,
          code: "invalid_request",
        },
        413,
      );
    }
    body = JSON.parse(rawBody) as unknown;
  } catch {
    body = undefined;
  }
  if (body === undefined) {
    const publicError = publicNativeOkfChatError(
      new NativeOkfRequestError("Request body must contain valid JSON."),
    );
    return jsonResponse(publicError.body, publicError.status);
  }

  if (activePublicChatRequests >= MAX_CONCURRENT_PUBLIC_CHAT_REQUESTS) {
    return jsonResponse(
      {
        error: "The assistant is handling other requests. Please try again shortly.",
        code: "rate_limited",
      },
      429,
      { "Retry-After": "1" },
    );
  }

  activePublicChatRequests += 1;
  try {
    const response = await (dependencies.answer ?? answerNativeOkfChat)(body);
    return jsonResponse(response, 200);
  } catch (error) {
    const publicError = publicNativeOkfChatError(error);
    return jsonResponse(publicError.body, publicError.status);
  } finally {
    activePublicChatRequests -= 1;
  }
}

export function resetPublicNativeOkfChatConcurrencyForTests(): void {
  activePublicChatRequests = 0;
}
