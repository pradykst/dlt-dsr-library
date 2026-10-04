import "server-only";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { NativeOkfChatRequest, NativeOkfChatResponse } from "../src/native-okf/shared/chat-types.ts";
import type { NativeOkfModelTurnMetrics } from "../src/native-okf/server/openai/telemetry.ts";
import { getOkfBundle } from "../src/native-okf/server/cache.ts";
import { extendNativeOkfDiagramGrounding } from "../src/native-okf/server/openai/diagram-grounding.ts";
import { validateGeneratedDiagram } from "../src/native-okf/server/openai/diagram-validation.ts";
import { layoutGeneratedDiagram } from "../src/native-okf/components/chat/diagram-layout.ts";

// Exactly two sequential user turns through the real public loopback route.
// Provider access, moderation and any bounded repair/review remain app-owned.
const argument = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const base = new URL(argument("base-url") ?? "http://127.0.0.1:3123");
assert.ok(base.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(base.hostname));
assert.ok(process.argv.includes("--live") || process.argv.includes("--replay"), "Pass --live for the two authorized paid turns, or --replay for offline validation");
const log = argument("server-log"); assert.ok(log);
const directory = "artifacts/native-okf-evaluation/eval-upgrade";
await mkdir(directory, { recursive: true });
const logs = async () => (await readFile(log, "utf8")).split(/\r?\n/u).flatMap((line) => {
  try { const entry = JSON.parse(line); return entry.scope === "native-okf-model-turn" ? [entry as NativeOkfModelTurnMetrics] : []; } catch { return []; }
});
const questions = [
  "Using reusable design knowledge from the library, design a solution for fragmented product identities across multiple marketplaces and show the resulting design diagram.",
  "Add a governance requirement to this diagram without removing the existing design.",
];
const bundle = await getOkfBundle();
const rows: Record<string, unknown>[] = process.argv.includes("--resume-first") || process.argv.includes("--replay")
  ? JSON.parse(await readFile(`${directory}/diagram-benchmark.json`, "utf8")) : [];
