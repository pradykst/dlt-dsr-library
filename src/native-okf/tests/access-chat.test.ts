import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import type { Response } from "openai/resources/responses/responses";

import {
  answerAuthorizedNativeOkfChat,
  createNativeOkfTestSubjectId,
} from "../server/access/authorized-chat.ts";
import type { NativeOkfAccessConfig } from "../server/access/config.ts";
import { NativeOkfAccessError } from "../server/access/errors.ts";
import { projectNativeOkfAccessEnvironment } from "../server/access/runtime.ts";
import { MemoryNativeOkfOperationalStore } from "../server/access/memory-store.ts";
import {
  issueResearcherSession,
  NATIVE_OKF_RESEARCHER_COOKIE,
} from "../server/access/sessions.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import { NativeOkfChatError } from "../server/openai/errors.ts";
import type { RetrievalResult } from "../server/retrieval-types.ts";

const NOW = Date.UTC(2026, 6, 18, 12, 0, 0);
const SESSION_SECRET = "mock-session-secret-that-is-longer-than-thirty-two-bytes";
const TEST_CODE = "mock-private-test-access-code";
const IP_SUBJECT = "a".repeat(64);

const OPENAI_ENVIRONMENT: NativeOpenAiEnvironment = {
  apiKey: "mock-only-not-a-real-key",
  model: "mock-model",
  reasoningEffort: "medium",
  moderationEnabled: false,
  maxOutputTokens: 800,
  diagramMaxOutputTokens: 4_096,
};

function config(
  overrides: Partial<NativeOkfAccessConfig> = {},
): NativeOkfAccessConfig {
  return {
    chatEnabled: true,
    accessMode: "test",
    durableStoreRequired: false,
    usageDbPath: "runtime/mock-native-okf-usage.sqlite",
    sessionSecret: SESSION_SECRET,
    inviteHashSecret: "mock-invite-hash-secret-longer-than-thirty-two-bytes",
    testAccessCode: TEST_CODE,
    adminAccessCode: null,
    adminSessionSecret: null,
    adminConfigured: false,
    trustedProxy: { trustProxy: false },
    publicOrigin: null,
    testQuotas: {
      dailyQuestions: 20,
      dailyDiagrams: 5,
      totalQuestions: 100,
      totalDiagrams: 25,
      requestsPerMinute: 100,
      cooldownSeconds: 0,
      maxConcurrent: 1,
    },
    inviteDefaultQuotas: {
      dailyQuestions: 12,
      dailyDiagrams: 3,
      totalQuestions: 25,
      totalDiagrams: 8,
      requestsPerMinute: 100,
      cooldownSeconds: 0,
      maxConcurrent: 1,
    },
    applicationBudgets: {
      dailyMicrodollars: 3_000_000,
      monthlyMicrodollars: 20_000_000,
      maxGlobalConcurrent: 3,
    },
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
    researcherSessionMaxAgeSeconds: 14 * 24 * 60 * 60,
    adminSessionMaxAgeSeconds: 30 * 60,
    reservationTtlMs: 15 * 60 * 1_000,
    adminMutationsPerMinute: 10,
    ...overrides,
  };
}

function retrievalFixture(noMatch = false): RetrievalResult {
  return {
    normalizedQuestion: noMatch ? "nonsense query" : "grounded question",
    seedResults: [],
    expandedResults: [],
    finalConcepts: noMatch
      ? []
      : [
          {
            conceptId: "papers/example-paper",
            type: "paper",
            title: "Example paper",
            description: "A grounded fixture paper.",
            path: "papers/example-paper.md",
            tags: ["fixture"],
            headings: ["Summary"],
            markdownBody: "Grounded fixture evidence.",
            selectedMetadata: {},
            score: 10,
            expansionDepth: 0,
            characterEstimate: 120,
          },
        ],
    corpusOverview: {
      paperCount: 1,
      papers: [
        {
          conceptId: "papers/example-paper",
          title: "Example paper",
          tags: ["fixture"],
          linkedConceptCounts: {},
        },
      ],
    },
    warnings: [],
    confidence: noMatch ? 0.2 : 0.9,
    noMatch,
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
        indexedConceptCount: 241,
        candidateCount: noMatch ? 0 : 1,
        meaningfulTermCount: 1,
        meaningfulOverlapCount: noMatch ? 0 : 1,
        meaningfulOverlapRatio: noMatch ? 0 : 1,
        exactResultCount: noMatch ? 0 : 1,
        prefixOnlyResultCount: 0,
        fuzzyOnlyResultCount: 0,
        hasExactMatch: !noMatch,
        hasExactTitleMatch: false,
        hasExactPathMatch: false,
        hasPrefixMatch: false,
        hasFuzzyMatch: false,
        topScore: noMatch ? 0 : 10,
        secondScore: 0,
        topScoreSeparation: 0,
      },
      expansionPaths: [],
      droppedConcepts: [],
      secondHopUsed: false,
      secondHopReason: "not requested",
      candidateCount: noMatch ? 0 : 1,
    },
    contextCharacterEstimate: noMatch ? 0 : 120,
  };
}

