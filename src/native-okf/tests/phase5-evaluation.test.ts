import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import {
  answerNativeOkfChat,
} from "../server/openai/chat.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import { validateAnswerCitations } from "../server/openai/citations.ts";
import { generateNativeOkfDiagram } from "../server/openai/diagram.ts";
import { validateGeneratedDiagram } from "../server/openai/diagram-validation.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import type { RetrievalResult } from "../server/retrieval-types.ts";
import {
  PHASE5_EVALUATION_CONCEPT_IDS,
  PHASE5_EVALUATION_SOURCE_CONTEXT,
  PHASE5_GROUNDED_MOCK_ANSWER,
  PHASE5_INVENTED_CITATION_MOCK_ANSWER,
  PHASE5_PROMPT_INJECTION_QUESTION,
  PHASE5_PROMPT_INJECTION_SAFE_MOCK_ANSWER,
  PHASE5_VALID_MOCK_DIAGRAM,
} from "./fixtures/phase5-evaluation-fixtures.ts";

const TEST_ENVIRONMENT: NativeOpenAiEnvironment = {
  apiKey: "phase5-mock-only",
  model: "mock-model",
  reasoningEffort: "low",
  moderationEnabled: false,
  maxOutputTokens: 800,
  diagramMaxOutputTokens: 4_096,
};

function completedResponse(outputText: string): Record<string, unknown> {
  return {
    id: "phase5-mock-response",
    object: "response",
    created_at: 0,
    model: TEST_ENVIRONMENT.model,
    output: [],
    output_text: outputText,
    status: "completed",
  };
}

function retrievalFixture(): RetrievalResult {
  const finalConcepts = PHASE5_EVALUATION_SOURCE_CONTEXT.sources.map(
    (source, index) => ({
      conceptId: source.conceptId,
      type: source.card.type,
      title: source.card.title,
      description: "Saved deterministic Phase 5 evidence.",
      path: `${source.conceptId}.md`,
      tags: ["phase-5-fixture"],
      headings: ["Evaluation evidence"],
      markdownBody: "Bounded native OKF fixture content.",
      selectedMetadata: {},
      score: 10 - index,
      expansionDepth: 0 as const,
      characterEstimate: 120,
    }),
  );

  return {
    normalizedQuestion: PHASE5_PROMPT_INJECTION_QUESTION,
    seedResults: [],
    expandedResults: [],
    finalConcepts,
    corpusOverview: {
      paperCount: 1,
      papers: [
        {
          conceptId: PHASE5_EVALUATION_CONCEPT_IDS[0],
          title: "Quality management in production",
          tags: [],
          linkedConceptCounts: {
            "design-feature": 1,
            "design-principle": 2,
          },
        },
      ],
    },
    warnings: [],
    confidence: 0.8,
    noMatch: false,
    debug: {
      limits: {
        lexicalSeedLimit: 8,
        firstHopLimit: 12,
        secondHopLimit: 6,
        maxConcepts: 20,
        maxContextCharacters: 35_000,
        maxGraphDepth: 2,
        includeIncoming: true,
        includeOutgoing: true,
      },
      meaningfulTokens: ["papers", "library"],
      searchDiagnostics: {
        indexedConceptCount: 241,
        candidateCount: finalConcepts.length,
        meaningfulTermCount: 2,
        meaningfulOverlapCount: 2,
        meaningfulOverlapRatio: 1,
        exactResultCount: 1,
        prefixOnlyResultCount: 0,
        fuzzyOnlyResultCount: 0,
        hasExactMatch: true,
        hasExactTitleMatch: false,
        hasExactPathMatch: false,
        hasPrefixMatch: false,
        hasFuzzyMatch: false,
        topScore: 10,
        secondScore: 9,
        topScoreSeparation: 10 / 9,
      },
      expansionPaths: [],
      droppedConcepts: [],
      secondHopUsed: false,
      secondHopReason: "not requested",
      candidateCount: finalConcepts.length,
    },
    contextCharacterEstimate: finalConcepts.length * 120,
  };
}

test("saved Phase 5 model output resolves only allowlisted citations", () => {
  const result = validateAnswerCitations(
    PHASE5_GROUNDED_MOCK_ANSWER,
    PHASE5_EVALUATION_SOURCE_CONTEXT,
  );

  assert.deepEqual(result.citedSourceIds, ["S1", "S2", "S3", "S4"]);
  assert.deepEqual(
    result.sources.map((source) => source.conceptId),
    PHASE5_EVALUATION_CONCEPT_IDS,
  );
  assert.deepEqual(result.unknownSourceIds, []);
  assert.equal(result.needsRepair, false);
});

