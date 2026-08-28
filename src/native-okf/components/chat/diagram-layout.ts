import {
  GENERATED_DIAGRAM_STAGES,
  type DiagramStage,
  type GeneratedDiagram,
  type GeneratedDiagramNode,
} from "../../shared/chat-types.ts";
import {
  layoutSemanticColumns,
  type SemanticBounds,
  type SemanticOrientation,
  type SemanticPoint,
} from "../semantic-column-layout.ts";
import ELK from "elkjs/lib/elk.bundled.js";
import type { ElkNode, ElkPoint } from "elkjs/lib/elk-api";

export const GENERATED_DIAGRAM_NODE_WIDTH = 224;
export const GENERATED_DIAGRAM_NODE_HEIGHT = 112;
export const GENERATED_DIAGRAM_OUTER_PADDING = 32;
export const GENERATED_DIAGRAM_EDGE_LABEL_HEIGHT = 22;

const NODE_SPACING = 48;
const COLUMN_SPACING = 132;
const EDGE_LABEL_MIN_WIDTH = 32;
const EDGE_LABEL_MAX_WIDTH = 132;
const EDGE_LABEL_CHARACTER_WIDTH = 6;
const EDGE_LABEL_HORIZONTAL_PADDING = 16;

export type DiagramOrientation = SemanticOrientation;
export type LayoutPoint = SemanticPoint;
export type LayoutBounds = SemanticBounds;
export type LayoutGeneratedDiagramNode = GeneratedDiagramNode;
export type LayoutGeneratedDiagram = Omit<GeneratedDiagram, "nodes"> & {
  nodes: LayoutGeneratedDiagramNode[];
};

export interface DiagramLayoutNode {
  id: string;
  position: LayoutPoint;
  width: number;
  height: number;
  node: LayoutGeneratedDiagramNode;
  sourcePosition: "right" | "bottom";
  targetPosition: "left" | "top";
}

export interface DiagramLayoutEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  points: LayoutPoint[];
  labelPosition: LayoutPoint;
  showLabel: boolean;
  provenance: GeneratedDiagram["edges"][number]["provenance"];
}

export interface DiagramStageLane {
  stage: DiagramStage;
  label: string;
  nodeIds: string[];
  bounds: LayoutBounds;
  headingPosition: LayoutPoint;
}

export interface GeneratedDiagramLayout {
  orientation: DiagramOrientation;
  nodes: DiagramLayoutNode[];
  edges: DiagramLayoutEdge[];
  bounds: LayoutBounds;
  lanes: DiagramStageLane[];
  warning?: string;
  usedFallback: boolean;
}

export interface DiagramLayoutOptions {
  orientation?: DiagramOrientation;
  edgeLabelsVisible?: boolean;
  layoutEngine?: typeof layoutSemanticColumns;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function generatedDiagramEdgeLabelBounds(
  label: string,
  center: LayoutPoint,
): LayoutBounds {
  const width = clamp(
    label.length * EDGE_LABEL_CHARACTER_WIDTH + EDGE_LABEL_HORIZONTAL_PADDING,
    EDGE_LABEL_MIN_WIDTH,
    EDGE_LABEL_MAX_WIDTH,
  );
  return {
    x: center.x - width / 2,
    y: center.y - GENERATED_DIAGRAM_EDGE_LABEL_HEIGHT / 2,
    width,
    height: GENERATED_DIAGRAM_EDGE_LABEL_HEIGHT,
  };
}

function formatStage(stage: DiagramStage): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

function routeMidpoint(points: readonly LayoutPoint[]): LayoutPoint {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0]!;
  const segments = points.slice(1).map((point, index) => {
    const previous = points[index]!;
    return {
      previous,
      point,
      length: Math.hypot(point.x - previous.x, point.y - previous.y),
    };
  });
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  let travelled = 0;
  for (const segment of segments) {
    if (travelled + segment.length >= total / 2) {
      const ratio = segment.length === 0
        ? 0
        : (total / 2 - travelled) / segment.length;
      return {
        x: segment.previous.x + (segment.point.x - segment.previous.x) * ratio,
        y: segment.previous.y + (segment.point.y - segment.previous.y) * ratio,
      };
    }
    travelled += segment.length;
  }
  return points[points.length - 1]!;
}

