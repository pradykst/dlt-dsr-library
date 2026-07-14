const query = "I want to design a cross-marketplace product identity and review-continuity protocol where the same exact product variant can be listed on multiple marketplaces, sellers can relist products, buyers can leave verified-purchase reviews, and competitors should not expose raw commercial data. Which reusable DSR design requirements, design principles, design features, and artifact patterns should I reuse from the OKF library? Build a concise Requirement -> Principle -> Feature -> Artifact flow, explain which papers support each part, show evidence, and clearly mark any product-identity-specific suggestions as query-generated.";

type GraphNode = { id: string; layer: string; provenance?: string };
type GraphEdge = { source: string; target: string };
type SourcePaper = { title: string };
type ProviderStatus = { provider?: string; configured?: boolean; reachable?: boolean; attempted?: boolean; http_status?: number; outcome?: string; error_type?: string; fallback_reason?: string };

const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/okf/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query })
});
if (!response.ok) throw new Error(`Expected status 200, got ${response.status}`);
const payload = await response.json();
const answer = typeof payload.answer === "string" ? payload.answer.trim() : "";
const graph = payload.flow_graph ?? payload.flow ?? { nodes: [], edges: [] };
const nodes: GraphNode[] = Array.isArray(graph.nodes) ? graph.nodes : [];
const edges: GraphEdge[] = Array.isArray(graph.edges) ? graph.edges : [];
const moves = payload.answer_plan?.design_moves ?? payload.answer_payload?.design_moves ?? [];
const providerStatus: ProviderStatus | undefined = payload.runtime?.provider_status;
const guardOutcome = payload.llm_synthesis?.debug?.guard_outcome;

const requiredSections = [
  "# Recommendation",
  "## Design moves to reuse",
  "## Suggested architecture direction",
  "## What not to overclaim"
];
const visibleLayers = ["Requirement", "Principle", "Feature", "Artifact"];
const layerCounts = Object.fromEntries(visibleLayers.map((layer) => [layer, nodes.filter((node) => node.layer === layer).length]));
const nodeIds = new Set(nodes.map((node) => node.id));
const incidentNodeIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
const orphanNodes = nodes.filter((node) => !incidentNodeIds.has(node.id));
const danglingEdges = edges.filter((edge) => !nodeIds.has(edge.source) || !nodeIds.has(edge.target));
const leakedKnownIds = [
  ...(payload.evidence ?? []).map((item: { evidence_id?: string }) => item.evidence_id),
  ...(payload.retrieved_concepts ?? []).map((item: { concept_id?: string }) => item.concept_id)
].filter((id): id is string => typeof id === "string" && id.length > 0).some((id) => answer.includes(id));
const leakPattern = /prompt context|the prompt context has|I will use|system prompt|design moves\s*\/\s*flow rows|answer_plan|evidence_pack|flow_graph|move_explanations|supporting_paper_ids|evidence_ids|concept_ids/i;
const sourceTitles = (payload.source_papers ?? []).map((paper: SourcePaper) => paper.title);
const lastLine = answer.split(/\r?\n/).map((line: string) => line.trim()).filter(Boolean).at(-1) ?? "";
const normalizedTail = normalizeTitle(lastLine.replace(/^\s*(?:[-*]|\d+[.)])?\s*(?:(?:source\s+)?paper|source)\s*:\s*/i, ""));
const hasNakedSourceTail = sourceTitles.some((title: string) => normalizedTail === normalizeTitle(title) || normalizedTail === normalizeTitle(shortPaperTitle(title)));
const allowedOutcomes = new Set(["not_configured", "configured", "reachable", "synthesis_skipped", "synthesis_used", "rate_limited", "validation_error", "provider_error"]);
const guardOutcomeConsistent = providerStatus?.outcome === "synthesis_used"
  ? providerStatus.provider === "mock" || guardOutcome === "accepted"
  : providerStatus?.outcome === "validation_error"
    ? guardOutcome === "rejected"
    : guardOutcome === undefined || guardOutcome === "not_validated";

const checks: Array<[boolean, string]> = [
  [payload.intent === "DESIGN_REUSE_FLOW_QUERY", "routes to DESIGN_REUSE_FLOW_QUERY"],
  [answer.length > 0, "payload.answer is the nonempty canonical answer"],
  [requiredSections.every((section) => answer.includes(section)), "canonical answer contains all required sections"],
  [!leakPattern.test(answer), "canonical answer contains no prompt/context/internal-field leakage"],
  [!leakedKnownIds, "canonical answer contains no raw evidence or concept IDs"],
  [!hasNakedSourceTail, "canonical answer does not end with a naked or annotated source title"],
  [Array.isArray(moves) && moves.length >= 5 && moves.length <= 7, "answer plan contains 5-7 design moves"],
  [providerStatus !== undefined, "runtime exposes canonical provider_status"],
  [Boolean(providerStatus && typeof providerStatus.configured === "boolean" && typeof providerStatus.reachable === "boolean" && typeof providerStatus.attempted === "boolean"), "provider_status exposes configured/reachable/attempted"],
  [Boolean(providerStatus?.outcome && allowedOutcomes.has(providerStatus.outcome)), "provider_status exposes a recognized outcome"],
  [guardOutcomeConsistent, "AnswerGuard outcome agrees with provider outcome"],
  [graph.mode === "mixed_reuse_flow" || graph.mode === "query_generated_flow", "query flow uses mixed/query-generated graph mode"],
  [visibleLayers.every((layer) => layerCounts[layer] > 0), "FlowGraph contains each visible design layer"],
  [visibleLayers.every((layer) => layerCounts[layer] <= 7), "FlowGraph has at most 7 nodes per visible layer"],
  [orphanNodes.length === 0, "FlowGraph has no orphan nodes"],
  [danglingEdges.length === 0, "FlowGraph edges reference visible graph nodes"]
];

const failed = checks.filter(([ok]) => !ok).map(([, label]) => label);
if (failed.length) throw new Error(`Smoke query failed: ${failed.join(", ")}`);
console.log(JSON.stringify({ ok: true, answer_chars: answer.length, moves: moves.length, graph_nodes: nodes.length, graph_edges: edges.length, layer_counts: layerCounts, provider_status: providerStatus, guard_outcome: guardOutcome ?? "not_run" }, null, 2));

function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function shortPaperTitle(title: string) {
  return title.includes(":") ? title.split(":")[0] : title;
}

export {};
