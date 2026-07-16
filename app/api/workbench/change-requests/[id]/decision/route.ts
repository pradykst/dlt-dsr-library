import { NextResponse } from "next/server";
import { assertAdminSecret, readableError } from "@/lib/workbench/api";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";
import type { WorkbenchChangeStatus } from "@/lib/workbench/types";

type Decision = Exclude<WorkbenchChangeStatus, "open">;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!assertAdminSecret(body.adminSecret)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const decision = normalizeDecision(body.decision);
    if (!decision) {
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

    const decisionNote = [
      `Canonical status: ${decision}`,
      body.admin_decision_note ? String(body.admin_decision_note) : undefined
    ].filter(Boolean).join("\n\n");
    const { error: updateError } = await supabase
      .from("change_requests")
      .update({
        status: legacyStatus(decision),
        admin_decision_note: decisionNote,
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
      message: decision === "accepted_for_git_change"
        ? "Request accepted for a Git change and re-index. Canonical OKF data was not modified."
        : decision === "resolved_after_reindex"
          ? "Request marked resolved after the canonical Git change was re-indexed."
          : "Request rejected. Canonical OKF data was not modified."
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

function normalizeDecision(value: unknown): Decision | undefined {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "accepted" || normalized === "accepted_for_git_change") return "accepted_for_git_change";
  if (normalized === "rejected") return "rejected";
  if (normalized === "resolved_after_reindex") return "resolved_after_reindex";
  return undefined;
}

function legacyStatus(decision: Decision) {
  if (decision === "rejected") return "rejected";
  return "accepted";
}