import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import type { Response } from "openai/resources/responses/responses";

import {
  completedConversationState,
  prepareNativeOkfChatRequest,
  validateNativeOkfConversationState,
  type NativeOkfConversationCatalog,
} from "../server/conversation.ts";
import {
  answerNativeOkfChat,
  validateNativeOkfChatRequest,
} from "../server/openai/chat.ts";
import { validateNativeOkfAnswerPolicy } from "../server/openai/answer-policy.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import type { RetrievalResult } from "../server/retrieval-types.ts";
import {
  createInitialNativeOkfConversationState,
  type NativeOkfChatResponse,
  type NativeOkfConversationState,
} from "../shared/chat-types.ts";

const CATALOG: NativeOkfConversationCatalog = {
  papers: [
    {
      slug: "peer-review-token-incentives",
      conceptId: "papers/peer-review-token-incentives",
      title:
        "Blockchain-based token system for incentivizing peer review: A design science approach",
    },
    {
      slug: "blockchain-for-the-iot",
      conceptId: "papers/blockchain-for-the-iot",
      title:
        "Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data",
    },
    {
      slug: "other-paper",
      conceptId: "papers/other-paper",
      title: "Other Paper",
    },
  ],
  concepts: [
    {
      conceptId: "papers/peer-review-token-incentives",
      title:
        "Blockchain-based token system for incentivizing peer review",
      type: "paper",
      paperSlug: "peer-review-token-incentives",
    },
    {
      conceptId: "papers/blockchain-for-the-iot",
      title: "Blockchain for the IoT",
      type: "paper",
      paperSlug: "blockchain-for-the-iot",
    },
    {
      conceptId: "papers/other-paper",
      title: "Other Paper",
      type: "paper",
      paperSlug: "other-paper",
    },
    {
      conceptId: "design-knowledge/iot-dp1",
      title: "Owner-controlled disclosure",
      type: "design-principle",
      paperSlug: "blockchain-for-the-iot",
    },
    {
      conceptId: "design-knowledge/iot-dp2",
      title: "Privacy-preserving storage",
      type: "design-principle",
      paperSlug: "blockchain-for-the-iot",
    },
    {
      conceptId: "design-knowledge/iot-df1",
      title: "External encrypted storage",
      type: "design-feature",
      paperSlug: "blockchain-for-the-iot",
    },
    {
      conceptId: "design-knowledge/peer-dp1",
      title: "Flexible reviewer incentives",
      type: "design-principle",
      paperSlug: "peer-review-token-incentives",
    },
  ],
};

const ENVIRONMENT: NativeOpenAiEnvironment = {
  apiKey: "mock-only",
  model: "mock-model",
  reasoningEffort: "medium",
  moderationEnabled: false,
  maxOutputTokens: 800,
  diagramMaxOutputTokens: 4_096,
};

function finalConcept(
  conceptId: string,
  type: string,
  title: string,
  sourcePaper?: string,
) {
  return {
    conceptId,
    type,
    title,
    description: `Grounded description for ${title}.`,
    path: `${conceptId}.md`,
    tags: ["fixture"],
    ...(sourcePaper ? { sourcePaper } : {}),
    headings: ["Summary"],
    markdownBody: `Grounded native OKF evidence for ${title}.`,
    selectedMetadata: {},
    score: 10,
    expansionDepth: 0 as const,
    characterEstimate: 120,
  };
}

