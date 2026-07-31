import "server-only";

import assert from "node:assert/strict";
import test from "node:test";
import type { Response } from "openai/resources/responses/responses";

import { getOkfBundle } from "../server/cache.ts";
import { loadNativeOkfConversationCatalog } from "../server/conversation.ts";
import { associatedConceptsForPaper, buildPaperDesignMapFromBundle } from "../server/paper-design-map.ts";
import {
  answerAuthorizedNativeOkfChat,
  createNativeOkfTestSubjectId,
  type AuthorizedNativeOkfChatDependencies,
} from "../server/access/authorized-chat.ts";
import type { NativeOkfAccessConfig } from "../server/access/config.ts";
import { MemoryNativeOkfOperationalStore } from "../server/access/memory-store.ts";
import { issueResearcherSession, NATIVE_OKF_RESEARCHER_COOKIE } from "../server/access/sessions.ts";
import type { NativeOkfOperationalStore } from "../server/access/store.ts";
import type {
  ApplicationBudgetLimits,
  QuotaLimits,
  ReservationRequest,
} from "../server/access/types.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import { buildStoredPaperDesignMap } from "../server/openai/stored-source-map.ts";
import { retrieveOkfContext } from "../server/retrieval.ts";
import type { RetrievalResult } from "../server/retrieval-types.ts";

const NOW = Date.UTC(2026, 6, 21, 12, 0, 0);
const TEST_CODE = "mock-corpus-quota-code";
const SESSION_SECRET = "mock-corpus-session-secret-with-thirty-two-characters";
const SUBJECT_ID = createNativeOkfTestSubjectId(TEST_CODE, SESSION_SECRET);
const IP_SUBJECT = "c".repeat(64);

const QUOTAS: QuotaLimits = {
  dailyQuestions: 20,
  dailyDiagrams: 5,
  totalQuestions: 100,
  totalDiagrams: 25,
  requestsPerMinute: 100,
  cooldownSeconds: 0,
  maxConcurrent: 4,
};

const BUDGETS: ApplicationBudgetLimits = {
  dailyMicrodollars: 3_000_000,
  monthlyMicrodollars: 20_000_000,
  maxGlobalConcurrent: 8,
};

const ENVIRONMENT: NativeOpenAiEnvironment = {
  apiKey: "mock-only-not-a-live-key",
  model: "mock-model",
  reasoningEffort: "low",
  moderationEnabled: false,
  maxOutputTokens: 800,
  diagramMaxOutputTokens: 4_096,
};

function config(): NativeOkfAccessConfig {
  return {
    chatEnabled: true,
    accessMode: "test",
    durableStoreRequired: false,
    usageDbPath: "runtime/mock-corpus-quota.sqlite",
    sessionSecret: SESSION_SECRET,
    inviteHashSecret: "mock-corpus-invite-secret-with-thirty-two-characters",
    testAccessCode: TEST_CODE,
    adminAccessCode: null,
    adminSessionSecret: null,
    adminConfigured: false,
    trustedProxy: { trustProxy: false },
    publicOrigin: null,
    testQuotas: { ...QUOTAS },
    inviteDefaultQuotas: { ...QUOTAS },
    applicationBudgets: { ...BUDGETS },
    globalRequestsPerMinute: 1_000,
    ipRequestsPerHour: 1_000,
    textRequestReserveMicrodollars: 80_000,
    diagramRequestReserveMicrodollars: 180_000,
    pricing: {
      inputMicrodollarsPerMillion: 2_000_000,
      cachedInputMicrodollarsPerMillion: 500_000,
      outputMicrodollarsPerMillion: 10_000_000,
    },
    inviteDefaultValidDays: 14,
    researcherSessionMaxAgeSeconds: 86_400,
    adminSessionMaxAgeSeconds: 1_800,
    reservationTtlMs: 900_000,
    adminMutationsPerMinute: 10,
  };
}

