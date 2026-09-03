import "server-only";

import assert from "node:assert/strict";
import test from "node:test";
import { answerNativeOkfChat } from "../server/openai/chat.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import { getOkfBundle } from "../server/cache.ts";
import { projectSemanticLink } from "../server/paper-design-map.ts";

import { buildGroundedStoredSourceMap } from "../server/openai/stored-source-map.ts";
import { retrieveOkfContext } from "../server/retrieval.ts";

test("stored source fallback uses retrieved concepts plus exact canonical neighbors", async () => {
  const retrieval = await retrieveOkfContext(
    "What design features implement source-to-sink certification?",
  );
  const diagram = await buildGroundedStoredSourceMap(retrieval);
  assert.ok(diagram);
  assert.equal(diagram.title, "Stored source map");
  assert.ok(diagram.nodes.length >= 2);
  assert.ok(diagram.edges.length >= 1);
  assert.ok(diagram.nodes.every((node) => node.synthesis === false));

  const bundle = await getOkfBundle();
  const nodeIds = new Set(diagram.nodes.map((node) => node.id));
  for (const node of diagram.nodes) {
    assert.ok(node.sourcePaths.length > 0);
    assert.ok(node.sourcePaths.every((path) => bundle.conceptsById.has(path)));
  }
  for (const edge of diagram.edges) {
    assert.ok(nodeIds.has(edge.source));
    assert.ok(nodeIds.has(edge.target));
  }

  const sourcePaths = new Set(
    diagram.nodes.flatMap((node) => node.sourcePaths),
  );
  const retrievedIds = new Set(retrieval.finalConcepts.map((item) => item.conceptId));
  const canonicalNeighborIds = new Set<string>();
  for (const conceptId of retrievedIds) {
    for (const link of [
      ...(bundle.outgoing.get(conceptId) ?? []),
      ...(bundle.incoming.get(conceptId) ?? []),
    ]) {
      if (!link.targetId || !projectSemanticLink(link, bundle)) continue;
      const candidate = link.sourceId === conceptId ? link.targetId : link.sourceId;
      const candidateConcept = bundle.conceptsById.get(candidate);
      if (candidateConcept && candidateConcept.type !== "paper" && candidateConcept.type !== "reference") {
        canonicalNeighborIds.add(candidate);
      }
    }
  }
  assert.ok([...sourcePaths].some((id) => retrievedIds.has(id)));
  assert.ok(
    [...sourcePaths].every(
      (id) => retrievedIds.has(id) || canonicalNeighborIds.has(id),
    ),
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


test("a recoverable synthesis failure with connected stored evidence opens a follow-up, never an unvalidated flow", async () => {
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

  assert.equal(responseCalls, 0);
  assert.equal(result.kind, "clarification");
  assert.equal(result.presentationMode, "clarification");
  assert.equal(result.diagram, undefined);
  assert.equal(result.diagramMode, null);
  assert.equal(result.diagramStatus, null);
  assert.equal(result.diagnosticCode, undefined);
  assert.equal(result.clarification?.kind, "synthesis-constraint");
  assert.ok(/\?\s*$/u.test(result.clarification?.question.trim() ?? ""));
  assert.doesNotMatch(result.answerMarkdown, /synthesized flow could not be produced/iu);
  assert.deepEqual(result.sources, []);
  assert.equal(result.warnings, undefined);
});


test("a recoverable synthesis failure resumes the same design problem on the next turn", async () => {
  const base = await retrieveOkfContext("fragmented identity continuity design");
  const retrieval = {
    ...base,
    noMatch: false,
    finalConcepts: [
      {
        conceptId: "fixtures/unconnected-requirement",
        type: "design-requirement",
        title: "Fixture continuity requirement",
        description: "A current-turn grounding record with no stored fixture relation.",
        path: "fixtures/unconnected-requirement.md",
        tags: ["fixture"],
        headings: ["Summary"],
        markdownBody: "Retain accountable continuity across channels.",
        selectedMetadata: {},
        score: 10,
        expansionDepth: 0 as const,
        characterEstimate: 120,
      },
      {
        conceptId: "fixtures/unconnected-principle",
        type: "design-principle",
        title: "Fixture continuity principle",
        description: "A second current-turn grounding record without a stored fixture relation.",
        path: "fixtures/unconnected-principle.md",
        tags: ["fixture"],
        headings: ["Summary"],
        markdownBody: "Keep review lineage verifiable across channels.",
        selectedMetadata: {},
        score: 9,
        expansionDepth: 0 as const,
        characterEstimate: 120,
      },
    ],
    contextCharacterEstimate: 240,
  };
  const environment: NativeOpenAiEnvironment = {
    apiKey: "mock-only",
    model: "mock-model",
    reasoningEffort: "low",
    moderationEnabled: false,
    maxOutputTokens: 500,
    diagramMaxOutputTokens: 500,
  };
  const client = {
    responses: {
      create: async () => {
        throw new Error("No model response should be requested by the injected failure.");
      },
    },
  } as unknown as NativeOpenAiClient;

  const originalQuestion =
    "Generate a design flow for fragmented product identity and lost review continuity across e-commerce marketplaces.";
  const result = await answerNativeOkfChat(
    { question: originalQuestion, includeDiagram: true },
    {
      retrieve: async () => retrieval,
      environment,
      client,
      generateDiagram: async () => ({
        warnings: [],
        diagnosticCode: "synthesis-plan-repair-failed",
      }),
    },
  );

  assert.equal(result.kind, "clarification");
  assert.equal(result.diagram, undefined);
  assert.equal(result.diagramMode, null);
  assert.equal(result.diagramStatus, null);
  assert.equal(result.clarification?.kind, "synthesis-constraint");
  // The grounded follow-up is built from the current-turn retrieved concepts.
  assert.match(
    result.clarification?.question ?? "",
    /continuity requirement|continuity principle/iu,
  );
  assert.equal(result.conversationState?.synthesisClarificationRounds, 1);

  // A short constraint answer, with the original problem still in history,
  // resumes the same synthesis attempt without the user restating it.
  let retriedProblem = "";
  const resumed = await answerNativeOkfChat(
    {
      question: "keep the seller-specific offers separate",
      history: [
        { role: "user", content: originalQuestion },
        { role: "assistant", content: result.clarification?.question ?? "" },
      ],
      conversationState: result.conversationState,
    },
    {
      retrieve: async () => retrieval,
      environment,
      client,
      generateDiagram: async (input) => {
        retriedProblem = input.synthesisProblem ?? input.question;
        return { warnings: [], diagnosticCode: "synthesis-plan-repair-failed" };
      },
    },
  );

  assert.match(retriedProblem, /fragmented product identity/iu);
  assert.equal(resumed.kind, "clarification");
  assert.equal(resumed.clarification?.kind, "synthesis-constraint");
  assert.equal(resumed.conversationState?.synthesisClarificationRounds, 2);
  assert.ok(
    resumed.conversationState?.lastSynthesisProblem?.problemStatement.includes(
      "fragmented product identity",
    ),
  );
});
