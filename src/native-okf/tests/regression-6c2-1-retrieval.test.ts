import "server-only";

import assert from "node:assert/strict";
import test from "node:test";
import type { Response } from "openai/resources/responses/responses";

import { getOkfBundle } from "../server/cache.ts";
import {
  assembleNativeOkfContextualRetrieval,
  prepareNativeOkfChatRequest,
} from "../server/conversation.ts";
import {
  associatedConceptsForPaper,
  buildPaperDesignMap,
  sourcePaperMetadataMatches,
} from "../server/paper-design-map.ts";
import {
  answerNativeOkfChat,
  validateNativeOkfChatRequest,
} from "../server/openai/chat.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import { buildNativeOkfGroundedContext } from "../server/openai/context.ts";
import { validateAnswerCitations } from "../server/openai/citations.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import {
  NATIVE_OKF_INTERNAL_SOURCE_REQUEST_ERROR,
  validateNativeOkfAnswerPolicy,
} from "../server/openai/answer-policy.ts";
import { buildStoredPaperDesignMap } from "../server/openai/stored-source-map.ts";
import { retrieveOkfContext } from "../server/retrieval.ts";
import { DEFAULT_RETRIEVAL_LIMITS } from "../server/retrieval-config.ts";
import { inferStoredPaperMapIntent } from "../shared/diagram-intent.ts";
import type { NativeOkfConversationState } from "../shared/chat-types.ts";

const PAPER_SLUG = "blockchain-iot-sensor-data";
const PAPER_ID = `papers/${PAPER_SLUG}`;
const PRINCIPLE_IDS = [1, 2, 3, 4].map(
  (number) => `design-knowledge/${PAPER_SLUG}-dp${number}`,
);
const REQUIREMENT_IDS = [1, 2, 3, 4].map(
  (number) => `design-knowledge/${PAPER_SLUG}-dr${number}`,
);
const FEATURE_IDS = Array.from(
  { length: 9 },
  (_, index) => `design-knowledge/${PAPER_SLUG}-df${index + 1}`,
);
const ALL_DESIGN_IDS = [
  ...REQUIREMENT_IDS,
  ...PRINCIPLE_IDS,
  ...FEATURE_IDS,
];
const PRINCIPLES_QUESTION =
  "What design principles are proposed in Blockchain for the IoT?";
const MAP_QUESTION =
  "Show the requirements, principles and features from Blockchain for the IoT.";

const ENVIRONMENT: NativeOpenAiEnvironment = {
  apiKey: "mock-only-not-a-live-key",
  model: "mock-model",
  reasoningEffort: "low",
  moderationEnabled: false,
  maxOutputTokens: 800,
  diagramMaxOutputTokens: 4_096,
};

function responseClient(outputs: readonly string[]): NativeOpenAiClient {
  let cursor = 0;
  return {
    responses: {
      create: async () => {
        const output = outputs[cursor++];
        if (output === undefined) throw new Error("Unexpected model call.");
        return {
          id: `mock-response-${cursor}`,
          object: "response",
          created_at: 0,
          model: "mock-model",
          output: [],
          output_text: output,
          status: "completed",
        } as unknown as Response;
      },
    },
    moderations: {
      create: async () => ({ results: [{ flagged: false }] }) as never,
    },
  };
}

async function resolvedRetrieval(
  question: string,
  request: Record<string, unknown> = {},
) {
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({ question, ...request }),
  );
  const lexical = await retrieveOkfContext(prepared.retrievalQuestion);
  const retrieval = await assembleNativeOkfContextualRetrieval(
    prepared,
    lexical,
  );
  return { prepared, retrieval };
}

const principlesFixture = resolvedRetrieval(PRINCIPLES_QUESTION);
const mapFixture = resolvedRetrieval(MAP_QUESTION);

function staleConversationState(): NativeOkfConversationState {
  return {
    version: 1,
    scope: { type: "corpus" },
    activePaperSlugs: ["green-bond-reporting-dp"],
    activeConceptIds: ["design-knowledge/green-bond-reporting-dp"],
    activeSourceIds: ["design-knowledge/green-bond-reporting-dp"],
    lastIntent: "answer",
    lastDiagramRequested: false,
    pendingClarification: null,
    synthesisDraft: null,
  };
}

