import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import { getOkfBundle } from "../server/cache.ts";
import {
  assembleNativeOkfContextualRetrieval,
  loadNativeOkfConversationCatalog,
  prepareNativeOkfChatRequest,
} from "../server/conversation.ts";
import {
  associatedConceptsForPaper,
  projectSemanticEdges,
} from "../server/paper-design-map.ts";
import {
  answerNativeOkfChat,
  userFacingRetrievalWarnings,
  validateNativeOkfChatRequest,
} from "../server/openai/chat.ts";
import {
  buildNativeOkfGroundedContext,
  buildNativeOkfModelInput,
} from "../server/openai/context.ts";
import { buildStoredPaperDesignMap } from "../server/openai/stored-source-map.ts";
import {
  nativeOkfRequestedKindForType,
  retrieveOkfContext,
} from "../server/retrieval.ts";
import type { StructuredPaperEvidence } from "../server/retrieval-types.ts";
import {
  createInitialNativeOkfConversationState,
  type NativeOkfConversationState,
} from "../shared/chat-types.ts";

async function preparedRetrieval(question: string) {
  const request = validateNativeOkfChatRequest({ question });
  const prepared = await prepareNativeOkfChatRequest(request);
  const raw = await retrieveOkfContext(prepared.retrievalQuestion);
  const retrieval = await assembleNativeOkfContextualRetrieval(prepared, raw);
  return { prepared, retrieval };
}

test("term-role corpus search admits only records with explicit term evidence", async () => {
  const { prepared, retrieval } = await preparedRetrieval(
    "Which papers use tokenization as a core design mechanism or design feature?",
  );
  assert.equal(prepared.queryMode, "STRUCTURED_CORPUS_ANALYSIS");
  assert.equal(prepared.diagramMode, null);
  assert.equal(prepared.clarification, null);
  assert.equal(retrieval.structuredAnalysis?.exactTerm, "tokenization");
  assert.equal(retrieval.structuredAnalysis?.checkedPaperCount, 34);
  const evidence = retrieval.structuredAnalysis?.papers.flatMap((paper) =>
    paper.relevantConcepts
  ) ?? [];
  assert.ok(evidence.length > 0);
  assert.ok(evidence.every((concept) => concept.explicitTermMatch));
  assert.ok(
    retrieval.finalConcepts.every((concept) =>
      evidence.some((item) => item.conceptId === concept.conceptId)
    ),
  );
});

test("exact-term classification remains generic for corpus-derived repeated terms", async () => {
  const bundle = await getOkfBundle();
  const paperForConcept = new Map<string, string>();
  for (const paper of bundle.conceptsByType.get("paper") ?? []) {
    for (const concept of associatedConceptsForPaper(bundle, paper)) {
      paperForConcept.set(concept.id, paper.id);
    }
  }
  const papersByTerm = new Map<string, Set<string>>();
  for (const concept of bundle.concepts) {
    const paperId = paperForConcept.get(concept.id);
    if (!paperId || concept.type === "paper" || concept.type === "reference") continue;
    const terms = new Set(
      (concept.title ?? "")
        .normalize("NFKC")
        .toLocaleLowerCase("en")
        .match(/[\p{L}\p{N}]{6,}/gu) ?? [],
    );
    for (const term of terms) {
      const papers = papersByTerm.get(term) ?? new Set<string>();
      papers.add(paperId);
      papersByTerm.set(term, papers);
    }
  }
  const derivedTerms = [...papersByTerm]
    .filter(([, papers]) => papers.size >= 2)
    .sort(
      ([leftTerm, leftPapers], [rightTerm, rightPapers]) =>
        rightPapers.size - leftPapers.size || leftTerm.localeCompare(rightTerm, "en"),
    )
    .slice(0, 3)
    .map(([term]) => term);
  assert.equal(derivedTerms.length, 3);
  for (const term of derivedTerms) {
    const { retrieval } = await preparedRetrieval(
      `Which papers use ${term} as a represented mechanism or design feature?`,
    );
    assert.equal(retrieval.structuredAnalysis?.exactTerm, term);
    const matches = retrieval.structuredAnalysis?.papers.flatMap((paper) =>
      paper.relevantConcepts.filter((concept) => concept.explicitTermMatch)
    ) ?? [];
    assert.ok(matches.length > 0, term);
    assert.ok(matches.every((concept) => concept.explicitTermMatch), term);
  }
});

