import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import {
  loadNativeOkfConversationCatalog,
  prepareNativeOkfChatRequest,
} from "../server/conversation.ts";
import {
  answerNativeOkfChat,
  assertUniqueSourceIds,
  validateNativeOkfChatRequest,
} from "../server/openai/chat.ts";
import {
  handlePublicNativeOkfChat,
  resetPublicNativeOkfChatConcurrencyForTests,
} from "../server/public-chat.ts";
import type { NativeOkfChatResponse } from "../shared/chat-types.ts";
import { buildStoredPaperDesignMap } from "../server/openai/stored-source-map.ts";
import { buildPaperDesignMapFromBundle } from "../server/paper-design-map.ts";
import { getOkfBundle } from "../server/cache.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import type { NativeOkfDiagramGrounding } from "../server/openai/diagram-grounding.ts";
import {
  convertNativeOkfSynthesisPlan,
  deterministicNativeOkfSynthesisSummary,
  type SynthesisPlan,
} from "../server/openai/synthesis-plan.ts";

/**
 * Regression coverage for the source-ID / stored-map / synthesis-problem-label
 * fixes (spec sections 1-3). Every subject here is sampled from the live
 * 34-paper corpus at test time — never a hardcoded paper title, slug, author,
 * or literal evaluation prompt. The one exception is a small set of generic
 * natural-language synthesis phrasings in section E, which are deliberately
 * generic domain sentences (no specific paper/example named), matching the
 * project's own anti-hardcoding contract for regression fixtures.
 */

const catalogFixture = (async () => loadNativeOkfConversationCatalog())();

const MOCK_ENVIRONMENT: NativeOpenAiEnvironment = {
  apiKey: "mock-only-not-a-live-key",
  model: "mock-model",
  reasoningEffort: "low",
  moderationEnabled: false,
  maxOutputTokens: 900,
  diagramMaxOutputTokens: 4_096,
};

function collectStrings(value: unknown, acc: string[]): void {
  if (typeof value === "string") {
    acc.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, acc);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, acc);
  }
}

/** Extracts every `<OKF_SOURCE id="S..." path="...">` marker the real prompt
 * builder emits, so a mock model can cite exactly the source IDs it was
 * actually given without the test hardcoding any of them. Collects raw
 * string values first (rather than JSON.stringify-ing the whole input) so
 * the markers' own quote characters are never escaped out from under the
 * regex. */
