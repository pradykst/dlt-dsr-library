import "server-only";

import {
  handleResearchAccessDelete,
  handleResearchAccessGet,
  handleResearchAccessPost,
} from "@/src/native-okf/server/access/access-service";
import { getNativeOkfAdminRateLimiter } from "@/src/native-okf/server/access/admin-rate-limit";
import { readNativeOkfAccessRuntimeConfig } from "@/src/native-okf/server/access/runtime";
import { getNativeOkfOperationalStore } from "@/src/native-okf/server/access/store-singleton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unavailableResponse() {
  return Response.json(
    { error: "Research access is currently unavailable." },
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
    loginRateLimiter: getNativeOkfAdminRateLimiter(),
    store: getNativeOkfOperationalStore(config),
    production: process.env.NODE_ENV === "production",
  };
}

export async function GET(request: Request) {
  try {
    return await handleResearchAccessGet(request, dependencies());
  } catch {
    return unavailableResponse();
  }
}

export async function POST(request: Request) {
  try {
    return await handleResearchAccessPost(request, dependencies());
  } catch {
    return unavailableResponse();
  }
}

export async function DELETE(request: Request) {
  try {
    return await handleResearchAccessDelete(request, dependencies());
  } catch {
    return unavailableResponse();
  }
}

