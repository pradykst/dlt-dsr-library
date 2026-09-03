import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import { answerNativeOkfChat } from "../server/openai/chat.ts";
import { deriveNativeOkfSynthesisClarification } from "../server/openai/synthesis-clarification.ts";
import { AiProviderRateLimitedError } from "../server/openai/errors.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import type { RetrievalResult } from "../server/retrieval-types.ts";
import {
  createInitialNativeOkfConversationState,
  MAX_NATIVE_OKF_SYNTHESIS_CLARIFICATION_ROUNDS,
} from "../shared/chat-types.ts";

const ENVIRONMENT: NativeOpenAiEnvironment = {
  apiKey: "mock-only",
  model: "mock-model",
  reasoningEffort: "low",
  moderationEnabled: false,
  maxOutputTokens: 500,
  diagramMaxOutputTokens: 500,
};

const C1 = "fixtures/shared-identity-requirement";
const C2 = "fixtures/selective-disclosure-principle";
const C3 = "fixtures/linked-offer-feature";

function groundedConcept(conceptId: string, type: string, title: string, score: number) {
  return {
    conceptId,
    type,
    title,
    description: `Grounded description for ${title}.`,
    path: `${conceptId}.md`,
    tags: ["fixture"],
    headings: ["Summary"],
    markdownBody: `Grounded native OKF evidence for ${title}.`,
    selectedMetadata: {},
    score,
    expansionDepth: 0 as const,
    characterEstimate: 120,
  };
}

function groundedRetrieval(): RetrievalResult {
  const finalConcepts = [
    groundedConcept(C1, "design-requirement", "Shared identity requirement", 10),
    groundedConcept(C2, "design-principle", "Selective disclosure principle", 9),
    groundedConcept(C3, "design-feature", "Linked marketplace offer record", 8),
  ];
  return {
    normalizedQuestion: "fixture",
    seedResults: [],
    expandedResults: [],
    finalConcepts,
    corpusOverview: { paperCount: 1, papers: [] },
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
        indexedConceptCount: 3,
        candidateCount: 3,
        meaningfulTermCount: 1,
        meaningfulOverlapCount: 1,
        meaningfulOverlapRatio: 1,
        exactResultCount: 3,
        prefixOnlyResultCount: 0,
        fuzzyOnlyResultCount: 0,
        hasExactMatch: true,
        hasExactTitleMatch: true,
        hasExactPathMatch: false,
        hasPrefixMatch: false,
        hasFuzzyMatch: false,
        topScore: 10,
        secondScore: 9,
        topScoreSeparation: 1.1,
      },
      expansionPaths: [],
      droppedConcepts: [],
      secondHopUsed: false,
      secondHopReason: "not needed",
      candidateCount: 3,
    },
    contextCharacterEstimate: 360,
  };
}

const SYNTHESIS_QUESTION =
  "Generate a design flow for selective disclosure of identity credentials shared across independent platforms that I am confused about.";

test("plan plus repair failure yields a specific grounded follow-up, not a terminal error", async () => {
  let diagramAttempts = 0;
  const result = await answerNativeOkfChat(
    { question: SYNTHESIS_QUESTION, includeDiagram: true },
    {
      retrieve: async () => groundedRetrieval(),
      environment: ENVIRONMENT,
      client: { responses: { create: async () => { throw new Error("no model call expected"); } } } as unknown as NativeOpenAiClient,
      generateDiagram: async () => {
        diagramAttempts += 1;
        return {
          warnings: ["synthesis plan invalid after one bounded repair (plan:conversion-invalid)"],
          diagnosticCode: "synthesis-plan-repair-failed" as const,
        };
      },
    },
  );

  assert.equal(diagramAttempts, 1);
  assert.equal(result.kind, "clarification");
  assert.equal(result.presentationMode, "clarification");
  assert.equal(result.diagram, undefined);
  assert.equal(result.diagramStatus, null);
  assert.equal(result.diagnosticCode, undefined);
  assert.equal(result.insufficientContext, false);
  assert.equal(result.clarification?.kind, "synthesis-constraint");
  const question = result.clarification?.question ?? "";
  assert.ok(question.length > 20);
  assert.doesNotMatch(question, /provide more detail/iu);
  assert.doesNotMatch(question, /synthesis-plan-repair-failed/u);
  assert.match(question, /\?$/u);
  // Grounded in the current-turn retrieved concepts.
  assert.match(question, /Shared identity requirement|Selective disclosure principle/u);
  // Problem preserved, no invalid diagram established.
  assert.equal(result.conversationState?.latestValidatedSynthesisDraft ?? null, null);
  assert.equal(result.conversationState?.synthesisDraft, null);
  assert.equal(result.conversationState?.synthesisClarificationRounds, 1);
});