test("1 fresh Blockchain principles retrieval includes DP1-DP4", async () => {
  const { retrieval } = await principlesFixture;
  const ids = retrieval.finalConcepts.map((concept) => concept.conceptId);
  assert.deepEqual(ids.slice(0, 4), PRINCIPLE_IDS);
});

test("2 DP1-DP4 are present in final model source context", async () => {
  const { retrieval } = await principlesFixture;
  const context = buildNativeOkfGroundedContext(retrieval, PRINCIPLES_QUESTION);
  assert.ok(PRINCIPLE_IDS.every((id) => context.allowedConceptIds.has(id)));
  assert.ok(PRINCIPLE_IDS.every((id) => context.prompt.includes(id)));
});

test("3 DP1-DP4 are present in the citation allowlist", async () => {
  const { retrieval } = await principlesFixture;
  const context = buildNativeOkfGroundedContext(retrieval, PRINCIPLES_QUESTION);
  const sources = context.sources.slice(0, 4);
  assert.deepEqual(sources.map((source) => source.conceptId), PRINCIPLE_IDS);
  assert.deepEqual(sources.map((source) => source.sourceId), ["S1", "S2", "S3", "S4"]);
});

test("4 bounded paper metadata cannot crowd out requested principles", async () => {
  const { retrieval } = await principlesFixture;
  const ids = retrieval.finalConcepts.map((concept) => concept.conceptId);
  assert.ok(PRINCIPLE_IDS.every((id) => ids.includes(id)));
  assert.equal(ids.includes(PAPER_ID), false);
  assert.deepEqual(ids, PRINCIPLE_IDS);
  assert.ok(
    retrieval.contextCharacterEstimate <=
      DEFAULT_RETRIEVAL_LIMITS.maxContextCharacters,
  );
});

test("5 requested records are ordered before broad context", async () => {
  const { retrieval } = await principlesFixture;
  const ids = retrieval.finalConcepts.map((concept) => concept.conceptId);
  assert.deepEqual(ids.slice(0, PRINCIPLE_IDS.length), PRINCIPLE_IDS);
  const firstUnassociated = ids.findIndex(
    (id) => id !== PAPER_ID && !ALL_DESIGN_IDS.includes(id),
  );
  assert.ok(firstUnassociated === -1 || firstUnassociated > ids.indexOf(PAPER_ID));
});

test("6 lower-priority context is dropped before requested records", async () => {
  const { retrieval } = await principlesFixture;
  const dropped = retrieval.debug.droppedConcepts;
  assert.ok(PRINCIPLE_IDS.every((id) => !dropped.some((item) => item.conceptId === id)));
  const contextLimited = dropped.some((item) => item.reason === "context-limit");
  assert.equal(
    retrieval.warnings.includes(
      "One or more concepts were omitted because the context limit was exhausted.",
    ),
    contextLimited,
  );
  assert.ok(
    contextLimited ||
      retrieval.contextCharacterEstimate <=
        DEFAULT_RETRIEVAL_LIMITS.maxContextCharacters,
  );
});

test("7 explicit paper filtering retains associated DR, DP, and DF records", async () => {
  const { retrieval } = await mapFixture;
  const ids = new Set(retrieval.finalConcepts.map((concept) => concept.conceptId));
  assert.ok(ALL_DESIGN_IDS.every((id) => ids.has(id)));
  assert.ok(retrieval.finalConcepts.every((concept) =>
    concept.conceptId === PAPER_ID || ALL_DESIGN_IDS.includes(concept.conceptId)
  ));
});

test("8 source_paper metadata associates all detailed paper records", async () => {
  const bundle = await getOkfBundle();
  const paper = bundle.conceptsById.get(PAPER_ID);
  assert.ok(paper);
  assert.ok(ALL_DESIGN_IDS.every((id) => {
    const concept = bundle.conceptsById.get(id);
    return concept !== undefined && sourcePaperMetadataMatches(concept, paper);
  }));
});

