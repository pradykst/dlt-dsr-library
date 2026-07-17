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
import type { GeneratedDiagram } from "../shared/chat-types.ts";

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
        sourcePaths: [PRINCIPLE_ID],
        synthesis: false,
      },
      {
        id: "proposal",
        label: "Proposed combination",
        category: "synthesis",
        sourcePaths: [PAPER_ID, PRINCIPLE_ID],
        synthesis: true,
      },
    ],
    edges: [{ source: "stored", target: "proposal", label: "informs" }],
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
  };
  assert.equal(request.store, false);
  assert.deepEqual(request.tools, []);
  assert.equal(request.tool_choice, "none");
  assert.equal(request.text?.format?.type, "json_schema");
  assert.equal(request.text?.format?.strict, true);
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
});

test("makes only one repair attempt for malformed structured output", async () => {
  const fake = clientWithOutputs(["not-json", "still-not-json"]);
  const result = await generateNativeOkfDiagram(generationOptions(fake.client));
  assert.equal(result.diagram, undefined);
  assert.equal(fake.requests.length, 2);
  assert.match(result.warnings.join(" "), /two invalid structured responses/);
});
