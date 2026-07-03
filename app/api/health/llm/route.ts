import { NextResponse } from "next/server";
import { getConfiguredLlmProvider } from "@/lib/okf/llm.ts";

export async function GET() {
  const provider = getConfiguredLlmProvider();
  return NextResponse.json({ ok: provider === "none" || provider === "featherless", provider, featherless_configured: Boolean(process.env.FEATHERLESS_API_KEY && process.env.FEATHERLESS_MODEL) });
}