test("formal category enumeration is exhaustive over represented canonical types", async () => {
  const { retrieval } = await preparedRetrieval(
    "Which papers in the library contribute meta-requirements?",
  );
  const analysis = retrieval.structuredAnalysis;
  assert.equal(analysis?.scope, "corpus");
  assert.equal(analysis?.checkedPaperCount, 34);
  assert.equal(analysis?.exhaustiveForScope, true);
  assert.ok(
    retrieval.contextCharacterEstimate <= retrieval.debug.limits.maxContextCharacters,
  );

  const bundle = await getOkfBundle();
  const expected = new Set(
    (bundle.conceptsByType.get("paper") ?? []).flatMap((paper) =>
      associatedConceptsForPaper(bundle, paper).some(
          (concept) => concept.type === "meta-requirement",
        )
        ? [paper.id]
        : []
    ),
  );
  const actual = new Set(
    analysis?.papers.flatMap((paper) =>
      paper.relevantConcepts.some((concept) => concept.type === "meta-requirement")
        ? [paper.paperConceptId]
        : []
    ),
  );
  assert.deepEqual(actual, expected);
});

test("ordinary corpus topic search preserves semantic retrieval", async () => {
  const { prepared, retrieval } = await preparedRetrieval(
    "Which studies discuss immutable records as part of their artifact design?",
  );
  assert.equal(prepared.corpusQuery, true);
  assert.equal(prepared.queryMode, "CORPUS_SEARCH");
  assert.equal(retrieval.structuredAnalysis, undefined);
  assert.equal(retrieval.noMatch, false);
  assert.ok(retrieval.finalConcepts.length > 0);
});

test("named multi-paper formal comparison retains both canonical relationship bundles", async () => {
  const { prepared, retrieval } = await preparedRetrieval(
    "Compare Quality Management and Trust-Enabling Capacity Exchange specifically at the meta-requirement to design-principle level.",
  );
  assert.equal(prepared.queryMode, "MULTI_PAPER_QA");
  assert.equal(prepared.focusedPaperSlugs.length, 2);
  const analysis = retrieval.structuredAnalysis;
  assert.equal(analysis?.scope, "multi-paper");
  assert.equal(analysis?.papers.length, 2);

  const bundle = await getOkfBundle();
  for (const row of analysis?.papers ?? []) {
    const paper = bundle.conceptsById.get(row.paperConceptId);
    assert.ok(paper);
    const associated = associatedConceptsForPaper(bundle, paper);
    const expectedConcepts = new Set(
      associated
        .filter((concept) =>
          ["meta-requirement", "design-principle"].includes(concept.type)
        )
        .map((concept) => concept.id),
    );
    assert.deepEqual(
      new Set(row.relevantConcepts.map((concept) => concept.conceptId)),
      expectedConcepts,
    );
    const expectedEdges = projectSemanticEdges(bundle, associated).filter(
      (edge) =>
        nativeOkfRequestedKindForType(
          bundle.conceptsById.get(edge.sourceId)?.type ?? "",
        ) === "meta-requirement" &&
        nativeOkfRequestedKindForType(
          bundle.conceptsById.get(edge.targetId)?.type ?? "",
        ) === "principle",
    );
    assert.equal(row.relevantRelationships.length, expectedEdges.length);
    assert.ok(
      row.relevantRelationships.every(
        (edge) =>
          nativeOkfRequestedKindForType(edge.sourceType) === "meta-requirement" &&
          nativeOkfRequestedKindForType(edge.targetType) === "principle",
      ),
    );
  }
});

