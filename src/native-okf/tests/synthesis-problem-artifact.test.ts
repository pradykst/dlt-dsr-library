import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import type { NativeOpenAiClient } from "../server/openai/client.ts";
import type { NativeOkfDiagramGrounding } from "../server/openai/diagram-grounding.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import { answerNativeOkfChat } from "../server/openai/chat.ts";
import {
  convertNativeOkfSynthesisPlan,
  NATIVE_OKF_SYNTHESIS_PLAN_INSTRUCTIONS,
  SYNTHESIS_PLAN_JSON_SCHEMA,
  SYNTHESIS_PLAN_LIMITS,
  type SynthesisPlan,
  validateNativeOkfSynthesisPlan,
} from "../server/openai/synthesis-plan.ts";
import {
  applyNativeOkfSynthesisRefinementPatch,
  type SynthesisRefinementPatch,
} from "../server/openai/synthesis-refinement.ts";
import {
  SYNTHESIS_PROBLEM_ARTIFACT_CONFLATION_CODE,
  synthesisGrammarDiagnostics,
  synthesisLabelContentTokens,
  synthesisProblemArtifactConflation,
} from "../server/openai/synthesis-grammar.ts";
import type {
  GeneratedDiagram,
  GeneratedDiagramNode,
  SynthesisDraftState,
} from "../shared/chat-types.ts";

const ENVIRONMENT: NativeOpenAiEnvironment = {
  apiKey: "mock-only-not-live",
  model: "mock-model",
  reasoningEffort: "low",
  moderationEnabled: false,
  maxOutputTokens: 900,
  diagramMaxOutputTokens: 2_000,
};

/** Normalized comparison: the semantic identity of a label. */
function normalized(label: string): string {
  return synthesisLabelContentTokens(label).join(" ");
}

// ---------------------------------------------------------------------------
// Deterministic plan fixture
// ---------------------------------------------------------------------------

interface PlanLabels {
  title: string;
  problemLabel: string;
  requirements: readonly string[];
  principles: readonly string[];
  features: readonly string[];
  artifact: string;
  evaluation?: string;
  outcome?: string;
}

/**
 * A complete, grammatically valid plan over whatever stored concepts the real
 * retrieval selected for this turn, so these tests assert the semantic contract
 * without depending on any particular corpus paper or node count.
 */
function planFor(
  grounding: NativeOkfDiagramGrounding,
  labels: PlanLabels,
): SynthesisPlan {
  const ids = [...grounding.eligibleStoredConceptIds];
  assert.ok(ids.length >= 1, "the fixture needs at least one allowlisted concept");
  const support = (index: number) => [ids[index % ids.length]!];
  const node = (prefix: string, label: string, index: number) => ({
    key: `${prefix}-${index + 1}`,
    label,
    description: `${label}. A grounded synthesized ${prefix} for this fixture.`,
    supportConceptIds: support(index),
  });

  const requirements = labels.requirements.map((label, index) =>
    node("requirement", label, index)
  );
  const principles = labels.principles.map((label, index) => node("principle", label, index));
  const features = labels.features.map((label, index) => node("feature", label, index));
  const artifact = [node("artifact", labels.artifact, 0)];
  const evaluation = labels.evaluation ? [node("evaluation", labels.evaluation, 1)] : [];
  const outcome = labels.outcome ? [node("outcome", labels.outcome, 2)] : [];

  const relationships: SynthesisPlan["relationships"] = [];
  const link = (
    sourceKey: string,
    targetKey: string,
    relationshipType: SynthesisPlan["relationships"][number]["relationshipType"],
    index: number,
  ) => {
    relationships.push({
      id: `e${relationships.length + 1}`,
      sourceKey,
      targetKey,
      relationshipType,
      rationale: "A grounded proposed design relation for this fixture.",
      supportConceptIds: support(index),
    });
  };
  requirements.forEach((requirement, index) =>
    link("problem", requirement.key, "motivates", index)
  );
  principles.forEach((principle, index) =>
    link(requirements[index % requirements.length]!.key, principle.key, "addressed by", index)
  );
  features.forEach((feature, index) =>
    link(principles[index % principles.length]!.key, feature.key, "implemented by", index)
  );
  features.forEach((feature, index) =>
    link(feature.key, artifact[0]!.key, "instantiated in", index)
  );
  const evaluationNode = evaluation[0];
  if (evaluationNode) link(artifact[0]!.key, evaluationNode.key, "evaluated by", 0);
  const outcomeNode = outcome[0];
  if (outcomeNode) {
    link(evaluationNode?.key ?? artifact[0]!.key, outcomeNode.key, "informs", 1);
  }

  return {
    title: labels.title,
    problemLabel: labels.problemLabel,
    problemSummary: "Replaced by the validated server-side problem statement.",
    supportingStoredConceptIds: [...new Set(ids.slice(0, 3))],
    coverageRationale: "Uses the allowlisted stored concepts selected for this turn.",
    requirements,
    principles,
    features,
    artifact,
    evaluation,
    outcome,
    relationships,
  };
}

