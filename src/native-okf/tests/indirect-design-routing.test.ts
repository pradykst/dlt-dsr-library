import "server-only";
import assert from "node:assert/strict";
import test from "node:test";
import { loadNativeOkfConversationCatalog, prepareNativeOkfChatRequest } from "../server/conversation.ts";
import { assertNativeOkfResponseBoundary, validateNativeOkfChatRequest } from "../server/openai/chat.ts";
import { createInitialNativeOkfConversationState } from "../shared/chat-types.ts";
import { inferStoredPaperMapIntent } from "../shared/diagram-intent.ts";

const catalog = await loadNativeOkfConversationCatalog();
const paper = catalog.papers[0]!;
export const MAX_REPORTED_REQUEST = "I want to use NFTs for allowing access to parts of my online shops. Which requirements, principles and features may I use, show me in a diagram";
const requests = [
  MAX_REPORTED_REQUEST,
  "I want to use tokens to restrict access to online services. Which requirements could I use? Show a diagram.",
  "We need patient-controlled consent and information sharing between clinics. What features should it have? Show the diagram.",
  "I need reliable and private IoT sensor readings. Which principles may I apply? Draw a diagram.",
  "We intend to improve manufacturing traceability. Which requirements and features should we implement? Show a diagram.",
  "I would like verifiable digital credentials for students. What features should the system have? Show a diagram.",
  "We plan to use shared records for supply-chain verification. Which principles could we adapt? Show a diagram.",
];

for (const question of requests) {
  test(`indirect design purpose selects synthesis in every output preference: ${question}`, async () => {
    for (const diagramPreference of ["auto", "requested", "suppressed"] as const) {
      const prepared = await prepareNativeOkfChatRequest(validateNativeOkfChatRequest({ question, diagramPreference }), catalog);
      assert.equal(prepared.intent, "synthesized-flow");
      assert.equal(prepared.turnPlan.mode, "DESIGN_SYNTHESIS");
      assert.equal(prepared.turnPlan.diagramAction, diagramPreference === "suppressed" ? "NONE" : "RENDER_NEW_SYNTHESIS");
      assert.equal(prepared.queryMode, diagramPreference === "suppressed" ? "DESIGN_PROBLEM_SYNTHESIS" : "SYNTHESIZED_DESIGN_DIAGRAM");
      assert.equal(prepared.diagramMode, diagramPreference === "suppressed" ? null : "synthesized");
      assert.equal(inferStoredPaperMapIntent(question), false);
    }
    for (const includeDiagram of [true, false]) {
      const prepared = await prepareNativeOkfChatRequest(validateNativeOkfChatRequest({ question, includeDiagram }), catalog);
      assert.equal(prepared.turnPlan.mode, "DESIGN_SYNTHESIS");
      assert.equal(prepared.turnPlan.diagramAction, includeDiagram ? "RENDER_NEW_SYNTHESIS" : "NONE");
    }
  });
}

test("explicit stored paper maps and factual retrieval remain distinct from proposals", async () => {
  for (const question of [
    `Show the requirements, principles and features from "${paper.title}".`,
    `I want to see the stored design map for "${paper.title}".`,
    `Display the paper's complete design map.`,
  ]) {
    const prepared = await prepareNativeOkfChatRequest({ question, scope: { type: "papers", paperIds: [paper.slug] } }, catalog);
    assert.equal(prepared.turnPlan.mode, "STORED_FULL_MAP", question);
    assert.equal(prepared.turnPlan.diagramAction, "RENDER_STORED", question);
  }
  for (const includeDiagram of [true, false]) {
    const factual = await prepareNativeOkfChatRequest({ question: "What is selective disclosure?", includeDiagram }, catalog);
    assert.equal(factual.turnPlan.mode, "TEXT_QA");
    assert.equal(factual.turnPlan.diagramAction, "NONE");
  }
  const named = await prepareNativeOkfChatRequest({ question: `What are the limitations of "${paper.title}"?` }, catalog);
  assert.equal(named.turnPlan.mode, "TEXT_QA");
  for (const question of ["I need an explanation of the features in this paper.", "I want to understand the requirements in this paper.", "I need a diagram of what this paper contains."]) {
    const inspection = await prepareNativeOkfChatRequest({ question, scope: { type: "papers", paperIds: [paper.slug] } }, catalog);
    assert.notEqual(inspection.turnPlan.mode, "DESIGN_SYNTHESIS", question);
  }
  const comparison = await prepareNativeOkfChatRequest({ question: `Compare "${paper.title}" and "${catalog.papers[1]!.title}".`, includeDiagram: true }, catalog);
  assert.equal(comparison.turnPlan.mode, "STORED_COMPARISON");
  assert.equal(comparison.turnPlan.diagramAction, "NONE");
});

