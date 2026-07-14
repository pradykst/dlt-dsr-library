import { NextResponse } from "next/server";
import { workbenchTargetOkfPath } from "@/lib/okf/workbench-adapter";
import { isEditableField, readableError } from "@/lib/workbench/api";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.paper_id || !body.target_table || !body.target_row_key || !body.target_field || !body.proposed_value) {
      return NextResponse.json({ ok: false, error: "MISSING_CHANGE_REQUEST_FIELDS" }, { status: 400 });
    }
    if (!isEditableField(body.target_table, body.target_field)) {
      return NextResponse.json({ ok: false, error: "INVALID_CHANGE_TARGET" }, { status: 400 });
    }

    const targetOkfPath = workbenchTargetOkfPath(String(body.paper_id), String(body.target_table));
    const evidenceNote = [
      `Target OKF file: ${targetOkfPath}`,
      body.evidence_note ? String(body.evidence_note) : undefined
    ].filter(Boolean).join("\n\n");

    const { data, error } = await getSupabaseAdmin()
      .from("change_requests")
      .insert({
        paper_id: String(body.paper_id),
        target_table: String(body.target_table),
        target_row_key: String(body.target_row_key),
        target_field: String(body.target_field),
        old_value: body.old_value ?? null,
        proposed_value: String(body.proposed_value),
        reason: body.reason ?? null,
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
      status: "pending",
      target_okf_path: targetOkfPath,
      canonical_workflow: "git_change_required",
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
