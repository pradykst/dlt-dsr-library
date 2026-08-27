import "server-only";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { Response } from "openai/resources/responses/responses";

import {
  inferNativeOkfSynthesisIntent,
  prepareNativeOkfChatRequest,
} from "../server/conversation.ts";
import { isNativeOkfLiveDataRequest } from "../server/live-data-gate.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import {
  type NativeOkfDiagramGrounding,
} from "../server/openai/diagram-grounding.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import { answerNativeOkfChat } from "../server/openai/chat.ts";
import {
  buildNativeOkfSynthesisPlanInput,
  convertNativeOkfSynthesisPlan,
  deterministicNativeOkfSynthesisSummary,
  generateNativeOkfSynthesisPlan,
  SYNTHESIS_PLAN_JSON_SCHEMA,
  SYNTHESIS_PLAN_LIMITS,
  type SynthesisPlan,
  validateNativeOkfSynthesisPlan,
} from "../server/openai/synthesis-plan.ts";
import { layoutGeneratedDiagram } from "../components/chat/diagram-layout.ts";
import { createInitialNativeOkfConversationState } from "../shared/chat-types.ts";

const ENVIRONMENT: NativeOpenAiEnvironment = {
  apiKey: "mock-only-not-live",
  model: "mock-model",
  reasoningEffort: "low",
  moderationEnabled: false,
  maxOutputTokens: 900,
  diagramMaxOutputTokens: 2_000,
};

function grounding(): NativeOkfDiagramGrounding {
  const concepts = [
    { conceptId: "fixture/r1", title: "Canonical requirement one", description: "Canonical requirement description one.", type: "design-requirement", stage: "design-requirement" as const },
    { conceptId: "fixture/r2", title: "Canonical requirement two", description: "Canonical requirement description two.", type: "design-requirement", stage: "design-requirement" as const },
    { conceptId: "fixture/p1", title: "Canonical principle one", description: "Canonical principle description one.", type: "design-principle", stage: "design-principle" as const },
    { conceptId: "fixture/p2", title: "Canonical principle two", description: "Canonical principle description two.", type: "design-principle", stage: "design-principle" as const },
    { conceptId: "fixture/f1", title: "Canonical feature one", description: "Canonical feature description one.", type: "design-feature", stage: "design-feature" as const },
    { conceptId: "fixture/f2", title: "Canonical feature two", description: "Canonical feature description two.", type: "design-feature", stage: "design-feature" as const },
    { conceptId: "fixture/e1", title: "Canonical evaluation", description: "Canonical evaluation description.", type: "evaluation", stage: "evaluation" as const },
  ];
  const ids = new Set(concepts.map((concept) => concept.conceptId));
  return {
    allowedConceptIds: ids,
    eligibleStoredConceptIds: ids,
    conceptsById: new Map(concepts.map((concept) => [concept.conceptId, concept])),
    storedRelations: [
      { sourceId: "fixture/r1", targetId: "fixture/p1", label: "addressed by" },
      { sourceId: "fixture/p1", targetId: "fixture/f1", label: "implemented by" },
    ],
  };
}

