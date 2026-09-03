import "server-only";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  estimateWrappedLineCount,
  measuredNodeBoxHeight,
} from "../components/diagram-node-metrics.ts";
import { layoutSemanticColumns } from "../components/semantic-column-layout.ts";
import {
  GENERATED_DIAGRAM_NODE_HEIGHT,
  generatedDiagramNodeHeight,
  layoutGeneratedDiagram,
} from "../components/chat/diagram-layout.ts";
import {
  PAPER_DESIGN_NODE_HEIGHT,
  paperDesignNodeHeight,
} from "../components/paper-design-metrics.ts";
import type { GeneratedDiagram } from "../shared/chat-types.ts";

const SHORT_LABEL = "Selective disclosure";
// Deliberately generic long labels, not the reported screenshot's specific text.
const LONG_PRINCIPLE_LABEL =
  "Federated participants retain unilateral control over which attributes of a shared record any counterparty may resolve";
const LONG_IDENTIFIER_LABEL =
  "urn:example:design-principle:cross_domain_selective_disclosure_with_revocable_capability_tokens";

function componentSource(relativePath: string): Promise<string> {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("wrapped line count grows with label length and respects the ceiling", () => {
  const options = { charactersPerLine: 20, maxLines: 6, minLines: 1 } as const;
  assert.equal(estimateWrappedLineCount("Short", options), 1);
  assert.equal(estimateWrappedLineCount(SHORT_LABEL, options), 1);
  assert.ok(estimateWrappedLineCount(LONG_PRINCIPLE_LABEL, options) >= 4);
  assert.ok(
    estimateWrappedLineCount(LONG_PRINCIPLE_LABEL.repeat(4), options) <= 6,
    "a pathological label must be capped, never unbounded",
  );
});

test("a single unbreakable identifier is allowed to span multiple lines", () => {
  const lines = estimateWrappedLineCount(LONG_IDENTIFIER_LABEL, {
    charactersPerLine: 24,
    maxLines: 8,
  });
  assert.ok(lines >= Math.ceil(LONG_IDENTIFIER_LABEL.length / 24) - 1);
  assert.ok(lines >= 3);
});

test("node box height keeps the floor for short labels and grows for long ones", () => {
  const metrics = {
    labelWidth: 196,
    characterWidth: 8.4,
    lineHeight: 20,
    chrome: 52,
    minHeight: 112,
    maxLines: 6,
  } as const;
  assert.equal(measuredNodeBoxHeight(SHORT_LABEL, metrics), 112);
  const long = measuredNodeBoxHeight(LONG_PRINCIPLE_LABEL, metrics);
  assert.ok(long > 112, `expected a taller card, got ${long}`);
  assert.equal(long % 2, 0, "heights are rounded to an even integer for stable layout");
});

test("both diagram families keep short cards at the historical floor height", () => {
  assert.equal(generatedDiagramNodeHeight(SHORT_LABEL), GENERATED_DIAGRAM_NODE_HEIGHT);
  assert.equal(paperDesignNodeHeight(SHORT_LABEL), PAPER_DESIGN_NODE_HEIGHT);
  assert.ok(generatedDiagramNodeHeight(LONG_PRINCIPLE_LABEL) > GENERATED_DIAGRAM_NODE_HEIGHT);
  assert.ok(paperDesignNodeHeight(LONG_PRINCIPLE_LABEL) > PAPER_DESIGN_NODE_HEIGHT);
});

test("the deterministic column layout reserves the taller height and avoids overlap", () => {
  const layout = layoutSemanticColumns(
    [
      {
        id: "dp1",
        columnKey: "design-principle",
        label: LONG_PRINCIPLE_LABEL,
        height: paperDesignNodeHeight(LONG_PRINCIPLE_LABEL),
        value: "dp1",
      },
      {
        id: "dp2",
        columnKey: "design-principle",
        label: "Short principle",
        height: paperDesignNodeHeight("Short principle"),
        value: "dp2",
      },
      {
        id: "df1",
        columnKey: "design-feature",
        label: LONG_IDENTIFIER_LABEL,
        height: paperDesignNodeHeight(LONG_IDENTIFIER_LABEL),
        value: "df1",
      },
    ],
    [{ id: "e1", source: "dp1", target: "df1", label: "implements", value: "e1" }],
    [
      { key: "design-principle", title: "Design Principles" },
      { key: "design-feature", title: "Design Features" },
    ],
    { nodeWidth: 240, nodeHeight: PAPER_DESIGN_NODE_HEIGHT, nodeGap: 30 },
  );

  const tall = layout.nodes.find((node) => node.id === "dp1")!;
  assert.ok(tall.height > PAPER_DESIGN_NODE_HEIGHT);
  for (let left = 0; left < layout.nodes.length; left += 1) {
    for (let right = left + 1; right < layout.nodes.length; right += 1) {
      const a = layout.nodes[left]!;
      const b = layout.nodes[right]!;
      const overlap = !(
        a.position.x + a.width <= b.position.x ||
        b.position.x + b.width <= a.position.x ||
        a.position.y + a.height <= b.position.y ||
        b.position.y + b.height <= a.position.y
      );
      assert.equal(overlap, false, `${a.id} overlaps ${b.id}`);
    }
  }
});

test("the ELK generated-flow layout expands tall cards without overlap in both orientations", async () => {
  const diagram: GeneratedDiagram = {
    title: "Wrapping fixture",
    explanation: "Two stages, one very long label.",
    nodes: [
      {
        id: "problem",
        label: LONG_PRINCIPLE_LABEL,
        description: "Long problem statement.",
        category: "problem",
        stage: "problem",
        order: 0,
        group: null,
        provenance: "user-provided",
        sourcePaths: [],
        supportConceptIds: [],
        synthesisRationale: null,
        synthesis: false,
      },
      {
        id: "requirement",
        label: "Shared verification boundary",
        description: "A requirement.",
        category: "design requirement",
        stage: "design-requirement",
        order: 0,
        group: null,
        provenance: "synthesized",
        sourcePaths: ["design-knowledge/x"],
        supportConceptIds: ["design-knowledge/x"],
        synthesisRationale: "Adapted.",
        synthesis: true,
      },
    ],
    edges: [
      {
        source: "problem",
        target: "requirement",
        label: "requires",
        provenance: "synthesized",
        supportConceptIds: ["design-knowledge/x"],
      },
    ],
  };

  for (const orientation of ["horizontal", "vertical"] as const) {
    const layout = await layoutGeneratedDiagram(diagram, { orientation });
    const problem = layout.nodes.find((node) => node.id === "problem")!;
    assert.ok(
      problem.height > GENERATED_DIAGRAM_NODE_HEIGHT,
      `${orientation}: long label should reserve a taller card`,
    );
    for (let left = 0; left < layout.nodes.length; left += 1) {
      for (let right = left + 1; right < layout.nodes.length; right += 1) {
        const a = layout.nodes[left]!;
        const b = layout.nodes[right]!;
        const overlap = !(
          a.position.x + a.width <= b.position.x ||
          b.position.x + b.width <= a.position.x ||
          a.position.y + a.height <= b.position.y ||
          b.position.y + b.height <= a.position.y
        );
        assert.equal(overlap, false);
      }
    }
  }
});

test("diagram node renderers wrap the semantic title and never truncate it", async () => {
  for (const relativePath of [
    "components/chat/GeneratedDiagramNode.tsx",
    "components/PaperDesignMap.tsx",
    "components/NativeOkfGraph.tsx",
  ]) {
    const source = await componentSource(relativePath);
    assert.match(source, /whitespace-normal/u, relativePath);
    assert.match(source, /overflow-wrap:anywhere/u, relativePath);
    assert.match(source, /break-words/u, relativePath);
    assert.doesNotMatch(source, /line-clamp-3 text-/u, relativePath);
    assert.doesNotMatch(source, /truncate[^"']*text-\[15px\]/u, relativePath);
  }
});