/** A client whose text model must never run: synthesis is deterministic here. */
function noAnswerModelClient(): NativeOpenAiClient {
  return {
    responses: {
      create: async () => {
        throw new Error("the answer model must not run for a synthesis turn");
      },
    },
    moderations: {
      create: async () => ({ results: [{ flagged: false }] }) as never,
    },
  };
}

interface SynthesisTurn {
  answerMarkdown: string;
  diagram: GeneratedDiagram;
  problem: GeneratedDiagramNode;
  artifacts: GeneratedDiagramNode[];
  sources: { sourceId: string; conceptId: string }[];
}

/**
 * Runs one full synthesis turn end to end (real retrieval, real conversion,
 * real prose) with a deterministic plan standing in for the model.
 */
async function synthesisTurn(
  question: string,
  labels: PlanLabels,
): Promise<SynthesisTurn> {
  const result = await answerNativeOkfChat(
    { question, includeDiagram: true },
    {
      environment: ENVIRONMENT,
      client: noAnswerModelClient(),
      generateDiagram: async (input) => {
        const plan = planFor(input.grounding, labels);
        const validation = validateNativeOkfSynthesisPlan(plan, input.grounding, {
          requireRpfPath: input.requireRpfPath,
        });
        assert.equal(
          validation.ok,
          true,
          validation.ok ? undefined : validation.errors.join("\n"),
        );
        const converted = convertNativeOkfSynthesisPlan(
          plan,
          input.grounding,
          input.synthesisProblem ?? input.question,
          input.requireRpfPath,
        );
        assert.ok(converted, "the fixture plan must convert");
        return {
          diagram: converted.diagram,
          usedSupportConceptIds: converted.usedSupportConceptIds,
          warnings: [],
        };
      },
    },
  );
  assert.equal(result.presentationMode, "diagram-primary");
  assert.ok(result.diagram, "a synthesis turn returns a diagram");
  const problem = result.diagram!.nodes.find((node) => node.stage === "problem");
  assert.ok(problem, "a synthesis diagram always has a problem node");
  return {
    answerMarkdown: result.answerMarkdown,
    diagram: result.diagram!,
    problem: problem!,
    artifacts: result.diagram!.nodes.filter((node) => node.stage === "artifact"),
    sources: result.sources.map((source) => ({
      sourceId: source.sourceId,
      conceptId: source.conceptId,
    })),
  };
}

/** The complete primary path is present and correctly directed. */
function assertCompletePrimaryPath(diagram: GeneratedDiagram): void {
  assert.deepEqual(
    synthesisGrammarDiagnostics(diagram, { requireFullProposal: true }),
    [],
  );
  for (const stage of [
    "problem",
    "design-requirement",
    "design-principle",
    "design-feature",
    "artifact",
  ] as const) {
    assert.ok(
      diagram.nodes.some((node) => node.stage === stage),
      `the primary path needs a ${stage} node`,
    );
  }
}

// ---------------------------------------------------------------------------
// TEST A: the production defect, on the same class of design problem
// ---------------------------------------------------------------------------

