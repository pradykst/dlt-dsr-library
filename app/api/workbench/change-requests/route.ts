import { NextResponse } from "next/server";
import { assertAdminSecret, readableError } from "@/lib/workbench/api";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const adminSecret = request.headers.get("x-admin-secret");
    const status = url.searchParams.get("status");
    const paperId = url.searchParams.get("paperId");
    if (!assertAdminSecret(adminSecret)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    let query = getSupabaseAdmin().from("change_requests").select("*").order("created_at", { ascending: false });
    if (status && status !== "all") query = query.eq("status", status);
    if (paperId) query = query.eq("paper_id", paperId);
    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      changeRequests: (data ?? []).map((row) => ({
        ...row,
        target_okf_path: targetPathFromEvidenceNote(row.evidence_note),
        canonical_workflow: "git_change_required"
      }))
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "CHANGE_REQUESTS_LOAD_FAILED",
      message: "Could not load change requests.",
      details: readableError(error)
    }, { status: 500 });
  }
}

function targetPathFromEvidenceNote(value: unknown) {
  return String(value ?? "").match(/^Target OKF file:\s*(.+)$/m)?.[1]?.trim() ?? null;
}
