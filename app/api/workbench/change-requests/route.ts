import { NextResponse } from "next/server";
import { assertAdminSecret, readableError } from "@/lib/workbench/api";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";
import type { ChangeRequest, WorkbenchChangeStatus, WorkbenchChangeTargetType } from "@/lib/workbench/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const adminSecret = request.headers.get("x-admin-secret");
    const status = url.searchParams.get("status");
    const paperId = url.searchParams.get("paperId");
    const isAdmin = Boolean(adminSecret && assertAdminSecret(adminSecret));
    if (!isAdmin && !paperId) {
      return NextResponse.json({ ok: false, error: "PAPER_ID_REQUIRED" }, { status: 400 });
    }

    let query = getSupabaseAdmin().from("change_requests").select("*").order("created_at", { ascending: false });
    if (paperId) query = query.eq("paper_id", paperId);
    const { data, error } = await query;
    if (error) throw error;

    const requests = (data ?? [])
      .map(normalizeChangeRequest)
      .filter((row) => !status || status === "all" || row.status === status)
      .map((row) => isAdmin ? row : publicChangeRequest(row));

    return NextResponse.json({
      ok: true,
      changeRequests: requests,
      canonical_workflow: "git_change_required",
      canonical_data_modified: false
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

function normalizeChangeRequest(row: Record<string, unknown>): ChangeRequest {
  const evidenceNote = String(row.evidence_note ?? "");
  return {
    id: row.id ? String(row.id) : undefined,
    paper_id: String(row.paper_id ?? ""),
    target_type: targetTypeFromRow(row, evidenceNote),
    target_id: String(row.target_id ?? row.target_row_key ?? ""),
    field: String(row.field ?? row.target_field ?? ""),
    current_value: row.current_value == null ? row.old_value == null ? null : String(row.old_value) : String(row.current_value),
    proposed_value: String(row.proposed_value ?? ""),
    reason: row.reason == null ? null : String(row.reason),
    evidence_note: evidenceNote || null,
    submitted_by_name: row.submitted_by_name == null ? null : String(row.submitted_by_name),
    submitted_by_email: row.submitted_by_email == null ? null : String(row.submitted_by_email),
    submitted_by_role: row.submitted_by_role == null ? null : String(row.submitted_by_role),
    status: canonicalStatus(row.status, row.admin_decision_note),
    admin_decision_note: row.admin_decision_note == null ? null : String(row.admin_decision_note),
    decided_by: row.decided_by == null ? null : String(row.decided_by),
    decided_at: row.decided_at == null ? null : String(row.decided_at),
    created_at: row.created_at == null ? undefined : String(row.created_at),
    updated_at: row.updated_at == null ? undefined : String(row.updated_at),
    target_okf_path: targetPathFromEvidenceNote(evidenceNote),
    canonical_workflow: "git_change_required"
  };
}

function publicChangeRequest(row: ChangeRequest): ChangeRequest {
  return {
    ...row,
    evidence_note: null,
    submitted_by_name: null,
    submitted_by_email: null,
    submitted_by_role: null,
    admin_decision_note: null,
    decided_by: null
  };
}

function targetTypeFromRow(row: Record<string, unknown>, evidenceNote: string): WorkbenchChangeTargetType {
  const explicit = String(row.target_type ?? evidenceNote.match(/^Target type:\s*(.+)$/m)?.[1] ?? "").toLowerCase();
  if (["paper", "presentation", "concept", "relation", "evidence", "graph"].includes(explicit)) return explicit as WorkbenchChangeTargetType;
  const table = String(row.target_table ?? "").toLowerCase();
  if (table === "papers") return "paper";
  if (table === "elements") return "concept";
  if (table === "relations") return "relation";
  return "evidence";
}

function canonicalStatus(value: unknown, decisionNote: unknown): WorkbenchChangeStatus {
  const marker = String(decisionNote ?? "").match(/^Canonical status:\s*(.+)$/m)?.[1]?.trim();
  if (marker === "resolved_after_reindex") return marker;
  const status = String(value ?? "").toLowerCase();
  if (status === "accepted" || status === "accepted_for_git_change") return "accepted_for_git_change";
  if (status === "rejected") return "rejected";
  if (status === "resolved_after_reindex") return "resolved_after_reindex";
  return "open";
}

function targetPathFromEvidenceNote(value: unknown) {
  return String(value ?? "").match(/^Target OKF file:\s*(.+)$/m)?.[1]?.trim() ?? null;
}