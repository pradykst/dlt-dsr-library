import fs from "node:fs";
import path from "node:path";
import { knowledgeEdges, knowledgeNodes } from "../../data/knowledge-base.ts";
import { getWorkbenchFlowGraph } from "./workbench-adapter.ts";
import { parseOkfLibrary } from "./parser.ts";
import type { OkfConcept, OkfGraphSourceReference, OkfKnowledgeBase, OkfRelation } from "./schema.ts";
import { isCanonicalDsrTransition } from "./dsr-transition-contract.ts";

export const OKF_FLOW_SCHEMA_VERSION = "okf-dsr-v1";
export const canonicalFlowTypes = [
  "Problem", "Design Requirement", "Design Principle", "Design Feature",
  "Artifact", "Evaluation", "Output Knowledge"
] as const;
export type CanonicalFlowType = (typeof canonicalFlowTypes)[number];
export type FlowValidationSeverity = "error" | "warning";
export type FlowValidationIssue = { code: string; severity: FlowValidationSeverity; message: string; ids: string[] };
export type RecommendedPathValidation = { index: number; node_ids: string[]; relation_ids: string[]; missing_edges: string[]; invalid_transitions: string[] };
export type LegacyNodeMatch = { legacy_id: string; okf_id: string; method: "exact_id" | "explicit_alias" };
export type LegacyFlowComparison = {
  source: "data/knowledge-base.ts" | "none";
  legacy_paper_id?: string;
  matched_nodes: LegacyNodeMatch[];
  unresolved_aliases: string[];
  ambiguous_aliases: string[];
  matched_edges: string[];
  predicate_mismatches: string[];
  missing_okf_edges: string[];
  extra_okf_edges: string[];
};
export type PaperFlowValidation = {
  paper_id: string;
  source_reference?: OkfGraphSourceReference;
  slug: string;
  graph_file: string;
  status: "pass" | "manual_review" | "fail";
  graph_counts: { nodes: number; edges: number; recommended_paths: number; focused_rpf_chains: number };
  recommended_paths: RecommendedPathValidation[];
  workbench: {
    stored_flow_source?: "graph_json" | "okf_relations_fallback";
    recommended_relation_ids: string[];
    focused_relation_ids: string[];
    full_relation_ids: string[];
  };
  legacy: LegacyFlowComparison;
  issues: FlowValidationIssue[];
};
export type FlowValidationReport = {
  schema_version: typeof OKF_FLOW_SCHEMA_VERSION;
  summary: { papers: number; passed: number; manual_review: number; failed: number; errors: number; warnings: number };
  papers: PaperFlowValidation[];
};
export type ValidateOkfFlowsOptions = { knowledgeBase?: OkfKnowledgeBase; okfRoot?: string };

type RawGraphNode = { id?: unknown; type?: unknown; title?: unknown };
type RawGraphEdge = { id?: unknown; source?: unknown; target?: unknown; predicate?: unknown };
type RawGraph = {
  schema_version?: unknown; paper_id?: unknown; title?: unknown; nodes?: unknown;
  edges?: unknown; recommended_paths?: unknown; [key: string]: unknown;
};

const allowedGraphRootKeys = new Set(["schema_version", "paper_id", "title", "source_reference", "source_views", "nodes", "edges", "recommended_paths"]);
const canonicalTypeSet = new Set<string>(canonicalFlowTypes);
const legacyPaperIds: Record<string, string> = {
  BLOCKCHAIN_IOT_SDPS_2019: "paper-iot-sdps",
  HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023: "paper-consent-hie",
  NIL_NFT_MARKETPLACE_2026: "paper-nil-marketplace",
  PEER_REVIEW_TOKEN_INCENTIVES_2025: "paper-peer-review-token",
  SHORT_END_STICK_2025: "paper-opportunism",
  SSI_KYC_FRAMEWORK_2022: "paper-ssi-kyc",
  TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024: "paper-trust-capacity"
};
const legacyNodeTypeToCanonical: Record<string, CanonicalFlowType | undefined> = {
  problem: "Problem", requirement: "Design Requirement", principle: "Design Principle",
  feature: "Design Feature", artifact: "Artifact", evaluation: "Evaluation"
};

