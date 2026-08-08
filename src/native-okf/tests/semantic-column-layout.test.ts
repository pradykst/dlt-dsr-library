import assert from "node:assert/strict";
import test from "node:test";

import {
  compareSemanticLayoutNodes,
  layoutSemanticColumns,
  PAPER_DESIGN_FIT_MIN_ZOOM,
} from "../components/semantic-column-layout.ts";
import { straightLinePath } from "../components/straight-edge.ts";
import { calculateDiagramViewport } from "../components/chat/diagram-viewport.ts";

const nodes = [
  { id: "dr10", columnKey: "requirements", label: "Tenth", producerLabel: "DR10", value: "dr10" },
  { id: "dr2", columnKey: "requirements", label: "Second", producerLabel: "DR2", value: "dr2" },
  { id: "dr1", columnKey: "requirements", label: "First", producerLabel: "DR1", value: "dr1" },
  { id: "dp1", columnKey: "principles", label: "Principle one", producerLabel: "DP1", value: "dp1" },
  { id: "dp2", columnKey: "principles", label: "Principle two", producerLabel: "DP2", value: "dp2" },
  { id: "df1", columnKey: "features", label: "Feature one", producerLabel: "DF1", value: "df1" },
] as const;

const edges = [
  { id: "e1", source: "dr1", target: "dp2", label: "addresses", value: "e1" },
  { id: "e2", source: "dr2", target: "dp1", label: "addresses", value: "e2" },
  { id: "e3", source: "dp1", target: "df1", label: "implements", value: "e3" },
] as const;

const columns = [
  { key: "requirements", title: "Design Requirements" },
  { key: "principles", title: "Design Principles" },
  { key: "features", title: "Design Features" },
] as const;

test("numeric producer labels sort naturally", () => {
  const sorted = [...nodes.slice(0, 3)].sort(compareSemanticLayoutNodes);
  assert.deepEqual(sorted.map((node) => node.id), ["dr1", "dr2", "dr10"]);
});

test("barycentric semantic ordering and positions are deterministic", () => {
  const first = layoutSemanticColumns(nodes, edges, columns);
  const second = layoutSemanticColumns(nodes, edges, columns);
  assert.deepEqual(first, second);
  assert.deepEqual(first.columns.map((column) => column.title), [
    "Design Requirements",
    "Design Principles",
    "Design Features",
  ]);

  for (let left = 0; left < first.nodes.length; left += 1) {
    for (let right = left + 1; right < first.nodes.length; right += 1) {
      const a = first.nodes[left]!;
      const b = first.nodes[right]!;
      const overlap = !(
        a.position.x + a.width <= b.position.x ||
        b.position.x + b.width <= a.position.x ||
        a.position.y + a.height <= b.position.y ||
        b.position.y + b.height <= a.position.y
      );
      assert.equal(overlap, false);
    }
  }
});

test("shorter columns are vertically centred and connectors are straight", () => {
  const layout = layoutSemanticColumns(nodes, edges, columns);
  const tallest = layout.columns[0]!;
  const shortest = layout.columns[2]!;
  const requirementNodes = layout.nodes.filter(
    (node) => node.columnKey === "requirements",
  );
  const tallestCenter =
    (Math.min(...requirementNodes.map((node) => node.position.y)) +
      Math.max(...requirementNodes.map((node) => node.position.y + node.height))) / 2;
  const shortestNode = layout.nodes.find((node) => node.id === "df1")!;
  assert.equal(shortestNode.position.y + shortestNode.height / 2, tallestCenter);

  for (const edge of layout.edges) {
    assert.equal(edge.points.length, 2);
    const path = straightLinePath(edge.points);
    assert.match(path, /^M .* L .*$/u);
    assert.doesNotMatch(path, /[CQ]/u);
  }
  assert.ok(shortest.headingPosition.x > tallest.headingPosition.x);
});

test("fit transform keeps every paper-map node inside the viewport", () => {
  const layout = layoutSemanticColumns(nodes, edges, columns, {
    nodeWidth: 240,
    nodeHeight: 100,
    nodeGap: 34,
    columnGap: 150,
    outerPadding: 36,
  });
  const viewport = { width: 1080, height: 620 };
  const padding = 28;
  const transform = calculateDiagramViewport(
    layout.bounds,
    viewport,
    padding,
    { minZoom: 0.38, maxZoom: 1.05 },
  );

  for (const node of layout.nodes) {
    const left = transform.x + node.position.x * transform.zoom;
    const top = transform.y + node.position.y * transform.zoom;
    const right = left + node.width * transform.zoom;
    const bottom = top + node.height * transform.zoom;
    assert.ok(left >= padding - 0.1);
    assert.ok(top >= padding - 0.1);
    assert.ok(right <= viewport.width - padding + 0.1);
    assert.ok(bottom <= viewport.height - padding + 0.1);
  }
});

test("paper-map fit allows dense curated columns below the generated-diagram floor", () => {
  assert.equal(PAPER_DESIGN_FIT_MIN_ZOOM, 0.2);
  const denseNodes = Array.from({ length: 19 }, (_value, index) => ({
    id: `mr${index + 1}`,
    columnKey: "meta-requirement",
    label: `Meta-requirement ${index + 1}`,
    producerLabel: `MR${index + 1}`,
    value: index,
  }));
  const layout = layoutSemanticColumns(
    denseNodes,
    [],
    [{ key: "meta-requirement", title: "Meta-Requirements" }],
    {
      nodeWidth: 240,
      nodeHeight: 92,
      nodeGap: 30,
      columnGap: 150,
      outerPadding: 36,
    },
  );
  const viewport = { width: 1214, height: 653 };
  const padding = 36;
  const transform = calculateDiagramViewport(layout.bounds, viewport, padding, {
    minZoom: PAPER_DESIGN_FIT_MIN_ZOOM,
    maxZoom: 1.05,
  });

  for (const node of layout.nodes) {
    const left = transform.x + node.position.x * transform.zoom;
    const top = transform.y + node.position.y * transform.zoom;
    const right = left + node.width * transform.zoom;
    const bottom = top + node.height * transform.zoom;
    assert.ok(left >= padding - 0.1);
    assert.ok(top >= padding - 0.1);
    assert.ok(right <= viewport.width - padding + 0.1);
    assert.ok(bottom <= viewport.height - padding + 0.1);
  }
});