function responseWithUsage(): Response {
  return {
    id: "mock-response",
    object: "response",
    created_at: 0,
    model: "mock-model",
    output: [],
    output_text: "Grounded answer [[S1]].",
    status: "completed",
    usage: {
      input_tokens: 100,
      input_tokens_details: {
        cached_tokens: 20,
        cache_write_tokens: 0,
      },
      output_tokens: 10,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 110,
    },
  } as unknown as Response;
}

function mockClient(options?: {
  moderationFlagged?: boolean;
  omitUsage?: boolean;
  counters?: { responses: number; moderations: number };
}): NativeOpenAiClient {
  return {
    responses: {
      create: async () => {
        if (options?.counters) options.counters.responses += 1;
        const response = responseWithUsage();
        if (options?.omitUsage) {
          return { ...response, usage: undefined } as unknown as Response;
        }
        return response;
      },
    },
    moderations: {
      create: async () => {
        if (options?.counters) options.counters.moderations += 1;
        return {
          results: [{ flagged: options?.moderationFlagged === true }],
        } as never;
      },
    },
  };
}

function store(): MemoryNativeOkfOperationalStore {
  const value = new MemoryNativeOkfOperationalStore();
  value.initialize();
  return value;
}

function testCookie(
  currentConfig: NativeOkfAccessConfig,
  subjectId = createNativeOkfTestSubjectId(TEST_CODE, SESSION_SECRET),
): string {
  const session = issueResearcherSession({
    subjectId,
    accessExpiresAtMs: NOW + 24 * 60 * 60 * 1_000,
    secret: currentConfig.sessionSecret ?? SESSION_SECRET,
    nowMs: NOW,
  });
  return `${NATIVE_OKF_RESEARCHER_COOKIE}=${session.token}`;
}

function dependencies(
  currentConfig: NativeOkfAccessConfig,
  currentStore: MemoryNativeOkfOperationalStore,
  client: NativeOpenAiClient,
  overrides: Record<string, unknown> = {},
) {
  return {
    config: currentConfig,
    getStore: () => currentStore,
    cookieHeader: testCookie(currentConfig),
    ipSubject: IP_SUBJECT,
    now: () => NOW,
    retrieve: async () => retrievalFixture(),
    loadOpenAiEnvironment: () => OPENAI_ENVIRONMENT,
    getOpenAiClient: () => client,
    createReservationId: () => "reservation:test",
    ...overrides,
  };
}

test("disabled mode blocks before store, retrieval, or OpenAI", async () => {
  let storeCalls = 0;
  let retrievalCalls = 0;
  let modelCalls = 0;
  await assert.rejects(
    answerAuthorizedNativeOkfChat(
      { question: "Explain the grounded paper" },
      {
        config: config({ accessMode: "disabled" }),
        getStore: () => {
          storeCalls += 1;
          return store();
        },
        ipSubject: IP_SUBJECT,
        retrieve: async () => {
          retrievalCalls += 1;
          return retrievalFixture();
        },
        getOpenAiClient: () => {
          modelCalls += 1;
          return mockClient();
        },
      },
    ),
    (error: unknown) =>
      error instanceof NativeOkfAccessError &&
      error.status === 503 &&
      error.code === "service_paused",
  );
  assert.equal(storeCalls, 0);
  assert.equal(retrievalCalls, 0);
  assert.equal(modelCalls, 0);
});

test("operational pause blocks before request validation or retrieval", async () => {
  const currentStore = store();
  currentStore.setOperationalPause(true, NOW);
  let retrievalCalls = 0;
  await assert.rejects(
    answerAuthorizedNativeOkfChat(
      { invalid: true },
      {
        config: config(),
        getStore: () => currentStore,
        ipSubject: IP_SUBJECT,
        retrieve: async () => {
          retrievalCalls += 1;
          return retrievalFixture();
        },
      },
    ),
    (error: unknown) =>
      error instanceof NativeOkfAccessError && error.status === 503,
  );
  assert.equal(retrievalCalls, 0);
});

