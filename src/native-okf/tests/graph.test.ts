import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import {
  getConceptByPath,
  getIncomingLinks,
  getLinkedConcepts,
  getOutgoingLinks,
  getSubgraph,
  MAX_SUBGRAPH_DEPTH,
  MAX_SUBGRAPH_NODES,
} from "../server/index.ts";

const SOURCE_TO_SINK_ID = "design-knowledge/blockchain-iot-sensor-data-dp1";
const SOURCE_PAPER_ID = "papers/blockchain-iot-sensor-data";
const DR1_ID = "design-knowledge/blockchain-iot-sensor-data-dr1";
const IMPLEMENTING_FEATURE_IDS = [
  "design-knowledge/blockchain-iot-sensor-data-df1",
  "design-knowledge/blockchain-iot-sensor-data-df3",
  "design-knowledge/blockchain-iot-sensor-data-df6",
] as const;

function sorted(values: Iterable<string>): string[] {
  return [...values].sort();
}

test("source-to-sink DP1 links to its paper, DR1, and implementing features", async () => {
  const links = await getOutgoingLinks(SOURCE_TO_SINK_ID);
  const expectedTargets = [SOURCE_PAPER_ID, DR1_ID, ...IMPLEMENTING_FEATURE_IDS];

  assert.deepEqual(sorted(links.map((link) => link.targetId ?? "")), sorted(expectedTargets));
  assert.ok(links.every((link) => link.sourceId === SOURCE_TO_SINK_ID));
  assert.ok(links.every((link) => link.resolved && !link.broken && !link.external));
  assert.ok(links.every((link) => link.targetPath === `${link.targetId}.md`));

  const byTarget = new Map(links.map((link) => [link.targetId, link]));
  assert.equal(byTarget.get(SOURCE_PAPER_ID)?.rawTarget, "../papers/blockchain-iot-sensor-data.md");
  assert.equal(byTarget.get(SOURCE_PAPER_ID)?.relationHint, "Source paper");
  assert.equal(byTarget.get(DR1_ID)?.relationHint, "Addresses");
  for (const featureId of IMPLEMENTING_FEATURE_IDS) {
    assert.equal(byTarget.get(featureId)?.relationHint, "Implemented by");
  }
});

test("incoming backlinks are derived for linked concepts", async () => {
  const [paperBacklinks, requirementBacklinks, featureBacklinks] = await Promise.all([
    getIncomingLinks(SOURCE_PAPER_ID),
    getIncomingLinks(DR1_ID),
    getIncomingLinks(IMPLEMENTING_FEATURE_IDS[0]),
  ]);

  assert.ok(paperBacklinks.some((link) => link.sourceId === SOURCE_TO_SINK_ID));
  assert.ok(requirementBacklinks.some((link) => link.sourceId === SOURCE_TO_SINK_ID));
  assert.ok(featureBacklinks.some((link) => link.sourceId === SOURCE_TO_SINK_ID));

  const sourceConcept = await getConceptByPath(SOURCE_TO_SINK_ID);
  const targetConcept = await getConceptByPath(SOURCE_PAPER_ID);
  assert.ok(sourceConcept);
  assert.ok(targetConcept);
  assert.deepEqual(sourceConcept.outgoingLinks, await getOutgoingLinks(SOURCE_TO_SINK_ID));
  assert.deepEqual(targetConcept.incomingLinks, paperBacklinks);
});

test("peer-review DF1 resolves its source paper and implemented principles", async () => {
  const featureId = "design-knowledge/peer-review-token-incentives-df1";
  const feature = await getConceptByPath(featureId);
  assert.ok(feature);
  assert.equal(feature.type, "design-feature");
  assert.equal(feature.frontmatter.label, "DF1");

  const links = await getOutgoingLinks(featureId);
  assert.deepEqual(
    sorted(links.map((link) => link.targetId ?? "")),
    sorted([
      "papers/peer-review-token-incentives",
      "design-knowledge/peer-review-token-incentives-dp1",
      "design-knowledge/peer-review-token-incentives-dp2",
    ]),
  );
  assert.equal(
    links.find((link) => link.targetId === "papers/peer-review-token-incentives")
      ?.relationHint,
    "Source paper",
  );
  assert.ok(
    links
      .filter((link) => link.targetId?.includes("peer-review-token-incentives-dp"))
      .every((link) => link.relationHint === "Implements"),
  );
});

test("linked concepts include direct incoming and outgoing neighbors once", async () => {
  const linked = await getLinkedConcepts(SOURCE_TO_SINK_ID);
  const linkedIds = linked.map((concept) => concept.id);

  for (const expectedId of [SOURCE_PAPER_ID, DR1_ID, ...IMPLEMENTING_FEATURE_IDS]) {
    assert.ok(linkedIds.includes(expectedId), `missing linked concept ${expectedId}`);
  }
  assert.equal(new Set(linkedIds).size, linkedIds.length);
  assert.deepEqual(linkedIds, sorted(linkedIds));
});

test("subgraph traversal obeys direction, depth, and maxNodes", async () => {
  const seedOnly = await getSubgraph([SOURCE_TO_SINK_ID], {
    depth: 0,
    maxNodes: 10,
  });
  assert.deepEqual(seedOnly.concepts.map((concept) => concept.id), [SOURCE_TO_SINK_ID]);
  assert.deepEqual(seedOnly.links, []);
  assert.equal(seedOnly.truncated, false);

  const outgoingDepthOne = await getSubgraph([SOURCE_TO_SINK_ID], {
    depth: 1,
    maxNodes: 20,
    includeIncoming: false,
    includeOutgoing: true,
  });
  assert.deepEqual(
    sorted(outgoingDepthOne.concepts.map((concept) => concept.id)),
    sorted([SOURCE_TO_SINK_ID, SOURCE_PAPER_ID, DR1_ID, ...IMPLEMENTING_FEATURE_IDS]),
  );

  const nodeLimited = await getSubgraph([SOURCE_TO_SINK_ID], {
    depth: MAX_SUBGRAPH_DEPTH,
    maxNodes: 2,
  });
  assert.equal(nodeLimited.concepts.length, 2);
  assert.equal(nodeLimited.truncated, true);
});

test("subgraph traversal clamps oversized bounds and rejects invalid bounds", async () => {
  const [atDepthCap, beyondDepthCap, atNodeCap, beyondNodeCap] = await Promise.all([
    getSubgraph([SOURCE_TO_SINK_ID], { depth: MAX_SUBGRAPH_DEPTH }),
    getSubgraph([SOURCE_TO_SINK_ID], { depth: MAX_SUBGRAPH_DEPTH + 100 }),
    getSubgraph([SOURCE_TO_SINK_ID], {
      depth: MAX_SUBGRAPH_DEPTH,
      maxNodes: MAX_SUBGRAPH_NODES,
    }),
    getSubgraph([SOURCE_TO_SINK_ID], {
      depth: MAX_SUBGRAPH_DEPTH,
      maxNodes: MAX_SUBGRAPH_NODES + 10_000,
    }),
  ]);

  assert.deepEqual(
    beyondDepthCap.concepts.map((concept) => concept.id),
    atDepthCap.concepts.map((concept) => concept.id),
  );
  assert.deepEqual(
    beyondNodeCap.concepts.map((concept) => concept.id),
    atNodeCap.concepts.map((concept) => concept.id),
  );

  await assert.rejects(getSubgraph([SOURCE_TO_SINK_ID], { depth: -1 }), RangeError);
  await assert.rejects(getSubgraph([SOURCE_TO_SINK_ID], { maxNodes: Number.NaN }), RangeError);
});
