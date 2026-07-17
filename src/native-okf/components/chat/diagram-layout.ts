import ELK from "elkjs/lib/elk.bundled.js";
import type { ElkExtendedEdge, ElkNode, ElkPoint } from "elkjs/lib/elk-api";

import {
  GENERATED_DIAGRAM_STAGES,
  type DiagramStage,
  type GeneratedDiagram,
  type GeneratedDiagramNode,
} from "../../shared/chat-types.ts";

export const GENERATED_DIAGRAM_NODE_WIDTH = 224;
export const GENERATED_DIAGRAM_NODE_HEIGHT = 112;
export const GENERATED_DIAGRAM_OUTER_PADDING = 32;

const NODE_SPACING = 56;
const LAYER_SPACING = 104;
const EDGE_NODE_SPACING = 28;
const EDGE_EDGE_SPACING = 18;
const EDGE_LABEL_MIN_WIDTH = 32;
const EDGE_LABEL_MAX_WIDTH = 132;
const EDGE_LABEL_CHARACTER_WIDTH = 6;
const EDGE_LABEL_HORIZONTAL_PADDING = 16;
export const GENERATED_DIAGRAM_EDGE_LABEL_HEIGHT = 22;
const EDGE_LABEL_NODE_CLEARANCE = 8;
const EDGE_LABEL_ROUTE_CLEARANCE = 4;
const EDGE_LABEL_SEPARATION = 6;
const ORTHOGONAL_TOLERANCE = 0.001;

export type DiagramOrientation = "horizontal" | "vertical";

export interface LayoutPoint {
  x: number;
  y: number;
}

export interface LayoutBounds extends LayoutPoint {
  width: number;
  height: number;
}

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
}

export interface DiagramStageLane {
  stage: DiagramStage;
  label: string;
  nodeIds: string[];
  bounds: LayoutBounds;
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

export interface DiagramLayoutEngine {
  layout(graph: ElkNode): Promise<ElkNode>;
}

export interface DiagramLayoutOptions {
  orientation?: DiagramOrientation;
  edgeLabelsVisible?: boolean;
  /** Test seam for verifying that ELK failures degrade to a stable layout. */
  layoutEngine?: DiagramLayoutEngine;
}

interface OrderedEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

interface RawLayoutNode {
  id: string;
  x: number;
  y: number;
  node: LayoutGeneratedDiagramNode;
}

interface RawLayoutEdge extends OrderedEdge {
  points: LayoutPoint[];
}

const STAGE_RANK = new Map<DiagramStage, number>(
  GENERATED_DIAGRAM_STAGES.map((stage, index) => [stage, index]),
);

let defaultLayoutEngine: DiagramLayoutEngine | undefined;

function getDefaultLayoutEngine(): DiagramLayoutEngine {
  defaultLayoutEngine ??= new ELK() as unknown as DiagramLayoutEngine;
  return defaultLayoutEngine;
}

function stageRank(stage: DiagramStage): number {
  return STAGE_RANK.get(stage) ?? GENERATED_DIAGRAM_STAGES.length;
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, "en", { sensitivity: "base" });
}

function orderNodes(
  nodes: readonly LayoutGeneratedDiagramNode[],
): LayoutGeneratedDiagramNode[] {
  return [...nodes].sort(
    (left, right) =>
      stageRank(left.stage) - stageRank(right.stage) ||
      left.order - right.order ||
      compareText(left.label, right.label) ||
      compareText(left.id, right.id),
  );
}

function orderEdges(
  diagram: LayoutGeneratedDiagram,
  orderedNodes: readonly LayoutGeneratedDiagramNode[],
): OrderedEdge[] {
  const nodeIndex = new Map(orderedNodes.map((node, index) => [node.id, index]));

  return diagram.edges
    .map((edge) => ({ ...edge }))
    .sort(
      (left, right) =>
        (nodeIndex.get(left.source) ?? Number.MAX_SAFE_INTEGER) -
          (nodeIndex.get(right.source) ?? Number.MAX_SAFE_INTEGER) ||
        (nodeIndex.get(left.target) ?? Number.MAX_SAFE_INTEGER) -
          (nodeIndex.get(right.target) ?? Number.MAX_SAFE_INTEGER) ||
        compareText(left.label, right.label) ||
        compareText(left.source, right.source) ||
        compareText(left.target, right.target),
    )
    .map((edge, index) => ({
      ...edge,
      id: `generated-edge-${index}-${edge.source}-${edge.target}`,
    }));
}