test("negative mapping membership is computed from canonical projected relationships", async () => {
  const { retrieval } = await preparedRetrieval(
    "Which papers have requirements or meta-requirements but do not provide an explicit individual mapping to their later design-principle layer?",
  );
  const analysis = retrieval.structuredAnalysis;
  assert.equal(analysis?.absenceCheckComplete, true);
  assert.equal(analysis?.relationshipCheckComplete, true);
  assert.ok(
    retrieval.contextCharacterEstimate <= retrieval.debug.limits.maxContextCharacters,
  );

  const bundle = await getOkfBundle();
  for (const row of analysis?.papers ?? []) {
    const paper = bundle.conceptsById.get(row.paperConceptId);
    assert.ok(paper);
    const associated = associatedConceptsForPaper(bundle, paper);
    const precursorIds = new Set(
      associated
        .filter((concept) =>
          ["requirement", "meta-requirement"].includes(
            nativeOkfRequestedKindForType(concept.type) ?? "",
          )
        )
        .map((concept) => concept.id),
    );
    const principleIds = new Set(
      associated
        .filter(
          (concept) =>
            nativeOkfRequestedKindForType(concept.type) === "principle",
        )
        .map((concept) => concept.id),
    );
    const mapped = projectSemanticEdges(bundle, associated).some(
      (edge) =>
        precursorIds.has(edge.sourceId) && principleIds.has(edge.targetId),
    );
    const expected = precursorIds.size === 0 || principleIds.size === 0
      ? "missing-layer"
      : mapped
        ? "mapped"
        : "unmapped";
    assert.equal(row.relationshipStatus, expected, row.title);
  }
});

test("classification search and corpus-wide false premise stay in structured text mode", async () => {
  const classification = await preparedRetrieval(
    "Find examples where blockchain immutability is used as a design feature, design principle, or implementation mechanism. Keep those categories separate.",
  );
  assert.equal(classification.prepared.includeDiagram, false);
  assert.equal(classification.prepared.diagramMode, null);
  assert.equal(classification.prepared.clarification, null);
  assert.equal(classification.prepared.queryMode, "STRUCTURED_CORPUS_ANALYSIS");
  assert.equal(
    classification.retrieval.structuredAnalysis?.exactTerm,
    "blockchain immutability",
  );

  const premise = await preparedRetrieval(
    "All papers in this library contribute design principles, correct?",
  );
  const counterexamples = premise.retrieval.structuredAnalysis?.papers.filter(
    (paper) => paper.relevantConcepts.length === 0,
  ) ?? [];
  assert.ok(counterexamples.length > 0);
  assert.ok(
    premise.retrieval.finalConcepts.some((concept) =>
      counterexamples.some((paper) => paper.paperConceptId === concept.conceptId)
    ),
  );
});

test("actual serialized structured prompts stay within the configured context bound", async () => {
  const questions = [
    "Which papers in the library contribute meta-requirements?",
    "Which papers have requirements or meta-requirements but do not provide an explicit individual mapping to their later design-principle layer?",
    "Find examples where blockchain immutability is used as a design feature, design principle, or implementation mechanism. Keep those categories separate.",
  ];
  for (const question of questions) {
    const { retrieval } = await preparedRetrieval(question);
    const context = buildNativeOkfGroundedContext(retrieval, question);
    const modelInput = buildNativeOkfModelInput([], context);
    const serializedCharacters = modelInput.reduce(
      (total, message) => total + message.content.length,
      0,
    );
    assert.ok(
      serializedCharacters <= retrieval.debug.limits.maxContextCharacters,
      `${serializedCharacters} > ${retrieval.debug.limits.maxContextCharacters}`,
    );
    assert.equal(context.prompt.length, retrieval.contextCharacterEstimate);
  }
});

