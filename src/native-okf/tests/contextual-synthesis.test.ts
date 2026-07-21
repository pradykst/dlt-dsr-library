import "server-only";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  applyNativeOkfPaperRestriction,
  hasSufficientNativeOkfSynthesisGrounding,
  inferNativeOkfSynthesisIntent,
  nativeOkfSynthesisRequiresRpfPath,
  prepareNativeOkfChatRequest,
  type NativeOkfConversationCatalog,
} from "../server/conversation.ts";
import type { RetrievalResult } from "../server/retrieval-types.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import type { NativeOkfGroundedContext } from "../server/openai/context.ts";
import type { NativeOkfDiagramGrounding } from "../server/openai/diagram-grounding.ts";
import {
  generateNativeOkfDiagram,
  NATIVE_OKF_SYNTHESIS_DIAGRAM_INSTRUCTIONS,
} from "../server/openai/diagram.ts";
import { validateGeneratedDiagram } from "../server/openai/diagram-validation.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import { NATIVE_OKF_SYNTHESIS_ANSWER_INSTRUCTION } from "../server/openai/prompts.ts";
import {
  createInitialNativeOkfConversationState,
  type GeneratedDiagram,
  type NativeOkfConversationState,
  type SynthesisDraftState,
} from "../shared/chat-types.ts";
import {
  parseNativeOkfChatSession,
  serializeNativeOkfChatSession,
} from "../shared/chat-session.ts";
import { parseSynthesisDraftState } from "../shared/synthesis-draft.ts";

const C1 = "design-knowledge/alpha-requirement";
const C2 = "design-knowledge/alpha-principle";
const C3 = "design-knowledge/beta-feature";

const catalog: NativeOkfConversationCatalog = {
  papers: [
    { slug: "paper-alpha", conceptId: "papers/paper-alpha", title: "Paper Alpha" },
    { slug: "paper-beta", conceptId: "papers/paper-beta", title: "Paper Beta" },
  ],
  concepts: [
    { conceptId: "papers/paper-alpha", title: "Paper Alpha", type: "paper", paperSlug: "paper-alpha" },
    { conceptId: "papers/paper-beta", title: "Paper Beta", type: "paper", paperSlug: "paper-beta" },
    { conceptId: C1, title: "Identity continuity requirement", type: "design-requirement", paperSlug: "paper-alpha" },
    { conceptId: C2, title: "Selective disclosure principle", type: "design-principle", paperSlug: "paper-alpha" },
    { conceptId: C3, title: "Signed review record", type: "design-feature", paperSlug: "paper-beta" },
  ],
};

const grounding: NativeOkfDiagramGrounding = {
  allowedConceptIds: new Set([C1, C2, C3]),
  eligibleStoredConceptIds: new Set([C1, C2, C3]),
  conceptsById: new Map([
    [C1, { conceptId: C1, title: "Identity continuity requirement", description: "Maintain identity continuity.", type: "design-requirement", stage: "design-requirement" }],
    [C2, { conceptId: C2, title: "Selective disclosure principle", description: "Disclose only necessary evidence.", type: "design-principle", stage: "design-principle" }],
    [C3, { conceptId: C3, title: "Signed review record", description: "Sign review records.", type: "design-feature", stage: "design-feature" }],
  ]),
  storedRelations: [
    { sourceId: C1, targetId: C2, label: "addressed by" },
    { sourceId: C2, targetId: C3, label: "implemented by" },
  ],
};