function retrievalFixture(): RetrievalResult {
  const finalConcepts = [
    finalConcept(
      "papers/blockchain-for-the-iot",
      "paper",
      "Blockchain for the IoT",
    ),
    finalConcept(
      "design-knowledge/iot-dp1",
      "design-principle",
      "Owner-controlled disclosure",
      "papers/blockchain-for-the-iot",
    ),
    finalConcept(
      "design-knowledge/iot-dp2",
      "design-principle",
      "Privacy-preserving storage",
      "papers/blockchain-for-the-iot",
    ),
    finalConcept(
      "design-knowledge/iot-df1",
      "design-feature",
      "External encrypted storage",
      "papers/blockchain-for-the-iot",
    ),
  ];
  return {
    normalizedQuestion: "fixture",
    seedResults: [],
    expandedResults: [],
    finalConcepts,
    corpusOverview: {
      paperCount: 3,
      papers: CATALOG.papers.map((paper) => ({
        conceptId: paper.conceptId,
        title: paper.title,
        tags: [],
        linkedConceptCounts: {},
      })),
    },
    warnings: [],
    confidence: 0.9,
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
      meaningfulTokens: ["fixture"],
      searchDiagnostics: {
        indexedConceptCount: 7,
        candidateCount: 4,
        meaningfulTermCount: 1,
        meaningfulOverlapCount: 1,
        meaningfulOverlapRatio: 1,
        exactResultCount: 1,
        prefixOnlyResultCount: 0,
        fuzzyOnlyResultCount: 0,
        hasExactMatch: true,
        hasExactTitleMatch: true,
        hasExactPathMatch: false,
        hasPrefixMatch: false,
        hasFuzzyMatch: false,
        topScore: 10,
        secondScore: 8,
        topScoreSeparation: 1.25,
      },
      expansionPaths: [],
      droppedConcepts: [],
      secondHopUsed: false,
      secondHopReason: "not needed",
      candidateCount: 4,
    },
    contextCharacterEstimate: 480,
  };
}

function completedResponse(outputText: string): Response {
  return {
    id: "mock-response",
    object: "response",
    created_at: 0,
    model: "mock-model",
    output: [],
    output_text: outputText,
    status: "completed",
  } as unknown as Response;
}

function responseClient(
  outputs: readonly string[],
  requests: Array<Record<string, unknown>> = [],
): NativeOpenAiClient {
  let cursor = 0;
  return {
    responses: {
      create: async (request) => {
        requests.push(request as unknown as Record<string, unknown>);
        const output = outputs[cursor];
        cursor += 1;
        if (output === undefined) {
          throw new Error("Unexpected extra model response.");
        }
        return completedResponse(output);
      },
    },
    moderations: {
      create: async () => ({ results: [{ flagged: false }] }) as never,
    },
  };
}

function establishedState(): NativeOkfConversationState {
  return {
    version: 1,
    activePaperSlugs: ["blockchain-for-the-iot"],
    activeConceptIds: [
      "design-knowledge/iot-dp1",
      "design-knowledge/iot-dp2",
    ],
    activeSourceIds: ["design-knowledge/iot-dp1"],
    lastIntent: "answer",
    lastDiagramRequested: false,
    pendingClarification: null,
  };
}

test("a paper question establishes validated paper and principle focus", async () => {
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question:
        "What design principles are proposed in Blockchain for the IoT?",
    }),
    CATALOG,
  );
  const state = completedConversationState(
    prepared,
    retrievalFixture(),
    [],
  );

  assert.deepEqual(state.activePaperSlugs, [
    "blockchain-for-the-iot",
  ]);
  assert.deepEqual(state.activeConceptIds, [
    "design-knowledge/iot-dp1",
    "design-knowledge/iot-dp2",
  ]);
});

test("the first principle follow-up uses validated focus in fresh retrieval", async () => {
  const queries: string[] = [];
  const result = await answerNativeOkfChat(
    {
      question: "Which features implement the first principle?",
      history: [
        {
          role: "assistant",
          content:
            "UNIQUE_PREVIOUS_ASSISTANT_PROSE is conversation only.",
        },
      ],
      conversationState: establishedState(),
    },
    {
      conversationCatalog: CATALOG,
      retrieve: async (query) => {
        queries.push(query);
        return retrievalFixture();
      },
      environment: ENVIRONMENT,
      client: responseClient([
        "The external storage feature implements it [[S4]].",
      ]),
    },
  );

  assert.equal(result.kind, "answer");
  assert.equal(queries.length, 1);
  assert.match(queries[0] ?? "", /papers\/blockchain-for-the-iot/u);
  assert.match(queries[0] ?? "", /design-knowledge\/iot-dp1/u);
  assert.doesNotMatch(
    queries[0] ?? "",
    /UNIQUE_PREVIOUS_ASSISTANT_PROSE/u,
  );
});