function shifted(
  point: Pick<ElkPoint, "x" | "y"> | { x?: number; y?: number } | undefined,
  x: number,
  y: number,
): LayoutPoint {
  return { x: (point?.x ?? 0) + x, y: (point?.y ?? 0) + y };
}

async function layoutWithElk(
  diagram: LayoutGeneratedDiagram,
  presentStages: readonly DiagramStage[],
  orientation: DiagramOrientation,
  edgeLabelsVisible: boolean,
): Promise<GeneratedDiagramLayout> {
  const stageIndex = new Map(presentStages.map((stage, index) => [stage, index]));
  const orderedNodes = [...diagram.nodes].sort((left, right) =>
    (stageIndex.get(left.stage) ?? 0) - (stageIndex.get(right.stage) ?? 0) ||
    left.order - right.order ||
    left.id.localeCompare(right.id, "en")
  );
  const graph: ElkNode = {
    id: "proposal",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": orientation === "horizontal" ? "RIGHT" : "DOWN",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.partitioning.activate": "true",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.layered.spacing.nodeNodeBetweenLayers": String(COLUMN_SPACING),
      "elk.spacing.nodeNode": String(NODE_SPACING),
      "elk.spacing.edgeNode": "28",
      "elk.layered.spacing.edgeNodeBetweenLayers": "28",
      "elk.layered.thoroughness": "20",
    },
    children: orderedNodes.map((node) => ({
      id: node.id,
      width: GENERATED_DIAGRAM_NODE_WIDTH,
      height: GENERATED_DIAGRAM_NODE_HEIGHT,
      layoutOptions: {
        "elk.partitioning.partition": String(stageIndex.get(node.stage) ?? 0),
      },
    })),
    edges: diagram.edges.map((edge, index) => ({
      id: `generated-edge-${index}-${edge.source}-${edge.target}`,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };
  const result = await new ELK().layout(graph);
  const xShift = GENERATED_DIAGRAM_OUTER_PADDING;
  const yShift = GENERATED_DIAGRAM_OUTER_PADDING + 42;
  const renderedById = new Map(diagram.nodes.map((node) => [node.id, node]));
  const nodes = (result.children ?? []).flatMap((node) => {
    const source = renderedById.get(node.id);
    if (!source) return [];
    return [{
      id: node.id,
      position: shifted(node, xShift, yShift),
      width: node.width ?? GENERATED_DIAGRAM_NODE_WIDTH,
      height: node.height ?? GENERATED_DIAGRAM_NODE_HEIGHT,
      node: source,
      sourcePosition: orientation === "horizontal" ? "right" as const : "bottom" as const,
      targetPosition: orientation === "horizontal" ? "left" as const : "top" as const,
    }];
  });
  const edgeById = new Map(
    diagram.edges.map((edge, index) => [
      `generated-edge-${index}-${edge.source}-${edge.target}`,
      edge,
    ]),
  );
  const edges = (result.edges ?? []).flatMap((edge) => {
    const source = edgeById.get(edge.id);
    const section = edge.sections?.[0];
    if (!source || !section) return [];
    const points = [
      shifted(section.startPoint, xShift, yShift),
      ...(section.bendPoints ?? []).map((point) => shifted(point, xShift, yShift)),
      shifted(section.endPoint, xShift, yShift),
    ];
    return [{
      id: edge.id,
      source: source.source,
      target: source.target,
      label: source.label,
      points,
      labelPosition: routeMidpoint(points),
      showLabel: edgeLabelsVisible && source.label.trim() !== "",
      provenance: source.provenance,
    }];
  });
  const lanes = presentStages.flatMap((stage) => {
    const laneNodes = nodes.filter((node) => node.node.stage === stage);
    if (laneNodes.length === 0) return [];
    const minX = Math.min(...laneNodes.map((node) => node.position.x));
    const minY = Math.min(...laneNodes.map((node) => node.position.y));
    const maxX = Math.max(...laneNodes.map((node) => node.position.x + node.width));
    const maxY = Math.max(...laneNodes.map((node) => node.position.y + node.height));
    return [{
      stage,
      label: formatStage(stage),
      nodeIds: laneNodes.map((node) => node.id),
      bounds: { x: minX, y: minY - 42, width: maxX - minX, height: maxY - minY + 42 },
      headingPosition: orientation === "horizontal"
        ? { x: (minX + maxX) / 2, y: GENERATED_DIAGRAM_OUTER_PADDING }
        : { x: GENERATED_DIAGRAM_OUTER_PADDING, y: minY - 32 },
    }];
  });
  const maxX = Math.max(...nodes.map((node) => node.position.x + node.width), 0);
  const maxY = Math.max(...nodes.map((node) => node.position.y + node.height), 0);
  return {
    orientation,
    nodes,
    edges,
    bounds: {
      x: 0,
      y: 0,
      width: maxX + GENERATED_DIAGRAM_OUTER_PADDING,
      height: maxY + GENERATED_DIAGRAM_OUTER_PADDING,
    },
    lanes,
    usedFallback: false,
  };
}

/**
 * Deterministic stage-column layout. Model output supplies semantic stage and
 * relative order only; all positions and direct edge segments are application-owned.
 */
export async function layoutGeneratedDiagram(
  diagram: LayoutGeneratedDiagram,
  options: DiagramLayoutOptions = {},
): Promise<GeneratedDiagramLayout> {
  const orientation = options.orientation ?? "horizontal";
  const edgeLabelsVisible = options.edgeLabelsVisible ?? true;
  const presentStages = GENERATED_DIAGRAM_STAGES.filter((stage) =>
    diagram.nodes.some((node) => node.stage === stage)
  );
  const runLayout = (engine: typeof layoutSemanticColumns) => engine<
    GeneratedDiagramNode,
    GeneratedDiagram["edges"][number]
  >(
    diagram.nodes.map((node) => ({
      id: node.id,
      columnKey: node.stage,
      label: node.label,
      order: node.order,
      value: node,
    })),
    diagram.edges.map((edge, index) => ({
      id: `generated-edge-${index}-${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      value: edge,
    })),
    presentStages.map((stage) => ({ key: stage, title: formatStage(stage) })),
    {
      orientation,
      nodeWidth: GENERATED_DIAGRAM_NODE_WIDTH,
      nodeHeight: GENERATED_DIAGRAM_NODE_HEIGHT,
      nodeGap: NODE_SPACING,
      columnGap: COLUMN_SPACING,
      outerPadding: GENERATED_DIAGRAM_OUTER_PADDING,
      headingSpace: 42,
    },
  );
  let semantic: ReturnType<typeof runLayout>;
  let warning: string | undefined;
  let usedFallback = false;
  if (!options.layoutEngine) {
    try {
      return await layoutWithElk(
        diagram,
        presentStages,
        orientation,
        edgeLabelsVisible,
      );
    } catch {
      warning =
        "The layered diagram layout failed; a deterministic column fallback is shown.";
      usedFallback = true;
    }
  }
  try {
    semantic = runLayout(options.layoutEngine ?? layoutSemanticColumns);
  } catch {
    semantic = runLayout(layoutSemanticColumns);
    warning ??=
      "The preferred semantic layout failed; a deterministic column fallback is shown.";
    usedFallback = true;
  }


  return {
    orientation,
    nodes: semantic.nodes.map((node) => ({
      id: node.id,
      position: node.position,
      width: node.width,
      height: node.height,
      node: node.value,
      sourcePosition: node.sourcePosition,
      targetPosition: node.targetPosition,
    })),
    edges: semantic.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      points: edge.points,
      labelPosition: edge.labelPosition,
      showLabel: edgeLabelsVisible && edge.label.trim() !== "",
      provenance: edge.value.provenance,
    })),
    bounds: semantic.bounds,
    lanes: semantic.columns.map((column) => ({
      stage: column.key as DiagramStage,
      label: column.title,
      nodeIds: column.nodeIds,
      bounds: column.bounds,
      headingPosition: column.headingPosition,
    })),
    ...(warning ? { warning } : {}),
    usedFallback,
  };
}