function promptSourceEntries(
  input: unknown,
): { sourceId: string; conceptId: string }[] {
  const strings: string[] = [];
  collectStrings(input, strings);
  const text = strings.join("\n");
  const pattern = /<OKF_SOURCE id="([^"]+)" path="([^"]+)"/gu;
  const entries: { sourceId: string; conceptId: string }[] = [];
  for (const match of text.matchAll(pattern)) {
    entries.push({ sourceId: match[1]!, conceptId: match[2]! });
  }
  return entries;
}

/** A mock client whose answer text cites real source IDs from whatever
 * context it was actually given, so citation-integrity checks are meaningful
 * without the test needing to know the corpus's exact concept IDs. */
function citingMockClient(build: (entries: ReturnType<typeof promptSourceEntries>) => string): NativeOpenAiClient {
  return {
    responses: {
      create: async (params: { input?: unknown }) => {
        const entries = promptSourceEntries(params?.input);
        const text = build(entries);
        return {
          id: "mock-response",
          object: "response",
          created_at: 0,
          model: "mock-model",
          output: [],
          output_text: text,
          status: "completed",
        } as unknown as import("openai/resources/responses/responses").Response;
      },
    },
    moderations: {
      create: async () => ({ results: [{ flagged: false }] }) as never,
    },
  };
}

function defaultCitingMockClient(): NativeOpenAiClient {
  return citingMockClient((entries) => {
    if (entries.length === 0) return "No sources were available in context.";
    const first = entries[0]!;
    const second = entries[Math.min(1, entries.length - 1)]!;
    return `This answer discusses ${first.sourceId} and, where relevant, ${second.sourceId}. [[${first.sourceId}]] [[${second.sourceId}]]`;
  });
}

function extractCitedSourceIds(answerMarkdown: string): string[] {
  const ids: string[] = [];
  for (const match of answerMarkdown.matchAll(/\[\[(S\d+)\]\]/gu)) {
    ids.push(match[1]!);
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Section A: source-ID uniqueness across every mode
// ---------------------------------------------------------------------------

test("source-ID uniqueness: stored-paper QA (diagram on) has zero duplicate source IDs", async () => {
  const catalog = await catalogFixture;
  const paper = catalog.papers[10]!;
  const result = await answerNativeOkfChat(
    {
      question: `What design principles are represented in "${paper.title}", and how are they related?`,
      includeDiagram: true,
    },
    { environment: MOCK_ENVIRONMENT, client: defaultCitingMockClient() },
  );
  const ids = result.sources.map((source) => source.sourceId);
  assert.equal(new Set(ids).size, ids.length, `duplicate source IDs: ${ids.join(", ")}`);
});

test("source-ID uniqueness: comparison (diagram on) has zero duplicate source IDs", async () => {
  const catalog = await catalogFixture;
  const a = catalog.papers[1]!;
  const b = catalog.papers[15]!;
  const result = await answerNativeOkfChat(
    {
      question: `Compare "${a.title}" and "${b.title}", focusing on their represented design knowledge, differences, and reusable mechanisms.`,
      includeDiagram: true,
    },
    { environment: MOCK_ENVIRONMENT, client: defaultCitingMockClient() },
  );
  const ids = result.sources.map((source) => source.sourceId);
  assert.equal(new Set(ids).size, ids.length, `duplicate source IDs: ${ids.join(", ")}`);
});

test("source-ID uniqueness: synthesis with an unusable plan opens a grounded follow-up with no duplicate source IDs", async () => {
  // The prose-only mock never returns a valid structured plan, so a real corpus
  // synthesis request now becomes a grounded clarification rather than a
  // terminal error. Its source set is empty and therefore trivially unique.
  const result = await answerNativeOkfChat(
    {
      question: "How do I solve cross-organizational credential portability for gig-economy platforms? Explain with a diagram.",
      includeDiagram: true,
    },
    { environment: MOCK_ENVIRONMENT, client: defaultCitingMockClient() },
  );
  assert.equal(result.kind, "clarification");
  assert.equal(result.clarification?.kind, "synthesis-constraint");
  assert.equal(result.diagram, undefined);
  const ids = result.sources.map((source) => source.sourceId);
  assert.equal(new Set(ids).size, ids.length, `duplicate source IDs: ${ids.join(", ")}`);
  assertUniqueSourceIds(result);
});

test("source-ID uniqueness: a follow-up answer to a synthesis clarification keeps unique source IDs", async () => {
  const first = await answerNativeOkfChat(
    {
      question: "How do I solve cross-organizational credential portability for gig-economy platforms? Explain with a diagram.",
      includeDiagram: true,
    },
    { environment: MOCK_ENVIRONMENT, client: defaultCitingMockClient() },
  );
  assert.equal(first.kind, "clarification");
  const refined = await answerNativeOkfChat(
    {
      question: "Focus on identity portability first.",
      history: [
        {
          role: "user",
          content: "How do I solve cross-organizational credential portability for gig-economy platforms? Explain with a diagram.",
        },
        { role: "assistant", content: first.clarification?.question ?? "" },
      ],
      includeDiagram: true,
      conversationState: first.conversationState,
    },
    { environment: MOCK_ENVIRONMENT, client: defaultCitingMockClient() },
  );
  const ids = refined.sources.map((source) => source.sourceId);
  assert.equal(new Set(ids).size, ids.length, `duplicate source IDs: ${ids.join(", ")}`);
  assertUniqueSourceIds(refined);
});

// ---------------------------------------------------------------------------
// Section B: citation referential integrity
// ---------------------------------------------------------------------------

test("citation referential integrity: every [[S#]] in answerMarkdown resolves to exactly one source", async () => {
  const catalog = await catalogFixture;
  const paper = catalog.papers[3]!;
  const result = await answerNativeOkfChat(
    {
      question: `What design principles are represented in "${paper.title}", and how are they related?`,
      includeDiagram: true,
    },
    { environment: MOCK_ENVIRONMENT, client: defaultCitingMockClient() },
  );
  const cited = extractCitedSourceIds(result.answerMarkdown);
  assert.ok(cited.length > 0, "expected at least one citation in the mock answer");
  const sourcesById = new Map<string, number>();
  for (const source of result.sources) {
    sourcesById.set(source.sourceId, (sourcesById.get(source.sourceId) ?? 0) + 1);
  }
  for (const sourceId of cited) {
    assert.equal(sourcesById.get(sourceId), 1, `citation ${sourceId} must resolve to exactly one source`);
  }
});

// ---------------------------------------------------------------------------
// Section C: comparison paper grounding (15 corpus pairs)
// ---------------------------------------------------------------------------

test("comparison paper grounding: 15 corpus pairs keep every source attributable to its correct paper", async () => {
  const catalog = await catalogFixture;
  const papers = catalog.papers;
  let exercised = 0;
  for (let i = 0; i < 15; i += 1) {
    const a = papers[i % papers.length]!;
    const b = papers[(i + 13) % papers.length]!;
    if (a.slug === b.slug) continue;
    const result = await answerNativeOkfChat(
      {
        question: `Compare "${a.title}" and "${b.title}", focusing on their represented design knowledge, differences, and reusable mechanisms.`,
        includeDiagram: true,
      },
      { environment: MOCK_ENVIRONMENT, client: defaultCitingMockClient() },
    );
    const ids = result.sources.map((source) => source.sourceId);
    assert.equal(new Set(ids).size, ids.length, `${a.slug} vs ${b.slug}: duplicate source IDs`);
    // Every source card must declare (via conceptId prefix or sourcePaper) a
    // paper that is actually one of the two resolved papers -- never a third,
    // unrelated paper, and never left ambiguous between the two.
    const allowedPaperTitles = new Set([a.title, b.title]);
    for (const source of result.sources) {
      if (source.type === "paper") {
        assert.ok(
          allowedPaperTitles.has(source.title),
          `${a.slug} vs ${b.slug}: unexpected paper-level source "${source.title}"`,
        );
        continue;
      }
      if (source.sourcePaper) {
        assert.ok(
          allowedPaperTitles.has(source.sourcePaper),
          `${a.slug} vs ${b.slug}: source ${source.sourceId} claims sourcePaper "${source.sourcePaper}" outside the compared pair`,
        );
      }
    }
    exercised += 1;
  }
  assert.ok(exercised >= 10, `expected at least 10 exercised pairs, got ${exercised}`);
});

// ---------------------------------------------------------------------------
// Section D: full stored paper map completeness
// ---------------------------------------------------------------------------

test("full stored paper map: ordinary topic-scoped QA + diagram returns the complete canonical stored graph", async () => {
  const catalog = await catalogFixture;
  const bundle = await getOkfBundle();
  let exercised = 0;
  for (const paper of catalog.papers) {
    const concept = bundle.conceptsById.get(paper.conceptId);
    if (!concept) continue;
    const canonical = buildPaperDesignMapFromBundle(bundle, concept);
    const canonicalDisplayNodeCount = canonical.nodes.filter((node) => {
      const nodeConcept = bundle.conceptsById.get(node.id);
      return nodeConcept && nodeConcept.type !== "paper" && nodeConcept.type !== "reference";
    }).length;
    if (canonicalDisplayNodeCount === 0) continue;

    const question = `What design principles are represented in "${paper.title}", and how are they related?`;
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question, includeDiagram: true }),
      catalog,
    );
    assert.equal(prepared.turnPlan.mode, "STORED_FULL_MAP", paper.slug);
    assert.deepEqual(prepared.turnPlan.diagramConceptKinds, [], paper.slug);
    const built = await buildStoredPaperDesignMap(paper.conceptId, prepared.turnPlan.diagramConceptKinds);
    assert.ok(built, `${paper.slug}: expected a built map`);
    const fullMap = await buildStoredPaperDesignMap(paper.conceptId, []);
    assert.ok(fullMap);
    assert.equal(built!.nodes.length, fullMap!.nodes.length, `${paper.slug}: node count must equal the canonical complete map`);
    assert.equal(built!.edges.length, fullMap!.edges.length, `${paper.slug}: edge count must equal the canonical complete map`);
    exercised += 1;
  }
  assert.ok(exercised >= 10, `expected at least 10 exercised papers, got ${exercised}`);
});