function validPlan(): SynthesisPlan {
  return {
    title: "Grounded cross-context proposal",
    problemSummary: "Model-written problem text that the server must not trust.",
    requirements: [
      {
        key: "requirement-one",
        label: "Ignored requirement label",
        description: "Ignored requirement description.",
        supportConceptIds: ["fixture/r1"],
        reuseStoredConceptId: "fixture/r1",
      },
      {
        key: "requirement-two",
        label: "Preserve accountable continuity",
        description: "Maintain continuity while bounding disclosure.",
        supportConceptIds: ["fixture/r2"],
        reuseStoredConceptId: null,
      },
    ],
    principles: [
      {
        key: "principle-one",
        label: "Ignored principle label",
        description: "Ignored principle description.",
        supportConceptIds: ["fixture/p1"],
        reuseStoredConceptId: "fixture/p1",
      },
      {
        key: "principle-two",
        label: "Minimize disclosed context",
        description: "Reveal only the context required for the decision.",
        supportConceptIds: ["fixture/p2"],
        reuseStoredConceptId: null,
      },
    ],
    features: [
      {
        key: "feature-one",
        label: "Ignored feature label",
        description: "Ignored feature description.",
        supportConceptIds: ["fixture/f1"],
        reuseStoredConceptId: "fixture/f1",
      },
      {
        key: "feature-two",
        label: "Selective continuity proof",
        description: "Provide a bounded proof without exposing unrelated history.",
        supportConceptIds: ["fixture/f2"],
        reuseStoredConceptId: null,
      },
    ],
    artifact: [],
    evaluation: [{
      key: "evaluation-one",
      label: "Evaluate continuity and privacy",
      description: "Measure continuity preservation and unnecessary disclosure.",
      supportConceptIds: ["fixture/e1"],
      reuseStoredConceptId: null,
    }],
    outcome: [],
    relationships: [
      { sourceKey: "problem", targetKey: "requirement-one", label: "requires", supportConceptIds: ["fixture/r1"] },
      { sourceKey: "problem", targetKey: "requirement-two", label: "requires", supportConceptIds: ["fixture/r2"] },
      { sourceKey: "requirement-one", targetKey: "principle-one", label: "addressed by", supportConceptIds: ["fixture/r1", "fixture/p1"] },
      { sourceKey: "requirement-two", targetKey: "principle-two", label: "addressed by", supportConceptIds: ["fixture/r2", "fixture/p2"] },
      { sourceKey: "principle-one", targetKey: "feature-one", label: "implemented by", supportConceptIds: ["fixture/p1", "fixture/f1"] },
      { sourceKey: "principle-two", targetKey: "feature-two", label: "implemented by", supportConceptIds: ["fixture/p2", "fixture/f2"] },
      { sourceKey: "feature-one", targetKey: "evaluation-one", label: "evaluated by", supportConceptIds: ["fixture/f1", "fixture/e1"] },
      { sourceKey: "feature-two", targetKey: "evaluation-one", label: "evaluated by", supportConceptIds: ["fixture/f2", "fixture/e1"] },
    ],
  };
}

function clonePlan(): SynthesisPlan {
  return structuredClone(validPlan());
}

function response(outputText: string): Response {
  return {
    id: "mock-response",
    object: "response",
    created_at: 0,
    model: "mock-model",
    output: [],
    output_text: outputText,
    status: "completed",
    error: null,
    incomplete_details: null,
    usage: {
      input_tokens: 10,
      input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 },
      output_tokens: 10,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 20,
    },
  } as unknown as Response;
}

function queuedClient(outputs: readonly string[], calls: Array<Record<string, unknown>>): NativeOpenAiClient {
  let cursor = 0;
  return {
    responses: {
      create: async (request) => {
        calls.push(request as unknown as Record<string, unknown>);
        return response(outputs[cursor++] ?? "");
      },
    },
    moderations: {
      create: async () => ({ results: [{ flagged: false }] }) as never,
    },
  };
}

function planForGrounding(value: NativeOkfDiagramGrounding): SynthesisPlan {
  const ids = [...value.eligibleStoredConceptIds];
  assert.ok(ids.length >= 2);
  const support = (index: number) => [ids[index % ids.length]!];
  return {
    title: "Validated problem-specific synthesis",
    problemSummary: "A model summary that is replaced by validated server input.",
    requirements: [
      { key: "r-one", label: "Bound the first requirement", description: "A grounded synthesized requirement.", supportConceptIds: support(0), reuseStoredConceptId: null },
      { key: "r-two", label: "Bound the second requirement", description: "A second grounded synthesized requirement.", supportConceptIds: support(1), reuseStoredConceptId: null },
    ],
    principles: [
      { key: "p-one", label: "Apply the first principle", description: "A grounded synthesized principle.", supportConceptIds: support(0), reuseStoredConceptId: null },
      { key: "p-two", label: "Apply the second principle", description: "A second grounded synthesized principle.", supportConceptIds: support(1), reuseStoredConceptId: null },
    ],
    features: [
      { key: "f-one", label: "Implement the first feature", description: "A grounded synthesized feature.", supportConceptIds: support(0), reuseStoredConceptId: null },
      { key: "f-two", label: "Implement the second feature", description: "A second grounded synthesized feature.", supportConceptIds: support(1), reuseStoredConceptId: null },
    ],
    artifact: [],
    evaluation: [],
    outcome: [],
    relationships: [
      { sourceKey: "problem", targetKey: "r-one", label: "requires", supportConceptIds: support(0) },
      { sourceKey: "problem", targetKey: "r-two", label: "requires", supportConceptIds: support(1) },
      { sourceKey: "r-one", targetKey: "p-one", label: "addressed by", supportConceptIds: support(0) },
      { sourceKey: "r-two", targetKey: "p-two", label: "addressed by", supportConceptIds: support(1) },
      { sourceKey: "p-one", targetKey: "f-one", label: "implemented by", supportConceptIds: support(0) },
      { sourceKey: "p-two", targetKey: "f-two", label: "implemented by", supportConceptIds: support(1) },
    ],
  };
}

