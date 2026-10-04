import "server-only";

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { NativeOkfChatRequest, NativeOkfChatResponse } from "../src/native-okf/shared/chat-types.ts";
import type { NativeOkfModelTurnMetrics } from "../src/native-okf/server/openai/telemetry.ts";

// Uses the real public route with all access, grounding, moderation and failure checks.
// Never imports a provider client or reads an API key. Exactly ten sequential turns.
const argument = (name: string) => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const baseUrl = new URL(argument("base-url") ?? "http://127.0.0.1:3123");
if (baseUrl.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(baseUrl.hostname)) {
  throw new Error("This benchmark may only target a local HTTP application.");
}
if (!process.argv.includes("--live")) throw new Error("Pass --live to authorize the ten paid local-route questions.");
const serverLog = argument("server-log");
if (!serverLog) throw new Error("Pass --server-log=<dedicated local server output> for usage measurements.");
const outputDirectory = resolve("artifacts/native-okf-evaluation/eval-upgrade");
await mkdir(outputDirectory, { recursive: true });

const questions = [
  ["factual QA", "What does the library say about patient consent self-management?"],
  ["cross-paper comparison", "Compare the trust mechanisms in Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity and And No One Gets the Short End of the Stick."],
  ["broad design knowledge", "What reusable design knowledge addresses trust, privacy and interoperability across blockchain artifacts?"],
  ["paper scope", "Explain the design principles and how the features implement them."],
  ["paper follow-up", "Explain the first principle and its implementation in more detail."],
  ["tokenization classification", "Which papers use tokenization?"],
  ["privacy comparison", "Compare the privacy approaches across the papers in the library."],
  ["trust comparison", "Compare how the library's design principles address interorganizational trust."],
  ["design-guidance synthesis", "How can fragmented product data and product identities across multiple marketplaces be addressed using reusable design knowledge from the library?"],
  ["difficult broad synthesis", "Synthesize grounded design guidance for a cross-organizational product traceability system balancing privacy, interoperability, trust and participant incentives. Explain the supporting evidence and limitations."],
] as const;

async function modelLogs(): Promise<NativeOkfModelTurnMetrics[]> {
  const data = await readFile(resolve(serverLog!), "utf8");
  return data.split(/\r?\n/u).flatMap((line) => {
    try {
      const entry = JSON.parse(line) as NativeOkfModelTurnMetrics & { scope?: string };
      return entry.scope === "native-okf-model-turn" ? [entry] : [];
    } catch { return []; }
  });
}

let scopedResponse: NativeOkfChatResponse | undefined;
const rows: Record<string, unknown>[] = [];
for (const [index, [category, question]] of questions.entries()) {
  const before = (await modelLogs()).length;
  const request: NativeOkfChatRequest = { question, includeDiagram: false };
  if (index === 3 || index === 4) request.scope = { type: "paper", paperId: "blockchain-iot-sensor-data" };
  if (index === 4 && scopedResponse) {
    request.conversationState = scopedResponse.conversationState;
    request.history = [{ role: "user", content: questions[3][1] }, { role: "assistant", content: scopedResponse.answerMarkdown.slice(0, 2_000) }];
  }
  const startedAt = performance.now();
  const response = await fetch(new URL("/api/native-okf/chat", baseUrl), {
    method: "POST", redirect: "error", cache: "no-store",
    headers: { "content-type": "application/json", origin: baseUrl.origin, "sec-fetch-site": "same-origin" },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(240_000),
  });
  const answer = await response.json() as NativeOkfChatResponse & { error?: string; code?: string };
  const latencyMs = Math.round(performance.now() - startedAt);
  const entries = (await modelLogs()).slice(before);
  if (entries.length > 1) throw new Error("Use a dedicated server with no concurrent benchmark traffic.");
  const metrics = entries[0] ?? null;
  const suppliedIds = new Set(answer.sources?.map((source) => source.sourceId) ?? []);
  const markers = [...(answer.answerMarkdown ?? "").matchAll(/\[\[([^\]\r\n]+)\]\]/gu)].map((match) => match[1]);
  const scoped = index === 3 || index === 4;
  const citationsValid = response.ok && markers.length > 0 && markers.every((id) => suppliedIds.has(id!)) &&
    (!scoped || answer.sources.every((source) => source.conceptId === "papers/blockchain-iot-sensor-data" || source.conceptId.startsWith("design-knowledge/blockchain-iot-sensor-data-")));
  // Reasoning is already included in outputTokens. Do not add it to billed output.
  const costUsd = metrics?.inputTokens != null && metrics.outputTokens != null
    ? (metrics.inputTokens * 2 + metrics.outputTokens * 10) / 1_000_000 : null;
  const row = {
    query: index + 1, category, question, httpStatus: response.status,
    latencyMs, firstTextTokenMs: null, citationsValid,
    approximateContextCharacters: metrics?.groundedContextCharacters ?? null,
    costUsd, costBasis: "Uncached Standard estimate: $2/M input, $10/M output; separate cache-write charges unavailable.",
    metrics, answer,
  };
  rows.push(row);
  await writeFile(resolve(outputDirectory, "benchmark.json"), JSON.stringify(rows, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ query: row.query, category, httpStatus: row.httpStatus, latencyMs, citationsValid, contextCharacters: row.approximateContextCharacters, inputTokens: metrics?.inputTokens, cachedInputTokens: metrics?.cachedInputTokens, outputTokens: metrics?.outputTokens, reasoningTokens: metrics?.reasoningTokens, calls: metrics?.calls.length, costUsd }));
  if (index === 3 && response.ok) scopedResponse = answer;
  if (!response.ok && [401, 403, 429, 502, 503, 504].includes(response.status)) {
    throw new Error(`Stopped paid benchmark on upstream/access failure HTTP ${response.status}; completed rows are saved.`);
  }
}