test("full stored paper map: an explicit \"only\" request still returns a filtered map", async () => {
  const catalog = await catalogFixture;
  const paper = catalog.papers.find((candidate) => candidate.slug === catalog.papers[10]!.slug)!;
  const question = `Show only the design principles for "${paper.title}".`;
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({ question, includeDiagram: true }),
    catalog,
  );
  assert.equal(prepared.turnPlan.mode, "STORED_FILTERED_MAP");
  assert.deepEqual(prepared.turnPlan.diagramConceptKinds, ["principle"]);
});

test("full stored paper map: provenance sentence never claims \"complete\" for a filtered map", async () => {
  const catalog = await catalogFixture;
  const paper = catalog.papers[10]!;
  const filteredResult = await answerNativeOkfChat(
    {
      question: `Show only the design principles for "${paper.title}".`,
      includeDiagram: true,
    },
    { environment: MOCK_ENVIRONMENT, client: defaultCitingMockClient() },
  );
  assert.doesNotMatch(filteredResult.answerMarkdown, /complete stored design-knowledge/iu);

  const fullResult = await answerNativeOkfChat(
    {
      question: `Show the complete design map including principles and features in "${paper.title}".`,
      includeDiagram: true,
    },
    { environment: MOCK_ENVIRONMENT, client: defaultCitingMockClient() },
  );
  assert.match(fullResult.answerMarkdown, /complete stored design-knowledge/iu);
});