test("comparison paper order resolves only the second paper", async () => {
  const comparison = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question:
        "Compare the peer-review paper and Blockchain for the IoT.",
    }),
    CATALOG,
  );
  assert.deepEqual(comparison.explicitPaperSlugs, [
    "peer-review-token-incentives",
    "blockchain-for-the-iot",
  ]);

  const comparisonState: NativeOkfConversationState = {
    ...createInitialNativeOkfConversationState(),
    activePaperSlugs: comparison.explicitPaperSlugs,
    lastIntent: "comparison",
  };
  const followUp = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "Show only the second paper.",
      conversationState: comparisonState,
    }),
    CATALOG,
  );
  assert.deepEqual(followUp.focusedPaperSlugs, [
    "blockchain-for-the-iot",
  ]);
  assert.match(
    followUp.retrievalQuestion,
    /papers\/blockchain-for-the-iot/u,
  );
  assert.doesNotMatch(
    followUp.retrievalQuestion,
    /papers\/peer-review-token-incentives/u,
  );
});

test("an explicit new paper replaces unrelated stale focus", async () => {
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "Explain Other Paper.",
      conversationState: establishedState(),
    }),
    CATALOG,
  );

  assert.deepEqual(prepared.focusedPaperSlugs, ["other-paper"]);
  assert.deepEqual(prepared.focusedConceptIds, []);
  assert.doesNotMatch(
    prepared.retrievalQuestion,
    /design-knowledge\/iot-dp1/u,
  );
});

test("unknown client paper, concept, and source IDs are discarded", () => {
  const state = validateNativeOkfConversationState(
    {
      ...establishedState(),
      activePaperSlugs: [
        "unknown-paper",
        "blockchain-for-the-iot",
      ],
      activeConceptIds: [
        "unknown-concept",
        "design-knowledge/iot-dp1",
      ],
      activeSourceIds: [
        "unknown-source",
        "design-knowledge/iot-dp1",
      ],
    },
    CATALOG,
  );

  assert.deepEqual(state.activePaperSlugs, [
    "blockchain-for-the-iot",
  ]);
  assert.deepEqual(state.activeConceptIds, [
    "design-knowledge/iot-dp1",
  ]);
  assert.deepEqual(state.activeSourceIds, [
    "design-knowledge/iot-dp1",
  ]);
});

test("each substantive follow-up invokes fresh retrieval", async () => {
  let retrievalCalls = 0;
  const ask = async (question: string) =>
    answerNativeOkfChat(
      {
        question,
        conversationState: establishedState(),
      },
      {
        conversationCatalog: CATALOG,
        retrieve: async () => {
          retrievalCalls += 1;
          return retrievalFixture();
        },
        environment: ENVIRONMENT,
        client: responseClient(["Grounded response [[S1]]."]),
      },
    );

  await ask("Summarize this paper.");
  await ask("What limitations does this paper report?");
  assert.equal(retrievalCalls, 2);
});

test("an ambiguous implementation reference returns one free clarification", async () => {
  let retrievalCalls = 0;
  let responseCalls = 0;
  const client = responseClient([]);
  client.responses.create = async () => {
    responseCalls += 1;
    throw new Error("Model must not be called.");
  };

  const result = await answerNativeOkfChat(
    { question: "What features implement it?" },
    {
      conversationCatalog: CATALOG,
      retrieve: async () => {
        retrievalCalls += 1;
        return retrievalFixture();
      },
      environment: ENVIRONMENT,
      client,
    },
  );

  assert.equal(result.kind, "clarification");
  assert.equal(
    result.clarification?.question,
    "Which paper or design principle are you referring to?",
  );
  assert.equal(
    result.answerMarkdown.match(/\?/gu)?.length,
    1,
  );
  assert.equal(retrievalCalls, 0);
  assert.equal(responseCalls, 0);
  assert.equal(
    result.conversationState?.pendingClarification?.originalQuestion,
    "What features implement it?",
  );
});

