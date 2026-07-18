import "server-only";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const COMPONENT_ROOT = resolve(process.cwd(), "src/native-okf/components/chat");

async function componentSource(fileName: string): Promise<string> {
  return readFile(resolve(COMPONENT_ROOT, fileName), "utf8");
}

test("generated node details expose descriptions and grounded native paths", async () => {
  const [presentation, canvasNode] = await Promise.all([
    componentSource("GeneratedDiagramPresentation.tsx"),
    componentSource("GeneratedDiagramNode.tsx"),
  ]);

  assert.match(presentation, /\{node\.description\}/u);
  assert.match(presentation, /node\.sourcePaths\.map/u);
  assert.match(presentation, /conceptHref\(sourcePath\)/u);
  assert.match(presentation, /node\.group/u);
  assert.match(presentation, /node\.stage/u);
  assert.match(presentation, /node\.category/u);
  assert.match(presentation, /node\.synthesis/u);
  assert.match(presentation, /node\.sourcePaths\.length/u);

  assert.doesNotMatch(canvasNode, /diagramNode\.description/u);
  assert.doesNotMatch(canvasNode, /conceptHref/u);
  assert.match(canvasNode, /border-dashed/u);
  assert.match(canvasNode, /Stored/u);
});

test("detail drawer starts closed and canvas controls preserve layout state", async () => {
  const presentation = await componentSource("GeneratedDiagramPresentation.tsx");

  assert.match(
    presentation,
    /useState<string \| undefined>\(\)/u,
    "selection should start empty so the full-width canvas is unobstructed",
  );
  assert.match(presentation, /selectedNode \? \(/u);
  assert.match(presentation, /Close node details/u);
  assert.match(presentation, /Fit diagram/u);
  assert.match(presentation, /Horizontal/u);
  assert.match(presentation, /Vertical/u);
  assert.match(presentation, /Fullscreen/u);
  assert.match(presentation, /document\.fullscreenElement/u);
  assert.match(presentation, /calculateDiagramViewport\(/u);
  assert.match(presentation, /GENERATED_DIAGRAM_FIT_MIN_ZOOM/u);
  assert.match(presentation, /minZoom=\{GENERATED_DIAGRAM_FIT_MIN_ZOOM\}/u);
  assert.match(presentation, /maxZoom=\{MANUAL_MAX_ZOOM\}/u);
  assert.doesNotMatch(presentation, /fitView\(/u);
  assert.doesNotMatch(presentation, /<Controls\b/u);
  assert.doesNotMatch(presentation, /panOnDrag=\{false\}/u);
  assert.match(presentation, /\[diagram, orientation\]/u);
  assert.doesNotMatch(
    presentation,
    /\[diagram, orientation, selectedId/u,
    "node selection must not rerun ELK layout",
  );
});

test("fit actions measure the current canvas without interaction-driven refits", async () => {
  const presentation = await componentSource("GeneratedDiagramPresentation.tsx");

  assert.match(presentation, /canvasRef\.current\.getBoundingClientRect\(\)/u);
  assert.match(
    presentation,
    /\{ width: canvasBounds\.width, height: canvasBounds\.height \}/u,
  );
  assert.match(presentation, /setViewport\(/u);
  assert.equal(presentation.match(/setViewport\(/gu)?.length, 1);
  assert.match(presentation, /\[fitDiagram, flowReady, layout\]/u);
  assert.doesNotMatch(
    presentation,
    /\[fitDiagram, flowReady, layout, (?:selectedId|edgeLabelMode)/u,
  );
  assert.match(presentation, /onClose=\{\(\) => onSelect\(undefined\)\}/u);
  assert.match(presentation, /onEdgeLabelModeChange=\{setEdgeLabelMode\}/u);
  assert.match(presentation, /className="relative min-h-0 flex-1"/u);
  assert.match(presentation, /Zoom out/u);
  assert.match(presentation, /Zoom in/u);
});

test("fixed node geometry and label typography remain readable at bounded fit", async () => {
  const [layout, canvasNode] = await Promise.all([
    componentSource("diagram-layout.ts"),
    componentSource("GeneratedDiagramNode.tsx"),
  ]);

  assert.match(layout, /GENERATED_DIAGRAM_NODE_WIDTH = 224/u);
  assert.match(layout, /GENERATED_DIAGRAM_NODE_HEIGHT = 112/u);
  assert.match(canvasNode, /text-\[15px\]/u);
  assert.match(canvasNode, /line-clamp-3/u);
  assert.match(canvasNode, /height: GENERATED_DIAGRAM_NODE_HEIGHT/u);
});


test("relationship labels support decision-only, all, and globally hidden modes", async () => {
  const presentation = await componentSource("GeneratedDiagramPresentation.tsx");

  assert.match(presentation, /type EdgeLabelMode = "decision" \| "all" \| "none"/u);
  assert.match(presentation, /useState<EdgeLabelMode>\("decision"\)/u);
  assert.match(presentation, /<option value="decision">Decision labels<\/option>/u);
  assert.match(presentation, /<option value="all">All labels<\/option>/u);
  assert.match(presentation, /<option value="none">No labels<\/option>/u);
  assert.match(presentation, /\^\(\?:yes\|no\)\$/u);
  assert.match(presentation, /showLabel:/u);
});

test("custom edge renderer retains ELK points and draws a marked polyline", async () => {
  const edge = await componentSource("ElkFlowEdge.tsx");

  assert.match(edge, /points: XYPosition\[\]/u);
  assert.match(edge, /orthogonalPolylinePath\(data\.points\)/u);
  assert.match(edge, /BaseEdge/u);
  assert.match(edge, /markerEnd=\{markerEnd\}/u);
  assert.match(edge, /pointer-events-none/u);
  assert.doesNotMatch(edge, /bezier/iu);
  assert.doesNotMatch(edge, /Math\.random/u);
});

test("generated view delegates to the ELK presentation without Mermaid", async () => {
  const [view, presentation, edge, node, packageSource] = await Promise.all([
    componentSource("GeneratedDiagramView.tsx"),
    componentSource("GeneratedDiagramPresentation.tsx"),
    componentSource("ElkFlowEdge.tsx"),
    componentSource("GeneratedDiagramNode.tsx"),
    readFile(resolve(process.cwd(), "package.json"), "utf8"),
  ]);
  const packageJson = JSON.parse(packageSource) as {
    dependencies?: Record<string, string>;
  };
  const productionSource = [view, presentation, edge, node].join("\n").toLowerCase();

  assert.match(view, /GeneratedDiagramPresentation as GeneratedDiagramView/u);
  assert.equal(packageJson.dependencies?.elkjs, "^0.11.1");
  assert.equal(packageJson.dependencies?.mermaid, undefined);
  assert.doesNotMatch(productionSource, /\bmermaid\b/u);
  assert.doesNotMatch(productionSource, /\bdagre\b/u);
  assert.doesNotMatch(productionSource, /\bcytoscape\b/u);
  assert.doesNotMatch(productionSource, /\bgraphviz\b/u);
});