test("SynthesisPlan schema exposes content only and excludes renderer-owned fields", () => {
  const schema = JSON.stringify(SYNTHESIS_PLAN_JSON_SCHEMA);
  for (const forbidden of [
    "coordinates",
    "sourcePaths",
    "provenance",
    "layout",
    "x",
    "y",
    "order",
    "group",
    "synthesis",
    "renderer",
  ]) {
    assert.equal(schema.includes(`\"${forbidden}\"`), false, forbidden);
  }
  assert.match(schema, /supportConceptIds/);
  assert.match(schema, /reuseStoredConceptId/);
});

test("valid SynthesisPlan converts deterministically to the current internal diagram", async () => {
  const validation = validateNativeOkfSynthesisPlan(validPlan(), grounding());
  assert.equal(validation.ok, true);
  if (!validation.ok) return;
  const converted = convertNativeOkfSynthesisPlan(
    validation.plan,
    grounding(),
    "Validated fragmented identity and review-continuity problem.",
  );
  assert.ok(converted);
  assert.equal(converted.diagram.nodes.length, 8);
  assert.equal(converted.diagram.edges.length, 8);
  const problem = converted.diagram.nodes[0]!;
  assert.equal(problem.id, "user-problem");
  assert.equal(problem.provenance, "user-provided");
  assert.deepEqual(problem.sourcePaths, []);
  assert.match(problem.label, /Validated fragmented identity/);
  const reused = converted.diagram.nodes.find((node) => node.id === "plan-requirement-one")!;
  assert.equal(reused.label, "Canonical requirement one");
  assert.equal(reused.description, "Canonical requirement description one.");
  assert.equal(reused.provenance, "stored");
  assert.deepEqual(reused.sourcePaths, ["fixture/r1"]);
  const synthesized = converted.diagram.nodes.find((node) => node.id === "plan-requirement-two")!;
  assert.equal(synthesized.stage, "design-requirement");
  assert.equal(synthesized.provenance, "synthesized");
  assert.deepEqual(synthesized.sourcePaths, ["fixture/r2"]);
  assert.equal(converted.diagram.edges.find((edge) =>
    edge.source === "plan-requirement-one" && edge.target === "plan-principle-one"
  )?.provenance, "stored");
  const layout = await layoutGeneratedDiagram(converted.diagram, {
    orientation: "horizontal",
    edgeLabelsVisible: true,
  });
  assert.equal(layout.nodes.length, converted.diagram.nodes.length);
});

test("SynthesisPlan validation enforces grounding, requested paths, and graph invariants", async (t) => {
  const cases: Array<{ name: string; mutate: (plan: SynthesisPlan) => void; code: RegExp }> = [
    {
      name: "unknown node support",
      mutate: (plan) => { plan.requirements[0]!.supportConceptIds = ["unknown"]; },
      code: /invalid-support/,
    },
    {
      name: "unknown relationship support",
      mutate: (plan) => { plan.relationships[0]!.supportConceptIds = ["unknown"]; },
      code: /invalid-value/,
    },
    {
      name: "missing RPF path",
      mutate: (plan) => { plan.relationships = plan.relationships.filter((edge) => edge.sourceKey !== "problem"); },
      code: /missing-rpf-path|disconnected/,
    },
    {
      name: "orphan",
      mutate: (plan) => { plan.relationships = plan.relationships.filter((edge) => edge.sourceKey !== "feature-two" && edge.targetKey !== "feature-two"); },
      code: /disconnected/,
    },
    {
      name: "cycle or backward jump",
      mutate: (plan) => { plan.relationships.push({ sourceKey: "feature-one", targetKey: "requirement-one", label: "loops to", supportConceptIds: ["fixture/f1"] }); },
      code: /backward-stage-jump|cycle/,
    },
    {
      name: "duplicate semantic node",
      mutate: (plan) => { plan.features[1]!.label = plan.features[0]!.label; },
      code: /duplicate-semantic-node/,
    },
  ];
  for (const item of cases) {
    await t.test(item.name, () => {
      const plan = clonePlan();
      item.mutate(plan);
      const result = validateNativeOkfSynthesisPlan(
        plan,
        grounding(),
        { requireRpfPath: item.name === "missing RPF path" },
      );
      assert.equal(result.ok, false);
      if (!result.ok) assert.match(result.errors.join(" "), item.code);
    });
  }

  await t.test("rendered-node and relationship bounds", () => {
    const plan = clonePlan();
    for (let index = 0; index < SYNTHESIS_PLAN_LIMITS.maxRenderedNodes; index += 1) {
      plan.requirements.push({
        key: `extra-requirement-${index}`,
        label: `Additional requirement ${index}`,
        description: `Additional grounded requirement ${index}.`,
        supportConceptIds: ["fixture/r2"],
        reuseStoredConceptId: null,
      });
    }
    const result = validateNativeOkfSynthesisPlan(plan, grounding());
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(
        result.errors.includes("plan:too-many-rendered-nodes") ||
        result.errors.includes("requirements:invalid-count"),
      );
    }
    assert.equal(SYNTHESIS_PLAN_LIMITS.maxRenderedNodes, 48);
    assert.equal(SYNTHESIS_PLAN_LIMITS.maxRelationships, 96);
  });
});