test("A: a product-fragmentation problem yields a problem-oriented Problem node and a distinct Artifact", async () => {
  const turn = await synthesisTurn(
    "I have product data fragmentation across independent ecommerce marketplaces. The records lack trust and provenance. Help me solve this with a proper DSR diagram.",
    {
      // A solution-oriented proposal title, exactly as the production defect had.
      title: "Trusted Product Evidence Fabric for Cross-Marketplace Commerce",
      problemLabel: "Fragmented and weakly provenanced product records across marketplaces",
      requirements: [
        "Keep product claims traceable to their origin",
        "Keep product identity consistent between marketplaces",
        "Keep verification possible without over-disclosure",
      ],
      principles: [
        "Bind accountability to every published claim",
        "Reconcile identity without erasing legitimate differences",
        "Verify only what the decision actually requires",
      ],
      features: [
        "Signed product evidence envelope",
        "Canonical identity resolution service",
        "Provenance verification interface",
        "Scoped evidence access gateway",
      ],
      artifact: "Trusted product evidence fabric",
      evaluation: "Cross-marketplace verification pilot",
      outcome: "Reusable trustworthy product records",
    },
  );

  // The Problem node describes the deficiency, not the proposed system.
  assert.match(turn.problem.label, /fragmented|provenanc/iu);
  assert.equal(turn.problem.provenance, "user-provided");
  assert.deepEqual(turn.problem.supportConceptIds, []);

  // The Artifact node describes the designed solution.
  assert.equal(turn.artifacts.length, 1);
  assert.match(turn.artifacts[0]!.label, /fabric/iu);
  assert.equal(turn.artifacts[0]!.provenance, "synthesized");

  // Problem space and solution space stay distinct.
  assert.notEqual(normalized(turn.problem.label), normalized(turn.artifacts[0]!.label));
  assert.equal(
    synthesisProblemArtifactConflation(turn.problem.label, [turn.artifacts[0]!.label]),
    null,
  );

  assertCompletePrimaryPath(turn.diagram);

  // The prose addresses the problem, never the artifact, and does not claim to
  // list every concept while summarizing one layer.
  assert.match(turn.answerMarkdown, /^This design proposal addresses /u);
  assert.doesNotMatch(
    turn.answerMarkdown.split("\n")[0]!,
    /trusted product evidence fabric/iu,
  );
  assert.doesNotMatch(turn.answerMarkdown, /Every design concept below/iu);
  assert.match(turn.answerMarkdown, /The proposal is organized around three design principles:/u);

  // Evidence stays evidence: proposal nodes cite stored concepts, and no stored
  // concept becomes a vertex.
  assert.ok(turn.sources.length > 0);
  assert.ok(
    turn.diagram.nodes.every((node) =>
      node.stage === "problem"
        ? node.provenance === "user-provided"
        : node.provenance === "synthesized" && node.supportConceptIds.length > 0
    ),
  );
  assert.ok(turn.diagram.edges.every((edge) => edge.provenance === "synthesized"));
});

// ---------------------------------------------------------------------------
// TEST B: a materially different domain, so the fix is not overfitted
// ---------------------------------------------------------------------------

test("B: a healthcare consent-exchange problem keeps the same problem/artifact separation", async () => {
  const turn = await synthesisTurn(
    "Organizations cannot exchange consent records reliably across healthcare providers. Help me design a solution and show a DSR diagram.",
    {
      title: "Portable Consent Exchange Platform",
      problemLabel: "Consent records cannot be exchanged reliably between providers",
      requirements: [
        "Keep a consent decision interpretable at every provider",
        "Keep consent withdrawal effective everywhere it was relied on",
      ],
      principles: [
        "Express consent in provider-independent terms",
        "Propagate revocation as a first-class event",
      ],
      features: [
        "Portable consent receipt",
        "Revocation propagation channel",
      ],
      artifact: "Portable consent exchange service",
      evaluation: "Multi-provider consent exchange trial",
    },
  );

  assert.match(turn.problem.label, /consent/iu);
  assert.match(turn.problem.label, /cannot|reliab/iu);
  assert.equal(turn.artifacts.length, 1);
  assert.notEqual(normalized(turn.problem.label), normalized(turn.artifacts[0]!.label));
  assert.equal(
    synthesisProblemArtifactConflation(turn.problem.label, [turn.artifacts[0]!.label]),
    null,
  );
  assertCompletePrimaryPath(turn.diagram);
  assert.match(turn.answerMarkdown, /^This design proposal addresses /u);
  assert.match(turn.answerMarkdown, /The proposal is organized around two design principles:/u);
});

