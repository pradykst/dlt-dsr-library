import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import { answerNativeOkfChat } from "../server/openai/chat.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import {
  assembleNativeOkfContextualRetrieval,
  loadNativeOkfConversationCatalog,
  prepareNativeOkfChatRequest,
} from "../server/conversation.ts";
import { createInitialNativeOkfConversationState } from "../shared/chat-types.ts";
import { parseNativeOkfChatSession } from "../shared/chat-session.ts";
import { INITIAL_DIAGRAM_INTENT_TOGGLE_STATE } from "../shared/diagram-intent.ts";
import { parseNativeOkfConversationState } from "../shared/conversation-state.ts";
import { assembleCompletePaperContext } from "../server/retrieval.ts";
import { buildNativeOkfGroundedContext } from "../server/openai/context.ts";
import { validateNativeOkfChatRequest } from "../server/openai/chat.ts";
import { MAX_RETRIEVAL_LIMITS } from "../server/retrieval-config.ts";
import { getAllPapers } from "../server/repository.ts";
import { getOkfBundle } from "../server/cache.ts";
import { associatedConceptsForPaper } from "../server/paper-design-map.ts";

const CONFIG: NativeOpenAiEnvironment = {
  apiKey: "sk-test-do-not-expose",
  model: "test-model",
  reasoningEffort: "medium",
  moderationEnabled: false,
  maxOutputTokens: 800,
  diagramMaxOutputTokens: 600,
};

function completed(outputText: string): Record<string, unknown> {
  return {
    id: "r",
    object: "response",
    created_at: 0,
    model: CONFIG.model,
    output: [],
    output_text: outputText,
    status: "completed",
  };
}

function client(outputs: readonly string[]): NativeOpenAiClient {
  let index = 0;
  return {
    responses: {
      create: async () => completed(outputs[Math.min(index++, outputs.length - 1)]!),
    },
    moderations: { create: async () => ({ results: [{ flagged: false }] }) },
  } as unknown as NativeOpenAiClient;
}

const SCOPE_PAPER = "blockchain-iot-sensor-data";

test("a paper-scoped turn answers from that paper and never leaves it", async () => {
  const result = await answerNativeOkfChat(
    {
      question: "What are the design principles?",
      scope: { type: "paper", paperId: SCOPE_PAPER },
    },
    {
      environment: CONFIG,
      client: client([
        "The paper's design principles [[S2]] [[S3]] [[S4]] [[S5]].",
        "The paper's design principles [[S2]] [[S3]].",
      ]),
    },
  );

  assert.deepEqual(result.scope, { type: "paper", paperId: SCOPE_PAPER });
  assert.deepEqual(result.conversationState?.scope, {
    type: "paper",
    paperId: SCOPE_PAPER,
  });
  assert.ok(result.sources.length >= 1, "expected at least one cited source");
  for (const source of result.sources) {
    assert.ok(
      source.conceptId.includes(SCOPE_PAPER),
      `source ${source.conceptId} must belong to ${SCOPE_PAPER}`,
    );
  }
  assert.equal(result.insufficientContext, false);
});

test("follow-up turns keep the paper scope without repeating the title", async () => {
  const first = await answerNativeOkfChat(
    {
      question: "What are the design principles?",
      scope: { type: "paper", paperId: SCOPE_PAPER },
    },
    { environment: CONFIG, client: client(["Principles [[S2]] [[S3]].", "Principles [[S2]]."]) },
  );

  const followUp = await answerNativeOkfChat(
    {
      question: "Explain the first one.",
      history: [
        { role: "user", content: "What are the design principles?" },
        { role: "assistant", content: "Principles [[S2]] [[S3]]." },
      ],
      conversationState: first.conversationState,
    },
    { environment: CONFIG, client: client(["It works like this [[S2]].", "It works like this [[S2]]."]) },
  );

  assert.deepEqual(followUp.scope, { type: "paper", paperId: SCOPE_PAPER });
  for (const source of followUp.sources) {
    assert.ok(source.conceptId.includes(SCOPE_PAPER));
  }
});

test("an explicit broaden request transitions the turn back to corpus visibly", async () => {
  const result = await answerNativeOkfChat(
    {
      question: "Search the whole library for related design knowledge on this topic.",
      scope: { type: "paper", paperId: SCOPE_PAPER },
    },
    { environment: CONFIG, client: client(["Across the library [[S1]].", "Across the library [[S1]]."]) },
  );
  assert.deepEqual(result.scope, { type: "corpus" });
  assert.deepEqual(result.conversationState?.scope, { type: "corpus" });
});

