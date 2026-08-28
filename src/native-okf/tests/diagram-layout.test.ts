import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import type { GeneratedDiagram } from "../shared/chat-types.ts";
import { layoutSemanticColumns } from "../components/semantic-column-layout.ts";
import {
  GENERATED_DIAGRAM_NODE_HEIGHT,
  GENERATED_DIAGRAM_NODE_WIDTH,
  layoutGeneratedDiagram,
} from "../components/chat/diagram-layout.ts";

function fixture(): GeneratedDiagram {
  const definitions = [
    ["n1", "Fragmented evidence", "problem", 0, false],
    ["n2", "Shared identity requirement", "requirements", 0, false],
    ["n3", "Governance requirement", "requirements", 1, false],
    ["n4", "Verifiable provenance", "principles", 0, false],
    ["n5", "Controlled disclosure", "principles", 1, false],
    ["n6", "Stable identifiers", "features", 0, false],
    ["n7", "Signed records", "features", 1, false],
    ["n8", "Access policies", "features", 2, false],
    ["n9", "Artifact integration", "artifact", 0, true],
    ["n10", "Stewardship model", "artifact", 1, true],
    ["n11", "Evaluate traceability", "evaluation", 0, true],
    ["n12", "Trusted exchange", "outcome", 0, true],
  ] as const;
  return {
    title: "Compact grounded flow",
    explanation: "A deterministic multi-column fixture.",
    nodes: definitions.map(([id, label, stage, order, synthesis]) => ({
      id,
      label,
      description: label + " description.",
      category: stage,
      stage,
      order,
      group: null,
      sourcePaths: ["design-knowledge/example-" + id],
      provenance: synthesis ? "synthesized" : "stored",
      supportConceptIds: [],
      synthesisRationale: null,
      synthesis,
    })),
    edges: [
      { source: "n1", target: "n2", label: "requires", provenance: "synthesized", supportConceptIds: [] },
      { source: "n1", target: "n3", label: "requires", provenance: "synthesized", supportConceptIds: [] },
      { source: "n2", target: "n4", label: "addresses", provenance: "synthesized", supportConceptIds: [] },
      { source: "n2", target: "n5", label: "addresses", provenance: "synthesized", supportConceptIds: [] },
      { source: "n4", target: "n6", label: "implements", provenance: "synthesized", supportConceptIds: [] },
      { source: "n4", target: "n7", label: "implements", provenance: "synthesized", supportConceptIds: [] },
      { source: "n5", target: "n8", label: "implements", provenance: "synthesized", supportConceptIds: [] },
      { source: "n6", target: "n9", label: "enables", provenance: "synthesized", supportConceptIds: [] },
      { source: "n7", target: "n9", label: "enables", provenance: "synthesized", supportConceptIds: [] },
      { source: "n8", target: "n10", label: "requires", provenance: "synthesized", supportConceptIds: [] },
      { source: "n9", target: "n11", label: "validates", provenance: "synthesized", supportConceptIds: [] },
      { source: "n10", target: "n11", label: "validates", provenance: "synthesized", supportConceptIds: [] },
      { source: "n11", target: "n12", label: "enables", provenance: "synthesized", supportConceptIds: [] },
    ],
  };
}

function rectanglesOverlap(
  left: { position: { x: number; y: number }; width: number; height: number },
  right: { position: { x: number; y: number }; width: number; height: number },
): boolean {
  const tolerance = 0.01;
  return !(
    left.position.x + left.width <= right.position.x + tolerance ||
    right.position.x + right.width <= left.position.x + tolerance ||
    left.position.y + left.height <= right.position.y + tolerance ||
    right.position.y + right.height <= left.position.y + tolerance
  );
}

test("generated stage columns are deterministic and contain every validated node", async () => {
  const diagram = fixture();
  const first = await layoutGeneratedDiagram(diagram);
  const second = await layoutGeneratedDiagram(diagram);

  assert.deepEqual(first, second);
  assert.equal(first.nodes.length, 12);
  assert.deepEqual(
    first.lanes.map((lane) => lane.stage),
    ["problem", "requirements", "principles", "features", "artifact", "evaluation", "outcome"],
  );
  assert.ok(first.nodes.every((node) =>
    Number.isFinite(node.position.x) &&
    Number.isFinite(node.position.y) &&
    node.position.x >= 0 &&
    node.position.y >= 0
  ));
  assert.ok(first.nodes.every((node) =>
    node.width === GENERATED_DIAGRAM_NODE_WIDTH &&
    node.height === GENERATED_DIAGRAM_NODE_HEIGHT
  ));
});

test("ELK stage layout prevents overlap and preserves forward stage order", async () => {
  const layout = await layoutGeneratedDiagram(fixture());
  for (let left = 0; left < layout.nodes.length; left += 1) {
    for (let right = left + 1; right < layout.nodes.length; right += 1) {
      assert.equal(rectanglesOverlap(layout.nodes[left]!, layout.nodes[right]!), false);
    }
  }

  for (let index = 1; index < layout.lanes.length; index += 1) {
    assert.ok(
      layout.lanes[index]!.bounds.x > layout.lanes[index - 1]!.bounds.x,
      `${layout.lanes[index]!.stage} must follow ${layout.lanes[index - 1]!.stage}`,
    );
  }
});

