import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialNativeOkfConversationState,
  type GeneratedDiagram,
  type NativeOkfConversationState,
  type SynthesisDraftState,
} from "../shared/chat-types.ts";
import { getOkfBundle } from "../server/cache.ts";
import { associatedConceptsForPaper } from "../server/paper-design-map.ts";
import {
  inferActiveSynthesisDiagramRefinement,
  loadNativeOkfConversationCatalog,
  prepareNativeOkfChatRequest,
} from "../server/conversation.ts";
import {
  answerNativeOkfChat,
  validateNativeOkfChatRequest,
} from "../server/openai/chat.ts";
import { retrieveOkfContext } from "../server/retrieval.ts";
import { nativeOkfRequestedKindForType } from "../server/retrieval.ts";
import { buildStoredPaperDesignMap } from "../server/openai/stored-source-map.ts";

async function activeDraftFixture(): Promise<{
  state: NativeOkfConversationState;
  draft: SynthesisDraftState;
}> {
  const catalog = await loadNativeOkfConversationCatalog();
  const support = catalog.concepts.find((concept) =>
    concept.type !== "paper" && concept.type !== "reference"
  );
  assert.ok(support);
  const draft: SynthesisDraftState = {
    version: 1,
    problemStatement: "A generic inter-organizational verification artifact.",
    domain: "inter-organizational verification",
    objective: null,
    constraints: [],
    nodes: [
      {
        id: "user-problem",
        label: "Verification problem",
        description: "The researcher-supplied design problem.",
        category: "Problem",
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
        id: "existing-requirement",
        label: "Existing requirement",
        description: "An existing grounded requirement.",
        category: "Design requirement",
        stage: "design-requirement",
        order: 20,
        group: null,
        provenance: "synthesized",
        sourcePaths: [support.conceptId],
        supportConceptIds: [support.conceptId],
        synthesisRationale: "Adapted from current stored design knowledge.",
        synthesis: true,
      },
    ],
    edges: [{
      source: "user-problem",
      target: "existing-requirement",
      label: "requires",
      provenance: "synthesized",
      supportConceptIds: [support.conceptId],
    }],
  };
  return {
    draft,
    state: {
      ...createInitialNativeOkfConversationState(),
      lastIntent: "synthesized-flow",
      lastDiagramRequested: true,
      lastSynthesisProblem: {
        version: 1,
        problemStatement: draft.problemStatement,
        displayProblem: draft.problemStatement,
        domain: draft.domain,
        objective: null,
        outputType: "design-solution",
        constraints: [],
        sourcePaperSlugs: [],
      },
      latestValidatedSynthesisDraft: draft,
    },
  };
}

test("active validated drafts route semantic edit paraphrases to refinement", async () => {
  const { state, draft } = await activeDraftFixture();
  for (const question of [
    "Add another requirement concerning institutional oversight.",
    "Remove the evaluation step.",
    "Rename that artifact.",
    "Connect both requirements to the same principle.",
    "Update one existing element and keep the rest.",
  ]) {
    assert.equal(inferActiveSynthesisDiagramRefinement(question, state), true, question);
    const prepared = await prepareNativeOkfChatRequest({
      question,
      diagramPreference: "auto",
      conversationState: state,
    });
    assert.equal(prepared.turnPlan.activeDraftRefinement, true, question);
    assert.equal(prepared.turnPlan.includeDiagram, true, question);
    assert.equal(prepared.turnPlan.diagramMode, "synthesized", question);
    assert.equal(prepared.priorSynthesisDraft?.nodes.length, draft.nodes.length, question);
    assert.equal(prepared.priorSynthesisDraft?.edges.length, draft.edges.length, question);
  }
});

