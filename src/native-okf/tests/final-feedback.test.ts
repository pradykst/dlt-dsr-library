import "server-only";

import assert from "node:assert/strict";
import test from "node:test";
import { getOkfBundle } from "../server/cache.ts";
import { getAllPapers } from "../server/repository.ts";
import { associatedConceptsForPaper, projectSemanticEdges } from "../server/paper-design-map.ts";
import { getPaperWorkbenchViewModel } from "../server/workbench.ts";
import { assembleCompletePapersContext, retrieveOkfContext } from "../server/retrieval.ts";
import { assembleNativeOkfContextualRetrieval, prepareNativeOkfChatRequest, hardNativeOkfConceptKinds } from "../server/conversation.ts";
import { answerNativeOkfChat, validateNativeOkfChatRequest } from "../server/openai/chat.ts";
import { buildNativeOkfGroundedContext } from "../server/openai/context.ts";
import { buildNativeOkfDiagramGrounding } from "../server/openai/diagram-grounding.ts";
import { createInitialNativeOkfConversationState, normalizeNativeOkfChatScope, type NativeOkfChatScope } from "../shared/chat-types.ts";
import { parseNativeOkfConversationState } from "../shared/conversation-state.ts";
import { addNativeOkfScopePaper, removeNativeOkfScopePaper } from "../shared/paper-scope.ts";
import { conceptNarrative, publicationDoi, researcherMarkdown } from "../shared/research-presentation.ts";
import { formatConceptCount } from "../shared/presentation.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import { compactCompletePaperMarkdown } from "../server/complete-paper-packing.ts";

const IDS = ["blockchain-iot-sensor-data", "kyc-framework-ssi", "trust-enabling-capacity-exchange", "ambivalence-trust-loyalty", "bemi-marketplace-interfaces"];
const config = { apiKey: "test", model: "test", reasoningEffort: "medium" as const, moderationEnabled: false, maxOutputTokens: 1800, diagramMaxOutputTokens: 4096 };

async function scoped(question: string, ids = IDS.slice(0, 3)) {
  const prepared = await prepareNativeOkfChatRequest(validateNativeOkfChatRequest({ question, scope: { type: "papers", paperIds: ids } }));
  const raw = await assembleCompletePapersContext(ids.map((id) => `papers/${id}`), question);
  return { prepared, raw, retrieval: await assembleNativeOkfContextualRetrieval(prepared, raw) };
}

test("scope normalization covers legacy, 1/2/3/5 papers, order, duplicates, empty and invalid sets", async () => {
  for (const count of [1, 2, 3, 5]) {
    const scope = { type: "papers", paperIds: IDS.slice(0, count) };
    assert.deepEqual(validateNativeOkfChatRequest({ question: "Explain design knowledge", scope }).scope, scope);
    const prepared = await prepareNativeOkfChatRequest({ question: "Explain design knowledge", scope: scope as NativeOkfChatScope });
    assert.deepEqual(prepared.scopePaperSlugs, IDS.slice(0, count));
  }
  assert.deepEqual(normalizeNativeOkfChatScope({ type: "paper", paperId: IDS[0] }), { type: "papers", paperIds: [IDS[0]] });
  assert.deepEqual(normalizeNativeOkfChatScope({ type: "papers", paperIds: [IDS[1], IDS[0], IDS[1]] }), { type: "papers", paperIds: [IDS[1], IDS[0]] });
  assert.deepEqual(normalizeNativeOkfChatScope({ type: "papers", paperIds: [] }), { type: "corpus" });
  for (const paperIds of [[...IDS, "sixth"], ["../paper"], ["A title"], [""], [null]]) {
    assert.throws(() => validateNativeOkfChatRequest({ question: "Explain design knowledge", scope: { type: "papers", paperIds } }));
  }
  await assert.rejects(prepareNativeOkfChatRequest({ question: "Explain design knowledge", scope: { type: "papers", paperIds: [IDS[0]!, "deleted-paper"] } }), /selected paper is no longer/u);
  const legacy = { ...createInitialNativeOkfConversationState(), scope: { type: "paper", paperId: IDS[0] } };
  assert.deepEqual(parseNativeOkfConversationState(legacy)?.scope, { type: "papers", paperIds: [IDS[0]] });
});

