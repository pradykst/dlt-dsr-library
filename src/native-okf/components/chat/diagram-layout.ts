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
  points: [LayoutPoint, LayoutPoint];
  labelPosition: LayoutPoint;
  showLabel: boolean;
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
  try {
    semantic = runLayout(options.layoutEngine ?? layoutSemanticColumns);
  } catch {
    semantic = runLayout(layoutSemanticColumns);
    warning =
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
