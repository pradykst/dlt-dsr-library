import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIMARY_SYNTHESIS_RELATIONSHIP_TYPES,
  SECONDARY_SYNTHESIS_RELATIONSHIP_TYPES,
  synthesisEdgeStructuralClass,
  type DiagramStage,
  type GeneratedDiagram,
  type GeneratedDiagramEdge,
  type GeneratedDiagramNode,
} from "../shared/chat-types.ts";
import {
  synthesisGrammarDiagnostics,
  synthesisNodeRoleViolation,
} from "../server/openai/synthesis-grammar.ts";
import { validateGeneratedDiagram } from "../server/openai/diagram-validation.ts";
import type { NativeOkfDiagramGrounding } from "../server/openai/diagram-grounding.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function problemNode(): GeneratedDiagramNode {
  return {
    id: "problem",
    label: "Fixture design problem",
    description: "A fixture design problem.",
    category: "problem",
    stage: "problem",
    order: 0,
    group: null,
    provenance: "user-provided",
    sourcePaths: [],
    supportConceptIds: [],
    synthesisRationale: null,
    synthesis: false,
  };
}

function node(
  id: string,
  stage: DiagramStage,
  label = `${id} label`,
): GeneratedDiagramNode {
  const order =
    stage === "design-requirement"
      ? 20
      : stage === "design-principle"
        ? 40
        : stage === "design-feature"
          ? 60
          : stage === "artifact"
            ? 75
            : stage === "evaluation"
              ? 85
              : 95;
  return {
    id,
    label,
    description: `${id} description with enough words to be a sentence.`,
    category: stage,
    stage,
    order,
    group: null,
    provenance: "synthesized",
    sourcePaths: ["c/one"],
    supportConceptIds: ["c/one"],
    synthesisRationale: `Proposed for this problem, grounded in c/one.`,
    synthesis: true,
  };
}

function edge(
  source: string,
  target: string,
  label = "addressed by",
): GeneratedDiagramEdge {
  return {
    source,
    target,
    label,
    provenance: "synthesized",
    supportConceptIds: ["c/one"],
  };
}

function diagram(
  nodes: GeneratedDiagramNode[],
  edges: GeneratedDiagramEdge[],
): GeneratedDiagram {
  return { title: "Fixture", explanation: "Fixture proposal.", nodes, edges };
}

/** Grounding that allows the single fixture concept id used throughout. */
function grounding(extraConceptIds: readonly string[] = []): NativeOkfDiagramGrounding {
  const ids = new Set<string>(["c/one", ...extraConceptIds]);
  return {
    allowedConceptIds: ids,
    eligibleStoredConceptIds: ids,
    conceptsById: new Map(
      [...ids].map((id) => [
        id,
        {
          conceptId: id,
          title: `Stored concept ${id}`,
          description: `Stored concept ${id} description.`,
          type: "design-principle",
          stage: "design-principle" as DiagramStage,
        },
      ]),
    ),
    storedRelations: [],
  };
}

function diag(codes: string[]): Set<string> {
  return new Set(codes);
}

// ---------------------------------------------------------------------------
// Section 25: variable cardinality (no equal-layer / 3x3x3 invariant)
// ---------------------------------------------------------------------------

interface Shape {
  requirements: number;
  principles: number;
  features: number;
}

function buildManyToMany({ requirements, principles, features }: Shape): GeneratedDiagram {
  const nodes: GeneratedDiagramNode[] = [problemNode()];
  const edges: GeneratedDiagramEdge[] = [];
  const rIds: string[] = [];
  const pIds: string[] = [];
  const fIds: string[] = [];
  for (let i = 0; i < requirements; i += 1) {
    const id = `r${i}`;
    rIds.push(id);
    nodes.push(node(id, "design-requirement", `Preserve property number ${i}`));
    edges.push(edge("problem", id, "motivates"));
  }
  for (let i = 0; i < principles; i += 1) {
    const id = `p${i}`;
    pIds.push(id);
    nodes.push(node(id, "design-principle", `Prescriptive rule number ${i}`));
    // Fan-in: each principle addresses at least one requirement (round-robin).
    edges.push(edge(rIds[i % rIds.length]!, id, "addressed by"));
  }
  for (let i = 0; i < features; i += 1) {
    const id = `f${i}`;
    fIds.push(id);
    nodes.push(node(id, "design-feature", `Concrete mechanism number ${i}`));
    edges.push(edge(pIds[i % pIds.length]!, id, "implemented by"));
  }
  // An artifact integrating every feature.
  nodes.push(node("artifact", "artifact", "Integrated artifact"));
  for (const id of fIds) edges.push(edge(id, "artifact", "instantiated in"));
  // A cross link making it genuinely many-to-many where sizes allow.
  if (rIds.length > 1 && pIds.length > 0) {
    edges.push(edge(rIds[1]!, pIds[0]!, "addressed by"));
  }
  if (pIds.length > 1 && fIds.length > 0) {
    edges.push(edge(pIds[1]!, fIds[0]!, "implemented by"));
  }
  return diagram(nodes, edges);
}