// ---------------------------------------------------------------------------
// Section E: synthesis problem label
// ---------------------------------------------------------------------------

// The first entry deliberately mirrors the exact phrasing from the reported
// production defect, as a clearly-labeled regression fixture; every other
// entry is a generic, freshly-written natural-language domain sentence.
const NATURAL_SYNTHESIS_PROMPTS = [
  "Help me with the product fragmentation problem in ecommerce marketplaces. How do I solve this problem? Explain with a diagram.",
  "how do i solve poor consent interoperability across hospitals",
  "help me design a wallet with account abstraction",
  "can u make a system for trusted IoT data exchange",
  "How do I solve trust establishment across independent supply-chain participants? Show a diagram.",
  "I want to build a system that solves cross-border payment reconciliation. How should I design this?",
  "please help me with inventory visibility across distributors, how do i solve this, explain with diagram",
  "how can we solve fragmented identity verification across partner organizations",
  "can you build a tool for auditable data-sharing agreements",
  "help me with credential revocation across issuers, how do i solve this problem",
  "how should i design a marketplace dispute-resolution flow",
  "make a system for privacy-preserving location sharing",
  "I have a new problem: onboarding friction across regulated exchanges. How do I solve it? Show a diagram.",
  "can u help me solve inconsistent inventory counts between warehouses",
  "how do we solve supplier trust verification for cross-border sourcing",
];

