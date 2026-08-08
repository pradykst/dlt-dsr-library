import "server-only";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  buildPaperDesignMap,
  buildPaperDesignMapFromBundle,
  projectSemanticEdges,
} from "../server/paper-design-map.ts";
import type { OkfBundle, OkfConcept, OkfLink } from "../server/types.ts";

const BLOCKCHAIN = "papers/blockchain-iot-sensor-data";
const PEER_REVIEW = "papers/peer-review-token-incentives";
const CONSENT = "papers/consent-self-management-hie";

function edgeKey(edge: { sourceId: string; targetId: string; label: string }): string {
  return edge.sourceId + " -> " + edge.targetId + " [" + edge.label + "]";
}

test("Blockchain for the IoT projects the canonical 4/4/9 semantic map", async () => {
  const map = await buildPaperDesignMap(BLOCKCHAIN);
  assert.ok(map);

  assert.deepEqual(
    map.columns.map((column) => [column.type, column.nodeIds.length]),
    [
      ["design-requirement", 4],
      ["design-principle", 4],
      ["design-feature", 9],
    ],
  );
  assert.equal(map.nodes.length, 17);
  assert.equal(map.edges.length, 14);
  assert.ok(map.edges.length < 58);
  assert.ok(map.nodes.every((node) => node.type !== "paper"));
  assert.ok(map.nodes.every((node) => node.type !== "reference"));
  assert.ok(map.nodes.every((node) => !/about-the-dsr-grid/iu.test(node.id)));

  const keys = new Set(map.edges.map(edgeKey));
  for (const expected of [
    "design-knowledge/blockchain-iot-sensor-data-dr1 -> design-knowledge/blockchain-iot-sensor-data-dp1 [addresses]",
    "design-knowledge/blockchain-iot-sensor-data-dr1 -> design-knowledge/blockchain-iot-sensor-data-dp2 [addresses]",
    "design-knowledge/blockchain-iot-sensor-data-dr2 -> design-knowledge/blockchain-iot-sensor-data-dp3 [addresses]",
    "design-knowledge/blockchain-iot-sensor-data-dr3 -> design-knowledge/blockchain-iot-sensor-data-dp4 [addresses]",
    "design-knowledge/blockchain-iot-sensor-data-dr4 -> design-knowledge/blockchain-iot-sensor-data-dp4 [addresses]",
    "design-knowledge/blockchain-iot-sensor-data-dp1 -> design-knowledge/blockchain-iot-sensor-data-df1 [implements]",
    "design-knowledge/blockchain-iot-sensor-data-dp1 -> design-knowledge/blockchain-iot-sensor-data-df3 [implements]",
    "design-knowledge/blockchain-iot-sensor-data-dp4 -> design-knowledge/blockchain-iot-sensor-data-df6 [implements]",
  ]) {
    assert.ok(keys.has(expected), "missing semantic edge: " + expected);
  }

  const reciprocal = map.edges.find((edge) =>
    edge.sourceId.endsWith("-dp1") && edge.targetId.endsWith("-df1")
  );
  assert.ok(reciprocal);
  assert.equal(reciprocal.sourceRelationshipCount, 2);
});

test("principle/feature maps omit empty requirement columns", async () => {
  const map = await buildPaperDesignMap(PEER_REVIEW);
  assert.ok(map);
  assert.deepEqual(
    map.columns.map((column) => [column.type, column.nodeIds.length]),
    [
      ["design-principle", 3],
      ["design-feature", 3],
    ],
  );
  assert.equal(map.edges.length, 4);
});

test("Consent self-management projects the canonical 5/5/5 semantic map", async () => {
  const map = await buildPaperDesignMap(CONSENT);
  assert.ok(map);
  assert.deepEqual(
    map.columns.map((column) => [column.type, column.nodeIds.length]),
    [
      ["design-requirement", 5],
      ["design-principle", 5],
      ["design-feature", 5],
    ],
  );
  assert.equal(map.edges.length, 16);
});

test("unknown native types remain columns while ambiguous links stay raw-only", () => {
  const paper = concept("papers/example", "paper", "Example");
  const future = concept("design-knowledge/example-future", "future-mechanism", "Future mechanism");
  const principle = concept("design-knowledge/example-dp1", "design-principle", "Principle");
  const catalogue: OkfLink = link(paper.id, future.id, "Design knowledge");
  const ambiguous: OkfLink = link(future.id, principle.id, "Related material");
  paper.outgoingLinks = [catalogue];
  future.outgoingLinks = [ambiguous];

  const bundle = bundleFrom([paper, future, principle], [catalogue, ambiguous]);
  const map = buildPaperDesignMapFromBundle(bundle, paper);
  assert.deepEqual(map.columns.map((column) => column.type), ["future-mechanism"]);
  assert.equal(map.nodes[0]?.id, future.id);
  assert.equal(map.edges.length, 0);
  assert.equal(projectSemanticEdges(bundle, [future, principle]).length, 0);
});

test("the paper graph section defaults to Design map and retains Raw links", async () => {
  const source = await readFile(
    resolve(process.cwd(), "src/native-okf/components/PaperGraphViews.tsx"),
    "utf8",
  );
  assert.match(source, /useState<"design" \| "raw">\("design"\)/u);
  assert.match(source, />\s*Design map\s*</u);
  assert.match(source, />\s*Raw links\s*</u);
  assert.match(source, /<NativeOkfGraph/u);
  assert.match(source, /<PaperDesignMap/u);
});

function concept(id: string, type: string, title: string): OkfConcept {
  return {
    id,
    filePath: id + ".md",
    absolutePath: "C:/fixture/" + id + ".md",
    type,
    title,
    frontmatter: { type, title },
    rawMarkdown: "",
    markdownBody: "",
    headings: [],
    outgoingLinks: [],
    incomingLinks: [],
  };
}

function link(sourceId: string, targetId: string, relationHint: string): OkfLink {
  return {
    sourceId,
    targetId,
    targetPath: targetId + ".md",
    rawTarget: "/" + targetId + ".md",
    label: targetId,
    relationHint,
    resolved: true,
    external: false,
    broken: false,
  };
}

function bundleFrom(concepts: OkfConcept[], links: OkfLink[]): OkfBundle {
  const conceptsById = new Map(concepts.map((item) => [item.id, item]));
  const conceptsByType = new Map<string, OkfConcept[]>();
  for (const item of concepts) {
    const group = conceptsByType.get(item.type) ?? [];
    group.push(item);
    conceptsByType.set(item.type, group);
  }
  return {
    rootPath: "C:/fixture",
    okfVersion: "0.1",
    markdownFileCount: concepts.length,
    concepts,
    conceptsById,
    conceptsByType,
    outgoing: new Map(concepts.map((item) => [
      item.id,
      links.filter((candidate) => candidate.sourceId === item.id),
    ])),
    incoming: new Map(concepts.map((item) => [
      item.id,
      links.filter((candidate) => candidate.targetId === item.id),
    ])),
    reservedDocuments: [],
    warnings: [],
    fatalErrors: [],
  };
}