test("the shared selection operations cannot add duplicates or replace the fifth paper", () => {
  let scope: NativeOkfChatScope = { type: "corpus" };
  for (const id of IDS) scope = addNativeOkfScopePaper(scope, id);
  assert.deepEqual(scope, { type: "papers", paperIds: IDS });
  assert.equal(addNativeOkfScopePaper(scope, IDS[0]!), scope);
  assert.equal(addNativeOkfScopePaper(scope, "sixth"), scope);
  for (const id of IDS) scope = removeNativeOkfScopePaper(scope, id);
  assert.deepEqual(scope, { type: "corpus" });
});

const KIND_CASES = [
  ["Find design principles relevant to trust.", ["design-principle"]],
  ["Find design requirements relevant to provenance.", ["design-requirement"]],
  ["Find design features for privacy-preserving exchange.", ["design-feature"]],
  ["Find meta requirements relevant to trust.", ["meta-requirement"]],
  ["Find design objectives relevant to trust.", ["design-objective"]],
  ["Find principles and features for privacy-preserving exchange.", ["design-principle", "design-feature"]],
  ["Find design requirements and design features.", ["design-requirement", "design-feature"]],
  ["Which requirements support these design principles?", ["design-requirement", "design-principle"]],
] as const;

for (const [question, expected] of KIND_CASES) {
  test(`explicit kinds constrain corpus and selected retrieval: ${question}`, async () => {
    const { prepared, retrieval } = await scoped(question);
    const bundle = await getOkfBundle();
    const owned = new Set(IDS.slice(0, 3).flatMap((id) => associatedConceptsForPaper(bundle, bundle.conceptsById.get(`papers/${id}`)!).map((concept) => concept.id)));
    assert.ok(retrieval.finalConcepts.length > 0);
    for (const concept of retrieval.finalConcepts) {
      assert.ok((expected as readonly string[]).includes(concept.type), concept.type);
      assert.ok(owned.has(concept.conceptId), concept.conceptId);
    }
    const generic = await prepareNativeOkfChatRequest({ question });
    const raw = await retrieveOkfContext(question, {}, hardNativeOkfConceptKinds(generic));
    const corpus = await assembleNativeOkfContextualRetrieval(generic, raw);
    for (const list of [raw.seedResults, raw.expandedResults, corpus.finalConcepts]) {
      assert.ok(list.every((concept) => (expected as readonly string[]).includes(concept.type)));
    }
    const context = buildNativeOkfGroundedContext(retrieval, prepared.effectiveQuestion);
    assert.ok(context.sources.every((source) => (expected as readonly string[]).includes(source.card.type)));
  });
}

test("generic knowledge, full canonical maps and proposal synthesis retain required layers", async () => {
  for (const question of ["Find reusable design knowledge for privacy-preserving exchange.", "Show the complete design map including its principles and features.", "Using these selected papers as evidence, guide me in designing a trusted cross-organizational information-sharing system."]) {
    const { prepared, retrieval } = await scoped(question);
    assert.deepEqual(hardNativeOkfConceptKinds(prepared), []);
    assert.ok(new Set(retrieval.finalConcepts.map((concept) => concept.type)).size >= 5);
    const grounding = await buildNativeOkfDiagramGrounding(retrieval);
    assert.ok(grounding.storedRelations.length > 0);
  }
});

test("all canonical papers retain every record, full description, Markdown body and canonical relationship", async () => {
  const bundle = await getOkfBundle();
  const rows: { id: string; chars: number }[] = [];
  for (const paper of await getAllPapers()) {
    const associated = associatedConceptsForPaper(bundle, paper);
    const retrieval = await assembleCompletePapersContext([paper.id], "Explain the design knowledge.");
    assert.deepEqual(new Set(retrieval.finalConcepts.map((concept) => concept.conceptId)), new Set([paper.id, ...associated.map((concept) => concept.id)]));
    for (const concept of retrieval.finalConcepts) {
      assert.equal(concept.markdownBody, bundle.conceptsById.get(concept.conceptId)!.markdownBody);
      assert.equal(concept.description, bundle.conceptsById.get(concept.conceptId)!.description);
    }
    assert.deepEqual(retrieval.completePaperContext?.relationships, projectSemanticEdges(bundle, associated));
    const context = buildNativeOkfGroundedContext(retrieval, "Explain the design knowledge.");
    assert.equal(context.packing?.markdownTruncated, false);
    assert.equal(context.packing?.optionalConceptsDropped, 0);
    rows.push({ id: paper.id, chars: context.prompt.length });
  }
  rows.sort((a, b) => b.chars - a.chars);
  for (const count of [1, 2, 3, 5]) {
    const ids = rows.slice(0, count).map((row) => row.id);
    const retrieval = await assembleCompletePapersContext(ids, "Compare the reusable design knowledge.");
    assert.deepEqual(retrieval, await assembleCompletePapersContext(ids, "Compare the reusable design knowledge."));
    if (count === 5) {
      assert.throws(() => buildNativeOkfGroundedContext(retrieval, "Compare the reusable design knowledge."), /No selected knowledge was truncated/u);
      continue;
    }
    const context = buildNativeOkfGroundedContext(retrieval, "Compare the reusable design knowledge.");
    assert.equal(context.sources.length, retrieval.finalConcepts.length);
    assert.ok(context.prompt.length <= 80_000);
  }
  const representative = await scoped("Compare these selected papers.", IDS);
  const context = buildNativeOkfGroundedContext(representative.retrieval, representative.prepared.effectiveQuestion);
  assert.equal(context.sources.length, representative.raw.finalConcepts.length);
  assert.ok(context.prompt.length <= 80_000);
  console.log(JSON.stringify({ contextSizes: rows }));
});

