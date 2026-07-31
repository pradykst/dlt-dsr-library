import "server-only";

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import type { Response } from "openai/resources/responses/responses";

import { NativeOkfAdminRateLimiter } from "../server/access/admin-rate-limit.ts";
import {
  handleResearchAccessGet,
  type ResearchAccessPayload,
} from "../server/access/access-service.ts";
import {
  answerAuthorizedNativeOkfChat,
  createNativeOkfTestSubjectId,
  type AuthorizedNativeOkfChatDependencies,
} from "../server/access/authorized-chat.ts";
import type { NativeOkfAccessConfig } from "../server/access/config.ts";
import { MemoryNativeOkfOperationalStore } from "../server/access/memory-store.ts";
import {
  issueResearcherSession,
  NATIVE_OKF_RESEARCHER_COOKIE,
} from "../server/access/sessions.ts";
import { SqliteNativeOkfOperationalStore } from "../server/access/sqlite-store.ts";
import type { NativeOkfOperationalStore } from "../server/access/store.ts";
import type {
  ApplicationBudgetLimits,
  QuotaLimits,
  ReservationRequest,
} from "../server/access/types.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import { retrieveOkfContext } from "../server/retrieval.ts";
import type { RetrievalResult } from "../server/retrieval-types.ts";
import type { GeneratedDiagram } from "../shared/chat-types.ts";

const NOW = Date.UTC(2026, 6, 21, 12, 0, 0);
const TEST_CODE = "mock-regression-test-code";
const SESSION_SECRET = "mock-session-secret-with-at-least-thirty-two-characters";
const IP_SUBJECT = "a".repeat(64);
const SUBJECT_ID = createNativeOkfTestSubjectId(TEST_CODE, SESSION_SECRET);

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

function config(overrides: Partial<NativeOkfAccessConfig> = {}): NativeOkfAccessConfig {
  return {
    chatEnabled: true,
    accessMode: "test",
    durableStoreRequired: false,
    usageDbPath: "runtime/mock-quota-regression.sqlite",
    sessionSecret: SESSION_SECRET,
    inviteHashSecret: "mock-invite-hash-secret-with-at-least-thirty-two-characters",
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
    ...overrides,
  };
}

function memoryStore(): MemoryNativeOkfOperationalStore {
  const store = new MemoryNativeOkfOperationalStore();
  store.initialize();
  return store;
}

function cookie(nowMs = NOW): string {
  const session = issueResearcherSession({
    subjectId: SUBJECT_ID,
    accessExpiresAtMs: nowMs + 86_400_000,
    secret: SESSION_SECRET,
    nowMs,
  });
  return `${NATIVE_OKF_RESEARCHER_COOKIE}=${session.token}`;
}

function mockClient(): NativeOpenAiClient {
  return {
    responses: {
      create: async () => ({
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
      }) as unknown as Response,
    },
    moderations: {
      create: async () => ({ results: [{ flagged: false }] }) as never,
    },
  };
}

function retrievalFixture(noMatch = false): RetrievalResult {
  const concepts: RetrievalResult["finalConcepts"] = noMatch
    ? []
    : [
        {
          conceptId: "design-knowledge/example-dp1",
          type: "design-principle",
          title: "Example principle",
          description: "Grounded fixture principle.",
          path: "design-knowledge/example-dp1.md",
          tags: ["fixture"],
          headings: ["Principle"],
          markdownBody: "Grounded fixture evidence.",
          selectedMetadata: {},
          score: 10,
          expansionDepth: 0,
          characterEstimate: 120,
        },
        {
          conceptId: "design-knowledge/example-df1",
          type: "design-feature",
          title: "Example feature",
          description: "Grounded fixture feature.",
          path: "design-knowledge/example-df1.md",
          tags: ["fixture"],
          headings: ["Feature"],
          markdownBody: "More grounded fixture evidence.",
          selectedMetadata: {},
          score: 9,
          expansionDepth: 0,
          characterEstimate: 120,
        },
      ];
  return {
    normalizedQuestion: noMatch ? "no match" : "grounded fixture",
    seedResults: [],
    expandedResults: [],
    finalConcepts: concepts,
    corpusOverview: { paperCount: 0, papers: [] },
    warnings: [],
    confidence: noMatch ? 0 : 0.9,
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
        indexedConceptCount: 245,
        candidateCount: concepts.length,
        meaningfulTermCount: 1,
        meaningfulOverlapCount: concepts.length === 0 ? 0 : 1,
        meaningfulOverlapRatio: concepts.length === 0 ? 0 : 1,
        exactResultCount: concepts.length,
        prefixOnlyResultCount: 0,
        fuzzyOnlyResultCount: 0,
        hasExactMatch: concepts.length > 0,
        hasExactTitleMatch: false,
        hasExactPathMatch: false,
        hasPrefixMatch: false,
        hasFuzzyMatch: false,
        topScore: concepts.length === 0 ? 0 : 10,
        secondScore: concepts.length > 1 ? 9 : 0,
        topScoreSeparation: concepts.length > 1 ? 1.1 : 0,
      },
      expansionPaths: [],
      droppedConcepts: [],
      secondHopUsed: false,
      secondHopReason: "not needed",
      candidateCount: concepts.length,
    },
    contextCharacterEstimate: concepts.length * 120,
  };
}

