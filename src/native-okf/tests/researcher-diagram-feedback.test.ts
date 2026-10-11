import "server-only";

import assert from "node:assert/strict";
import test from "node:test";
import type { Response, ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { loadNativeOkfConversationCatalog, prepareNativeOkfChatRequest } from "../server/conversation.ts";
import { answerNativeOkfChat } from "../server/openai/chat.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import { buildNativeOkfDiagramGrounding } from "../server/openai/diagram-grounding.ts";
import { validateGeneratedDiagram } from "../server/openai/diagram-validation.ts";
import { readOpenAiEnvironment } from "../server/openai/env.ts";
import { convertNativeOkfSynthesisPlan, type SynthesisPlan } from "../server/openai/synthesis-plan.ts";
import { applyNativeOkfSynthesisRefinementPatch, generateNativeOkfSynthesisRefinement,
  validateNativeOkfSynthesisRefinementPatch, type SynthesisRefinementPatch } from "../server/openai/synthesis-refinement.ts";
import { retrieveOkfContext } from "../server/retrieval.ts";
import { createInitialNativeOkfConversationState, type SynthesisDraftState } from "../shared/chat-types.ts";
import { parseSynthesisDraftState } from "../shared/synthesis-draft.ts";

const environment = readOpenAiEnvironment({ NODE_ENV: "test", OPENAI_API_KEY: "mock", OPENAI_MODEL: "mock-model" });
const catalog = await loadNativeOkfConversationCatalog();
const retrieval = await retrieveOkfContext("blockchain consent selective disclosure privacy");
const grounding = await buildNativeOkfDiagramGrounding(retrieval);
const supports = [...grounding.eligibleStoredConceptIds].slice(0, 2);
assert.equal(supports.length, 2);
const paper = catalog.papers.find((paper) => catalog.concepts.some((concept) => concept.conceptId === supports[0] && concept.paperSlug === paper.slug))!;

function plan(subject = "clinic consent"): SynthesisPlan {
  const node = (key: string, label: string) => ({ key, label, description: label + ".", supportConceptIds: supports });
  return {
    title: `Auditable ${subject} proposal`, problemLabel: `${subject} cannot be audited across organizations`,
    problemSummary: `The current ${subject} process lacks accountable evidence.`, supportingStoredConceptIds: supports,
    coverageRationale: "Adapt consent and disclosure evidence to this particular design problem.",
    requirements: [node("r1", `Maintain verifiable ${subject} evidence`)],
    principles: [node("p1", `Minimize disclosed ${subject} attributes`)],
    features: [node("f1", `Signed ${subject} credential`), node("f2", `Optional ${subject} audit dashboard`)],
    artifact: [node("a1", `${subject} verification service`)], evaluation: [], outcome: [],
    relationships: [
      ["problem", "r1", "motivates"], ["r1", "p1", "addressed by"],
      ["p1", "f1", "implemented by"], ["p1", "f2", "implemented by"],
      ["f1", "a1", "instantiated in"], ["f2", "a1", "instantiated in"],
    ].map(([sourceKey, targetKey, relationshipType], index) => ({
      id: `e${index}`, sourceKey, targetKey, relationshipType: relationshipType as SynthesisPlan["relationships"][number]["relationshipType"],
      rationale: "A grounded relation for this problem.", supportConceptIds: supports,
    })),
  };
}

const converted = convertNativeOkfSynthesisPlan(plan(), grounding, plan().problemSummary, true);
assert.ok(converted, JSON.stringify(converted));
const prior: SynthesisDraftState = {
  version: 1, title: converted.diagram.title, explanation: converted.diagram.explanation,
  problemStatement: plan().problemSummary, domain: "clinic consent", objective: null, constraints: [],
  nodes: converted.diagram.nodes, edges: converted.diagram.edges,
};
// Exercise exact preservation of a non-default order, as well as IDs and evidence.
prior.nodes.find((node) => node.id === "plan-f1")!.order = 61;
const activeState = { ...createInitialNativeOkfConversationState(), lastIntent: "synthesized-flow" as const,
  lastDiagramRequested: true, activePaperSlugs: [paper.slug], latestValidatedSynthesisDraft: prior, synthesisDraft: prior };
const emptyPatch = (): SynthesisRefinementPatch => ({ addNodes: [], updateNodes: [], removeNodeIds: [], addEdges: [], removeEdges: [] });
const approved = { approved: true, errors: [] };

function mockClient(responder: (body: ResponseCreateParamsNonStreaming, index: number) => unknown) {
  const calls: ResponseCreateParamsNonStreaming[] = [];
  const client: NativeOpenAiClient = {
    responses: { create: async (body) => {
      calls.push(body);
      return { status: "completed", output: [], output_text: JSON.stringify(responder(body, calls.length - 1)) } as unknown as Response;
    } },
    moderations: { create: async () => { throw new Error("Moderation is disabled in these deterministic tests"); } },
  };
  return { client, calls };
}

for (const question of [
  "Show a DSR R-P-F flow for consent revocation across hospitals.",
  "Generate an RPF map for detecting altered sensor measurements.",
  "Propose a decision-support flow for coordinating freight capacity among carriers.",
  "Our problem is unreliable credentials. Show requirements, principles and features for a proposed university credential service.",
  "How can disputes about shared energy readings be addressed using reusable design knowledge? Give an RPF flow.",
  "Our challenge is counterfeit certificates. Can you give me a DSR R-P-F flow?",
  "Problem: residents cannot audit local energy claims. Show requirements, principles and features.",
]) {
  test(`new design purpose wins over source-map vocabulary: ${question}`, async () => {
    const prepared = await prepareNativeOkfChatRequest({ question, conversationState: activeState }, catalog);
    assert.equal(prepared.turnPlan.mode, "DESIGN_SYNTHESIS");
    assert.equal(prepared.diagramMode, "synthesized");
    assert.equal(prepared.turnPlan.diagramAction, "RENDER_NEW_SYNTHESIS");
    assert.equal(prepared.priorSynthesisDraft, null);
    assert.equal(prepared.synthesisProblem, question);
  });
}

test("problem-specific RPF request remains synthesis with one paper selected as evidence", async () => {
  const prepared = await prepareNativeOkfChatRequest({ question: "Generate an RPF map for consent revocation across hospitals.", scope: { type: "papers", paperIds: [paper.slug] } }, catalog);
  assert.equal(prepared.turnPlan.mode, "DESIGN_SYNTHESIS");
  assert.equal(prepared.diagramMode, "synthesized");
});

test("a paper can ground a new design without becoming the requested output", async () => {
  const prepared = await prepareNativeOkfChatRequest({ question: `Show an RPF flow for consent expiry grounded in ${paper.title}.` }, catalog);
  assert.equal(prepared.turnPlan.mode, "DESIGN_SYNTHESIS");
  assert.equal(prepared.diagramMode, "synthesized");
});

for (const question of ["Show the stored map from this paper again.", "Generate the RPF map from this paper.", "Display the paper's complete design map."]) {
  test(`explicit stored-map request overrides active proposal: ${question}`, async () => {
    const prepared = await prepareNativeOkfChatRequest({ question, conversationState: activeState }, catalog);
    assert.equal(prepared.turnPlan.mode, "STORED_FULL_MAP");
    assert.equal(prepared.turnPlan.diagramAction, "RENDER_STORED");
  });
}

test("ambiguous visual request invents no problem, and text-only proposal stays text-only", async () => {
  const generic = await prepareNativeOkfChatRequest({ question: "Show an RPF diagram." }, catalog);
  assert.notEqual(generic.intent, "synthesized-flow");
  const vague = await prepareNativeOkfChatRequest({ question: "Propose a new DSR solution." }, catalog);
  assert.ok(vague.clarification);
  const text = await prepareNativeOkfChatRequest({ question: "Show an RPF flow for consent revocation across clinics.", diagramPreference: "suppressed" }, catalog);
  assert.equal(text.intent, "synthesized-flow");
  assert.equal(text.includeDiagram, false);
});

for (const question of ["Refine the signed credential feature.", "Simplify the flow by removing the optional dashboard.",
  "Introduce a new constraint: consent must expire after one day.", "Additional context: the artifact must work with intermittent connectivity.",
  "Add a consent expiry requirement.", "Remove the unnecessary audit dashboard."]) {
  test(`natural local edit uses the authoritative patch baseline: ${question}`, async () => {
    const prepared = await prepareNativeOkfChatRequest({ question, conversationState: activeState }, catalog);
    assert.equal(prepared.turnPlan.mode, "DESIGN_REFINEMENT");
    assert.equal(prepared.turnPlan.diagramAction, "RENDER_UPDATED");
    assert.deepEqual(prepared.priorSynthesisDraft, prior);
  });
}

for (const question of ["Show the existing diagram again.", "Display the current proposal.", "Generate the diagram again."]) {
  test(`rerender is structurally identical and makes no provider call: ${question}`, async () => {
    const { client, calls } = mockClient(() => { throw new Error("Rerender must not generate"); });
    const response = await answerNativeOkfChat({ question, conversationState: activeState }, {
      conversationCatalog: catalog, retrieve: async () => ({ ...retrieval, noMatch: true, finalConcepts: [] }), client, environment,
    });
    assert.equal(calls.length, 0);
    assert.equal(response.diagram?.title, prior.title);
    assert.equal(response.diagram?.explanation, prior.explanation);
    assert.deepEqual(response.diagram?.nodes, prior.nodes);
    assert.deepEqual(response.diagram?.edges, prior.edges);
    assert.deepEqual(response.synthesisDraft, prior);
    assert.ok(supports.every((id) => response.sources.some((source) => source.conceptId === id)));
  });
}

function updateFeature(): SynthesisRefinementPatch {
  const old = prior.nodes.find((node) => node.id === "plan-f1")!;
  return { ...emptyPatch(), updateNodes: [{
    nodeId: old.id, label: "Signed clinic consent credential with expiry",
    description: "The signed consent credential expires after one day.", category: old.category,
    stage: old.stage, supportConceptIds: old.supportConceptIds,
    synthesisRationale: "Adapt the cited consent and disclosure evidence to the expiry constraint.",
  }] };
}

test("localized feature update preserves all other nodes, stages, identities, provenance and edges", async () => {
  const patch = updateFeature();
  const { client, calls } = mockClient((body) => body.text?.format?.type === "json_schema" && body.text.format.name === "native_okf_refinement_review" ? approved : patch);
  const response = await answerNativeOkfChat({ question: "Refine the signed credential feature to expire after one day.", conversationState: activeState }, {
    conversationCatalog: catalog, retrieve: async () => retrieval, client, environment,
  });
  assert.equal(calls.length, 2);
  assert.equal(response.diagramStatus, "success");
  assert.equal(response.diagram?.nodes.find((node) => node.id === "plan-f1")?.label, patch.updateNodes[0].label);
  assert.equal(response.diagram?.nodes.find((node) => node.id === "plan-f1")?.order, 61);
  assert.deepEqual(response.diagram?.nodes.filter((node) => node.id !== "plan-f1"), prior.nodes.filter((node) => node.id !== "plan-f1"));
  assert.deepEqual(response.diagram?.edges, prior.edges);
  assert.deepEqual(activeState.latestValidatedSynthesisDraft, prior, "baseline input must not be mutated");
});

test("adding a requirement adds only the supported node and its incident links", async () => {
  const patch: SynthesisRefinementPatch = { ...emptyPatch(), addNodes: [{
    key: "expiry", label: "Require expiring consent evidence", description: "Consent evidence must expire after one day.",
    category: "Design requirement", stage: "design-requirement", supportConceptIds: supports,
    synthesisRationale: "Adapt cited consent evidence to the one-day expiry request.",
  }], addEdges: [
    { source: "user-problem", target: "refine-expiry", label: "motivates", rationale: "The problem requires bounded consent duration.", supportConceptIds: supports },
    { source: "refine-expiry", target: "plan-p1", label: "addressed by", rationale: "Minimal disclosure addresses consent evidence lifetime.", supportConceptIds: supports },
  ] };
  const { client } = mockClient((_, index) => index === 0 ? patch : approved);
  const result = await generateNativeOkfSynthesisRefinement({ client, environment, refinementRequest: "Add a consent expiry requirement.",
    problemStatement: prior.problemStatement, priorDraft: prior, grounding, requireRpfPath: true });
  assert.ok("diagram" in result, JSON.stringify(result));
  if (!("diagram" in result)) return;
  assert.deepEqual(result.diagram.nodes.slice(0, prior.nodes.length), prior.nodes);
  assert.deepEqual(result.diagram.edges.slice(0, prior.edges.length), prior.edges);
  assert.equal(result.diagram.nodes.length, prior.nodes.length + 1);
});

test("simplification removes only the optional component and incident edges", async () => {
  const patch = { ...emptyPatch(), removeNodeIds: ["plan-f2"] };
  const parsed = validateNativeOkfSynthesisRefinementPatch(patch, grounding, "Simplify the flow by removing the optional dashboard.");
  assert.equal(parsed.ok, true);
  const applied = await applyNativeOkfSynthesisRefinementPatch(prior, patch, grounding, prior.problemStatement, true);
  assert.ok(applied.ok, JSON.stringify(applied));
  if (!applied.ok) return;
  assert.deepEqual(applied.diagram.nodes, prior.nodes.filter((node) => node.id !== "plan-f2"));
  assert.deepEqual(applied.diagram.edges, prior.edges.filter((edge) => edge.source !== "plan-f2" && edge.target !== "plan-f2"));
});

for (const reason of ["Unrequested artifact rename", "Unnecessary filler requirement", "Unrelated rewiring", "Evidence does not justify the new constraint"]) {
  test(`reject a structurally valid but unjustified patch and retain baseline: ${reason}`, async () => {
    const patch = updateFeature();
    if (reason === "Unrequested artifact rename") {
      const old = prior.nodes.find((node) => node.id === "plan-a1")!;
      patch.updateNodes.push({ ...patch.updateNodes[0], nodeId: old.id, stage: old.stage, category: old.category, label: "New clinic platform", description: "An unrelated renamed platform." });
    } else if (reason === "Unnecessary filler requirement") {
      patch.addNodes.push({ key: "filler", label: "Require additional consent reporting", description: "Add extra reporting for a balanced graph.",
        category: "Design requirement", stage: "design-requirement", supportConceptIds: supports, synthesisRationale: "A needless additional branch using real evidence." });
      patch.addEdges.push(
        { source: "user-problem", target: "refine-filler", label: "motivates", rationale: "A filler branch.", supportConceptIds: supports },
        { source: "refine-filler", target: "plan-p1", label: "addressed by", rationale: "A filler connection.", supportConceptIds: supports },
      );
    } else if (reason === "Unrelated rewiring") {
      const edge = prior.edges.find((edge) => edge.source === "plan-r1")!;
      patch.removeEdges.push({ source: edge.source, target: edge.target, label: edge.label });
      patch.addEdges.push({ source: edge.source, target: edge.target, label: "addresses", rationale: "An unnecessary change to the existing relationship.", supportConceptIds: supports });
    }
    const { client, calls } = mockClient((body) => body.text?.format?.type === "json_schema" && body.text.format.name === "native_okf_refinement_review"
      ? { approved: false, errors: [reason] } : patch);
    const response = await answerNativeOkfChat({ question: "Refine the signed credential feature to expire after one day.", conversationState: activeState }, {
      conversationCatalog: catalog, retrieve: async () => retrieval, client, environment,
    });
    assert.equal(calls.length, reason === "Unrelated rewiring" ? 2 : 4, "unrequested removals fail deterministically; valid patches each receive review");
    assert.deepEqual(response.diagram?.nodes, prior.nodes);
    assert.deepEqual(response.diagram?.edges, prior.edges);
    assert.deepEqual(response.conversationState?.latestValidatedSynthesisDraft, prior);
    assert.match(response.answerMarkdown, /could not be validated.*retained unchanged/iu);
  });
}

test("one bounded repair can remove a collateral change before accepting the local edit", async () => {
  const patch = updateFeature();
  const collateral = { ...patch, updateNodes: [...patch.updateNodes, {
    ...patch.updateNodes[0], nodeId: "plan-f2", label: "Unrequested replacement audit dashboard", description: "An unrelated dashboard replacement.",
  }] };
  const { client, calls } = mockClient((_, index) => index === 0 ? collateral : index === 2 ? patch : index === 1
    ? { approved: false, errors: ["Remove an unrelated addition"] } : approved);
  const result = await generateNativeOkfSynthesisRefinement({ client, environment, refinementRequest: "Refine the signed credential feature.",
    problemStatement: prior.problemStatement, priorDraft: prior, grounding, requireRpfPath: true });
  assert.ok("diagram" in result);
  assert.equal(calls.length, 4);
  if ("diagram" in result) assert.deepEqual(result.diagram.nodes.find((node) => node.id === "plan-f2"), prior.nodes.find((node) => node.id === "plan-f2"));
  assert.match(String(calls[2].input), /Remove an unrelated addition/u);
});

test("invalid removal, unknown evidence, cycle and broken RPF path cannot replace the prior graph", async () => {
  const patches: SynthesisRefinementPatch[] = [
    { ...emptyPatch(), removeNodeIds: ["plan-p1"] },
    { ...emptyPatch(), removeNodeIds: ["user-problem"] },
    { ...updateFeature(), updateNodes: [{ ...updateFeature().updateNodes[0], supportConceptIds: ["invented/evidence"] }] },
    { ...emptyPatch(), addEdges: [{ source: "plan-f1", target: "plan-p1", label: "depends on", rationale: "Invalid backward dependency.", supportConceptIds: supports }] },
  ];
  for (const patch of patches) {
    const { client, calls } = mockClient(() => patch);
    const response = await answerNativeOkfChat({ question: "Remove the unnecessary principle and refine the feature.", conversationState: activeState }, {
      conversationCatalog: catalog, retrieve: async () => retrieval, client, environment,
    });
    assert.equal(calls.length, 2, "structural or evidence failures must not reach semantic review");
    assert.deepEqual(response.diagram?.nodes, prior.nodes);
    assert.deepEqual(response.diagram?.edges, prior.edges);
  }
});

test("malformed semantic review fails closed; empty patch preserves the graph", async () => {
  const { client } = mockClient((_, index) => index % 2 === 0 ? updateFeature() : { approved: true });
  const rejected = await generateNativeOkfSynthesisRefinement({ client, environment, refinementRequest: "Refine the signed credential feature.",
    problemStatement: prior.problemStatement, priorDraft: prior, grounding, requireRpfPath: true });
  assert.ok("errors" in rejected);
  const { client: noOp } = mockClient((_, index) => index === 0 ? emptyPatch() : approved);
  const preserved = await generateNativeOkfSynthesisRefinement({ client: noOp, environment, refinementRequest: "Additional context: preserve existing policy.",
    problemStatement: prior.problemStatement, priorDraft: prior, grounding, requireRpfPath: true });
  assert.ok("diagram" in preserved);
  if ("diagram" in preserved) {
    assert.deepEqual(preserved.diagram.nodes, prior.nodes);
    assert.deepEqual(preserved.diagram.edges, prior.edges);
  }
});

test("subsequent edits use the last accepted graph and a rejected turn preserves that newer baseline", async () => {
  const { client } = mockClient((_, index) => index === 0 ? updateFeature() : approved);
  const first = await answerNativeOkfChat({ question: "Refine the signed credential feature to expire after one day.", conversationState: activeState }, {
    conversationCatalog: catalog, retrieve: async () => retrieval, client, environment,
  });
  const latest = first.conversationState?.latestValidatedSynthesisDraft;
  assert.ok(latest);
  assert.notDeepEqual(latest.nodes, prior.nodes);
  const { client: invalid } = mockClient(() => ({ ...emptyPatch(), removeNodeIds: ["plan-p1"] }));
  const second = await answerNativeOkfChat({ question: "Remove the principle.", conversationState: first.conversationState }, {
    conversationCatalog: catalog, retrieve: async () => retrieval, client: invalid, environment,
  });
  assert.deepEqual(second.diagram?.nodes, latest.nodes);
  assert.deepEqual(second.diagram?.edges, latest.edges);
  assert.deepEqual(second.conversationState?.latestValidatedSynthesisDraft, latest);
});

test("saved draft roundtrip preserves display metadata and accepts legacy sessions", () => {
  assert.deepEqual(parseSynthesisDraftState(JSON.parse(JSON.stringify(prior))), prior);
  const { title: _title, explanation: _explanation, ...legacy } = prior;
  void _title;
  void _explanation;
  assert.deepEqual(parseSynthesisDraftState(legacy), legacy);
  assert.equal(parseSynthesisDraftState({ ...prior, title: "x".repeat(161) }), null);
});

test("rerender re-discloses evidence cited only by an unchanged relationship", async () => {
  const edgeSupport = [...grounding.eligibleStoredConceptIds][2]!;
  assert.ok(edgeSupport);
  const withEdgeEvidence: SynthesisDraftState = { ...prior,
    edges: prior.edges.map((edge, index) => index === 0 ? { ...edge, supportConceptIds: [edgeSupport] } : edge),
  };
  const state = { ...activeState, latestValidatedSynthesisDraft: withEdgeEvidence, synthesisDraft: withEdgeEvidence };
  const { client } = mockClient(() => { throw new Error("Rerender must reuse the graph"); });
  const response = await answerNativeOkfChat({ question: "Show the diagram again.", conversationState: state }, {
    conversationCatalog: catalog, retrieve: async () => ({ ...retrieval, noMatch: true, finalConcepts: [] }), client, environment,
  });
  assert.deepEqual(response.diagram?.edges, withEdgeEvidence.edges);
  assert.ok(response.sources.some((source) => source.conceptId === edgeSupport));
});

for (const subject of ["clinic consent", "sensor evidence", "freight claims"]) {
  test(`full mocked-provider pathway synthesizes a domain proposal, not stored topology: ${subject}`, async () => {
    const proposed = plan(subject);
    const { client, calls } = mockClient(() => proposed);
    const response = await answerNativeOkfChat({ question: `Generate an RPF map for auditable ${subject} across organizations.` }, {
      conversationCatalog: catalog, retrieve: async () => retrieval, client, environment,
    });
    assert.equal(response.diagramMode, "synthesized");
    assert.equal(response.diagramStatus, "success");
    assert.equal(calls.length, 2, "plan generation and existing quality review");
    assert.ok(response.diagram?.nodes.every((node) => node.stage === "problem" ? node.provenance === "user-provided" : node.provenance === "synthesized"));
    assert.ok(response.diagram?.nodes.every((node) => node.label.includes(subject)));
    assert.ok(supports.every((id) => response.sources.some((source) => source.conceptId === id)));
    assert.match(response.answerMarkdown, /grounded|proposed/iu);
    assert.ok(response.diagram && validateGeneratedDiagram(response.diagram, grounding, { mode: "synthesized", requireRpfPath: true }).ok);
  });
}