test("an unknown scoped paper falls back to corpus with a warning, never a silent mismatch", async () => {
  const result = await answerNativeOkfChat(
    {
      question: "What are the design principles for trust?",
      scope: { type: "paper", paperId: "this-paper-does-not-exist" },
    },
    { environment: CONFIG, client: client(["Principles [[S1]].", "Principles [[S1]]."]) },
  );
  assert.deepEqual(result.scope, { type: "corpus" });
  assert.ok(
    (result.warnings ?? []).some((warning) => /selected paper/iu.test(warning)),
  );
});

/**
 * Regression: a dropped paper scope must be reported on EVERY turn shape a
 * stale scope can reach, not only the ordinary answer path. Attaching the
 * notice at one return site left a researcher who happened to ask for a map, a
 * synthesis, or an out-of-scope question with a silently cleared scope and no
 * explanation at all.
 */
test("a dropped paper scope is reported on every turn shape", async () => {
  const staleScope = { type: "paper" as const, paperId: "this-paper-does-not-exist" };
  const turns = [
    // Scope guardrail: short-circuits before retrieval and any model call.
    "What is 35+76/2*6?",
    // Stored map request.
    "Show me the complete design map for this paper.",
    // Design synthesis request.
    "Using this paper as evidence, design a new solution for cross-organisational auditing.",
    // No-evidence research question.
    "What does the library say about epigenetic quantum consensus for interplanetary ledgers?",
  ];

  for (const question of turns) {
    const result = await answerNativeOkfChat(
      { question, scope: staleScope },
      {
        environment: CONFIG,
        client: client(["An answer [[S1]].", "An answer [[S1]]."]),
      },
    );
    assert.deepEqual(result.scope, { type: "corpus" }, question);
    assert.ok(
      (result.warnings ?? []).some((warning) =>
        /selected paper is no longer in the library/iu.test(warning)
      ),
      `no dropped-scope notice for: ${question}`,
    );
    assert.equal(
      (result.warnings ?? []).filter((warning) =>
        /selected paper is no longer in the library/iu.test(warning)
      ).length,
      1,
      `duplicated dropped-scope notice for: ${question}`,
    );
  }
});

/**
 * Regression: paper-only grounding must be enforced deterministically at the
 * server boundary, not inferred from which retrieval implementation happened to
 * run. Here the retrieval deliberately carries a second paper's complete record
 * alongside the selected paper's; nothing downstream may surface it.
 */
test("paper scope filters foreign evidence out of any retrieval it is handed", async () => {
  const [papers, bundle, catalog] = await Promise.all([
    getAllPapers(),
    getOkfBundle(),
    loadNativeOkfConversationCatalog(),
  ]);
  const scopePaper = papers.find(
    (paper) => paper.id === `papers/${SCOPE_PAPER}`,
  );
  assert.ok(scopePaper, `fixture paper ${SCOPE_PAPER} must exist`);
  const foreignPaper = papers.find(
    (paper) =>
      paper.id !== scopePaper.id &&
      associatedConceptsForPaper(bundle, paper).length >= 3,
  );
  assert.ok(foreignPaper, "a second structurally rich paper must exist");

  const [scopedContext, foreignContext] = await Promise.all([
    assembleCompletePaperContext(scopePaper.id, "design principles"),
    assembleCompletePaperContext(foreignPaper.id, "design principles"),
  ]);
  const foreignIds = new Set(
    foreignContext.finalConcepts.map((concept) => concept.conceptId),
  );
  const contaminated = {
    ...scopedContext,
    finalConcepts: [
      ...scopedContext.finalConcepts,
      ...foreignContext.finalConcepts,
    ],
    corpusOverview: {
      paperCount: 2,
      papers: [
        ...scopedContext.corpusOverview.papers,
        ...foreignContext.corpusOverview.papers,
      ],
    },
  };

  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "What are the design principles?",
      scope: { type: "paper", paperId: SCOPE_PAPER },
    }),
    catalog,
  );
  const assembled = await assembleNativeOkfContextualRetrieval(
    prepared,
    contaminated,
  );
  for (const concept of assembled.finalConcepts) {
    assert.equal(
      foreignIds.has(concept.conceptId),
      false,
      `foreign concept ${concept.conceptId} survived the paper-scope boundary`,
    );
  }
  for (const overview of assembled.corpusOverview.papers) {
    assert.equal(overview.conceptId, scopePaper.id);
  }

  // End to end: even when the model cites every offered marker, no source card
  // may belong to the other paper.
  const result = await answerNativeOkfChat(
    {
      question: "What are the design principles?",
      scope: { type: "paper", paperId: SCOPE_PAPER },
    },
    {
      retrieve: async () => contaminated,
      environment: CONFIG,
      client: client([
        "Principles [[S1]] [[S2]] [[S3]] [[S4]] [[S5]] [[S6]] [[S7]] [[S8]].",
        "Principles [[S1]] [[S2]].",
      ]),
    },
  );
  for (const source of result.sources) {
    assert.equal(
      foreignIds.has(source.conceptId),
      false,
      `leaked source ${source.conceptId} from ${foreignPaper.id}`,
    );
  }
});