function elkLayoutOptions(orientation: DiagramOrientation): Record<string, string> {
  return {
    "org.eclipse.elk.algorithm": "layered",
    "org.eclipse.elk.direction": orientation === "horizontal" ? "RIGHT" : "DOWN",
    "org.eclipse.elk.edgeRouting": "ORTHOGONAL",
    "org.eclipse.elk.padding": `[top=${GENERATED_DIAGRAM_OUTER_PADDING},left=${GENERATED_DIAGRAM_OUTER_PADDING},bottom=${GENERATED_DIAGRAM_OUTER_PADDING},right=${GENERATED_DIAGRAM_OUTER_PADDING}]`,
    "org.eclipse.elk.randomSeed": "1",
    "org.eclipse.elk.separateConnectedComponents": "false",
    "org.eclipse.elk.spacing.nodeNode": String(NODE_SPACING),
    "org.eclipse.elk.spacing.edgeNode": String(EDGE_NODE_SPACING),
    "org.eclipse.elk.spacing.edgeEdge": String(EDGE_EDGE_SPACING),
    "org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers": String(LAYER_SPACING),
    "org.eclipse.elk.layered.spacing.edgeNodeBetweenLayers": "40",
    "org.eclipse.elk.layered.spacing.edgeEdgeBetweenLayers": "24",
    "org.eclipse.elk.layered.layering.strategy": "NETWORK_SIMPLEX",
    "org.eclipse.elk.layered.cycleBreaking.strategy": "GREEDY_MODEL_ORDER",
    "org.eclipse.elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
    "org.eclipse.elk.layered.crossingMinimization.forceNodeModelOrder": "false",
    "org.eclipse.elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
    "org.eclipse.elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
    "org.eclipse.elk.layered.nodePlacement.favorStraightEdges": "true",
    "org.eclipse.elk.layered.thoroughness": "30",
  };
}

function createElkGraph(
  orderedNodes: readonly LayoutGeneratedDiagramNode[],
  orderedEdges: readonly OrderedEdge[],
  orientation: DiagramOrientation,
): ElkNode {
  return {
    id: "generated-diagram-root",
    layoutOptions: elkLayoutOptions(orientation),
    children: orderedNodes.map((node) => ({
      id: node.id,
      width: GENERATED_DIAGRAM_NODE_WIDTH,
      height: GENERATED_DIAGRAM_NODE_HEIGHT,
    })),
    edges: orderedEdges.map<ElkExtendedEdge>((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };
}

function isFinitePoint(point: ElkPoint | LayoutPoint | undefined): point is LayoutPoint {
  return Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y));
}

function extractElkLayout(
  result: ElkNode,
  orderedNodes: readonly LayoutGeneratedDiagramNode[],
  orderedEdges: readonly OrderedEdge[],
): { nodes: RawLayoutNode[]; edges: RawLayoutEdge[] } {
  const nodesById = new Map(orderedNodes.map((node) => [node.id, node]));
  const nodes = (result.children ?? []).map((child) => {
    const node = nodesById.get(child.id);
    if (!node || !Number.isFinite(child.x) || !Number.isFinite(child.y)) {
      throw new Error(`ELK returned an invalid position for ${child.id}.`);
    }

    return { id: child.id, x: child.x as number, y: child.y as number, node };
  });

  if (nodes.length !== orderedNodes.length) {
    throw new Error("ELK omitted one or more diagram nodes.");
  }

  const outputEdges = new Map((result.edges ?? []).map((edge) => [edge.id, edge]));
  const edges = orderedEdges.map((edge) => {
    const outputEdge = outputEdges.get(edge.id);
    const section = outputEdge?.sections?.[0];
    const points = section
      ? [section.startPoint, ...(section.bendPoints ?? []), section.endPoint]
      : [];

    if (points.length < 2 || points.some((point) => !isFinitePoint(point))) {
      throw new Error(`ELK did not route diagram edge ${edge.id}.`);
    }

    return { ...edge, points: points.map(({ x, y }) => ({ x, y })) };
  });

  return { nodes, edges };
}