const CARDINALITY_FIXTURES: Shape[] = [
  { requirements: 1, principles: 1, features: 1 },
  { requirements: 2, principles: 4, features: 3 },
  { requirements: 5, principles: 2, features: 6 },
  { requirements: 3, principles: 5, features: 2 },
];

for (const shape of CARDINALITY_FIXTURES) {
  test(`variable cardinality ${shape.requirements}/${shape.principles}/${shape.features} is structurally legal`, () => {
    const graph = buildManyToMany(shape);
    const diagnostics = synthesisGrammarDiagnostics(graph, {
      requireFullProposal: true,
    });
    assert.deepEqual(
      diagnostics,
      [],
      `expected no grammar diagnostics, got: ${diagnostics.join(", ")}`,
    );
    const validation = validateGeneratedDiagram(graph, grounding(), {
      mode: "synthesized",
      requireRpfPath: true,
    });
    assert.equal(
      validation.ok,
      true,
      validation.ok ? "" : validation.errors.join("\n"),
    );
  });
}

test("there is no equal-layer-count invariant", () => {
  const counts = CARDINALITY_FIXTURES.map((shape) => {
    const graph = buildManyToMany(shape);
    return {
      requirements: graph.nodes.filter((n) => n.stage === "design-requirement").length,
      principles: graph.nodes.filter((n) => n.stage === "design-principle").length,
      features: graph.nodes.filter((n) => n.stage === "design-feature").length,
      valid:
        synthesisGrammarDiagnostics(graph, { requireFullProposal: true }).length === 0,
    };
  });
  // Every distribution is valid, and no two layers are forced equal.
  assert.ok(counts.every((entry) => entry.valid));
  assert.ok(
    counts.some(
      (entry) =>
        entry.requirements !== entry.principles ||
        entry.principles !== entry.features,
    ),
  );
});

// ---------------------------------------------------------------------------
// Section 26: PRIMARY edge grammar
// ---------------------------------------------------------------------------

function coreProposal(): GeneratedDiagram {
  return diagram(
    [
      problemNode(),
      node("r1", "design-requirement", "Preserve continuity"),
      node("p1", "design-principle", "Anchor to verifiable evidence"),
      node("f1", "design-feature", "Portable signed record"),
      node("a1", "artifact", "Exchange service"),
    ],
    [
      edge("problem", "r1", "motivates"),
      edge("r1", "p1", "addressed by"),
      edge("p1", "f1", "implemented by"),
      edge("f1", "a1", "instantiated in"),
    ],
  );
}

test("PRIMARY grammar accepts the adjacent Problem->Requirement->Principle->Feature->Artifact chain", () => {
  assert.deepEqual(
    synthesisGrammarDiagnostics(coreProposal(), { requireFullProposal: true }),
    [],
  );
});

const REJECTED_PRIMARY: Array<{ name: string; edge: GeneratedDiagramEdge; code: string }> = [
  { name: "requirement -> feature", edge: edge("r1", "f1", "implements"), code: "illegal-primary-edge:requirement->feature" },
  { name: "requirement -> artifact", edge: edge("r1", "a1", "instantiated in"), code: "illegal-primary-edge:requirement->artifact" },
  { name: "principle -> artifact", edge: edge("p1", "a1", "instantiated in"), code: "illegal-primary-edge:principle->artifact" },
  { name: "problem -> principle", edge: edge("problem", "p1", "motivates"), code: "illegal-primary-edge:problem->principle" },
  { name: "feature -> requirement (backward)", edge: edge("f1", "r1", "informs"), code: "backward-primary-edge" },
  { name: "artifact -> requirement (backward)", edge: edge("a1", "r1", "informs"), code: "backward-primary-edge" },
  { name: "principle -> principle as PRIMARY", edge: edge("p1", "p1b", "informs"), code: "illegal-primary-edge:principle->principle" },
  { name: "feature -> feature as PRIMARY", edge: edge("f1", "f1b", "informs"), code: "illegal-primary-edge:feature->feature" },
];

