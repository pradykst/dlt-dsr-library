import assert from "node:assert/strict";
import test from "node:test";
import { getSourceViewNodeIds, parseOkfSourceViews } from "../lib/okf/source-view.ts";
import { validateSourceViews } from "../lib/okf/source-view-validator.ts";
import { validateAllOkfSourceViews } from "../scripts/validate-okf-source-views.ts";

const paperId = "NEUTRAL_FLOW_2026";
const nodes = {
  requirement: paperId + ":dr_001",
  principleA: paperId + ":dp_001",
  principleB: paperId + ":dp_002",
  feature: paperId + ":df_001"
};
const relations = {
  first: paperId + ":rel_001",
  second: paperId + ":rel_002",
  third: paperId + ":rel_003"
};

const concepts = [
  { concept_id: nodes.requirement, paper_id: paperId, type: "Design Requirement" },
  { concept_id: nodes.principleA, paper_id: paperId, type: "Design Principle" },
  { concept_id: nodes.principleB, paper_id: paperId, type: "Design Principle" },
  { concept_id: nodes.feature, paper_id: paperId, type: "Design Feature" }
];
const canonicalRelations = [
  {
    relation_id: relations.first,
    source_concept_id: nodes.requirement,
    target_concept_id: nodes.principleA,
    extraction_type: "explicit",
    relation_scope: "paper_level"
  },
  {
    relation_id: relations.second,
    source_concept_id: nodes.requirement,
    target_concept_id: nodes.principleB,
    extraction_type: "explicit-in-artifact",
    relation_scope: "paper_level"
  },
  {
    relation_id: relations.third,
    source_concept_id: nodes.principleA,
    target_concept_id: nodes.feature,
    extraction_type: "explicit",
    relation_scope: "paper_level"
  }
];

function validView() {
  return {
    source_view_id: "neutral_formal_model",
    title: "Neutral formal model",
    view_type: "paper_figure",
    source_reference: {
      type: "paper_figure",
      label: "Figure 1",
      page: 4,
      caption: "Neutral formal model.",
      validation_status: "unreviewed",
      validation_notes: "Awaiting semantic review.",
      reviewed_by: null,
      reviewed_at: null,
      author_verification: null
    },
    layers: [
      { concept_type: "Design Requirement", node_ids: [nodes.requirement] },
      { concept_type: "Design Principle", node_ids: [nodes.principleA, nodes.principleB] },
      { concept_type: "Design Feature", node_ids: [nodes.feature] }
    ],
    edge_ids: [relations.first, relations.second, relations.third],
    ordering: {
      layer_order: ["Design Requirement", "Design Principle", "Design Feature"],
      node_order: {
        "Design Requirement": [nodes.requirement],
        "Design Principle": [nodes.principleA, nodes.principleB],
        "Design Feature": [nodes.feature]
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
}

function validate(view: unknown, relationInputs = canonicalRelations) {
  return validateSourceViews([view], {
    paper_id: paperId,
    concepts,
    relations: relationInputs
  });
}

test("generic source view validates and parser preserves exact stored node order", () => {
  const view = validView();
  const validation = validate(view);
  assert.equal(validation.ok, true);
  assert.equal(validation.entries[0].semantic_status, "unreviewed");

  const parsed = parseOkfSourceViews([view]);
  assert.equal(parsed.length, 1);
  assert.deepEqual(getSourceViewNodeIds(parsed[0]), [
    nodes.requirement,
    nodes.principleA,
    nodes.principleB,
    nodes.feature
  ]);
  assert.deepEqual(parsed[0].ordering.node_order["Design Principle"], [
    nodes.principleA,
    nodes.principleB
  ]);
});

test("source view rejects unknown nested keys before parser sanitization and incomplete ordering", () => {
  const unknownKey = validView();
  Object.assign(unknownKey.layout, { route_style: "orthogonal" });
  assert.ok(validate(unknownKey).issues.some((issue) => issue.code === "SOURCE_VIEW_LAYOUT_KEYS"));
  const warnings: Array<{ file: string; message: string }> = [];
  assert.deepEqual(parseOkfSourceViews([unknownKey], "fixture/graph.json", warnings), []);
  assert.ok(warnings.some((warning) => warning.message.includes("SOURCE_VIEW_LAYOUT_KEYS")));

  const badOrder = validView();
  badOrder.ordering.node_order["Design Principle"] = [nodes.principleB, nodes.principleA];
  assert.ok(validate(badOrder).issues.some((issue) => issue.code === "SOURCE_VIEW_NODE_ORDER_MISMATCH"));
});

test("source view rejects inferred and query-generated canonical relations", () => {
  const inferred = canonicalRelations.map((relation, index) =>
    index === 0 ? { ...relation, extraction_type: "inferred" } : relation
  );
  assert.ok(validate(validView(), inferred).issues.some((issue) => issue.code === "SOURCE_VIEW_INFERRED_EDGE"));

  const generated = canonicalRelations.map((relation, index) =>
    index === 1 ? { ...relation, relation_scope: "query_generated" } : relation
  );
  assert.ok(validate(validView(), generated).issues.some((issue) => issue.code === "SOURCE_VIEW_QUERY_GENERATED_EDGE"));
});

test("source view rejects review and visual-parity claims without review metadata", () => {
  const view = validView();
  view.source_reference.validation_status = "internally_validated";
  view.layout.visual_parity = "manually_validated";
  const issues = validate(view).issues.map((issue) => issue.code);
  assert.ok(issues.includes("SOURCE_VIEW_INTERNAL_REVIEW_METADATA_MISSING"));
  assert.ok(issues.includes("SOURCE_VIEW_VISUAL_PARITY_REVIEW_MISSING"));
});

test("source view rejects wrong-paper IDs and edges with endpoints outside the view", () => {
  const wrongPaper = validView();
  wrongPaper.layers[0].node_ids[0] = "OTHER_PAPER:dr_001";
  const issues = validate(wrongPaper).issues.map((issue) => issue.code);
  assert.ok(issues.includes("SOURCE_VIEW_NODE_PAPER_MISMATCH"));
  assert.ok(issues.includes("SOURCE_VIEW_EDGE_ENDPOINT_OUTSIDE_VIEW"));
});

test("source view rejects non-string edge IDs rather than silently filtering them", () => {
  const badEdges = { ...validView(), edge_ids: [relations.first, 123] };
  assert.ok(validate(badEdges).issues.some((issue) => issue.code === "SOURCE_VIEW_EDGES_INVALID"));
});

test("repository source-view validator executes valid deterministic projections", () => {
  const rows = validateAllOkfSourceViews();
  const structurallyValid = rows.reduce(
    (count, row) => count + row.result.entries.filter((entry) => entry.structurally_valid).length,
    0
  );
  const checks = rows.flatMap((row) => row.projection_checks);
  assert.equal(checks.length, structurallyValid);
  assert.ok(checks.length > 0);
  assert.ok(checks.every((check) => check.projected));
  assert.ok(checks.every((check) => check.deterministic));
  assert.deepEqual(rows.flatMap((row) => row.projection_issues), []);
});