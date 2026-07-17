import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import type { NativeOpenAiClient } from "../server/openai/client.ts";
import type { NativeOkfGroundedContext } from "../server/openai/context.ts";
import {
  generateNativeOkfDiagram,
  type GenerateNativeOkfDiagramOptions,
} from "../server/openai/diagram.ts";
import { DIAGRAM_LIMITS } from "../server/openai/diagram-schema.ts";
import { validateGeneratedDiagram } from "../server/openai/diagram-validation.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import type { DiagramStage, GeneratedDiagram } from "../shared/chat-types.ts";

const PAPER_ID = "papers/example-paper";
const PRINCIPLE_ID = "design-knowledge/example-dp1";
const ALLOWLIST = new Set([PAPER_ID, PRINCIPLE_ID]);

const environment: NativeOpenAiEnvironment = {
  apiKey: "test-key-never-logged",
  model: "test-model",
  reasoningEffort: "low",
  moderationEnabled: false,
  maxOutputTokens: 1_000,
  diagramMaxOutputTokens: 800,
};

const context: NativeOkfGroundedContext = {
  sources: [],
  sourceById: new Map(),
  allowedConceptIds: ALLOWLIST,
  prompt: `<OKF_SOURCE id="S1" path="${PAPER_ID}">Grounded content</OKF_SOURCE>`,
};

function validDiagram(): GeneratedDiagram {
  return {
    title: "Grounded design",
    explanation: "A direct concept informs a proposed combination.",
    nodes: [
      {
        id: "stored",
        label: "Stored principle",
        category: "design-principle",
        description: "A design principle represented directly by an OKF source.",
        stage: "principles",
        order: 20,
        group: null,
        sourcePaths: [PRINCIPLE_ID],
        synthesis: false,
      },
      {
        id: "proposal",
        label: "Proposed combination",
        category: "synthesis",
        sourcePaths: [PAPER_ID, PRINCIPLE_ID],
        description: "A proposed combination informed by the retrieved sources.",
        stage: "artifact",
        order: 60,
        group: null,
        synthesis: true,
      },
    ],
    edges: [{ source: "stored", target: "proposal", label: "informs" }],
  };
}

function validTwelveNodeDiagram(): GeneratedDiagram {
  const node = (
    id: string,
    label: string,
    stage: DiagramStage,
    order: number,
    group: string | null,
    synthesis = false,
  ): GeneratedDiagram["nodes"][number] => ({
    id,
    label,
    description: `Grounded description for ${label}.`,
    category: synthesis ? "synthesis" : "stored knowledge",
    stage,
    order,
    group,
    sourcePaths: [synthesis ? PAPER_ID : PRINCIPLE_ID],
    synthesis,
  });

  return {
    title: "Compact multi-branch flow",
    explanation: "Three grounded branches converge into one evaluated outcome.",
    nodes: [
      node("problem", "Define problem", "problem", 0, null),
      node("requirements", "Set requirements", "requirements", 10, null),
      node("principle-a", "Apply principle A", "principles", 20, "branch-a"),
      node("principle-b", "Apply principle B", "principles", 21, "branch-b"),
      node("principle-c", "Apply principle C", "principles", 22, "branch-c"),
      node("feature-a", "Build feature A", "features", 40, "branch-a"),
      node("feature-b", "Build feature B", "features", 41, "branch-b"),
      node("feature-c", "Build feature C", "features", 42, "branch-c"),
      node("artifact", "Integrate artifact", "artifact", 60, null, true),
      node("governance", "Apply governance", "governance", 70, null, true),
      node("evaluation", "Evaluate artifact", "evaluation", 80, null, true),
      node("outcome", "Assess outcome", "outcome", 90, null, true),
    ],
    edges: [
      { source: "problem", target: "requirements", label: "requires" },
      { source: "requirements", target: "principle-a", label: "addresses" },
      { source: "requirements", target: "principle-b", label: "addresses" },
      { source: "requirements", target: "principle-c", label: "addresses" },
      { source: "principle-a", target: "feature-a", label: "enables" },
      { source: "principle-b", target: "feature-b", label: "enables" },
      { source: "principle-c", target: "feature-c", label: "enables" },
      { source: "feature-a", target: "artifact", label: "implements" },
      { source: "feature-b", target: "artifact", label: "implements" },
      { source: "feature-c", target: "artifact", label: "implements" },
      { source: "artifact", target: "governance", label: "requires" },
      { source: "governance", target: "evaluation", label: "enables" },
      { source: "evaluation", target: "outcome", label: "validates" },
    ],
  };
}