/**
 * Regression: a deliberate scope change must not carry the previous scope's
 * evidence referents or diagram subject into the new evidence universe. Without
 * the reset, "explain the map" after switching papers resolves against the
 * paper the researcher just left.
 */
test("changing scope between turns drops the previous scope's referents", async () => {
  const catalog = await loadNativeOkfConversationCatalog();
  const other = catalog.papers.find((paper) => paper.slug !== SCOPE_PAPER);
  assert.ok(other, "a second catalogued paper must exist");

  const staleState = {
    ...createInitialNativeOkfConversationState(),
    scope: { type: "paper" as const, paperId: other.slug },
    activePaperSlugs: [other.slug],
    activeConceptIds: catalog.concepts
      .filter((concept) => concept.paperSlug === other.slug)
      .slice(0, 3)
      .map((concept) => concept.conceptId),
    activeSourceIds: catalog.concepts
      .filter((concept) => concept.paperSlug === other.slug)
      .slice(0, 3)
      .map((concept) => concept.conceptId),
    activeStructuredResultPaperSlugs: [other.slug],
    lastIntent: "stored-diagram" as const,
    lastDiagramRequested: true,
  };

  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "Explain the map.",
      scope: { type: "paper", paperId: SCOPE_PAPER },
      conversationState: staleState,
    }),
    catalog,
  );

  assert.equal(prepared.scopePaperSlug, SCOPE_PAPER);
  assert.deepEqual(prepared.validatedState.activeConceptIds, []);
  assert.deepEqual(prepared.validatedState.activeSourceIds, []);
  assert.deepEqual(prepared.validatedState.activeStructuredResultPaperSlugs, []);
  assert.equal(prepared.validatedState.latestValidatedSynthesisDraft, null);
  // The previous paper's stored map is no longer an active diagram subject, so
  // the turn cannot be routed as Q&A about a diagram from another paper.
  assert.notEqual(prepared.turnPlan.mode, "ACTIVE_DIAGRAM_QA");
  assert.equal(
    prepared.focusedConceptIds.some((conceptId) =>
      staleState.activeConceptIds.includes(conceptId)
    ),
    false,
  );

  // Re-sending the same scope is not a change and leaves the conversation intact.
  const unchanged = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "Explain the map.",
      scope: { type: "paper", paperId: other.slug },
      conversationState: staleState,
    }),
    catalog,
  );
  assert.deepEqual(
    unchanged.validatedState.activeConceptIds,
    staleState.activeConceptIds,
  );
});

/**
 * Backward compatibility: tab sessions and in-flight requests created before
 * this release carry no `scope` field at all. They must default to corpus and
 * never crash the parser or the turn.
 */
test("state and requests from before the scope field default to corpus", async () => {
  const legacyState = {
    version: 1,
    activePaperSlugs: [],
    activeComparisonPaperSlugs: [],
    activeStructuredResultPaperSlugs: [],
    activeConceptIds: [],
    activeSourceIds: [],
    lastIntent: "answer",
    lastDiagramRequested: false,
    pendingClarification: null,
    lastSynthesisProblem: null,
    synthesisClarificationRounds: 0,
    latestValidatedSynthesisDraft: null,
    synthesisDraft: null,
  };

  const parsed = parseNativeOkfConversationState(legacyState);
  assert.ok(parsed, "a pre-scope conversation state must still parse");
  assert.deepEqual(parsed.scope, { type: "corpus" });

  // A pre-scope session payload restores without throwing.
  const session = parseNativeOkfChatSession(
    JSON.stringify({
      version: 1,
      conversationId: "local-legacy",
      messages: [],
      conversationState: legacyState,
      diagramPreference: INITIAL_DIAGRAM_INTENT_TOGGLE_STATE,
    }),
  );
  assert.deepEqual(session?.conversationState.scope, { type: "corpus" });

  // A request with neither `scope` nor a state scope resolves to corpus.
  const request = validateNativeOkfChatRequest({
    question: "What design principles address accountability?",
    conversationState: legacyState,
  });
  assert.equal(request.scope, undefined);
  const prepared = await prepareNativeOkfChatRequest(request);
  assert.equal(prepared.scopePaperSlug, null);
  assert.deepEqual(prepared.resolvedScope, { type: "corpus" });
  assert.equal(prepared.scopeWarning, null);
});