// ---------------------------------------------------------------------------
// TEST C: a model that reuses the artifact's name as the problem is rejected
// ---------------------------------------------------------------------------

test("C: a plan whose Problem label restates the Artifact fails deterministic validation", () => {
  const grounding: NativeOkfDiagramGrounding = {
    allowedConceptIds: new Set(["fixture/c1"]),
    eligibleStoredConceptIds: new Set(["fixture/c1"]),
    conceptsById: new Map([[
      "fixture/c1",
      {
        conceptId: "fixture/c1",
        title: "Canonical stored concept",
        description: "A canonical stored concept used as evidence.",
        type: "design-principle",
        stage: "design-principle" as const,
      },
    ]]),
    storedRelations: [],
  };
  const labels: PlanLabels = {
    title: "Trusted evidence fabric",
    problemLabel: "Trusted evidence fabric",
    requirements: ["Keep claims traceable to their origin"],
    principles: ["Bind accountability to every published claim"],
    features: ["Signed evidence envelope"],
    artifact: "Trusted evidence fabric",
  };

  const conflated = validateNativeOkfSynthesisPlan(
    planFor(grounding, labels),
    grounding,
    { requireRpfPath: true },
  );
  assert.equal(conflated.ok, false);
  assert.ok(
    !conflated.ok &&
      conflated.errors.some((error) =>
        error.includes(SYNTHESIS_PROBLEM_ARTIFACT_CONFLATION_CODE)
      ),
    "the conflation must be reported as a precise, repairable diagnostic",
  );

  // Cosmetic differences do not launder the same phrase.
  for (const problemLabel of [
    "trusted evidence fabrics",
    "Trusted, evidence-fabric",
    "The trusted evidence fabric",
    "Trusted Product Evidence Fabric for cross-marketplace commerce",
  ]) {
    const cosmetic = validateNativeOkfSynthesisPlan(
      planFor(grounding, {
        ...labels,
        problemLabel,
        artifact: problemLabel.startsWith("Trusted Product")
          ? "Trusted product evidence fabric"
          : "Trusted evidence fabric",
      }),
      grounding,
      { requireRpfPath: true },
    );
    assert.equal(cosmetic.ok, false, problemLabel);
  }

  // The same plan with a genuine problem statement validates and converts.
  const repaired = validateNativeOkfSynthesisPlan(
    planFor(grounding, {
      ...labels,
      problemLabel: "Product claims cannot be traced to an accountable origin",
    }),
    grounding,
    { requireRpfPath: true },
  );
  assert.equal(repaired.ok, true, repaired.ok ? undefined : repaired.errors.join("\n"));
  assert.ok(
    repaired.ok &&
      convertNativeOkfSynthesisPlan(
        repaired.plan,
        grounding,
        "Product claims cannot be traced to an accountable origin.",
        true,
      ),
  );
});

/**
 * Regression: the Problem node is the most prominent label in the rendered
 * diagram, and a label generated right up against the schema's character
 * ceiling was cut off there mid-word ("... lacks trustworthy, trace"). That
 * must become a bounded repair, never a shipped label.
 */