test("generic design-guidance and corpus-entity paraphrase families route compositionally", async () => {
  const designQuestions = [
    "I need help designing a verifier that works across different platforms.",
    "I want help building a shared validation service.",
    "Can you help me create a portable evidence artifact?",
    "I am developing a cross-organizational audit system.",
    "How should I design a privacy-aware exchange artifact?",
    "Guide me in building a reusable verification service.",
  ];
  for (const question of designQuestions) {
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question }),
    );
    assert.equal(prepared.queryMode, "DESIGN_PROBLEM_SYNTHESIS", question);
  }

  for (const entity of ["papers", "studies", "articles", "works", "publications"]) {
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({
        question: `Which ${entity} have represented design principles?`,
      }),
    );
    assert.equal(prepared.corpusQuery, true, entity);
    assert.equal(prepared.queryMode, "STRUCTURED_CORPUS_ANALYSIS", entity);
  }
});

test("diagram, absence, and comparison paraphrase families retain resolved focus", async () => {
  const catalog = await loadNativeOkfConversationCatalog();
  const [firstPaper, secondPaper] = catalog.papers;
  assert.ok(firstPaper);
  assert.ok(secondPaper);
  const singlePaperState: NativeOkfConversationState = {
    ...createInitialNativeOkfConversationState(),
    activePaperSlugs: [firstPaper.slug],
    lastIntent: "answer",
  };
  for (const question of [
    "Map the represented design knowledge.",
    "Depict the represented design knowledge.",
    "Illustrate the represented relationships.",
    "Show the relationships.",
  ]) {
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question, conversationState: singlePaperState }),
      catalog,
    );
    assert.equal(prepared.queryMode, "STORED_PAPER_DIAGRAM", question);
  }

  for (const question of [
    "Which studies have requirements and principles but no link between them?",
    "Which publications contain requirements and principles without a relationship?",
    "Which works have requirements and principles that are not connected?",
  ]) {
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question }),
      catalog,
    );
    assert.equal(prepared.queryMode, "STRUCTURED_CORPUS_ANALYSIS", question);
  }

  const comparisonState: NativeOkfConversationState = {
    ...createInitialNativeOkfConversationState(),
    activePaperSlugs: [firstPaper.slug, secondPaper.slug],
  };
  for (const action of ["Compare", "Contrast"]) {
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({
        question: `${action} the formal requirements and principles in these two studies.`,
        conversationState: comparisonState,
      }),
      catalog,
    );
    assert.equal(prepared.queryMode, "MULTI_PAPER_QA", action);
    assert.equal(prepared.answerMode, "comparison", action);
  }
});

test("visual follow-ups retain synthesis, comparison, and single-paper focus while fresh state does not", async () => {
  const catalog = await loadNativeOkfConversationCatalog();
  const [firstPaper, secondPaper] = catalog.papers;
  assert.ok(firstPaper);
  assert.ok(secondPaper);
  const problem = "Design a portable evidence-verification service.";
  const synthesisState: NativeOkfConversationState = {
    ...createInitialNativeOkfConversationState(),
    lastIntent: "synthesized-flow",
    lastSynthesisProblem: {
      version: 1,
      problemStatement: problem,
      displayProblem: problem,
      domain: "portable evidence verification",
      objective: null,
      outputType: "design-solution",
      constraints: [],
      sourcePaperSlugs: [],
    },
  };
  const synthesisFollowUp = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "Show me the diagram.",
      conversationState: synthesisState,
    }),
    catalog,
  );
  assert.equal(synthesisFollowUp.queryMode, "SYNTHESIZED_DESIGN_DIAGRAM");

  const comparisonFollowUp = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "Visualize what we just discussed.",
      conversationState: {
        ...createInitialNativeOkfConversationState(),
        activePaperSlugs: [firstPaper.slug, secondPaper.slug],
        lastIntent: "comparison",
      },
    }),
    catalog,
  );
  assert.equal(comparisonFollowUp.queryMode, "COMPARATIVE_EVIDENCE_DIAGRAM");

  const paperFollowUp = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "Map the represented design knowledge.",
      conversationState: {
        ...createInitialNativeOkfConversationState(),
        activePaperSlugs: [firstPaper.slug],
        lastIntent: "answer",
      },
    }),
    catalog,
  );
  assert.equal(paperFollowUp.queryMode, "STORED_PAPER_DIAGRAM");

  const fresh = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "Visualize what we just discussed.",
      conversationState: createInitialNativeOkfConversationState(),
    }),
    catalog,
  );
  assert.notEqual(fresh.queryMode, "COMPARATIVE_EVIDENCE_DIAGRAM");
  assert.notEqual(fresh.queryMode, "SYNTHESIZED_DESIGN_DIAGRAM");
  assert.deepEqual(fresh.focusedPaperSlugs, []);
});

