import assert from "node:assert/strict";
import test from "node:test";
import { answerOkfChat } from "../lib/okf/chat.ts";
import { extractSourceViewSelector } from "../lib/okf/query-planner.ts";
import { getOkfKnowledgeBase } from "../lib/okf/retrieval.ts";
import type { OkfKnowledgeBase } from "../lib/okf/schema.ts";

async function answerWithoutLiveProvider(query: string, kb?: OkfKnowledgeBase) {
  const previousProvider = process.env.LLM_PROVIDER;
  const previousDisable = process.env.LLM_DISABLE_LIVE_SYNTHESIS;
  process.env.LLM_PROVIDER = "none";
  process.env.LLM_DISABLE_LIVE_SYNTHESIS = "true";
  try {
    return await answerOkfChat(query, kb);
  } finally {
    if (previousProvider === undefined) delete process.env.LLM_PROVIDER;
    else process.env.LLM_PROVIDER = previousProvider;
    if (previousDisable === undefined) delete process.env.LLM_DISABLE_LIVE_SYNTHESIS;
    else process.env.LLM_DISABLE_LIVE_SYNTHESIS = previousDisable;
  }
}

test("chatbot resolves a stored source view without introducing relations outside its projection", async () => {
  const kb = getOkfKnowledgeBase();
  const paper = kb.papers.find((candidate) => candidate.source_views?.length);
  assert.ok(paper?.source_views?.length);
  const view = paper.source_views[0];
  const response = await answerWithoutLiveProvider(
    `Show source ${view.source_reference.label} mapping for ${paper.title}`,
    kb
  );
  assert.equal(response.intent, "DSR_FLOW_QUERY");
  assert.equal(response.flow_view?.resolution, "resolved");
  assert.equal(response.flow_view?.projection_source, "source_view");
  assert.deepEqual(new Set(response.flow.edges.map((edge) => edge.id)), new Set(view.edge_ids));
  assert.match(response.answer, new RegExp(`Validation status: ${view.source_reference.validation_status}`));
  assert.match(response.answer, /automatic layout/i);
  for (const edge of response.flow.edges) {
    assert.equal(edge.provenance, "stored");
    assert.equal(edge.stored_provenance, "source_view_explicit");
    assert.ok(edge.source_view_ids?.includes(view.source_view_id));
  }

  for (const row of response.flow_rows ?? []) {
    for (let index = 0; index < row.concept_ids.length - 1; index += 1) {
      const source = row.concept_ids[index];
      const target = row.concept_ids[index + 1];
      assert.ok(response.flow.edges.some((edge) => edge.source === source && edge.target === target));
    }
  }
});

test("chatbot selects the only stored source view when a paper is named without a figure label", async () => {
  const kb = getOkfKnowledgeBase();
  const paper = kb.papers.find((candidate) => candidate.source_views?.length === 1);
  assert.ok(paper?.source_views?.length);
  const response = await answerWithoutLiveProvider(`Show the Source Figure flow for ${paper.title}`, kb);
  assert.equal(response.flow_view?.resolution, "resolved");
  assert.equal(response.flow_view?.source_view_id, paper.source_views[0].source_view_id);
  assert.equal(response.flow_view?.projection_source, "source_view");
});

test("chatbot keeps Recommended Flow and Full Relations as distinct stored projections", async () => {
  const kb = getOkfKnowledgeBase();
  const paper = kb.papers.find((candidate) => candidate.source_views?.length);
  assert.ok(paper);
  const recommended = await answerWithoutLiveProvider(`Show the Recommended Flow for ${paper.title}`, kb);
  const full = await answerWithoutLiveProvider(`Show the Full Relations graph for ${paper.title}`, kb);
  assert.equal(recommended.flow_view?.resolved_mode, "recommended");
  assert.equal(full.flow_view?.resolved_mode, "full");
  assert.ok(full.flow.edges.length >= recommended.flow.edges.length);
});

test("chatbot refuses to fabricate a Source Figure when no stored source view exists", async () => {
  const kb = getOkfKnowledgeBase();
  const paper = kb.papers.find((candidate) => !candidate.source_views?.length);
  assert.ok(paper);
  const response = await answerWithoutLiveProvider(`Show source Figure 1 mapping for ${paper.title}`, kb);
  assert.equal(response.flow_view?.resolution, "unavailable");
  assert.equal(response.flow.nodes.length, 0);
  assert.match(response.answer, /did not substitute a Recommended Flow or invent a source mapping/);
});

test("chatbot asks for a selector when multiple source views match equally", async () => {
  const kb = structuredClone(getOkfKnowledgeBase());
  const paper = kb.papers.find((candidate) => candidate.source_views?.length);
  assert.ok(paper?.source_views?.length);
  const original = paper.source_views[0];
  paper.source_views.push({
    ...structuredClone(original),
    source_view_id: `${original.source_view_id}_alternate`,
    title: `${original.title} alternate`
  });
  const response = await answerWithoutLiveProvider(
    `Show source ${original.source_reference.label} mapping for ${paper.title}`,
    kb
  );
  assert.equal(response.flow_view?.resolution, "ambiguous");
  assert.equal(response.flow.nodes.length, 0);
});

test("paper context metadata is answered without recreating noncanonical concepts", async () => {
  const kb = getOkfKnowledgeBase();
  const paper = kb.papers.find((candidate) => candidate.research_questions.length || candidate.limitations.length);
  assert.ok(paper);
  const response = await answerWithoutLiveProvider(
    `Show research questions and limitations for ${paper.title}`,
    kb
  );
  assert.equal(response.intent, "PAPER_ELEMENT_QUERY");
  assert.equal(response.retrieved_concepts.length, 0);
  assert.match(response.answer, /Research questions/);
  assert.match(response.answer, /Limitations and boundary conditions/);
});

test("chatbot does not silently choose a paper for an unqualified Source Figure request", async () => {
  const response = await answerWithoutLiveProvider("Build a DSR flow from source Figure 3");
  assert.equal(response.flow_view?.resolution, "ambiguous");
  assert.equal(response.flow.nodes.length, 0);
  assert.match(response.answer, /needs a named paper|ambiguous|no source-view-grounded mapping/i);
});
test("source-view selectors support straight and curly quoted titles", () => {
  assert.equal(extractSourceViewSelector('Show source view "Primary mapping"'), "Primary mapping");
  assert.equal(extractSourceViewSelector("Show source view \u201cPrimary mapping\u201d"), "Primary mapping");
  assert.equal(extractSourceViewSelector("Show the source figure flow for the named paper"), undefined);
});