function createFallbackLayout(
  orderedNodes: readonly LayoutGeneratedDiagramNode[],
  orderedEdges: readonly OrderedEdge[],
  orientation: DiagramOrientation,
): { nodes: RawLayoutNode[]; edges: RawLayoutEdge[] } {
  const stages = [...new Set(orderedNodes.map((node) => node.stage))].sort(
    (left, right) => stageRank(left) - stageRank(right),
  );
  const stageIndex = new Map(stages.map((stage, index) => [stage, index]));
  const indexWithinStage = new Map<DiagramStage, number>();

  const nodes = orderedNodes.map((node) => {
    const lane = stageIndex.get(node.stage) ?? 0;
    const withinLane = indexWithinStage.get(node.stage) ?? 0;
    indexWithinStage.set(node.stage, withinLane + 1);

    return {
      id: node.id,
      x:
        GENERATED_DIAGRAM_OUTER_PADDING +
        (orientation === "horizontal"
          ? lane * (GENERATED_DIAGRAM_NODE_WIDTH + LAYER_SPACING)
          : withinLane * (GENERATED_DIAGRAM_NODE_WIDTH + NODE_SPACING)),
      y:
        GENERATED_DIAGRAM_OUTER_PADDING +
        (orientation === "horizontal"
          ? withinLane * (GENERATED_DIAGRAM_NODE_HEIGHT + NODE_SPACING)
          : lane * (GENERATED_DIAGRAM_NODE_HEIGHT + LAYER_SPACING)),
      node,
    };
  });

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const edges = orderedEdges.map((edge) => {
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    if (!source || !target) {
      return { ...edge, points: [] };
    }

    if (orientation === "horizontal") {
      const start = {
        x: source.x + GENERATED_DIAGRAM_NODE_WIDTH,
        y: source.y + GENERATED_DIAGRAM_NODE_HEIGHT / 2,
      };
      const end = {
        x: target.x,
        y: target.y + GENERATED_DIAGRAM_NODE_HEIGHT / 2,
      };
      const middleX = (start.x + end.x) / 2;
      return {
        ...edge,
        points: [start, { x: middleX, y: start.y }, { x: middleX, y: end.y }, end],
      };
    }

    const start = {
      x: source.x + GENERATED_DIAGRAM_NODE_WIDTH / 2,
      y: source.y + GENERATED_DIAGRAM_NODE_HEIGHT,
    };
    const end = {
      x: target.x + GENERATED_DIAGRAM_NODE_WIDTH / 2,
      y: target.y,
    };
    const middleY = (start.y + end.y) / 2;
    return {
      ...edge,
      points: [start, { x: start.x, y: middleY }, { x: end.x, y: middleY }, end],
    };
  });

  return { nodes, edges };
}