function validatedDiagram(): GeneratedDiagram {
  return {
    title: "Validated diagram",
    explanation: "A mocked already-validated diagram object.",
    nodes: [
      {
        id: "node-1",
        label: "Principle",
        description: "A grounded principle.",
        category: "Design principle",
        stage: "design-principle",
        order: 1,
        group: null,
        provenance: "stored",
        sourcePaths: ["design-knowledge/example-dp1"],
        supportConceptIds: ["design-knowledge/example-dp1"],
        synthesisRationale: null,
        synthesis: false,
      },
      {
        id: "node-2",
        label: "Feature",
        description: "A grounded feature.",
        category: "Design feature",
        stage: "design-feature",
        order: 2,
        group: null,
        provenance: "stored",
        sourcePaths: ["design-knowledge/example-df1"],
        supportConceptIds: ["design-knowledge/example-df1"],
        synthesisRationale: null,
        synthesis: false,
      },
    ],
    edges: [
      {
        source: "node-1",
        target: "node-2",
        label: "implemented by",
        provenance: "stored",
        supportConceptIds: [
          "design-knowledge/example-dp1",
          "design-knowledge/example-df1",
        ],
      },
    ],
  };
}

function reservation(
  id: string,
  includeDiagram: boolean,
  nowMs = NOW,
  subjectId = SUBJECT_ID,
): ReservationRequest {
  return {
    reservationId: id,
    subjectId,
    subjectKind: "test",
    invitationId: null,
    nowMs,
    expiresAtMs: nowMs + 120_000,
    includeDiagram,
    reserveMicrodollars: includeDiagram ? 180_000 : 80_000,
    subjectLimits: { ...QUOTAS },
    applicationLimits: { ...BUDGETS },
    accessExpiresAtMs: nowMs + 86_400_000,
  };
}

function settle(
  store: NativeOkfOperationalStore,
  id: string,
  options: {
    diagramDelivered?: boolean;
    modelCalls?: number;
    diagramModelCalls?: number;
    microdollars?: number;
    nowMs?: number;
  } = {},
): void {
  const modelCalls = options.modelCalls ?? 1;
  store.reconcileReservation({
    reservationId: id,
    completedAtMs: options.nowMs ?? NOW + 1,
    usage: {
      inputTokens: modelCalls * 100,
      cachedInputTokens: modelCalls * 20,
      outputTokens: modelCalls * 10,
      modelCalls,
    },
    diagramModelCalls: options.diagramModelCalls ?? 0,
    diagramDelivered: options.diagramDelivered ?? false,
    actualMicrodollars: options.microdollars ?? modelCalls * 270,
    usageUnreconciled: false,
    latencyMs: 1,
    outcomeCategory: "completed",
    errorCategory: null,
  });
}

function quota(store: NativeOkfOperationalStore, nowMs = NOW) {
  return store.getSubjectQuotaSnapshot({
    subjectId: SUBJECT_ID,
    nowMs,
    limits: QUOTAS,
    accessExpiresAtMs: nowMs + 86_400_000,
  });
}

