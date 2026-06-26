import type { OkfKnowledgeBase } from "./schema.ts";

export async function indexOkfKnowledgeBase(kb: OkfKnowledgeBase) {
  const summary = {
    papers: kb.papers.length,
    concepts: kb.concepts.length,
    relations: kb.relations.length,
    evidence_items: kb.evidence_items.length,
    warnings: kb.warnings.map((warning) => `${warning.file}: ${warning.message}`),
    indexed_to_database: false
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    summary.warnings.push("Supabase env vars are not set; parsed OKF only and skipped database upsert.");
    return summary;
  }

  const { getSupabaseAdmin } = await import("../workbench/supabase-admin.ts");
  const supabase = getSupabaseAdmin();
  await upsertRows(supabase, "papers", kb.papers.map((paper) => ({
    paper_id: paper.paper_id,
    title: paper.title,
    authors: paper.authors ?? null,
    year: paper.year ?? null,
    source_pdf_path: paper.source_pdf_path ?? null,
    review_status: paper.review_status,
    updated_at: new Date().toISOString()
  })), "paper_id");

  await upsertRows(supabase, "concepts", kb.concepts.map((concept) => ({
    concept_id: concept.concept_id,
    paper_id: concept.paper_id,
    okf_path: concept.okf_path ?? concept.source_file,
    type: concept.type,
    dsr_layer: concept.dsr_layer,
    title: concept.title,
    description: concept.description,
    body_text: concept.body_text,
    tags: concept.tags,
    confidence: concept.confidence,
    extraction_type: concept.extraction_type,
    review_status: concept.review_status,
    updated_at: new Date().toISOString()
  })), "concept_id");

  await upsertRows(supabase, "evidence_items", kb.evidence_items.map((item) => ({
    evidence_id: item.evidence_id,
    paper_id: item.paper_id,
    concept_id: item.concept_id ?? null,
    page_number: item.page_number ?? null,
    section: item.section ?? null,
    quote: item.quote ?? null,
    paraphrase: item.paraphrase,
    source_location: item.source_location ?? null,
    confidence: item.confidence
  })), "evidence_id");

  await upsertRows(supabase, "relations", kb.relations.map((relation) => ({
    relation_id: relation.relation_id,
    source_concept_id: relation.source_concept_id,
    predicate: relation.predicate,
    target_concept_id: relation.target_concept_id,
    evidence_id: relation.evidence_id ?? null,
    confidence: relation.confidence,
    relation_scope: relation.relation_scope
  })), "relation_id");

  summary.indexed_to_database = true;
  return summary;
}

type SupabaseLike = { from: (table: string) => { upsert: (rows: Record<string, unknown>[], options: { onConflict: string }) => PromiseLike<{ error?: { message: string } | null }> } };

async function upsertRows(supabase: SupabaseLike, table: string, rows: Record<string, unknown>[], key: string) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: key });
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
}


