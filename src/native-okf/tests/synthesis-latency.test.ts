import "server-only";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import OpenAI from "openai";
import type { Response as ModelResponse } from "openai/resources/responses/responses";
import {
  OPENAI_MAX_RETRIES, OPENAI_REQUEST_TIMEOUT_MS,
  type NativeOpenAiClient, type NativeOkfModelRequestOptions,
} from "../server/openai/client.ts";
import { normalizeOpenAiError } from "../server/openai/errors.ts";
import { readOpenAiEnvironment } from "../server/openai/env.ts";
import {
  NATIVE_OKF_CHAT_BUDGET_MS, NATIVE_OKF_RESPONSE_RESERVE_MS, nativeOkfModelCallOptions,
  NativeOkfBudgetTimeoutError, SYNTHESIS_REQUEST_TIMEOUT_MS,
  SYNTHESIS_QUALITY_REVIEW_TIMEOUT_MS, REFINEMENT_REVIEW_TIMEOUT_MS, withNativeOkfRequestBudget,
} from "../server/openai/request-budget.ts";
import { generateNativeOkfSynthesisPlan, convertNativeOkfSynthesisPlan, type SynthesisPlan } from "../server/openai/synthesis-plan.ts";
import { generateNativeOkfSynthesisRefinement } from "../server/openai/synthesis-refinement.ts";
import { NativeOkfTurnTelemetry } from "../server/openai/telemetry.ts";
import type { NativeOkfDiagramGrounding } from "../server/openai/diagram-grounding.ts";
import type { SynthesisDraftState } from "../shared/chat-types.ts";

const environment = readOpenAiEnvironment({ NODE_ENV: "test", OPENAI_API_KEY: "sk-mock-private", OPENAI_MODEL: "test-model", OPENAI_REASONING_EFFORT: "low" });
const support = "fixture/consent-support";
const grounding: NativeOkfDiagramGrounding = {
  allowedConceptIds: new Set([support]), eligibleStoredConceptIds: new Set([support]), storedRelations: [],
  conceptsById: new Map([[support, { conceptId: support, title: "Consent evidence", description: "Disclose only required consent evidence.", type: "design-principle", stage: "design-principle" }]]),
};
const node = (key: string, label: string) => ({ key, label, description: label + ".", supportConceptIds: [support] });
const plan: SynthesisPlan = {
  title: "Clinic consent verification proposal", problemLabel: "Consent cannot be audited across clinics",
  problemSummary: "Consent cannot be audited across clinics.", supportingStoredConceptIds: [support],
  coverageRationale: "Adapt the cited evidence to accountable clinic consent.",
  requirements: [node("r1", "Maintain verifiable clinic consent records")],
  principles: [node("p1", "Minimize disclosed clinic consent attributes")],
  features: [node("f1", "Signed clinic consent credential")],
  artifact: [node("a1", "Clinic consent verification service")], evaluation: [], outcome: [],
  relationships: [
    ["problem", "r1", "motivates"], ["r1", "p1", "addressed by"],
    ["p1", "f1", "implemented by"], ["f1", "a1", "instantiated in"],
  ].map(([sourceKey, targetKey, relationshipType], index) => ({ id: `e${index}`, sourceKey, targetKey,
    relationshipType: relationshipType as SynthesisPlan["relationships"][number]["relationshipType"],
    rationale: "A proposed relation supported by consent evidence.", supportConceptIds: [support] })),
};
const response = (value: unknown): ModelResponse => ({ status: "completed", model: "test-model", output: [], output_text: JSON.stringify(value) }) as unknown as ModelResponse;
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
function options(client: NativeOpenAiClient) {
  return { client, environment, problemStatement: plan.problemSummary, refinementRequest: "Propose a flow for clinic consent.",
    grounding, priorDraft: null, domain: "clinic consent", objective: null, constraints: [], requireRpfPath: true };
}
function fixtureClient(create: NativeOpenAiClient["responses"]["create"]): NativeOpenAiClient {
  return { responses: { create }, moderations: { create: async () => ({ results: [{ flagged: false }] }) as never } };
}
function hung(signal: AbortSignal | null | undefined): Promise<never> {
  return new Promise((_, reject) => signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }));
}

