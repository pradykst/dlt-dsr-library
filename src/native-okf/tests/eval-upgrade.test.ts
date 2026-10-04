import "server-only";

import assert from "node:assert/strict";
import test from "node:test";
import { readOpenAiEnvironment } from "../server/openai/env.ts";
import { buildNativeOkfGroundedContext, buildNativeOkfModelInput } from "../server/openai/context.ts";
import { retrieveOkfContext, assembleCompletePaperContext } from "../server/retrieval.ts";
import { getAllPapers } from "../server/repository.ts";
import { getOkfBundle } from "../server/cache.ts";
import { associatedConceptsForPaper, projectSemanticEdges } from "../server/paper-design-map.ts";
import { buildStoredPaperDesignMap } from "../server/openai/stored-source-map.ts";
import { NATIVE_OKF_SYSTEM_PROMPT, NATIVE_OKF_NORMAL_ANSWER_INSTRUCTION, NATIVE_OKF_TEXT_ONLY_ANSWER_INSTRUCTION } from "../server/openai/prompts.ts";
import { DEFAULT_RETRIEVAL_LIMITS, MAX_RETRIEVAL_LIMITS } from "../server/retrieval-config.ts";
import { NativeOkfTurnTelemetry, MAX_NATIVE_OKF_MODEL_REQUEST_BYTES } from "../server/openai/telemetry.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import { answerNativeOkfChat } from "../server/openai/chat.ts";
import { validateAnswerCitations } from "../server/openai/citations.ts";
import { auditNativeOkfRequestSizes } from "../../../scripts/audit-native-okf-request-sizes.ts";

const environment = readOpenAiEnvironment({ NODE_ENV: "test",
  OPENAI_API_KEY: "sk-secret-test",
  OPENAI_MODEL: "gpt-6.1-sol",
  OPENAI_REASONING_EFFORT: "low",
});
const previousLimits = {
  lexicalSeedLimit: 8, firstHopLimit: 12, secondHopLimit: 6,
  maxConcepts: 28, maxContextCharacters: 76_000,
};

test("near-hard-cap canonical requests fit every real model path with engineering headroom", async () => {
  const report = await auditNativeOkfRequestSizes();
  assert.ok(report.contextCharacters > 149_000);
  assert.equal(report.sourceCount, 100);
  assert.ok(report.rows.every((row) => row.passes), JSON.stringify(report.rows));
  assert.ok(report.maximumBytes > 200_000, "Regression must exercise the previously rejected requests");
  assert.ok(report.guardBytes >= report.maximumBytes * 1.2);
  assert.ok(report.guardBytes < report.maximumBytes * 1.21);
});

test("evaluation configuration stays environment driven with low as the safe fallback", () => {
  assert.equal(environment.model, "gpt-6.1-sol");
  assert.equal(environment.reasoningEffort, "low");
  assert.equal(environment.maxOutputTokens, 1_800);
  assert.equal(environment.diagramMaxOutputTokens, 4_096);
  assert.equal(readOpenAiEnvironment({ NODE_ENV: "test", OPENAI_API_KEY: "test", OPENAI_MODEL: "another-model" }).model, "another-model");
  assert.equal(readOpenAiEnvironment({ NODE_ENV: "test", OPENAI_API_KEY: "test", OPENAI_MODEL: "another-model" }).reasoningEffort, "low");
  assert.equal(readOpenAiEnvironment({ NODE_ENV: "test", OPENAI_API_KEY: "test", OPENAI_MODEL: "another-model", OPENAI_REASONING_EFFORT: "high" }).reasoningEffort, "high");
  assert.throws(() => readOpenAiEnvironment({ NODE_ENV: "test", OPENAI_API_KEY: "test", OPENAI_MODEL: "another-model", OPENAI_REASONING_EFFORT: "invalid" }));
});

