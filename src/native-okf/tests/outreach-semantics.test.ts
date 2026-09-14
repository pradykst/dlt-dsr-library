import "server-only";
import assert from "node:assert/strict";
import test from "node:test";
import { loadNativeOkfConversationCatalog, prepareNativeOkfChatRequest, assembleNativeOkfContextualRetrieval } from "../server/conversation.ts";
import { assembleCompletePapersContext } from "../server/retrieval.ts";
import { assertNativeOkfResponseBoundary, answerNativeOkfChat } from "../server/openai/chat.ts";
import { buildStoredPaperDesignMap } from "../server/openai/stored-source-map.ts";
import { buildNativeOkfGroundedContext } from "../server/openai/context.ts";
import { validateAnswerCitations } from "../server/openai/citations.ts";
import { buildNativeOkfDiagramGrounding } from "../server/openai/diagram-grounding.ts";
import type { NativeOkfChatResponse, NativeOkfChatScope } from "../shared/chat-types.ts";

const catalog = await loadNativeOkfConversationCatalog();
const papers = catalog.papers.slice(0, 4);
const scope: NativeOkfChatScope = { type: "papers", paperIds: papers.slice(0, 3).map(p => p.slug) };
const response = (diagram?: NativeOkfChatResponse["diagram"], diagramMode: NativeOkfChatResponse["diagramMode"] = null): NativeOkfChatResponse => ({ kind: "answer", presentationMode: "text-primary", diagramStatus: diagram ? "success" : null, answerMarkdown: "", sources: [], insufficientContext: false, diagram, diagramMode });

for (const question of ["Compare these papers.", "What differs between these papers?", "Compare their design principles.", "What does paper 1 contain that paper 2 does not?", "What principles appear across these selected papers?", "What design knowledge overlaps?"]) {
  for (const diagramPreference of ["auto", "requested"] as const) {
    test(`comparison remains prose/table: ${question} (${diagramPreference})`, async () => {
      const prepared = await prepareNativeOkfChatRequest({ question, scope, diagramPreference }, catalog);
      assert.equal(prepared.turnPlan.mode, "STORED_COMPARISON");
      assert.equal(prepared.includeDiagram, false);
      assert.equal(prepared.diagramMode, null);
      await assert.rejects(assertNativeOkfResponseBoundary(prepared, response(await buildStoredPaperDesignMap(papers[0]!.conceptId), "stored")));
    });
  }
}

for (const [question, index] of [["Show the map of the first paper.", 0], ["Show the stored map of paper 2.", 1], ["Show the map of the third paper.", 2], [`Show the design map for "${papers[1]!.title}".`, 1]] as const) {
  test(`one canonical map subject: ${question}`, async () => {
    const prepared = await prepareNativeOkfChatRequest({ question, scope }, catalog);
    assert.equal(prepared.turnPlan.mode, "STORED_FULL_MAP");
    assert.deepEqual(prepared.focusedPaperSlugs, [papers[index]!.slug]);
    const context = await assembleNativeOkfContextualRetrieval(prepared, await assembleCompletePapersContext(papers.map(p => p.conceptId), question));
    const ownerById = new Map(catalog.concepts.map(c => [c.conceptId, c.paperSlug]));
    assert.ok(context.finalConcepts.length > 0);
    assert.ok(context.finalConcepts.every(c => ownerById.get(c.conceptId) === papers[index]!.slug));
    const map = await buildStoredPaperDesignMap(papers[index]!.conceptId);
    assert.ok(map);
    await assertNativeOkfResponseBoundary(prepared, response(map, "stored"));
    const otherMap = await buildStoredPaperDesignMap(papers[(index + 1) % 3]!.conceptId);
    assert.ok(otherMap);
    await assert.rejects(assertNativeOkfResponseBoundary(prepared, response({ ...map, nodes: [...map.nodes, ...otherMap.nodes], edges: [...map.edges, ...otherMap.edges] }, "stored")));
  });
}