test("request validation rejects a malformed scope", () => {
  assert.throws(() =>
    validateNativeOkfChatRequest({
      question: "hello there",
      scope: { type: "paper" },
    }),
  );
  assert.throws(() =>
    validateNativeOkfChatRequest({
      question: "hello there",
      scope: { type: "elsewhere", paperId: "x" },
    }),
  );
  assert.doesNotThrow(() =>
    validateNativeOkfChatRequest({
      question: "hello there",
      scope: { type: "corpus" },
    }),
  );
});

test("every canonical paper builds a complete, bounded, paper-only scoped context", async () => {
  const [papers, bundle, catalog] = await Promise.all([
    getAllPapers(),
    getOkfBundle(),
    loadNativeOkfConversationCatalog(),
  ]);
  assert.equal(papers.length, 34);

  let largestConceptCount = 0;
  let largestConceptPaper = "";
  let largestContext = 0;
  let largestContextPaper = "";
  let trimmingRequired = false;

  for (const paper of papers) {
    const slug = paper.id.slice("papers/".length);
    const associated = associatedConceptsForPaper(bundle, paper);
    const allowedIds = new Set([paper.id, ...associated.map((c) => c.id)]);

    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({
        question: "Summarise every design principle, requirement and feature and how they connect.",
        scope: { type: "paper", paperId: slug },
      }),
      catalog,
    );
    assert.equal(prepared.scopePaperSlug, slug, paper.id);
    assert.deepEqual(prepared.resolvedScope, { type: "paper", paperId: slug });
    assert.deepEqual(prepared.restrictedPaperSlugs, [slug]);

    const retrieval = await assembleCompletePaperContext(
      paper.id,
      prepared.retrievalQuestion,
    );

    // Every included concept belongs to the selected paper.
    for (const concept of retrieval.finalConcepts) {
      assert.ok(allowedIds.has(concept.conceptId), `${paper.id} leaked ${concept.conceptId}`);
    }
    // Every canonical design concept is present (none dropped).
    for (const concept of associated) {
      assert.ok(
        retrieval.finalConcepts.some((c) => c.conceptId === concept.id),
        `${paper.id} missing canonical concept ${concept.id}`,
      );
    }

    const required = retrieval.finalConcepts
      .filter((c) => c.type !== "paper" && c.type !== "reference")
      .map((c) => c.conceptId);
    const context = buildNativeOkfGroundedContext(
      retrieval,
      prepared.retrievalQuestion,
      required,
      null,
    );
    assert.ok(
      context.prompt.length <= MAX_RETRIEVAL_LIMITS.maxContextCharacters,
      `${paper.id} context ${context.prompt.length} exceeds the bound`,
    );
    for (const source of context.sources) {
      assert.ok(allowedIds.has(source.conceptId), `${paper.id} source leak ${source.conceptId}`);
    }

    if (required.length > largestConceptCount) {
      largestConceptCount = required.length;
      largestConceptPaper = paper.id;
    }
    if (context.prompt.length > largestContext) {
      largestContext = context.prompt.length;
      largestContextPaper = paper.id;
    }
    if (retrieval.warnings.some((w) => /truncated|omitted/iu.test(w))) {
      trimmingRequired = true;
    }
  }

  // Reported for the release audit (Part 26).
  console.log(
    JSON.stringify({
      canonicalPapers: papers.length,
      largestConceptCount,
      largestConceptPaper,
      largestContext,
      largestContextPaper,
      contextBound: MAX_RETRIEVAL_LIMITS.maxContextCharacters,
      trimmingRequired,
    }),
  );
  assert.ok(largestConceptCount >= 30);
});
