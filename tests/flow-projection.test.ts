import assert from "node:assert/strict";
import {
  getAvailableSourceViews,
  projectFullRelations,
  projectRecommendedFlow,
  projectSourceView,
  validateProjectedFlow,
  type CanonicalFlowBundle
} from "../lib/okf/flow-projection.ts";
import {
  findDuplicateNodePositions,
  findNodeOverlaps,
  findStraightEdgeNodeIntersections,
  layoutProjectedFlow,
  preservesProjectedLayerOrder
} from "../lib/okf/flow-layout.ts";
import type { OkfConcept, OkfRelation, OkfSourceView } from "../lib/okf/schema.ts";

const paperId = "NEUTRAL_FIXTURE_2099";
const concepts: OkfConcept[] = [
  concept("requirement-a", "Design Requirement"),
  concept("requirement-b", "Design Requirement"),
  concept("principle-a", "Design Principle"),
  concept("feature-a", "Design Feature"),
  concept("feature-b", "Design Feature"),
  concept("artifact-a", "Artifact")
];
const relations: OkfRelation[] = [
  relation("rel-1", "requirement-a", "principle-a", "explicit"),
  relation("rel-2", "requirement-b", "principle-a", "explicit-in-artifact"),
  relation("rel-3", "principle-a", "feature-a", "explicit"),
  relation("rel-4", "principle-a", "feature-b", "explicit-in-artifact"),
  relation("rel-5", "feature-a", "artifact-a", "inferred")
];
const sourceView: OkfSourceView = {
  source_view_id: "formal-view",
  title: "Formal model",
  view_type: "paper_figure",
  source_reference: {
    type: "paper_figure",
    label: "Figure A",
    page: 4,
    caption: "Formal model caption.",
    validation_status: "unreviewed",
    validation_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    author_verification: null
  },
  layers: [
    { concept_type: "Design Requirement", node_ids: [id("requirement-b"), id("requirement-a")] },
    { concept_type: "Design Principle", node_ids: [id("principle-a")] },
    { concept_type: "Design Feature", node_ids: [id("feature-b"), id("feature-a")] }
  ],
  edge_ids: [id("rel-1"), id("rel-2"), id("rel-3"), id("rel-4")],
  ordering: {
    layer_order: ["Design Requirement", "Design Principle", "Design Feature"],
    node_order: {
      "Design Requirement": [id("requirement-b"), id("requirement-a")],
      "Design Principle": [id("principle-a")],
      "Design Feature": [id("feature-b"), id("feature-a")]
    }
  },
  layout: {
    direction: "LEFT_TO_RIGHT",
    preserve_source_order: true,
    semantic_parity: true,
    ordering_parity: true,
    visual_parity: "automatic_approximation"
  }
};
const bundle: CanonicalFlowBundle = {
  paper_id: paperId,
  concepts,
  relations,
  source_views: [sourceView],
  recommended_paths: [[id("requirement-a"), id("principle-a"), id("feature-a")]]
};

assert.equal(getAvailableSourceViews(bundle).length, 1);
const sourceViewWithUnknownKey = structuredClone(sourceView) as OkfSourceView & {
  layout: OkfSourceView["layout"] & { route_style: string };
};
sourceViewWithUnknownKey.layout.route_style = "orthogonal";
const invalidSourceBundle = { ...bundle, source_views: [sourceViewWithUnknownKey] };
assert.equal(getAvailableSourceViews(invalidSourceBundle).length, 0);
assert.throws(
  () => projectSourceView(invalidSourceBundle, "formal-view"),
  /unavailable or structurally invalid/
);
const exact = projectSourceView(bundle, "formal-view");
assert.deepEqual(exact.ordered_node_ids, sourceView.ordering.layer_order.flatMap((layer) => sourceView.ordering.node_order[layer] ?? []));
assert.deepEqual(exact.edges.map((edge) => edge.id), sourceView.edge_ids);
assert.ok(exact.edges.every((edge) => edge.provenance === "source_view_explicit"));
assert.deepEqual(validateProjectedFlow(exact), []);

const recommended = projectRecommendedFlow(bundle);
assert.equal(recommended.title, "Recommended Flow");
assert.equal(recommended.subtitle, "Recommended stored pathway");
assert.deepEqual(recommended.edges.map((edge) => edge.id).sort(), [id("rel-1"), id("rel-3")].sort());

const full = projectFullRelations(bundle);
assert.equal(full.subtitle, "Canonical OKF relations");
assert.equal(full.edges.length, relations.length);
assert.equal(full.edges.find((edge) => edge.id === id("rel-5"))?.provenance, "inferred");

const layoutInput = {
  nodes: exact.nodes,
  edges: exact.edges,
  layers: exact.layers,
  node_order: exact.node_order,
  layout_hints: exact.layout_hints
};
const firstLayout = await layoutProjectedFlow(layoutInput);
const secondLayout = await layoutProjectedFlow(layoutInput);
assert.deepEqual(firstLayout, secondLayout);
assert.deepEqual(findNodeOverlaps(firstLayout.nodes), []);
assert.deepEqual(findDuplicateNodePositions(firstLayout.nodes), []);
assert.equal(preservesProjectedLayerOrder(layoutInput, firstLayout), true);
assert.ok(firstLayout.edges.every((edge) => edge.source_handle && edge.target_handle));
assert.ok(firstLayout.edges.every((edge) => edge.path_kind === "straight"));

console.log("flow-projection tests passed");

assert.deepEqual(findStraightEdgeNodeIntersections(firstLayout), []);
function concept(localId: string, type: OkfConcept["type"]): OkfConcept {
  return {
    concept_id: id(localId),
    paper_id: paperId,
    type,
    dsr_layer: type,
    title: localId.replaceAll("-", " "),
    description: `Canonical description for ${localId}.`,
    body_text: "",
    evidence_ids: [],
    tags: [],
    confidence: "high",
    extraction_type: "explicit",
    review_status: "unreviewed",
    source_file: "fixture/dsr.md"
  };
}

function relation(localId: string, source: string, target: string, extractionType: OkfRelation["extraction_type"]): OkfRelation {
  return {
    relation_id: id(localId),
    source_concept_id: id(source),
    predicate: "implements",
    target_concept_id: id(target),
    confidence: "high",
    extraction_type: extractionType,
    relation_scope: "paper_level",
    source_file: "fixture/relations.yaml"
  };
}

function id(localId: string) {
  return `${paperId}:${localId}`;
}