test("invented source IDs in saved model output are removed", () => {
  const result = validateAnswerCitations(
    PHASE5_INVENTED_CITATION_MOCK_ANSWER,
    PHASE5_EVALUATION_SOURCE_CONTEXT,
  );

  assert.equal(result.answerMarkdown.includes("[[S99]]"), false);
  assert.deepEqual(result.unknownSourceIds, ["S99"]);
  assert.deepEqual(result.sources.map((source) => source.sourceId), ["S1"]);
});

test("prompt-injection evaluation remains grounded through a mocked Responses API", async () => {
  let responseCalls = 0;
  const requests: unknown[] = [];
  const client = {
    responses: {
      create: async (request: unknown) => {
        responseCalls += 1;
        requests.push(request);
        return completedResponse(PHASE5_PROMPT_INJECTION_SAFE_MOCK_ANSWER);
      },
    },
    moderations: {
      create: async () => {
        throw new Error("Moderation is disabled for this deterministic fixture.");
      },
    },
  } as unknown as NativeOpenAiClient;

  const result = await answerNativeOkfChat(
    { question: PHASE5_PROMPT_INJECTION_QUESTION },
    {
      retrieve: async () => retrievalFixture(),
      environment: TEST_ENVIRONMENT,
      client,
    },
  );

  assert.equal(responseCalls, 1);
  assert.equal(result.insufficientContext, false);
  assert.equal(result.answerMarkdown, PHASE5_PROMPT_INJECTION_SAFE_MOCK_ANSWER);
  assert.deepEqual(result.sources.map((source) => source.sourceId), ["S1"]);
  assert.equal(result.answerMarkdown.includes("[[S99]]"), false);

  const serializedRequest = JSON.stringify(requests[0]);
  assert.match(serializedRequest, /untrusted reference material/u);
  assert.match(serializedRequest, /Do not introduce outside facts/u);
  assert.match(serializedRequest, /OKF_SOURCE/u);
});

test("saved grounded diagram fixture passes source and endpoint validation", () => {
  const result = validateGeneratedDiagram(
    PHASE5_VALID_MOCK_DIAGRAM,
    PHASE5_EVALUATION_SOURCE_CONTEXT.allowedConceptIds,
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.diagram.nodes.length, 7);
    assert.ok(result.diagram.nodes.some((node) => node.synthesis));
    assert.ok(result.diagram.nodes.some((node) => !node.synthesis));
    assert.deepEqual(
      new Set(result.diagram.nodes.flatMap((node) => node.sourcePaths)),
      PHASE5_EVALUATION_SOURCE_CONTEXT.allowedConceptIds,
    );
  }
});

test("saved diagrams reject source paths outside retrieval and missing endpoints", () => {
  const inventedPath = structuredClone(PHASE5_VALID_MOCK_DIAGRAM);
  inventedPath.nodes[0]!.sourcePaths = ["papers/invented-outside-retrieval"];
  const pathResult = validateGeneratedDiagram(
    inventedPath,
    PHASE5_EVALUATION_SOURCE_CONTEXT.allowedConceptIds,
  );
  assert.equal(pathResult.ok, false);
  if (!pathResult.ok) {
    assert.ok(pathResult.errors.some((error) => error.includes("allowlist")));
  }

  const missingEndpoint = structuredClone(PHASE5_VALID_MOCK_DIAGRAM);
  missingEndpoint.edges[0]!.target = "missing-node";
  const endpointResult = validateGeneratedDiagram(
    missingEndpoint,
    PHASE5_EVALUATION_SOURCE_CONTEXT.allowedConceptIds,
  );
  assert.equal(endpointResult.ok, false);
  if (!endpointResult.ok) {
    assert.ok(
      endpointResult.errors.some((error) => error.includes("existing node")),
    );
  }
});

test("malformed saved structured output receives exactly one mocked repair attempt", async () => {
  let responseCalls = 0;
  const client = {
    responses: {
      create: async () => {
        responseCalls += 1;
        return completedResponse("{malformed saved diagram fixture");
      },
    },
  } as unknown as NativeOpenAiClient;

  const result = await generateNativeOkfDiagram({
    client,
    environment: TEST_ENVIRONMENT,
    context: PHASE5_EVALUATION_SOURCE_CONTEXT,
    question: "Generate a grounded evaluation flow.",
    answerMarkdown: PHASE5_GROUNDED_MOCK_ANSWER,
  });

  assert.equal(responseCalls, 2);
  assert.equal(result.diagram, undefined);
  assert.match(result.warnings[0] ?? "", /after two invalid structured responses/u);
});