test("synthesis summary is deterministic, count-derived, provenance-aware, and concise", () => {
  const converted = convertNativeOkfSynthesisPlan(
    validPlan(),
    grounding(),
    "Fragmented product identity loses review continuity across marketplaces.",
  );
  assert.ok(converted);
  const first = deterministicNativeOkfSynthesisSummary(validPlan(), converted.diagram);
  const second = deterministicNativeOkfSynthesisSummary(validPlan(), converted.diagram);
  assert.equal(first, second);
  assert.match(first, /2 requirements, 2 principles, and 2 features/);
  assert.match(first, /exact stored knowledge/);
  assert.match(first, /synthesized adaptations/);
  assert.ok(first.trim().split(/\s+/u).length < 100);
  assert.equal(first.includes("Selective continuity proof"), false);
});

test("plan generation uses the content-only schema, makes no answer call, and repairs once without raw replay", async () => {
  const calls: Array<Record<string, unknown>> = [];
  const marker = "RAW_INVALID_PLAN_MUST_NOT_BE_REPLAYED";
  const result = await generateNativeOkfSynthesisPlan({
    client: queuedClient([marker, JSON.stringify(validPlan())], calls),
    environment: ENVIRONMENT,
    problemStatement: "Validated fragmented identity problem.",
    refinementRequest: "Add a privacy-preserving evaluation.",
    domain: "cross-marketplace product identity",
    objective: "preserve review continuity",
    constraints: ["privacy preserving"],
    grounding: grounding(),
    priorDraft: null,
  });
  assert.equal(calls.length, 2);
  assert.ok(result.diagram);
  assert.equal(result.diagram?.nodes[0]?.label, "Validated fragmented identity problem");
  assert.equal((calls[0]?.text as { format?: { name?: string } })?.format?.name, "native_okf_synthesis_plan");
  assert.equal(JSON.stringify(calls[0]).includes("native_okf_generated_diagram"), false);
  assert.equal(JSON.stringify(calls[1]).includes(marker), false);
  assert.match(String(calls[1]?.input), /validationErrors/);
  assert.equal(result.warnings.length, 1);

  const failedCalls: Array<Record<string, unknown>> = [];
  const failed = await generateNativeOkfSynthesisPlan({
    client: queuedClient([marker, marker], failedCalls),
    environment: ENVIRONMENT,
    problemStatement: "Validated fragmented identity problem.",
    refinementRequest: "Retry.",
    domain: null,
    objective: null,
    constraints: [],
    grounding: grounding(),
    priorDraft: null,
  });
  assert.equal(failedCalls.length, 2);
  assert.equal(failed.diagram, undefined);
  assert.equal(failed.diagnosticCode, "synthesis-plan-repair-failed");
});

test("repair input remains bounded to problem, constraints, allowlist descriptions, and error codes", () => {
  const input = buildNativeOkfSynthesisPlanInput({
    client: queuedClient([], []),
    environment: ENVIRONMENT,
    problemStatement: "A validated problem.",
    refinementRequest: "A bounded refinement.",
    domain: "a domain",
    objective: "an objective",
    constraints: ["one constraint"],
    grounding: grounding(),
    priorDraft: null,
  }, ["plan:missing-rpf-path"]);
  assert.match(input, /allowlistedConcepts/);
  assert.match(input, /plan:missing-rpf-path/);
  assert.equal(input.includes("MARKDOWN_BODY"), false);
  assert.equal(input.includes("priorValidatedDraft"), false);
});