test("no-match consumes abuse allowance but no paid quota or model call", async () => {
  const currentConfig = config();
  const currentStore = store();
  let environmentLoads = 0;
  let clientLoads = 0;
  const response = await answerAuthorizedNativeOkfChat(
    { question: "flarble quux nebula toothbrush protocol" },
    {
      config: currentConfig,
      getStore: () => currentStore,
      cookieHeader: null,
      ipSubject: IP_SUBJECT,
      now: () => NOW,
      retrieve: async () => retrievalFixture(true),
      loadOpenAiEnvironment: () => {
        environmentLoads += 1;
        return OPENAI_ENVIRONMENT;
      },
      getOpenAiClient: () => {
        clientLoads += 1;
        return mockClient();
      },
    },
  );
  assert.equal(response.insufficientContext, true);
  assert.equal(response.quota, undefined);
  assert.equal(environmentLoads, 0);
  assert.equal(clientLoads, 0);
  assert.equal(currentStore.getUsageReport(NOW).questionsToday, 0);
  assert.equal(currentStore.getUsageReport(NOW).activeReservations, 0);
});

test("missing or tampered session is 401 after retrieval and before OpenAI", async () => {
  const currentStore = store();
  let retrievalCalls = 0;
  let clientLoads = 0;
  await assert.rejects(
    answerAuthorizedNativeOkfChat(
      { question: "Explain the grounded paper" },
      {
        config: config(),
        getStore: () => currentStore,
        cookieHeader: `${NATIVE_OKF_RESEARCHER_COOKIE}=tampered`,
        ipSubject: IP_SUBJECT,
        now: () => NOW,
        retrieve: async () => {
          retrievalCalls += 1;
          return retrievalFixture();
        },
        getOpenAiClient: () => {
          clientLoads += 1;
          return mockClient();
        },
      },
    ),
    (error: unknown) =>
      error instanceof NativeOkfAccessError &&
      error.status === 401 &&
      error.code === "access_required",
  );
  assert.equal(retrievalCalls, 1);
  assert.equal(clientLoads, 0);
  assert.equal(currentStore.getUsageReport(NOW).questionsToday, 0);
});

test("valid test access returns only safe personal quota metadata", async () => {
  const currentConfig = config();
  const currentStore = store();
  const counters = { responses: 0, moderations: 0 };
  const response = await answerAuthorizedNativeOkfChat(
    { question: "Explain the grounded paper" },
    dependencies(
      currentConfig,
      currentStore,
      mockClient({ counters }),
    ),
  );
  assert.equal(response.insufficientContext, false);
  assert.equal(counters.responses, 1);
  assert.deepEqual(response.quota, {
    questionsRemainingToday: 19,
    diagramsRemainingToday: 5,
    questionsRemainingTotal: 99,
    diagramsRemainingTotal: 25,
    resetAtMs: Date.UTC(2026, 6, 19),
    accessExpiresAtMs: NOW + 24 * 60 * 60 * 1_000,
  });
  assert.deepEqual(Object.keys(response.quota ?? {}).sort(), [
    "accessExpiresAtMs",
    "diagramsRemainingToday",
    "diagramsRemainingTotal",
    "questionsRemainingToday",
    "questionsRemainingTotal",
    "resetAtMs",
  ]);
  assert.equal("retrievalDebug" in response, false);
  assert.equal(currentStore.getActiveReservation("reservation:test"), null);
});

test("valid invite is revalidated and revocation invalidates its session", async () => {
  const currentConfig = config({
    accessMode: "invite",
    durableStoreRequired: true,
  });
  const currentStore = store();
  const invitation = currentStore.createInvitation({
    id: "invite-01",
    codeHash: "b".repeat(64),
    label: "Research group",
    createdAtMs: NOW - 1_000,
    expiresAtMs: NOW + 24 * 60 * 60 * 1_000,
    quotas: currentConfig.inviteDefaultQuotas,
  });
  const cookie = testCookie(currentConfig, invitation.id);
  const counters = { responses: 0, moderations: 0 };
  const response = await answerAuthorizedNativeOkfChat(
    { question: "Explain the grounded paper" },
    dependencies(
      currentConfig,
      currentStore,
      mockClient({ counters }),
      {
        cookieHeader: cookie,
        createReservationId: () => "reservation:invite",
      },
    ),
  );
  assert.equal(response.quota?.questionsRemainingTotal, 24);
  assert.equal(counters.responses, 1);

  currentStore.revokeInvitation(invitation.id, NOW + 1);
  await assert.rejects(
    answerAuthorizedNativeOkfChat(
      { question: "Explain the grounded paper again" },
      dependencies(
        currentConfig,
        currentStore,
        mockClient({ counters }),
        {
          cookieHeader: cookie,
          now: () => NOW + 2,
          createReservationId: () => "reservation:revoked",
        },
      ),
    ),
    (error: unknown) =>
      error instanceof NativeOkfAccessError &&
      error.status === 403 &&
      error.code === "access_revoked",
  );
  assert.equal(counters.responses, 1);
});

