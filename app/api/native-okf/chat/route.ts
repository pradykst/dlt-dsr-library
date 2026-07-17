import "server-only";

import { NextResponse } from "next/server";

import {
  answerNativeOkfChat,
  MAX_NATIVE_OKF_REQUEST_BYTES,
} from "../../../../src/native-okf/server/openai/chat.ts";
import {
  NativeOkfRequestError,
  publicNativeOkfChatError,
} from "../../../../src/native-okf/server/openai/errors.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function contentLength(request: Request): number | undefined {
  const rawValue = request.headers.get("content-length");
  if (!rawValue) return undefined;
  const parsed = Number(rawValue);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export async function POST(request: Request): Promise<NextResponse> {
  const requestBytes = contentLength(request);
  if (requestBytes !== undefined && requestBytes > MAX_NATIVE_OKF_REQUEST_BYTES) {
    return NextResponse.json(
      {
        error: `Request body must not exceed ${MAX_NATIVE_OKF_REQUEST_BYTES} bytes.`,
        code: "invalid_request",
      },
      { status: 413, headers: RESPONSE_HEADERS },
    );
  }

  try {
    let body: unknown;
    try {
      const rawBody = await request.text();
      if (new TextEncoder().encode(rawBody).byteLength > MAX_NATIVE_OKF_REQUEST_BYTES) {
        return NextResponse.json(
          {
            error: `Request body must not exceed ${MAX_NATIVE_OKF_REQUEST_BYTES} bytes.`,
            code: "invalid_request",
          },
          { status: 413, headers: RESPONSE_HEADERS },
        );
      }
      body = JSON.parse(rawBody) as unknown;
    } catch {
      throw new NativeOkfRequestError("Request body must contain valid JSON.");
    }

    const response = await answerNativeOkfChat(body);
    return NextResponse.json(response, {
      status: 200,
      headers: RESPONSE_HEADERS,
    });
  } catch (error) {
    const publicError = publicNativeOkfChatError(error);
    return NextResponse.json(publicError.body, {
      status: publicError.status,
      headers: RESPONSE_HEADERS,
    });
  }
}