test("resolved single-paper diagram uses the complete canonical stored map", async () => {
  const question =
    "Create a design diagram for Blockchain for the IoT showing its requirements, principles, features, and their relationships.";
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({ question }),
  );
  assert.equal(prepared.queryMode, "STORED_PAPER_DIAGRAM");
  assert.equal(prepared.preferDeterministicPaperMap, true);
  assert.equal(prepared.clarification, null);
  const paper = prepared.catalog.papers.find(
    (entry) => entry.slug === prepared.focusedPaperSlugs[0],
  );
  assert.ok(paper);
  const expected = await buildStoredPaperDesignMap(paper.conceptId);
  assert.ok(expected);
  const response = await answerNativeOkfChat({ question });
  assert.equal(response.diagramMode, "stored");
  assert.equal(response.diagramStatus, "success");
  assert.equal(response.diagram?.nodes.length, expected.nodes.length);
  assert.equal(response.diagram?.edges.length, expected.edges.length);
});

test("resolved cross-paper diagram is deterministic and paper-distinguishable", async () => {
  const question =
    "Create a diagram comparing how trust is operationalized in the trust-enabling capacity-exchange paper and the consent self-management paper. Keep the two papers distinguishable.";
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({ question }),
  );
  assert.equal(
    prepared.focusedPaperSlugs.length,
    2,
    JSON.stringify(prepared.focusedPaperSlugs),
  );
  assert.equal(prepared.queryMode, "COMPARATIVE_EVIDENCE_DIAGRAM");
  assert.equal(prepared.preferDeterministicComparativeMap, true);
  assert.equal(prepared.clarification, null);
  const response = await answerNativeOkfChat({ question });
  assert.equal(response.diagramMode, "comparative");
  assert.equal(response.diagramStatus, "success");
  assert.equal(new Set(response.diagram?.nodes.map((node) => node.group)).size, 2);
  const groupByNode = new Map(
    response.diagram?.nodes.map((node) => [node.id, node.group]) ?? [],
  );
  assert.ok(
    response.diagram?.edges.every(
      (edge) => groupByNode.get(edge.source) === groupByNode.get(edge.target),
    ),
  );
});

test("design-problem guidance and diagram follow-up preserve synthesis focus", async () => {
  const firstQuestion =
    "I want to build a platform independent blockchain verifier for product data, can you guide me";
  const first = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({ question: firstQuestion }),
  );
  assert.equal(first.queryMode, "DESIGN_PROBLEM_SYNTHESIS");
  assert.equal(first.clarification, null);
  assert.deepEqual(first.focusedPaperSlugs, []);

  const state: NativeOkfConversationState = {
    ...createInitialNativeOkfConversationState(),
    lastIntent: "synthesized-flow",
    lastSynthesisProblem: {
      version: 1,
      problemStatement: firstQuestion,
      displayProblem: firstQuestion,
      domain: "platform independent product-data verification",
      objective: null,
      outputType: "design-solution",
      constraints: [],
      sourcePaperSlugs: [],
    },
  };
  const followUp = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "show me the diagram",
      conversationState: state,
    }),
  );
  assert.equal(followUp.queryMode, "SYNTHESIZED_DESIGN_DIAGRAM");
  assert.equal(followUp.diagramMode, "synthesized");
  assert.equal(followUp.synthesisProblem, firstQuestion);
  assert.match(followUp.retrievalQuestion, /platform independent blockchain verifier/iu);
  assert.equal(followUp.clarification, null);
});

