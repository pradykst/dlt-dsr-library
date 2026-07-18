import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import type {
  Response,
  ResponseCreateParamsNonStreaming,
} from "openai/resources/responses/responses";

import type { NativeOpenAiClient } from "../server/openai/client.ts";
import {
  calculateResponseCallEnvelopeMicrodollars,
  calculateUsageMicrodollars,
  createUsageTrackingClient,
  NativeOkfUsageCollector,
  reconcileTrackedUsage,
  type NativeOkfMicrodollarPrices,
} from "../server/access/usage.ts";

const PRICES: NativeOkfMicrodollarPrices = {
  inputMicrodollarsPerMillion: 2_000_000,
  cachedInputMicrodollarsPerMillion: 500_000,
  outputMicrodollarsPerMillion: 10_000_000,
};

function responseWithUsage(
  inputTokens: number,
  cachedInputTokens: number,
  outputTokens: number,
  outputText = "mocked output that must not be retained",
): Response {
  return {
    id: "mock-response",
    object: "response",
    created_at: 0,
    model: "mock-model",
    output: [],
    output_text: outputText,
    status: "completed",
    usage: {
      input_tokens: inputTokens,
      input_tokens_details: {
        cached_tokens: cachedInputTokens,
        cache_write_tokens: 0,
      },
      output_tokens: outputTokens,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: inputTokens + outputTokens,
    },
  } as unknown as Response;
}

function responseWithoutUsage(): Response {
  return {
    id: "mock-response-without-usage",
    object: "response",
    created_at: 0,
    model: "mock-model",
    output: [],
    output_text: "mocked answer without usage",
    status: "completed",
  } as unknown as Response;
}

function textRequest(secretQuestion: string) {
  return {
    model: "mock-model",
    input: secretQuestion,
    text: { format: { type: "text" } },
  } as const;
}

function diagramRequest(secretQuestion: string) {
  return {
    model: "mock-model",
    input: secretQuestion,
    text: {
      format: {
        type: "json_schema",
        name: "mock_diagram",
        strict: true,
        schema: { type: "object" },
      },
    },
  } as const;
}

function mockClient(
  results: Array<Response | Error | Record<string, unknown>>,
): NativeOpenAiClient {
  let index = 0;
  return {
    responses: {
      create: async () => {
        const result = results[index++];
        if (result instanceof Error || (result && "throwMe" in result)) {
          throw result;
        }
        if (!result) throw new Error("Unexpected mocked response call.");
        return result as Response;
      },
    },
    moderations: {
      create: async () => ({ results: [{ flagged: false }] }) as never,
    },
  };
}

test("aggregates answer, citation repair, diagram and diagram repair usage", async () => {
  const { client, collector } = createUsageTrackingClient(
    mockClient([
      responseWithUsage(100, 20, 10),
      responseWithUsage(50, 0, 5),
      responseWithUsage(200, 100, 20),
      responseWithUsage(40, 40, 4),
    ]),
  );

  await client.responses.create(textRequest("private question") as never);
  await client.responses.create(
    textRequest("citation repair material") as never,
  );
  await client.responses.create(
    diagramRequest("private diagram context") as never,
  );
  await client.responses.create(
    diagramRequest("diagram repair material") as never,
  );

  const snapshot = collector.snapshot();
  assert.equal(snapshot.inputTokens, 390);
  assert.equal(snapshot.cachedInputTokens, 160);
  assert.equal(snapshot.outputTokens, 39);
  assert.equal(snapshot.modelCalls, 4);
  assert.equal(snapshot.diagramModelCalls, 2);
  assert.equal(snapshot.missingUsageCalls, 0);
  assert.deepEqual(
    snapshot.calls.map((call) => call.kind),
    ["answer", "citation-repair", "diagram", "diagram-repair"],
  );

  assert.deepEqual(reconcileTrackedUsage(snapshot, PRICES, 20_000), {
    actualMicrodollars: 930,
    usageUnreconciled: false,
    envelopeExceeded: false,
    usage: {
      inputTokens: 390,
      cachedInputTokens: 160,
      outputTokens: 39,
      modelCalls: 4,
    },
    diagramModelCalls: 2,
  });
});

test("cached input uses its separately configured price", () => {
  assert.equal(
    calculateUsageMicrodollars(
      {
        inputTokens: 100,
        cachedInputTokens: 80,
        outputTokens: 0,
        modelCalls: 1,
      },
      PRICES,
    ),
    80,
  );
});

test("microdollar calculations conservatively round fractional charges up", () => {
  assert.equal(
    calculateUsageMicrodollars(
      {
        inputTokens: 1,
        cachedInputTokens: 0,
        outputTokens: 0,
        modelCalls: 1,
      },
      {
        inputMicrodollarsPerMillion: 1,
        cachedInputMicrodollarsPerMillion: 0,
        outputMicrodollarsPerMillion: 0,
      },
    ),
    1,
  );
});

test("usage attached to a failed response is retained before rethrow", async () => {
  const failure = {
    throwMe: true,
    message: "safe mock failure",
    response: {
      data: {
        usage: responseWithUsage(31, 11, 7).usage,
      },
    },
  };
  const { client, collector } = createUsageTrackingClient(mockClient([failure]));

  await assert.rejects(
    client.responses.create(textRequest("private failed request") as never),
    (error: unknown) => error === failure,
  );
  const snapshot = collector.snapshot();
  assert.equal(snapshot.inputTokens, 31);
  assert.equal(snapshot.cachedInputTokens, 11);
  assert.equal(snapshot.outputTokens, 7);
  assert.equal(snapshot.modelCalls, 1);
  assert.equal(snapshot.missingUsageCalls, 0);
});

