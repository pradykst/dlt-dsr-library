import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import {
  loadNativeOkfConversationCatalog,
  prepareNativeOkfChatRequest,
} from "../server/conversation.ts";
import {
  answerNativeOkfChat,
  validateNativeOkfChatRequest,
} from "../server/openai/chat.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import {
  createInitialNativeOkfConversationState,
  type NativeOkfConversationState,
} from "../shared/chat-types.ts";

/**
 * Regression coverage for the turn-mode / text-diagram coherence fixes (spec
 * sections 2, 3, 6, 8, 11). Every subject here is sampled from the live 34-paper
 * corpus at test time or is a generic domain word explicitly named by the
 * project's own behavioral contract (e.g. "privacy", "IoT") — never a hardcoded
 * paper title, slug, author, or literal evaluation prompt.
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

function mockAnswerClient(text: string): NativeOpenAiClient {
  return {
    responses: {
      create: async () => ({
        id: "mock-response",
        object: "response",
        created_at: 0,
        model: "mock-model",
        output: [],
        output_text: text,
        status: "completed",
      }) as unknown as import("openai/resources/responses/responses").Response,
    },
    moderations: {
      create: async () => ({ results: [{ flagged: false }] }) as never,
    },
  };
}

// ---------------------------------------------------------------------------
// Section 8: diagram toggle contract (table-driven)
// ---------------------------------------------------------------------------

test("diagram toggle contract: STORED_PAPER_QA off => no diagram, on => RENDER_STORED", async () => {
  const catalog = await catalogFixture;
  const paper = catalog.papers[0]!;
  const off = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: `What design principles are represented in "${paper.title}"?`,
    }),
    catalog,
  );
  assert.equal(off.turnPlan.diagramAction, "NONE");
  assert.equal(off.turnPlan.includeDiagram, false);

  const on = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: `Show the full design map for "${paper.title}".`,
      includeDiagram: true,
    }),
    catalog,
  );
  assert.equal(on.turnPlan.mode, "STORED_FULL_MAP");
  assert.equal(on.turnPlan.diagramAction, "RENDER_STORED");
  assert.equal(on.turnPlan.includeDiagram, true);
});

test("diagram toggle contract: STORED_COMPARISON off => prose-only, on => RENDER_STORED comparison map", async () => {
  const catalog = await catalogFixture;
  const [first, second] = catalog.papers;
  assert.ok(first && second);
  const off = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: `Compare "${first.title}" and "${second.title}".`,
    }),
    catalog,
  );
  assert.equal(off.turnPlan.diagramAction, "NONE");
  assert.notEqual(off.turnPlan.mode, "STORED_COMPARISON_MAP");

  const on = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: `Compare "${first.title}" and "${second.title}".`,
      includeDiagram: true,
    }),
    catalog,
  );
  assert.equal(on.turnPlan.mode, "STORED_COMPARISON_MAP");
  assert.equal(on.turnPlan.diagramAction, "RENDER_STORED");
});

test("diagram toggle contract: DESIGN_SYNTHESIS off => synthesis prose only, on => RENDER_NEW_SYNTHESIS", async () => {
  const off = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "How do I solve consent management across independent healthcare providers?",
    }),
  );
  assert.equal(off.turnPlan.mode, "DESIGN_SYNTHESIS");
  assert.equal(off.turnPlan.diagramAction, "NONE");

  const on = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "How do I solve consent management across independent healthcare providers?",
      includeDiagram: true,
    }),
  );
  assert.equal(on.turnPlan.mode, "DESIGN_SYNTHESIS");
  assert.equal(on.turnPlan.diagramAction, "RENDER_NEW_SYNTHESIS");
});

test("diagram toggle contract: CLARIFICATION and SCOPE_GUARDRAIL never carry a diagram", async () => {
  const clarification = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({ question: "show me the map", includeDiagram: true }),
  );
  assert.equal(clarification.clarification?.kind, "missing-domain");
  assert.equal(clarification.turnPlan.diagramAction, "NONE");
  assert.equal(clarification.turnPlan.includeDiagram, false);

  const guardrail = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "What is today's weather forecast?",
      includeDiagram: true,
    }),
  );
  assert.equal(guardrail.turnPlan.mode, "SCOPE_GUARDRAIL");
  assert.equal(guardrail.turnPlan.diagramAction, "NONE");
});

// ---------------------------------------------------------------------------
// Section 11.A + 11.B: all 34 stored papers never misroute; canonical titles intact
// ---------------------------------------------------------------------------

test("all corpus papers: a represented-principles question never routes to synthesis and keeps the complete canonical title", async () => {
  const catalog = await catalogFixture;
  assert.equal(catalog.papers.length, 34, "expected the full 34-paper corpus");
  for (const paper of catalog.papers) {
    const question = `What design principles are represented in "${paper.title}", and how are they related?`;
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question }),
      catalog,
    );
    assert.notEqual(prepared.intent, "synthesized-flow", paper.title);
    assert.equal(prepared.turnPlan.mode, "TEXT_QA", paper.title);
    assert.equal(prepared.focusedPaperSlugs[0], paper.slug, paper.title);
    // The canonical title must survive resolution completely, never clipped.
    assert.ok(
      prepared.effectiveQuestion.includes(paper.title),
      `expected the complete canonical title in the effective question for ${paper.title}`,
    );
  }
});

test("all corpus papers: diagram off keeps no diagram, diagram on resolves to the exact stored map", async () => {
  const catalog = await catalogFixture;
  for (const paper of catalog.papers) {
    const withDiagram = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({
        question: `Show the full design map for "${paper.title}".`,
        includeDiagram: true,
      }),
      catalog,
    );
    assert.equal(withDiagram.turnPlan.mode, "STORED_FULL_MAP", paper.title);
    assert.equal(withDiagram.turnPlan.diagramAction, "RENDER_STORED", paper.title);
    assert.equal(withDiagram.turnPlan.resolvedPaperSlug, paper.slug, paper.title);
  }
});

// ---------------------------------------------------------------------------
// Section 11.B (long-title property test)
// ---------------------------------------------------------------------------

test("long canonical titles are never substring-clipped in the resolved question or routing", async () => {
  const catalog = await catalogFixture;
  const longTitled = catalog.papers.filter((paper) => paper.title.length > 60);
  assert.ok(longTitled.length > 0, "expected at least one long-titled paper in the live corpus");
  for (const paper of longTitled) {
    const question = `What design requirements does "${paper.title}" define?`;
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question }),
      catalog,
    );
    assert.ok(prepared.effectiveQuestion.includes(paper.title), paper.title);
    assert.notEqual(prepared.intent, "synthesized-flow", paper.title);
    assert.equal(prepared.focusedPaperSlugs[0], paper.slug, paper.title);
  }
});

// ---------------------------------------------------------------------------
// Section 11.C: randomized comparisons
// ---------------------------------------------------------------------------

test("15 sampled paper pairs: comparison resolves exactly the intended two subjects with correct diagram toggling", async () => {
  const catalog = await catalogFixture;
  const papers = catalog.papers;
  assert.ok(papers.length >= 16, "expected enough papers to sample 15 spread-out pairs");
  let exercised = 0;
  for (let i = 0; i < 15; i += 1) {
    const a = papers[i % papers.length]!;
    const b = papers[(i + 7) % papers.length]!;
    if (a.slug === b.slug) continue;
    const templates = [
      `Compare "${a.title}" and "${b.title}", focusing on their represented design knowledge, differences, and reusable mechanisms.`,
      `How do "${a.title}" and "${b.title}" differ in their design principles?`,
    ];
    const question = templates[i % templates.length]!;

    const withoutDiagram = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question }),
      catalog,
    );
    assert.notEqual(withoutDiagram.intent, "synthesized-flow", question);
    assert.deepEqual(
      new Set(withoutDiagram.explicitPaperSlugs),
      new Set([a.slug, b.slug]),
      question,
    );
    assert.equal(withoutDiagram.turnPlan.diagramAction, "NONE", question);

    const withDiagram = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question, includeDiagram: true }),
      catalog,
    );
    assert.equal(withDiagram.turnPlan.mode, "STORED_COMPARISON_MAP", question);
    assert.equal(withDiagram.turnPlan.diagramAction, "RENDER_STORED", question);
    assert.deepEqual(
      new Set(withDiagram.turnPlan.resolvedPaperSlugs),
      new Set([a.slug, b.slug]),
      question,
    );
    exercised += 1;
  }
  assert.ok(exercised >= 10, `expected at least 10 exercised pairs, got ${exercised}`);
});

test("comparison with diagram enabled still produces real prose, not just the deterministic graph summary", async () => {
  const catalog = await catalogFixture;
  const [first, second] = catalog.papers;
  assert.ok(first && second);
  const question =
    `Compare "${first.title}" and "${second.title}", focusing on their represented design knowledge, important differences, and reusable mechanisms.`;
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({ question, includeDiagram: true }),
    catalog,
  );
  const realProse =
    "Paper one emphasizes decentralized control, while paper two emphasizes auditability; both share a requirement for tamper-evident records.";
  const response = await answerNativeOkfChat(
    { question, includeDiagram: true },
    { prepared, environment: MOCK_ENVIRONMENT, client: mockAnswerClient(realProse) },
  );
  assert.equal(response.diagramMode, "comparative");
  assert.equal(response.diagramStatus, "success");
  assert.ok(response.diagram);
  // The real generated prose must be present, not replaced by a bare "N concepts, M
  // relationships" sentence — the diagram is attached alongside it, not instead of it.
  assert.match(response.answerMarkdown, /decentralized control/iu);
  assert.doesNotMatch(response.answerMarkdown, /^This deterministic comparison keeps/u);
});

// ---------------------------------------------------------------------------
// Section 11.D: novel design problems across varied domains
// ---------------------------------------------------------------------------

const NOVEL_PROBLEM_DOMAINS = [
  "marketplace fragmentation",
  "identity interoperability",
  "consent management",
  "supply-chain traceability",
  "inter-organizational trust",
  "data privacy",
  "participant incentives",
  "IoT sensor integrity",
  "cross-platform data exchange",
  "credential verification",
];

test("10 novel design problems across varied domains route to DESIGN_SYNTHESIS with the correct diagram action", async () => {
  let exercised = 0;
  for (const domain of NOVEL_PROBLEM_DOMAINS) {
    const question =
      `I want to build a system that solves ${domain} for cross-organizational collaboration. How should I design this?`;
    const withoutDiagram = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question }),
    );
    assert.equal(withoutDiagram.turnPlan.mode, "DESIGN_SYNTHESIS", domain);
    assert.equal(withoutDiagram.turnPlan.diagramAction, "NONE", domain);
    assert.notEqual(withoutDiagram.turnPlan.mode, "STORED_FULL_MAP", domain);
    assert.notEqual(withoutDiagram.turnPlan.mode, "EVIDENCE_MAP", domain);

    const withDiagram = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question, includeDiagram: true }),
    );
    assert.equal(withDiagram.turnPlan.mode, "DESIGN_SYNTHESIS", domain);
    assert.equal(withDiagram.turnPlan.diagramAction, "RENDER_NEW_SYNTHESIS", domain);
    exercised += 1;
  }
  assert.equal(exercised, NOVEL_PROBLEM_DOMAINS.length);
});

test("bare \"how do I solve <domain>\" design-problem phrasing (no framework/new/across vocabulary) still routes to DESIGN_SYNTHESIS", async () => {
  // Regression: a minimal first-person "how do I solve X? Explain with a diagram."
  // request must not depend on the domain phrase itself containing an
  // output/novelty trigger word (e.g. "framework", "new", "across", "fragmented") —
  // the requester's own "how do I solve" / "help me solve" framing is signal enough.
  let exercised = 0;
  for (const domain of NOVEL_PROBLEM_DOMAINS) {
    const question = `How do I solve ${domain} for cross-organizational collaboration? Explain with a diagram.`;
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question, includeDiagram: true }),
    );
    assert.equal(prepared.turnPlan.mode, "DESIGN_SYNTHESIS", domain);
    assert.equal(prepared.turnPlan.diagramAction, "RENDER_NEW_SYNTHESIS", domain);
    exercised += 1;
  }
  assert.equal(exercised, NOVEL_PROBLEM_DOMAINS.length);
});

test("casual \"can u make a <artifact> for <domain>\" phrasing routes to DESIGN_SYNTHESIS, not a stored-paper match", async () => {
  // Regression: an imperative artifact-creation request ("make a system/tool/app for
  // X") must not fall through to a semantic-retrieval match against an existing
  // paper merely because it lacks output/novelty vocabulary elsewhere in the gate.
  const artifactPhrasings = [
    "can u make a system for consent management",
    "make a system for cross-organizational trust",
    "can you build a tool for supply-chain traceability",
    "please make an app for credential verification",
  ];
  for (const question of artifactPhrasings) {
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question, includeDiagram: true }),
    );
    assert.equal(prepared.turnPlan.mode, "DESIGN_SYNTHESIS", question);
    assert.equal(prepared.turnPlan.diagramAction, "RENDER_NEW_SYNTHESIS", question);
  }
});

// ---------------------------------------------------------------------------
// Section 11.E: equivalent phrasings resolve to the same authoritative turn mode
// ---------------------------------------------------------------------------

test("equivalent design-problem phrasings resolve to the same turn mode and diagram action", async () => {
  const phrasingGroups: readonly (readonly string[])[] = [
    [
      "help me with the product fragmentation problem in ecommerce marketplaces, how do i solve this problem explain with diagram",
      "help me with a problem that i have, product data is fragmented across marketplaces how do i solve this explain with diagram",
    ],
    [
      "How do I solve trust establishment across independent supply-chain participants? Show a diagram.",
      "I have a new problem: trust establishment across independent supply-chain participants. How do I solve it? Show a diagram.",
    ],
  ];
  for (const group of phrasingGroups) {
    const prepared = await Promise.all(
      group.map((question) =>
        prepareNativeOkfChatRequest(validateNativeOkfChatRequest({ question, includeDiagram: true }))
      ),
    );
    const modes = new Set(prepared.map((p) => p.turnPlan.mode));
    const actions = new Set(prepared.map((p) => p.turnPlan.diagramAction));
    assert.equal(modes.size, 1, `expected one consistent mode across: ${group.join(" | ")}`);
    assert.equal(actions.size, 1, `expected one consistent diagram action across: ${group.join(" | ")}`);
    assert.equal([...modes][0], "DESIGN_SYNTHESIS");
    assert.equal([...actions][0], "RENDER_NEW_SYNTHESIS");
  }
});

// ---------------------------------------------------------------------------
// Section 11.F: active-diagram QA never triggers a new diagram
// ---------------------------------------------------------------------------

async function activeSynthesisState(): Promise<NativeOkfConversationState> {
  return {
    ...createInitialNativeOkfConversationState(),
    lastIntent: "synthesized-flow",
    lastDiagramRequested: true,
    lastSynthesisProblem: {
      version: 1,
      problemStatement: "Fixture design problem for active-diagram QA.",
      displayProblem: "Fixture design problem for active-diagram QA.",
      domain: "fixture domain",
      objective: null,
      outputType: "design-solution",
      constraints: [],
      sourcePaperSlugs: [],
    },
    latestValidatedSynthesisDraft: {
      version: 1,
      problemStatement: "Fixture design problem for active-diagram QA.",
      domain: "fixture domain",
      objective: null,
      constraints: [],
      nodes: [
        {
          id: "problem",
          label: "Fixture problem",
          description: "A fixture problem statement.",
          category: "problem",
          stage: "problem",
          order: 0,
          group: null,
          provenance: "user-provided",
          sourcePaths: [],
          supportConceptIds: [],
          synthesisRationale: null,
          synthesis: false,
        },
        {
          id: "principle",
          label: "Fixture principle",
          description: "A fixture principle.",
          category: "design principle",
          stage: "design-principle",
          order: 20,
          group: null,
          provenance: "synthesized",
          sourcePaths: [],
          supportConceptIds: [],
          synthesisRationale: "Fixture rationale.",
          synthesis: true,
        },
      ],
      edges: [
        { source: "problem", target: "principle", label: "requires", provenance: "synthesized", supportConceptIds: [] },
      ],
    },
  };
}

for (
  const question of [
    "why is that principle here?",
    "explain this diagram",
    "what does this connection mean?",
  ]
) {
  test(`active-diagram QA ("${question}") never triggers a new diagram`, async () => {
    const state = await activeSynthesisState();
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question, conversationState: state }),
    );
    assert.equal(prepared.turnPlan.mode, "ACTIVE_DIAGRAM_QA", question);
    assert.equal(prepared.turnPlan.diagramAction, "NONE", question);
    assert.equal(prepared.turnPlan.includeDiagram, false, question);
  });
}

// ---------------------------------------------------------------------------
// Section 11.G: refinement patches the existing proposal, not a fresh retrieval/evidence turn
// ---------------------------------------------------------------------------

for (
  const question of [
    "add stronger privacy protections",
    "add another feature for auditability",
    "make this more robust and give an updated diagram",
  ]
) {
  test(`refinement request ("${question}") patches the active proposal rather than restarting retrieval`, async () => {
    const state = await activeSynthesisState();
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question, includeDiagram: true, conversationState: state }),
    );
    assert.equal(prepared.turnPlan.mode, "DESIGN_REFINEMENT", question);
    assert.equal(prepared.turnPlan.refinementIntent, true, question);
    assert.notEqual(prepared.turnPlan.mode, "STORED_FULL_MAP", question);
    assert.notEqual(prepared.turnPlan.mode, "EVIDENCE_MAP", question);
  });
}

test('refinement stays DESIGN_REFINEMENT even when a real synthesis turn left exactly one active source paper', async () => {
  // Regression: a genuine synthesis turn's evidence retrieval commonly leaves exactly
  // one paper active (via activePaperSlugs), which previously made "this"/"it" in a
  // refinement phrase satisfy the generic stored-paper-map subject pattern and made
  // that deterministic-map path win over the active-draft refinement, even though the
  // fixture-only test above (with zero active papers) never observed it.
  const catalog = await catalogFixture;
  const anyPaper = catalog.papers[0]!;
  const baseState = await activeSynthesisState();
  const state: NativeOkfConversationState = {
    ...baseState,
    activePaperSlugs: [anyPaper.slug],
  };
  const question = "Make this more robust and give an updated diagram.";
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({ question, includeDiagram: true, conversationState: state }),
  );
  assert.equal(prepared.turnPlan.mode, "DESIGN_REFINEMENT");
  assert.equal(prepared.turnPlan.refinementIntent, true);
  assert.notEqual(prepared.turnPlan.mode, "STORED_FULL_MAP");
});

// ---------------------------------------------------------------------------
// Section 4 invariant: a synthesized diagram must never be an all-stored evidence dump
// ---------------------------------------------------------------------------

test("invariant: DESIGN_SYNTHESIS + RENDER_NEW_SYNTHESIS never returns an all-stored diagram", async () => {
  const catalog = await catalogFixture;
  const question =
    "I want to build a system that solves consent management for cross-organizational collaboration. How should I design this?";
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({ question, includeDiagram: true }),
    catalog,
  );
  assert.equal(prepared.turnPlan.mode, "DESIGN_SYNTHESIS");
  assert.equal(prepared.turnPlan.diagramAction, "RENDER_NEW_SYNTHESIS");
  // An all-stored "synthesis" diagram must fail validation generically (see
  // diagram-validation.ts), independent of any specific paper or problem.
  const { validateGeneratedDiagram } = await import("../server/openai/diagram-validation.ts");
  const allStoredDiagram = {
    title: "Suspicious all-stored proposal",
    explanation: "Every node below is stored, which cannot be a new proposal.",
    nodes: [
      {
        id: "problem",
        label: "Fixture problem",
        description: "A fixture problem.",
        category: "problem",
        stage: "problem" as const,
        order: 0,
        group: null,
        provenance: "user-provided" as const,
        sourcePaths: [],
        supportConceptIds: [],
        synthesisRationale: null,
        synthesis: false,
      },
      {
        id: "requirement",
        label: "Fixture requirement",
        description: "A fixture requirement.",
        category: "design requirement",
        stage: "design-requirement" as const,
        order: 20,
        group: null,
        provenance: "stored" as const,
        sourcePaths: ["design-knowledge/fixture-dr1"],
        supportConceptIds: ["design-knowledge/fixture-dr1"],
        synthesisRationale: null,
        synthesis: false,
      },
    ],
    edges: [
      {
        source: "problem",
        target: "requirement",
        label: "requires",
        provenance: "stored" as const,
        supportConceptIds: ["design-knowledge/fixture-dr1"],
      },
    ],
  };
  const result = validateGeneratedDiagram(
    allStoredDiagram,
    new Set(["design-knowledge/fixture-dr1"]),
    { mode: "synthesized" },
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.errors.join(" "),
      /not imported stored knowledge|evidence-used-as-topology/u,
    );
  }
  void catalog;
});