test("context budget failure is explicit and never truncates selected records", async () => {
  const { retrieval } = await scoped("Explain the design knowledge.");
  const small = { ...retrieval, debug: { ...retrieval.debug, limits: { ...retrieval.debug.limits, maxContextCharacters: 100 } } };
  assert.throws(() => buildNativeOkfGroundedContext(small, "Explain the design knowledge."), /No selected knowledge was truncated/u);
});

test("complete packing preserves unique annotations and removes only repeated descriptions", () => {
  const markdown = "# Paper\n\n## Principles\n* [DP1](../design-knowledge/p-dp1.md) - A unique qualification.\n* [DP2](../design-knowledge/p-dp2.md) - Repeated description.\n";
  const packed = compactCompletePaperMarkdown(markdown, {}, new Set(["Repeated description."]));
  assert.match(packed, /A unique qualification\./u);
  assert.doesNotMatch(packed, /Repeated description\./u);
});

test("missing requested kinds and oversized selections make zero provider calls", async () => {
  let calls = 0;
  const mock = { responses: { create: async () => { calls++; throw new Error("Unexpected provider call"); } }, moderations: { create: async () => { calls++; throw new Error("Unexpected moderation call"); } } } as unknown as NativeOpenAiClient;
  const response = await answerNativeOkfChat({ question: "Show the meta requirements.", includeDiagram: true, scope: { type: "papers", paperIds: ["aligning-newsvendors-scoring-rules"] } }, { environment: config, client: mock });
  assert.equal(response.presentationMode, "no-match");
  assert.deepEqual(response.sources, []);
  assert.equal(response.diagram, undefined);
  await assert.rejects(answerNativeOkfChat({ question: "Compare these selected papers.", scope: { type: "papers", paperIds: ["kyc-framework-ssi", "trust-enabling-capacity-exchange", "bond-markets-tokenization-tac", "ambivalence-trust-loyalty", "bemi-marketplace-interfaces"] } }, { environment: config, client: mock }), /No selected knowledge was truncated/u);
  assert.equal(calls, 0);
});

test("a changed selection removes old history from the provider input", async () => {
  const inputs: unknown[] = [];
  const mock = { responses: { create: async (body: unknown) => { inputs.push(body); return { status: "completed", output: [], output_text: "The selected principles provide guidance [[S1]]." }; } } } as unknown as NativeOpenAiClient;
  await answerNativeOkfChat({ question: "What are the design principles?", scope: { type: "papers", paperIds: [IDS[0]!] }, conversationState: { ...createInitialNativeOkfConversationState(), scope: { type: "papers", paperIds: [IDS[1]!] } }, history: [{ role: "assistant", content: "STALE_EVIDENCE_SENTINEL [[S1]]" }] }, { environment: config, client: mock });
  assert.ok(inputs.length > 0);
  assert.doesNotMatch(JSON.stringify(inputs), /STALE_EVIDENCE_SENTINEL/u);
});

test("a typed multi-paper diagram request clarifies which independent map to open", async () => {
  let calls = 0;
  const mock = { responses: { create: async () => { calls++; return { status: "completed", output: [], output_text: "The selected principles provide guidance [[S1]]." }; } } } as unknown as NativeOpenAiClient;
  const question = "Find relevant design principles for provenance.";
  const scope = { type: "papers" as const, paperIds: IDS.slice(0, 3) };
  const prepared = await prepareNativeOkfChatRequest({ question, scope, diagramPreference: "requested" });
  assert.equal(prepared.turnPlan.mode, "CLARIFICATION");
  const response = await answerNativeOkfChat({ question, scope, diagramPreference: "requested" }, { environment: config, client: mock });
  assert.equal(response.kind, "clarification");
  assert.equal(response.diagram, undefined);
  assert.deepEqual(response.sources, []);
  assert.equal(calls, 0);
});

