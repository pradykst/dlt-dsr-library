import { NextResponse } from "next/server";
import { isEditableField, jsonError } from "@/lib/workbench/api";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.paper_id || !body.target_table || !body.target_row_key || !body.target_field || !body.proposed_value) {
      return jsonError("Missing required change request fields.", 400);
    }
    if (!isEditableField(body.target_table, body.target_field)) {
      return jsonError("Target field is not editable through the workbench.", 400);
    }

    const { data, error } = await getSupabaseAdmin()
      .from("change_requests")
      .insert({
        paper_id: body.paper_id,
        target_table: body.target_table,
        target_row_key: body.target_row_key,
        target_field: body.target_field,
        old_value: body.old_value ?? null,
        proposed_value: body.proposed_value,
        reason: body.reason ?? null,
        evidence_note: body.evidence_note ?? null,
        submitted_by_name: body.submitted_by_name ?? null,
        submitted_by_email: body.submitted_by_email ?? null,
        submitted_by_role: body.submitted_by_role ?? "Other",
        status: "pending"
      })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ id: data.id, status: "pending" });
  } catch (error) {
    return jsonError("Could not submit change request.", 500, error instanceof Error ? error.message : String(error));
  }
}