test("paper referent follow-up and live-data scope guardrail remain intact", async () => {
  const catalog = await loadNativeOkfConversationCatalog();
  const first = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "Summarize the blockchain-based peer-review token paper.",
    }),
    catalog,
  );
  assert.equal(first.focusedPaperSlugs.length, 1);
  const state: NativeOkfConversationState = {
    ...createInitialNativeOkfConversationState(),
    activePaperSlugs: first.focusedPaperSlugs,
  };
  const second = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "Which design features implement its principles, and why?",
      conversationState: state,
    }),
    catalog,
  );
  assert.deepEqual(second.focusedPaperSlugs, first.focusedPaperSlugs);
  assert.equal(second.clarification, null);

  const scoped = await answerNativeOkfChat({
    question:
      "Explain proof-of-work versus proof-of-stake and tell me which is better for Bitcoin mining profitability today.",
  });
  assert.equal(scoped.insufficientContext, false);
  assert.equal(scoped.diagramStatus, null);
  assert.match(scoped.answerMarkdown, /does not provide live|outside/iu);
});

test("diagram mode selection is generic across repository papers and derived pairs", async () => {
  const catalog = await loadNativeOkfConversationCatalog();
  for (const paper of catalog.papers) {
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({
        question: `Create a diagram of the represented design map for ${paper.title}.`,
      }),
      catalog,
    );
    assert.equal(prepared.queryMode, "STORED_PAPER_DIAGRAM", paper.title);
  }
  for (let index = 0; index < Math.min(6, catalog.papers.length - 1); index += 2) {
    const left = catalog.papers[index]!;
    const right = catalog.papers[index + 1]!;
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({
        question: `Create a diagram comparing ${left.title} and ${right.title}.`,
      }),
      catalog,
    );
    assert.equal(
      prepared.queryMode,
      "COMPARATIVE_EVIDENCE_DIAGRAM",
      `${left.title} / ${right.title}`,
    );
  }
});

test("inverse and passive relationship wording resolves the same canonical edges across layer pairs", async () => {
  const bundle = await getOkfBundle();
  type RequestedKind = NonNullable<ReturnType<typeof nativeOkfRequestedKindForType>>;
  const kindPhrase: Record<RequestedKind, string> = {
    goal: "design goals",
    objective: "design objectives",
    "meta-requirement": "meta-requirements",
    requirement: "design requirements",
    principle: "design principles",
    feature: "design features",
  };
  const operation: Record<string, readonly [string, string]> = {
    implements: ["implement", "implemented"],
    addresses: ["address", "addressed"],
    supports: ["support", "supported"],
    satisfies: ["satisfy", "satisfied"],
  };
  const candidates = (bundle.conceptsByType.get("paper") ?? []).flatMap((paper) => {
    const associated = associatedConceptsForPaper(bundle, paper);
    const edges = projectSemanticEdges(bundle, associated);
    const groups = new Map<string, typeof edges>();
    for (const edge of edges) {
      const sourceKind = nativeOkfRequestedKindForType(
        bundle.conceptsById.get(edge.sourceId)?.type ?? "",
      );
      const targetKind = nativeOkfRequestedKindForType(
        bundle.conceptsById.get(edge.targetId)?.type ?? "",
      );
      if (!sourceKind || !targetKind || sourceKind === targetKind || !operation[edge.label]) {
        continue;
      }
      const key = `${sourceKind}\0${targetKind}\0${edge.label}`;
      const group = groups.get(key) ?? [];
      group.push(edge);
      groups.set(key, group);
    }
    return [...groups].map(([key, edges]) => ({ paper, key, edges }));
  });
  const selected = [...new Map(candidates.map((candidate) => [candidate.key, candidate])).values()]
    .slice(0, 3);
  assert.ok(selected.length >= 2);

  for (const { paper, key, edges } of selected) {
    const [sourceKind, targetKind, label] = key.split("\0") as [
      RequestedKind,
      RequestedKind,
      string,
    ];
    const forms = operation[label];
    assert.ok(forms);
    const sourcePhrase = kindPhrase[sourceKind];
    const targetPhrase = kindPhrase[targetKind];
    assert.ok(sourcePhrase && targetPhrase);
    const questions = [
      `For ${paper.title}, which ${targetPhrase} ${forms[0]} these ${sourcePhrase}?`,
      `For ${paper.title}, which ${sourcePhrase} are ${forms[1]} by these ${targetPhrase}?`,
    ];
    const expected = edges.map((edge) => `${edge.sourceId}->${edge.targetId}:${edge.label}`).sort();
    for (const question of questions) {
      const { retrieval } = await preparedRetrieval(question);
      const row = retrieval.structuredAnalysis?.papers.find(
        (item) => item.paperConceptId === paper.id,
      );
      assert.ok(row, question);
      const actual = row.relevantRelationships
        .map((edge) => `${edge.sourceId}->${edge.targetId}:${edge.label}`)
        .sort();
      assert.deepEqual(actual, expected, question);
      assert.equal(row.relationshipStatus, "mapped", question);
    }
  }
});