test("personal question quota blocks with zero additional model calls", async () => {
  const currentConfig = config({
    testQuotas: {
      dailyQuestions: 1,
      dailyDiagrams: 0,
      totalQuestions: 1,
      totalDiagrams: 0,
      requestsPerMinute: 100,
      cooldownSeconds: 0,
      maxConcurrent: 1,
    },
  });
  const currentStore = store();
  const counters = { responses: 0, moderations: 0 };
  await answerAuthorizedNativeOkfChat(
    { question: "First grounded question" },
    dependencies(currentConfig, currentStore, mockClient({ counters })),
  );
  await assert.rejects(
    answerAuthorizedNativeOkfChat(
      { question: "Second grounded question" },
      dependencies(
        currentConfig,
        currentStore,
        mockClient({ counters }),
        { createReservationId: () => "reservation:second" },
      ),
    ),
    (error: unknown) =>
      error instanceof NativeOkfAccessError &&
      error.status === 429 &&
      error.code === "quota_exhausted",
  );
  assert.equal(counters.responses, 1);
});

test("diagram exhaustion blocks diagram but still permits text", async () => {
  const currentConfig = config({
    testQuotas: {
      dailyQuestions: 2,
      dailyDiagrams: 0,
      totalQuestions: 2,
      totalDiagrams: 0,
      requestsPerMinute: 100,
      cooldownSeconds: 0,
      maxConcurrent: 1,
    },
  });
  const currentStore = store();
  const counters = { responses: 0, moderations: 0 };
  await assert.rejects(
    answerAuthorizedNativeOkfChat(
      {
        question: "Explain the grounded paper with a diagram",
        includeDiagram: true,
      },
      dependencies(
        currentConfig,
        currentStore,
        mockClient({ counters }),
      ),
    ),
    (error: unknown) =>
      error instanceof NativeOkfAccessError &&
      error.status === 429 &&
      error.code === "diagram_quota_exhausted",
  );
  assert.equal(counters.responses, 0);

  const textResponse = await answerAuthorizedNativeOkfChat(
    {
      question: "Explain the grounded paper without a diagram",
      includeDiagram: false,
    },
    dependencies(
      currentConfig,
      currentStore,
      mockClient({ counters }),
      { createReservationId: () => "reservation:text" },
    ),
  );
  assert.equal(counters.responses, 1);
  assert.equal(textResponse.quota?.questionsRemainingTotal, 1);
  assert.equal(textResponse.quota?.diagramsRemainingTotal, 0);
});

test("moderation block uses no generation quota or cost", async () => {
  const currentConfig = config();
  const currentStore = store();
  const counters = { responses: 0, moderations: 0 };
  await assert.rejects(
    answerAuthorizedNativeOkfChat(
      { question: "Explain the grounded paper" },
      dependencies(
        currentConfig,
        currentStore,
        mockClient({ moderationFlagged: true, counters }),
        {
          loadOpenAiEnvironment: () => ({
            ...OPENAI_ENVIRONMENT,
            moderationEnabled: true,
          }),
        },
      ),
    ),
    /safety checks/,
  );
  assert.equal(counters.moderations, 1);
  assert.equal(counters.responses, 0);
  const subjectId = createNativeOkfTestSubjectId(TEST_CODE, SESSION_SECRET);
  const quota = currentStore.getSubjectQuotaSnapshot({
    subjectId,
    nowMs: NOW,
    limits: currentConfig.testQuotas,
    accessExpiresAtMs: NOW + 24 * 60 * 60 * 1_000,
  });
  assert.equal(quota.questionsUsedTotal, 0);
  assert.equal(currentStore.getUsageReport(NOW).estimatedMicrodollarsToday, 0);
  assert.equal(currentStore.getUsageReport(NOW).activeReservations, 0);
});