test("the next response combines with the bounded pending question", async () => {
  const first = await answerNativeOkfChat(
    { question: "What features implement it?" },
    { conversationCatalog: CATALOG },
  );
  const queries: string[] = [];
  const second = await answerNativeOkfChat(
    {
      question: "Blockchain for the IoT",
      history: [
        {
          role: "user",
          content: "What features implement it?",
        },
        {
          role: "assistant",
          content: first.answerMarkdown,
        },
      ],
      conversationState: first.conversationState,
    },
    {
      conversationCatalog: CATALOG,
      retrieve: async (query) => {
        queries.push(query);
        return retrievalFixture();
      },
      environment: ENVIRONMENT,
      client: responseClient([
        "The external encrypted storage feature is grounded [[S4]].",
      ]),
    },
  );

  assert.equal(second.kind, "answer");
  assert.equal(queries.length, 1);
  assert.match(
    queries[0] ?? "",
    /What features implement it\?/u,
  );
  assert.match(queries[0] ?? "", /Blockchain for the IoT/u);
  assert.equal(
    second.conversationState?.pendingClarification,
    null,
  );
});

test("well-formed paper questions do not over-clarify", async () => {
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question:
        "What design principles are proposed in Blockchain for the IoT?",
    }),
    CATALOG,
  );
  assert.equal(prepared.clarification, null);
});

test("answer mode selects concise, comparison, and detailed bounds", async () => {
  const normal = await prepareNativeOkfChatRequest(
    { question: "Explain Blockchain for the IoT." },
    CATALOG,
  );
  const comparison = await prepareNativeOkfChatRequest(
    {
      question:
        "Compare the peer-review paper and Blockchain for the IoT.",
    },
    CATALOG,
  );
  const detailed = await prepareNativeOkfChatRequest(
    {
      question:
        "Explain Blockchain for the IoT in detail.",
    },
    CATALOG,
  );

  assert.equal(normal.answerMode, "normal");
  assert.equal(comparison.answerMode, "comparison");
  assert.equal(detailed.answerMode, "detailed");
});

test("answer prompts carry the applicable concise bound", async () => {
  for (const [question, expected] of [
    ["Explain Blockchain for the IoT.", /100 to 220/u],
    [
      "Compare the peer-review paper and Blockchain for the IoT.",
      /180 to 300/u,
    ],
    [
      "Explain Blockchain for the IoT in detail.",
      /below 900 words/u,
    ],
  ] as const) {
    const requests: Array<Record<string, unknown>> = [];
    await answerNativeOkfChat(
      { question },
      {
        conversationCatalog: CATALOG,
        retrieve: async () => retrievalFixture(),
        environment: ENVIRONMENT,
        client: responseClient(
          ["Concise grounded answer [[S1]]."],
          requests,
        ),
      },
    );
    assert.match(String(requests[0]?.instructions), expected);
  }
});

test("overlong normal output gets one repair and a second invalid result is withheld", async () => {
  const overlong =
    `${Array.from({ length: 360 }, () => "grounded").join(" ")} [[S1]].`;
  const repairedRequests: Array<Record<string, unknown>> = [];
  const repaired = await answerNativeOkfChat(
    { question: "Explain Blockchain for the IoT." },
    {
      conversationCatalog: CATALOG,
      retrieve: async () => retrievalFixture(),
      environment: ENVIRONMENT,
      client: responseClient(
        [overlong, "Concise repaired answer [[S1]]."],
        repairedRequests,
      ),
    },
  );
  assert.equal(repairedRequests.length, 2);
  assert.equal(repaired.answerMarkdown, "Concise repaired answer [[S1]].");
  assert.match(
    String(repairedRequests[1]?.instructions),
    /validation error|Revise the draft once/iu,
  );

  const failedRequests: Array<Record<string, unknown>> = [];
  const failed = await answerNativeOkfChat(
    { question: "Explain Blockchain for the IoT." },
    {
      conversationCatalog: CATALOG,
      retrieve: async () => retrievalFixture(),
      environment: ENVIRONMENT,
      client: responseClient(
        [overlong, overlong],
        failedRequests,
      ),
    },
  );
  assert.equal(failedRequests.length, 2);
  assert.doesNotMatch(failed.answerMarkdown, /grounded grounded/u);
  assert.match(
    failed.answerMarkdown,
    /could not be presented safely/u,
  );
  assert.deepEqual(
    failed.sources.map((source) => source.sourceId),
    ["S1"],
  );
});

