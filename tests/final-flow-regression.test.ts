import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  getAvailableSourceViews,
  projectFullRelations,
  projectRecommendedFlow,
  projectSourceView,
  validateProjectedFlow,
  type CanonicalFlowBundle
} from "../lib/okf/flow-projection.ts";
import {
  allocateStableHandles,
  findDuplicateNodePositions,
  findNodeOverlaps,
  findRenderedEdgeNodeIntersections,
  findStraightEdgeNodeIntersections,
  flowEdgePathGeometry,
  layoutProjectedFlow,
  preservesProjectedLayerOrder,
  type FlowLayout,
  type FlowLayoutHandle,
  type FlowLayoutNode
} from "../lib/okf/flow-layout.ts";
import { parseOkfLibrary } from "../lib/okf/parser.ts";
import { loadStoredPaperFlowMetadata } from "../lib/okf/stored-flow.ts";
import { getWorkbenchPaper } from "../lib/okf/workbench-adapter.ts";
import type { OkfKnowledgeBase, OkfPaper } from "../lib/okf/schema.ts";
import type { WorkbenchFlowView } from "../lib/workbench/types.ts";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const knowledgeBase = parseOkfLibrary(path.join(repositoryRoot, "library", "okf"));

test("every production source view projects exactly its canonical graph data", async (context) => {
  const sourceViewPapers = knowledgeBase.papers.filter((paper) => paper.source_views?.length);
  assert.ok(sourceViewPapers.length > 0, "At least one production bundle must exercise Source Figure mode.");

  for (const paper of sourceViewPapers) {
    const bundle = canonicalBundle(paper, knowledgeBase);
    const availableViews = getAvailableSourceViews(bundle);
    assert.equal(
      availableViews.length,
      paper.source_views?.length,
      `${paper.slug} must not silently discard a canonical source view.`
    );

    for (const sourceView of availableViews) {
      await context.test(`${paper.slug}/${sourceView.source_view_id}`, async () => {
        const bundleBeforeProjection = structuredClone(bundle);
        const firstProjection = projectSourceView(bundle, sourceView.source_view_id);
        const secondProjection = projectSourceView(bundle, sourceView.source_view_id);
        const expectedNodeIds = sourceView.ordering.layer_order.flatMap(
          (layer) => sourceView.ordering.node_order[layer] ?? []
        );
        const projectedNodeIds = firstProjection.nodes.map((node) => node.id);
        const projectedEdgeIds = firstProjection.edges.map((edge) => edge.id);
        const projectedNodeIdSet = new Set(projectedNodeIds);

        assert.deepEqual(bundle, bundleBeforeProjection, "Projection must not mutate canonical bundle data.");
        assert.deepEqual(firstProjection, secondProjection, "Projection must be deterministic.");
        assert.deepEqual(firstProjection.ordered_node_ids, expectedNodeIds);
        assert.deepEqual(projectedNodeIds, expectedNodeIds);
        assert.deepEqual(projectedEdgeIds, sourceView.edge_ids);
        assert.equal(new Set(projectedNodeIds).size, expectedNodeIds.length, "No extra or duplicate node may be projected.");
        assert.equal(new Set(projectedEdgeIds).size, sourceView.edge_ids.length, "No extra or duplicate edge may be projected.");
        assert.deepEqual(firstProjection.layers, sourceView.ordering.layer_order);
        assert.equal(firstProjection.title, sourceView.title);
        assert.deepEqual(firstProjection.source_reference, sourceView.source_reference);
        assert.equal(firstProjection.projection_source, "source_view");
        assert.ok(firstProjection.edges.every((edge) => edge.provenance === "source_view_explicit"));
        assert.ok(firstProjection.edges.every((edge) => edge.relation_scope !== "query_generated"));
        assert.ok(firstProjection.edges.every((edge) => edge.extraction_type !== "inferred"));
        assert.ok(firstProjection.edges.every((edge) => projectedNodeIdSet.has(edge.source) && projectedNodeIdSet.has(edge.target)));
        assert.deepEqual(validateProjectedFlow(firstProjection), []);

        const layoutInput = {
          nodes: firstProjection.nodes,
          edges: firstProjection.edges,
          layers: firstProjection.layers,
          node_order: firstProjection.node_order,
          layout_hints: firstProjection.layout_hints
        };
        const firstLayout = await layoutProjectedFlow(layoutInput);
        const secondLayout = await layoutProjectedFlow(layoutInput);
        assert.deepEqual(firstLayout, secondLayout, "Layered layout must be deterministic.");
        assert.deepEqual(findNodeOverlaps(firstLayout.nodes), []);
        assert.deepEqual(findDuplicateNodePositions(firstLayout.nodes), []);
        assert.deepEqual(findStraightEdgeNodeIntersections(firstLayout), []);
        assert.deepEqual(findRenderedEdgeNodeIntersections(firstLayout), []);
        assert.equal(preservesProjectedLayerOrder(layoutInput, firstLayout), true);
        assert.ok(firstLayout.edges.every((edge) => edge.source_handle && edge.target_handle));
        assert.ok(firstLayout.edges.every((edge) => edge.path_kind === "straight" || edge.path_kind === "minimal_bezier"));
      });
    }
  }
});

