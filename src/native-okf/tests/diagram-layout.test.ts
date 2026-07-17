import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  GENERATED_DIAGRAM_NODE_HEIGHT,
  GENERATED_DIAGRAM_NODE_WIDTH,
  generatedDiagramEdgeLabelBounds,
  layoutGeneratedDiagram,
  type DiagramLayoutEngine,
  type DiagramLayoutNode,
  type LayoutGeneratedDiagram,
} from "../components/chat/diagram-layout.ts";

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      assert.equal(actual, expected);
    },
    toEqual(expected: unknown) {
      assert.deepEqual(actual, expected);
    },
    toHaveLength(expected: number) {
      assert.equal((actual as { length: number }).length, expected);
    },
    toBeGreaterThan(expected: number) {
      assert.ok(typeof actual === "number" && actual > expected);
    },
    toBeGreaterThanOrEqual(expected: number) {
      assert.ok(typeof actual === "number" && actual >= expected);
    },
    toBeDefined() {
      assert.notEqual(actual, undefined);
    },
    toMatch(expected: RegExp) {
      assert.equal(typeof actual, "string");
      assert.match(actual as string, expected);
    },
    not: {
      toEqual(expected: unknown) {
        assert.notDeepEqual(actual, expected);
      },
    },
  };
}

function node(
  id: string,
  label: string,
  stage: LayoutGeneratedDiagram["nodes"][number]["stage"],
  order: number,
  synthesis = false,
): LayoutGeneratedDiagram["nodes"][number] {
  return {
    id,
    label,
    description: `Grounded detail for ${label}.`,
    category: stage,
    stage,
    order,
    group: null,
    sourcePaths: [`design-knowledge/${id}`],
    synthesis,
  };
}

function twelveNodeFixture(): LayoutGeneratedDiagram {
  return {
    title: "Compact decision-support flow",
    explanation: "A multi-branch fixture for deterministic layout.",
    nodes: [
      node("problem", "Decision problem", "problem", 0),
      node("requirement-b", "Accountable decisions", "requirements", 20),
      node("requirement-a", "Trusted evidence", "requirements", 10),
      node("principle-c", "Transparent rules", "principles", 30),
      node("principle-a", "Verify provenance", "principles", 10),
      node("principle-b", "Separate duties", "principles", 20),
      node("feature-c", "Audit trail", "features", 30),
      node("feature-a", "Signed records", "features", 10),
      node("feature-b", "Role controls", "features", 20),
      node("artifact", "Decision artifact", "artifact", 0, true),
      node("evaluation", "Evaluate outcomes", "evaluation", 0, true),
      node("outcome", "Trusted outcome", "outcome", 0, true),
    ],
    edges: [
      { source: "problem", target: "requirement-a", label: "requires" },
      { source: "problem", target: "requirement-b", label: "requires" },
      { source: "requirement-a", target: "principle-a", label: "addresses" },
      { source: "requirement-a", target: "principle-b", label: "addresses" },
      { source: "requirement-b", target: "principle-c", label: "addresses" },
      { source: "principle-a", target: "feature-a", label: "enables" },
      { source: "principle-b", target: "feature-b", label: "enables" },
      { source: "principle-c", target: "feature-c", label: "enables" },
      { source: "feature-a", target: "artifact", label: "implements" },
      { source: "feature-b", target: "artifact", label: "implements" },
      { source: "feature-c", target: "artifact", label: "implements" },
      { source: "artifact", target: "evaluation", label: "validates" },
      { source: "evaluation", target: "outcome", label: "enables" },
    ],
  };
}