test("the production SDK policy demonstrates three paid attempts for one timed-out generation", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
  let attempts = 0;
  const sdk = new OpenAI({ apiKey: "mock", timeout: OPENAI_REQUEST_TIMEOUT_MS, maxRetries: OPENAI_MAX_RETRIES, logLevel: "off",
    fetch: async (_url, init) => { attempts++; return hung(init?.signal); } });
  const failed = sdk.responses.create({ model: "test-model", input: "private test prompt" }).catch((error: unknown) => error);
  await flush();
  for (let index = 0; index < 3; index++) {
    assert.equal(attempts, index + 1);
    t.mock.timers.tick(45_000);
    await flush();
    if (index < 2) { t.mock.timers.tick(2_000); await flush(); }
  }
  assert.equal(normalizeOpenAiError(await failed).code, "openai_timeout");
  assert.equal(attempts, 3);
  assert.ok(Date.now() >= 135_000);
});

test("a real mocked SDK response after 65 seconds succeeds; hung optional review returns the valid diagram after 15 seconds", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
  let attempts = 0;
  let reviewSignal: AbortSignal | null | undefined;
  const sdk = new OpenAI({ apiKey: "mock", timeout: OPENAI_REQUEST_TIMEOUT_MS, maxRetries: OPENAI_MAX_RETRIES, logLevel: "off",
    fetch: async (_url, init) => {
      attempts++;
      if (attempts > 1) { reviewSignal = init?.signal; return hung(reviewSignal); }
      return new Promise<Response>((resolve) => setTimeout(() => resolve(Response.json({
        id: "resp_fixture", status: "completed", model: "test-model", object: "response",
        output: [{ id: "msg_fixture", type: "message", status: "completed", role: "assistant",
          content: [{ type: "output_text", text: JSON.stringify(plan), annotations: [] }] }],
      })), 65_000));
    } });
  const budgeted = withNativeOkfRequestBudget(sdk as NativeOpenAiClient, { startedAt: 0, now: () => Date.now() });
  let done = false;
  const resultPromise = generateNativeOkfSynthesisPlan(options(budgeted)).then((result) => { done = true; return result; });
  await flush();
  t.mock.timers.tick(45_001); await flush();
  assert.equal(done, false, "do not kill useful synthesis at the legacy 45s deadline");
  assert.equal(attempts, 1);
  t.mock.timers.tick(19_999); await flush();
  assert.equal(attempts, 2, "the next request is review, not duplicate generation");
  t.mock.timers.tick(SYNTHESIS_QUALITY_REVIEW_TIMEOUT_MS); await flush();
  const result = await resultPromise;
  assert.equal(Date.now(), 80_000);
  assert.equal(attempts, 2);
  assert.equal(reviewSignal?.aborted, true);
  assert.deepEqual(result.diagram, convertNativeOkfSynthesisPlan(plan, grounding, plan.problemSummary, true)?.diagram);
  assert.match(result.warnings.join(" "), /optional.*review.*unavailable/iu);
});

test("synthesis transport timeout is bounded, aborts in-flight work and never generates a replacement or source map", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
  let attempts = 0;
  let activeSignal: AbortSignal | null | undefined;
  const raw = fixtureClient(async (_body, requestOptions) => {
    attempts++; activeSignal = requestOptions?.signal;
    assert.equal(requestOptions?.timeout, SYNTHESIS_REQUEST_TIMEOUT_MS);
    assert.equal(requestOptions?.maxRetries, 0);
    assert.equal(requestOptions?.nativeOkfStage, undefined, "local labels never reach the SDK");
    return hung(activeSignal);
  });
  const promise = generateNativeOkfSynthesisPlan(options(withNativeOkfRequestBudget(raw, { startedAt: 0, now: () => Date.now() })));
  const assertion = assert.rejects(promise, (error: unknown) => error instanceof NativeOkfBudgetTimeoutError && error.timeoutKind === "stage_deadline");
  t.mock.timers.tick(SYNTHESIS_REQUEST_TIMEOUT_MS); await assertion;
  assert.equal(attempts, 1);
  assert.equal(activeSignal?.aborted, true);
});

test("one structural repair recovers within the shared budget; a review deadline retains the repaired proposal", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
  const calls: NativeOkfModelRequestOptions[] = [];
  const raw = fixtureClient(async (_body, requestOptions) => {
    calls.push(requestOptions!);
    if (calls.length === 3) return hung(requestOptions?.signal);
    return new Promise<ModelResponse>((resolve) => setTimeout(() => resolve(response(calls.length === 1 ? {} : plan)), 119_000));
  });
  const resultPromise = generateNativeOkfSynthesisPlan(options(withNativeOkfRequestBudget(raw, { startedAt: 0, now: () => Date.now() })));
  t.mock.timers.tick(119_000); await flush();
  t.mock.timers.tick(119_000); await flush();
  assert.equal(calls.length, 3);
  assert.equal(calls[2].timeout, 2_000, "review is shortened to the remaining budget");
  t.mock.timers.tick(2_000); await flush();
  const result = await resultPromise;
  assert.ok(result.diagram);
  assert.deepEqual(result.diagram, convertNativeOkfSynthesisPlan(plan, grounding, plan.problemSummary, true)?.diagram);
  assert.match(result.warnings.join(" "), /structural repair/iu);
  assert.equal(Date.now(), NATIVE_OKF_CHAT_BUDGET_MS - NATIVE_OKF_RESPONSE_RESERVE_MS);
  assert.ok(calls.every((call) => call.maxRetries === 0));
});