test("papers without source views expose only stored recommended and full projections", async (context) => {
  const papersWithoutSourceViews = knowledgeBase.papers.filter((paper) => !paper.source_views?.length);
  assert.ok(papersWithoutSourceViews.length > 0, "The production inventory must exercise the no-source-view state.");

  for (const paper of papersWithoutSourceViews) {
    await context.test(paper.slug, async () => {
      const bundle = canonicalBundle(paper, knowledgeBase);
      assert.deepEqual(getAvailableSourceViews(bundle), []);

      const recommended = projectRecommendedFlow(bundle);
      const full = projectFullRelations(bundle);
      const canonicalRelationIds = new Set(bundle.relations
        .filter((relation) => relation.relation_scope !== "query_generated")
        .map((relation) => relation.relation_id));
      assert.equal(recommended.title, "Recommended Flow");
      assert.equal(recommended.subtitle, "Recommended stored pathway");
      assert.equal(recommended.source_view_id, null);
      assert.equal(recommended.source_reference, null, "Recommended Flow must not claim source-figure parity.");
      assert.ok(recommended.edges.every((edge) => canonicalRelationIds.has(edge.id)));
      assert.ok(recommended.edges.every((edge) => edge.provenance !== "query_generated"));
      assert.equal(full.title, "Full Relations / Advanced");
      assert.equal(full.subtitle, "Canonical OKF relations");
      assert.deepEqual(new Set(full.edges.map((edge) => edge.id)), canonicalRelationIds);
      assert.ok(full.edges.every((edge) => edge.provenance !== "query_generated"));

      const workbench = await getWorkbenchPaper(paper.paper_id, { knowledgeBase });
      assert.ok(workbench);
      const flowGraph = workbench.flowGraph;
      assert.ok(flowGraph);
      assert.deepEqual(flowGraph.source_views, []);
      assert.equal(flowGraph.recommended.subtitle, "Recommended stored pathway");
      assert.equal(flowGraph.full.subtitle, "Canonical OKF relations");
    });
  }
});

test("all nine production papers have explicit curation outcomes and stored recommended/full flow coverage", () => {
  assert.equal(knowledgeBase.papers.length, 9);
  const audit = readRepositoryFile("docs/OKF_SOURCE_VIEW_AUDIT.md");

  for (const paper of knowledgeBase.papers) {
    const metadata = loadStoredPaperFlowMetadata(paper.paper_id);
    assert.ok(metadata?.recommendedPaths.length, paper.slug + " must define at least one stored recommended path.");

    const bundle = canonicalBundle(paper, knowledgeBase);
    const full = projectFullRelations(bundle);
    assert.ok(full.edges.length > 0, paper.slug + " must expose Full Relations.");

    const outcomeA = "### " + paper.slug + " - Outcome A";
    const outcomeB = "### " + paper.slug + " - Outcome B";
    assert.ok(audit.includes(outcomeA) || audit.includes(outcomeB), paper.slug + " is omitted from the explicit source-view audit outcomes.");
    assert.equal(audit.includes(outcomeA), Boolean(paper.source_views?.length), paper.slug + " audit outcome must match canonical source_views availability.");
  }
});

