import { NextResponse } from "next/server";
import { getWorkbenchPaper, workbenchCanonicalTargetPath, workbenchChangeTargetExists } from "@/lib/okf/workbench-adapter";
import { readableError } from "@/lib/workbench/api";
import { isWorkbenchChangeTarget } from "@/lib/workbench/schema";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";
import type { WorkbenchChangeTargetType } from "@/lib/workbench/types";

const legacyTables: Record<WorkbenchChangeTargetType, "papers" | "elements" | "relations" | "evidence"> = {
  presentation: "papers",
  paper: "papers",
  concept: "elements",
  relation: "relations",
  evidence: "evidence",
  graph: "relations"
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const paperId = String(body.paper_id ?? "").trim();
    const targetType = normalizeTargetType(body.target_type ?? body.target_table);
    const targetId = String(body.target_id ?? body.target_row_key ?? "").trim();
    const field = String(body.field ?? body.target_field ?? "").trim();
    const proposedValue = body.proposed_value == null ? "" : String(body.proposed_value);
    const reason = String(body.reason ?? "").trim();
    if (!paperId || !targetType || !targetId || !field || !proposedValue.trim() || !reason) {
      return NextResponse.json({ ok: false, error: "MISSING_CHANGE_REQUEST_FIELDS" }, { status: 400 });
    }
    if (!isWorkbenchChangeTarget(targetType, field)) {
      return NextResponse.json({ ok: false, error: "INVALID_CHANGE_TARGET" }, { status: 400 });
    }

    const bundle = await getWorkbenchPaper(paperId);
    if (!bundle) {
      return NextResponse.json({ ok: false, error: "PAPER_NOT_FOUND", paperId }, { status: 404 });
    }
    if (!workbenchChangeTargetExists(bundle, targetType, targetId)) {
      return NextResponse.json({
        ok: false,
        error: "CHANGE_TARGET_NOT_FOUND",
        paperId: bundle.paper.paper_id,
        target_type: targetType,
        target_id: targetId
      }, { status: 400 });
    }
    const canonicalPaperId = bundle.paper.paper_id;
    const canonicalTargetId = targetType === "paper" || targetType === "presentation" || targetType === "graph"
      ? canonicalPaperId
      : targetId;
    const targetOkfPath = workbenchCanonicalTargetPath(bundle, targetType);
    const evidenceNote = [
      `Target type: ${targetType}`,
      `Target OKF file: ${targetOkfPath}`,
      body.evidence_note ? String(body.evidence_note) : undefined
    ].filter(Boolean).join("\n\n");

    const { data, error } = await getSupabaseAdmin()
      .from("change_requests")
      .insert({
        paper_id: canonicalPaperId,
        target_table: legacyTables[targetType],
        target_row_key: canonicalTargetId,
        target_field: field,
        old_value: body.current_value ?? body.old_value ?? null,
        proposed_value: proposedValue,
        reason,
        evidence_note: evidenceNote,
        submitted_by_name: body.submitted_by_name ?? null,
        submitted_by_email: body.submitted_by_email ?? null,
        submitted_by_role: body.submitted_by_role ?? "Other",
        status: "pending"
      })
      .select("id")
      .single();
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      id: data.id,
      status: "open",
      target_type: targetType,
      target_id: canonicalTargetId,
      field,
      target_okf_path: targetOkfPath,
      canonical_workflow: "git_change_required",
      canonical_data_modified: false,
      message: "Change request submitted for Git review. Canonical OKF data was not modified."
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "CHANGE_REQUEST_SUBMIT_FAILED",
      message: "Could not submit change request.",
      details: readableError(error)
    }, { status: 500 });
  }
}

function normalizeTargetType(value: unknown): WorkbenchChangeTargetType | undefined {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "paper" || normalized === "papers") return "paper";
  if (normalized === "concept" || normalized === "element" || normalized === "elements") return "concept";
  if (normalized === "presentation") return "presentation";
  if (normalized === "relation" || normalized === "relations") return "relation";
  if (normalized === "evidence") return "evidence";
  if (normalized === "graph") return "graph";
  return undefined;
}