function responseFor(output: unknown): unknown {
  return {
    id: "response-test",
    object: "response",
    created_at: 0,
    model: "test-model",
    output: [],
    output_text: typeof output === "string" ? output : JSON.stringify(output),
    parallel_tool_calls: false,
    status: "completed",
    incomplete_details: null,
    error: null,
    instructions: null,
    metadata: {},
    temperature: null,
    tool_choice: "none",
    tools: [],
    top_p: null,
    background: false,
    max_output_tokens: 800,
    previous_response_id: null,
    prompt: null,
    reasoning: null,
    safety_identifier: null,
    service_tier: "default",
    store: false,
    text: { format: { type: "text" } },
    truncation: "disabled",
    usage: null,
    user: null,
  };
}

function clientWithOutputs(outputs: unknown[]): {
  client: NativeOpenAiClient;
  requests: unknown[];
} {
  const requests: unknown[] = [];
  let index = 0;
  const client = {
    responses: {
      create: async (request: unknown) => {
        requests.push(request);
        const output = outputs[index];
        index += 1;
        return responseFor(output);
      },
    },
  } as unknown as NativeOpenAiClient;
  return { client, requests };
}

function generationOptions(client: NativeOpenAiClient): GenerateNativeOkfDiagramOptions {
  return {
    client,
    environment,
    context,
    question: "Show a grounded diagram.",
    answerMarkdown: `The principle informs a proposal [[S1]].`,
  };
}

test("accepts a valid grounded synthesis node", () => {
  const result = validateGeneratedDiagram(validDiagram(), ALLOWLIST);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.diagram.nodes[1]?.synthesis, true);
  assert.deepEqual(result.diagram.nodes[1]?.sourcePaths, [PAPER_ID, PRINCIPLE_ID]);
});

test("requires description, stage, order, and nullable group metadata", () => {
  for (const field of ["description", "stage", "order", "group"] as const) {
    const diagram = validDiagram();
    delete (diagram.nodes[0] as unknown as Record<string, unknown>)[field];
    const result = validateGeneratedDiagram(diagram, ALLOWLIST);
    assert.equal(result.ok, false, `missing ${field} should be rejected`);
    if (!result.ok) {
      assert.match(result.errors.join(" "), new RegExp(`\\.${field}\\b`));
    }
  }

  const nullableGroup = validateGeneratedDiagram(validDiagram(), ALLOWLIST);
  assert.equal(nullableGroup.ok, true);
});

test("rejects unknown stages and oversized canvas labels", () => {
  const unknownStage = validDiagram();
  (unknownStage.nodes[0] as unknown as Record<string, unknown>).stage =
    "unsupported-stage";
  const stageResult = validateGeneratedDiagram(unknownStage, ALLOWLIST);
  assert.equal(stageResult.ok, false);
  if (!stageResult.ok) assert.match(stageResult.errors.join(" "), /stage must be one of/);

  const oversizedLabel = validDiagram();
  oversizedLabel.nodes[0]!.label = "x".repeat(
    DIAGRAM_LIMITS.maxNodeLabelCharacters + 1,
  );
  const labelResult = validateGeneratedDiagram(oversizedLabel, ALLOWLIST);
  assert.equal(labelResult.ok, false);
  if (!labelResult.ok) {
    assert.match(
      labelResult.errors.join(" "),
      new RegExp(`label must not exceed ${DIAGRAM_LIMITS.maxNodeLabelCharacters}`),
    );
  }
});