function memoryStore(): MemoryNativeOkfOperationalStore {
  const store = new MemoryNativeOkfOperationalStore();
  store.initialize();
  return store;
}

function cookie(): string {
  const session = issueResearcherSession({
    subjectId: SUBJECT_ID,
    accessExpiresAtMs: NOW + 86_400_000,
    secret: SESSION_SECRET,
    nowMs: NOW,
  });
  return `${NATIVE_OKF_RESEARCHER_COOKIE}=${session.token}`;
}

function mockClient(counter: { calls: number }): NativeOpenAiClient {
  return {
    responses: {
      create: async () => {
        counter.calls += 1;
        return {
          id: `mock-quota-response-${counter.calls}`,
          object: "response",
          created_at: 0,
          model: "mock-model",
          output: [],
          output_text: "Grounded repository evidence [[S1]].",
          status: "completed",
          usage: {
            input_tokens: 100,
            input_tokens_details: { cached_tokens: 20, cache_write_tokens: 0 },
            output_tokens: 10,
            output_tokens_details: { reasoning_tokens: 0 },
            total_tokens: 110,
          },
        } as unknown as Response;
      },
    },
    moderations: {
      create: async () => ({ results: [{ flagged: false }] }) as never,
    },
  } as unknown as NativeOpenAiClient;
}

function authorizedDependencies(
  store: NativeOkfOperationalStore,
  reservationId: string,
  counter: { calls: number },
  overrides: Partial<AuthorizedNativeOkfChatDependencies> = {},
): AuthorizedNativeOkfChatDependencies {
  return {
    config: config(),
    getStore: () => store,
    cookieHeader: cookie(),
    ipSubject: IP_SUBJECT,
    now: () => NOW,
    retrieve: retrieveOkfContext,
    loadOpenAiEnvironment: () => ENVIRONMENT,
    getOpenAiClient: () => mockClient(counter),
    createReservationId: () => reservationId,
    ...overrides,
  };
}

function reservation(id: string, includeDiagram: boolean): ReservationRequest {
  return {
    reservationId: id,
    subjectId: SUBJECT_ID,
    subjectKind: "test",
    invitationId: null,
    nowMs: NOW,
    expiresAtMs: NOW + 120_000,
    includeDiagram,
    reserveMicrodollars: includeDiagram ? 180_000 : 80_000,
    subjectLimits: { ...QUOTAS },
    applicationLimits: { ...BUDGETS },
    accessExpiresAtMs: NOW + 86_400_000,
  };
}

function settle(
  store: NativeOkfOperationalStore,
  id: string,
  options: {
    diagramDelivered: boolean;
    questionConsumed?: boolean;
    diagramModelCalls: number;
    modelCalls: number;
  },
): void {
  store.reconcileReservation({
    reservationId: id,
    completedAtMs: NOW + 1,
    usage: {
      inputTokens: options.modelCalls * 100,
      cachedInputTokens: options.modelCalls * 20,
      outputTokens: options.modelCalls * 10,
      modelCalls: options.modelCalls,
    },
    questionConsumed: options.questionConsumed ?? true,
    diagramModelCalls: options.diagramModelCalls,
    diagramDelivered: options.diagramDelivered,
    actualMicrodollars: options.modelCalls * 270,
    usageUnreconciled: false,
    latencyMs: 1,
    outcomeCategory: "completed",
    errorCategory: null,
  });
}

function quota(store: NativeOkfOperationalStore) {
  return store.getSubjectQuotaSnapshot({
    subjectId: SUBJECT_ID,
    nowMs: NOW,
    limits: QUOTAS,
    accessExpiresAtMs: NOW + 86_400_000,
  });
}