test("tri-state request validation preserves auto, requested, and suppressed semantics", async () => {
  const { state } = await activeDraftFixture();
  for (const preference of ["auto", "requested", "suppressed"] as const) {
    const request = validateNativeOkfChatRequest({
      question: "Add another requirement concerning institutional oversight.",
      diagramPreference: preference,
      visibleHistoryMessageCount: 11,
      conversationState: state,
    });
    assert.equal(request.diagramPreference, preference);
    assert.equal(request.visibleHistoryMessageCount, 11);
    const prepared = await prepareNativeOkfChatRequest(request);
    assert.equal(
      prepared.includeDiagram,
      preference !== "suppressed",
      preference,
    );
  }
});

test("state plus mutation semantics distinguish refinement from normal explanation", async () => {
  const { state } = await activeDraftFixture();
  const noDraft = createInitialNativeOkfConversationState();
  assert.equal(
    inferActiveSynthesisDiagramRefinement(
      "Add institutional considerations to your explanation.",
      noDraft,
    ),
    false,
  );
  assert.equal(
    inferActiveSynthesisDiagramRefinement(
      "What does institutional oversight mean here?",
      state,
    ),
    false,
  );
  for (const [question, conversationState] of [
    ["Add institutional considerations to your explanation.", noDraft],
    ["What does institutional oversight mean here?", state],
  ] as const) {
    const prepared = await prepareNativeOkfChatRequest({
      question,
      diagramPreference: "auto",
      conversationState,
    });
    assert.equal(prepared.turnPlan.activeDraftRefinement, false, question);
    assert.equal(prepared.turnPlan.includeDiagram, false, question);
  }
});

test("category-only single-paper follow-ups use complete deterministic category maps", async () => {
  const catalog = await loadNativeOkfConversationCatalog();
  const bundle = await getOkfBundle();
  const paper = catalog.papers.find((candidate) => {
    const concept = bundle.conceptsById.get(candidate.conceptId);
    if (!concept) return false;
    const associated = associatedConceptsForPaper(bundle, concept);
    const kinds = new Set(associated.map((item) => nativeOkfRequestedKindForType(item.type)));
    return kinds.has("requirement") && kinds.has("principle") && kinds.has("feature");
  });
  assert.ok(paper);
  const state: NativeOkfConversationState = {
    ...createInitialNativeOkfConversationState(),
    activePaperSlugs: [paper.slug],
    lastIntent: "stored-diagram",
    lastDiagramRequested: true,
  };

  for (const [question, kinds] of [
    ["Show only its principles.", ["principle"]],
    ["Requirements and features only.", ["requirement", "feature"]],
    ["Map those principles.", ["principle"]],
  ] as const) {
    const prepared = await prepareNativeOkfChatRequest({
      question,
      diagramPreference: "auto",
      conversationState: state,
    }, catalog);
    assert.equal(prepared.queryMode, "STORED_PAPER_DIAGRAM", question);
    assert.equal(prepared.preferDeterministicPaperMap, true, question);
    assert.deepEqual(prepared.turnPlan.focusedPaperSlugs, [paper.slug], question);
    assert.deepEqual(prepared.turnPlan.requestedConceptKinds, kinds, question);

    const map = await buildStoredPaperDesignMap(paper.conceptId, kinds);
    assert.ok(map);
    const paperConcept = bundle.conceptsById.get(paper.conceptId);
    assert.ok(paperConcept);
    const expectedIds = new Set<string>(
      associatedConceptsForPaper(bundle, paperConcept)
        .filter((concept) => {
          const kind = nativeOkfRequestedKindForType(concept.type);
          return kind !== null && kinds.includes(kind as never);
        })
        .map((concept) => concept.id),
    );
    assert.deepEqual(new Set(map.nodes.map((node) => node.id)), expectedIds, question);
    assert.ok(map.edges.every((edge) =>
      expectedIds.has(edge.source) && expectedIds.has(edge.target)
    ), question);
  }

  const singleCategoryWithNoEdges = await buildStoredPaperDesignMap(
    paper.conceptId,
    ["principle"],
  );
  assert.ok(singleCategoryWithNoEdges);
  assert.equal(singleCategoryWithNoEdges.edges.length, 0);
});