test("accepts a valid 12-node flow with three grounded branches", () => {
  const result = validateGeneratedDiagram(validTwelveNodeDiagram(), ALLOWLIST);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.diagram.nodes.length, 12);
  assert.equal(result.diagram.edges.length, 13);
  assert.deepEqual(
    [...new Set(result.diagram.nodes.map((node) => node.group).filter(Boolean))],
    ["branch-a", "branch-b", "branch-c"],
  );
});

test("rejects isolated and duplicate-semantic nodes", () => {
  const isolated = validDiagram();
  isolated.nodes.push({
    id: "isolated",
    label: "Unconnected decision",
    description: "This node has no relationship to the decision flow.",
    category: "synthesis",
    stage: "other",
    order: 50,
    group: null,
    sourcePaths: [PAPER_ID],
    synthesis: true,
  });
  const isolatedResult = validateGeneratedDiagram(isolated, ALLOWLIST);
  assert.equal(isolatedResult.ok, false);
  if (!isolatedResult.ok) {
    assert.match(isolatedResult.errors.join(" "), /isolated/);
  }

  const duplicate = validDiagram();
  duplicate.nodes[1]!.label = "stored---PRINCIPLE";
  const duplicateResult = validateGeneratedDiagram(duplicate, ALLOWLIST);
  assert.equal(duplicateResult.ok, false);
  if (!duplicateResult.ok) {
    assert.match(duplicateResult.errors.join(" "), /duplicates the semantic label/);
  }
});

test("rejects reordered morphological near-duplicate labels", () => {
  const diagram = validDiagram();
  diagram.nodes[0]!.label = "Verify provenance";
  diagram.nodes[1]!.label = "Provenance verification";

  const result = validateGeneratedDiagram(diagram, ALLOWLIST);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.errors.join(" "), /near-duplicates the semantic label/);
  }
});

test("rejects deterministic weakly disconnected flow components", () => {
  const diagram = validDiagram();
  diagram.nodes.push(
    {
      id: "component-a",
      label: "Audit inputs",
      description: "A separate grounded audit step.",
      category: "evaluation",
      stage: "evaluation",
      order: 70,
      group: null,
      sourcePaths: [PAPER_ID],
      synthesis: false,
    },
    {
      id: "component-b",
      label: "Record findings",
      description: "A separate grounded reporting step.",
      category: "outcome",
      stage: "outcome",
      order: 80,
      group: null,
      sourcePaths: [PAPER_ID],
      synthesis: false,
    },
  );
  diagram.edges.push({
    source: "component-a",
    target: "component-b",
    label: "enables",
  });

  const result = validateGeneratedDiagram(diagram, ALLOWLIST);
  assert.equal(result.ok, false);
  if (result.ok) return;
  const disconnectedError = result.errors.find((error) =>
    error.includes("disconnected flow components"),
  );
  assert.ok(disconnectedError);

  const reordered: GeneratedDiagram = {
    ...diagram,
    nodes: [...diagram.nodes].reverse(),
    edges: [...diagram.edges].reverse(),
  };
  const reorderedResult = validateGeneratedDiagram(reordered, ALLOWLIST);
  assert.equal(reorderedResult.ok, false);
  if (!reorderedResult.ok) {
    assert.equal(
      reorderedResult.errors.find((error) =>
        error.includes("disconnected flow components"),
      ),
      disconnectedError,
    );
  }
});

test("rejects a diagram source path outside the retrieval allowlist", () => {
  const diagram = validDiagram();
  diagram.nodes[0]!.sourcePaths = ["papers/invented"];
  const result = validateGeneratedDiagram(diagram, ALLOWLIST);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.errors.join(" "), /allowlist/);
});

test("rejects an edge whose endpoint is missing", () => {
  const diagram = validDiagram();
  diagram.edges[0]!.target = "missing";
  const result = validateGeneratedDiagram(diagram, ALLOWLIST);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.errors.join(" "), /existing node/);
});