test("response usage is reconciled to integer microdollars", async () => {
  const currentConfig = config();
  const currentStore = store();
  await answerAuthorizedNativeOkfChat(
    { question: "Explain the grounded paper" },
    dependencies(currentConfig, currentStore, mockClient()),
  );
  const report = currentStore.getUsageReport(NOW);
  assert.equal(report.modelCallsToday, 1);
  assert.equal(report.estimatedMicrodollarsToday, 270);
  assert.equal(report.unreconciledUsageEvents, 0);
  assert.equal(report.activeReservations, 0);
});

test("omitted response usage charges the full reserve conservatively", async () => {
  const currentConfig = config();
  const currentStore = store();
  await answerAuthorizedNativeOkfChat(
    { question: "Explain the grounded paper" },
    dependencies(
      currentConfig,
      currentStore,
      mockClient({ omitUsage: true }),
    ),
  );
  const report = currentStore.getUsageReport(NOW);
  assert.equal(
    report.estimatedMicrodollarsToday >=
      currentConfig.textRequestReserveMicrodollars,
    true,
  );
  assert.equal(report.unreconciledUsageEvents, 1);
});

class ReconciliationFailureStore extends MemoryNativeOkfOperationalStore {
  override reconcileReservation(): never {
    throw new Error("mock durable reconciliation failure");
  }
}

test("reconciliation failure releases concurrency and charges full reserve", async () => {
  const currentConfig = config();
  const currentStore = new ReconciliationFailureStore();
  currentStore.initialize();
  await assert.rejects(
    answerAuthorizedNativeOkfChat(
      { question: "Explain the grounded paper" },
      dependencies(currentConfig, currentStore, mockClient()),
    ),
    (error: unknown) =>
      error instanceof NativeOkfAccessError &&
      error.status === 503 &&
      error.code === "service_unavailable",
  );
  const report = currentStore.getUsageReport(NOW);
  assert.equal(report.activeReservations, 0);
  assert.equal(report.questionsToday, 1);
  assert.equal(report.unreconciledUsageEvents, 1);
  assert.equal(
    report.estimatedMicrodollarsToday >=
      currentConfig.textRequestReserveMicrodollars,
    true,
  );
});

test("runtime projection excludes API credentials and unrelated environment", () => {
  const projected = projectNativeOkfAccessEnvironment({
    NATIVE_OKF_CHAT_ENABLED: "true",
    NATIVE_OKF_ACCESS_MODE: "test",
    NATIVE_OKF_SESSION_SECRET: "projected-session-secret",
    OPENAI_INPUT_USD_PER_MILLION: "2",
    OPENAI_API_KEY: "MUST_NOT_BE_PROJECTED",
    UNRELATED_SECRET: "MUST_NOT_BE_PROJECTED",
  });
  assert.equal(projected.NATIVE_OKF_CHAT_ENABLED, "true");
  assert.equal(projected.OPENAI_INPUT_USD_PER_MILLION, "2");
  assert.equal(Object.hasOwn(projected, "OPENAI_API_KEY"), false);
  assert.equal(Object.hasOwn(projected, "UNRELATED_SECRET"), false);
});

test("global hard budget blocks before OpenAI without disclosing cost", async () => {
  const currentConfig = config({
    applicationBudgets: {
      dailyMicrodollars: 79_999,
      monthlyMicrodollars: 79_999,
      maxGlobalConcurrent: 3,
    },
  });
  const currentStore = store();
  let environmentLoads = 0;
  let clientLoads = 0;
  await assert.rejects(
    answerAuthorizedNativeOkfChat(
      { question: "Explain the grounded paper" },
      dependencies(currentConfig, currentStore, mockClient(), {
        loadOpenAiEnvironment: () => {
          environmentLoads += 1;
          return OPENAI_ENVIRONMENT;
        },
        getOpenAiClient: () => {
          clientLoads += 1;
          return mockClient();
        },
      }),
    ),
    (error: unknown) =>
      error instanceof NativeOkfAccessError &&
      error.status === 503 &&
      error.code === "service_paused" &&
      !error.publicMessage.toLowerCase().includes("budget"),
  );
  assert.equal(environmentLoads, 0);
  assert.equal(clientLoads, 0);
  assert.equal(currentStore.getUsageReport(NOW).activeReservations, 0);
});
test("a Responses dispatch is blocked when its conservative envelope cannot fit", async () => {
  const currentConfig = config({
    applicationBudgets: {
      dailyMicrodollars: 80_000,
      monthlyMicrodollars: 80_000,
      maxGlobalConcurrent: 3,
    },
    pricing: {
      inputMicrodollarsPerMillion: 100_000_000,
      cachedInputMicrodollarsPerMillion: 100_000_000,
      outputMicrodollarsPerMillion: 100_000_000,
    },
  });
  const currentStore = store();
  const counters = { responses: 0, moderations: 0 };

  await assert.rejects(
    answerAuthorizedNativeOkfChat(
      { question: "Explain the grounded paper" },
      dependencies(
        currentConfig,
        currentStore,
        mockClient({ counters }),
      ),
    ),
    (error: unknown) =>
      error instanceof NativeOkfChatError &&
      error.status === 503,
  );

  assert.equal(counters.responses, 0);
  assert.equal(currentStore.getUsageReport(NOW).questionsToday, 0);
  assert.equal(
    currentStore.getUsageReport(NOW).estimatedMicrodollarsToday,
    0,
  );
  assert.equal(currentStore.getOperationalPause(), false);
});

