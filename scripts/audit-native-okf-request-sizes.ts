import "server-only";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import type { NativeOpenAiClient } from "../src/native-okf/server/openai/client.ts";
import type { SynthesisDraftState } from "../src/native-okf/shared/chat-types.ts";
import { createInitialNativeOkfConversationState } from "../src/native-okf/shared/chat-types.ts";
import { retrieveOkfContext } from "../src/native-okf/server/retrieval.ts";
import { buildNativeOkfGroundedContext, buildNativeOkfModelInput } from "../src/native-okf/server/openai/context.ts";
import { buildNativeOkfDiagramGrounding } from "../src/native-okf/server/openai/diagram-grounding.ts";
import { generateNativeOkfDiagram } from "../src/native-okf/server/openai/diagram.ts";
import { generateNativeOkfSynthesisPlan, validateNativeOkfSynthesisPlan, convertNativeOkfSynthesisPlan, type SynthesisPlan } from "../src/native-okf/server/openai/synthesis-plan.ts";
import { generateNativeOkfSynthesisRefinement } from "../src/native-okf/server/openai/synthesis-refinement.ts";
import { readOpenAiEnvironment } from "../src/native-okf/server/openai/env.ts";
import { NativeOkfTurnTelemetry, MAX_NATIVE_OKF_MODEL_REQUEST_BYTES, nativeOkfModelRequestBytes } from "../src/native-okf/server/openai/telemetry.ts";
import { answerNativeOkfChat, validateNativeOkfChatRequest, MAX_NATIVE_OKF_REQUEST_BYTES } from "../src/native-okf/server/openai/chat.ts";
import * as prompts from "../src/native-okf/server/openai/prompts.ts";