for (const question of ["Show me the map.", "Show the design map.", "Generate the mapping diagram."]) {
  test(`one paper resolves and multiple papers clarify: ${question}`, async () => {
    const single = await prepareNativeOkfChatRequest({ question, scope: { type: "papers", paperIds: [papers[0]!.slug] } }, catalog);
    assert.equal(single.turnPlan.mode, "STORED_FULL_MAP");
    const multiple = await answerNativeOkfChat({ question, scope });
    assert.equal(multiple.kind, "clarification");
    assert.equal(multiple.diagram, undefined);
    assert.deepEqual(multiple.sources, []);
  });
}

test("plural stored maps and unselected paper references cannot select a topology", async () => {
  for (const question of ["Show me the stored maps of these papers.", "Show the map of paper 5.", `Show the stored map for "${papers[3]!.title}".`]) {
    const prepared = await prepareNativeOkfChatRequest({ question, scope }, catalog);
    assert.equal(prepared.turnPlan.mode, "CLARIFICATION", question);
    assert.equal(prepared.includeDiagram, false);
  }
});

for (const question of ["Using these papers as evidence, design a solution for trusted data exchange.", "Help me solve product fragmentation and generate a mapping diagram.", "Create a DSR proposal grounded in these papers for trusted data exchange.", "Generate a problem-specific mapping diagram using these papers for trusted data exchange.", "Based on these papers, what system should I design for trusted data exchange?"]) {
  test(`selected evidence is the synthesis universe: ${question}`, async () => {
    const prepared = await prepareNativeOkfChatRequest({ question, scope, diagramPreference: "requested" }, catalog);
    assert.equal(prepared.turnPlan.mode, "DESIGN_SYNTHESIS");
    assert.equal(prepared.diagramMode, "synthesized");
    // Inject a complete fourth paper with stronger score; no corpus fallback is permitted.
    const raw = await assembleCompletePapersContext(papers.map(p => p.conceptId), question);
    raw.finalConcepts.forEach(c => { if (c.conceptId.includes(papers[3]!.slug)) c.score = 99999; });
    const retrieval = await assembleNativeOkfContextualRetrieval(prepared, raw);
    const owners = new Map(catalog.concepts.map(c => [c.conceptId, c.paperSlug]));
    for (const c of retrieval.finalConcepts) assert.ok(scope.type === "papers" && scope.paperIds.includes(owners.get(c.conceptId)!));
    const grounding = await buildNativeOkfDiagramGrounding(retrieval);
    for (const id of grounding.allowedConceptIds) assert.ok(scope.type === "papers" && scope.paperIds.includes(owners.get(id)!));
    const context = buildNativeOkfGroundedContext(retrieval, question);
    assert.equal(validateAnswerCitations("Unsupported [[S999]].", context).needsRepair, true);
    const unselected = catalog.concepts.find(c => c.paperSlug === papers[3]!.slug && c.type !== "paper")!;
    await assert.rejects(assertNativeOkfResponseBoundary(prepared, { ...response(), sources: [{ sourceId: "S1", conceptId: unselected.conceptId, title: unselected.title, type: unselected.type }] }));
    const stored = await buildStoredPaperDesignMap(papers[0]!.conceptId);
    await assert.rejects(assertNativeOkfResponseBoundary(prepared, response(stored, "synthesized")));
  });
}

test("three selected papers and DP-only comparison compose both restrictions", async () => {
  const question = "Compare the design principles across these papers.";
  const prepared = await prepareNativeOkfChatRequest({ question, scope, diagramPreference: "requested" }, catalog);
  const retrieval = await assembleNativeOkfContextualRetrieval(prepared, await assembleCompletePapersContext(papers.map(p => p.conceptId), question));
  assert.equal(prepared.turnPlan.mode, "STORED_COMPARISON");
  assert.ok(retrieval.finalConcepts.length > 0);
  assert.ok(retrieval.finalConcepts.every(c => c.type === "design-principle"));
  assert.ok(retrieval.finalConcepts.every(c => !c.conceptId.includes(papers[3]!.slug)));
});