test("no provider call starts after the request budget is exhausted", async () => {
  let attempts = 0;
  const budgeted = withNativeOkfRequestBudget(fixtureClient(async () => { attempts++; return response(plan); }), {
    startedAt: 0, now: () => NATIVE_OKF_CHAT_BUDGET_MS,
  });
  await assert.rejects(generateNativeOkfSynthesisPlan(options(budgeted)), (error: unknown) => error instanceof NativeOkfBudgetTimeoutError && error.timeoutKind === "request_deadline");
  assert.equal(attempts, 0);
});

test("optional review reserves enough time for required output moderation", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 215_000 });
  let moderationCompleted = false;
  const raw: NativeOpenAiClient = { responses: { create: async (_body, requestOptions) => hung(requestOptions?.signal) },
    moderations: { create: async (_body, requestOptions) => {
      assert.equal(requestOptions?.timeout, 20_000);
      assert.equal(requestOptions?.maxRetries, 0);
      moderationCompleted = true;
      return { results: [{ flagged: false }] } as never;
    } } };
  const budgeted = withNativeOkfRequestBudget(raw, { startedAt: 0, now: () => Date.now(), moderationEnabled: true });
  const review = budgeted.responses.create({ model: environment.model }, nativeOkfModelCallOptions("synthesis-quality-review"));
  const rejected = assert.rejects(review, (error: unknown) => error instanceof NativeOkfBudgetTimeoutError && error.timeoutKind === "request_deadline");
  t.mock.timers.tick(5_000); await rejected;
  await budgeted.moderations.create({ model: "omni-moderation-latest", input: "private generated proposal" });
  assert.equal(moderationCompleted, true);
});

test("failed or malformed optional review cannot discard a valid synthesized proposal", async () => {
  for (const reviewed of [new Error("private provider failure"), {}, { ...plan, principles: [] }]) {
    let calls = 0;
    const raw = fixtureClient(async () => {
      calls++;
      if (calls === 1) return response(plan);
      if (reviewed instanceof Error) throw reviewed;
      return response(reviewed);
    });
    const result = await generateNativeOkfSynthesisPlan(options(withNativeOkfRequestBudget(raw)));
    assert.equal(calls, 2);
    assert.deepEqual(result.diagram, convertNativeOkfSynthesisPlan(plan, grounding, plan.problemSummary, true)?.diagram);
    assert.match(result.warnings.join(" "), /optional.*review.*unavailable/iu);
  }
});

test("mandatory refinement review timeout fails closed without regenerating the proposal", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
  const diagram = convertNativeOkfSynthesisPlan(plan, grounding, plan.problemSummary, true)!.diagram;
  const prior: SynthesisDraftState = { version: 1, problemStatement: plan.problemSummary, domain: "clinic consent", objective: null,
    constraints: [], nodes: diagram.nodes, edges: diagram.edges };
  const snapshot = JSON.stringify(prior);
  const feature = prior.nodes.find((node) => node.stage === "design-feature")!;
  let calls = 0;
  let markReviewStarted!: () => void;
  const reviewStarted = new Promise<void>((resolve) => { markReviewStarted = resolve; });
  const raw = fixtureClient(async (_body, requestOptions) => {
    calls++;
    if (calls === 2) { markReviewStarted(); return hung(requestOptions?.signal); }
    return response({ addNodes: [], removeNodeIds: [], addEdges: [], removeEdges: [], updateNodes: [{
      nodeId: feature.id, label: "Signed clinic consent credential with expiry", description: "The consent credential expires after one day.",
      stage: feature.stage, category: feature.category, supportConceptIds: [support], synthesisRationale: "Apply the requested expiry constraint using cited consent evidence.",
    }] });
  });
  const promise = generateNativeOkfSynthesisRefinement({ ...options(withNativeOkfRequestBudget(raw, { startedAt: 0, now: () => Date.now() })),
    priorDraft: prior, refinementRequest: "Refine the consent credential feature to expire after one day." });
  await reviewStarted;
  assert.equal(calls, 2);
  t.mock.timers.tick(REFINEMENT_REVIEW_TIMEOUT_MS); await flush();
  const result = await promise;
  assert.deepEqual(result, { errors: ["patch:review-unavailable"] });
  assert.equal(calls, 2);
  assert.equal(JSON.stringify(prior), snapshot);
});