test("expanded retrieval admits more ranked evidence, keeps strong anchors and stays deterministic and deduplicated", async () => {
  const question = "How can fragmented product data and product identities across multiple marketplaces be addressed using reusable design knowledge from the library?";
  const previous = await retrieveOkfContext(question, previousLimits);
  const expanded = await retrieveOkfContext(question);
  assert.deepEqual(expanded, await retrieveOkfContext(question));
  assert.ok(expanded.finalConcepts.length >= previous.finalConcepts.length * 1.5);
  assert.deepEqual(expanded.seedResults.slice(0, 6).map((item) => item.conceptId), previous.seedResults.slice(0, 6).map((item) => item.conceptId));
  for (const strong of previous.seedResults.slice(0, 6)) {
    assert.ok(expanded.finalConcepts.some((item) => item.conceptId === strong.conceptId));
  }
  assert.equal(new Set(expanded.finalConcepts.map((item) => item.conceptId)).size, expanded.finalConcepts.length);
  const context = buildNativeOkfGroundedContext(expanded, question);
  assert.ok(context.prompt.length <= DEFAULT_RETRIEVAL_LIMITS.maxContextCharacters);
  assert.deepEqual(context.sources.map((item) => item.conceptId), expanded.finalConcepts.map((item) => item.conceptId));
  const validated = validateAnswerCitations("Grounded [[S1]], invented [[S999999]].", context);
  assert.deepEqual(validated.unknownSourceIds, ["S999999"]);
  assert.equal(validated.sources[0]?.conceptId, context.sources[0]?.conceptId);
  assert.doesNotMatch(validated.answerMarkdown, /S999999/u);
});

test("serialized hard cap cannot be bypassed by inflated internal retrieval limits", async () => {
  const retrieval = await retrieveOkfContext("blockchain interoperability");
  const required = retrieval.finalConcepts[0]!;
  const oversized = {
    ...retrieval,
    finalConcepts: [{ ...required, markdownBody: "grounded evidence ".repeat(15_000) }],
    corpusOverview: { paperCount: 0, papers: [] },
    debug: { ...retrieval.debug, limits: { ...retrieval.debug.limits, maxContextCharacters: 1_000_000 } },
  };
  const context = buildNativeOkfGroundedContext(oversized, "Explain the evidence", [required.conceptId]);
  assert.ok(context.prompt.length <= MAX_RETRIEVAL_LIMITS.maxContextCharacters);
  assert.equal(context.packing?.markdownTruncated, true);
  assert.ok(context.allowedConceptIds.has(required.conceptId));
  const bounded = await retrieveOkfContext("blockchain interoperability", { maxContextCharacters: 1_000_000, maxConcepts: 100_000 });
  assert.equal(bounded.debug.limits.maxContextCharacters, 150_000);
  assert.equal(bounded.debug.limits.maxConcepts, 100);
});

test("every canonical complete paper fits the provider bound with maximum history, and stored maps retain every node and edge", async () => {
  const papers = await getAllPapers();
  const bundle = await getOkfBundle();
  const history = Array.from({ length: 8 }, () => ({ role: "user" as const, content: "h".repeat(2_000) }));
  assert.equal(papers.length, 34);
  for (const paper of papers) {
    const question = "q".repeat(2_000);
    const retrieval = await assembleCompletePaperContext(paper.id, question);
    const context = buildNativeOkfGroundedContext(retrieval, question);
    const associated = associatedConceptsForPaper(bundle, paper);
    const expectedIds = new Set([paper.id, ...associated.map((concept) => concept.id)]);
    assert.deepEqual(context.allowedConceptIds, expectedIds, paper.id);
    const telemetry = new NativeOkfTurnTelemetry("TEXT_QA", "paper");
    const observed = telemetry.observeClient(client(), environment, context.prompt.length, 150_000, context.sources.length);
    // Reuses the exact request guard, without contacting OpenAI or finishing/logging a turn.
    await observed.responses.create({
      model: environment.model,
      instructions: [NATIVE_OKF_SYSTEM_PROMPT, NATIVE_OKF_NORMAL_ANSWER_INSTRUCTION, NATIVE_OKF_TEXT_ONLY_ANSWER_INSTRUCTION].join("\n\n"),
      input: buildNativeOkfModelInput(history, context),
      max_output_tokens: 1_800,
      store: false, tools: [], tool_choice: "none",
    });
    const map = await buildStoredPaperDesignMap(paper.id);
    assert.ok(map, paper.id);
    assert.deepEqual(new Set(map.nodes.map((node) => node.id)), new Set(associated.map((concept) => concept.id)), paper.id);
    const edgeKey = (source: string, target: string, label: string) => JSON.stringify([source, target, label]);
    assert.deepEqual(new Set(map.edges.map((edge) => edgeKey(edge.source, edge.target, edge.label))),
      new Set(projectSemanticEdges(bundle, associated).map((edge) => edgeKey(edge.sourceId, edge.targetId, edge.label))), paper.id);
  }
});

