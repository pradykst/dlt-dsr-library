import "server-only";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const COMPONENT_ROOT = resolve(process.cwd(), "src/native-okf/components");

async function componentSource(fileName: string): Promise<string> {
  return readFile(resolve(COMPONENT_ROOT, fileName), "utf8");
}

test("generated node details retain descriptions, grounding, and synthesis status", async () => {
  const [presentation, canvasNode] = await Promise.all([
    componentSource("chat/GeneratedDiagramPresentation.tsx"),
    componentSource("chat/GeneratedDiagramNode.tsx"),
  ]);

  assert.match(presentation, /\{node\.description\}/u);
  assert.match(presentation, /node\.sourcePaths\.map/u);
  assert.match(presentation, /conceptHref\(sourcePath\)/u);
  assert.match(presentation, /node\.group/u);
  assert.match(presentation, /node\.stage/u);
  assert.match(presentation, /node\.category/u);
  assert.match(presentation, /node\.synthesis/u);
  assert.doesNotMatch(canvasNode, /diagramNode\.description/u);
  assert.match(canvasNode, /border-dashed/u);
  assert.match(canvasNode, /Stored/u);
});

test("generated nodes suppress punctuation-only category and stage duplication", async () => {
  const canvasNode = await componentSource("chat/GeneratedDiagramNode.tsx");
  assert.match(canvasNode, /equivalentSemanticLabels\(diagramNode\.category, diagramNode\.stage\)/u);
  assert.doesNotMatch(canvasNode, /category\.toLowerCase\(\) !== diagramNode\.stage/u);
});

test("drawer starts closed and selection does not rerun semantic layout", async () => {
  const presentation = await componentSource(
    "chat/GeneratedDiagramPresentation.tsx",
  );
  assert.match(presentation, /useState<string \| undefined>\(\)/u);
  assert.match(presentation, /selectedNode \? \(/u);
  assert.match(presentation, /Close node details/u);
  assert.match(presentation, /Fit diagram/u);
  assert.match(presentation, /Horizontal/u);
  assert.match(presentation, /Vertical/u);
  assert.match(presentation, /Fullscreen/u);
  assert.match(presentation, /\[diagram, orientation\]/u);
  assert.doesNotMatch(
    presentation,
    /\[diagram, orientation, selectedId/u,
  );
  assert.match(presentation, /onClose=\{\(\) => onSelect\(undefined\)\}/u);
});

test("generated diagrams use dynamic columns and direct straight edges", async () => {
  const [presentation, layout, edge, edgeHelper, headings] = await Promise.all([
    componentSource("chat/GeneratedDiagramPresentation.tsx"),
    componentSource("chat/diagram-layout.ts"),
    componentSource("StraightFlowEdge.tsx"),
    componentSource("straight-edge.ts"),
    componentSource("SemanticColumnHeadings.tsx"),
  ]);

  assert.match(presentation, /StraightFlowEdge/u);
  assert.match(presentation, /type: "straight"/u);
  assert.match(presentation, /<SemanticColumnHeadings/u);
  assert.doesNotMatch(presentation, /ElkFlowEdge/u);
  assert.match(layout, /GENERATED_DIAGRAM_STAGES\.filter/u);
  assert.match(layout, /layoutSemanticColumns/u);
  assert.match(edgeHelper, /M \$\{start\.x\} \$\{start\.y\} L \$\{end\.x\} \$\{end\.y\}/u);
  assert.doesNotMatch(edgeHelper, /bezier|orthogonalPolylinePath/iu);
  assert.match(edge, /markerEnd=\{markerEnd\}/u);
  assert.match(headings, /pointer-events-none/u);
  assert.match(headings, /nearestGap - 4/u);
  assert.match(headings, /fittedFontSize/u);
  assert.match(headings, /text-ellipsis/u);
});

test("relationship labels remain optional and presentation-only", async () => {
  const presentation = await componentSource(
    "chat/GeneratedDiagramPresentation.tsx",
  );
  assert.match(
    presentation,
    /type EdgeLabelMode = "decision" \| "all" \| "none"/u,
  );
  assert.match(presentation, /useState<EdgeLabelMode>\("decision"\)/u);
  assert.match(presentation, /<option value="all">All labels<\/option>/u);
  assert.match(presentation, /<option value="none">No labels<\/option>/u);
  assert.match(presentation, /showLabel:/u);
});

test("paper map colors express type without relying on color alone", async () => {
  const [map, legend] = await Promise.all([
    componentSource("PaperDesignMap.tsx"),
    componentSource("GraphLegend.tsx"),
  ]);
  assert.match(map, /concept\.typeLabel/u);
  assert.match(map, /concept\.label/u);
  assert.match(map, /aria-label/u);
  assert.doesNotMatch(map, /\{concept\.typeLabel\}\s*<\/span>/u);
  assert.match(legend, /design-requirement/u);
  assert.match(legend, /design-principle/u);
  assert.match(legend, /design-feature/u);
});

test("native diagram production modules add no Mermaid or competing layout dependency", async () => {
  const [view, presentation, edge, node, packageSource] = await Promise.all([
    componentSource("chat/GeneratedDiagramView.tsx"),
    componentSource("chat/GeneratedDiagramPresentation.tsx"),
    componentSource("StraightFlowEdge.tsx"),
    componentSource("chat/GeneratedDiagramNode.tsx"),
    readFile(resolve(process.cwd(), "package.json"), "utf8"),
  ]);
  const packageJson = JSON.parse(packageSource) as {
    dependencies?: Record<string, string>;
  };
  const productionSource = [view, presentation, edge, node].join("\n");

  assert.match(view, /GeneratedDiagramPresentation as GeneratedDiagramView/u);
  assert.equal(packageJson.dependencies?.mermaid, undefined);
  assert.equal(packageJson.dependencies?.dagre, undefined);
  assert.equal(packageJson.dependencies?.cytoscape, undefined);
  assert.equal(packageJson.dependencies?.graphviz, undefined);
  assert.doesNotMatch(productionSource, /\bmermaid\b/iu);
  assert.doesNotMatch(productionSource, /Math\.random/u);
});