function routeMidpoint(points: readonly LayoutPoint[]): LayoutPoint {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  const lengths = points.slice(1).map((point, index) => {
    const previous = points[index];
    return Math.abs(point.x - previous.x) + Math.abs(point.y - previous.y);
  });
  const totalLength = lengths.reduce((total, length) => total + length, 0);
  let remaining = totalLength / 2;

  for (let index = 0; index < lengths.length; index += 1) {
    const segmentLength = lengths[index];
    if (remaining <= segmentLength) {
      const start = points[index];
      const end = points[index + 1];
      const ratio = segmentLength === 0 ? 0 : remaining / segmentLength;
      return {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      };
    }
    remaining -= segmentLength;
  }

  return { ...points[points.length - 1] };
}
interface RouteSegment {
  start: LayoutPoint;
  end: LayoutPoint;
  length: number;
  index: number;
  horizontal: boolean;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Approximates the opaque edge-label pill used by ElkFlowEdge. Keeping this
 * deterministic lets the layout select readable anchors without DOM measures.
 */
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

function expandBounds(bounds: LayoutBounds, amount: number): LayoutBounds {
  return {
    x: bounds.x - amount,
    y: bounds.y - amount,
    width: bounds.width + amount * 2,
    height: bounds.height + amount * 2,
  };
}

function boundsOverlap(left: LayoutBounds, right: LayoutBounds): boolean {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

function routeSegments(points: readonly LayoutPoint[]): RouteSegment[] {
  return points.slice(1).flatMap((end, index) => {
    const start = points[index];
    const horizontal = Math.abs(start.y - end.y) <= ORTHOGONAL_TOLERANCE;
    const vertical = Math.abs(start.x - end.x) <= ORTHOGONAL_TOLERANCE;
    if (!horizontal && !vertical) return [];
    const length = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
    return length <= ORTHOGONAL_TOLERANCE
      ? []
      : [{ start, end, length, index, horizontal }];
  });
}

function segmentIntersectsBounds(
  segment: RouteSegment,
  bounds: LayoutBounds,
): boolean {
  const minX = Math.min(segment.start.x, segment.end.x);
  const maxX = Math.max(segment.start.x, segment.end.x);
  const minY = Math.min(segment.start.y, segment.end.y);
  const maxY = Math.max(segment.start.y, segment.end.y);
  return (
    minX <= bounds.x + bounds.width &&
    maxX >= bounds.x &&
    minY <= bounds.y + bounds.height &&
    maxY >= bounds.y
  );
}

function labelCandidates(edge: RawLayoutEdge): LayoutPoint[] {
  const overallMidpoint = routeMidpoint(edge.points);
  const segments = routeSegments(edge.points).sort((left, right) => {
    const leftMidpoint = {
      x: (left.start.x + left.end.x) / 2,
      y: (left.start.y + left.end.y) / 2,
    };
    const rightMidpoint = {
      x: (right.start.x + right.end.x) / 2,
      y: (right.start.y + right.end.y) / 2,
    };
    const leftDistance =
      Math.abs(leftMidpoint.x - overallMidpoint.x) +
      Math.abs(leftMidpoint.y - overallMidpoint.y);
    const rightDistance =
      Math.abs(rightMidpoint.x - overallMidpoint.x) +
      Math.abs(rightMidpoint.y - overallMidpoint.y);
    return (
      right.length - left.length ||
      leftDistance - rightDistance ||
      left.index - right.index
    );
  });
  const ratios = [0.5, 0.35, 0.65, 0.2, 0.8] as const;
  const offsets = [0, -18, 18, -30, 30] as const;
  const candidates: LayoutPoint[] = [];

  for (const segment of segments) {
    for (const ratio of ratios) {
      const point = {
        x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        y: segment.start.y + (segment.end.y - segment.start.y) * ratio,
      };
      for (const offset of offsets) {
        candidates.push(
          segment.horizontal
            ? { x: point.x, y: point.y + offset }
            : { x: point.x + offset, y: point.y },
        );
      }
    }
  }

  if (candidates.length === 0) candidates.push(overallMidpoint);
  return candidates;
}

function placeEdgeLabels(
  rawNodes: readonly RawLayoutNode[],
  rawEdges: readonly RawLayoutEdge[],
): Map<string, LayoutPoint> {
  const nodeBounds = rawNodes.map((node) =>
    expandBounds(
      {
        x: node.x,
        y: node.y,
        width: GENERATED_DIAGRAM_NODE_WIDTH,
        height: GENERATED_DIAGRAM_NODE_HEIGHT,
      },
      EDGE_LABEL_NODE_CLEARANCE,
    ),
  );
  const segmentsByEdge = new Map(
    rawEdges.map((edge) => [edge.id, routeSegments(edge.points)]),
  );
  const placedBounds: LayoutBounds[] = [];
  const positions = new Map<string, LayoutPoint>();

  for (const edge of rawEdges) {
    if (edge.label.trim().length === 0) {
      positions.set(edge.id, routeMidpoint(edge.points));
      continue;
    }
    const candidates = labelCandidates(edge);
    const otherSegments = rawEdges.flatMap((otherEdge) =>
      otherEdge.id === edge.id
        ? []
        : (segmentsByEdge.get(otherEdge.id) ?? []),
    );
    const acceptable = (
      candidate: LayoutPoint,
      avoidRoutes: boolean,
      avoidLabels: boolean,
    ): boolean => {
      const bounds = generatedDiagramEdgeLabelBounds(edge.label, candidate);
      if (nodeBounds.some((node) => boundsOverlap(bounds, node))) return false;
      if (
        avoidRoutes &&
        otherSegments.some((segment) =>
          segmentIntersectsBounds(
            segment,
            expandBounds(bounds, EDGE_LABEL_ROUTE_CLEARANCE),
          ),
        )
      ) {
        return false;
      }
      if (
        avoidLabels &&
        placedBounds.some((placed) =>
          boundsOverlap(expandBounds(bounds, EDGE_LABEL_SEPARATION), placed),
        )
      ) {
        return false;
      }
      return true;
    };

    const position =
      candidates.find((candidate) => acceptable(candidate, true, true)) ??
      candidates.find((candidate) => acceptable(candidate, false, true)) ??
      candidates.find((candidate) => acceptable(candidate, false, false)) ??
      routeMidpoint(edge.points);
    positions.set(edge.id, position);
    placedBounds.push(generatedDiagramEdgeLabelBounds(edge.label, position));
  }

  return positions;
}

function materializeLayout(
  rawNodes: readonly RawLayoutNode[],
  rawEdges: readonly RawLayoutEdge[],
  orientation: DiagramOrientation,
  edgeLabelsVisible: boolean,
  warning?: string,
): GeneratedDiagramLayout {
  const labelPositions = placeEdgeLabels(rawNodes, rawEdges);
  const allPoints: LayoutPoint[] = [
    ...rawNodes.flatMap((node) => [
      { x: node.x, y: node.y },
      {
        x: node.x + GENERATED_DIAGRAM_NODE_WIDTH,
        y: node.y + GENERATED_DIAGRAM_NODE_HEIGHT,
      },
    ]),
    ...rawEdges.flatMap((edge) => edge.points),
  ];
  const minX = allPoints.length > 0 ? Math.min(...allPoints.map(({ x }) => x)) : 0;
  const minY = allPoints.length > 0 ? Math.min(...allPoints.map(({ y }) => y)) : 0;
  const shiftX = GENERATED_DIAGRAM_OUTER_PADDING - minX;
  const shiftY = GENERATED_DIAGRAM_OUTER_PADDING - minY;
  const shiftPoint = ({ x, y }: LayoutPoint): LayoutPoint => ({
    x: x + shiftX,
    y: y + shiftY,
  });

  const nodes: DiagramLayoutNode[] = rawNodes.map((node) => ({
    id: node.id,
    position: shiftPoint(node),
    width: GENERATED_DIAGRAM_NODE_WIDTH,
    height: GENERATED_DIAGRAM_NODE_HEIGHT,
    node: node.node,
    sourcePosition: orientation === "horizontal" ? "right" : "bottom",
    targetPosition: orientation === "horizontal" ? "left" : "top",
  }));
  const edges: DiagramLayoutEdge[] = rawEdges.map((edge) => {
    const points = edge.points.map(shiftPoint);
    return {
      ...edge,
      points,
      labelPosition: shiftPoint(
        labelPositions.get(edge.id) ?? routeMidpoint(edge.points),
      ),
      showLabel: edgeLabelsVisible && edge.label.trim().length > 0,
    };
  });
  const maxX = Math.max(
    GENERATED_DIAGRAM_OUTER_PADDING,
    ...nodes.map((node) => node.position.x + node.width),
    ...edges.flatMap((edge) => edge.points.map(({ x }) => x)),
  );
  const maxY = Math.max(
    GENERATED_DIAGRAM_OUTER_PADDING,
    ...nodes.map((node) => node.position.y + node.height),
    ...edges.flatMap((edge) => edge.points.map(({ y }) => y)),
  );

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
    lanes: createStageLanes(nodes),
    warning,
    usedFallback: Boolean(warning),
  };
}

function createStageLanes(nodes: readonly DiagramLayoutNode[]): DiagramStageLane[] {
  return GENERATED_DIAGRAM_STAGES.flatMap((stage) => {
    const stageNodes = nodes.filter((node) => node.node.stage === stage);
    if (stageNodes.length === 0) {
      return [];
    }

    const x = Math.min(...stageNodes.map((node) => node.position.x));
    const y = Math.min(...stageNodes.map((node) => node.position.y));
    const maxX = Math.max(...stageNodes.map((node) => node.position.x + node.width));
    const maxY = Math.max(...stageNodes.map((node) => node.position.y + node.height));

    return [
      {
        stage,
        label: `${stage.charAt(0).toUpperCase()}${stage.slice(1)}`,
        nodeIds: stageNodes.map((node) => node.id),
        bounds: {
          x: Math.max(0, x - 14),
          y: Math.max(0, y - 24),
          width: maxX - x + 28,
          height: maxY - y + 38,
        },
      },
    ];
  });
}

/**
 * Runs deterministic layered ELK layout. Its result is neutral data that maps
 * directly to React Flow nodes and custom orthogonal edges without losing ELK
 * bend points. On any layout error it returns a deterministic stage grid.
 */
export async function layoutGeneratedDiagram(
  diagram: LayoutGeneratedDiagram,
  options: DiagramLayoutOptions = {},
): Promise<GeneratedDiagramLayout> {
  const orientation = options.orientation ?? "horizontal";
  const edgeLabelsVisible = options.edgeLabelsVisible ?? true;
  const orderedNodes = orderNodes(diagram.nodes);
  const orderedEdges = orderEdges(diagram, orderedNodes);

  try {
    const engine = options.layoutEngine ?? getDefaultLayoutEngine();
    const graph = createElkGraph(orderedNodes, orderedEdges, orientation);
    const result = await engine.layout(graph);
    const rawLayout = extractElkLayout(result, orderedNodes, orderedEdges);
    return materializeLayout(
      rawLayout.nodes,
      rawLayout.edges,
      orientation,
      edgeLabelsVisible,
    );
  } catch {
    const fallback = createFallbackLayout(orderedNodes, orderedEdges, orientation);
    return materializeLayout(
      fallback.nodes,
      fallback.edges,
      orientation,
      edgeLabelsVisible,
      "Automatic diagram layout failed; a deterministic fallback layout is shown.",
    );
  }
}