test("exact stored paper map is diagram-primary and bypasses both model paths", async () => {
  let responses = 0;
  let moderations = 0;
  const client: NativeOpenAiClient = {
    responses: { create: async () => { responses += 1; throw new Error("must not run"); } },
    moderations: { create: async () => { moderations += 1; throw new Error("must not run"); } },
  };
  const result = await answerNativeOkfChat(
    {
      question: "Show the requirements, principles and features from Blockchain for the IoT.",
      includeDiagram: true,
    },
    { environment: ENVIRONMENT, client },
  );
  assert.equal(responses, 0);
  assert.equal(moderations, 0);
  assert.equal(result.presentationMode, "diagram-primary");
  assert.equal(result.diagramMode, "stored");
  assert.equal(result.diagramStatus, "success");
  assert.equal(result.diagram?.nodes.length, 17);
  assert.equal(result.diagram?.edges.length, 14);
  assert.equal(result.sources.length, 17);
  assert.equal(result.answerMarkdown.includes("grounded answer could not be presented"), false);
  assert.match(result.answerMarkdown, /17 native design concepts/);
  assert.match(result.answerMarkdown, /14 canonical stored relationships/);
});

test("successful synthesis skips the normal answer model and returns used support sources only", async () => {
  let responseCalls = 0;
  const client: NativeOpenAiClient = {
    responses: { create: async () => { responseCalls += 1; throw new Error("answer model must not run"); } },
    moderations: { create: async () => ({ results: [{ flagged: false }] }) as never },
  };
  const result = await answerNativeOkfChat(
    {
      question: "Generate a design flow for fragmented product identity and lost review continuity across e-commerce marketplaces.",
      includeDiagram: true,
    },
    {
      environment: ENVIRONMENT,
      client,
      generateDiagram: async (input) => {
        const plan = {
          ...planForGrounding(input.grounding),
          problemSummary: input.synthesisProblem ?? input.question,
        };
        const converted = convertNativeOkfSynthesisPlan(
          plan,
          input.grounding,
          input.synthesisProblem ?? input.question,
        );
        assert.ok(converted);
        return {
          diagram: converted.diagram,
          usedSupportConceptIds: converted.usedSupportConceptIds,
          deterministicSummary: deterministicNativeOkfSynthesisSummary(plan, converted.diagram),
          warnings: [],
        };
      },
    },
  );
  assert.equal(responseCalls, 0);
  assert.equal(result.presentationMode, "diagram-primary");
  assert.equal(result.diagramMode, "synthesized");
  assert.equal(result.diagramStatus, "success");
  assert.match(result.diagram?.title ?? "", /^Grounded proposal: Fragmented product identity/iu);
  const problemNode = result.diagram?.nodes.find((node) => node.id === "user-problem");
  assert.equal(
    problemNode?.label,
    "Fragmented product identity and lost review continuity across e-commerce marketplaces",
  );
  assert.equal(
    problemNode?.description,
    "Generate a design flow for fragmented product identity and lost review continuity across e-commerce marketplaces.",
  );
  assert.match(result.answerMarkdown, /^This grounded proposal addresses fragmented product identity/iu);
  assert.doesNotMatch(result.answerMarkdown, /addresses Generate|\.\./iu);
  assert.ok(result.synthesisDraft);
  assert.ok(result.conversationState?.lastSynthesisProblem);
  assert.equal(
    result.conversationState?.lastSynthesisProblem?.displayProblem,
    "Fragmented product identity and lost review continuity across e-commerce marketplaces",
  );
  assert.ok(result.conversationState?.latestValidatedSynthesisDraft);
  assert.ok(result.sources.length > 0 && result.sources.length <= 12);
  assert.ok(result.answerMarkdown.trim().split(/\s+/u).length < 100);
});