function authorizedDependencies(
  store: NativeOkfOperationalStore,
  reservationId: string,
  overrides: Partial<AuthorizedNativeOkfChatDependencies> = {},
): AuthorizedNativeOkfChatDependencies {
  return {
    config: config(),
    getStore: () => store,
    cookieHeader: cookie(),
    ipSubject: IP_SUBJECT,
    now: () => NOW,
    retrieve: async () => retrievalFixture(),
    loadOpenAiEnvironment: () => ENVIRONMENT,
    getOpenAiClient: () => mockClient(),
    createReservationId: () => reservationId,
    ...overrides,
  };
}

function scenarioAnswer(
  options: {
    diagramDelivered: boolean;
    diagramCalls: number;
    diagramMode?: "stored" | "synthesized";
  },
): NonNullable<AuthorizedNativeOkfChatDependencies["answer"]> {
  return async (_input, dependencies) => {
    const client = dependencies?.client;
    if (!client) throw new Error("Expected the tracked mock client.");
    await client.responses.create({
      model: "mock-model",
      input: "bounded answer request",
      max_output_tokens: 128,
    });
    for (let index = 0; index < options.diagramCalls; index += 1) {
      await client.responses.create({
        model: "mock-model",
        input: `bounded structured request ${index + 1}`,
        max_output_tokens: 256,
        text: {
          format: {
            type: "json_schema",
            name: "mock_diagram",
            strict: true,
            schema: { type: "object", additionalProperties: false },
          },
        },
      } as never);
    }
    return {
      kind: "answer",
      presentationMode: options.diagramDelivered ? "diagram-primary" : "text-primary",
      diagramStatus: options.diagramDelivered ? "success" : null,
      answerMarkdown: "Grounded answer [[S1]].",
      sources: [],
      insufficientContext: false,
      diagramMode: options.diagramDelivered
        ? options.diagramMode ?? "stored"
        : null,
      ...(options.diagramDelivered ? { diagram: validatedDiagram() } : {}),
    };
  };
}

async function runScenario(
  store: NativeOkfOperationalStore,
  reservationId: string,
  options: {
    diagramDelivered: boolean;
    diagramCalls: number;
    diagramMode?: "stored" | "synthesized";
    question?: string;
  },
) {
  return answerAuthorizedNativeOkfChat(
    {
      question: options.question ?? "Generate a grounded design flow for a fragmented marketplace process.",
      includeDiagram: true,
    },
    authorizedDependencies(store, reservationId, {
      answer: scenarioAnswer(options),
    }),
  );
}

function getRequest(currentCookie: string): Request {
  return new Request("https://native-okf.example/api/native-okf/access", {
    headers: { cookie: currentCookie },
  });
}

function accessDependencies(store: NativeOkfOperationalStore, nowMs = NOW) {
  return {
    config: config({ publicOrigin: "https://native-okf.example" }),
    store,
    now: () => nowMs,
    production: false,
    loginRateLimiter: new NativeOkfAdminRateLimiter(),
  };
}

test("27 a normal text answer leaves diagram quota at 5 daily and 25 total", async () => {
  const store = memoryStore();
  const response = await answerAuthorizedNativeOkfChat(
    { question: "Explain the grounded principle." },
    authorizedDependencies(store, "quota-27"),
  );
  assert.equal(response.diagram, undefined);
  assert.equal(response.quota?.diagramsRemainingToday, 5);
  assert.equal(response.quota?.diagramsRemainingTotal, 25);
});

test("28 a deterministic stored map consumes one delivery unit with zero diagram model calls", async () => {
  const store = memoryStore();
  const response = await answerAuthorizedNativeOkfChat(
    {
      question: "Show the requirements, principles and features from Blockchain for the IoT.",
    },
    authorizedDependencies(store, "quota-28", {
      retrieve: retrieveOkfContext,
    }),
  );
  assert.equal(response.diagram?.nodes.length, 17);
  assert.equal(response.quota?.diagramsRemainingToday, 4);
  assert.equal(response.quota?.diagramsRemainingTotal, 24);
  assert.equal(store.getUsageReport(NOW).modelCallsToday, 0);
});

test("29 a second successful synthesized diagram leaves 3 daily and 23 total", async () => {
  const store = memoryStore();
  await runScenario(store, "quota-29-a", { diagramDelivered: true, diagramCalls: 0 });
  const response = await runScenario(store, "quota-29-b", {
    diagramDelivered: true,
    diagramCalls: 1,
    diagramMode: "synthesized",
  });
  assert.equal(response.quota?.diagramsRemainingToday, 3);
  assert.equal(response.quota?.diagramsRemainingTotal, 23);
});