function minimalSynthesisGrounding(): NativeOkfDiagramGrounding {
  const concepts = [
    { conceptId: "fixture/r1", title: "Canonical requirement one", description: "Canonical requirement description one.", type: "design-requirement", stage: "design-requirement" as const },
    { conceptId: "fixture/r2", title: "Canonical requirement two", description: "Canonical requirement description two.", type: "design-requirement", stage: "design-requirement" as const },
    { conceptId: "fixture/p1", title: "Canonical principle one", description: "Canonical principle description one.", type: "design-principle", stage: "design-principle" as const },
    { conceptId: "fixture/p2", title: "Canonical principle two", description: "Canonical principle description two.", type: "design-principle", stage: "design-principle" as const },
    { conceptId: "fixture/f1", title: "Canonical feature one", description: "Canonical feature description one.", type: "design-feature", stage: "design-feature" as const },
    { conceptId: "fixture/f2", title: "Canonical feature two", description: "Canonical feature description two.", type: "design-feature", stage: "design-feature" as const },
    { conceptId: "fixture/e1", title: "Canonical evaluation", description: "Canonical evaluation description.", type: "evaluation", stage: "evaluation" as const },
  ];
  const ids = new Set(concepts.map((concept) => concept.conceptId));
  return {
    allowedConceptIds: ids,
    eligibleStoredConceptIds: ids,
    conceptsById: new Map(concepts.map((concept) => [concept.conceptId, concept])),
    storedRelations: [
      { sourceId: "fixture/r1", targetId: "fixture/p1", label: "addressed by" },
      { sourceId: "fixture/p1", targetId: "fixture/f1", label: "implemented by" },
    ],
  };
}

function minimalSynthesisPlan(problemLabel: string): SynthesisPlan {
  return {
    // A proposal title may be solution-oriented; only `problemLabel` reaches
    // the Problem node.
    title: "Cross-marketplace identity exchange proposal",
    problemLabel,
    problemSummary: "unused: production always overwrites this with the raw problem statement",
    supportingStoredConceptIds: [
      "fixture/r1", "fixture/r2", "fixture/p1", "fixture/p2", "fixture/f1", "fixture/f2", "fixture/e1",
    ],
    coverageRationale: "Uses all stored concepts selected for the proposal fixture.",
    requirements: [
      { key: "requirement-one", label: "Preserve identity continuity across marketplaces", description: "Keep a product identity coherent across independent marketplaces.", supportConceptIds: ["fixture/r1"] },
      { key: "requirement-two", label: "Preserve accountable continuity", description: "Maintain continuity while bounding disclosure.", supportConceptIds: ["fixture/r2"] },
    ],
    principles: [
      { key: "principle-one", label: "Anchor identity to a portable verifiable claim", description: "Bind identity to a claim any marketplace can verify independently.", supportConceptIds: ["fixture/p1"] },
      { key: "principle-two", label: "Minimize disclosed context", description: "Reveal only the context required for the decision.", supportConceptIds: ["fixture/p2"] },
    ],
    features: [
      { key: "feature-one", label: "Portable identity credential", description: "A signed, verifiable identity credential a product carries between marketplaces.", supportConceptIds: ["fixture/f1"] },
      { key: "feature-two", label: "Selective continuity proof", description: "Provide a bounded proof without exposing unrelated history.", supportConceptIds: ["fixture/f2"] },
    ],
    artifact: [{ key: "artifact-one", label: "Cross-marketplace identity exchange", description: "A service that issues and verifies portable identity credentials.", supportConceptIds: ["fixture/r1", "fixture/f2"] }],
    evaluation: [{ key: "evaluation-one", label: "Evaluate continuity and privacy", description: "Measure continuity preservation and unnecessary disclosure.", supportConceptIds: ["fixture/e1"] }],
    outcome: [],
    relationships: [
      { id: "e1", sourceKey: "problem", targetKey: "requirement-one", relationshipType: "motivates", rationale: "The problem motivates the requirement.", supportConceptIds: ["fixture/r1"] },
      { id: "e2", sourceKey: "problem", targetKey: "requirement-two", relationshipType: "motivates", rationale: "The problem motivates the requirement.", supportConceptIds: ["fixture/r2"] },
      { id: "e3", sourceKey: "requirement-one", targetKey: "principle-one", relationshipType: "addressed by", rationale: "The principle addresses the requirement.", supportConceptIds: ["fixture/r1", "fixture/p1"] },
      { id: "e4", sourceKey: "requirement-two", targetKey: "principle-two", relationshipType: "addressed by", rationale: "The principle addresses the requirement.", supportConceptIds: ["fixture/r2", "fixture/p2"] },
      { id: "e5", sourceKey: "principle-one", targetKey: "feature-one", relationshipType: "implemented by", rationale: "The feature implements the principle.", supportConceptIds: ["fixture/p1", "fixture/f1"] },
      { id: "e6", sourceKey: "principle-two", targetKey: "feature-two", relationshipType: "implemented by", rationale: "The feature implements the principle.", supportConceptIds: ["fixture/p2", "fixture/f2"] },
      { id: "e7", sourceKey: "feature-one", targetKey: "artifact-one", relationshipType: "instantiated in", rationale: "The feature composes the artifact.", supportConceptIds: ["fixture/f1"] },
      { id: "e8", sourceKey: "feature-two", targetKey: "artifact-one", relationshipType: "instantiated in", rationale: "The feature composes the artifact.", supportConceptIds: ["fixture/f2"] },
      { id: "e9", sourceKey: "artifact-one", targetKey: "evaluation-one", relationshipType: "evaluated by", rationale: "The evaluation tests the artifact.", supportConceptIds: ["fixture/e1"] },
    ],
  };
}