test("history-boundary policy gives explicit focus priority and clarifies stale ambiguity", async () => {
  const catalog = await loadNativeOkfConversationCatalog();
  const [paperA, paperB] = catalog.papers;
  assert.ok(paperA && paperB);
  const explicit = await prepareNativeOkfChatRequest({
    question: `Show the complete design map for ${paperB.title}.`,
    diagramPreference: "auto",
    visibleHistoryMessageCount: 12,
    conversationState: {
      ...createInitialNativeOkfConversationState(),
      activePaperSlugs: [paperA.slug],
      lastIntent: "stored-diagram",
      lastDiagramRequested: true,
    },
  }, catalog);
  assert.deepEqual(explicit.turnPlan.focusedPaperSlugs, [paperB.slug]);
  assert.equal(explicit.turnPlan.queryMode, "STORED_PAPER_DIAGRAM");
  assert.equal(explicit.clarification, null);

  const ambiguous = await prepareNativeOkfChatRequest({
    question: "Show the complete map again.",
    diagramPreference: "auto",
    visibleHistoryMessageCount: 12,
    conversationState: {
      ...createInitialNativeOkfConversationState(),
      activePaperSlugs: [paperA.slug, paperB.slug],
      lastIntent: "comparison",
      lastDiagramRequested: true,
    },
  }, catalog);
  assert.equal(ambiguous.turnPlan.historyContextTruncated, true);
  assert.equal(ambiguous.clarification?.kind, "ambiguous-reference");

  const { state } = await activeDraftFixture();
  const refinement = await prepareNativeOkfChatRequest({
    question: "Include another feature for interoperability.",
    diagramPreference: "auto",
    visibleHistoryMessageCount: 12,
    conversationState: state,
  }, catalog);
  assert.equal(refinement.turnPlan.activeDraftRefinement, true);
  assert.equal(refinement.clarification, null);
});

test("answer and deterministic diagram consume the same resolved turn plan", async () => {
  const catalog = await loadNativeOkfConversationCatalog();
  let paper = catalog.papers[0];
  for (const candidate of catalog.papers) {
    if (await buildStoredPaperDesignMap(candidate.conceptId)) {
      paper = candidate;
      break;
    }
  }
  assert.ok(paper);
  const request = {
    question: `Show only the represented principles in ${paper.title}.`,
    diagramPreference: "auto" as const,
    visibleHistoryMessageCount: 15,
  };
  const prepared = await prepareNativeOkfChatRequest(request, catalog);
  let capturedPaperId = "";
  let capturedKinds: readonly string[] = [];
  const response = await answerNativeOkfChat(request, {
    prepared,
    retrieve: () => retrieveOkfContext(prepared.retrievalQuestion),
    buildStoredPaperMap: async (paperConceptId, requestedKinds) => {
      capturedPaperId = paperConceptId;
      capturedKinds = requestedKinds ?? [];
      return await buildStoredPaperDesignMap(paperConceptId, requestedKinds);
    },
  });
  assert.equal(capturedPaperId, paper.conceptId);
  assert.deepEqual(capturedKinds, prepared.turnPlan.requestedConceptKinds);
  assert.equal(response.diagramMode, prepared.turnPlan.diagramMode);
  assert.equal(response.diagramStatus, "success");
  assert.deepEqual(response.conversationState?.activePaperSlugs, [paper.slug]);
  assert.match(response.answerMarkdown, new RegExp(
    paper.title.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"),
    "iu",
  ));
  const expected = await buildStoredPaperDesignMap(
    paper.conceptId,
    prepared.turnPlan.requestedConceptKinds,
  );
  assert.deepEqual(
    (response.diagram as GeneratedDiagram).nodes.map((node) => node.id),
    expected?.nodes.map((node) => node.id),
  );
});
