import { NextResponse } from "next/server";
import { assertAdminSecret, jsonError } from "@/lib/workbench/api";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const adminSecret = request.headers.get("x-admin-secret") ?? url.searchParams.get("adminSecret");
    const status = url.searchParams.get("status");
    const paperId = url.searchParams.get("paperId");
    if (!assertAdminSecret(adminSecret)) return jsonError("Unauthorized.", 401);

    let query = getSupabaseAdmin().from("change_requests").select("*").order("created_at", { ascending: false });
    if (status && status !== "all") query = query.eq("status", status);
    if (paperId) query = query.eq("paper_id", paperId);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ changeRequests: data ?? [] });
  } catch (error) {
    return jsonError("Could not load change requests.", 500, error instanceof Error ? error.message : String(error));
  }
}
