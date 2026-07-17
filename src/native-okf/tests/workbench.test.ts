import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import { getAllConcepts, getSubgraph } from "../server/index.ts";
import {
  getConceptWorkbenchViewModel,
  getGraphViewModel,
  getLibraryViewModel,
  getPaperWorkbenchViewModel,
  WORKBENCH_GRAPH_MAX_NODES,
} from "../server/workbench.ts";
import type { GraphDto, GraphEdgeDto, RelationshipDto } from "../shared/types.ts";

const BLOCKCHAIN_PAPER_ID = "papers/blockchain-iot-sensor-data";
const SOURCE_TO_SINK_ID = "design-knowledge/blockchain-iot-sensor-data-dp1";
const ALIGNING_PAPER_ID = "papers/aligning-newsvendors-scoring-rules";

function sorted(values: Iterable<string>): string[] {
  return [...values].sort();
}

test("library view model yields exactly 34 native paper cards", async () => {
  const library = await getLibraryViewModel();

  assert.equal(library.paperCount, 34);
  assert.equal(library.papers.length, 34);
  assert.equal(new Set(library.papers.map((paper) => paper.id)).size, 34);
  assert.ok(library.papers.every((paper) => paper.type === "paper"));
  assert.ok(library.papers.every((paper) => paper.id.startsWith("papers/")));
  assert.ok(library.papers.every((paper) => paper.filePath === `${paper.id}.md`));
});

test("library grouping is derived from the bundle's open native types", async () => {
  const [library, concepts] = await Promise.all([
    getLibraryViewModel(),
    getAllConcepts(),
  ]);
  const expectedCounts = new Map<string, number>();

  for (const concept of concepts) {
    expectedCounts.set(concept.type, (expectedCounts.get(concept.type) ?? 0) + 1);
  }

  assert.deepEqual(
    library.typeCounts.map(({ type, count }) => [type, count]),
    [...expectedCounts].sort(([left], [right]) => left.localeCompare(right)),
  );

  const expectedDesignCounts = [...expectedCounts]
    .filter(([type]) => type !== "paper" && type !== "reference")
    .sort(([left], [right]) => left.localeCompare(right));
  assert.deepEqual(
    library.filterOptions.types.map(({ type, count }) => [type, count]),
    expectedDesignCounts,
  );
  assert.equal(
    library.designKnowledgeCount,
    concepts.filter((concept) => concept.type !== "paper" && concept.type !== "reference")
      .length,
  );
});

test("blockchain IoT paper card includes its requirements, principles, and features", async () => {
  const library = await getLibraryViewModel();
  const paper = library.papers.find((candidate) => candidate.id === BLOCKCHAIN_PAPER_ID);
  assert.ok(paper);

  assert.deepEqual(
    paper.linkedTypeCounts.map(({ type, count }) => [type, count]),
    [
      ["design-feature", 9],
      ["design-principle", 4],
      ["design-requirement", 4],
    ],
  );
  assert.equal(paper.linkedConcepts.length, 17);
  assert.deepEqual(
    new Set(paper.linkedConcepts.map((concept) => concept.type)),
    new Set(["design-feature", "design-principle", "design-requirement"]),
  );
});

test("aligning-newsvendors paper card contains only its own two principles", async () => {
  const library = await getLibraryViewModel();
  const paper = library.papers.find((candidate) => candidate.id === ALIGNING_PAPER_ID);
  assert.ok(paper);

  assert.deepEqual(
    paper.linkedConcepts.map((concept) => concept.id),
    [
      "design-knowledge/aligning-newsvendors-scoring-rules-dp1",
      "design-knowledge/aligning-newsvendors-scoring-rules-dp2",
    ],
  );
  assert.deepEqual(
    paper.linkedTypeCounts.map(({ type, count }) => [type, count]),
    [["design-principle", 2]],
  );
});

