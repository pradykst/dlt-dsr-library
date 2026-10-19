import "server-only";

import assert from "node:assert/strict";
import test from "node:test";
import type { Response, ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { loadNativeOkfConversationCatalog, prepareNativeOkfChatRequest } from "../server/conversation.ts";
import { answerNativeOkfChat, validateNativeOkfChatRequest } from "../server/openai/chat.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import { buildNativeOkfDiagramGrounding } from "../server/openai/diagram-grounding.ts";
import type { NativeOkfDiagramGrounding } from "../server/openai/diagram-grounding.ts";
import { validateGeneratedDiagram } from "../server/openai/diagram-validation.ts";
import { readOpenAiEnvironment } from "../server/openai/env.ts";
import { convertNativeOkfSynthesisPlan, OPTIONAL_SYNTHESIS_REVIEW_UNAVAILABLE_WARNING, type SynthesisPlan } from "../server/openai/synthesis-plan.ts";
import { generateNativeOkfDiagram } from "../server/openai/diagram.ts";
import { AiProviderUnavailableError } from "../server/openai/errors.ts";
import { NativeOkfBudgetTimeoutError, SYNTHESIS_QUALITY_REVIEW_TIMEOUT_MS } from "../server/openai/request-budget.ts";
import type { NativeOkfModelTurnMetrics } from "../server/openai/telemetry.ts";
import { applyNativeOkfSynthesisRefinementPatch, generateNativeOkfSynthesisRefinement,
  validateNativeOkfSynthesisRefinementPatch, type SynthesisRefinementPatch } from "../server/openai/synthesis-refinement.ts";
import { retrieveOkfContext } from "../server/retrieval.ts";
import { createInitialNativeOkfConversationState, type SynthesisDraftState } from "../shared/chat-types.ts";
import { parseSynthesisDraftState } from "../shared/synthesis-draft.ts";
import { compactNativeOkfConversationStateForRequest, parseNativeOkfConversationState } from "../shared/conversation-state.ts";

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

for (const failure of ["timeout", "unavailable"] as const) {
  test(`validated synthesis hides only the optional review diagnostic while retaining telemetry: ${failure}`, async (t) => {
    const logs: string[] = [];
    t.mock.method(console, "info", (line: string) => logs.push(line));
    const metrics: NativeOkfModelTurnMetrics[] = [];
    const { client, calls } = mockClient((_, index) => {
      if (index === 0) return plan();
      throw failure === "timeout"
        ? new NativeOkfBudgetTimeoutError("stage_deadline", SYNTHESIS_QUALITY_REVIEW_TIMEOUT_MS)
        : new AiProviderUnavailableError(503);
    });
    let internalWarnings: readonly string[] = [];
    const response = await answerNativeOkfChat({ question: "Propose a diagram for auditable clinic consent." }, {
      conversationCatalog: catalog, retrieve: async () => retrieval, client, environment,
      generateDiagram: async (input) => {
        const result = await generateNativeOkfDiagram(input);
        internalWarnings = Object.freeze(result.warnings);
        return result;
      },
      onModelMetrics: (value) => metrics.push(value),
    });
    assert.equal(response.diagramStatus, "success");
    assert.equal(response.diagramMode, "synthesized");
    assert.ok(response.diagram && validateGeneratedDiagram(response.diagram, grounding, { mode: "synthesized", requireRpfPath: true }).ok);
    assert.deepEqual(internalWarnings, [OPTIONAL_SYNTHESIS_REVIEW_UNAVAILABLE_WARNING]);
    assert.equal(response.warnings, undefined, "no empty Response Notes section for the diagnostic alone");
    assert.doesNotMatch(JSON.stringify(response), /optional proposal quality review|openai_timeout|ai_provider_unavailable/u);
    assert.ok(response.sources.length > 0);
    assert.equal(calls.length, 2, "generation and review behavior is unchanged");
    assert.equal(metrics[0].status, "success");
    const review = metrics[0].calls.find((call) => call.stage === "synthesis-quality-review")!;
    assert.equal(review.status, "error");
    assert.equal(review.errorCode, failure === "timeout" ? "openai_timeout" : "ai_provider_unavailable");
    assert.equal(review.configuredTimeoutMs, SYNTHESIS_QUALITY_REVIEW_TIMEOUT_MS);
    assert.equal(review.maxRetries, 0);
    assert.ok(logs.some((line) => line.includes('"stage":"synthesis-quality-review"') && line.includes('"status":"error"')));
    assert.doesNotMatch(logs.join("\n"), /mock-model.*apiKey|private provider|Propose a diagram for auditable clinic consent/u);
  });
}

test("successful proposals retain evidence gaps, unsupported assumptions and similarly worded review limitations", async () => {
  const actionable = [
    "No direct evidence supports deployment across clinics; evaluate this assumption before use.",
    "The proposed sharing mechanism assumes reliable connectivity, which is not supported by the cited evidence.",
    "The synthesis plan required one bounded structural repair.",
    "The optional proposal quality revision could not be applied safely; the original validated plan was retained.",
    "The mandatory evidence review was unavailable; the prior validated proposal was retained.",
  ];
  const warnings = Object.freeze([OPTIONAL_SYNTHESIS_REVIEW_UNAVAILABLE_WARNING, ...actionable]);
  const request = { question: "Propose a diagram for auditable clinic consent." };
  const dependencies = { conversationCatalog: catalog, retrieve: async () => retrieval, environment,
    client: mockClient(() => { throw new Error("No provider needed for this presentation fixture"); }).client };
  const baseline = await answerNativeOkfChat(request, { ...dependencies,
    generateDiagram: async () => ({ diagram: converted.diagram, warnings: [], usedSupportConceptIds: supports }) });
  const presented = await answerNativeOkfChat(request, { ...dependencies,
    generateDiagram: async () => ({ diagram: converted.diagram, warnings: [...warnings], usedSupportConceptIds: supports }) });
  assert.deepEqual(presented.warnings, actionable, "meaningful Response Notes are retained in order");
  const { warnings: _warnings, ...withoutWarnings } = presented;
  void _warnings;
  assert.deepEqual(withoutWarnings, baseline, "diagram, narrative, citations and validated state remain identical");
  assert.deepEqual(warnings, [OPTIONAL_SYNTHESIS_REVIEW_UNAVAILABLE_WARNING, ...actionable]);
});

test("mandatory synthesis failure still reports a failure and cannot become a successful diagram", async () => {
  const response = await answerNativeOkfChat({ question: "Propose a diagram for auditable clinic consent.",
    conversationState: { ...createInitialNativeOkfConversationState(), synthesisClarificationRounds: 2 } }, {
    conversationCatalog: catalog, retrieve: async () => retrieval, environment,
    client: mockClient(() => { throw new Error("No provider needed for this failure fixture"); }).client,
    generateDiagram: async () => ({ warnings: ["Mandatory evidence validation failed."], diagnosticCode: "synthesis-plan-repair-failed" }),
  });
  assert.equal(response.presentationMode, "safe-error");
  assert.equal(response.diagramStatus, "failed");
  assert.equal(response.diagram, undefined);
  assert.equal(response.diagnosticCode, "synthesis-plan-repair-failed");
  assert.match(response.answerMarkdown, /validated synthesized flow could not be produced/u);
});

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

test("client compaction preserves refined metadata through server parsing and rerender", async () => {
  const { client: generationClient } = mockClient(() => plan());
  const generated = await answerNativeOkfChat({ question: "Generate an RPF map for auditable clinic consent across organizations." }, {
    conversationCatalog: catalog, retrieve: async () => retrieval, client: generationClient, environment,
  });
  assert.ok(generated.diagram);
  // The client parses JSON responses, then compacts the state on each follow-up.
  const generatedClientState = parseNativeOkfConversationState(JSON.parse(JSON.stringify(generated.conversationState)));
  assert.ok(generatedClientState);
  const patch = updateFeature();
  const { client: refinementClient } = mockClient((body) => body.text?.format?.type === "json_schema" && body.text.format.name === "native_okf_refinement_review" ? approved : patch);
  const refined = await answerNativeOkfChat(JSON.parse(JSON.stringify({
    question: "Refine the signed credential feature to expire after one day.",
    conversationState: compactNativeOkfConversationStateForRequest(generatedClientState),
  })), { conversationCatalog: catalog, retrieve: async () => retrieval, client: refinementClient, environment });
  assert.ok(refined.diagram);
  assert.equal(refined.diagram.title, generated.diagram.title);
  assert.equal(refined.diagram.explanation, generated.diagram.explanation);
  assert.equal(refined.diagram.nodes.find((node) => node.id === "plan-f1")?.label, patch.updateNodes[0].label);
  const snapshot = JSON.stringify(refined.diagram);
  const refinedClientState = parseNativeOkfConversationState(JSON.parse(JSON.stringify(refined.conversationState)));
  assert.ok(refinedClientState);
  const wireRequest = JSON.parse(JSON.stringify({
    question: "Show the same diagram again",
    conversationState: compactNativeOkfConversationStateForRequest(refinedClientState),
  }));
  const parsedRequest = validateNativeOkfChatRequest(wireRequest);
  const serverState = parseNativeOkfConversationState(parsedRequest.conversationState);
  assert.ok(serverState?.latestValidatedSynthesisDraft);
  assert.equal(serverState.latestValidatedSynthesisDraft.title, refined.diagram.title);
  assert.equal(serverState.latestValidatedSynthesisDraft.explanation, refined.diagram.explanation);
  assert.deepEqual(serverState.latestValidatedSynthesisDraft.nodes, refined.diagram.nodes);
  assert.deepEqual(serverState.latestValidatedSynthesisDraft.edges, refined.diagram.edges);
  const { client: rerenderClient, calls } = mockClient(() => { throw new Error("Rerender must reuse the saved diagram"); });
  const rerendered = await answerNativeOkfChat(wireRequest, {
    conversationCatalog: catalog, retrieve: async () => retrieval, client: rerenderClient, environment,
  });
  assert.equal(calls.length, 0);
  assert.equal(rerendered.diagramStatus, "success");
  // Full node/edge equality includes identities, content, stages, provenance,
  // sourcePaths, supportConceptIds, and synthesis rationales, as well as metadata.
  assert.deepEqual(rerendered.diagram, refined.diagram);
  assert.deepEqual(rerendered.conversationState?.latestValidatedSynthesisDraft, serverState.latestValidatedSynthesisDraft);
  assert.deepEqual(new Set(rerendered.sources.map((source) => source.conceptId)), new Set(refined.sources.map((source) => source.conceptId)));
  assert.equal(JSON.stringify(refined.diagram), snapshot, "compaction and rerender must not mutate the baseline");
});

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

for (const subject of ["clinic consent", "sensor evidence", "freight claims", "shop access"]) {
  test(`full mocked-provider pathway synthesizes a domain proposal, not stored topology: ${subject}`, async () => {
    const proposed = plan(subject);
    const { client, calls } = mockClient(() => proposed);
    const question = subject === "shop access"
      ? "I want to use NFTs for allowing access to parts of my online shops. Which requirements, principles and features may I use, show me in a diagram"
      : `We need auditable ${subject} across organizations. Which requirements could we use? Show a diagram.`;
    const response = await answerNativeOkfChat({ question }, {
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

// Canonical mechanism descriptions from the actual failed marketplace replay.
test("indirect proposals fail honestly without substituting a stored source map", async () => {
  const question = "We need auditable credentials across institutions. Which requirements could we use? Show a diagram.";
  const invalid = mockClient(() => ({ invalid: true }));
  const response = await answerNativeOkfChat({ question }, {
    conversationCatalog: catalog, retrieve: async () => retrieval, client: invalid.client, environment,
  });
  assert.ok(invalid.calls.length > 0, "the synthesis provider must actually be invoked");
  assert.notEqual(response.diagramMode, "stored");
  assert.equal(response.diagram, undefined);
  assert.ok(response.kind === "clarification" || response.diagramStatus === "failed");
  const unavailable = mockClient(() => { throw new Error("Mock provider unavailable"); });
  await assert.rejects(answerNativeOkfChat({ question }, {
    conversationCatalog: catalog, retrieve: async () => retrieval, client: unavailable.client, environment,
  }));
});

// Neither source states the researcher-specific product/consent/credential need.
const verificationIds = ["design-knowledge/cross-org-identity-ssi-do2", "design-knowledge/blockchain-iot-sensor-data-dp2"];
const verificationGrounding: NativeOkfDiagramGrounding = {
  allowedConceptIds: new Set(verificationIds), eligibleStoredConceptIds: new Set(verificationIds), storedRelations: [],
  conceptsById: new Map([
    [verificationIds[0], { conceptId: verificationIds[0], title: "DO2 - Verification", type: "design-objective", stage: "design-objective",
      description: "Verify certificates by checking their validity, signature, and integrity." }],
    [verificationIds[1], { conceptId: verificationIds[1], title: "DP2 - Cross-validation certification", type: "design-principle", stage: "design-principle",
      description: "Sensor data are certified on the basis of cross-validation." }],
  ]),
};

function verificationFixture(subject: string) {
  const baselinePlan = plan(subject);
  baselinePlan.supportingStoredConceptIds = verificationIds;
  for (const node of [...baselinePlan.requirements, ...baselinePlan.principles, ...baselinePlan.features, ...baselinePlan.artifact]) node.supportConceptIds = verificationIds;
  baselinePlan.principles[0].label = "Make verification claims attributable and inspectable";
  baselinePlan.principles[0].description = "Expose the claim issuer, integrity evidence, and validation status so participants can inspect verification claims.";
  for (const edge of baselinePlan.relationships) edge.supportConceptIds = verificationIds;
  const diagram = convertNativeOkfSynthesisPlan(baselinePlan, verificationGrounding, baselinePlan.problemSummary, true)!.diagram;
  const draft: SynthesisDraftState = { ...prior, title: diagram.title, explanation: diagram.explanation, problemStatement: baselinePlan.problemSummary, nodes: diagram.nodes, edges: diagram.edges };
  const patch: SynthesisRefinementPatch = { ...emptyPatch(), addNodes: [{
    key: "independent-verification", label: `Independent ${subject} verification`, category: "Design requirement", stage: "design-requirement",
    description: `Require independent ${subject} verification through inspectable certification evidence.`, supportConceptIds: verificationIds,
    synthesisRationale: "The researcher specifies the requirement. Adapt the cited certificate integrity checks and cross-validation mechanism; neither paper is claimed to state this domain requirement.",
  }], addEdges: [
    { source: "user-problem", target: "refine-independent-verification", label: "motivates", supportConceptIds: verificationIds,
      rationale: "The researcher's requested requirement extends the stated design problem; the cited concepts support its proposed verification mechanism." },
    { source: "refine-independent-verification", target: "plan-p1", label: "requires", supportConceptIds: verificationIds,
      rationale: "Inspecting attributable claims, certificate integrity, and validation status supports independent verification." },
  ] };
  return { draft, patch };
}

function assertVerificationReviewContext(body: ResponseCreateParamsNonStreaming, patch: SynthesisRefinementPatch) {
  const input = JSON.parse(String(body.input));
  assert.deepEqual(input.proposedPatch, patch);
  assert.deepEqual(input.addedNodeIdByKey, Object.fromEntries(patch.addNodes.map((node) => [node.key, `refine-${node.key}`])));
  const ids = new Set([...input.priorValidatedDraft.nodes.map((node: { id: string }) => node.id), ...Object.values(input.addedNodeIdByKey)]);
  assert.ok(patch.addEdges.every((edge) => ids.has(edge.source) && ids.has(edge.target)), "the reviewer sees actual converter IDs, not unprefixed keys");
  assert.match(body.instructions!, /It need not occur literally in a paper/u);
  assert.match(body.instructions!, /Scholarly evidence must justify the adapted mechanism and requirement-to-principle relationship/u);
  assert.match(body.instructions!, /Reject misleading attribution/u);
  assert.match(body.instructions!, /structural validity alone never authorizes a patch/u);
  assert.equal(input.freshAllowlistedConcepts.length, verificationIds.length, "the fix never expands fresh evidence");
}

for (const subject of ["product", "hospital consent", "university credential"]) {
  test(`researcher-specified ${subject} requirement uses mechanism evidence and resolved IDs without collateral changes`, async () => {
    const { draft, patch } = verificationFixture(subject);
    const snapshot = JSON.stringify(draft);
    const { client, calls } = mockClient((body, index) => {
      if (index === 0) {
        assert.match(body.instructions!, /An explicitly researcher-specified requirement is a proposed design constraint/u);
        assert.match(body.instructions!, /do not invent additional product attributes/u);
        return patch;
      }
      assertVerificationReviewContext(body, patch);
      return approved;
    });
    const result = await generateNativeOkfSynthesisRefinement({ client, environment, grounding: verificationGrounding, priorDraft: draft,
      problemStatement: draft.problemStatement, refinementRequest: `Add independent ${subject} verification as a requirement. Preserve everything else.`, requireRpfPath: true });
    assert.ok("diagram" in result);
    assert.equal(calls.length, 2, "mandatory review still runs");
    if (!("diagram" in result)) return;
    assert.deepEqual(result.diagram.nodes.slice(0, draft.nodes.length), draft.nodes);
    assert.deepEqual(result.diagram.edges.slice(0, draft.edges.length), draft.edges);
    assert.equal(result.diagram.nodes.length, draft.nodes.length + 1);
    assert.equal(result.diagram.edges.length, draft.edges.length + 2);
    assert.equal(result.diagram.nodes.at(-1)?.provenance, "synthesized");
    assert.deepEqual(result.diagram.nodes.at(-1)?.supportConceptIds, verificationIds);
    assert.equal(result.diagram.title, draft.title);
    assert.equal(result.diagram.explanation, draft.explanation);
    assert.equal(JSON.stringify(draft), snapshot);
  });
}

test("review rejects overclaimed support and one repair scopes the researcher requirement without changing its mechanism", async () => {
  const { draft, patch } = verificationFixture("product");
  const overclaim = structuredClone(patch);
  overclaim.addNodes[0].description = "Guarantee that every physical product attribute is independently proven correct against authoritative sources.";
  const feedback = "Certificate validity and sensor cross-validation do not establish authoritative verification of every physical product attribute. Remove those unsupported guarantees.";
  const { client, calls } = mockClient((body, index) => {
    if (index === 0) return overclaim;
    if (index === 1) { assertVerificationReviewContext(body, overclaim); return { approved: false, errors: [feedback] }; }
    if (index === 2) { assert.deepEqual(JSON.parse(String(body.input)).validationErrors, [feedback]); return patch; }
    assertVerificationReviewContext(body, patch);
    return approved;
  });
  const result = await generateNativeOkfSynthesisRefinement({ client, environment, grounding: verificationGrounding, priorDraft: draft,
    problemStatement: draft.problemStatement, refinementRequest: "Add independent product verification as a requirement. Preserve everything else.", requireRpfPath: true });
  assert.equal(calls.length, 4);
  assert.ok("diagram" in result);
  if ("diagram" in result) {
    assert.deepEqual(result.diagram.nodes.slice(0, draft.nodes.length), draft.nodes);
    assert.deepEqual(result.diagram.edges.slice(0, draft.edges.length), draft.edges);
    assert.equal(result.diagram.nodes.at(-1)?.description, patch.addNodes[0].description);
    assert.match(result.warnings.join(" "), /one bounded repair/u);
  }
});

for (const failure of ["unrelated branch", "unsupported relationship"]) {
  test(`explicitly requested requirement does not authorize an ${failure}; rejected patches retain the graph`, async () => {
    const { draft, patch } = verificationFixture("product");
    if (failure === "unrelated branch") {
      patch.addNodes.push({ ...patch.addNodes[0], key: "filler", label: "Additional product reporting", description: "An unrequested reporting requirement." });
      patch.addEdges.push(
        { ...patch.addEdges[0], target: "refine-filler" }, { ...patch.addEdges[1], source: "refine-filler" },
      );
    } else {
      patch.addEdges[1].rationale = "Inspecting a certificate signature guarantees that physical product quality is independently proven.";
    }
    const { client, calls } = mockClient((body) => {
      if (body.text?.format?.type === "json_schema" && body.text.format.name === "native_okf_refinement_review") {
        assertVerificationReviewContext(body, patch);
        return { approved: false, errors: [failure] };
      }
      return patch;
    });
    const refused = await generateNativeOkfSynthesisRefinement({ client, environment, grounding: verificationGrounding, priorDraft: draft,
      problemStatement: draft.problemStatement, refinementRequest: "Add independent product verification as a requirement. Preserve everything else.", requireRpfPath: true });
    assert.ok("errors" in refused);
    assert.equal(calls.length, 4, "one repair cannot bypass a repeated semantic rejection");
    // Exercise the real chat's existing fail-closed retention with canonical evidence.
    const state = { ...activeState, latestValidatedSynthesisDraft: draft, synthesisDraft: draft };
    const { client: rejected } = mockClient((body) => body.text?.format?.type === "json_schema" && body.text.format.name === "native_okf_refinement_review"
      ? { approved: false, errors: [failure] } : patch);
    const response = await answerNativeOkfChat({ question: "Add independent product verification as a requirement. Preserve everything else.", conversationState: state }, {
      client: rejected, environment, conversationCatalog: catalog, retrieve: async () => retrieval,
    });
    assert.deepEqual(response.diagram?.nodes, draft.nodes);
    assert.deepEqual(response.diagram?.edges, draft.edges);
    assert.deepEqual(response.conversationState?.latestValidatedSynthesisDraft, draft);
  });
}
