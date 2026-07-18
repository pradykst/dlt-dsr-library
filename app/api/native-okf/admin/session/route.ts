import "server-only";

import {
  handleAdminSessionDelete,
  handleAdminSessionGet,
  handleAdminSessionPost,
} from "@/src/native-okf/server/access/admin-service";
import { getNativeOkfAdminRateLimiter } from "@/src/native-okf/server/access/admin-rate-limit";
import { readNativeOkfAccessRuntimeConfig } from "@/src/native-okf/server/access/runtime";
import { getNativeOkfOperationalStore } from "@/src/native-okf/server/access/store-singleton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unavailableResponse() {
  return Response.json(
    { error: "Administrative controls are currently unavailable." },
    {
      status: 503,
      headers: {
        "cache-control": "no-store, max-age=0",
        "x-content-type-options": "nosniff",
        vary: "Cookie",
      },
    },
  );
}

function dependencies() {
  const config = readNativeOkfAccessRuntimeConfig();
  return {
    config,
    store: getNativeOkfOperationalStore(config),
    rateLimiter: getNativeOkfAdminRateLimiter(),
    production: process.env.NODE_ENV === "production",
  };
}

export async function GET(request: Request) {
  try {
    return await handleAdminSessionGet(request, dependencies());
  } catch {
    return unavailableResponse();
  }
}

export async function POST(request: Request) {
  try {
    return await handleAdminSessionPost(request, dependencies());
  } catch {
    return unavailableResponse();
  }
}

export async function DELETE(request: Request) {
  try {
    return await handleAdminSessionDelete(request, dependencies());
  } catch {
    return unavailableResponse();
  }
}