export async function validateOkfFlows(options: ValidateOkfFlowsOptions = {}): Promise<FlowValidationReport> {
  const okfRoot = options.okfRoot ?? path.join(process.cwd(), "library", "okf");
  const kb = options.knowledgeBase ?? parseOkfLibrary(okfRoot);
  const conceptById = new Map(kb.concepts.map((concept) => [concept.concept_id, concept]));
  const relationById = new Map(kb.relations.map((relation) => [relation.relation_id, relation]));
  const results: PaperFlowValidation[] = [];

  for (const paper of [...kb.papers].sort((left, right) => left.paper_id.localeCompare(right.paper_id))) {
    const issues: FlowValidationIssue[] = [];
    const slug = paper.paper_id.toLowerCase().replace(/_+/g, "-");
    const paperDir = resolvePaperDirectory(paper.source_file, okfRoot, slug);
    const graphFile = path.join(paperDir, "graph.json");
    const graph = readGraph(graphFile, issues);
    const paperConcepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
    const paperConceptIds = new Set(paperConcepts.map((concept) => concept.concept_id));
    const paperRelations = kb.relations.filter((relation) => paperConceptIds.has(relation.source_concept_id)
      && paperConceptIds.has(relation.target_concept_id) && relation.relation_scope !== "query_generated");
    const graphNodes = recordArray(graph?.nodes) as RawGraphNode[];
    const graphEdges = recordArray(graph?.edges) as RawGraphEdge[];
    const recommendedPaths = nestedStringArrays(graph?.recommended_paths);
    if (graph) validateGraphRoot(graph, paper.paper_id, issues);
    const sourceReference = paper.graph_source_reference;
    if (!sourceReference) {
      addIssue(issues, "SOURCE_REFERENCE_MISSING", "warning", "No paper figure, table, or stored-relation projection source is recorded for this flow.");
    } else if (sourceReference.validation_status === "unreviewed") {
      addIssue(issues, "SOURCE_REFERENCE_UNREVIEWED", "warning", `${sourceReference.label ?? sourceReference.type} is recorded but still requires manual semantic review.`);
    } else if (!paper.reviewed_by || !paper.reviewed_at) {
      addIssue(issues, "SOURCE_REFERENCE_REVIEW_METADATA_MISSING", "error", "An elevated flow validation status requires reviewed_by and reviewed_at paper metadata.");
    } else if (sourceReference.validation_status === "author_verified"
      && (paper.review_status !== "author_verified" || paper.author_check_status !== "verified")) {
      addIssue(issues, "SOURCE_REFERENCE_AUTHOR_VERIFICATION_INVALID", "error", "Author-verified flow provenance requires author_verified paper review and verified author-check status.");
    }


    const graphNodeIds = new Set<string>();
    const graphTypeById = new Map<string, CanonicalFlowType>();
    for (const [index, node] of graphNodes.entries()) {
      const id = cleanString(node.id);
      if (!id) { addIssue(issues, "GRAPH_NODE_ID_MISSING", "error", `Graph node ${index + 1} has no id.`); continue; }
      if (!isFullyScopedId(id, paper.paper_id)) addIssue(issues, "GRAPH_NODE_ID_NOT_SCOPED", "error", `Graph node ${id} is not fully scoped to ${paper.paper_id}.`, [id]);
      if (graphNodeIds.has(id)) addIssue(issues, "GRAPH_NODE_DUPLICATE", "error", `Graph node ${id} is duplicated.`, [id]);
      graphNodeIds.add(id);
      const concept = conceptById.get(id);
      if (!concept || concept.paper_id !== paper.paper_id) {
        addIssue(issues, "GRAPH_NODE_UNKNOWN", "error", `Graph node ${id} does not exist in this paper's canonical concepts.`, [id]);
        continue;
      }
      const expectedType = canonicalTypeForConcept(concept);
      const rawType = cleanString(node.type);
      if (!expectedType) addIssue(issues, "GRAPH_NODE_NON_FLOW_TYPE", "error", `Concept ${id} has noncanonical flow type ${String(concept.type)}.`, [id]);
      else {
        graphTypeById.set(id, expectedType);
        if (rawType !== expectedType) addIssue(issues, "GRAPH_NODE_TYPE_MISMATCH", "error", `Graph node ${id} uses type ${rawType || "<missing>"}; expected ${expectedType}.`, [id]);
      }
      const title = cleanString(node.title);
      if (title !== concept.title) addIssue(issues, "GRAPH_NODE_TITLE_MISMATCH", "error", `Graph title for ${id} differs from the canonical concept title.`, [id]);
    }
    const graphEdgeIds = new Set<string>();
    const graphEdgeTriples = new Set<string>();
    const graphEdgesByPair = new Map<string, Array<{ id: string; predicate: string }>>();
    for (const [index, edge] of graphEdges.entries()) {
      const id = cleanString(edge.id);
      const source = cleanString(edge.source);
      const target = cleanString(edge.target);
      const predicate = cleanString(edge.predicate);
      const displayId = id || `edge ${index + 1}`;
      if (!id) addIssue(issues, "GRAPH_EDGE_ID_MISSING", "error", `${displayId} has no canonical relation id.`);
      else {
        if (!isFullyScopedId(id, paper.paper_id)) addIssue(issues, "GRAPH_EDGE_ID_NOT_SCOPED", "error", `Graph edge ${id} is not fully scoped to ${paper.paper_id}.`, [id]);
        if (graphEdgeIds.has(id)) addIssue(issues, "GRAPH_EDGE_DUPLICATE", "error", `Graph edge ${id} is duplicated.`, [id]);
        graphEdgeIds.add(id);
      }
      if (!source || !target || !predicate) {
        addIssue(issues, "GRAPH_EDGE_FIELDS_MISSING", "error", `${displayId} must have source, target, and predicate.`, [displayId]);
        continue;
      }
      if (!isFullyScopedId(source, paper.paper_id) || !isFullyScopedId(target, paper.paper_id)) addIssue(issues, "GRAPH_EDGE_ENDPOINT_NOT_SCOPED", "error", `${displayId} has an endpoint that is not fully scoped to ${paper.paper_id}.`, [source, target]);
      if (!graphNodeIds.has(source) || !graphNodeIds.has(target)) addIssue(issues, "GRAPH_EDGE_ENDPOINT_NOT_DECLARED", "error", `${displayId} references an endpoint absent from graph nodes.`, [source, target]);
      const triple = relationTriple(source, predicate, target);
      if (graphEdgeTriples.has(triple)) addIssue(issues, "GRAPH_EDGE_TRIPLE_DUPLICATE", "error", `${displayId} duplicates graph relation ${source} --${predicate}--> ${target}.`, [id, source, target].filter(Boolean));
      graphEdgeTriples.add(triple);
      graphEdgesByPair.set(relationPair(source, target), [...(graphEdgesByPair.get(relationPair(source, target)) ?? []), { id, predicate }]);
      const stored = id ? relationById.get(id) : undefined;
      if (!stored) addIssue(issues, "GRAPH_EDGE_RELATION_MISSING", "error", `${displayId} does not identify a stored OKF relation.`, [displayId]);
      else if (stored.source_concept_id !== source || stored.target_concept_id !== target || stored.predicate !== predicate || stored.relation_scope === "query_generated") {
        addIssue(issues, "GRAPH_EDGE_RELATION_MISMATCH", "error", `${id} does not exactly match its stored OKF relation.`, [id]);
      }
    }

    if (recommendedPaths.length === 0) addIssue(issues, "RECOMMENDED_PATHS_MISSING", "warning", "No reviewer-selected recommended path is recorded; runtime may use a relation fallback.");
    const recommendedPathResults = recommendedPaths.map((nodeIds, index) => validateRecommendedPath({
      index, nodeIds, paperId: paper.paper_id, graphNodeIds, graphTypeById, graphEdgesByPair, relationById, issues
    }));
    const focusedRpfChains = findFocusedRpfChains(graphNodes, graphEdges, graphTypeById, relationById);
    if (focusedRpfChains.length === 0) addIssue(issues, "FOCUSED_RPF_CHAIN_MISSING", "error", "No complete stored Requirement -> Principle -> Feature chain exists in graph.json.");

    const workbench = {
      stored_flow_source: undefined as "graph_json" | "okf_relations_fallback" | undefined,
      recommended_relation_ids: [] as string[], focused_relation_ids: [] as string[], full_relation_ids: [] as string[]
    };
    try {
      const projection = await getWorkbenchFlowGraph(paper.paper_id, { knowledgeBase: kb });
      if (!projection) addIssue(issues, "WORKBENCH_PROJECTION_MISSING", "error", "Workbench did not return a stored flow projection.");
      else {
        workbench.stored_flow_source = projection.stored_flow_source;
        workbench.recommended_relation_ids = sortedUnique(projection.recommended.relations.map((relation) => relation.relation_id));
        workbench.focused_relation_ids = sortedUnique(projection.focused.relations.map((relation) => relation.relation_id));
        workbench.full_relation_ids = sortedUnique(projection.full.relations.map((relation) => relation.relation_id));
        validateWorkbenchProjection({ projection, conceptById, relationById, graphEdgeIds, recommendedPaths, recommendedPathResults, issues });
      }
    } catch (error) {
      addIssue(issues, "WORKBENCH_PROJECTION_ERROR", "error", `Workbench projection failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    const legacy = compareLegacyFlow({ paperId: paper.paper_id, paperDir, paperConcepts, paperRelations });
    if (legacy.source === "none") addIssue(issues, "LEGACY_SOURCE_UNAVAILABLE", "warning", "No deterministic legacy static-flow source is mapped for this paper.");
    else {
      if (legacy.unresolved_aliases.length) addIssue(issues, "LEGACY_ALIAS_UNRESOLVED", "warning", `${legacy.unresolved_aliases.length} legacy node alias(es) are unresolved.`, legacy.unresolved_aliases);
      if (legacy.ambiguous_aliases.length) addIssue(issues, "LEGACY_ALIAS_AMBIGUOUS", "warning", `${legacy.ambiguous_aliases.length} legacy node alias(es) are ambiguous.`, legacy.ambiguous_aliases);
      if (legacy.missing_okf_edges.length || legacy.predicate_mismatches.length) addIssue(issues, "LEGACY_EDGE_DIFFERENCE", "warning", "Legacy comparison contains edge differences that require human review.", [...legacy.missing_okf_edges, ...legacy.predicate_mismatches]);
    }

    issues.sort(compareIssues);
    const status = issues.some((issue) => issue.severity === "error") ? "fail" as const : issues.length ? "manual_review" as const : "pass" as const;
    results.push({
      paper_id: paper.paper_id, slug, graph_file: normalizePath(path.relative(process.cwd(), graphFile)), status,
      graph_counts: { nodes: graphNodes.length, edges: graphEdges.length, recommended_paths: recommendedPaths.length, focused_rpf_chains: focusedRpfChains.length },
      recommended_paths: recommendedPathResults, source_reference: sourceReference, workbench, legacy, issues
    });
  }

  const errors = results.flatMap((paper) => paper.issues).filter((issue) => issue.severity === "error").length;
  const warnings = results.flatMap((paper) => paper.issues).filter((issue) => issue.severity === "warning").length;
  return {
    schema_version: OKF_FLOW_SCHEMA_VERSION,
    summary: {
      papers: results.length,
      passed: results.filter((paper) => paper.status === "pass").length,
      manual_review: results.filter((paper) => paper.status === "manual_review").length,
      failed: results.filter((paper) => paper.status === "fail").length,
      errors, warnings
    },
    papers: results
  };
}

export function renderFlowValidationReport(report: FlowValidationReport) {
  const lines: string[] = [
    "# OKF Flow Validation Report", "", `Schema: \`${report.schema_version}\``, "",
    "This report is generated deterministically from canonical OKF bundles and the repository's explicit legacy aliases. Legacy data is comparison-only and never changes canonical DSR facts. Source Figure validation is reported separately by `okf:validate:source-views`; this report checks Recommended Flow, Pathway Matrix, and Full Relations inputs.", "",
    "## Summary", "", `- Papers: ${report.summary.papers}`, `- Passed: ${report.summary.passed}`,
    `- Manual review: ${report.summary.manual_review}`, `- Failed: ${report.summary.failed}`,
    `- Structural errors: ${report.summary.errors}`, `- Warnings: ${report.summary.warnings}`, "",
    report.summary.errors === 0
      ? "**Outcome:** All canonical graph and Workbench projection structural checks passed. Manual-review status reflects non-blocking recommendation or legacy-comparison gaps."
      : "**Outcome:** Structural failures must be resolved before relying on the affected Workbench flows.", "",
    "| Paper | Status | Graph | Recommended paths | Stored R->P->F matrix chains | Source reference | Legacy |",
    "| --- | --- | ---: | ---: | ---: | --- | --- |"
  ];
  for (const paper of report.papers) {
    const legacy = paper.legacy.source === "none" ? "Not available" : `${paper.legacy.matched_nodes.length} node / ${paper.legacy.matched_edges.length} edge matches`;
    const source = paper.source_reference ? `${paper.source_reference.label ?? paper.source_reference.type} (${paper.source_reference.validation_status})` : "Missing";
    lines.push(`| ${paper.paper_id} | ${paper.status.replace("_", " ")} | ${paper.graph_counts.nodes} nodes / ${paper.graph_counts.edges} edges | ${paper.graph_counts.recommended_paths} | ${paper.graph_counts.focused_rpf_chains} | ${source} | ${legacy} |`);
  }
  lines.push("", "## Paper results", "");
  for (const paper of report.papers) {
    lines.push(`### ${paper.paper_id}`, "", `- Graph: \`${paper.graph_file}\``, `- Status: **${paper.status.replace("_", " ")}**`,
      `- Stored Workbench source: ${paper.workbench.stored_flow_source ?? "unavailable"}`,
      `- Stored relation checks: ${paper.workbench.recommended_relation_ids.length} recommended-flow, ${paper.workbench.focused_relation_ids.length} R->P->F matrix, ${paper.workbench.full_relation_ids.length} full-relations`, "");
    const source = paper.source_reference;
    lines.push(`- Source reference: ${source ? `${source.label ?? source.type}${source.page ? `, page ${source.page}` : ""} - ${source.caption ?? "No caption recorded"}` : "Not recorded"}`,
      `- Semantic validation: ${source?.validation_status ?? "unreviewed"}`, "");
    if (paper.recommended_paths.length) {
      lines.push("Recommended paths:", "");
      for (const result of paper.recommended_paths) {
        lines.push(`- Path ${result.index + 1}: ${result.node_ids.map((id) => `\`${id}\``).join(" -> ")}`,
          `  - Stored relations: ${result.relation_ids.length ? result.relation_ids.map((id) => `\`${id}\``).join(", ") : "None"}`);
        if (result.missing_edges.length) lines.push(`  - Missing edges: ${result.missing_edges.map((id) => `\`${id}\``).join(", ")}`);
        if (result.invalid_transitions.length) lines.push(`  - Invalid transitions: ${result.invalid_transitions.map((id) => `\`${id}\``).join(", ")}`);
      }
      lines.push("");
    }
    lines.push("Issues:", "");
    if (!paper.issues.length) lines.push("- None.");
    for (const issue of paper.issues) {
      lines.push(`- **${issue.severity.toUpperCase()} ${issue.code}:** ${issue.message}`);
      if (issue.ids.length) lines.push(`  - IDs: ${issue.ids.map((id) => `\`${id}\``).join(", ")}`);
    }
    lines.push("", "Legacy comparison:", "");
    if (paper.legacy.source === "none") lines.push("- No deterministic repository legacy source is mapped.");
    else {
      lines.push(`- Source: \`${paper.legacy.source}\` (${paper.legacy.legacy_paper_id})`);
      appendList(lines, "Matched node mappings", paper.legacy.matched_nodes.map((match) => `${match.legacy_id} -> ${match.okf_id} (${match.method})`));
      appendList(lines, "Matched edges", paper.legacy.matched_edges);
      appendList(lines, "Unresolved aliases / missing mapped OKF nodes", paper.legacy.unresolved_aliases);
      appendList(lines, "Ambiguous aliases", paper.legacy.ambiguous_aliases);
      appendList(lines, "Predicate mismatches", paper.legacy.predicate_mismatches);
      appendList(lines, "Missing OKF edges", paper.legacy.missing_okf_edges);
      appendList(lines, "Extra OKF edges among mapped nodes", paper.legacy.extra_okf_edges);
    }
    lines.push("");
  }
  lines.push(
    "## Interpretation rules", "",
    "- `graph.json` edges must identify exact stored OKF relations; the validator never infers or repairs edges.",
    "- Recommended paths are ordered edge sequences. Every adjacent pair must have an exact graph edge and stored relation.",
    "- Pathway Matrix Requirement -> Principle -> Feature cells may use stored graph/relation edges only.",
    "- Legacy matches require exact IDs or terms explicitly recorded in `aliases.yaml`; fuzzy matches are deliberately excluded.",
    "- Source Figure, Recommended Flow, and Full Relations share one canonical projector; deterministic ELK layout and direct border-to-border edges do not alter graph semantics.",
    "- Legacy differences are manual-review signals, not instructions to rewrite canonical OKF facts.", ""
  );
  return lines.join("\n");
}

function validateGraphRoot(graph: RawGraph, paperId: string, issues: FlowValidationIssue[]) {
  if (graph.schema_version !== OKF_FLOW_SCHEMA_VERSION) addIssue(issues, "GRAPH_SCHEMA_VERSION_INVALID", "error", `graph.json schema_version must be ${OKF_FLOW_SCHEMA_VERSION}.`);
  if (graph.paper_id !== paperId) addIssue(issues, "GRAPH_PAPER_ID_MISMATCH", "error", `graph.json paper_id ${String(graph.paper_id)} does not match ${paperId}.`);
  for (const required of ["schema_version", "paper_id", "title", "nodes", "edges", "recommended_paths"]) {
    if (!(required in graph)) addIssue(issues, "GRAPH_REQUIRED_KEY_MISSING", "error", `graph.json is missing required key ${required}.`, [required]);
  }
  const unknown = Object.keys(graph).filter((key) => !allowedGraphRootKeys.has(key)).sort();
  if (unknown.length) addIssue(issues, "GRAPH_ROOT_KEY_NONCANONICAL", "error", `graph.json contains noncanonical root key(s): ${unknown.join(", ")}.`, unknown);
  if (!Array.isArray(graph.nodes)) addIssue(issues, "GRAPH_NODES_INVALID", "error", "graph.json nodes must be an array.");
  if (!Array.isArray(graph.edges)) addIssue(issues, "GRAPH_EDGES_INVALID", "error", "graph.json edges must be an array.");
  if (!cleanString(graph.title)) addIssue(issues, "GRAPH_TITLE_INVALID", "error", "graph.json title must be a nonempty string.");
  if (!Array.isArray(graph.recommended_paths)) addIssue(issues, "GRAPH_RECOMMENDED_PATHS_INVALID", "error", "graph.json recommended_paths must be an array of string arrays.");
  else {
    for (const [index, candidate] of graph.recommended_paths.entries()) {
      if (!Array.isArray(candidate) || candidate.length < 2 || candidate.some((id) => typeof id !== "string" || !id.trim())) {
        addIssue(issues, "GRAPH_RECOMMENDED_PATH_INVALID", "error", `Recommended path ${index + 1} must contain at least two nonempty string IDs.`);
      }
    }
  }
}

function validateRecommendedPath(input: {
  index: number; nodeIds: string[]; paperId: string; graphNodeIds: Set<string>;
  graphTypeById: Map<string, CanonicalFlowType>;
  graphEdgesByPair: Map<string, Array<{ id: string; predicate: string }>>;
  relationById: Map<string, OkfRelation>; issues: FlowValidationIssue[];
}): RecommendedPathValidation {
  const relationIds: string[] = [];
  const missingEdges: string[] = [];
  const invalidTransitions: string[] = [];
  if (input.nodeIds.length < 2) addIssue(input.issues, "RECOMMENDED_PATH_TOO_SHORT", "error", `Recommended path ${input.index + 1} must contain at least two nodes.`);
  const duplicateNodes = duplicates(input.nodeIds);
  if (duplicateNodes.length) addIssue(input.issues, "RECOMMENDED_PATH_NODE_DUPLICATE", "error", `Recommended path ${input.index + 1} repeats node(s).`, duplicateNodes);
  for (const id of input.nodeIds) {
    if (!isFullyScopedId(id, input.paperId)) addIssue(input.issues, "RECOMMENDED_PATH_NODE_NOT_SCOPED", "error", `Recommended path ${input.index + 1} uses unscoped node ${id}.`, [id]);
    if (!input.graphNodeIds.has(id)) addIssue(input.issues, "RECOMMENDED_PATH_NODE_UNKNOWN", "error", `Recommended path ${input.index + 1} references node ${id} outside graph nodes.`, [id]);
  }
  for (let index = 0; index < input.nodeIds.length - 1; index += 1) {
    const source = input.nodeIds[index];
    const target = input.nodeIds[index + 1];
    const signature = `${source} -> ${target}`;
    const edges = input.graphEdgesByPair.get(relationPair(source, target)) ?? [];
    const storedEdges = edges.filter((edge) => {
      const relation = input.relationById.get(edge.id);
      return relation && relation.source_concept_id === source && relation.target_concept_id === target
        && relation.predicate === edge.predicate && relation.relation_scope !== "query_generated";
    });
    if (!storedEdges.length) {
      missingEdges.push(signature);
      addIssue(input.issues, "RECOMMENDED_PATH_EDGE_MISSING", "error", `Recommended path ${input.index + 1} has no exact stored graph edge for ${signature}.`, [source, target]);
      continue;
    }
    relationIds.push(...storedEdges.map((edge) => edge.id));
    const sourceType = input.graphTypeById.get(source);
    const targetType = input.graphTypeById.get(target);
    if (!storedEdges.some((edge) => sourceType && targetType && isCanonicalDsrTransition(sourceType, targetType, edge.predicate))) {
      invalidTransitions.push(signature);
      addIssue(input.issues, "RECOMMENDED_PATH_INVALID_TRANSITION", "error", `Recommended path ${input.index + 1} uses an invalid primary-layer transition ${sourceType ?? "unknown"} -> ${targetType ?? "unknown"}.`, [source, target]);
    }
  }
  return { index: input.index, node_ids: [...input.nodeIds], relation_ids: sortedUnique(relationIds), missing_edges: missingEdges, invalid_transitions: invalidTransitions };
}

function validateWorkbenchProjection(input: {
  projection: NonNullable<Awaited<ReturnType<typeof getWorkbenchFlowGraph>>>;
  conceptById: Map<string, OkfConcept>; relationById: Map<string, OkfRelation>;
  graphEdgeIds: Set<string>; recommendedPaths: string[][];
  recommendedPathResults: RecommendedPathValidation[]; issues: FlowValidationIssue[];
}) {
  for (const [view, graph] of Object.entries({ recommended: input.projection.recommended, focused: input.projection.focused, full: input.projection.full })) {
    for (const node of graph.nodes) if (!input.conceptById.has(node.element_id)) addIssue(input.issues, "WORKBENCH_NODE_INVENTED", "error", `Workbench ${view} view includes unknown node ${node.element_id}.`, [node.element_id]);
    for (const edge of graph.relations) {
      const relation = input.relationById.get(edge.relation_id);
      if (!relation || relation.relation_scope === "query_generated") addIssue(input.issues, "WORKBENCH_EDGE_INVENTED", "error", `Workbench ${view} view includes non-stored edge ${edge.relation_id}.`, [edge.relation_id]);
    }
  }
  if (input.recommendedPaths.length && input.projection.stored_flow_source === "graph_json") {
    const expectedRelationIds = new Set(input.recommendedPathResults.flatMap((path) => path.relation_ids));
    const actualRelationIds = new Set(input.projection.recommended.relations.map((edge) => edge.relation_id));
    for (const edge of input.projection.recommended.relations) {
      if (!input.graphEdgeIds.has(edge.relation_id)) addIssue(input.issues, "WORKBENCH_RECOMMENDED_EDGE_NOT_IN_GRAPH", "error", `Workbench recommended edge ${edge.relation_id} is absent from graph.json.`, [edge.relation_id]);
      if (!expectedRelationIds.has(edge.relation_id)) addIssue(input.issues, "WORKBENCH_RECOMMENDED_EDGE_OUTSIDE_PATH", "error", `Workbench recommended edge ${edge.relation_id} is not a consecutive edge in recommended_paths.`, [edge.relation_id]);
    }
    for (const relationId of expectedRelationIds) {
      if (!actualRelationIds.has(relationId)) addIssue(input.issues, "WORKBENCH_RECOMMENDED_EDGE_MISSING", "error", `Workbench omitted recommended-path edge ${relationId}.`, [relationId]);
    }
  }
  const focusedTypes = new Map(input.projection.focused.nodes.map((node) => [node.element_id, node.canonical_type]));
  for (const edge of input.projection.focused.relations) {
    const sourceType = focusedTypes.get(edge.source_node_id);
    const targetType = focusedTypes.get(edge.target_node_id);
    const isRpf = (sourceType === "Design Requirement" && targetType === "Design Principle") || (sourceType === "Design Principle" && targetType === "Design Feature");
    const relation = input.relationById.get(edge.relation_id);
    if (!isRpf || !sourceType || !targetType || !relation || !isCanonicalDsrTransition(sourceType, targetType, relation.predicate)) {
      addIssue(input.issues, "WORKBENCH_FOCUSED_EDGE_INVALID", "error", `Focused edge ${edge.relation_id} is outside the stored Requirement -> Principle -> Feature transition contract.`, [edge.relation_id]);
    }
  }
}

function findFocusedRpfChains(nodes: RawGraphNode[], edges: RawGraphEdge[], typeById: Map<string, CanonicalFlowType>, relationById: Map<string, OkfRelation>) {
  const graphNodeIds = new Set(nodes.map((node) => cleanString(node.id)).filter(Boolean));
  const storedEdges = edges.flatMap((edge) => {
    const id = cleanString(edge.id), source = cleanString(edge.source), target = cleanString(edge.target), predicate = cleanString(edge.predicate);
    const relation = relationById.get(id);
    if (!relation || !graphNodeIds.has(source) || !graphNodeIds.has(target)) return [];
    if (relation.source_concept_id !== source || relation.target_concept_id !== target || relation.predicate !== predicate || relation.relation_scope === "query_generated") return [];
    return [{ id, source, target, predicate }];
  });
  const left = storedEdges.filter((edge) => typeById.get(edge.source) === "Design Requirement" && typeById.get(edge.target) === "Design Principle" && isCanonicalDsrTransition("Design Requirement", "Design Principle", edge.predicate));
  const right = storedEdges.filter((edge) => typeById.get(edge.source) === "Design Principle" && typeById.get(edge.target) === "Design Feature" && isCanonicalDsrTransition("Design Principle", "Design Feature", edge.predicate));
  return left.flatMap((a) => right.filter((b) => b.source === a.target).map((b) => ({ requirement: a.source, principle: a.target, feature: b.target, relation_ids: [a.id, b.id] })))
    .sort((a, b) => `${a.requirement}|${a.principle}|${a.feature}`.localeCompare(`${b.requirement}|${b.principle}|${b.feature}`));
}
function compareLegacyFlow(input: { paperId: string; paperDir: string; paperConcepts: OkfConcept[]; paperRelations: OkfRelation[] }): LegacyFlowComparison {
  const legacyPaperId = legacyPaperIds[input.paperId];
  if (!legacyPaperId) return emptyLegacyComparison();
  const aliases = readExplicitAliases(path.join(input.paperDir, "aliases.yaml"), input.paperId);
  const relevantLegacyEdges = knowledgeEdges.filter((edge) => edge.paperIds?.includes(legacyPaperId));
  const legacyNodeIds = new Set(relevantLegacyEdges.flatMap((edge) => [edge.source, edge.target]));
  const legacyNodes = knowledgeNodes.filter((node) => legacyNodeIds.has(node.id) && legacyNodeTypeToCanonical[node.type])
    .sort((left, right) => left.id.localeCompare(right.id));
  const matchedNodes: LegacyNodeMatch[] = [];
  const unresolvedAliases: string[] = [];
  const ambiguousAliases: string[] = [];
  const mappedByLegacyId = new Map<string, string>();

  for (const legacyNode of legacyNodes) {
    const expectedType = legacyNodeTypeToCanonical[legacyNode.type];
    const exactMatches = input.paperConcepts.filter((concept) => canonicalTypeForConcept(concept) === expectedType
      && normalizeText(unscopedId(concept.concept_id)) === normalizeText(legacyNode.id));
    const aliasMatches = input.paperConcepts.filter((concept) => {
      if (canonicalTypeForConcept(concept) !== expectedType) return false;
      return (aliases.get(concept.concept_id) ?? []).some((term) => normalizeText(term) === normalizeText(legacyNode.id)
        || normalizeText(term) === normalizeText(legacyNode.label));
    });
    const matches = uniqueConcepts([...exactMatches, ...aliasMatches]);
    if (matches.length === 1) {
      const match = matches[0];
      const method = exactMatches.some((concept) => concept.concept_id === match.concept_id) ? "exact_id" as const : "explicit_alias" as const;
      matchedNodes.push({ legacy_id: legacyNode.id, okf_id: match.concept_id, method });
      mappedByLegacyId.set(legacyNode.id, match.concept_id);
    } else if (matches.length > 1) ambiguousAliases.push(legacyNode.id);
    else unresolvedAliases.push(legacyNode.id);
  }

  const canonicalTriples = new Set(input.paperRelations.map((relation) => relationTriple(relation.source_concept_id, relation.predicate, relation.target_concept_id)));
  const canonicalPairs = new Map<string, OkfRelation[]>();
  for (const relation of input.paperRelations) canonicalPairs.set(relationPair(relation.source_concept_id, relation.target_concept_id),
    [...(canonicalPairs.get(relationPair(relation.source_concept_id, relation.target_concept_id)) ?? []), relation]);
  const matchedEdges: string[] = [];
  const predicateMismatches: string[] = [];
  const missingOkfEdges: string[] = [];
  const legacyMappedTriples = new Set<string>();
  for (const edge of relevantLegacyEdges) {
    const source = mappedByLegacyId.get(edge.source), target = mappedByLegacyId.get(edge.target);
    if (!source || !target) continue;
    const triple = relationTriple(source, edge.type, target);
    const signature = `${edge.source} --${edge.type}--> ${edge.target}`;
    legacyMappedTriples.add(triple);
    if (canonicalTriples.has(triple)) matchedEdges.push(signature);
    else if (canonicalPairs.has(relationPair(source, target))) {
      const predicates = (canonicalPairs.get(relationPair(source, target)) ?? []).map((relation) => relation.predicate).sort().join("|");
      predicateMismatches.push(`${signature} (OKF: ${predicates})`);
    } else missingOkfEdges.push(signature);
  }
  const mappedCanonicalIds = new Set(mappedByLegacyId.values());
  const extraOkfEdges = input.paperRelations.filter((relation) => mappedCanonicalIds.has(relation.source_concept_id) && mappedCanonicalIds.has(relation.target_concept_id))
    .filter((relation) => !legacyMappedTriples.has(relationTriple(relation.source_concept_id, relation.predicate, relation.target_concept_id)))
    .map((relation) => `${relation.source_concept_id} --${relation.predicate}--> ${relation.target_concept_id}`).sort();
  return {
    source: "data/knowledge-base.ts", legacy_paper_id: legacyPaperId,
    matched_nodes: matchedNodes.sort((a, b) => a.legacy_id.localeCompare(b.legacy_id)),
    unresolved_aliases: unresolvedAliases.sort(), ambiguous_aliases: ambiguousAliases.sort(),
    matched_edges: matchedEdges.sort(), predicate_mismatches: predicateMismatches.sort(),
    missing_okf_edges: missingOkfEdges.sort(), extra_okf_edges: extraOkfEdges
  };
}

function readExplicitAliases(file: string, paperId: string) {
  const aliases = new Map<string, string[]>();
  if (!fs.existsSync(file)) return aliases;
  const raw = fs.readFileSync(file, "utf8");
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const entry of recordArray(parsed.aliases)) {
      const targetId = cleanString(entry.target_id) || cleanString(entry.concept_id);
      if (!targetId) continue;
      const scopedTarget = scopeAliasTarget(paperId, targetId);
      const terms = Array.isArray(entry.terms)
        ? entry.terms.filter((term): term is string => typeof term === "string" && Boolean(term.trim()))
        : [];
      aliases.set(scopedTarget, sortedUnique([...(aliases.get(scopedTarget) ?? []), ...terms]));
    }
    return aliases;
  } catch {
    // Canonical aliases are JSON-compatible; retain YAML parsing for deterministic legacy bundles.
  }
  const conceptIdPattern = /^\s*-\s+(?:concept_id|target_id):\s*(.+?)\s*$/;
  const mappingPattern = /^\s{2}(.+):\s*$/;
  const termPattern = /^\s*-\s+(.+?)\s*$/;
  let currentId: string | undefined;
  for (const line of raw.split(/\r?\n/)) {
    if (/^query_expansion:\s*$/.test(line)) break;
    const conceptMatch = line.match(conceptIdPattern);
    if (conceptMatch) {
      currentId = scopeAliasTarget(paperId, unquote(conceptMatch[1]));
      if (!aliases.has(currentId)) aliases.set(currentId, []);
      continue;
    }
    const mappingMatch = line.match(mappingPattern);
    if (mappingMatch && !["aliases", "paper"].includes(mappingMatch[1])) {
      currentId = scopeAliasTarget(paperId, unquote(mappingMatch[1]));
      if (!aliases.has(currentId)) aliases.set(currentId, []);
      continue;
    }
    const termMatch = line.match(termPattern);
    if (termMatch && currentId && !/^(?:concept_id|target_id):/.test(termMatch[1])) aliases.set(currentId, [...(aliases.get(currentId) ?? []), unquote(termMatch[1])]);
  }
  return aliases;
}