test("repeated synthesis failure is bounded and ends with an honest terminal error", async () => {
  const exhaustedState = {
    ...createInitialNativeOkfConversationState(),
    lastIntent: "clarification" as const,
    lastDiagramRequested: true,
    synthesisClarificationRounds: MAX_NATIVE_OKF_SYNTHESIS_CLARIFICATION_ROUNDS,
    pendingClarification: {
      kind: "synthesis-constraint" as const,
      originalQuestion: SYNTHESIS_QUESTION,
    },
    lastSynthesisProblem: {
      version: 1 as const,
      problemStatement: SYNTHESIS_QUESTION,
      displayProblem: "Selective disclosure of identity credentials across independent platforms",
      domain: null,
      objective: null,
      outputType: "design-solution" as const,
      constraints: [],
      sourcePaperSlugs: [],
    },
  };

  const result = await answerNativeOkfChat(
    {
      question: "still not sure, just try again",
      history: [
        { role: "user", content: SYNTHESIS_QUESTION },
        { role: "assistant", content: "Which part should the shared layer address first?" },
      ],
      conversationState: exhaustedState,
      includeDiagram: true,
    },
    {
      retrieve: async () => groundedRetrieval(),
      environment: ENVIRONMENT,
      client: { responses: { create: async () => { throw new Error("no model call expected"); } } } as unknown as NativeOpenAiClient,
      generateDiagram: async () => ({
        warnings: [],
        diagnosticCode: "synthesis-plan-repair-failed" as const,
      }),
    },
  );

  assert.notEqual(result.kind, "clarification");
  assert.equal(result.presentationMode, "safe-error");
  assert.equal(result.diagramStatus, "failed");
  assert.equal(result.diagnosticCode, "synthesis-plan-repair-failed");
  assert.match(result.answerMarkdown, /could not be produced/iu);
});

test("a provider outage during synthesis stays a differentiated error, never a design question", async () => {
  await assert.rejects(
    answerNativeOkfChat(
      { question: SYNTHESIS_QUESTION, includeDiagram: true },
      {
        retrieve: async () => groundedRetrieval(),
        environment: ENVIRONMENT,
        client: { responses: { create: async () => { throw new Error("unused"); } } } as unknown as NativeOpenAiClient,
        generateDiagram: async () => {
          throw new AiProviderRateLimitedError(429);
        },
      },
    ),
    (error: unknown) =>
      error instanceof AiProviderRateLimitedError &&
      error.code === "ai_provider_rate_limited",
  );
});

/** A grounded retrieval whose concepts are entirely off the problem domain. */
function offDomainRetrieval(): RetrievalResult {
  return {
    ...groundedRetrieval(),
    finalConcepts: [
      groundedConcept("fixtures/tender-publication", "design-objective", "Publish structured tender notices", 10),
      groundedConcept("fixtures/supplier-qualification", "design-principle", "Qualify suppliers before onboarding", 9),
      groundedConcept("fixtures/invoice-settlement", "design-feature", "Automated invoice settlement ledger", 8),
    ],
  };
}