function noMatchRetrieval(): RetrievalResult {
  return {
    normalizedQuestion: "no match",
    seedResults: [],
    expandedResults: [],
    finalConcepts: [],
    corpusOverview: { paperCount: 34, papers: [] },
    warnings: [],
    confidence: 0,
    noMatch: true,
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
      meaningfulTokens: [],
      searchDiagnostics: {
        indexedConceptCount: 245,
        candidateCount: 0,
        meaningfulTermCount: 1,
        meaningfulOverlapCount: 0,
        meaningfulOverlapRatio: 0,
        exactResultCount: 0,
        prefixOnlyResultCount: 0,
        fuzzyOnlyResultCount: 0,
        hasExactMatch: false,
        hasExactTitleMatch: false,
        hasExactPathMatch: false,
        hasPrefixMatch: false,
        hasFuzzyMatch: false,
        topScore: 0,
        secondScore: 0,
        topScoreSeparation: 0,
      },
      expansionPaths: [],
      droppedConcepts: [],
      secondHopUsed: false,
      secondHopReason: "not needed",
      candidateCount: 0,
    },
    contextCharacterEstimate: 0,
  };
}

test("deterministic stored-map delivery decrements once for three dynamically selected paper structures", async () => {
  const [bundle, catalog] = await Promise.all([
    getOkfBundle(),
    loadNativeOkfConversationCatalog(),
  ]);
  const rows = catalog.papers.map((entry) => {
    const paper = bundle.conceptsById.get(entry.conceptId);
    assert.ok(paper);
    const associated = associatedConceptsForPaper(bundle, paper);
    return {
      entry,
      paper,
      associated,
      structure: [...new Set(associated.map((concept) => concept.type))].sort().join("+"),
    };
  });
  const selected = [...new Set(rows.map((row) => row.structure))]
    .slice(0, 3)
    .map((structure) => rows.find((row) => row.structure === structure)!);
  assert.equal(new Set(selected.map((row) => row.structure)).size, 3);

  for (const [index, row] of selected.entries()) {
    const expected = buildPaperDesignMapFromBundle(bundle, row.paper);
    const stored = await buildStoredPaperDesignMap(row.paper.id);
    assert.ok(stored);
    assert.equal(stored.nodes.length, expected.nodes.length);
    assert.equal(stored.edges.length, expected.edges.length);

    const store = memoryStore();
    const counter = { calls: 0 };
    const response = await answerAuthorizedNativeOkfChat(
      { question: `Show the stored paper design map for ${row.entry.title}.` },
      authorizedDependencies(store, `corpus-paper-${index}`, counter),
    );
    assert.ok(response.diagram, row.entry.title);
    assert.equal(response.diagram.nodes.length, expected.nodes.length, row.entry.title);
    assert.equal(response.diagram.edges.length, expected.edges.length, row.entry.title);
    assert.equal(response.quota?.questionsRemainingToday, 19, row.entry.title);
    assert.equal(response.quota?.questionsRemainingTotal, 99, row.entry.title);
    assert.equal(response.quota?.diagramsRemainingToday, 4, row.entry.title);
    assert.equal(response.quota?.diagramsRemainingTotal, 24, row.entry.title);
    assert.equal(quota(store).questionsRemainingToday, 19, row.entry.title);
    assert.equal(quota(store).questionsRemainingTotal, 99, row.entry.title);
    assert.equal(quota(store).diagramsRemainingToday, 4, row.entry.title);
    assert.equal(quota(store).diagramsRemainingTotal, 24, row.entry.title);
    assert.equal(counter.calls, 0, row.entry.title);
  }
});

