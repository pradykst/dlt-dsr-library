import "server-only";

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RETIRED_API_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function retiredApiResponse() {
  return NextResponse.json(
    { error: "Not found.", code: "not_found" },
    {
      status: 404,
      headers: RETIRED_API_HEADERS,
    },
  );
}

export const GET = retiredApiResponse;
export const HEAD = retiredApiResponse;
export const POST = retiredApiResponse;
export const PUT = retiredApiResponse;
export const PATCH = retiredApiResponse;
export const DELETE = retiredApiResponse;
export const OPTIONS = retiredApiResponse;