test("generated edges use routed orthogonal polylines with valid endpoints", async () => {
  const layout = await layoutGeneratedDiagram(fixture());
  const nodeIds = new Set(layout.nodes.map((node) => node.id));

  for (const edge of layout.edges) {
    assert.ok(nodeIds.has(edge.source));
    assert.ok(nodeIds.has(edge.target));
    assert.ok(edge.points.length >= 2);
    for (let index = 1; index < edge.points.length; index += 1) {
      const previous = edge.points[index - 1]!;
      const current = edge.points[index]!;
      assert.ok(
        Math.abs(previous.x - current.x) < 0.01 ||
          Math.abs(previous.y - current.y) < 0.01,
      );
    }
    const path = edge.points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    assert.match(path, /^M [-\d.]+ [-\d.]+(?: L [-\d.]+ [-\d.]+)+$/u);
    assert.doesNotMatch(path, /[CQ]/u);
  }
});

test("source paths and synthesis flags survive layout unchanged", async () => {
  const diagram = fixture();
  const layout = await layoutGeneratedDiagram(diagram);
  const original = new Map(diagram.nodes.map((node) => [node.id, node]));

  for (const node of layout.nodes) {
    assert.deepEqual(node.node.sourcePaths, original.get(node.id)?.sourcePaths);
    assert.equal(node.node.synthesis, original.get(node.id)?.synthesis);
  }
});

test("orientation changes the dominant flow direction and dynamic headings", async () => {
  const diagram = fixture();
  const horizontal = await layoutGeneratedDiagram(diagram, {
    orientation: "horizontal",
  });
  const vertical = await layoutGeneratedDiagram(diagram, {
    orientation: "vertical",
  });
  const hStart = horizontal.nodes.find((node) => node.id === "n1")!;
  const hEnd = horizontal.nodes.find((node) => node.id === "n12")!;
  const vStart = vertical.nodes.find((node) => node.id === "n1")!;
  const vEnd = vertical.nodes.find((node) => node.id === "n12")!;

  assert.ok(hEnd.position.x > hStart.position.x);
  assert.ok(vEnd.position.y > vStart.position.y);
  assert.notDeepEqual(horizontal.bounds, vertical.bounds);
  assert.deepEqual(
    horizontal.lanes.map((lane) => lane.label),
    ["Problem", "Requirements", "Principles", "Features", "Artifact", "Evaluation", "Outcome"],
  );
});

test("relationship-label visibility is presentation-only", async () => {
  const shown = await layoutGeneratedDiagram(fixture(), {
    edgeLabelsVisible: true,
  });
  const hidden = await layoutGeneratedDiagram(fixture(), {
    edgeLabelsVisible: false,
  });
  assert.ok(shown.edges.every((edge) => edge.showLabel));
  assert.ok(hidden.edges.every((edge) => !edge.showLabel));
  assert.deepEqual(shown.nodes, hidden.nodes);
  assert.deepEqual(
    shown.edges.map((edge) => edge.points),
    hidden.edges.map((edge) => edge.points),
  );
});

test("adding one refinement node preserves the relative order of existing nodes", async () => {
  const original = fixture();
  const refined: GeneratedDiagram = {
    ...original,
    nodes: [
      ...original.nodes,
      {
        ...original.nodes.find((node) => node.id === "n2")!,
        id: "n2-added",
        label: "Additional accountability requirement",
        description: "An added, independently supported requirement.",
        order: 2,
      },
    ],
    edges: [
      ...original.edges,
      { source: "n1", target: "n2-added", label: "requires", provenance: "synthesized", supportConceptIds: [] },
      { source: "n2-added", target: "n5", label: "addresses", provenance: "synthesized", supportConceptIds: [] },
    ],
  };
  const before = await layoutGeneratedDiagram(original);
  const after = await layoutGeneratedDiagram(refined);
  for (const lane of before.lanes) {
    const beforeIds = before.nodes
      .filter((node) => node.node.stage === lane.stage)
      .sort((left, right) => left.position.y - right.position.y)
      .map((node) => node.id);
    const afterIds = after.nodes
      .filter((node) => node.node.stage === lane.stage && beforeIds.includes(node.id))
      .sort((left, right) => left.position.y - right.position.y)
      .map((node) => node.id);
    assert.deepEqual(afterIds, beforeIds, lane.stage);
  }
});

test("layout-engine failure activates the deterministic column fallback", async () => {
  const failing = (() => {
    throw new Error("fixture failure");
  }) as typeof layoutSemanticColumns;
  const layout = await layoutGeneratedDiagram(fixture(), {
    layoutEngine: failing,
  });
  assert.equal(layout.usedFallback, true);
  assert.match(layout.warning ?? "", /deterministic column fallback/u);
  assert.equal(layout.nodes.length, 12);
  assert.equal(layout.edges.length, fixture().edges.length);
});