test("deriveNativeOkfSynthesisClarification is generic, grounded, and bounded", () => {
  const retrieval = groundedRetrieval();
  const round0 = deriveNativeOkfSynthesisClarification({
    problem: SYNTHESIS_QUESTION,
    displayProblem: "Selective disclosure of identity credentials across independent platforms",
    retrieval,
    validationReason: "plan:conversion-invalid",
    round: 0,
    priorConstraints: [],
  });
  assert.ok(round0);
  assert.equal(round0?.missingDimension, "primary sub-problem");
  assert.ok((round0?.candidateOptions.length ?? 0) >= 2);
  assert.equal(round0?.evidenceScope, "retrieval");
  assert.match(round0?.question ?? "", /Shared identity requirement/u);
  // The off-domain concept is never promoted into the options.
  assert.doesNotMatch(round0?.question ?? "", /marketplace offer record/iu);

  const round1 = deriveNativeOkfSynthesisClarification({
    problem: SYNTHESIS_QUESTION,
    displayProblem: null,
    retrieval,
    validationReason: null,
    round: 1,
    priorConstraints: ["mainly the identity part"],
  });
  assert.ok(round1);
  assert.notEqual(round1?.question, round0?.question);

  // No usable problem statement AND no grounded evidence -> no fabricated question.
  const empty = deriveNativeOkfSynthesisClarification({
    problem: "",
    displayProblem: null,
    retrieval: {
      ...retrieval,
      finalConcepts: retrieval.finalConcepts.slice(0, 1),
    },
    validationReason: null,
    round: 0,
    priorConstraints: [],
  });
  assert.equal(empty, null);
});

test("a single off-domain retrieval hit never redefines the clarification subject", () => {
  const need = deriveNativeOkfSynthesisClarification({
    problem: "trusted identity exchange across organizations",
    displayProblem: "Trusted identity exchange across organizations",
    retrieval: {
      ...offDomainRetrieval(),
      finalConcepts: [
        groundedConcept("fixtures/identity-signal", "design-principle", "Signal identity-relevant attributes", 10),
        groundedConcept("fixtures/tender-create", "design-feature", "Create a tender", 9),
        groundedConcept("fixtures/tender-distribute", "design-feature", "Distribute information relevant to tender", 8),
      ],
    },
    validationReason: "plan:conversion-invalid",
    round: 0,
    priorConstraints: [],
  });
  assert.ok(need);
  // Only one concept is on-domain, so the follow-up stays problem-centred.
  assert.equal(need?.evidenceScope, "problem");
  assert.equal(need?.candidateOptions.length, 0);
  assert.doesNotMatch(need?.question ?? "", /tender/iu);
  // ...and it is anchored to the researcher's own problem wording.
  assert.match(need?.question ?? "", /identity exchange/iu);
  assert.match(need?.question ?? "", /\?$/u);
});

test("wholly off-domain retrieval falls back to a problem-centred follow-up in every round", () => {
  const problem =
    "Design a flow for cross-border humanitarian aid disbursement to unbanked recipients.";
  for (const round of [0, 1, 2] as const) {
    const need = deriveNativeOkfSynthesisClarification({
      problem,
      displayProblem: "Cross-border humanitarian aid disbursement to unbanked recipients",
      retrieval: offDomainRetrieval(),
      validationReason: null,
      round,
      priorConstraints: [],
    });
    assert.ok(need, `round ${round} should still ask a follow-up`);
    assert.equal(need?.evidenceScope, "problem", `round ${round}`);
    assert.equal(need?.candidateOptions.length, 0, `round ${round}`);
    assert.doesNotMatch(
      need?.question ?? "",
      /tender|supplier|invoice/iu,
      `round ${round} imported an off-domain noun`,
    );
    assert.match(need?.question ?? "", /humanitarian aid disbursement/iu, `round ${round}`);
  }
});