function synthesisDiagram(): GeneratedDiagram {
  return {
    title: "Cross-marketplace identity continuity",
    explanation: "Stored native concepts ground a problem-specific proposal.",
    nodes: [
      {
        id: "problem",
        label: "Fragmented product identity",
        description: "Product identity and review continuity are fragmented across marketplaces.",
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
        id: "requirement",
        label: "Identity continuity requirement",
        description: "Maintain identity continuity.",
        category: "design requirement",
        stage: "design-requirement",
        order: 20,
        group: null,
        provenance: "stored",
        sourcePaths: [C1],
        supportConceptIds: [C1],
        synthesisRationale: null,
        synthesis: false,
      },
      {
        id: "principle",
        label: "Selective disclosure principle",
        description: "Disclose only necessary evidence.",
        category: "design principle",
        stage: "design-principle",
        order: 40,
        group: null,
        provenance: "stored",
        sourcePaths: [C2],
        supportConceptIds: [C2],
        synthesisRationale: null,
        synthesis: false,
      },
      {
        id: "feature",
        label: "Signed review record",
        description: "Sign review records.",
        category: "design feature",
        stage: "design-feature",
        order: 60,
        group: null,
        provenance: "stored",
        sourcePaths: [C3],
        supportConceptIds: [C3],
        synthesisRationale: null,
        synthesis: false,
      },
      {
        id: "evaluation",
        label: "Evaluate continuity across marketplaces",
        description: "Test whether identity and review evidence remain continuous.",
        category: "evaluation",
        stage: "evaluation",
        order: 80,
        group: null,
        provenance: "synthesized",
        sourcePaths: [C3],
        supportConceptIds: [C3],
        synthesisRationale: "Adapts the stored signed-record feature into a problem-specific evaluation.",
        synthesis: true,
      },
    ],
    edges: [
      { source: "problem", target: "requirement", label: "requires", provenance: "synthesized", supportConceptIds: [C1] },
      { source: "requirement", target: "principle", label: "addressed by", provenance: "stored", supportConceptIds: [C1, C2] },
      { source: "principle", target: "feature", label: "implemented by", provenance: "stored", supportConceptIds: [C2, C3] },
      { source: "feature", target: "evaluation", label: "validates", provenance: "synthesized", supportConceptIds: [C3] },
    ],
  };
}

function draft(): SynthesisDraftState {
  const diagram = synthesisDiagram();
  return {
    version: 1,
    problemStatement: "Fragmented product identity across marketplaces.",
    domain: "cross-marketplace e-commerce",
    objective: "Preserve product identity and review continuity.",
    constraints: ["Privacy preserving"],
    nodes: diagram.nodes,
    edges: diagram.edges,
  };
}

function state(overrides: Partial<NativeOkfConversationState> = {}): NativeOkfConversationState {
  return {
    ...createInitialNativeOkfConversationState(),
    ...overrides,
  };
}

function retrieval(ids = [C1, C2, C3]): RetrievalResult {
  const finalConcepts = ids.map((conceptId, index) => {
    const concept = catalog.concepts.find((candidate) => candidate.conceptId === conceptId)!;
    return {
      conceptId,
      type: concept.type,
      title: concept.title,
      path: conceptId + ".md",
      tags: [],
      headings: [],
      markdownBody: concept.title,
      selectedMetadata: {},
      score: 100 - index,
      expansionDepth: 0 as const,
      characterEstimate: 100,
      sourcePaper: concept.paperSlug,
    };
  });
  return {
    normalizedQuestion: "fixture",
    seedResults: finalConcepts.map((concept, index) => ({
      conceptId: concept.conceptId,
      type: concept.type,
      title: concept.title,
      path: concept.path,
      score: concept.score,
      matchedTerms: [],
      matchSource: ["title" as const],
      seedRank: index,
      sourcePaper: concept.sourcePaper,
    })),
    expandedResults: [],
    finalConcepts,
    corpusOverview: {
      paperCount: 2,
      papers: catalog.papers.map((paper) => ({
        conceptId: paper.conceptId,
        title: paper.title,
        tags: [],
        linkedConceptCounts: {},
      })),
    },
    warnings: [],
    confidence: 1,
    noMatch: false,
    debug: {
      limits: {
        lexicalSeedLimit: 8,
        firstHopLimit: 12,
        secondHopLimit: 6,
        maxConcepts: 20,
        maxContextCharacters: 30_000,
        maxGraphDepth: 2,
        includeIncoming: true,
        includeOutgoing: true,
      },
      meaningfulTokens: [],
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
        topScore: 100,
        secondScore: 90,
        topScoreSeparation: 1.1,
      },
      expansionPaths: [],
      droppedConcepts: [],
      secondHopUsed: false,
      secondHopReason: "not needed",
      candidateCount: 3,
    },
    contextCharacterEstimate: 300,
  };
}

test("stored paper and concept-map requests remain stored-diagram mode", async () => {
  const paper = await prepareNativeOkfChatRequest(
    { question: "Show requirements, principles and features from Paper Alpha.", includeDiagram: true },
    catalog,
  );
  assert.equal(paper.intent, "stored-diagram");
  assert.equal(paper.diagramMode, "stored");

  const concept = await prepareNativeOkfChatRequest(
    { question: "Generate a diagram showing the stored relations for the Selective disclosure principle.", includeDiagram: true },
    catalog,
  );
  assert.equal(concept.intent, "stored-diagram");
});

