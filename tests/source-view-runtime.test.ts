import assert from "node:assert/strict";
import test from "node:test";
import { serializeOkfPaperMetadata } from "../lib/okf/indexer.ts";
import { loadOkfKnowledgeBaseFromSupabase, sourceViewsValue } from "../lib/okf/retrieval.ts";
import type { OkfSourceView } from "../lib/okf/schema.ts";

const paperId = "NEUTRAL_RUNTIME_FLOW_2026";
const requirementId = `${paperId}:dr_001`;
const principleId = `${paperId}:dp_001`;
const featureId = `${paperId}:df_001`;
const firstRelationId = `${paperId}:rel_001`;
const secondRelationId = `${paperId}:rel_002`;

const sourceView: OkfSourceView = {
  source_view_id: "neutral_runtime_view",
  title: "Neutral source view",
  view_type: "paper_figure",
  source_reference: {
    type: "paper_figure",
    label: "Figure 1",
    page: 1,
    caption: "Neutral source figure.",
    validation_status: "unreviewed",
    validation_notes: "Awaiting review.",
    reviewed_by: null,
    reviewed_at: null,
    author_verification: null
  },
  layers: [
    { concept_type: "Design Requirement", node_ids: [requirementId] },
    { concept_type: "Design Principle", node_ids: [principleId] },
    { concept_type: "Design Feature", node_ids: [featureId] }
  ],
  edge_ids: [firstRelationId, secondRelationId],
  ordering: {
    layer_order: ["Design Requirement", "Design Principle", "Design Feature"],
    node_order: {
      "Design Requirement": [requirementId],
      "Design Principle": [principleId],
      "Design Feature": [featureId]
    }
  },
  layout: {
    direction: "LEFT_TO_RIGHT",
    preserve_source_order: true,
    semantic_parity: false,
    ordering_parity: true,
    visual_parity: "automatic_approximation"
  }
};

test("Supabase paper metadata preserves canonical source views through runtime loading", async () => {
  const rows: Record<string, Record<string, unknown>[]> = {
    okf_papers: [{
      paper_id: paperId,
      schema_version: "okf-dsr-v1",
      slug: "neutral-runtime-flow-2026",
      title: "Neutral runtime flow",
      research_problem: [],
      research_objective: [],
      research_questions: [],
      theoretical_foundations: [],
      evaluation_method: [],
      key_contributions: [],
      design_knowledge_output: [],
      limitations: [],
      extraction_status: "indexed_from_canonical_okf",
      review_status: "unreviewed",
      author_check_status: "not_requested",
      paper_metadata: { source_views: [sourceView] }
    }],
    okf_concepts: [
      conceptRow(requirementId, "Design Requirement"),
      conceptRow(principleId, "Design Principle"),
      conceptRow(featureId, "Design Feature")
    ],
    okf_evidence_items: [],
    okf_relations: [
      relationRow(firstRelationId, requirementId, principleId, "addressed_by"),
      relationRow(secondRelationId, principleId, featureId, "instantiates")
    ]
  };
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const table = new URL(String(input)).pathname.split("/").at(-1) ?? "";
    return Response.json(rows[table] ?? []);
  }) as typeof fetch;

  const kb = await loadOkfKnowledgeBaseFromSupabase({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "sb_secret_neutral"
    },
    fetchImpl
  });

  assert.ok(kb);
  assert.deepEqual(kb.papers[0].source_views, [sourceView]);
  assert.deepEqual(serializeOkfPaperMetadata(kb.papers[0]).source_views, [sourceView]);
});

test("runtime source-view parsing accepts JSON and falls back on malformed metadata", () => {
  assert.deepEqual(sourceViewsValue(JSON.stringify([sourceView]), undefined), [sourceView]);
  assert.deepEqual(sourceViewsValue([{ ...sourceView, layout: { direction: "SIDEWAYS" } }], [sourceView]), [sourceView]);
  assert.deepEqual(sourceViewsValue(undefined, [sourceView]), [sourceView]);
});

function conceptRow(conceptId: string, type: string) {
  return {
    concept_id: conceptId,
    paper_id: paperId,
    type,
    title: type,
    description: "Neutral description.",
    body_text: "Neutral description.",
    evidence: [],
    tags: [],
    confidence: "high",
    extraction_type: "explicit",
    review_status: "unreviewed"
  };
}

function relationRow(
  relationId: string,
  source: string,
  target: string,
  predicate: string
) {
  return {
    relation_id: relationId,
    source_concept_id: source,
    target_concept_id: target,
    predicate,
    evidence: [],
    confidence: "high",
    extraction_type: "explicit-in-artifact",
    relation_scope: "paper_level"
  };
}
