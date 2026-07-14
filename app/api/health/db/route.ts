import { NextResponse } from "next/server";
import { getOkfDatabaseHealthStatus } from "@/lib/okf/retrieval.ts";

export async function GET() {
  return NextResponse.json(await getOkfDatabaseHealthStatus());
}