test("new problem-specific requests and refinements use synthesized-flow mode", async () => {
  const prepared = await prepareNativeOkfChatRequest(
    { question: "Generate a design flow for fragmented product identity across marketplaces.", includeDiagram: true },
    catalog,
  );
  assert.equal(prepared.intent, "synthesized-flow");
  assert.equal(prepared.diagramMode, "synthesized");
  assert.equal(prepared.clarification, null);

  const refined = await prepareNativeOkfChatRequest(
    {
      question: "Make the flow more privacy focused and add an evaluation stage.",
      includeDiagram: true,
      conversationState: state({ lastIntent: "stored-diagram", synthesisDraft: draft() }),
    },
    catalog,
  );
  assert.equal(refined.intent, "synthesized-flow");
  assert.equal(refined.priorSynthesisDraft?.problemStatement, draft().problemStatement);
});

test("diagram alone never forces synthesis and explicit stored language overrides stale synthesis", async () => {
  const generic = await prepareNativeOkfChatRequest(
    { question: "Show a diagram.", includeDiagram: true },
    catalog,
  );
  assert.notEqual(generic.intent, "synthesized-flow");

  const stored = await prepareNativeOkfChatRequest(
    {
      question: "Show the stored relations from Paper Alpha.",
      includeDiagram: true,
      conversationState: state({ lastIntent: "synthesized-flow", synthesisDraft: draft() }),
    },
    catalog,
  );
  assert.equal(stored.intent, "stored-diagram");
});

test("manual diagram disable returns synthesis intent without diagram mode", async () => {
  const prepared = await prepareNativeOkfChatRequest(
    {
      question: "Create a design solution for fragmented identity across marketplaces.",
      includeDiagram: false,
    },
    catalog,
  );
  assert.equal(prepared.intent, "synthesized-flow");
  assert.equal(prepared.includeDiagram, false);
  assert.equal(prepared.diagramMode, null);
});

test("vague synthesis asks one deterministic question and a concrete problem proceeds", async () => {
  const vague = await prepareNativeOkfChatRequest(
    { question: "Create a theory for trust." },
    catalog,
  );
  assert.deepEqual(vague.clarification, {
    kind: "missing-domain",
    question: "Which application domain should the proposed flow address?",
  });

  const missingOutput = await prepareNativeOkfChatRequest(
    { question: "Generate something for digital platforms." },
    catalog,
  );
  assert.equal(missingOutput.clarification?.kind, "missing-output-type");

  const specific = await prepareNativeOkfChatRequest(
    { question: "Build a flow for cross-marketplace product identity." },
    catalog,
  );
  assert.equal(specific.clarification, null);
});

test("a clarification response resumes the bounded original synthesis request", async () => {
  const resumed = await prepareNativeOkfChatRequest(
    {
      question: "Cross-organizational digital marketplaces, as a design solution.",
      conversationState: state({
        lastIntent: "clarification",
        pendingClarification: {
          kind: "missing-domain",
          originalQuestion: "Create a theory for trust.",
        },
      }),
    },
    catalog,
  );
  assert.match(resumed.effectiveQuestion, /Create a theory for trust/);
  assert.equal(resumed.intent, "synthesized-flow");
  assert.equal(resumed.clarification, null);
});

test("paper restrictions resolve ordered context and constrain only current retrieval", async () => {
  const prepared = await prepareNativeOkfChatRequest(
    {
      question: "Use only the second paper.",
      includeDiagram: true,
      conversationState: state({
        activePaperSlugs: ["paper-alpha", "paper-beta"],
        lastIntent: "synthesized-flow",
        lastDiagramRequested: true,
        synthesisDraft: draft(),
      }),
    },
    catalog,
  );
  assert.deepEqual(prepared.restrictedPaperSlugs, ["paper-beta"]);
  const restricted = applyNativeOkfPaperRestriction(prepared, retrieval());
  assert.deepEqual(
    restricted.finalConcepts.map((concept) => concept.conceptId),
    [C3],
  );
  assert.equal(prepared.validatedState.activePaperSlugs.length, 2);
});

test("synthesis requires at least two current-turn stored concepts", () => {
  assert.equal(hasSufficientNativeOkfSynthesisGrounding(retrieval()), true);
  assert.equal(hasSufficientNativeOkfSynthesisGrounding(retrieval([C1])), false);
  assert.equal(
    hasSufficientNativeOkfSynthesisGrounding(retrieval(["papers/paper-alpha"])),
    false,
  );
});

test("strict synthesis validation accepts provenance-bearing grounded RPF flow", () => {
  const result = validateGeneratedDiagram(
    synthesisDiagram(),
    grounding,
    { mode: "synthesized", requireRpfPath: true },
  );
  assert.equal(result.ok, true, result.ok ? undefined : result.errors.join("\n"));
});