test("rejects duplicate node IDs", () => {
  const diagram = validDiagram();
  diagram.nodes[1]!.id = diagram.nodes[0]!.id;
  const result = validateGeneratedDiagram(diagram, ALLOWLIST);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.errors.join(" "), /duplicates the node ID/);
});

test("removes exact duplicate edges after validation", () => {
  const diagram = validDiagram();
  diagram.edges.push({ ...diagram.edges[0]! });
  const result = validateGeneratedDiagram(diagram, ALLOWLIST);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.diagram.edges.length, 1);
  assert.equal(result.warnings.length, 1);
});

test("enforces diagram node and edge bounds", () => {
  const tooManyNodes = validDiagram();
  tooManyNodes.nodes = Array.from(
    { length: DIAGRAM_LIMITS.maxNodes + 1 },
    (_, index) => ({
      id: `node-${index}`,
      label: `Node ${index}`,
      category: "concept",
      description: `Grounded node ${index}.`,
      stage: "other" as const,
      order: index,
      group: null,
      sourcePaths: [PAPER_ID],
      synthesis: false,
    }),
  );
  assert.equal(validateGeneratedDiagram(tooManyNodes, ALLOWLIST).ok, false);

  const tooManyEdges = validDiagram();
  tooManyEdges.edges = Array.from(
    { length: DIAGRAM_LIMITS.maxEdges + 1 },
    (_, index) => ({
      source: "stored",
      target: "proposal",
      label: `informs-${index}`,
    }),
  );
  assert.equal(validateGeneratedDiagram(tooManyEdges, ALLOWLIST).ok, false);
});

test("uses Responses Structured Outputs without tools or storage", async () => {
  const fake = clientWithOutputs([validDiagram()]);
  const result = await generateNativeOkfDiagram(generationOptions(fake.client));
  assert.ok(result.diagram);
  assert.equal(fake.requests.length, 1);

  const request = fake.requests[0] as {
    store?: unknown;
    tools?: unknown[];
    tool_choice?: unknown;
    text?: { format?: { type?: unknown; strict?: unknown } };
    instructions?: unknown;
  };
  assert.equal(request.store, false);
  assert.deepEqual(request.tools, []);
  assert.equal(request.tool_choice, "none");
  assert.equal(request.text?.format?.type, "json_schema");
  assert.equal(request.text?.format?.strict, true);
  assert.match(String(request.instructions), /compact decision-support flow/);
  assert.match(String(request.instructions), /7 to 12 nodes/);
  assert.match(String(request.instructions), /short canvas label/);
  assert.match(String(request.instructions), /one concise sentence/);
  assert.match(String(request.instructions), /same weakly connected flow/);
  assert.match(String(request.instructions), /no more than three major parallel branches/);
  assert.match(String(request.instructions), /Do not output coordinates/);
});

test("repairs invalid structured output once", async () => {
  const invalid = validDiagram();
  invalid.nodes[0]!.sourcePaths = ["papers/invented"];
  const fake = clientWithOutputs([invalid, validDiagram()]);
  const result = await generateNativeOkfDiagram(generationOptions(fake.client));
  assert.ok(result.diagram);
  assert.equal(fake.requests.length, 2);
  const repairRequest = fake.requests[1] as { input?: unknown };
  assert.match(String(repairRequest.input), /Validation errors/);
  assert.match(String(repairRequest.input), /allowlist/);
  assert.match(String(repairRequest.input), /Consolidate semantically overlapping/);
  assert.match(String(repairRequest.input), /preserve every relevant allowlisted sourcePath/);
});

test("makes only one repair attempt for malformed structured output", async () => {
  const fake = clientWithOutputs(["not-json", "still-not-json"]);
  const result = await generateNativeOkfDiagram(generationOptions(fake.client));
  assert.equal(result.diagram, undefined);
  assert.equal(fake.requests.length, 2);
  assert.match(result.warnings.join(" "), /two invalid structured responses/);
});