test("failed synthesis preserves intent and problem without creating a validated draft", async () => {
  const result = await answerNativeOkfChat(
    {
      question: "Generate a design flow for fragmented product identity and lost review continuity across e-commerce marketplaces.",
      includeDiagram: true,
    },
    {
      environment: ENVIRONMENT,
      client: queuedClient([], []),
      generateDiagram: async () => ({
        warnings: [],
        diagnosticCode: "synthesis-plan-repair-failed",
      }),
    },
  );
  assert.equal(result.diagramMode, "synthesized");
  assert.ok(result.diagramStatus === "evidence-fallback" || result.diagramStatus === "failed");
  assert.equal(result.synthesisDraft, undefined);
  assert.ok(result.conversationState?.lastSynthesisProblem?.problemStatement.includes("fragmented product identity"));
  assert.equal(result.conversationState?.latestValidatedSynthesisDraft ?? null, null);
  assert.equal(result.conversationState?.synthesisDraft, null);
  if (result.diagram) assert.equal(result.diagram.title, "Grounded source map");

  const refinement = await prepareNativeOkfChatRequest({
    question: "Make the flow privacy preserving and add an evaluation stage.",
    includeDiagram: true,
    conversationState: result.conversationState,
  });
  assert.equal(refinement.intent, "synthesized-flow");
  assert.equal(refinement.diagramMode, "synthesized");
  assert.match(refinement.synthesisProblem ?? "", /fragmented product identity/);
  assert.equal(refinement.priorSynthesisDraft, null);
  assert.equal(inferNativeOkfSynthesisIntent(
    "Make the flow privacy preserving and add an evaluation stage.",
    result.conversationState!,
  ), true);
});

test("refinement without a problem or validated draft asks one clarification", async () => {
  const prepared = await prepareNativeOkfChatRequest({
    question: "Make the flow privacy preserving.",
    includeDiagram: true,
    conversationState: createInitialNativeOkfConversationState(),
  });
  assert.ok(prepared.clarification);
  assert.equal(prepared.clarification?.question.split("?").length - 1, 1);
});

test("generic live-data gate blocks external current data without false positives", async () => {
  for (const question of [
    "What are today's cryptocurrency prices?",
    "What is the current weather in Leipzig?",
    "Show current sports scores.",
    "Give me the latest market quotations.",
    "Who is the current president?",
    "What is the real-time status?",
  ]) {
    assert.equal(isNativeOkfLiveDataRequest(question), true, question);
  }
  for (const question of [
    "What does the current paper propose?",
    "What is the latest stored paper?",
    "Explain the price mechanism in this design.",
    "Compare the market design principles.",
  ]) {
    assert.equal(isNativeOkfLiveDataRequest(question), false, question);
  }

  let retrievalCalls = 0;
  let modelCalls = 0;
  const result = await answerNativeOkfChat(
    { question: "What are today's cryptocurrency prices?" },
    {
      retrieve: async () => { retrievalCalls += 1; throw new Error("must not retrieve"); },
      environment: ENVIRONMENT,
      client: {
        responses: { create: async () => { modelCalls += 1; throw new Error("must not call"); } },
        moderations: { create: async () => { modelCalls += 1; throw new Error("must not call"); } },
      },
    },
  );
  assert.equal(retrievalCalls, 0);
  assert.equal(modelCalls, 0);
  assert.equal(result.presentationMode, "no-match");
  assert.equal(result.answerMarkdown, "This library does not provide live external market data. It can answer questions about the stored DSR and blockchain design knowledge.");
  assert.deepEqual(result.sources, []);
  assert.equal(result.warnings, undefined);
});

test("diagram-primary UI orders summary, diagram, limitation, and collapsed accessible sources", async () => {
  const source = await readFile(
    new URL("../components/chat/ChatAnswer.tsx", import.meta.url),
    "utf8",
  );
  const component = source.slice(source.indexOf("export function ChatAnswer"));
  const summary = component.indexOf("<ReactMarkdown");
  const diagram = component.indexOf("<GeneratedDiagramView");
  const limitation = component.indexOf("Supporting evidence map");
  const sources = component.indexOf("<SourceCollection");
  assert.ok(summary >= 0 && diagram > summary && limitation > diagram && sources > limitation);
  assert.match(source, /<details/);
  assert.match(source, /<summary[^>]*>[\s\S]*View \{sources\.length\} grounding source/);
  assert.match(source, /<SourceCollection[\s\S]*collapsed[\s\S]*\/>/);
});

test("diagram viewport keeps padding, resize refit, responsive height, and existing controls", async () => {
  const viewport = await readFile(
    new URL("../components/chat/diagram-viewport.ts", import.meta.url),
    "utf8",
  );
  const presentation = await readFile(
    new URL("../components/chat/GeneratedDiagramPresentation.tsx", import.meta.url),
    "utf8",
  );
  assert.match(viewport, /FIT_SCREEN_PADDING = 36/);
  assert.match(presentation, /ResizeObserver/);
  assert.match(presentation, /responsiveHeight/);
  assert.match(presentation, /Fullscreen/);
  assert.match(presentation, /horizontal/);
  assert.match(presentation, /vertical/);
});