function rectanglesOverlap(
  left: DiagramLayoutNode,
  right: DiagramLayoutNode,
  tolerance = 0.5,
): boolean {
  return (
    left.position.x < right.position.x + right.width - tolerance &&
    left.position.x + left.width > right.position.x + tolerance &&
    left.position.y < right.position.y + right.height - tolerance &&
    left.position.y + left.height > right.position.y + tolerance
  );
}
function layoutBoundsOverlap(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

function routedLayoutEngine(
  positions: Readonly<Record<string, { x: number; y: number }>>,
  routes: Readonly<Record<string, readonly { x: number; y: number }[]>>,
): DiagramLayoutEngine {
  return {
    layout: async (graph) => {
      const edges = (graph.edges ?? []) as Array<{
        id: string;
        sources: string[];
        targets: string[];
      }>;
      return {
        ...graph,
        children: (graph.children ?? []).map((child) => ({
          ...child,
          ...positions[child.id],
        })),
        edges: edges.map((edge) => {
          const route = routes[`${edge.sources[0]}->${edge.targets[0]}`];
          assert.ok(route && route.length >= 2);
          return {
            ...edge,
            sections: [
              {
                id: `${edge.id}-section`,
                startPoint: route[0],
                bendPoints: route.slice(1, -1),
                endPoint: route[route.length - 1],
              },
            ],
          };
        }),
      } as typeof graph;
    },
  };
}

function smallFlow(
  edges: LayoutGeneratedDiagram["edges"],
): LayoutGeneratedDiagram {
  return {
    title: "Edge label placement",
    explanation: "Controlled orthogonal routes exercise deterministic labels.",
    nodes: [
      node("a", "Start A", "problem", 0),
      node("b", "End B", "outcome", 10),
      node("c", "Start C", "features", 20),
      node("d", "End D", "evaluation", 30),
    ],
    edges,
  };
}

describe("generated diagram ELK layout", () => {
  it("is deterministic and returns finite, positive, non-overlapping nodes", async () => {
    const diagram = twelveNodeFixture();
    const first = await layoutGeneratedDiagram(diagram);
    const second = await layoutGeneratedDiagram(diagram);

    expect(first.usedFallback).toBe(false);
    expect(second.usedFallback).toBe(false);
    expect(second).toEqual(first);
    expect(first.nodes).toHaveLength(12);

    for (const positioned of first.nodes) {
      expect(Number.isFinite(positioned.position.x)).toBe(true);
      expect(Number.isFinite(positioned.position.y)).toBe(true);
      expect(positioned.position.x).toBeGreaterThan(0);
      expect(positioned.position.y).toBeGreaterThan(0);
      expect(positioned.width).toBe(GENERATED_DIAGRAM_NODE_WIDTH);
      expect(positioned.height).toBe(GENERATED_DIAGRAM_NODE_HEIGHT);
    }

    for (let left = 0; left < first.nodes.length; left += 1) {
      for (let right = left + 1; right < first.nodes.length; right += 1) {
        expect(rectanglesOverlap(first.nodes[left], first.nodes[right])).toBe(false);
      }
    }
  });

  it("preserves valid endpoints and exact orthogonal ELK routes", async () => {
    const layout = await layoutGeneratedDiagram(twelveNodeFixture());
    const nodeIds = new Set(layout.nodes.map(({ id }) => id));

    expect(layout.edges).toHaveLength(13);
    for (const edge of layout.edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
      expect(edge.points.length).toBeGreaterThanOrEqual(2);

      for (let index = 1; index < edge.points.length; index += 1) {
        const previous = edge.points[index - 1];
        const point = edge.points[index];
        const horizontal = Math.abs(previous.y - point.y) <= 0.001;
        const vertical = Math.abs(previous.x - point.x) <= 0.001;
        expect(horizontal || vertical).toBe(true);
      }
    }
  });

  it("does not change source grounding or synthesis flags", async () => {
    const diagram = twelveNodeFixture();
    const original = new Map(
      diagram.nodes.map((item) => [
        item.id,
        { sourcePaths: [...item.sourcePaths], synthesis: item.synthesis },
      ]),
    );
    const layout = await layoutGeneratedDiagram(diagram);

    for (const positioned of layout.nodes) {
      expect(positioned.node.sourcePaths).toEqual(
        original.get(positioned.id)?.sourcePaths,
      );
      expect(positioned.node.synthesis).toBe(original.get(positioned.id)?.synthesis);
    }
  });

  it("materially changes flow direction when orientation changes", async () => {
    const diagram = twelveNodeFixture();
    const horizontal = await layoutGeneratedDiagram(diagram, {
      orientation: "horizontal",
    });
    const vertical = await layoutGeneratedDiagram(diagram, {
      orientation: "vertical",
    });
    const horizontalStart = horizontal.nodes.find(({ id }) => id === "problem");
    const horizontalEnd = horizontal.nodes.find(({ id }) => id === "outcome");
    const verticalStart = vertical.nodes.find(({ id }) => id === "problem");
    const verticalEnd = vertical.nodes.find(({ id }) => id === "outcome");

    expect(horizontalStart).toBeDefined();
    expect(horizontalEnd).toBeDefined();
    expect(verticalStart).toBeDefined();
    expect(verticalEnd).toBeDefined();
    expect(horizontalEnd!.position.x - horizontalStart!.position.x).toBeGreaterThan(
      horizontalEnd!.position.y - horizontalStart!.position.y,
    );
    expect(verticalEnd!.position.y - verticalStart!.position.y).toBeGreaterThan(
      verticalEnd!.position.x - verticalStart!.position.x,
    );
    expect(vertical.nodes.map(({ position }) => position)).not.toEqual(
      horizontal.nodes.map(({ position }) => position),
    );
  });

  it("uses a deterministic orthogonal fallback when ELK fails", async () => {
    const failingEngine: DiagramLayoutEngine = {
      layout: async () => {
        throw new Error("simulated ELK failure");
      },
    };
    const diagram = twelveNodeFixture();
    const first = await layoutGeneratedDiagram(diagram, {
      layoutEngine: failingEngine,
    });
    const second = await layoutGeneratedDiagram(diagram, {
      layoutEngine: failingEngine,
    });

    expect(first.usedFallback).toBe(true);
    expect(first.warning).toMatch(/fallback layout/i);
    expect(second).toEqual(first);
    expect(first.nodes.every(({ position }) => position.x > 0 && position.y > 0)).toBe(
      true,
    );
    expect(
      first.edges.every((edge) =>
        edge.points.slice(1).every((point, index) => {
          const previous = edge.points[index];
          return (
            Math.abs(previous.x - point.x) <= 0.001 ||
            Math.abs(previous.y - point.y) <= 0.001
          );
        }),
      ),
    ).toBe(true);
  });

  it("provides present-stage lanes and honors hidden relation labels", async () => {
    const layout = await layoutGeneratedDiagram(twelveNodeFixture(), {
      edgeLabelsVisible: false,
    });

    expect(layout.lanes.map(({ stage }) => stage)).toEqual([
      "problem",
      "requirements",
      "principles",
      "features",
      "artifact",
      "evaluation",
      "outcome",
    ]);
    expect(layout.edges.every(({ showLabel }) => !showLabel)).toBe(true);
  });

  it("places labels away from route crossings and node boxes deterministically", async () => {
    const diagram = smallFlow([
      { source: "a", target: "b", label: "yes" },
      { source: "c", target: "d", label: "no" },
    ]);
    const engine = routedLayoutEngine(
      {
        a: { x: 0, y: 0 },
        b: { x: 600, y: 0 },
        c: { x: 200, y: 300 },
        d: { x: 200, y: -300 },
      },
      {
        "a->b": [
          { x: 224, y: 48 },
          { x: 600, y: 48 },
        ],
        "c->d": [
          { x: 424, y: 348 },
          { x: 412, y: 348 },
          { x: 412, y: -252 },
          { x: 424, y: -252 },
        ],
      },
    );

    const first = await layoutGeneratedDiagram(diagram, { layoutEngine: engine });
    const second = await layoutGeneratedDiagram(diagram, { layoutEngine: engine });
    expect(second.edges.map(({ labelPosition }) => labelPosition)).toEqual(
      first.edges.map(({ labelPosition }) => labelPosition),
    );

    const horizontal = first.edges.find(({ source }) => source === "a");
    const vertical = first.edges.find(({ source }) => source === "c");
    assert.ok(horizontal && vertical);
    const crossing = {
      x: vertical.points[1]!.x,
      y: horizontal.points[0]!.y,
    };

    for (const edge of first.edges) {
      const labelBounds = generatedDiagramEdgeLabelBounds(
        edge.label,
        edge.labelPosition,
      );
      assert.equal(
        crossing.x >= labelBounds.x &&
          crossing.x <= labelBounds.x + labelBounds.width &&
          crossing.y >= labelBounds.y &&
          crossing.y <= labelBounds.y + labelBounds.height,
        false,
      );
      for (const positioned of first.nodes) {
        assert.equal(
          layoutBoundsOverlap(labelBounds, {
            ...positioned.position,
            width: positioned.width,
            height: positioned.height,
          }),
          false,
        );
      }
    }
  });

  it("separates labels on coincident routes without changing their ELK points", async () => {
    const diagram = smallFlow([
      { source: "a", target: "b", label: "enables" },
      { source: "a", target: "b", label: "requires" },
    ]);
    const route = [
      { x: 224, y: 48 },
      { x: 600, y: 48 },
    ];
    const layout = await layoutGeneratedDiagram(diagram, {
      layoutEngine: routedLayoutEngine(
        {
          a: { x: 0, y: 0 },
          b: { x: 600, y: 0 },
          c: { x: 0, y: 300 },
          d: { x: 600, y: 300 },
        },
        { "a->b": route },
      ),
    });

    expect(layout.edges).toHaveLength(2);
    expect(layout.edges[0]!.points).toEqual(layout.edges[1]!.points);
    const firstBounds = generatedDiagramEdgeLabelBounds(
      layout.edges[0]!.label,
      layout.edges[0]!.labelPosition,
    );
    const secondBounds = generatedDiagramEdgeLabelBounds(
      layout.edges[1]!.label,
      layout.edges[1]!.labelPosition,
    );
    assert.equal(layoutBoundsOverlap(firstBounds, secondBounds), false);
  });
});