test("peer-review follow-up uses the canonical principle-feature map instead of reporting no mappings", async () => {
  const bundle = await getOkfBundle();
  const catalog = await loadNativeOkfConversationCatalog();
  const first = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "Summarize the blockchain-based peer-review token paper.",
    }),
    catalog,
  );
  assert.equal(first.focusedPaperSlugs.length, 1);
  const paper = catalog.papers.find((item) => item.slug === first.focusedPaperSlugs[0]);
  assert.ok(paper);
  const canonicalPaper = bundle.conceptsById.get(paper.conceptId);
  assert.ok(canonicalPaper);
  const expected = projectSemanticEdges(
    bundle,
    associatedConceptsForPaper(bundle, canonicalPaper),
  ).filter((edge) =>
    bundle.conceptsById.get(edge.sourceId)?.type === "design-principle" &&
    bundle.conceptsById.get(edge.targetId)?.type === "design-feature"
  );
  assert.ok(expected.length > 0);

  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: "Which design features implement its principles, and why?",
      conversationState: {
        ...createInitialNativeOkfConversationState(),
        activePaperSlugs: first.focusedPaperSlugs,
      },
    }),
    catalog,
  );
  const retrieval = await assembleNativeOkfContextualRetrieval(
    prepared,
    await retrieveOkfContext(prepared.retrievalQuestion),
  );
  const row = retrieval.structuredAnalysis?.papers.find(
    (item) => item.paperConceptId === paper.conceptId,
  );
  assert.ok(row);
  assert.equal(row.relationshipStatus, "mapped");
  assert.deepEqual(
    row.relevantRelationships.map((edge) => `${edge.sourceId}->${edge.targetId}:${edge.label}`).sort(),
    expected.map((edge) => `${edge.sourceId}->${edge.targetId}:${edge.label}`).sort(),
  );
});

test("named multi-paper comparisons retain balanced canonical skeletons independent of paper order", async () => {
  const bundle = await getOkfBundle();
  const catalog = await loadNativeOkfConversationCatalog();
  const shapes = catalog.papers.map((paper) => {
    const canonical = bundle.conceptsById.get(paper.conceptId)!;
    const associated = associatedConceptsForPaper(bundle, canonical);
    return {
      paper,
      concepts: associated,
      relationships: projectSemanticEdges(bundle, associated),
    };
  }).filter((shape) => shape.concepts.length > 0)
    .sort((left, right) => left.concepts.length - right.concepts.length);
  const pair = [shapes[0]!, shapes.at(-1)!];
  assert.notEqual(pair[0].paper.slug, pair[1].paper.slug);
  const signatures: Record<string, unknown>[] = [];

  for (const ordered of [pair, [...pair].reverse()]) {
    const question = `Compare ${ordered[0]!.paper.title} and ${ordered[1]!.paper.title}.`;
    const { prepared, retrieval } = await preparedRetrieval(question);
    assert.equal(prepared.queryMode, "MULTI_PAPER_QA");
    const analysis = retrieval.structuredAnalysis;
    assert.equal(analysis?.scope, "multi-paper");
    assert.equal(analysis?.papers.length, 2);
    const signature: Record<string, unknown> = {};
    for (const expected of pair) {
      const row: StructuredPaperEvidence | undefined = analysis?.papers.find(
        (item: StructuredPaperEvidence) =>
          item.paperConceptId === expected.paper.conceptId,
      );
      assert.ok(row, expected.paper.title);
      assert.equal(row.relevantConceptCount, expected.concepts.length);
      assert.equal(row.relevantRelationshipCount, expected.relationships.length);
      assert.deepEqual(row.representedTypeCounts, Object.fromEntries(
        [...new Set(expected.concepts.map((concept) => concept.type))]
          .sort()
          .map((type) => [
            type,
            expected.concepts.filter((concept) => concept.type === type).length,
          ]),
      ));
      signature[expected.paper.conceptId] = {
        concepts: row.relevantConcepts.map((concept) => concept.conceptId).sort(),
        relationships: row.relevantRelationships
          .map((edge) => `${edge.sourceId}->${edge.targetId}:${edge.label}`)
          .sort(),
      };
    }
    const context = buildNativeOkfGroundedContext(retrieval, question);
    assert.ok(context.prompt.length <= retrieval.debug.limits.maxContextCharacters);
    signatures.push(signature);
  }
  assert.deepEqual(signatures[0], signatures[1]);
});