test("paper references and evidence comparisons cannot override a new adaptation", async () => {
  for (const question of [
    `Using "${paper.title}", ${requests[2]}`,
    `Compare "${paper.title}" and "${catalog.papers[1]!.title}" as evidence. ${requests[4]}`,
    `Adapt the design from this paper for my verification system. Show a diagram.`,
    `${requests[3]} Use evidence across the library.`,
  ]) {
    const prepared = await prepareNativeOkfChatRequest({ question, scope: { type: "papers", paperIds: [paper.slug, catalog.papers[1]!.slug] } }, catalog);
    assert.equal(prepared.turnPlan.mode, "DESIGN_SYNTHESIS", question);
    assert.equal(prepared.turnPlan.diagramAction, "RENDER_NEW_SYNTHESIS", question);
    assert.equal(prepared.diagramMode, "synthesized", question);
  }
});

test("short continuations recover the user's goal after an erroneous stored-map answer", async () => {
  const state = { ...createInitialNativeOkfConversationState(), lastIntent: "stored-diagram" as const,
    lastDiagramRequested: true, activePaperSlugs: [paper.slug], activeConceptIds: [catalog.concepts.find((c) => c.paperSlug === paper.slug)!.conceptId] };
  for (const question of ["Which requirements could I use? Show a diagram.", "What features should it have?", "Show me a diagram."]) {
    const prepared = await prepareNativeOkfChatRequest({ question, conversationState: state,
      history: [{ role: "user", content: MAX_REPORTED_REQUEST }, { role: "assistant", content: "Stored source map about unrelated mechanisms." }] }, catalog);
    assert.equal(prepared.turnPlan.mode, "DESIGN_SYNTHESIS", question);
    assert.equal(prepared.turnPlan.diagramAction, "RENDER_NEW_SYNTHESIS", question);
    assert.equal(prepared.diagramMode, "synthesized");
    assert.ok(prepared.synthesisProblem?.includes(MAX_REPORTED_REQUEST));
    assert.ok(!prepared.retrievalQuestion.includes("Contextual native OKF focus"), "old retrieval must not define the problem");
  }
});

test("short proposal continuations inherit validated problem state without inventing a domain", async () => {
  const state = { ...createInitialNativeOkfConversationState(), lastIntent: "synthesized-flow" as const, lastDiagramRequested: true,
    lastSynthesisProblem: { version: 1 as const, problemStatement: requests[2]!, domain: "patient consent", objective: null,
      outputType: "design-solution" as const, constraints: [], sourcePaperSlugs: [] } };
  const next = await prepareNativeOkfChatRequest({ question: "What features should it have?", conversationState: state }, catalog);
  assert.equal(next.turnPlan.mode, "DESIGN_SYNTHESIS");
  assert.equal(next.turnPlan.diagramAction, "RENDER_NEW_SYNTHESIS");
  const missing = await prepareNativeOkfChatRequest({ question: "Which requirements could I use?" }, catalog);
  assert.equal(missing.turnPlan.mode, "CLARIFICATION");
});

test("ambiguous diagram requests clarify; evidence maps require an explicit evidence purpose", async () => {
  const ambiguous = await prepareNativeOkfChatRequest({ question: "Show requirements and principles in a diagram." }, catalog);
  assert.equal(ambiguous.turnPlan.mode, "CLARIFICATION");
  assert.equal(ambiguous.turnPlan.diagramAction, "NONE");
  const evidence = await prepareNativeOkfChatRequest({ question: "Map relationships across the relevant library evidence." }, catalog);
  assert.equal(evidence.turnPlan.mode, "EVIDENCE_MAP");
  assert.equal(evidence.turnPlan.diagramAction, "RENDER_STORED");
});

test("serialization rejects a stored-map response on a corpus synthesis turn", async () => {
  const prepared = await prepareNativeOkfChatRequest({ question: MAX_REPORTED_REQUEST }, catalog);
  await assert.rejects(assertNativeOkfResponseBoundary(prepared, {
    kind: "answer", presentationMode: "diagram-primary", diagramStatus: "success",
    answerMarkdown: "A proposal", sources: [], insufficientContext: false,
    diagramMode: "stored", diagram: { title: "Stored source map", explanation: "", nodes: [], edges: [] },
  }));
});