test("client cancellation aborts the in-flight request with no extra attempt", async () => {
  const controller = new AbortController();
  let activeSignal: AbortSignal | null | undefined;
  let calls = 0;
  const raw = fixtureClient(async (_body, requestOptions) => { calls++; activeSignal = requestOptions?.signal; return hung(activeSignal); });
  const promise = generateNativeOkfSynthesisPlan(options(withNativeOkfRequestBudget(raw, { signal: controller.signal })));
  const assertion = assert.rejects(promise, (error: unknown) => error instanceof NativeOkfBudgetTimeoutError && error.timeoutKind === "request_cancelled");
  controller.abort(); await assertion;
  assert.equal(calls, 1);
  assert.equal(activeSignal?.aborted, true);
});

test("stage telemetry records only safe duration, retry, usage and normalized failure metadata", async (t) => {
  const logs: string[] = [];
  t.mock.method(console, "info", (line: string) => logs.push(line));
  const telemetry = new NativeOkfTurnTelemetry("DESIGN_SYNTHESIS", "corpus", performance.now(), "operational-request-id");
  const raw = fixtureClient(async () => { const error = new Error("private question and private output timed out"); error.name = "APIConnectionTimeoutError"; throw error; });
  const observed = telemetry.observeClient(withNativeOkfRequestBudget(raw), environment, 103_747, 140_000, 40);
  telemetry.measureStageSync("context-construction", () => undefined);
  await assert.rejects(observed.responses.create({ model: environment.model, input: "private question and private output", reasoning: { effort: "low" }, max_output_tokens: 4096 }, nativeOkfModelCallOptions("synthesis-plan")));
  const metrics = telemetry.finish("error")!;
  assert.equal(metrics.calls[0].stage, "synthesis-plan");
  assert.equal(metrics.calls[0].errorCode, "openai_timeout");
  assert.equal(metrics.calls[0].timeoutKind, "provider_timeout");
  assert.equal(metrics.calls[0].maxRetries, 0);
  assert.equal(metrics.calls[0].configuredTimeoutMs, SYNTHESIS_REQUEST_TIMEOUT_MS);
  assert.equal(metrics.calls[0].reasoningEffort, "low");
  assert.equal(metrics.calls[0].maxOutputTokens, 4096);
  assert.ok(logs.some((line) => line.includes('"event":"started"')));
  assert.ok(logs.some((line) => line.includes('"event":"completed"')));
  assert.doesNotMatch(JSON.stringify({ logs, metrics }), /private question|private output|sk-mock-private|apiKey/u);
});

test("output-budget exhaustion is distinguished from transport timeout without exposing response content", async (t) => {
  t.mock.method(console, "info", () => undefined);
  const telemetry = new NativeOkfTurnTelemetry("DESIGN_SYNTHESIS", "corpus");
  const raw = fixtureClient(async () => ({ ...response(plan), status: "incomplete", incomplete_details: { reason: "max_output_tokens" } }));
  await telemetry.observeClient(raw, environment, 100, 140_000, 1).responses.create({ model: environment.model }, nativeOkfModelCallOptions("synthesis-plan"));
  const metrics = telemetry.finish("error")!;
  assert.equal(metrics.calls[0].incompleteReason, "max_output_tokens");
  assert.equal(metrics.calls[0].status, "incomplete");
  assert.equal(metrics.calls[0].timeoutKind, undefined);
});

test("text retry behavior and model parameters remain unchanged; route has supported duration headroom", async () => {
  const calls: NativeOkfModelRequestOptions[] = [];
  const raw = fixtureClient(async (body, requestOptions) => { calls.push(requestOptions!); assert.equal(body.model, environment.model);
    assert.equal(body.reasoning?.effort, "low"); assert.equal(body.max_output_tokens, 1_800); return response(plan); });
  await withNativeOkfRequestBudget(raw).responses.create({ model: environment.model, reasoning: { effort: "low" }, max_output_tokens: 1_800 }, nativeOkfModelCallOptions("text-generation"));
  assert.equal(calls[0].timeout, OPENAI_REQUEST_TIMEOUT_MS);
  assert.equal(calls[0].maxRetries, OPENAI_MAX_RETRIES);
  const route = await readFile("app/api/native-okf/chat/route.ts", "utf8");
  assert.match(route, /export const maxDuration = 300/u);
  assert.ok(NATIVE_OKF_CHAT_BUDGET_MS < 300_000);
});