test("scope transitions clear stale sources, diagrams and pending clarification", async () => {
  let state = createInitialNativeOkfConversationState();
  for (const ids of [[IDS[0]!], IDS.slice(0, 2), IDS.slice(0, 3), [IDS[0]!, IDS[2]!], IDS.slice(3, 5), []]) {
    const next: NativeOkfChatScope = ids.length ? { type: "papers", paperIds: ids } : { type: "corpus" };
    const prepared = await prepareNativeOkfChatRequest({ question: "What design knowledge is represented?", scope: next, conversationState: { ...state, pendingClarification: { kind: "missing-domain", originalQuestion: "Design a stale system." } } });
    assert.deepEqual(prepared.resolvedScope, next);
    assert.deepEqual(prepared.validatedState.activeSourceIds, []);
    assert.equal(prepared.validatedState.pendingClarification, null);
    assert.equal(prepared.validatedState.latestValidatedSynthesisDraft, null);
    state = { ...createInitialNativeOkfConversationState(), scope: next };
  }
  assert.deepEqual(createInitialNativeOkfConversationState().scope, { type: "corpus" });
});

test("serialized responses enforce paper and kind boundaries even when the model cites every marker", async () => {
  for (const question of ["What are the design principles?", "Compare design principles across these selected papers.", "What design principles appear in the first paper but not the second?"]) {
    const mock = { responses: { create: async () => ({ status: "completed", output: [], output_text: "The selected principles describe design guidance [[S1]] [[S2]] [[S3]] [[S999]]." }) } } as unknown as NativeOpenAiClient;
    const response = await answerNativeOkfChat({ question, scope: { type: "papers", paperIds: IDS.slice(0, 3) } }, { environment: config, client: mock });
    const serialized = JSON.parse(JSON.stringify(response));
    assert.deepEqual(serialized.scope, { type: "papers", paperIds: IDS.slice(0, 3) });
    assert.ok(serialized.sources.length > 0);
    assert.ok(serialized.sources.every((source: { type: string; conceptId: string }) => source.type === "design-principle" && IDS.slice(0, 3).some((id) => source.conceptId.includes(id))));
    assert.doesNotMatch(serialized.answerMarkdown, /S999/u);
  }
});

test("count labels and description composition preserve semantics without provenance punctuation", async () => {
  for (const [type, count, label] of [["design-principle", 1, "1 Design Principle"], ["design-principle", 3, "3 Design Principles"], ["design-requirement", 10, "10 Design Requirements"], ["meta-requirement", 6, "6 Meta Requirements"], ["design-objective", 4, "4 Design Objectives"], ["design-feature", 9, "9 Design Features"]] as const) assert.equal(formatConceptCount(type, count), label);
  const bundle = await getOkfBundle();
  const view = await getPaperWorkbenchViewModel("aligning-newsvendors-scoring-rules");
  for (const node of view!.paperDesignMap!.nodes) {
    const raw = bundle.conceptsById.get(node.id)!;
    assert.match(raw.markdownBody, /Source document: ALIGNI~1.PDF/u);
    assert.match(raw.markdownBody, /Source evidence:/u);
    assert.equal(node.markdownSummary, conceptNarrative(raw.markdownBody, raw.description));
    assert.ok(node.markdownSummary!.includes(raw.description!));
    assert.doesNotMatch(node.markdownSummary!, /Source paper|Citations|Source document|Source evidence|[,?]$/u);
    assert.equal(node.doi, "https://doi.org/10.1016/j.dss.2021.113626");
    assert.doesNotMatch(researcherMarkdown(raw.markdownBody), /ALIGNI|Source evidence|confirmed by/u);
  }
  assert.equal(conceptNarrative("# Concept\n\nUse A, B, and C.\n\n## Source paper\nAuthors,\n"), "Use A, B, and C.");
  assert.equal(publicationDoi("javascript:alert(1)"), undefined);
  assert.equal(publicationDoi(undefined, "[DOI](https://doi.org/10.1016/j.dss.2021.113626)."), "https://doi.org/10.1016/j.dss.2021.113626");
});