test("omitted usage charges the full reservation and marks unreconciled", async () => {
  const { client, collector } = createUsageTrackingClient(
    mockClient([responseWithoutUsage()]),
  );
  await client.responses.create(
    textRequest("private omitted usage request") as never,
  );

  const reconciliation = reconcileTrackedUsage(
    collector.snapshot(),
    PRICES,
    80_000,
  );
  assert.equal(reconciliation.actualMicrodollars, 80_000);
  assert.equal(reconciliation.usageUnreconciled, true);
  assert.equal(reconciliation.usage.modelCalls, 1);
});

test("unreconciled usage retains known cost above the reservation", async () => {
  const { client, collector } = createUsageTrackingClient(
    mockClient([
      responseWithUsage(1_000, 0, 1_000),
      responseWithoutUsage(),
    ]),
  );
  await client.responses.create(textRequest("first private request") as never);
  await client.responses.create(textRequest("second private request") as never);

  const reconciliation = reconcileTrackedUsage(
    collector.snapshot(),
    PRICES,
    1_000,
  );
  assert.equal(reconciliation.actualMicrodollars, 12_000);
  assert.equal(reconciliation.usageUnreconciled, true);
  assert.equal(reconciliation.envelopeExceeded, true);
  assert.equal(reconciliation.usage.modelCalls, 2);
});

test("collector snapshots never retain request or response content", async () => {
  const privateQuestion = "UNIQUE_PRIVATE_QUESTION_DO_NOT_STORE";
  const privateAnswer = "UNIQUE_PRIVATE_ANSWER_DO_NOT_STORE";
  const { client, collector } = createUsageTrackingClient(
    mockClient([responseWithUsage(10, 0, 3, privateAnswer)]),
  );
  await client.responses.create(textRequest(privateQuestion) as never);

  const serialized = JSON.stringify(collector.snapshot());
  assert.equal(serialized.includes(privateQuestion), false);
  assert.equal(serialized.includes(privateAnswer), false);
  assert.deepEqual(Object.keys(collector.snapshot().calls[0]).sort(), [
    "cachedInputTokens",
    "inputTokens",
    "kind",
    "outputTokens",
    "usageAvailable",
  ]);
});

test("moderation tracking is separate from paid response usage", async () => {
  const collector = new NativeOkfUsageCollector();
  const { client } = createUsageTrackingClient(mockClient([]), collector);
  await client.moderations.create({
    model: "omni-moderation-latest",
    input: "mocked moderation input",
  });
  const snapshot = collector.snapshot();
  assert.equal(snapshot.moderationCalls, 1);
  assert.equal(snapshot.modelCalls, 0);
  assert.equal(snapshot.inputTokens, 0);
});

test("invalid token or price values fail closed", () => {
  assert.throws(
    () =>
      calculateUsageMicrodollars(
        {
          inputTokens: -1,
          cachedInputTokens: 0,
          outputTokens: 0,
          modelCalls: 1,
        },
        PRICES,
      ),
    /non-negative safe integer/,
  );
  assert.throws(
    () =>
      calculateUsageMicrodollars(
        {
          inputTokens: 1,
          cachedInputTokens: 0,
          outputTokens: 0,
          modelCalls: 1,
        },
        { ...PRICES, outputMicrodollarsPerMillion: Number.NaN },
      ),
    /non-negative safe integer/,
  );
});

test("Responses call envelopes are deterministic and fail closed without an output ceiling", () => {
  const request = {
    model: "mock-model",
    input: "bounded grounded input",
    max_output_tokens: 800,
    store: false,
  } as ResponseCreateParamsNonStreaming;
  const first = calculateResponseCallEnvelopeMicrodollars(
    request,
    PRICES,
  );
  const second = calculateResponseCallEnvelopeMicrodollars(
    request,
    PRICES,
  );
  const largerOutput = calculateResponseCallEnvelopeMicrodollars(
    { ...request, max_output_tokens: 1_600 },
    PRICES,
  );

  assert.equal(first, second);
  assert.equal(Number.isSafeInteger(first), true);
  assert.equal(first > 0, true);
  assert.equal(largerOutput > first, true);
  assert.throws(
    () =>
      calculateResponseCallEnvelopeMicrodollars(
        { model: "mock-model", input: "unbounded" } as never,
        PRICES,
      ),
    /max_output_tokens/,
  );
});

test("the pre-dispatch guard prevents a Responses call and records no model usage", async () => {
  let dispatches = 0;
  const baseClient: NativeOpenAiClient = {
    responses: {
      create: async () => {
        dispatches += 1;
        return responseWithUsage(1, 0, 1);
      },
    },
    moderations: {
      create: async () => ({ results: [{ flagged: false }] }) as never,
    },
  };
  const { client, collector } = createUsageTrackingClient(
    baseClient,
    undefined,
    {
      beforeResponseCall: () => {
        throw new Error("mock budget block");
      },
    },
  );

  await assert.rejects(
    client.responses.create({
      model: "mock-model",
      input: "private request",
      max_output_tokens: 800,
    }),
    /mock budget block/,
  );
  assert.equal(dispatches, 0);
  assert.equal(collector.snapshot().modelCalls, 0);
});

