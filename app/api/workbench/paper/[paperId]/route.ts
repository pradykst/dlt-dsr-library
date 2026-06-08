import { NextResponse } from "next/server";
import { jsonError } from "@/lib/workbench/api";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";

export async function GET(_request: Request, context: any) {
  try {
    const { paperId } = await context.params;
    const supabase = getSupabaseAdmin();
    const [paperResult, elementsResult, relationsResult, evidenceResult, changeRequestsResult] = await Promise.all([
      supabase.from("papers").select("*").eq("paper_id", paperId).maybeSingle(),
      supabase.from("elements").select("*").eq("paper_id", paperId).order("display_order", { ascending: true }),
      supabase.from("relations").select("*").eq("paper_id", paperId).order("relation_id", { ascending: true }),
      supabase.from("evidence").select("*").eq("paper_id", paperId).order("evidence_id", { ascending: true }),
      supabase.from("change_requests").select("id", { count: "exact", head: true }).eq("paper_id", paperId)
    ]);

    if (paperResult.error) throw paperResult.error;
    if (elementsResult.error) throw elementsResult.error;
    if (relationsResult.error) throw relationsResult.error;
    if (evidenceResult.error) throw evidenceResult.error;
    if (changeRequestsResult.error) throw changeRequestsResult.error;
    if (!paperResult.data) return jsonError("Paper not found.", 404);

    return NextResponse.json({
      paper: paperResult.data,
      elements: elementsResult.data ?? [],
      relations: relationsResult.data ?? [],
      evidence: evidenceResult.data ?? [],
      changeRequestsCount: changeRequestsResult.count ?? 0
    });
  } catch (error) {
    return jsonError("Could not load paper workbench data.", 500, error instanceof Error ? error.message : String(error));
  }
}