test("C2: a Problem label cut off at the schema ceiling is rejected for repair", () => {
  const grounding: NativeOkfDiagramGrounding = {
    allowedConceptIds: new Set(["fixture/c1"]),
    eligibleStoredConceptIds: new Set(["fixture/c1"]),
    conceptsById: new Map([[
      "fixture/c1",
      {
        conceptId: "fixture/c1",
        title: "Canonical stored concept",
        description: "A canonical stored concept used as evidence.",
        type: "design-principle",
        stage: "design-principle" as const,
      },
    ]]),
    storedRelations: [],
  };
  const base: PlanLabels = {
    title: "Federated provenance exchange",
    problemLabel: "Weak provenance across independent marketplaces",
    requirements: ["Keep product claims traceable to their origin"],
    principles: ["Bind accountability to every published claim"],
    features: ["Signed evidence envelope"],
    artifact: "Federated provenance exchange service",
  };
  const ceiling = SYNTHESIS_PLAN_LIMITS.maxProblemLabelCharacters;

  const whole = validateNativeOkfSynthesisPlan(
    planFor(grounding, base),
    grounding,
    { requireRpfPath: true },
  );
  assert.equal(whole.ok, true, whole.ok ? undefined : whole.errors.join("\n"));

  const clipped = validateNativeOkfSynthesisPlan(
    planFor(grounding, {
      ...base,
      problemLabel: "a".repeat(ceiling - 6) + " trace",
    }),
    grounding,
    { requireRpfPath: true },
  );
  assert.equal(clipped.ok, false);
  assert.ok(
    !clipped.ok && clipped.errors.includes("plan:truncated-problem-label"),
    "the clipped label must be reported as its own repairable diagnostic",
  );

  // One character short of the ceiling is a whole label and stays accepted.
  const justUnder = validateNativeOkfSynthesisPlan(
    planFor(grounding, {
      ...base,
      problemLabel: "a".repeat(ceiling - 7) + " trace",
    }),
    grounding,
    { requireRpfPath: true },
  );
  assert.equal(justUnder.ok, true, justUnder.ok ? undefined : justUnder.errors.join("\n"));

  // The generation contract asks for a compact node label, so the ceiling is
  // not approached in the first place.
  assert.match(
    NATIVE_OKF_SYNTHESIS_PLAN_INSTRUCTIONS,
    /compact noun phrase of roughly four to twelve words/u,
  );
  assert.match(
    NATIVE_OKF_SYNTHESIS_PLAN_INSTRUCTIONS,
    /This design proposal addresses <problemLabel>/u,
  );
});

// ---------------------------------------------------------------------------
// TEST D: a solution-oriented proposal title is still allowed
// ---------------------------------------------------------------------------

test("D: the proposal title may name the solution while the Problem node states the challenge", async () => {
  const turn = await synthesisTurn(
    "Design a platform for verifying supplier claims across procurement networks, and give me a DSR diagram.",
    {
      title: "Trusted Supplier Claim Platform",
      problemLabel: "Supplier claims cannot be verified across procurement networks",
      requirements: ["Keep a supplier claim checkable by any buyer"],
      principles: ["Attach verifiable accountability to each claim"],
      features: ["Buyer-side claim verification interface"],
      artifact: "Supplier claim verification platform",
    },
  );

  // Both labels legitimately contain "platform" and "claim"; shared vocabulary
  // is not conflation.
  assert.match(turn.problem.label, /supplier claims cannot be verified/iu);
  assert.match(turn.artifacts[0]!.label, /platform/iu);
  assert.notEqual(normalized(turn.problem.label), normalized(turn.artifacts[0]!.label));
  assert.equal(
    synthesisProblemArtifactConflation(turn.problem.label, [turn.artifacts[0]!.label]),
    null,
  );
  assertCompletePrimaryPath(turn.diagram);
  // The proposal title never becomes the Problem node.
  assert.notEqual(
    normalized(turn.problem.label),
    normalized("Trusted Supplier Claim Platform"),
  );
});

// ---------------------------------------------------------------------------
// TEST E: refinement is held to the same distinction
// ---------------------------------------------------------------------------