function client(usage = true): NativeOpenAiClient {
  return {
    moderations: { create: async () => ({ results: [{ flagged: false }] }) },
    responses: { create: async () => ({
      model: "gpt-6.1-sol", status: "completed", output: [], output_text: "Supported explanation [[S2]].",
      ...(usage ? { usage: { input_tokens: 1_000, input_tokens_details: { cached_tokens: 400 }, output_tokens: 200, output_tokens_details: { reasoning_tokens: 50 }, total_tokens: 1_200 } } : {}),
    }) },
  } as unknown as NativeOpenAiClient;
}

test("turn telemetry sums every paid call including repairs without double-counting reasoning tokens or exposing content", async () => {
  const telemetry = new NativeOkfTurnTelemetry("TEXT_QA", "paper");
  const observed = telemetry.observeClient(client(), environment, 120_000, 140_000, 40);
  const body = { model: environment.model, reasoning: { effort: "low" as const }, input: "private prompt", max_output_tokens: 1_800 };
  await observed.responses.create(body);
  await observed.responses.create(body);
  const metrics = telemetry.finish("success")!;
  assert.equal(metrics.calls.length, 2);
  assert.equal(metrics.inputTokens, 2_000);
  assert.equal(metrics.cachedInputTokens, 800);
  assert.equal(metrics.outputTokens, 400);
  assert.equal(metrics.reasoningTokens, 100);
  assert.equal(metrics.totalTokens, 2_400);
  assert.equal(metrics.firstTextTokenMs, null);
  assert.equal(metrics.scopeType, "paper");
  assert.doesNotMatch(JSON.stringify(metrics), /private prompt|sk-secret-test|apiKey/u);
});

test("missing provider usage remains unknown and oversized Unicode/repair/schema payloads are blocked before spend", async () => {
  let calls = 0;
  const raw = client(false);
  const guarded = { ...raw, responses: { create: async (body: Parameters<NativeOpenAiClient["responses"]["create"]>[0]) => {
    assert.equal(body.service_tier, "default");
    calls++; return raw.responses.create(body);
  } } };
  const telemetry = new NativeOkfTurnTelemetry("DESIGN_SYNTHESIS", "corpus");
  const observed = telemetry.observeClient(guarded, environment, 140_000, 140_000, 56);
  await assert.rejects(observed.responses.create({ model: environment.model, input: "🙂".repeat(MAX_NATIVE_OKF_MODEL_REQUEST_BYTES / 3) }), /safe model request limit/u);
  assert.equal(calls, 0);
  assert.equal(telemetry.finish("error"), undefined);
  await observed.responses.create({ model: environment.model, input: "small" });
  const metrics = telemetry.finish("success")!;
  assert.equal(metrics.inputTokens, null);
  assert.equal(metrics.reasoningTokens, null);
  assert.equal(metrics.calls.length, 1);
});

test("failed provider responses retain reported usage and errors never become successful telemetry", async () => {
  const raw = client();
  const telemetry = new NativeOkfTurnTelemetry("TEXT_QA", "corpus");
  const observed = telemetry.observeClient({ ...raw, responses: { create: async (body) => ({ ...await raw.responses.create(body), status: "incomplete" }) } } as NativeOpenAiClient, environment, 1_000, 140_000, 1);
  await observed.responses.create({ model: environment.model, input: "small" });
  const metrics = telemetry.finish("error")!;
  assert.equal(metrics.status, "error");
  assert.equal(metrics.calls[0]?.status, "incomplete");
  assert.equal(metrics.outputTokens, 200);
});

test("public canonical answer stays unchanged and telemetry observers cannot break successful turns", async () => {
  const response = await answerNativeOkfChat({
    question: "Explain the paper's approach.", scope: { type: "paper", paperId: "blockchain-iot-sensor-data" },
  }, { environment, client: client(), onModelMetrics: () => { throw new Error("observer failure"); } });
  assert.equal(response.kind, "answer");
  assert.ok(response.sources.length > 0);
  assert.doesNotMatch(JSON.stringify(response), /sk-secret-test|inputTokens|cachedInputTokens|groundedContextBudget/u);
});