test("text diagram validator rejects defensive cases but allows ordinary prose", () => {
  const cases = [
    "```mermaid\nflowchart TD\nA --> B\n```",
    "digraph G {\nA -> B;\nB -> C;\n}",
    "\u250c\u2500\u2500\u2510\n\u2502 A \u2502\n\u2514\u2500\u2500\u2518",
    "[Input] --> [Process]\n[Process] --> [Output]",
  ];
  for (const value of cases) {
    assert.equal(
      validateNativeOkfAnswerPolicy(value, "normal").valid,
      false,
    );
  }
  assert.equal(
    validateNativeOkfAnswerPolicy(
      "The stored requirement leads to the feature (A \u2192 B) in this explanation.",
      "normal",
    ).valid,
    true,
  );
});

test("invalid diagram text receives one prose repair and is never exposed", async () => {
  const requests: Array<Record<string, unknown>> = [];
  const repaired = await answerNativeOkfChat(
    {
      question:
        "Explain Blockchain for the IoT without a diagram.",
      includeDiagram: false,
    },
    {
      conversationCatalog: CATALOG,
      retrieve: async () => retrievalFixture(),
      environment: ENVIRONMENT,
      client: responseClient(
        [
          "```mermaid\nflowchart TD\nA --> B\n``` [[S1]]",
          "Concise grounded prose [[S1]].",
        ],
        requests,
      ),
    },
  );
  assert.equal(requests.length, 2);
  assert.equal(
    repaired.answerMarkdown,
    "Concise grounded prose [[S1]].",
  );

  const failed = await answerNativeOkfChat(
    {
      question:
        "Explain Blockchain for the IoT without a diagram.",
      includeDiagram: false,
    },
    {
      conversationCatalog: CATALOG,
      retrieve: async () => retrievalFixture(),
      environment: ENVIRONMENT,
      client: responseClient([
        "```mermaid\nflowchart TD\nA --> B\n``` [[S1]]",
        "digraph G {\nA -> B;\nB -> C;\n} [[S1]]",
      ]),
    },
  );
  assert.doesNotMatch(failed.answerMarkdown, /flowchart|digraph/u);
  assert.match(
    failed.answerMarkdown,
    /could not be presented safely/u,
  );
});

test("conversation state is always versioned and bounded", () => {
  const parsed = validateNativeOkfChatRequest({
    question: "Explain the grounded paper.",
    conversationState: {
      version: 1,
      activePaperSlugs: Array.from(
        { length: 10 },
        (_, index) =>
          index === 0
            ? "blockchain-for-the-iot"
            : `paper-${index}`,
      ),
      activeConceptIds: Array.from(
        { length: 20 },
        (_, index) =>
          index === 0
            ? "design-knowledge/iot-dp1"
            : `concept-${index}`,
      ),
      activeSourceIds: Array.from(
        { length: 20 },
        (_, index) =>
          index === 0
            ? "design-knowledge/iot-dp1"
            : `source-${index}`,
      ),
      lastIntent: "answer",
      lastDiagramRequested: false,
      pendingClarification: null,
    },
  });

  assert.equal(
    parsed.conversationState?.activePaperSlugs.length,
    3,
  );
  assert.equal(
    parsed.conversationState?.activeConceptIds.length,
    8,
  );
  assert.equal(
    parsed.conversationState?.activeSourceIds.length,
    12,
  );
});

test("clarification response does not masquerade as insufficient context", async () => {
  const result: NativeOkfChatResponse = await answerNativeOkfChat(
    { question: "What implements it?" },
    { conversationCatalog: CATALOG },
  );
  assert.equal(result.kind, "clarification");
  assert.equal(result.insufficientContext, false);
  assert.deepEqual(result.sources, []);
});