test("strict validation rejects unknown support, source paths, and stored masquerading", () => {
  const unknownSupport = synthesisDiagram();
  unknownSupport.nodes.at(-1)!.supportConceptIds = ["unknown"];
  assert.equal(validateGeneratedDiagram(unknownSupport, grounding, { mode: "synthesized" }).ok, false);

  const unknownPath = synthesisDiagram();
  unknownPath.nodes[1]!.sourcePaths = ["unknown"];
  assert.equal(validateGeneratedDiagram(unknownPath, grounding, { mode: "synthesized" }).ok, false);

  const masquerade = synthesisDiagram();
  masquerade.nodes.at(-1)!.provenance = "stored";
  masquerade.nodes.at(-1)!.synthesis = false;
  assert.equal(validateGeneratedDiagram(masquerade, grounding, { mode: "synthesized" }).ok, false);
});

test("stored nodes and stored edges must match exact native concepts and relations", () => {
  const wrongLabel = synthesisDiagram();
  wrongLabel.nodes[1]!.label = "Invented requirement";
  assert.equal(validateGeneratedDiagram(wrongLabel, grounding, { mode: "synthesized" }).ok, false);

  const wrongEdge = synthesisDiagram();
  wrongEdge.edges[1]!.label = "invented relation";
  assert.equal(validateGeneratedDiagram(wrongEdge, grounding, { mode: "synthesized" }).ok, false);
});

test("user-provided nodes cannot claim paper sources", () => {
  const diagram = synthesisDiagram();
  diagram.nodes[0]!.sourcePaths = [C1];
  diagram.nodes[0]!.supportConceptIds = [C1];
  assert.equal(validateGeneratedDiagram(diagram, grounding, { mode: "synthesized" }).ok, false);
});

test("graph validation rejects duplicate edges, cycles, disconnection, and missing RPF path", () => {
  const duplicate = synthesisDiagram();
  duplicate.edges.push({ ...duplicate.edges[0]! });
  assert.equal(validateGeneratedDiagram(duplicate, grounding, { mode: "synthesized" }).ok, false);

  const cycle = synthesisDiagram();
  cycle.edges.push({ source: "evaluation", target: "problem", label: "restarts", provenance: "synthesized", supportConceptIds: [C1] });
  assert.equal(validateGeneratedDiagram(cycle, grounding, { mode: "synthesized" }).ok, false);

  const disconnected = synthesisDiagram();
  disconnected.edges = disconnected.edges.slice(1);
  assert.equal(validateGeneratedDiagram(disconnected, grounding, { mode: "synthesized" }).ok, false);

  const missingRpf = synthesisDiagram();
  missingRpf.edges = missingRpf.edges.filter((edge) => edge.source !== "principle");
  assert.equal(validateGeneratedDiagram(missingRpf, grounding, { mode: "synthesized", requireRpfPath: true }).ok, false);
});

test("malformed client draft elements and unknown IDs are discarded", async () => {
  const untrusted = draft();
  untrusted.nodes[1]!.supportConceptIds = ["unknown"];
  untrusted.nodes[1]!.sourcePaths = ["unknown"];
  const prepared = await prepareNativeOkfChatRequest(
    {
      question: "Make the flow simpler.",
      conversationState: state({ synthesisDraft: untrusted }),
    },
    catalog,
  );
  assert.equal(
    prepared.validatedState.synthesisDraft?.nodes.some((node) =>
      node.supportConceptIds.includes("unknown")
    ),
    false,
  );

  const corrupted = parseSynthesisDraftState({ version: 1, problemStatement: "x" });
  assert.equal(corrupted, null);
});

test("remove-second-feature refinement removes the bounded design-context element", async () => {
  const prior = draft();
  const secondFeature = {
    ...prior.nodes[3]!,
    id: "feature-two",
    label: "Second stored feature",
    order: 61,
  };
  prior.nodes.push(secondFeature);
  const prepared = await prepareNativeOkfChatRequest(
    {
      question: "Remove the second feature.",
      includeDiagram: true,
      conversationState: state({
        lastIntent: "synthesized-flow",
        lastDiagramRequested: true,
        synthesisDraft: prior,
      }),
    },
    catalog,
  );
  assert.equal(
    prepared.priorSynthesisDraft?.nodes.some((node) => node.id === "feature-two"),
    false,
  );
});