function readGraph(file: string, issues: FlowValidationIssue[]): RawGraph | undefined {
  if (!fs.existsSync(file)) { addIssue(issues, "GRAPH_FILE_MISSING", "error", `Missing graph.json at ${normalizePath(file)}.`); return undefined; }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("root must be an object");
    return parsed as RawGraph;
  } catch (error) {
    addIssue(issues, "GRAPH_JSON_INVALID", "error", `Could not parse graph.json: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

function resolvePaperDirectory(sourceFile: string, okfRoot: string, slug: string) {
  const sourceDir = sourceFile ? path.dirname(sourceFile) : "";
  return sourceDir && fs.existsSync(sourceDir) ? sourceDir : path.join(okfRoot, "papers", slug);
}
function canonicalTypeForConcept(concept: OkfConcept): CanonicalFlowType | undefined {
  const value = String(concept.type);
  return canonicalTypeSet.has(value) ? value as CanonicalFlowType : undefined;
}
function relationPair(source: string, target: string) { return `${source}\u0000${target}`; }
function relationTriple(source: string, predicate: string, target: string) { return `${source}\u0000${predicate}\u0000${target}`; }
function addIssue(issues: FlowValidationIssue[], code: string, severity: FlowValidationSeverity, message: string, ids: string[] = []) {
  issues.push({ code, severity, message, ids: sortedUnique(ids.filter(Boolean)) });
}
function compareIssues(left: FlowValidationIssue, right: FlowValidationIssue) {
  if (left.severity !== right.severity) return left.severity === "error" ? -1 : 1;
  return left.code.localeCompare(right.code) || left.message.localeCompare(right.message);
}
function nestedStringArrays(value: unknown): string[][] {
  if (!Array.isArray(value)) return [];
  return value.filter(Array.isArray).map((candidate) => candidate.filter((item): item is string => typeof item === "string" && Boolean(item.trim())));
}
function recordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}
function cleanString(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function isFullyScopedId(id: string, paperId: string) { return id.startsWith(`${paperId}:`) && id.length > paperId.length + 1; }
function normalizeText(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function unscopedId(value: string) { return value.includes(":") ? value.split(":").slice(1).join(":") : value; }
function scopeAliasTarget(paperId: string, value: string) { return value.includes(":") ? value : `${paperId}:${value}`; }
function unquote(value: string) { return value.trim().replace(/^['"]|['"]$/g, ""); }
function uniqueConcepts(concepts: OkfConcept[]) { return [...new Map(concepts.map((concept) => [concept.concept_id, concept])).values()]; }
function duplicates(values: string[]) {
  const seen = new Set<string>(), duplicate = new Set<string>();
  for (const value of values) { if (seen.has(value)) duplicate.add(value); seen.add(value); }
  return [...duplicate].sort();
}
function sortedUnique(values: string[]) { return [...new Set(values)].sort(); }
function normalizePath(value: string) { return value.replace(/\\/g, "/"); }
function emptyLegacyComparison(): LegacyFlowComparison {
  return { source: "none", matched_nodes: [], unresolved_aliases: [], ambiguous_aliases: [], matched_edges: [], predicate_mismatches: [], missing_okf_edges: [], extra_okf_edges: [] };
}
function appendList(lines: string[], label: string, values: string[]) {
  lines.push(`- ${label}: ${values.length}`);
  for (const value of values) lines.push(`  - \`${value}\``);
}