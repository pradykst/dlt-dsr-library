import { NextResponse } from "next/server";
import { assertAdminSecret, jsonError, readableError, upsertByKey } from "@/lib/workbench/api";
import { mapElement, mapEvidence, mapPaper, mapRelation, validateWorkbenchRows } from "@/lib/workbench/csv";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";
import type { ImportPayload } from "@/lib/workbench/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ImportPayload;
    if (!assertAdminSecret(body.adminSecret)) return jsonError("Unauthorized.", 401);

    const rows = {
      papers: body.papersRows ?? [],
      elements: body.elementsRows ?? [],
      relations: body.relationsRows ?? [],
      evidence: body.evidenceRows ?? []
    };
    const validation = validateWorkbenchRows(rows);
    if (validation.errors.length) return jsonError("Import validation failed.", 400, validation.errors);

    const supabase = getSupabaseAdmin();
    const paper = mapPaper(rows.papers[0]);
    const elements = rows.elements.map(mapElement);
    const evidence = rows.evidence.map(mapEvidence);
    const relations = rows.relations.map(mapRelation);

    const paperUpsert = await supabase.from("papers").upsert(paper, { onConflict: "paper_id" });
    if (paperUpsert.error) throw new Error(`papers upsert failed: ${readableError(paperUpsert.error)}`);

    const batchInsert = await supabase
      .from("import_batches")
      .insert({
        paper_id: paper.paper_id,
        import_label: `Workbench import ${new Date().toISOString()}`,
        imported_by: "workbench",
        status: "running",
        rows_papers: rows.papers.length,
        rows_elements: rows.elements.length,
        rows_relations: rows.relations.length,
        rows_evidence: rows.evidence.length
      })
      .select("id")
      .single();
    if (batchInsert.error) throw new Error(`import_batches insert failed: ${readableError(batchInsert.error)}`);

    for (const row of elements) await upsertByKey("elements", row, ["paper_id", "element_id"]);
    for (const row of evidence) await upsertByKey("evidence", row, ["paper_id", "evidence_id"]);
    for (const row of relations) await upsertByKey("relations", row, ["paper_id", "relation_id"]);

    const batchUpdate = await supabase
      .from("import_batches")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", batchInsert.data.id);
    if (batchUpdate.error) throw new Error(`import_batches update failed: ${readableError(batchUpdate.error)}`);

    return NextResponse.json({
      paper_id: paper.paper_id,
      rows_papers: rows.papers.length,
      rows_elements: rows.elements.length,
      rows_relations: rows.relations.length,
      rows_evidence: rows.evidence.length,
      warnings: validation.warnings
    });
  } catch (error) {
    return jsonError("Import failed.", 500, readableError(error));
  }
}
