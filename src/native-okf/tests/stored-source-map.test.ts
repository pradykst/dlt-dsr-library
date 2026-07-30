import "server-only";

import assert from "node:assert/strict";
import test from "node:test";
import { answerNativeOkfChat } from "../server/openai/chat.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";

import { buildGroundedStoredSourceMap } from "../server/openai/stored-source-map.ts";
import { retrieveOkfContext } from "../server/retrieval.ts";

test("stored source fallback uses only allowlisted connected native concepts", async () => {
  const retrieval = await retrieveOkfContext(
    "What design features implement source-to-sink certification?",
  );
  const diagram = await buildGroundedStoredSourceMap(retrieval);
  assert.ok(diagram);
  assert.equal(diagram.title, "Grounded source map");
  assert.ok(diagram.nodes.length >= 2);
  assert.ok(diagram.edges.length >= 1);
  assert.ok(diagram.nodes.every((node) => node.synthesis === false));

  const allowlist = new Set(
    retrieval.finalConcepts.map((concept) => concept.conceptId),
  );
  const nodeIds = new Set(diagram.nodes.map((node) => node.id));
  for (const node of diagram.nodes) {
    assert.ok(node.sourcePaths.length > 0);
    assert.ok(node.sourcePaths.every((path) => allowlist.has(path)));
  }
  for (const edge of diagram.edges) {
    assert.ok(nodeIds.has(edge.source));
    assert.ok(nodeIds.has(edge.target));
  }

  const sourcePaths = new Set(
    diagram.nodes.flatMap((node) => node.sourcePaths),
  );
  assert.ok(
    sourcePaths.has("design-knowledge/blockchain-iot-sensor-data-dp1"),
  );
  assert.ok(
    [
      "design-knowledge/blockchain-iot-sensor-data-df1",
      "design-knowledge/blockchain-iot-sensor-data-df3",
      "design-knowledge/blockchain-iot-sensor-data-df6",
    ].some((id) => sourcePaths.has(id)),
  );
});

test("no connected retrieved native subgraph preserves text-only fallback", async () => {
  const retrieval = await retrieveOkfContext(
    "What design features implement source-to-sink certification?",
  );
  const paperOnly = {
    ...retrieval,
    finalConcepts: retrieval.finalConcepts.filter(
      (concept) => concept.type === "paper",
    ).slice(0, 1),
  };
  const diagram = await buildGroundedStoredSourceMap(paperOnly);
  assert.equal(diagram, undefined);
});


test("chat returns the grounded source map after synthesized diagram failure", async () => {
  const environment: NativeOpenAiEnvironment = {
    apiKey: "mock-only",
    model: "mock-model",
    reasoningEffort: "low",
    moderationEnabled: false,
    maxOutputTokens: 500,
    diagramMaxOutputTokens: 500,
  };
  let responseCalls = 0;
  const client = {
    responses: {
      create: async () => {
        responseCalls += 1;
        return {
          id: "mock-response",
          object: "response",
          created_at: 0,
          model: "mock-model",
          output: [],
          output_text: "The retrieved design knowledge identifies stored implementation relationships [[S2]].",
          status: "completed",
        };
      },
    },
  } as unknown as NativeOpenAiClient;

  const result = await answerNativeOkfChat(
    {
      question: "Generate a flow showing what design features implement source-to-sink certification.",
      includeDiagram: true,
    },
    {
      environment,
      client,
      generateDiagram: async () => ({ warnings: ["Mocked structured diagram failure."] }),
    },
  );

  assert.equal(responseCalls, 1);
  assert.equal(result.diagram?.title, "Grounded source map");
  assert.ok(result.diagram?.nodes.every((node) => !node.synthesis));
  assert.ok(result.warnings?.includes(
    "The synthesized decision-support diagram was unavailable, so the stored source relationships are shown instead.",
  ));
});