function draftNode(
  id: string,
  label: string,
  stage: GeneratedDiagramNode["stage"],
  order: number,
  provenance: GeneratedDiagramNode["provenance"] = "synthesized",
): GeneratedDiagramNode {
  return {
    id,
    label,
    description: `${label}. A grounded proposal node for this fixture.`,
    category: "Fixture",
    stage,
    order,
    group: null,
    provenance,
    sourcePaths: provenance === "synthesized" ? ["fixture/c1"] : [],
    supportConceptIds: provenance === "synthesized" ? ["fixture/c1"] : [],
    synthesisRationale: provenance === "synthesized" ? "Proposed for this problem." : null,
    synthesis: provenance === "synthesized",
  };
}

test("E: a refinement cannot rename the Artifact into the Problem label", async () => {
  const grounding: NativeOkfDiagramGrounding = {
    allowedConceptIds: new Set(["fixture/c1"]),
    eligibleStoredConceptIds: new Set(["fixture/c1"]),
    conceptsById: new Map([[
      "fixture/c1",
      {
        conceptId: "fixture/c1",
        title: "Canonical stored concept",
        description: "A canonical stored concept used as evidence.",
        type: "design-principle",
        stage: "design-principle" as const,
      },
    ]]),
    storedRelations: [],
  };
  const priorDraft: SynthesisDraftState = {
    version: 1,
    problemStatement: "Supplier claims cannot be verified across procurement networks.",
    domain: null,
    objective: null,
    constraints: [],
    nodes: [
      draftNode(
        "user-problem",
        "Supplier claims cannot be verified across networks",
        "problem",
        0,
        "user-provided",
      ),
      draftNode("plan-r1", "Keep a supplier claim checkable by any buyer", "design-requirement", 20),
      draftNode("plan-p1", "Attach verifiable accountability to each claim", "design-principle", 40),
      draftNode("plan-f1", "Buyer-side claim verification interface", "design-feature", 60),
      draftNode("plan-a1", "Supplier claim verification platform", "artifact", 75),
    ],
    edges: [
      { source: "user-problem", target: "plan-r1", label: "motivates", provenance: "synthesized", supportConceptIds: ["fixture/c1"] },
      { source: "plan-r1", target: "plan-p1", label: "addressed by", provenance: "synthesized", supportConceptIds: ["fixture/c1"] },
      { source: "plan-p1", target: "plan-f1", label: "implemented by", provenance: "synthesized", supportConceptIds: ["fixture/c1"] },
      { source: "plan-f1", target: "plan-a1", label: "instantiated in", provenance: "synthesized", supportConceptIds: ["fixture/c1"] },
    ],
  };

  const rename = (label: string): SynthesisRefinementPatch => ({
    addNodes: [],
    updateNodes: [{
      nodeId: "plan-a1",
      label,
      description: "A renamed artifact for this fixture.",
      category: "Artifact",
      stage: "artifact",
      supportConceptIds: ["fixture/c1"],
      synthesisRationale: "Renamed on request.",
    }],
    removeNodeIds: [],
    addEdges: [],
    removeEdges: [],
  });

  const conflated = await applyNativeOkfSynthesisRefinementPatch(
    priorDraft,
    rename("Supplier claims cannot be verified across networks"),
    grounding,
    priorDraft.problemStatement,
    true,
  );
  assert.equal(conflated.ok, false);
  assert.ok(
    !conflated.ok &&
      conflated.errors.some((error) =>
        error.includes(SYNTHESIS_PROBLEM_ARTIFACT_CONFLATION_CODE)
      ),
  );

  // A legitimate rename that shares vocabulary with the problem still applies.
  const legitimate = await applyNativeOkfSynthesisRefinementPatch(
    priorDraft,
    rename("Cross-network supplier claim verification service"),
    grounding,
    priorDraft.problemStatement,
    true,
  );
  assert.equal(
    legitimate.ok,
    true,
    legitimate.ok ? undefined : legitimate.errors.join("\n"),
  );
});

// ---------------------------------------------------------------------------
// Adversarial: the validator must not over-reject legitimate shared vocabulary
// ---------------------------------------------------------------------------

