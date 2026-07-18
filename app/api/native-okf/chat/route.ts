import "server-only";

import { NextResponse } from "next/server";

import {
  answerAuthorizedNativeOkfChat,
  assertNativeOkfChatEnvironmentEnabled,
  assertNativeOkfChatOperationallyEnabled,
} from "../../../../src/native-okf/server/access/authorized-chat.ts";
import { createNativeOkfIpSubject } from "../../../../src/native-okf/server/access/client-ip.ts";
import {
  NativeOkfAccessError,
  publicNativeOkfAccessError,
  serviceUnavailableError,
} from "../../../../src/native-okf/server/access/errors.ts";
import { readNativeOkfAccessRuntimeConfig } from "../../../../src/native-okf/server/access/runtime.ts";
import { getNativeOkfOperationalStore } from "../../../../src/native-okf/server/access/store-singleton.ts";
import { MAX_NATIVE_OKF_REQUEST_BYTES } from "../../../../src/native-okf/server/openai/chat.ts";
import {
  NativeOkfRequestError,
  publicNativeOkfChatError,
} from "../../../../src/native-okf/server/openai/errors.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};

function contentLength(request: Request): number | undefined {
  const rawValue = request.headers.get("content-length");
  if (!rawValue) return undefined;
  const parsed = Number(rawValue);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function requestDirectAddress(request: Request): string | null {
  const candidate = (request as Request & { ip?: unknown }).ip;
  return typeof candidate === "string" ? candidate : null;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const config = (() => {
      try {
        return readNativeOkfAccessRuntimeConfig();
      } catch {
        throw serviceUnavailableError();
      }
    })();
    assertNativeOkfChatEnvironmentEnabled(config);

    const store = (() => {
      try {
        return getNativeOkfOperationalStore(config);
      } catch {
        throw serviceUnavailableError();
      }
    })();
    assertNativeOkfChatOperationallyEnabled(store);

    const requestBytes = contentLength(request);
    if (
      requestBytes !== undefined &&
      requestBytes > MAX_NATIVE_OKF_REQUEST_BYTES
    ) {
      return NextResponse.json(
        {
          error: `Request body must not exceed ${MAX_NATIVE_OKF_REQUEST_BYTES} bytes.`,
          code: "invalid_request",
        },
        { status: 413, headers: RESPONSE_HEADERS },
      );
    }

    let body: unknown;
    try {
      const rawBody = await request.text();
      if (
        new TextEncoder().encode(rawBody).byteLength >
        MAX_NATIVE_OKF_REQUEST_BYTES
      ) {
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
      throw new NativeOkfRequestError(
        "Request body must contain valid JSON.",
      );
    }

    if (!config.sessionSecret) throw serviceUnavailableError();
    const { ipSubject } = createNativeOkfIpSubject(
      {
        headers: request.headers,
        directAddress: requestDirectAddress(request),
      },
      config.trustedProxy,
      config.sessionSecret,
    );

    const response = await answerAuthorizedNativeOkfChat(body, {
      config,
      getStore: () => store,
      cookieHeader: request.headers.get("cookie"),
      ipSubject,
    });
    return NextResponse.json(response, {
      status: 200,
      headers: RESPONSE_HEADERS,
    });
  } catch (error) {
    if (error instanceof NativeOkfAccessError) {
      const publicError = publicNativeOkfAccessError(error);
      return NextResponse.json(publicError.body, {
        status: publicError.status,
        headers: {
          ...RESPONSE_HEADERS,
          ...(publicError.retryAfterSeconds === undefined
            ? {}
            : { "Retry-After": String(publicError.retryAfterSeconds) }),
        },
      });
    }
    const publicError = publicNativeOkfChatError(error);
    return NextResponse.json(publicError.body, {
      status: publicError.status,
      headers: RESPONSE_HEADERS,
    });
  }
}