test("synthesis problem label: 15 natural-human prompts yield a clean, non-boilerplate label reused everywhere (no model title -- deterministic fallback)", () => {
  const grounding = minimalSynthesisGrounding();
  let exercised = 0;
  for (const question of NATURAL_SYNTHESIS_PROMPTS) {
    // problemLabel: "" forces resolveSynthesisProblemLabel through the
    // deterministic fallback (normalizeSynthesisProblemDisplay), exercising the
    // same conservative cleanup path production falls back to when no
    // model-produced problem label is available.
    const plan = minimalSynthesisPlan("");
    const converted = convertNativeOkfSynthesisPlan(plan, grounding, question);
    assert.ok(converted, question);
    const problemNode = converted!.diagram.nodes.find((node) => node.stage === "problem");
    assert.ok(problemNode, `${question}: expected a user-problem node`);
    const label = problemNode!.label;

    assert.notEqual(label.trim(), "", question);
    assert.doesNotMatch(label, /^with the/iu, question);
    assert.doesNotMatch(label, /how do i solve this/iu, question);
    assert.doesNotMatch(label, /explain with diagram/iu, question);

    // The same label must be reused identically in the diagram title...
    assert.ok(
      converted!.diagram.title.includes(label),
      `${question}: diagram title "${converted!.diagram.title}" must reuse the problem label "${label}"`,
    );
    // ...and in the deterministic summary.
    const summary = deterministicNativeOkfSynthesisSummary(plan, converted!.diagram);
    assert.ok(
      summary.toLowerCase().includes(label.toLowerCase().split(" ").slice(0, 5).join(" ")),
      `${question}: deterministicSummary "${summary}" must reuse the problem label "${label}"`,
    );
    exercised += 1;
  }
  assert.equal(exercised, NATURAL_SYNTHESIS_PROMPTS.length);
});

// ---------------------------------------------------------------------------
// Section F: production duplicate-source invariant fails closed
// ---------------------------------------------------------------------------

function duplicateIdResponse(): NativeOkfChatResponse {
  return {
    kind: "answer",
    presentationMode: "text-primary",
    answerMarkdown: "Paper A claims [[S1]]. Paper B claims [[S2]].",
    sources: [
      { sourceId: "S1", conceptId: "paper-a/principle-one", title: "Paper A principle", type: "principle" },
      { sourceId: "S2", conceptId: "paper-a/feature-one", title: "Paper A feature", type: "feature" },
      // Independently-numbered second scheme that collides with the first.
      { sourceId: "S1", conceptId: "paper-b/principle-one", title: "Paper B principle", type: "principle" },
      { sourceId: "S2", conceptId: "paper-b/feature-one", title: "Paper B feature", type: "feature" },
    ],
    diagramMode: null,
    diagramStatus: null,
    insufficientContext: false,
  };
}