test("Workbench exposes every structurally valid production source view without changing its inventory", async () => {
  for (const paper of knowledgeBase.papers) {
    const workbench = await getWorkbenchPaper(paper.paper_id, { knowledgeBase });
    assert.ok(workbench);
    const flowGraph = workbench.flowGraph;
    assert.ok(flowGraph);
    const canonicalViews = getAvailableSourceViews(canonicalBundle(paper, knowledgeBase));
    assert.deepEqual(
      flowGraph.source_views.map((view) => view.source_view_id),
      canonicalViews.map((view) => view.source_view_id)
    );
    for (const canonicalView of canonicalViews) {
      const adaptedView: WorkbenchFlowView | undefined = flowGraph.source_views.find(
        (view: WorkbenchFlowView) => view.source_view_id === canonicalView.source_view_id
      );
      assert.ok(adaptedView);
      assert.deepEqual(adaptedView.ordered_node_ids, canonicalView.ordering.layer_order.flatMap(
        (layer) => canonicalView.ordering.node_order[layer] ?? []
      ));
      assert.deepEqual(adaptedView.relations.map((edge: WorkbenchFlowView["relations"][number]) => edge.relation_id), canonicalView.edge_ids);
    }
  }
});

test("Workbench flow renderer uses direct border-to-border edges and a full-width canvas", () => {
  const source = readRepositoryFile("components/workbench/WorkbenchFlow.tsx");
  const geometrySource = readRepositoryFile("lib/okf/flow-layout.ts");

  assert.match(source, /flowEdgePathGeometry/);
  assert.match(source, /controlPoints:\s*positioned\.control_points/);
  assert.match(source, /curveSegments:\s*positioned\.curve_segments/);
  assert.doesNotMatch(`${source}\n${geometrySource}`, /SmoothStepEdge|getSmoothStepPath|smoothstep/i);
  assert.doesNotMatch(`${source}\n${geometrySource}`, /orthogonal|manhattan|staircase|elbow router/i);
  assert.match(source, /MarkerType\.ArrowClosed/);
  assert.match(source, /sourceHandle:\s*positioned\.source_handle/);
  assert.match(source, /targetHandle:\s*positioned\.target_handle/);
  assert.match(source, /<Handle[\s\S]*?position=\{reactFlowPosition\(handle\.position\)\}/);
  assert.match(source, /Position\.Right/);
  assert.match(source, /Position\.Left/);
  assert.match(source, /data-flow-full-width="true"/);
  assert.match(source, /data-flow-canvas="full-width"/);
  assert.match(source, /min-h-\[720px\]/);
  assert.match(source, /requestFullscreen\(\)/);
  assert.match(source, />Fullscreen</);
  assert.match(source, /<Controls\b/);
  assert.match(source, /fitView/);
  assert.match(source, /\{selection\s*&&\s*\(\s*<div[\s\S]*?<FlowPanel/);
  assert.match(source, /sourceViews\.length\s*>\s*0\s*&&[\s\S]*?>Source Figure</);
});

test("synthetic geometry keeps clear edges direct and curves only around unrelated nodes", () => {
  const source = syntheticNode("synthetic-source", 0, 100, 0);
  const target = syntheticNode("synthetic-target", 500, 100, 2);
  const distant = syntheticNode("synthetic-distant", 250, 420, 1);
  const clear = syntheticLayout([source, distant, target], [{ id: "synthetic-clear", source: source.id, target: target.id }]);
  assert.equal(clear.edges[0].path_kind, "straight");
  assert.equal(clear.edges[0].control_points, null);
  assert.equal(clear.edges[0].curve_segments, null);
  assert.deepEqual(findRenderedEdgeNodeIntersections(clear), []);

  const blocker = syntheticNode("synthetic-blocker", 250, 100, 1);
  const blocked = syntheticLayout([source, blocker, target], [{ id: "synthetic-blocked", source: source.id, target: target.id }]);
  assert.equal(blocked.edges[0].path_kind, "minimal_bezier");
  assert.ok(blocked.edges[0].control_points || blocked.edges[0].curve_segments?.length);
  assert.deepEqual(findRenderedEdgeNodeIntersections(blocked), []);
  const blockedPath = syntheticRenderedPath(blocked, blocked.edges[0].id);
  assert.match(blockedPath, /\bC\b/);
  assert.doesNotMatch(blockedPath, /\bL\b/);

  const parallel = syntheticLayout([source, blocker, target], [
    { id: "synthetic-parallel-a", source: source.id, target: target.id },
    { id: "synthetic-parallel-b", source: source.id, target: target.id }
  ]);
  const parallelPaths = parallel.edges.map((edge) => syntheticRenderedPath(parallel, edge.id));
  assert.ok(parallel.edges.every((edge) => edge.path_kind === "minimal_bezier"));
  assert.ok(parallelPaths.every((pathValue) => /\bC\b/.test(pathValue) && !/\bL\b/.test(pathValue)));
  assert.equal(new Set(parallelPaths).size, parallelPaths.length, "Parallel edges must receive isolated curves, not a shared trunk.");
  assert.deepEqual(findRenderedEdgeNodeIntersections(parallel), []);

  const verticalSource = syntheticNode("synthetic-vertical-source", 100, 0, 0);
  const verticalBlocker = syntheticNode("synthetic-vertical-blocker", 100, 250, 1);
  const verticalTarget = syntheticNode("synthetic-vertical-target", 100, 500, 2);
  const vertical = syntheticLayout(
    [verticalSource, verticalBlocker, verticalTarget],
    [{ id: "synthetic-vertical", source: verticalSource.id, target: verticalTarget.id }],
    "bottom",
    "top"
  );
  assert.equal(vertical.edges[0].path_kind, "minimal_bezier");
  assert.deepEqual(findRenderedEdgeNodeIntersections(vertical), []);
  assert.doesNotMatch(syntheticRenderedPath(vertical, vertical.edges[0].id), /\bL\b/);
});
test("Workbench and chatbot import the shared canonical flow projector", () => {
  const workbenchAdapter = readRepositoryFile("lib/okf/workbench-adapter.ts");
  const chatbot = readRepositoryFile("lib/okf/chat.ts");
  assert.match(workbenchAdapter, /from\s+["']\.\/flow-projection\.ts["']/);
  assert.match(chatbot, /from\s+["']\.\/flow-projection\.ts["']/);
});

test("production OKF runtime contains no current paper identity hardcoding", () => {
  const runtimeFiles = ["app", "components", "lib"]
    .flatMap((root) => listRuntimeSourceFiles(path.join(repositoryRoot, root)))
    .filter((file) => !isAllowedNonRuntimeInventory(file));
  const identities = [
    ...knowledgeBase.papers.flatMap((paper) => [
      { kind: "paper ID", value: paper.paper_id },
      { kind: "paper title", value: paper.title },
      ...(paper.authors ?? []).map((author) => ({ kind: "author name", value: author }))
    ]),
    ...knowledgeBase.concepts
      .filter((concept) => concept.title.trim().length >= 24)
      .map((concept) => ({ kind: "canonical node title", value: concept.title }))
  ].filter((identity, index, values) => identity.value.trim().length > 0
    && values.findIndex((candidate) => normalizeForIdentityScan(candidate.value) === normalizeForIdentityScan(identity.value)) === index);
  const violations: string[] = [];

  for (const file of runtimeFiles) {
    const source = fs.readFileSync(file, "utf8");
    const normalizedSource = normalizeForIdentityScan(source);
    for (const identity of identities) {
      if (normalizedSource.includes(normalizeForIdentityScan(identity.value))) {
        violations.push(`${relativePath(file)} contains current ${identity.kind}: ${identity.value}`);
      }
    }
    if (/\b(?:Figure|Table)\s+\d+\b/i.test(source)) {
      violations.push(`${relativePath(file)} contains a paper-specific figure/table number.`);
    }
    if (/(?:normalizedQuery|userQuery|query)\s*(?:===|==)\s*["'`][^"'`\r\n]{20,}["'`]/i.test(source)
      || /(?:normalizedQuery|userQuery|query)\.includes\(\s*["'`][^"'`\r\n]{24,}["'`]\s*\)/i.test(source)) {
      violations.push(`${relativePath(file)} contains a long exact-query runtime branch.`);
    }
  }

  assert.deepEqual(violations, [], violations.join("\n"));
});

function syntheticNode(id: string, x: number, y: number, layerIndex: number): FlowLayoutNode {
  return { id, x, y, width: 140, height: 100, layer_index: layerIndex, order_index: 0 };
}

function syntheticLayout(
  nodes: FlowLayoutNode[],
  edges: Array<{ id: string; source: string; target: string }>,
  sourcePosition: FlowLayoutHandle["position"] = "right",
  targetPosition: FlowLayoutHandle["position"] = "left"
): FlowLayout {
  const allocated = allocateStableHandles(nodes, edges, sourcePosition, targetPosition);
  return {
    nodes,
    edges: allocated.edges,
    handles_by_node: allocated.handlesByNode,
    width: Math.max(...nodes.map((node) => node.x + node.width)) + 100,
    height: Math.max(...nodes.map((node) => node.y + node.height)) + 100
  };
}

function syntheticRenderedPath(layout: FlowLayout, edgeId: string) {
  const edge = layout.edges.find((candidate) => candidate.id === edgeId);
  assert.ok(edge);
  const source = layout.nodes.find((node) => node.id === edge.source);
  const target = layout.nodes.find((node) => node.id === edge.target);
  const sourceHandle = layout.handles_by_node[edge.source]?.find((handle) => handle.id === edge.source_handle);
  const targetHandle = layout.handles_by_node[edge.target]?.find((handle) => handle.id === edge.target_handle);
  assert.ok(source && target && sourceHandle && targetHandle);
  return flowEdgePathGeometry(edge, syntheticHandlePoint(source, sourceHandle), syntheticHandlePoint(target, targetHandle)).path;
}

function syntheticHandlePoint(node: FlowLayoutNode, handle: FlowLayoutHandle) {
  const offsetX = node.x + node.width * handle.offset_percent / 100;
  const offsetY = node.y + node.height * handle.offset_percent / 100;
  if (handle.position === "left") return { x: node.x, y: offsetY };
  if (handle.position === "right") return { x: node.x + node.width, y: offsetY };
  if (handle.position === "top") return { x: offsetX, y: node.y };
  return { x: offsetX, y: node.y + node.height };
}
function canonicalBundle(paper: OkfPaper, kb: OkfKnowledgeBase): CanonicalFlowBundle {
  const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
  const conceptIds = new Set(concepts.map((concept) => concept.concept_id));
  const metadata = loadStoredPaperFlowMetadata(paper.paper_id);
  return {
    paper_id: paper.paper_id,
    concepts,
    relations: kb.relations.filter((relation) => (
      conceptIds.has(relation.source_concept_id) && conceptIds.has(relation.target_concept_id)
    )),
    recommended_paths: metadata?.recommendedPaths ?? [],
    source_views: paper.source_views ?? [],
    graph_source_reference: paper.graph_source_reference ?? null
  };
}

function readRepositoryFile(relativeFile: string) {
  return fs.readFileSync(path.join(repositoryRoot, relativeFile), "utf8");
}

function listRuntimeSourceFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return listRuntimeSourceFiles(target);
    return /\.(?:c|m)?(?:js|ts)x?$/.test(entry.name) ? [target] : [];
  });
}

function isAllowedNonRuntimeInventory(file: string) {
  const relative = relativePath(file);
  return /(?:^|\/)(?:data|docs?|fixtures?|tests?)(?:\/|$)/i.test(relative)
    || /(?:audit|migration|migrate|validator|validation)[^/]*\.(?:c|m)?(?:js|ts)x?$/i.test(relative);
}

function normalizeForIdentityScan(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en");
}

function relativePath(file: string) {
  return path.relative(repositoryRoot, file).replaceAll(path.sep, "/");
}