test("every validated delivered diagram mode consumes exactly one unit regardless of model calls", () => {
  const scenarios = [
    { name: "validated stored structured diagram", diagramModelCalls: 1, modelCalls: 2 },
    { name: "validated synthesized flow", diagramModelCalls: 1, modelCalls: 2 },
    { name: "Grounded source map fallback", diagramModelCalls: 1, modelCalls: 2 },
    { name: "structured repair followed by delivery", diagramModelCalls: 2, modelCalls: 3 },
  ];
  for (const [index, scenario] of scenarios.entries()) {
    const store = memoryStore();
    const id = `delivered-${index}`;
    assert.equal(store.reservePaidRequest(reservation(id, true)).allowed, true);
    settle(store, id, {
      diagramDelivered: true,
      diagramModelCalls: scenario.diagramModelCalls,
      modelCalls: scenario.modelCalls,
    });
    const first = quota(store);
    const reloaded = quota(store);
    assert.equal(first.questionsRemainingToday, 19, scenario.name);
    assert.equal(first.questionsRemainingTotal, 99, scenario.name);
    assert.equal(first.diagramsRemainingToday, 4, scenario.name);
    assert.equal(first.diagramsRemainingTotal, 24, scenario.name);
    assert.deepEqual(reloaded, first, scenario.name);
    assert.equal(store.getUsageReport(NOW).questionsToday, 1, scenario.name);
    assert.equal(store.getUsageReport(NOW).diagramsToday, 1, scenario.name);
    assert.equal(store.getUsageReport(NOW).modelCallsToday, scenario.modelCalls, scenario.name);
  }
});

test("responses without a delivered diagram and manual disable consume zero diagram units", async () => {
  const nondelivery = memoryStore();
  assert.equal(nondelivery.reservePaidRequest(reservation("no-diagram", true)).allowed, true);
  settle(nondelivery, "no-diagram", {
    diagramDelivered: false,
    questionConsumed: true,
    diagramModelCalls: 2,
    modelCalls: 3,
  });
  assert.equal(quota(nondelivery).diagramsRemainingToday, 5);
  assert.equal(quota(nondelivery).diagramsRemainingTotal, 25);

  const catalog = await loadNativeOkfConversationCatalog();
  const paper = catalog.papers[0];
  assert.ok(paper);
  const disabled = memoryStore();
  const counter = { calls: 0 };
  const response = await answerAuthorizedNativeOkfChat(
    {
      question: `Show the stored paper design map for ${paper.title}.`,
      includeDiagram: false,
    },
    authorizedDependencies(disabled, "manual-disable", counter),
  );
  assert.equal(response.diagram, undefined);
  assert.equal(response.quota?.diagramsRemainingToday, 5);
  assert.equal(response.quota?.diagramsRemainingTotal, 25);
  assert.equal(counter.calls, 1);
});

test("deterministic clarification and no-match create no paid or diagram usage", async () => {
  const clarificationStore = memoryStore();
  const clarificationCounter = { calls: 0 };
  const clarification = await answerAuthorizedNativeOkfChat(
    { question: "What implements it?" },
    authorizedDependencies(
      clarificationStore,
      "clarification",
      clarificationCounter,
      { conversationCatalog: { papers: [], concepts: [] } },
    ),
  );
  assert.equal(clarification.kind, "clarification");
  assert.equal(clarificationCounter.calls, 0);
  assert.equal(clarificationStore.getUsageReport(NOW).questionsToday, 0);
  assert.equal(quota(clarificationStore).diagramsRemainingToday, 5);
  assert.equal(quota(clarificationStore).diagramsRemainingTotal, 25);

  const noMatchStore = memoryStore();
  const noMatchCounter = { calls: 0 };
  const noMatch = await answerAuthorizedNativeOkfChat(
    { question: "Explain a deliberately unmatched native research mechanism." },
    authorizedDependencies(noMatchStore, "no-match", noMatchCounter, {
      retrieve: async () => noMatchRetrieval(),
    }),
  );
  assert.equal(noMatch.insufficientContext, true);
  assert.equal(noMatchCounter.calls, 0);
  assert.equal(noMatchStore.getUsageReport(NOW).questionsToday, 0);
  assert.equal(quota(noMatchStore).diagramsRemainingToday, 5);
  assert.equal(quota(noMatchStore).diagramsRemainingTotal, 25);
});