test("exact-term formal roles follow the queried term identity rather than related concepts", async () => {
  const bundle = await getOkfBundle();
  const papersByTerm = new Map<string, Set<string>>();
  for (const paper of bundle.conceptsByType.get("paper") ?? []) {
    for (const concept of associatedConceptsForPaper(bundle, paper)) {
      for (const term of new Set(
        (concept.title ?? "").normalize("NFKC").toLocaleLowerCase("en")
          .match(/[\p{L}\p{N}]{7,}/gu) ?? [],
      )) {
        const papers = papersByTerm.get(term) ?? new Set<string>();
        papers.add(paper.id);
        papersByTerm.set(term, papers);
      }
    }
  }
  const terms = [...papersByTerm]
    .filter(([, papers]) => papers.size >= 2)
    .sort(([left], [right]) => left.localeCompare(right, "en"))
    .slice(0, 3)
    .map(([term]) => term);
  assert.equal(terms.length, 3);

  for (const term of terms) {
    const { retrieval } = await preparedRetrieval(
      `Find examples where ${term} is used as a design feature, design principle, or implementation mechanism. Keep those categories separate.`,
    );
    assert.equal(retrieval.structuredAnalysis?.exhaustiveForScope, true);
    assert.equal(retrieval.structuredAnalysis?.absenceCheckComplete, true);
    const formalMatches = retrieval.structuredAnalysis?.papers.flatMap((paper) =>
      paper.relevantConcepts.filter((concept) => concept.type !== "paper")
    ) ?? [];
    assert.ok(formalMatches.length > 0, term);
    for (const match of formalMatches) {
      const concept = bundle.conceptsById.get(match.conceptId);
      assert.ok(concept);
      const identity = [
        concept.title ?? "",
        typeof concept.frontmatter.label === "string" ? concept.frontmatter.label : "",
        ...(concept.tags ?? []),
        ...concept.headings.filter((heading) => heading.depth === 1).map((heading) => heading.text),
      ].join(" ").normalize("NFKC").toLocaleLowerCase("en");
      assert.match(identity, new RegExp(`\\b${term}\\b`, "u"), match.conceptId);
    }
  }
});

test("optional context trimming stays diagnostic while required evidence loss remains actionable", async () => {
  const retrieval = await retrieveOkfContext("design knowledge relationships");
  const technicalWarning =
    "One or more concepts were omitted because the context limit was exhausted.";
  const trimmed = { ...retrieval, warnings: [technicalWarning] };
  assert.deepEqual(userFacingRetrievalWarnings(trimmed, []), []);
  assert.deepEqual(
    userFacingRetrievalWarnings(trimmed, ["missing/requested/concept"]),
    [
      "Some directly requested stored records could not fit within the bounded answer context; narrow the paper or concept category and try again.",
    ],
  );
});