test("30 a successful grounded-source fallback leaves 2 daily and 22 total", async () => {
  const store = memoryStore();
  await runScenario(store, "quota-30-a", { diagramDelivered: true, diagramCalls: 0 });
  await runScenario(store, "quota-30-b", { diagramDelivered: true, diagramCalls: 1, diagramMode: "synthesized" });
  const response = await runScenario(store, "quota-30-c", {
    diagramDelivered: true,
    diagramCalls: 1,
    diagramMode: "stored",
  });
  assert.equal(response.quota?.diagramsRemainingToday, 2);
  assert.equal(response.quota?.diagramsRemainingTotal, 22);
});

test("31 structured-output repair consumes only one diagram unit", async () => {
  const store = memoryStore();
  const response = await runScenario(store, "quota-31", {
    diagramDelivered: true,
    diagramCalls: 2,
  });
  assert.equal(response.quota?.diagramsRemainingToday, 4);
  assert.equal(response.quota?.diagramsRemainingTotal, 24);
  assert.equal(store.getUsageReport(NOW).modelCallsToday, 3);
});

test("32 a manually disabled diagram consumes zero diagram units", async () => {
  const store = memoryStore();
  const response = await answerAuthorizedNativeOkfChat(
    { question: "Show the requirements and principles.", includeDiagram: false },
    authorizedDependencies(store, "quota-32"),
  );
  assert.equal(response.diagram, undefined);
  assert.equal(response.quota?.diagramsRemainingToday, 5);
  assert.equal(response.quota?.diagramsRemainingTotal, 25);
});

test("33 deterministic clarification consumes zero question and diagram units", async () => {
  const store = memoryStore();
  const response = await answerAuthorizedNativeOkfChat(
    { question: "What implements it?" },
    authorizedDependencies(store, "quota-33", {
      conversationCatalog: { papers: [], concepts: [] },
    }),
  );
  assert.equal(response.kind, "clarification");
  assert.equal(store.getUsageReport(NOW).questionsToday, 0);
  assert.equal(quota(store).diagramsRemainingToday, 5);
});

test("34 no-match consumes zero question and diagram units", async () => {
  const store = memoryStore();
  const response = await answerAuthorizedNativeOkfChat(
    { question: "A deliberately unmatched research query." },
    authorizedDependencies(store, "quota-34", {
      retrieve: async () => retrievalFixture(true),
    }),
  );
  assert.equal(response.insufficientContext, true);
  assert.equal(store.getUsageReport(NOW).questionsToday, 0);
  assert.equal(quota(store).diagramsRemainingToday, 5);
});

test("35 pre-diagram retrieval failure consumes zero quota", async () => {
  const store = memoryStore();
  await assert.rejects(
    answerAuthorizedNativeOkfChat(
      { question: "Generate a grounded design flow for fragmented marketplace identity.", includeDiagram: true },
      authorizedDependencies(store, "quota-35", {
        retrieve: async () => {
          throw new Error("mock retrieval failure");
        },
      }),
    ),
  );
  assert.equal(store.getUsageReport(NOW).questionsToday, 0);
  assert.equal(quota(store).diagramsRemainingToday, 5);
});

test("36 structured failure with no returned diagram releases the diagram unit", async () => {
  const store = memoryStore();
  const response = await runScenario(store, "quota-36", {
    diagramDelivered: false,
    diagramCalls: 1,
  });
  assert.equal(response.diagram, undefined);
  assert.equal(response.quota?.diagramsRemainingToday, 5);
  assert.equal(response.quota?.diagramsRemainingTotal, 25);
  assert.equal(response.quota?.questionsRemainingToday, 19);
});

test("37 one response diagram cannot decrement quota twice", () => {
  const store = memoryStore();
  assert.equal(store.reservePaidRequest(reservation("quota-37", true)).allowed, true);
  settle(store, "quota-37", {
    diagramDelivered: true,
    modelCalls: 3,
    diagramModelCalls: 2,
  });
  assert.equal(quota(store).diagramsRemainingToday, 4);
  assert.equal(quota(store).diagramsRemainingTotal, 24);
});