test("same-tab session round-trips a bounded synthesis draft and New chat clears it", () => {
  const payload = serializeNativeOkfChatSession({
    version: 1,
    conversationId: "conversation-test-1234",
    messages: [],
    conversationState: state({ lastIntent: "synthesized-flow", synthesisDraft: draft() }),
    diagramPreference: {
      enabled: true,
      autoEnabled: true,
      manuallyDisabledFor: null,
    },
  });
  assert.ok(payload);
  const restored = parseNativeOkfChatSession(payload);
  assert.equal(restored?.conversationState.synthesisDraft?.version, 1);
  assert.equal(createInitialNativeOkfConversationState().synthesisDraft, null);
});

test("synthesis prompts are concise, provenance-aware, and never use prior draft as evidence", () => {
  assert.match(NATIVE_OKF_SYNTHESIS_ANSWER_INSTRUCTION, /80 to 180 words/);
  assert.match(NATIVE_OKF_SYNTHESIS_ANSWER_INSTRUCTION, /not make the proposal a validated design theory/);
  assert.match(NATIVE_OKF_SYNTHESIS_DIAGRAM_INSTRUCTIONS, /previous draft[\s\S]*design context only[\s\S]*never scholarly evidence/i);
  assert.match(NATIVE_OKF_SYNTHESIS_DIAGRAM_INSTRUCTIONS, /provenance/);
});

test("invalid strict structured output receives one repair without replaying raw output", async () => {
  const calls: Array<Record<string, unknown>> = [];
  const response = {
    id: "mock",
    object: "response",
    created_at: 0,
    model: "mock",
    output: [],
    output_text: "{\"invented-secret-output\":true}",
    status: "completed",
    error: null,
    incomplete_details: null,
  };
  const client = {
    responses: {
      create: async (request: Record<string, unknown>) => {
        calls.push(request);
        return response;
      },
    },
  } as unknown as NativeOpenAiClient;
  const environment: NativeOpenAiEnvironment = {
    apiKey: "mock-disabled-key",
    model: "mock",
    reasoningEffort: "low",
    moderationEnabled: false,
    maxOutputTokens: 900,
    diagramMaxOutputTokens: 1_500,
  };
  const context: NativeOkfGroundedContext = {
    sources: [],
    sourceById: new Map(),
    allowedConceptIds: grounding.allowedConceptIds,
    prompt: "<OKF_SOURCE>Mock current-turn context</OKF_SOURCE>",
  };
  const result = await generateNativeOkfDiagram({
    client,
    environment,
    context,
    question: "Build a flow for cross-marketplace identity.",
    answerMarkdown: "Concise grounded answer.",
    mode: "synthesized",
    grounding,
    priorDraft: draft(),
    requireRpfPath: true,
  });
  assert.equal(calls.length, 2);
  assert.equal(result.diagram, undefined);
  assert.doesNotMatch(String(calls[1]?.input), /invented-secret-output/);
});

test("generated-diagram presentation exposes provenance without a competing renderer", async () => {
  const nodeSource = await readFile(
    new URL("../components/chat/GeneratedDiagramNode.tsx", import.meta.url),
    "utf8",
  );
  const presentationSource = await readFile(
    new URL("../components/chat/GeneratedDiagramPresentation.tsx", import.meta.url),
    "utf8",
  );
  const edgeSource = await readFile(
    new URL("../components/StraightFlowEdge.tsx", import.meta.url),
    "utf8",
  );
  assert.match(nodeSource, /User-provided/);
  assert.match(nodeSource, /border-double/);
  assert.match(nodeSource, /border-dashed/);
  assert.match(presentationSource, /Supporting stored concepts/);
  assert.match(presentationSource, /Synthesis rationale/);
  assert.match(presentationSource, /Dashed: synthesized proposal/);
  assert.match(edgeSource, /strokeDasharray/);
});

test("synthesis intent inference remains generic and topic-independent", () => {
  assert.equal(
    inferNativeOkfSynthesisIntent(
      "Combine relevant knowledge into a framework for this new use case.",
      state(),
    ),
    true,
  );
  assert.equal(
    inferNativeOkfSynthesisIntent(
      "Show the diagram from this paper.",
      state({ lastIntent: "synthesized-flow", synthesisDraft: draft() }),
    ),
    false,
  );
});

test("RPF validation is conditional for explicitly different DSR structures", () => {
  assert.equal(
    nativeOkfSynthesisRequiresRpfPath(
      "Generate a grounded design solution for fragmented identity.",
    ),
    true,
  );
  assert.equal(
    nativeOkfSynthesisRequiresRpfPath(
      "Create an explanatory theory for trust in digital marketplaces.",
    ),
    false,
  );
  assert.equal(
    nativeOkfSynthesisRequiresRpfPath(
      "Construct an evaluation framework for privacy-preserving exchange.",
    ),
    false,
  );
});