for (const scenario of REJECTED_PRIMARY) {
  test(`PRIMARY grammar rejects ${scenario.name}`, () => {
    const graph = coreProposal();
    if (scenario.edge.target === "p1b") {
      graph.nodes.push(node("p1b", "design-principle", "Second prescriptive rule"));
      graph.edges.push(edge("r1", "p1b", "addressed by"));
    }
    if (scenario.edge.target === "f1b") {
      graph.nodes.push(node("f1b", "design-feature", "Second concrete mechanism"));
      graph.edges.push(edge("p1", "f1b", "implemented by"));
      graph.edges.push(edge("f1b", "a1", "instantiated in"));
    }
    graph.edges.push(scenario.edge);
    const diagnostics = synthesisGrammarDiagnostics(graph, { requireFullProposal: true });
    assert.ok(
      diagnostics.includes(scenario.code),
      `expected ${scenario.code}, got: ${diagnostics.join(", ")}`,
    );
  });
}

test("a skipped primary layer over zero nodes is rejected and reports the missing layer", () => {
  const graph = diagram(
    [
      problemNode(),
      node("r1", "design-requirement", "Preserve continuity"),
      node("f1", "design-feature", "Portable signed record"),
      node("a1", "artifact", "Exchange service"),
    ],
    [
      edge("problem", "r1", "motivates"),
      edge("r1", "f1", "implements"),
      edge("f1", "a1", "instantiated in"),
    ],
  );
  const d = diag(synthesisGrammarDiagnostics(graph, { requireFullProposal: true }));
  assert.ok(d.has("illegal-primary-edge:requirement->feature"));
  assert.ok(d.has("skipped-primary-layer"));
  assert.ok(d.has("missing-principle-layer"));
  assert.ok(d.has("orphan-feature"));
});

// ---------------------------------------------------------------------------
// Section 27: SECONDARY dependencies
// ---------------------------------------------------------------------------

function twoPrincipleProposal(): GeneratedDiagram {
  return diagram(
    [
      problemNode(),
      node("r1", "design-requirement", "Preserve continuity"),
      node("p1", "design-principle", "Anchor to verifiable evidence"),
      node("p2", "design-principle", "Minimize disclosed context"),
      node("f1", "design-feature", "Portable signed record"),
      node("f2", "design-feature", "Selective disclosure proof"),
      node("a1", "artifact", "Exchange service"),
    ],
    [
      edge("problem", "r1", "motivates"),
      edge("r1", "p1", "addressed by"),
      edge("r1", "p2", "addressed by"),
      edge("p1", "f1", "implemented by"),
      edge("p2", "f2", "implemented by"),
      edge("f1", "a1", "instantiated in"),
      edge("f2", "a1", "instantiated in"),
    ],
  );
}

test("SECONDARY dependencies are accepted between same-role principles and features", () => {
  const graph = twoPrincipleProposal();
  graph.edges.push(edge("p1", "p2", "depends on"));
  graph.edges.push(edge("f1", "f2", "interoperates with"));
  assert.deepEqual(
    synthesisGrammarDiagnostics(graph, { requireFullProposal: true }),
    [],
  );
});

test("a SECONDARY edge cannot substitute for a missing PRIMARY parent", () => {
  const graph = twoPrincipleProposal();
  // Remove p2's only primary parent, then try to satisfy it with a dependency.
  graph.edges = graph.edges.filter(
    (e) => !(e.source === "r1" && e.target === "p2"),
  );
  graph.edges.push(edge("p1", "p2", "depends on"));
  const d = diag(synthesisGrammarDiagnostics(graph, { requireFullProposal: true }));
  assert.ok(d.has("orphan-principle"), [...d].join(", "));
});