test("a denied diagram envelope returns grounded text and releases diagram quota", async () => {
  const currentConfig = config({
    applicationBudgets: {
      dailyMicrodollars: 300_000,
      monthlyMicrodollars: 300_000,
      maxGlobalConcurrent: 3,
    },
  });
  const currentStore = store();
  const counters = { responses: 0, moderations: 0 };

  const response = await answerAuthorizedNativeOkfChat(
    {
      question: "Explain the grounded paper with a diagram",
      includeDiagram: true,
    },
    dependencies(
      currentConfig,
      currentStore,
      mockClient({ counters }),
      {
        answer: async (
          _input: unknown,
          chatDependencies?: {
            client?: NativeOpenAiClient;
          },
        ) => {
          const client = chatDependencies?.client;
          if (!client) throw new Error("Expected tracked mock client.");
          await client.responses.create({
            model: "mock-model",
            input: "small grounded text call",
            max_output_tokens: 128,
          });
          await assert.rejects(
            client.responses.create({
              model: "mock-model",
              input: "x".repeat(100_000),
              max_output_tokens: 4_096,
              text: {
                format: {
                  type: "json_schema",
                  name: "mock_diagram",
                  strict: true,
                  schema: { type: "object" },
                },
              },
            } as never),
            (error: unknown) =>
              error instanceof NativeOkfChatError &&
              error.status === 503,
          );
          return {
            answerMarkdown: "Grounded text remains available [[S1]].",
            sources: [],
            insufficientContext: false,
            warnings: ["The diagram safety allowance could not be reserved."],
          };
        },
      },
    ),
  );

  assert.equal(counters.responses, 1);
  assert.equal(response.diagram, undefined);
  assert.equal(response.quota?.questionsRemainingToday, 19);
  assert.equal(response.quota?.diagramsRemainingToday, 5);
  const report = currentStore.getUsageReport(NOW);
  assert.equal(report.questionsToday, 1);
  assert.equal(report.diagramsToday, 0);
  assert.equal(report.modelCallsToday, 1);
});

test("usage above the declared envelope is charged, alerted and pauses future calls", async () => {
  const currentConfig = config();
  const currentStore = store();
  const oversizedUsageResponse = responseWithUsage();
  oversizedUsageResponse.usage = {
    input_tokens: 100_000,
    input_tokens_details: {
      cached_tokens: 0,
      cache_write_tokens: 0,
    },
    output_tokens: 100_000,
    output_tokens_details: { reasoning_tokens: 0 },
    total_tokens: 200_000,
  };
  const client: NativeOpenAiClient = {
    responses: {
      create: async () => oversizedUsageResponse,
    },
    moderations: {
      create: async () => ({ results: [{ flagged: false }] }) as never,
    },
  };

  await answerAuthorizedNativeOkfChat(
    { question: "Explain the grounded paper" },
    dependencies(currentConfig, currentStore, client),
  );

  const report = currentStore.getUsageReport(NOW);
  assert.equal(currentStore.getOperationalPause(), true);
  assert.equal(report.unreconciledUsageEvents, 1);
  assert.equal(report.estimatedMicrodollarsToday, 1_200_000);
  assert.equal(
    report.recentErrors.some(
      (entry) => entry.category === "usage-envelope-exceeded",
    ),
    true,
  );
});