function uniqueIdResponse(): NativeOkfChatResponse {
  const response = duplicateIdResponse();
  return {
    ...response,
    sources: response.sources.map((source, index) => ({
      ...source,
      sourceId: `S${index + 1}`,
    })),
  };
}

function withNodeEnv<T>(value: string, run: () => T): T {
  const mutableEnvironment = process.env as Record<string, string | undefined>;
  const original = mutableEnvironment.NODE_ENV;
  mutableEnvironment.NODE_ENV = value;
  try {
    return run();
  } finally {
    if (original === undefined) delete mutableEnvironment.NODE_ENV;
    else mutableEnvironment.NODE_ENV = original;
  }
}

test("duplicate-source invariant: assertUniqueSourceIds throws on a duplicated ID scheme in every environment", () => {
  for (const environment of ["development", "test", "production"]) {
    withNodeEnv(environment, () => {
      assert.throws(
        () => assertUniqueSourceIds(duplicateIdResponse()),
        /duplicate source IDs/iu,
        `NODE_ENV=${environment} must fail closed, not log-and-serve`,
      );
    });
  }
});

test("duplicate-source invariant: assertUniqueSourceIds passes an already-unique source set", () => {
  withNodeEnv("production", () => {
    assert.doesNotThrow(() => assertUniqueSourceIds(uniqueIdResponse()));
  });
});

test("duplicate-source invariant: an ambiguous response cannot be serialized out of the public chat route", async () => {
  resetPublicNativeOkfChatConcurrencyForTests();
  // Mirrors answerNativeOkfChat's own structure: build the response, then run
  // the defense-in-depth assertion before it can be returned. A duplicate ID
  // condition must surface as a handled non-200 error, never as a 200 whose
  // body carries the ambiguous source list.
  const result = await handlePublicNativeOkfChat(
    new Request("https://library.example/api/native-okf/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://library.example",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify({ question: "Compare paper A and paper B.", includeDiagram: true }),
    }),
    {
      environment: {},
      answer: async () => {
        const response = duplicateIdResponse();
        assertUniqueSourceIds(response);
        return response;
      },
    },
  );

  assert.notEqual(result.status, 200);
  const payload = (await result.json()) as Record<string, unknown>;
  assert.equal("sources" in payload, false, "ambiguous source list must not leave the server");
  assert.equal(typeof payload.error, "string");
});

test("duplicate-source invariant: a unique-ID response still serializes normally through the route", async () => {
  resetPublicNativeOkfChatConcurrencyForTests();
  const result = await handlePublicNativeOkfChat(
    new Request("https://library.example/api/native-okf/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://library.example",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify({ question: "Compare paper A and paper B.", includeDiagram: true }),
    }),
    {
      environment: {},
      answer: async () => {
        const response = uniqueIdResponse();
        assertUniqueSourceIds(response);
        return response;
      },
    },
  );

  assert.equal(result.status, 200);
  const payload = (await result.json()) as { sources: { sourceId: string }[] };
  const ids = payload.sources.map((source) => source.sourceId);
  assert.equal(new Set(ids).size, ids.length);
});

test("synthesis problem label: a model-produced problem label wins over the raw question", () => {
  const grounding = minimalSynthesisGrounding();
  const modelProblemLabel = "Credential portability breaks across gig platforms";
  const plan = minimalSynthesisPlan(modelProblemLabel);
  const converted = convertNativeOkfSynthesisPlan(
    plan,
    grounding,
    "help me with credential portability across gig platforms, how do i solve this, explain with diagram",
  );
  assert.ok(converted);
  const problemNode = converted!.diagram.nodes.find((node) => node.stage === "problem");
  assert.equal(problemNode?.label, modelProblemLabel);
  // The solution-oriented proposal title never reaches the Problem node.
  assert.notEqual(problemNode?.label, plan.title);
  assert.ok(converted!.diagram.title.includes(modelProblemLabel));
  const summary = deterministicNativeOkfSynthesisSummary(plan, converted!.diagram);
  assert.ok(summary.toLowerCase().includes(modelProblemLabel.toLowerCase()));
});