test("38 two active concurrent successful reservations decrement exactly twice", () => {
  const store = memoryStore();
  assert.equal(store.reservePaidRequest(reservation("quota-38-a", true)).allowed, true);
  assert.equal(store.reservePaidRequest(reservation("quota-38-b", true)).allowed, true);
  settle(store, "quota-38-a", { diagramDelivered: true });
  settle(store, "quota-38-b", { diagramDelivered: true });
  assert.equal(quota(store).diagramsRemainingToday, 3);
  assert.equal(quota(store).diagramsRemainingTotal, 23);
});

test("39 duplicate reconciliation cannot double-finalize", () => {
  const store = memoryStore();
  store.reservePaidRequest(reservation("quota-39", true));
  settle(store, "quota-39", { diagramDelivered: true });
  assert.throws(() => settle(store, "quota-39", { diagramDelivered: true }));
  assert.equal(quota(store).diagramsRemainingToday, 4);
  assert.equal(quota(store).diagramsRemainingTotal, 24);
});

test("40 UTC daily reset restores only daily diagram capacity", () => {
  const store = memoryStore();
  store.reservePaidRequest(reservation("quota-40", true));
  settle(store, "quota-40", { diagramDelivered: true });
  const nextDay = quota(store, NOW + 86_400_000);
  assert.equal(nextDay.diagramsRemainingToday, 5);
  assert.equal(nextDay.diagramsRemainingTotal, 24);
});

test("41 a fresh session for the same test identity sees persisted quota", async () => {
  const store = memoryStore();
  store.reservePaidRequest(reservation("quota-41", true));
  settle(store, "quota-41", { diagramDelivered: true });
  const first = await handleResearchAccessGet(getRequest(cookie(NOW)), accessDependencies(store));
  const second = await handleResearchAccessGet(getRequest(cookie(NOW + 1_000)), accessDependencies(store, NOW + 1_000));
  const firstBody = await first.json() as ResearchAccessPayload;
  const secondBody = await second.json() as ResearchAccessPayload;
  assert.equal(firstBody.quota?.diagramsRemainingTotal, 24);
  assert.equal(secondBody.quota?.diagramsRemainingTotal, 24);
});

test("42 access-status returns the updated persisted diagram count", async () => {
  const store = memoryStore();
  store.reservePaidRequest(reservation("quota-42", true));
  settle(store, "quota-42", { diagramDelivered: true });
  const response = await handleResearchAccessGet(getRequest(cookie()), accessDependencies(store));
  const body = await response.json() as ResearchAccessPayload;
  assert.equal(body.quota?.diagramsUsedToday, 1);
  assert.equal(body.quota?.diagramsRemainingToday, 4);
  assert.equal(body.quota?.diagramsRemainingTotal, 24);
});

test("43 chat API response contains the post-reconciliation quota snapshot", async () => {
  const store = memoryStore();
  const response = await runScenario(store, "quota-43", {
    diagramDelivered: true,
    diagramCalls: 0,
  });
  assert.equal(response.quota?.diagramsRemainingToday, 4);
  assert.equal(response.quota?.diagramsRemainingTotal, 24);
  assert.equal(quota(store).diagramsRemainingToday, 4);
});

test("44 React updates quota immediately from the canonical chat response", () => {
  const source = readFileSync(
    resolve("src/native-okf/components/chat/ChatWorkbench.tsx"),
    "utf8",
  );
  assert.match(source, /const nextQuota = readNativeOkfPersonalQuota\(payload\.quota\)/u);
  assert.match(source, /setQuota\(nextQuota\)/u);
});

test("45 React refresh path reloads canonical access-status quota", () => {
  const source = readFileSync(
    resolve("src/native-okf/components/chat/ChatWorkbench.tsx"),
    "utf8",
  );
  assert.match(source, /NATIVE_OKF_API_ROUTES\.access/u);
  assert.match(source, /setQuota\(access\.quota\)/u);
});

test("46 changing browser origin does not change the access subject", () => {
  const first = createNativeOkfTestSubjectId(TEST_CODE, SESSION_SECRET);
  const secondConfig = config({ publicOrigin: "https://temporary-tunnel.example" });
  const second = createNativeOkfTestSubjectId(
    secondConfig.testAccessCode!,
    secondConfig.sessionSecret!,
  );
  assert.equal(first, second);
});