// Offline only: all provider calls terminate at this in-memory capture client.
export async function auditNativeOkfRequestSizes() {
  const environment = readOpenAiEnvironment({ NODE_ENV: "test", OPENAI_API_KEY: "offline", OPENAI_MODEL: "gpt-6.1-sol", OPENAI_REASONING_EFFORT: "low", OPENAI_MODERATION_ENABLED: "false" });
  const limits = { lexicalSeedLimit: 20, firstHopLimit: 40, secondHopLimit: 20, maxConcepts: 100, maxContextCharacters: 150_000 };
  const queries = ["privacy interoperability trust tokenization", "fragmented product identities marketplaces", "blockchain design principles requirements features"];
  const results = await Promise.all(queries.map((question) => retrieveOkfContext(question, limits)));
  const original = results[0]!;
  // Canonical retrieved records only, no invented or expanded Markdown. A required
  // evidence set keeps records available while the real packer applies its ceiling.
  const concepts = [...new Map(results.flatMap((r) => r.finalConcepts).map((c) => [c.conceptId, c])).values()].slice(0, 100);
  const retrieval = { ...original, finalConcepts: concepts, debug: { ...original.debug, limits: { ...original.debug.limits, ...limits } } };
  const question = "Compare privacy and interoperability across the library. " + "研究设计知识与互操作性治理。".repeat(200);
  const boundedQuestion = question.slice(0, 2_000);
  const context = buildNativeOkfGroundedContext(retrieval, boundedQuestion, concepts.map((c) => c.conceptId));
  assert.ok(context.prompt.length > 149_000 && context.prompt.length <= 150_000, `Near-cap fixture: ${context.prompt.length}`);
  const grounding = await buildNativeOkfDiagramGrounding({ ...retrieval, finalConcepts: concepts.filter((c) => context.allowedConceptIds.has(c.conceptId)) });
  const history = Array.from({ length: 8 }, (_, i) => ({ role: i % 2 ? "assistant" as const : "user" as const, content: "研究设计知识与互操作性治理。".repeat(160).slice(0, 2_000) }));
  assert.ok(history.every((m) => m.content.length === 2_000));
  const transport = { question: boundedQuestion, history };
  validateNativeOkfChatRequest(transport);
  assert.ok(Buffer.byteLength(JSON.stringify(transport), "utf8") < MAX_NATIVE_OKF_REQUEST_BYTES);
  const requests: { path: string; body: ResponseCreateParamsNonStreaming }[] = [];
  let path = "";
  let outputs: unknown[] = [];
  const raw = {
    moderations: { create: async () => ({ results: [{ flagged: false }] }) },
    responses: { create: async (body: ResponseCreateParamsNonStreaming) => {
      requests.push({ path, body });
      const output = outputs.shift() ?? {};
      return { model: environment.model, status: "completed", output: [], output_text: typeof output === "string" ? output : JSON.stringify(output) };
    } },
  } as unknown as NativeOpenAiClient;
  const textBase: ResponseCreateParamsNonStreaming = {
    model: environment.model, reasoning: { effort: "low" }, max_output_tokens: 1_800,
    store: false, tools: [], tool_choice: "none", parallel_tool_calls: false, text: { verbosity: "medium" },
  };
  // Capture a real text turn to assert the envelope, rather than relying on a
  // handwritten provider envelope that could drift away from createTextResponse.
  path = "envelope check"; outputs = ["Supported knowledge [[S1]]."];
  await answerNativeOkfChat({ question: "Explain blockchain interoperability.", includeDiagram: false }, { environment, client: raw });
  const actual = requests[0]!.body;
  for (const [key, value] of Object.entries(textBase)) assert.deepEqual(actual[key as keyof typeof actual], value);
  requests.length = 0;
  for (const [name, mode] of [["A ordinary corpus QA", prompts.NATIVE_OKF_NORMAL_ANSWER_INSTRUCTION], ["B broad cross-paper comparison", prompts.NATIVE_OKF_COMPARISON_ANSWER_INSTRUCTION]] as const) {
    requests.push({ path: name, body: { ...textBase, instructions: [prompts.NATIVE_OKF_SYSTEM_PROMPT, mode, prompts.NATIVE_OKF_TEXT_ONLY_ANSWER_INSTRUCTION].join("\n\n"), input: buildNativeOkfModelInput(history, context) } });
  }
  const ids = [...grounding.eligibleStoredConceptIds];
  const support = [ids[0]!];
  const node = (key: string, label: string) => ({ key, label, description: ("Evidence-constrained proposal for participant coordination. ".repeat(6)).slice(0, 300), supportConceptIds: support });
  const plan: SynthesisPlan = {
    title: "Interoperable marketplace coordination", problemLabel: "Fragmented product identities", problemSummary: "Fragmented product identities across marketplaces.", supportingStoredConceptIds: support, coverageRationale: "Reuse the retrieved interoperable design knowledge.",
    requirements: Array.from({ length: 15 }, (_, i) => node(`r${i}`, `Preserve consistency-${i}`)),
    principles: Array.from({ length: 15 }, (_, i) => node(`p${i}`, `Use coordination-${i}`)),
    features: Array.from({ length: 14 }, (_, i) => node(`f${i}`, `Registry module-${i}`)),
    artifact: [node("artifact", "Product identity registry")], evaluation: [node("evaluation", "Identity consistency test")], outcome: [node("outcome", "Reduced identity fragmentation")], relationships: [],
  };
  const edge = (sourceKey: string, targetKey: string, relationshipType: SynthesisPlan["relationships"][number]["relationshipType"]) => plan.relationships.push({ id: `e${plan.relationships.length}`, sourceKey, targetKey, relationshipType, rationale: "A proposed evidence-constrained structural relationship.", supportConceptIds: support });
  plan.requirements.forEach((r) => edge("problem", r.key, "motivates"));
  plan.principles.forEach((p, i) => edge(plan.requirements[i]!.key, p.key, "addressed by"));
  plan.features.forEach((f, i) => edge(plan.principles[i]!.key, f.key, "implemented by"));
  plan.features.forEach((f) => edge(f.key, "artifact", "instantiated in"));
  edge("artifact", "evaluation", "evaluated by"); edge("evaluation", "outcome", "informs");
  for (let i = 0; plan.relationships.length < 96; i++) {
    const source = plan.requirements[Math.floor(i / 15)]!.key;
    const target = plan.principles[i % 15]!.key;
    if (!plan.relationships.some((e) => e.sourceKey === source && e.targetKey === target)) edge(source, target, "addressed by");
  }
  const valid = validateNativeOkfSynthesisPlan(plan, grounding, { requireRpfPath: true });
  assert.ok(valid.ok, JSON.stringify(valid));
  const converted = convertNativeOkfSynthesisPlan(plan, grounding, plan.problemSummary, true);
  assert.ok(converted);
  const priorDraft: SynthesisDraftState = { version: 1, problemStatement: plan.problemSummary, domain: "Marketplace product identity", objective: "Interoperable coordination", constraints: [], nodes: converted.diagram.nodes, edges: converted.diagram.edges };
  assert.equal(priorDraft.nodes.length, 48); assert.equal(priorDraft.edges.length, 96);
  const refinementTransport = { ...transport, history: history.map((m) => ({ ...m, content: "h".repeat(2_000) })), conversationState: { ...createInitialNativeOkfConversationState(), latestValidatedSynthesisDraft: priorDraft, lastIntent: "synthesized-flow", lastDiagramRequested: true } };
  const parsedRefinement = validateNativeOkfChatRequest(refinementTransport);
  assert.equal(parsedRefinement.conversationState?.latestValidatedSynthesisDraft?.nodes.length, 48);
  assert.ok(Buffer.byteLength(JSON.stringify(refinementTransport), "utf8") < MAX_NATIVE_OKF_REQUEST_BYTES);
  const options = { client: raw, environment, problemStatement: boundedQuestion, refinementRequest: boundedQuestion, domain: "Marketplaces", objective: null, constraints: [], grounding, priorDraft: null, requireRpfPath: true };
  path = "C synthesis plan / quality review"; outputs = [plan, plan];
  await generateNativeOkfSynthesisPlan(options);
  path = "D generated stored diagram / repair"; outputs = [{}, {}];
  await generateNativeOkfDiagram({ client: raw, environment, context, question: boundedQuestion, answerMarkdown: "Supported evidence. ".repeat(720).slice(0, 14_400), grounding, mode: "stored" });
  path = "E diagram refinement / repair"; outputs = [{}, {}];
  await generateNativeOkfSynthesisRefinement({ client: raw, environment, grounding, priorDraft, problemStatement: priorDraft.problemStatement, refinementRequest: boundedQuestion, requireRpfPath: true });
  path = "F synthesis answer repair";
  // Real synthesis repair builder includes a bounded rejected candidate, omits
  // history/context intentionally, and never duplicates the entire packed XML.
  outputs = [{ draft: "x".repeat(32_600) }, {}];
  await generateNativeOkfSynthesisPlan(options);
  const escape = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  requests.push({ path: "F text citation/answer repair", body: { ...textBase, instructions: [prompts.NATIVE_OKF_SYSTEM_PROMPT, prompts.NATIVE_OKF_COMPARISON_ANSWER_INSTRUCTION, prompts.NATIVE_OKF_TEXT_ONLY_ANSWER_INSTRUCTION, prompts.NATIVE_OKF_PRESENTATION_REPAIR_INSTRUCTION, prompts.NATIVE_OKF_CITATION_REPAIR_INSTRUCTION].join("\n\n"), input: [{ role: "user", content: `${context.prompt}\n\n<DRAFT_ANSWER>\n${escape("Evidence-constrained explanation. ".repeat(500).slice(0, 14_400))}\n</DRAFT_ANSWER>\n\n<VALIDATION_ERRORS>\nThe draft has no valid required current-turn source citation.\n</VALIDATION_ERRORS>` }] } });
  const rows = [];
  for (const { path: name, body } of [...requests]) {
    const requestBytes = nativeOkfModelRequestBytes(body);
    const telemetry = new NativeOkfTurnTelemetry("offline-size-check", "corpus");
    const guarded = telemetry.observeClient(raw, environment, context.prompt.length, 150_000, context.sources.length);
    let passes = true;
    // Validate with the actual production guard and no paid provider underneath.
    try { await guarded.responses.create(body); } catch { passes = false; }
    rows.push({ path: name, contextCharacters: context.prompt.length, packedXmlForwarded: JSON.stringify(body.input).includes("OKF_SOURCE"), requestBytes, percentOf200KB: +(requestBytes / 2_000).toFixed(3), percentOfCurrentGuard: +(requestBytes / MAX_NATIVE_OKF_MODEL_REQUEST_BYTES * 100).toFixed(3), passes });
  }
  return { guardBytes: MAX_NATIVE_OKF_MODEL_REQUEST_BYTES, contextCharacters: context.prompt.length, sourceCount: context.sources.length, maximumBytes: Math.max(...rows.map((r) => r.requestBytes)), rows };
}

if (process.argv[1]?.endsWith("audit-native-okf-request-sizes.ts")) {
  const report = await auditNativeOkfRequestSizes();
  await mkdir("artifacts/native-okf-evaluation/eval-upgrade", { recursive: true });
  await writeFile("artifacts/native-okf-evaluation/eval-upgrade/request-sizes.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
}
