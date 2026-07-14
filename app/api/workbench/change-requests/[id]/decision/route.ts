import { NextResponse } from "next/server";
import { assertAdminSecret, readableError } from "@/lib/workbench/api";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";

type Decision = "accepted" | "rejected" | "needs_clarification";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!assertAdminSecret(body.adminSecret)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (!["accepted", "rejected", "needs_clarification"].includes(body.decision)) {
      return NextResponse.json({ ok: false, error: "INVALID_DECISION" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: changeRequest, error: loadError } = await supabase
      .from("change_requests")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!changeRequest) {
      return NextResponse.json({ ok: false, error: "CHANGE_REQUEST_NOT_FOUND" }, { status: 404 });
    }

    const decision = body.decision as Decision;
    const { error: updateError } = await supabase
      .from("change_requests")
      .update({
        status: decision,
        admin_decision_note: body.admin_decision_note ?? null,
        decided_by: body.decided_by ?? null,
        decided_at: new Date().toISOString()
      })
      .eq("id", id);
    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      id,
      status: decision,
      canonical_workflow: "git_change_required",
      canonical_data_modified: false,
      message: decision === "accepted"
        ? "Request approved for a Git change and re-index. Canonical OKF data was not modified."
        : `Request marked ${decision}. Canonical OKF data was not modified.`
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "CHANGE_REQUEST_DECISION_FAILED",
      message: "Could not record decision.",
      details: readableError(error)
    }, { status: 500 });
  }
}