test("a SECONDARY edge does not complete a primary path by itself", () => {
  const graph = diagram(
    [
      problemNode(),
      node("r1", "design-requirement"),
      node("p1", "design-principle"),
      node("p2", "design-principle"),
      node("f1", "design-feature"),
      node("a1", "artifact"),
    ],
    [
      edge("problem", "r1", "motivates"),
      edge("r1", "p1", "addressed by"),
      edge("p1", "p2", "depends on"),
      edge("p2", "f1", "implemented by"),
      edge("f1", "a1", "instantiated in"),
    ],
  );
  const d = diag(synthesisGrammarDiagnostics(graph, { requireFullProposal: true }));
  // p2 has no PRIMARY requirement parent; the dependency does not count.
  assert.ok(d.has("orphan-principle"), [...d].join(", "));
});

test("structural class comes from the closed vocabulary and unmapped types fail", () => {
  for (const type of PRIMARY_SYNTHESIS_RELATIONSHIP_TYPES) {
    assert.equal(synthesisEdgeStructuralClass(type), "primary", type);
  }
  for (const type of SECONDARY_SYNTHESIS_RELATIONSHIP_TYPES) {
    assert.equal(synthesisEdgeStructuralClass(type), "secondary", type);
  }
  assert.equal(synthesisEdgeStructuralClass("relates to"), null);

  const graph = coreProposal();
  graph.edges.push({
    source: "r1",
    target: "p1",
    label: "free text label",
    provenance: "synthesized",
    supportConceptIds: ["c/one"],
  });
  const d = diag(synthesisGrammarDiagnostics(graph, { requireFullProposal: true }));
  assert.ok(d.has("unknown-relationship-type"), [...d].join(", "));
});

// ---------------------------------------------------------------------------
// Section 28: evidence separation
// ---------------------------------------------------------------------------

test("proposal nodes cite multiple stored concepts without importing source edges", () => {
  const g: NativeOkfDiagramGrounding = {
    ...grounding(["paperA/p1", "paperB/f1", "paperC/r1"]),
    // A source-native relation between two retrieved concepts, which must never
    // be copied into the proposal topology.
    storedRelations: [
      { sourceId: "paperC/r1", targetId: "paperA/p1", label: "addressed by" },
    ],
  };
  const graph = diagram(
    [
      problemNode(),
      {
        ...node("r1", "design-requirement", "Preserve identity continuity"),
        sourcePaths: ["paperC/r1", "paperA/p1"],
        supportConceptIds: ["paperC/r1", "paperA/p1"],
      },
      {
        ...node("p1", "design-principle", "Anchor to verifiable evidence"),
        sourcePaths: ["paperA/p1"],
        supportConceptIds: ["paperA/p1"],
      },
      {
        ...node("f1", "design-feature", "Portable signed record"),
        sourcePaths: ["paperB/f1", "paperA/p1"],
        supportConceptIds: ["paperB/f1", "paperA/p1"],
      },
      {
        ...node("a1", "artifact", "Exchange service"),
        sourcePaths: ["paperB/f1"],
        supportConceptIds: ["paperB/f1"],
      },
    ],
    [
      edge("problem", "r1", "motivates"),
      { ...edge("r1", "p1", "addressed by"), supportConceptIds: ["paperC/r1", "paperA/p1"] },
      { ...edge("p1", "f1", "implemented by"), supportConceptIds: ["paperA/p1", "paperB/f1"] },
      { ...edge("f1", "a1", "instantiated in"), supportConceptIds: ["paperB/f1"] },
    ],
  );
  const validation = validateGeneratedDiagram(graph, g, {
    mode: "synthesized",
    requireRpfPath: true,
  });
  assert.equal(validation.ok, true, validation.ok ? "" : validation.errors.join("\n"));
  if (!validation.ok) return;
  // No proposal edge is stored provenance, and the count of edges equals the
  // authored count (no source-native edge was injected).
  assert.equal(validation.diagram.edges.length, 4);
  assert.ok(validation.diagram.edges.every((e) => e.provenance === "synthesized"));
  assert.ok(validation.diagram.nodes.every((n) => n.stage === "problem" || n.provenance === "synthesized"));
});