test("the conflation check rejects duplication and accepts shared domain vocabulary", () => {
  const rejected: Array<[string, string]> = [
    ["Trusted product evidence fabric", "Trusted Product Evidence Fabric"],
    ["Trusted Product Evidence Fabric for Cross-Marketplace Commerce", "Trusted product evidence fabric"],
    ["The trusted evidence fabrics", "Trusted evidence fabric"],
    ["Consent exchange service", "Consent-exchange service"],
    ["A cross-marketplace identity resolution service", "Cross marketplace identity resolution service"],
  ];
  for (const [problem, artifact] of rejected) {
    assert.equal(
      synthesisProblemArtifactConflation(problem, [artifact]),
      SYNTHESIS_PROBLEM_ARTIFACT_CONFLATION_CODE,
      `${problem} / ${artifact}`,
    );
  }

  const accepted: Array<[string, string]> = [
    // The canonical legitimate pairing from the methodological brief.
    ["Fragmented identity records across marketplaces", "Cross-marketplace identity resolution service"],
    ["Product data fragmentation with weak provenance across marketplaces", "Trusted product evidence fabric"],
    // Generic solution vocabulary in a problem label is not conflation.
    ["Fragmented legacy systems across departments", "Unified integration platform"],
    ["Weak trust in marketplace listings", "Marketplace listing assurance system"],
    ["Blockchain identity records cannot be revoked", "Revocable credential registry"],
    // An artifact that names the problem domain it addresses.
    ["Supplier claims cannot be verified", "Supplier claim verification platform"],
    ["Data silos", "Data mesh"],
    // Short labels that merely share a head noun.
    ["Consent fragmentation", "Consent exchange service"],
  ];
  for (const [problem, artifact] of accepted) {
    assert.equal(
      synthesisProblemArtifactConflation(problem, [artifact]),
      null,
      `${problem} / ${artifact}`,
    );
  }

  // Multiple artifacts: any one of them conflating is enough to reject.
  assert.equal(
    synthesisProblemArtifactConflation("Trusted evidence fabric", [
      "Identity resolution service",
      "Trusted evidence fabric",
    ]),
    SYNTHESIS_PROBLEM_ARTIFACT_CONFLATION_CODE,
  );
  // No artifact layer at all is not a conflation.
  assert.equal(synthesisProblemArtifactConflation("Any problem label", []), null);
});

// ---------------------------------------------------------------------------
// The contract itself: distinct fields, and a prompt that says so
// ---------------------------------------------------------------------------

test("the plan schema keeps userProblem, problemLabel, proposalTitle, and artifact distinct", () => {
  const schema = SYNTHESIS_PLAN_JSON_SCHEMA;
  assert.ok(schema.required.includes("problemLabel"));
  assert.ok(schema.required.includes("title"));
  assert.ok(schema.required.includes("problemSummary"));
  assert.ok(schema.required.includes("artifact"));
  assert.notEqual(schema.properties.problemLabel, undefined);
  // The proposal title stays a separate, longer field from the problem label.
  assert.ok(
    schema.properties.title.maxLength > schema.properties.problemLabel.maxLength,
  );

  // The generation contract states the separation explicitly and stays generic.
  assert.match(NATIVE_OKF_SYNTHESIS_PLAN_INSTRUCTIONS, /problemLabel states the PROBLEM/u);
  assert.match(
    NATIVE_OKF_SYNTHESIS_PLAN_INSTRUCTIONS,
    /Never reuse the artifact's name, or the proposal title, as problemLabel/u,
  );
  assert.match(
    NATIVE_OKF_SYNTHESIS_PLAN_INSTRUCTIONS,
    /sharing ordinary domain vocabulary is expected/iu,
  );
});

test("the problem node is never wired from the proposal title", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      new URL("../server/openai/synthesis-plan.ts", import.meta.url),
      "utf8",
    )
  );
  // The only value that may reach the problem node is the plan's problemLabel.
  assert.match(source, /createNativeOkfSynthesisProblemNode\(\s*validatedProblemStatement,\s*plan\.problemLabel,\s*\)/u);
  assert.doesNotMatch(source, /resolveSynthesisProblemLabel\(\s*plan\.title/u);
  assert.doesNotMatch(source, /createNativeOkfSynthesisProblemNode\([^)]*plan\.title/u);
});