test("9 validated incoming source-paper backlinks associate detailed records", async () => {
  const bundle = await getOkfBundle();
  const paper = bundle.conceptsById.get(PAPER_ID);
  assert.ok(paper);
  const incomingIds = new Set(
    (bundle.incoming.get(PAPER_ID) ?? [])
      .filter((link) => /^source[\s-]*paper$/iu.test(link.relationHint?.trim() ?? ""))
      .map((link) => link.sourceId),
  );
  assert.ok(ALL_DESIGN_IDS.every((id) => incomingIds.has(id)));
  assert.equal(associatedConceptsForPaper(bundle, paper).length, 17);
});

test("10 category words and full current question remain in contextual retrieval", async () => {
  const { prepared } = await principlesFixture;
  assert.ok(prepared.retrievalQuestion.startsWith(PRINCIPLES_QUESTION));
  assert.match(prepared.retrievalQuestion, /design principles/iu);
  assert.match(prepared.retrievalQuestion, /Blockchain for the IoT/iu);
  assert.deepEqual(prepared.requestedConceptKinds, ["principle"]);
});

test("11 first-turn retrieval requires no conversation state", async () => {
  const { prepared, retrieval } = await principlesFixture;
  assert.equal(prepared.request.conversationState, undefined);
  assert.deepEqual(prepared.explicitPaperSlugs, [PAPER_SLUG]);
  assert.equal(retrieval.noMatch, false);
});

test("12 stale active source IDs cannot suppress a newly named paper", async () => {
  const { prepared, retrieval } = await resolvedRetrieval(
    PRINCIPLES_QUESTION,
    { conversationState: staleConversationState() },
  );
  assert.deepEqual(prepared.focusedPaperSlugs, [PAPER_SLUG]);
  assert.deepEqual(
    retrieval.finalConcepts.slice(0, 4).map((concept) => concept.conceptId),
    PRINCIPLE_IDS,
  );
});

test("13 explicit new paper context replaces stale unrelated paper focus", async () => {
  const { prepared } = await resolvedRetrieval(
    MAP_QUESTION,
    { conversationState: staleConversationState() },
  );
  assert.deepEqual(prepared.explicitPaperSlugs, [PAPER_SLUG]);
  assert.deepEqual(prepared.focusedPaperSlugs, [PAPER_SLUG]);
  assert.ok(!prepared.retrievalQuestion.includes("green-bond-reporting-dp"));
});

test("14 a DP1-DP4 answer passes strict current-turn citation validation", async () => {
  const { retrieval } = await principlesFixture;
  const context = buildNativeOkfGroundedContext(retrieval, PRINCIPLES_QUESTION);
  const result = validateAnswerCitations(
    "DP1 [[S1]], DP2 [[S2]], DP3 [[S3]], and DP4 [[S4]].",
    context,
  );
  assert.equal(result.needsRepair, false);
  assert.deepEqual(result.unknownSourceIds, []);
  assert.deepEqual(result.sources.map((source) => source.conceptId), PRINCIPLE_IDS);
});

test("15 asking the user for internal source text violates answer policy", () => {
  const result = validateNativeOkfAnswerPolicy(
    "Please provide the retrieved source text so I can identify the principles.",
    "normal",
  );
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes(NATIVE_OKF_INTERNAL_SOURCE_REQUEST_ERROR));
});

test("16 a second invalid internal-source request is withheld safely", async () => {
  const { prepared, retrieval } = await principlesFixture;
  const invalid =
    "Please provide the retrieved source text so I can identify the principles [[S1]].";
  const result = await answerNativeOkfChat(
    { question: PRINCIPLES_QUESTION },
    {
      prepared,
      retrieve: async () => retrieval,
      environment: ENVIRONMENT,
      client: responseClient([invalid, invalid]),
    },
  );
  assert.equal(
    result.answerMarkdown,
    "The relevant library records could not be assembled for this request.",
  );
  assert.ok(!result.answerMarkdown.includes("provide"));
  assert.deepEqual(result.sources.map((source) => source.conceptId), [PRINCIPLE_IDS[0]]);
});