test("a stored node or stored edge in a synthesized proposal fails validation", () => {
  const graph = coreProposal();
  graph.nodes[1] = { ...graph.nodes[1]!, provenance: "stored", synthesis: false };
  const r1 = validateGeneratedDiagram(graph, grounding(), { mode: "synthesized" });
  assert.equal(r1.ok, false);

  const graph2 = coreProposal();
  graph2.edges[1] = { ...graph2.edges[1]!, provenance: "stored" };
  const r2 = validateGeneratedDiagram(graph2, grounding(), { mode: "synthesized" });
  assert.equal(r2.ok, false);
});

// ---------------------------------------------------------------------------
// Section 29: semantic-role validation
// ---------------------------------------------------------------------------

test("implementation mechanisms cannot pass as Requirements", () => {
  assert.equal(
    synthesisNodeRoleViolation({ label: "Use IPFS", stage: "design-requirement" }),
    "invalid-node-role:requirement-is-mechanism",
  );
  assert.equal(
    synthesisNodeRoleViolation({ label: "Deploy a blockchain ledger", stage: "design-requirement" }),
    "invalid-node-role:requirement-is-mechanism",
  );
  assert.equal(
    synthesisNodeRoleViolation({
      label: "Preserve product identity continuity across marketplaces",
      stage: "design-requirement",
    }),
    null,
  );
});

test("bare abstract qualities cannot pass as Design Features", () => {
  assert.equal(
    synthesisNodeRoleViolation({ label: "Privacy", stage: "design-feature" }),
    "invalid-node-role:feature-too-abstract",
  );
  assert.equal(
    synthesisNodeRoleViolation({
      label: "Selective disclosure credential with revocation",
      stage: "design-feature",
    }),
    null,
  );
});

test("role violations surface through the diagram validator", () => {
  const graph = coreProposal();
  graph.nodes[1] = { ...graph.nodes[1]!, label: "Use IPFS" };
  const d = diag(synthesisGrammarDiagnostics(graph, { requireFullProposal: true }));
  assert.ok(d.has("invalid-node-role:requirement-is-mechanism"), [...d].join(", "));
});

// ---------------------------------------------------------------------------
// Section 30: stored-map isolation
// ---------------------------------------------------------------------------

function storedNode(
  id: string,
  stage: DiagramStage,
  conceptId: string,
): GeneratedDiagramNode {
  return {
    id,
    label: `Stored concept ${conceptId}`,
    description: `Stored concept ${conceptId} description.`,
    category: stage,
    stage,
    order: 20,
    group: null,
    provenance: "stored",
    sourcePaths: [conceptId],
    supportConceptIds: [conceptId],
    synthesisRationale: null,
    synthesis: false,
  };
}

test("the synthesized grammar is never applied to stored source maps", () => {
  const storedGrounding: NativeOkfDiagramGrounding = {
    allowedConceptIds: new Set(["paper/dr1", "paper/df1"]),
    eligibleStoredConceptIds: new Set(["paper/dr1", "paper/df1"]),
    conceptsById: new Map([
      ["paper/dr1", { conceptId: "paper/dr1", title: "Stored concept paper/dr1", description: "d", type: "design-requirement", stage: "design-requirement" as DiagramStage }],
      ["paper/df1", { conceptId: "paper/df1", title: "Stored concept paper/df1", description: "d", type: "design-feature", stage: "design-feature" as DiagramStage }],
    ]),
    storedRelations: [
      { sourceId: "paper/dr1", targetId: "paper/df1", label: "leads to" },
    ],
  };
  // A structurally unusual real-paper shape: a design-requirement wired directly
  // to a design-feature, with no principle. Legal for a stored map.
  const storedMap = diagram(
    [
      storedNode("dr1", "design-requirement", "paper/dr1"),
      storedNode("df1", "design-feature", "paper/df1"),
    ],
    [
      {
        source: "dr1",
        target: "df1",
        label: "leads to",
        provenance: "stored",
        supportConceptIds: ["paper/dr1", "paper/df1"],
      },
    ],
  );
  const validation = validateGeneratedDiagram(storedMap, storedGrounding, {
    mode: "stored",
  });
  assert.equal(
    validation.ok,
    true,
    validation.ok ? "" : validation.errors.join("\n"),
  );
});