test("strongly relevant retrieved evidence still informs the follow-up options", () => {
  const need = deriveNativeOkfSynthesisClarification({
    problem: "Enable selective disclosure of identity attributes between independent verifiers.",
    displayProblem: "Selective disclosure of identity attributes between verifiers",
    retrieval: {
      ...groundedRetrieval(),
      finalConcepts: [
        groundedConcept("fixtures/selective-disclosure", "design-principle", "Selective disclosure of attributes", 10),
        groundedConcept("fixtures/identity-minimization", "design-requirement", "Identity attribute minimization", 9),
        groundedConcept("fixtures/verifier-anchor", "design-feature", "Verifier trust anchor registry", 8),
      ],
    },
    validationReason: "plan:conversion-invalid",
    round: 0,
    priorConstraints: [],
  });
  assert.ok(need);
  assert.equal(need?.evidenceScope, "retrieval");
  assert.ok((need?.candidateOptions.length ?? 0) >= 2);
  assert.match(
    need?.question ?? "",
    /Selective disclosure of attributes|Identity attribute minimization/u,
  );
});

test("an off-domain-guarded clarification still resumes the original problem on a brief answer", async () => {
  const noisyRetrieval: RetrievalResult = {
    ...groundedRetrieval(),
    finalConcepts: [
      groundedConcept("fixtures/identity-continuity", "design-requirement", "Maintain identity continuity across contexts", 10),
      groundedConcept("fixtures/tender-award", "design-objective", "Award tenders to qualified suppliers", 9),
      groundedConcept("fixtures/invoice-audit", "design-feature", "Audit invoice settlement trails", 8),
    ],
  };
  const originalQuestion =
    "Generate a design flow for cross-organizational identity verification without a central registry.";

  const first = await answerNativeOkfChat(
    { question: originalQuestion, includeDiagram: true },
    {
      retrieve: async () => noisyRetrieval,
      environment: ENVIRONMENT,
      client: { responses: { create: async () => { throw new Error("no model call expected"); } } } as unknown as NativeOpenAiClient,
      generateDiagram: async () => ({
        warnings: ["synthesis plan invalid after one bounded repair (plan:conversion-invalid)"],
        diagnosticCode: "synthesis-plan-repair-failed" as const,
      }),
    },
  );

  assert.equal(first.kind, "clarification");
  assert.equal(first.clarification?.kind, "synthesis-constraint");
  const firstQuestion = first.clarification?.question ?? "";
  assert.doesNotMatch(firstQuestion, /tender|supplier|invoice/iu);
  assert.match(firstQuestion, /identity verification|identity/iu);
  assert.ok(
    first.conversationState?.pendingClarification?.originalQuestion.includes(
      "cross-organizational identity verification",
    ),
  );
  assert.equal(first.conversationState?.synthesisClarificationRounds, 1);

  let retriedProblem = "";
  const resumed = await answerNativeOkfChat(
    {
      question: "start with the verification step",
      history: [
        { role: "user", content: originalQuestion },
        { role: "assistant", content: firstQuestion },
      ],
      conversationState: first.conversationState,
      includeDiagram: true,
    },
    {
      retrieve: async () => noisyRetrieval,
      environment: ENVIRONMENT,
      client: { responses: { create: async () => { throw new Error("no model call expected"); } } } as unknown as NativeOpenAiClient,
      generateDiagram: async (input) => {
        retriedProblem = input.synthesisProblem ?? input.question;
        return {
          warnings: ["synthesis plan invalid after one bounded repair (plan:conversion-invalid)"],
          diagnosticCode: "synthesis-plan-repair-failed" as const,
        };
      },
    },
  );

  assert.match(retriedProblem, /cross-organizational identity verification/iu);
  assert.equal(resumed.kind, "clarification");
  assert.equal(resumed.conversationState?.synthesisClarificationRounds, 2);
  assert.ok(
    resumed.conversationState?.lastSynthesisProblem?.problemStatement.includes(
      "cross-organizational identity verification",
    ),
  );
});