if (process.argv.includes("--resume-first")) assert.equal(rows.length, 1, "Resume may reuse exactly the saved first turn");
if (process.argv.includes("--replay")) assert.equal(rows.length, 2, "Replay requires both saved turns and cannot send requests");
let previous: NativeOkfChatResponse | undefined;
for (const [index, question] of questions.entries()) {
  const request: NativeOkfChatRequest = { question, includeDiagram: true };
  if (previous) {
    request.conversationState = previous.conversationState;
    request.history = [{ role: "user", content: questions[0]! }, { role: "assistant", content: previous.answerMarkdown.slice(0, 2_000) }];
  }
  const saved = process.argv.includes("--replay") ? rows[index] : index === 0 && process.argv.includes("--resume-first") ? rows[0] : undefined;
  const before = (await logs()).length;
  const started = performance.now();
  const response = saved ? { status: saved.httpStatus as number, json: async () => saved.answer } : await fetch(new URL("/api/native-okf/chat", base), {
    method: "POST", redirect: "error", cache: "no-store",
    headers: { "content-type": "application/json", origin: base.origin, "sec-fetch-site": "same-origin" },
    body: JSON.stringify(request), signal: AbortSignal.timeout(240_000),
  });
  const answer = await response.json() as NativeOkfChatResponse;
  const latencyMs = saved ? saved.latencyMs as number : Math.round(performance.now() - started);
  const metrics = saved ? saved.metrics as NativeOkfModelTurnMetrics[] : (await logs()).slice(before);
  const row: Record<string, unknown> = saved ?? { turn: index + 1, question, httpStatus: response.status, latencyMs, metrics, answer, accepted: false };
  if (!saved) rows.push(row);
  const save = () => writeFile(`${directory}/diagram-benchmark.json`, JSON.stringify(rows, null, 2) + "\n");
  await save(); // Retain paid-call evidence even if a later acceptance check fails.
  assert.equal(metrics.length, 1, "Dedicated server must emit exactly one turn record");
  const turn = metrics[0]!;
  const diagram = answer.diagram;
  assert.equal(response.status, 200); assert.ok(diagram, JSON.stringify(answer));
  assert.equal(answer.diagramMode, "synthesized");
  assert.ok(turn.calls.length > 0);
  assert.equal(turn.model, "gpt-6.1-sol"); assert.equal(turn.reasoningEffort, "low");
  assert.ok(turn.calls.every((call) => call.model === "gpt-6.1-sol" && call.reasoningEffort === "low" && call.maxOutputTokens === 4_096));
  const completed = turn.calls.filter((call) => call.status === "completed");
  assert.ok(completed.length >= 1 && completed.every((call) => call.outputTokens !== null && call.outputTokens <= 4_096));
  if (turn.calls.some((call) => call.status !== "completed")) {
    // A validated returned initial plan plus a failed second invocation identifies
    // the optional review fallback. The public synthesis projection omits its
    // technical warning; do not require a new public response field for this audit.
    assert.ok(index === 0 && turn.calls.length === 2 && turn.calls[0]?.status === "completed" && turn.calls[1]?.status === "error", "Only the existing optional quality-review fallback may retain an incomplete call");
  }
  const sourceIds = new Set(answer.sources.map((source) => source.sourceId));
  const markers = [...answer.answerMarkdown.matchAll(/\[\[([^\]\r\n]+)\]\]/gu)].map((m) => m[1]);
  assert.ok((index !== 0 || markers.length > 0) && markers.every((id) => sourceIds.has(id!)));
  assert.ok(answer.sources.every((source) => bundle.conceptsById.has(source.conceptId)));
  const supportIds = new Set([...diagram.nodes.flatMap((n) => [...n.sourcePaths, ...n.supportConceptIds]), ...diagram.edges.flatMap((e) => e.supportConceptIds)]);
  assert.ok([...supportIds].every((id) => bundle.conceptsById.has(id)));
  const evidenceCards = new Set([...answer.sources, ...(previous?.sources ?? [])].map((s) => s.conceptId));
  assert.ok([...supportIds].every((id) => evidenceCards.has(id)), "All support must bind to current or preserved prior evidence cards");
  const grounding = await extendNativeOkfDiagramGrounding({ allowedConceptIds: new Set(), eligibleStoredConceptIds: new Set(), conceptsById: new Map(), storedRelations: [] }, supportIds);
  const validated = validateGeneratedDiagram(diagram, grounding, { mode: "synthesized", requireRpfPath: true, requireDisplayedStoredSupport: false });
  assert.ok(validated.ok, JSON.stringify(validated));
  assert.ok(diagram.nodes.filter((n) => n.provenance !== "user-provided").every((n) => n.provenance === "synthesized" && n.synthesis && /proposed|adapted/iu.test(n.synthesisRationale ?? "")));
  let preserved = null;
  if (previous?.diagram) {
    const prior = previous.diagram;
    assert.ok(/REFINE/iu.test(turn.requestMode), `Unexpected route: ${turn.requestMode}`);
    assert.ok(prior.nodes.every((node) => diagram.nodes.some((n) => JSON.stringify(n) === JSON.stringify(node))));
    assert.ok(prior.edges.every((edge) => diagram.edges.some((e) => JSON.stringify(e) === JSON.stringify(edge))));
    const additions = diagram.nodes.filter((n) => !prior.nodes.some((p) => p.id === n.id));
    assert.ok(additions.some((n) => n.stage === "design-requirement" && /governance|accountab|responsib|steward|decision|rule/iu.test(n.label + " " + n.description)));
    preserved = { nodes: prior.nodes.length, edges: prior.edges.length, addedNodes: additions.length };
  }
  for (const orientation of ["horizontal", "vertical"] as const) {
    const layout = await layoutGeneratedDiagram(diagram, { orientation });
    assert.equal(layout.nodes.length, diagram.nodes.length); assert.equal(layout.edges.length, diagram.edges.length);
    assert.ok(layout.nodes.every((n) => Number.isFinite(n.position.x) && Number.isFinite(n.position.y)));
    assert.ok(layout.edges.every((e) => e.points.length >= 2 && e.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))));
  }
  const costUsd = turn.inputTokens === null || turn.outputTokens === null ? null : ((turn.inputTokens - (turn.cachedInputTokens ?? 0)) * 2 + (turn.cachedInputTokens ?? 0) * 0.1 + turn.outputTokens * 10) / 1_000_000;
  const reportedCostUsd = completed.reduce((sum, call) => sum + ((call.inputTokens! - (call.cachedInputTokens ?? 0)) * 2 + (call.cachedInputTokens ?? 0) * 0.1 + call.outputTokens! * 10) / 1_000_000, 0);
  Object.assign(row, { accepted: true, citationsValid: true, inlineCitationCount: markers.length, provenanceValid: true, renderable: true, nodeCount: diagram.nodes.length, edgeCount: diagram.edges.length, preserved, providerCallCount: turn.calls.length, repairOccurred: index === 1 ? turn.calls.length > 1 : turn.calls.length > 2, qualityReviewUnavailable: index === 0 && turn.calls.some((call) => call.status === "error"), costUsd, reportedCostUsd, unknownUsageCalls: turn.calls.filter((call) => call.inputTokens === null || call.outputTokens === null).length });
  await save();
  console.log(JSON.stringify({ turn: index + 1, mode: turn.requestMode, latencyMs, nodeCount: diagram.nodes.length, edgeCount: diagram.edges.length, contextCharacters: turn.groundedContextCharacters, inputTokens: turn.inputTokens, outputTokens: turn.outputTokens, cachedInputTokens: turn.cachedInputTokens, reasoningTokens: turn.reasoningTokens, calls: turn.calls.length, warnings: answer.warnings, costUsd, accepted: true }));
  previous = answer;
}