test("17 explicit stored-map language resolves stored-diagram mode", async () => {
  const { prepared } = await mapFixture;
  assert.equal(prepared.includeDiagram, true);
  assert.equal(prepared.diagramMode, "stored");
  assert.equal(prepared.preferDeterministicPaperMap, true);
});

test("18 deterministic Blockchain paper map has exactly 17 stored nodes", async () => {
  const diagram = await buildStoredPaperDesignMap(PAPER_ID);
  assert.ok(diagram);
  assert.equal(diagram.nodes.length, 17);
  assert.ok(diagram.nodes.every((node) => node.provenance === "stored"));
});

test("19 deterministic Blockchain paper map has exactly 14 canonical edges", async () => {
  const diagram = await buildStoredPaperDesignMap(PAPER_ID);
  assert.ok(diagram);
  assert.equal(diagram.edges.length, 14);
  assert.ok(diagram.edges.every((edge) => edge.provenance === "stored"));
});

test("20 deterministic map contains 4 requirements, 4 principles, and 9 features", async () => {
  const diagram = await buildStoredPaperDesignMap(PAPER_ID);
  assert.ok(diagram);
  assert.equal(diagram.nodes.filter((node) => node.stage === "design-requirement").length, 4);
  assert.equal(diagram.nodes.filter((node) => node.stage === "design-principle").length, 4);
  assert.equal(diagram.nodes.filter((node) => node.stage === "design-feature").length, 9);
});

test("21 deterministic stored map contains no synthesized nodes", async () => {
  const diagram = await buildStoredPaperDesignMap(PAPER_ID);
  assert.ok(diagram);
  assert.ok(diagram.nodes.every((node) => node.synthesis === false));
  assert.ok(diagram.nodes.every((node) => node.synthesisRationale === null));
});

test("22 deterministic stored map contains no synthesized edges", async () => {
  const diagram = await buildStoredPaperDesignMap(PAPER_ID);
  assert.ok(diagram);
  assert.ok(diagram.edges.every((edge) => edge.provenance === "stored"));
});

test("23 chat map is the existing deterministic semantic-map projection", async () => {
  const [diagram, semanticMap] = await Promise.all([
    buildStoredPaperDesignMap(PAPER_ID),
    buildPaperDesignMap(PAPER_SLUG),
  ]);
  assert.ok(diagram);
  assert.ok(semanticMap);
  assert.deepEqual(
    diagram.nodes.map((node) => node.id),
    semanticMap.nodes.map((node) => node.id),
  );
  assert.deepEqual(
    diagram.edges.map((edge) => [edge.source, edge.target, edge.label]),
    semanticMap.edges.map((edge) => [edge.sourceId, edge.targetId, edge.label]),
  );
});

test("24 generic explicit paper-map phrases enable automatic intent", () => {
  for (const question of [
    "Show the requirements, principles and features from this paper.",
    "Visualize the paper's design map.",
    "Show the stored relations.",
    "Generate the paper map.",
  ]) {
    assert.equal(inferStoredPaperMapIntent(question), true, question);
  }
});

test("25 an explicit manual uncheck suppresses the stored diagram", async () => {
  const { prepared } = await resolvedRetrieval(
    MAP_QUESTION,
    { includeDiagram: false },
  );
  assert.equal(prepared.includeDiagram, false);
  assert.equal(prepared.diagramMode, null);
  assert.equal(prepared.preferDeterministicPaperMap, false);
});

test("26 stored map remains structured and visible answer remains prose-only", async () => {
  const { prepared, retrieval } = await mapFixture;
  const result = await answerNativeOkfChat(
    { question: MAP_QUESTION },
    {
      prepared,
      retrieve: async () => retrieval,
      environment: ENVIRONMENT,
      client: responseClient([
        "The paper stores four requirements, four principles, and nine implementation features [[S1]].",
      ]),
    },
  );
  assert.equal(result.diagram?.nodes.length, 17);
  assert.equal(validateNativeOkfAnswerPolicy(result.answerMarkdown, "normal").valid, true);
  assert.doesNotMatch(result.answerMarkdown, /```|flowchart|digraph|-->|\u2500/iu);
});