test("47 researcher session-cookie renewal does not reset usage", async () => {
  const store = memoryStore();
  store.reservePaidRequest(reservation("quota-47", true));
  settle(store, "quota-47", { diagramDelivered: true });
  const renewedCookie = cookie(NOW + 60_000);
  const response = await handleResearchAccessGet(
    getRequest(renewedCookie),
    accessDependencies(store, NOW + 60_000),
  );
  const body = await response.json() as ResearchAccessPayload;
  assert.equal(body.quota?.diagramsRemainingToday, 4);
  assert.equal(body.quota?.diagramsRemainingTotal, 24);
});

test("48 reopening the same temporary SQLite store preserves diagram usage", () => {
  const directory = mkdtempSync(join(tmpdir(), "native-okf-quota-regression-"));
  const databasePath = join(directory, "usage.sqlite");
  try {
    const first = new SqliteNativeOkfOperationalStore(databasePath);
    first.initialize();
    first.reservePaidRequest(reservation("quota-48", true));
    settle(first, "quota-48", { diagramDelivered: true });
    first.close();
    const reopened = new SqliteNativeOkfOperationalStore(databasePath);
    reopened.initialize();
    assert.equal(quota(reopened).diagramsRemainingToday, 4);
    assert.equal(quota(reopened).diagramsRemainingTotal, 24);
    reopened.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
test("49 successful diagram delivery preserves existing question-quota semantics", async () => {
  const store = memoryStore();
  const response = await runScenario(store, "quota-49", {
    diagramDelivered: true,
    diagramCalls: 1,
  });
  assert.equal(response.quota?.questionsRemainingToday, 19);
  assert.equal(response.quota?.questionsRemainingTotal, 99);
  assert.equal(response.quota?.diagramsRemainingToday, 4);
});
test("50 repair-call cost is reconciled independently of one feature unit", async () => {
  const store = memoryStore();
  await runScenario(store, "quota-50", {
    diagramDelivered: true,
    diagramCalls: 2,
  });
  const report = store.getUsageReport(NOW);
  assert.equal(report.modelCallsToday, 3);
  assert.equal(report.diagramsToday, 1);
  assert.ok(report.estimatedMicrodollarsToday > 0);
});

test("Phase 6C3 live-data gate consumes no question or diagram quota", async () => {
  const store = memoryStore();
  let retrievalCalls = 0;
  let environmentLoads = 0;
  const before = quota(store);
  const response = await answerAuthorizedNativeOkfChat(
    { question: "What are today's cryptocurrency prices?", includeDiagram: true },
    authorizedDependencies(store, "phase-6c3-live-gate", {
      retrieve: async () => {
        retrievalCalls += 1;
        throw new Error("live-data gate must precede retrieval");
      },
      loadOpenAiEnvironment: () => {
        environmentLoads += 1;
        throw new Error("live-data gate must precede model setup");
      },
    }),
  );
  const after = quota(store);
  assert.equal(response.presentationMode, "no-match");
  assert.equal(response.diagramStatus, null);
  assert.deepEqual(response.sources, []);
  assert.equal(retrievalCalls, 0);
  assert.equal(environmentLoads, 0);
  assert.deepEqual(after, before);
});

test("Phase 6C3 evidence fallback releases diagram quota while reconciling model cost", async () => {
  const store = memoryStore();
  const answer: NonNullable<AuthorizedNativeOkfChatDependencies["answer"]> =
    async (_input, dependencies) => {
      const client = dependencies?.client;
      if (!client) throw new Error("Expected tracked mock client.");
      await client.responses.create({
        model: "mock-model",
        input: "initial bounded synthesis plan",
        max_output_tokens: 256,
        text: {
          format: {
            type: "json_schema",
            name: "mock_synthesis_plan",
            strict: true,
            schema: { type: "object", additionalProperties: false },
          },
        },
      } as never);
      await client.responses.create({
        model: "mock-model",
        input: "bounded repair without raw output",
        max_output_tokens: 256,
        text: {
          format: {
            type: "json_schema",
            name: "mock_synthesis_plan",
            strict: true,
            schema: { type: "object", additionalProperties: false },
          },
        },
      } as never);
      return {
        kind: "answer",
        presentationMode: "diagram-primary",
        answerMarkdown: "A valid proposal could not be generated.",
        sources: [],
        diagram: validatedDiagram(),
        diagramMode: "synthesized",
        diagramStatus: "evidence-fallback",
        diagnosticCode: "synthesis-plan-repair-failed",
        insufficientContext: false,
      };
    };
  const response = await answerAuthorizedNativeOkfChat(
    {
      question: "Generate a design flow for fragmented identity across marketplaces.",
      includeDiagram: true,
    },
    authorizedDependencies(store, "phase-6c3-evidence-fallback", { answer }),
  );
  const persisted = quota(store);
  assert.equal(response.diagramStatus, "evidence-fallback");
  assert.equal(response.quota?.questionsRemainingToday, QUOTAS.dailyQuestions - 1);
  assert.equal(response.quota?.diagramsRemainingToday, QUOTAS.dailyDiagrams);
  assert.equal(response.quota?.diagramsRemainingTotal, QUOTAS.totalDiagrams);
  assert.equal(persisted.diagramsRemainingToday, QUOTAS.dailyDiagrams);
  assert.equal(persisted.diagramsRemainingTotal, QUOTAS.totalDiagrams);
  const report = store.getUsageReport(NOW);
  assert.equal(report.modelCallsToday, 2);
});

test("Phase 6C3 successful synthesized delivery decrements diagram quota exactly once", async () => {
  const store = memoryStore();
  const answer: NonNullable<AuthorizedNativeOkfChatDependencies["answer"]> =
    async (_input, dependencies) => {
      const client = dependencies?.client;
      if (!client) throw new Error("Expected tracked mock client.");
      await client.responses.create({
        model: "mock-model",
        input: "valid bounded synthesis plan",
        max_output_tokens: 256,
        text: {
          format: {
            type: "json_schema",
            name: "mock_synthesis_plan",
            strict: true,
            schema: { type: "object", additionalProperties: false },
          },
        },
      } as never);
      return {
        kind: "answer",
        presentationMode: "diagram-primary",
        answerMarkdown: "A deterministic synthesis summary.",
        sources: [],
        diagram: validatedDiagram(),
        diagramMode: "synthesized",
        diagramStatus: "success",
        insufficientContext: false,
      };
    };
  const response = await answerAuthorizedNativeOkfChat(
    {
      question: "Generate a design flow for fragmented identity across marketplaces.",
      includeDiagram: true,
    },
    authorizedDependencies(store, "phase-6c3-synthesis-success", { answer }),
  );
  const persisted = quota(store);
  assert.equal(response.quota?.diagramsRemainingToday, QUOTAS.dailyDiagrams - 1);
  assert.equal(response.quota?.diagramsRemainingTotal, QUOTAS.totalDiagrams - 1);
  assert.equal(persisted.diagramsRemainingToday, QUOTAS.dailyDiagrams - 1);
  assert.equal(persisted.diagramsRemainingTotal, QUOTAS.totalDiagrams - 1);
});

test("Phase 6C3 deterministic stored map decrements once without loading a model", async () => {
  const store = memoryStore();
  let environmentLoads = 0;
  const response = await answerAuthorizedNativeOkfChat(
    {
      question: "Show the requirements, principles and features from Blockchain for the IoT.",
      includeDiagram: true,
    },
    authorizedDependencies(store, "phase-6c3-stored-map", {
      retrieve: retrieveOkfContext,
      loadOpenAiEnvironment: () => {
        environmentLoads += 1;
        throw new Error("deterministic stored map must not load model configuration");
      },
      answer: undefined,
    }),
  );
  const persisted = quota(store);
  assert.equal(environmentLoads, 0);
  assert.equal(response.diagramStatus, "success");
  assert.equal(response.diagramMode, "stored");
  assert.equal(response.diagram?.nodes.length, 17);
  assert.equal(response.quota?.diagramsRemainingToday, QUOTAS.dailyDiagrams - 1);
  assert.equal(response.quota?.diagramsRemainingTotal, QUOTAS.totalDiagrams - 1);
  assert.equal(persisted.diagramsRemainingToday, QUOTAS.dailyDiagrams - 1);
  assert.equal(persisted.diagramsRemainingTotal, QUOTAS.totalDiagrams - 1);
});