import { NextResponse } from "next/server";
import { assertAdminSecret, coerceDecisionValue, isEditableField, jsonError } from "@/lib/workbench/api";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";

type Decision = "accepted" | "rejected" | "needs_clarification";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!assertAdminSecret(body.adminSecret)) return jsonError("Unauthorized.", 401);
    if (!["accepted", "rejected", "needs_clarification"].includes(body.decision)) {
      return jsonError("Invalid decision.", 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: changeRequest, error: loadError } = await supabase
      .from("change_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!changeRequest) return jsonError("Change request not found.", 404);

    const decision = body.decision as Decision;
    if (decision === "accepted") {
      if (!isEditableField(changeRequest.target_table, changeRequest.target_field)) {
        return jsonError("Target field is not editable through the workbench.", 400);
      }
      await updateTargetField(
        changeRequest.target_table,
        changeRequest.target_row_key,
        changeRequest.target_field,
        coerceDecisionValue(changeRequest.proposed_value, changeRequest.target_field)
      );
    }

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

    return NextResponse.json({ id, status: decision });
  } catch (error) {
    return jsonError("Could not apply decision.", 500, error instanceof Error ? error.message : String(error));
  }
}

async function updateTargetField(table: string, targetRowKey: string, field: string, value: unknown) {
  const supabase = getSupabaseAdmin();
  if (table === "papers") {
    const { error } = await supabase.from("papers").update({ [field]: value }).eq("paper_id", targetRowKey);
    if (error) throw error;
    return;
  }

  const splitAt = targetRowKey.indexOf(":");
  if (splitAt < 1) throw new Error("Target row key must be PAPER_ID:ROW_ID.");
  const paperId = targetRowKey.slice(0, splitAt);
  const rowId = targetRowKey.slice(splitAt + 1);
  const idField = table === "elements" ? "element_id" : table === "relations" ? "relation_id" : "evidence_id";
  const { error } = await supabase.from(table).update({ [field]: value }).eq("paper_id", paperId).eq(idField, rowId);
  if (error) throw error;
}