test("full catch-all concept IDs and paper slugs resolve without basename loss", async () => {
  const [conceptView, paperView, missingView] = await Promise.all([
    getConceptWorkbenchViewModel([
      "design-knowledge",
      "blockchain-iot-sensor-data-dp1",
    ]),
    getPaperWorkbenchViewModel("aligning-newsvendors-scoring-rules"),
    getConceptWorkbenchViewModel(["design-knowledge", "not-present"]),
  ]);

  assert.equal(conceptView?.concept.id, SOURCE_TO_SINK_ID);
  assert.equal(conceptView?.kind, "concept");
  assert.equal(paperView?.concept.id, ALIGNING_PAPER_ID);
  assert.equal(paperView?.kind, "paper");
  assert.equal(missingView, undefined);
});

function graphEdgeIdentity(edge: {
  sourceId: string;
  targetId?: string;
  rawTarget: string;
  label: string;
  relationHint?: string;
  resolved: boolean;
  broken: boolean;
  external: boolean;
}) {
  return {
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    rawTarget: edge.rawTarget,
    label: edge.label,
    relationHint: edge.relationHint,
    resolved: edge.resolved,
    broken: edge.broken,
    external: edge.external,
  };
}

async function assertGraphMatchesRepository(depth: 1 | 2): Promise<GraphDto> {
  const [graph, subgraph] = await Promise.all([
    getGraphViewModel(SOURCE_TO_SINK_ID.split("/"), depth),
    getSubgraph([SOURCE_TO_SINK_ID], {
      depth,
      maxNodes: WORKBENCH_GRAPH_MAX_NODES,
      includeIncoming: true,
      includeOutgoing: true,
    }),
  ]);
  assert.ok(graph);

  assert.equal(graph.depth, depth);
  assert.equal(graph.truncated, subgraph.truncated);
  assert.deepEqual(
    graph.nodes.map((node) => node.id),
    sorted(subgraph.concepts.map((concept) => concept.id)),
  );
  assert.deepEqual(
    graph.nodes.filter((node) => node.seed).map((node) => node.id),
    [SOURCE_TO_SINK_ID],
  );
  assert.deepEqual(
    graph.edges.map(graphEdgeIdentity),
    subgraph.links.map((link) => {
      assert.ok(link.targetId);
      return graphEdgeIdentity(link);
    }),
  );

  return graph;
}

test("one-hop graph DTO exactly mirrors the repository subgraph", async () => {
  await assertGraphMatchesRepository(1);
});

test("two-hop graph DTO exactly mirrors the repository subgraph", async () => {
  const graph = await assertGraphMatchesRepository(2);
  assert.ok(graph.nodes.length >= 1);
  assert.ok(graph.nodes.length <= WORKBENCH_GRAPH_MAX_NODES);
});

test("relation hints survive into display-ready relationships and graph edges", async () => {
  const view = await getConceptWorkbenchViewModel(SOURCE_TO_SINK_ID.split("/"));
  assert.ok(view);

  const expectedHints = new Map([
    [BLOCKCHAIN_PAPER_ID, "Source paper"],
    ["design-knowledge/blockchain-iot-sensor-data-dr1", "Addresses"],
    ["design-knowledge/blockchain-iot-sensor-data-df1", "Implemented by"],
    ["design-knowledge/blockchain-iot-sensor-data-df3", "Implemented by"],
    ["design-knowledge/blockchain-iot-sensor-data-df6", "Implemented by"],
  ]);

  for (const [targetId, relationHint] of expectedHints) {
    const relationship: RelationshipDto | undefined = view.outgoing.find((candidate) => candidate.targetId === targetId);
    assert.ok(relationship, `missing outgoing relationship to ${targetId}`);
    assert.equal(relationship.relationHint, relationHint);
    assert.ok(relationship.displayTitle.trim().length > 0);
    assert.equal(relationship.direction, "outgoing");

    const edge: GraphEdgeDto | undefined = view.graphOneHop.edges.find((candidate) => candidate.targetId === targetId);
    assert.ok(edge, `missing graph edge to ${targetId}`);
    assert.equal(edge.relationHint, relationHint);
    assert.ok(edge.sourceTitle.trim().length > 0);
    assert.ok(edge.targetTitle.trim().length > 0);
  }
});
