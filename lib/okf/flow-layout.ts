import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import type { ProjectedFlow, ProjectedFlowNode } from "./flow-projection.ts";
import type { OkfConceptType } from "./schema.ts";

export type FlowLayoutInputNode = Pick<ProjectedFlowNode, "id" | "type" | "title">;
export type FlowLayoutInputEdge = { id: string; source: string; target: string };
export type FlowLayoutInput = {
  nodes: readonly FlowLayoutInputNode[];
  edges: readonly FlowLayoutInputEdge[];
  layers: readonly OkfConceptType[];
  node_order: Partial<Record<OkfConceptType, string[]>>;
  layout_hints: Pick<ProjectedFlow["layout_hints"], "direction" | "preserve_source_order">;
};

export type FlowLayoutOptions = {
  node_width?: number;
  layer_gap?: number;
  node_gap?: number;
  padding?: number;
};

export type FlowLayoutNode = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layer_index: number;
  order_index: number;
};

export type FlowLayoutHandle = {
  id: string;
  edge_id: string;
  side: "source" | "target";
  offset_percent: number;
  position: "left" | "right" | "top" | "bottom";
};

export type FlowLayoutEdge = {
  id: string;
  source: string;
  target: string;
  source_handle: string;
  target_handle: string;
  path_kind: "straight" | "minimal_bezier";
  /** Exact absolute control points consumed by both the renderer and diagnostics. */
  control_points: [{ x: number; y: number }, { x: number; y: number }] | null;
  /** Smooth cubic segments for the rare dense-graph detour; never a shared straight trunk. */
  curve_segments: Array<{
    control_1: { x: number; y: number };
    control_2: { x: number; y: number };
    end: { x: number; y: number };
  }> | null;
};

export type FlowLayout = {
  nodes: FlowLayoutNode[];
  edges: FlowLayoutEdge[];
  handles_by_node: Record<string, FlowLayoutHandle[]>;
  width: number;
  height: number;
};

const defaults: Required<FlowLayoutOptions> = {
  node_width: 250,
  layer_gap: 180,
  node_gap: 88,
  padding: 100
};

export async function layoutProjectedFlow(flow: FlowLayoutInput, options: FlowLayoutOptions = {}): Promise<FlowLayout> {
  const settings = { ...defaults, ...options };
  const nodeById = new Map(flow.nodes.map((node) => [node.id, node]));
  const layerOrder = flow.layers.filter((layer) => flow.nodes.some((node) => node.type === layer));
  const inputOrderByLayer = new Map<OkfConceptType, string[]>(layerOrder.map((layer) => {
    const storedOrder = flow.node_order[layer] ?? [];
    const storedIds = new Set(storedOrder);
    return [layer, [
      ...storedOrder.filter((id) => nodeById.get(id)?.type === layer),
      ...flow.nodes.filter((node) => node.type === layer && !storedIds.has(node.id)).map((node) => node.id).sort()
    ]];
  }));
  const orderedNodeIds = layerOrder.flatMap((layer) => inputOrderByLayer.get(layer) ?? []);
  const heights = new Map(flow.nodes.map((node) => [node.id, contentAwareNodeHeight(node)]));
  const layerIndexByType = new Map(layerOrder.map((layer, index) => [layer, index]));
  const direction = elkDirection(flow.layout_hints.direction);
  const reversePartitions = flow.layout_hints.direction === "RIGHT_TO_LEFT"
    || flow.layout_hints.direction === "BOTTOM_TO_TOP";
  const validEdges = flow.edges.filter((edge) => nodeById.has(edge.source) && nodeById.has(edge.target));
  const graph: ElkNode = {
    id: "okf-flow-root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "org.eclipse.elk.partitioning.activate": "true",
      "org.eclipse.elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "org.eclipse.elk.layered.crossingMinimization.forceNodeModelOrder": flow.layout_hints.preserve_source_order ? "true" : "false",
      "org.eclipse.elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
      "org.eclipse.elk.layered.cycleBreaking.strategy": "GREEDY",
      "elk.spacing.nodeNode": String(settings.node_gap),
      "org.eclipse.elk.layered.spacing.nodeNodeBetweenLayers": String(settings.layer_gap),
      "elk.padding": `[top=${settings.padding},left=${settings.padding},bottom=${settings.padding},right=${settings.padding}]`
    },
    children: orderedNodeIds.map((id) => {
      const node = nodeById.get(id)!;
      const semanticLayerIndex = layerIndexByType.get(node.type) ?? 0;
      const partition = reversePartitions ? layerOrder.length - semanticLayerIndex - 1 : semanticLayerIndex;
      return {
        id,
        width: settings.node_width,
        height: heights.get(id) ?? 120,
        layoutOptions: {
          "org.eclipse.elk.partitioning.partition": String(partition)
        }
      };
    }),
    edges: validEdges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target]
    }))
  };

  const result = await new ELK().layout(graph);
  const resultById = new Map((result.children ?? []).map((node) => [node.id, node]));
  let nodes: FlowLayoutNode[] = orderedNodeIds.map((id) => {
    const semantic = nodeById.get(id)!;
    const positioned = resultById.get(id);
    return {
      id,
      x: positioned?.x ?? settings.padding,
      y: positioned?.y ?? settings.padding,
      width: positioned?.width ?? settings.node_width,
      height: positioned?.height ?? heights.get(id) ?? 120,
      layer_index: layerIndexByType.get(semantic.type) ?? 0,
      order_index: 0
    };
  });

  if (flow.layout_hints.preserve_source_order) {
    nodes = enforceStoredCrossAxisOrder(
      nodes,
      layerOrder,
      inputOrderByLayer,
      nodeById,
      flow.layout_hints.direction,
      settings
    );
  } else {
    const horizontal = flow.layout_hints.direction === "LEFT_TO_RIGHT"
      || flow.layout_hints.direction === "RIGHT_TO_LEFT";
    const positionById = new Map(nodes.map((node) => [node.id, node]));
    for (const layer of layerOrder) {
      const ids = (inputOrderByLayer.get(layer) ?? []).slice().sort((left, right) => {
        const leftNode = positionById.get(left);
        const rightNode = positionById.get(right);
        const leftAxis = horizontal ? leftNode?.y ?? 0 : leftNode?.x ?? 0;
        const rightAxis = horizontal ? rightNode?.y ?? 0 : rightNode?.x ?? 0;
        return leftAxis - rightAxis || left.localeCompare(right);
      });
      ids.forEach((id, orderIndex) => {
        const node = positionById.get(id);
        if (node) node.order_index = orderIndex;
      });
    }
  }

  nodes = normalizeLayoutOrigin(nodes, settings.padding);
  const width = Math.max(
    settings.padding * 2,
    result.width ?? 0,
    ...nodes.map((node) => node.x + node.width + settings.padding)
  );
  const height = Math.max(
    settings.padding * 2,
    result.height ?? 0,
    ...nodes.map((node) => node.y + node.height + settings.padding)
  );
  const positions = handlePositions(flow.layout_hints.direction);
  const { edges, handlesByNode } = allocateStableHandles(nodes, validEdges, positions.source, positions.target);
  return { nodes, edges, handles_by_node: handlesByNode, width, height };
}

function elkDirection(direction: FlowLayoutInput["layout_hints"]["direction"]) {
  if (direction === "RIGHT_TO_LEFT") return "LEFT";
  if (direction === "TOP_TO_BOTTOM") return "DOWN";
  if (direction === "BOTTOM_TO_TOP") return "UP";
  return "RIGHT";
}

function enforceStoredCrossAxisOrder(
  nodes: FlowLayoutNode[],
  layers: readonly OkfConceptType[],
  orderByLayer: Map<OkfConceptType, string[]>,
  semanticById: Map<string, FlowLayoutInputNode>,
  direction: FlowLayoutInput["layout_hints"]["direction"],
  settings: Required<FlowLayoutOptions>
) {
  const horizontal = direction === "LEFT_TO_RIGHT" || direction === "RIGHT_TO_LEFT";
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const layerExtents = layers.map((layer) => {
    const ids = orderByLayer.get(layer) ?? [];
    return ids.reduce((total, id, index) => {
      const node = byId.get(id);
      const extent = horizontal ? node?.height ?? 120 : node?.width ?? settings.node_width;
      return total + extent + (index ? settings.node_gap : 0);
    }, 0);
  });
  const maximumExtent = Math.max(0, ...layerExtents);
  layers.forEach((layer, layerIndex) => {
    const ids = orderByLayer.get(layer) ?? [];
    let cursor = settings.padding + (maximumExtent - layerExtents[layerIndex]) / 2;
    ids.forEach((id, orderIndex) => {
      const node = byId.get(id);
      if (!node || semanticById.get(id)?.type !== layer) return;
      if (horizontal) node.y = cursor;
      else node.x = cursor;
      node.order_index = orderIndex;
      cursor += (horizontal ? node.height : node.width) + settings.node_gap;
    });
  });
  return nodes;
}

function normalizeLayoutOrigin(nodes: FlowLayoutNode[], padding: number) {
  if (!nodes.length) return nodes;
  const minimumX = Math.min(...nodes.map((node) => node.x));
  const minimumY = Math.min(...nodes.map((node) => node.y));
  const shiftX = minimumX < padding ? padding - minimumX : 0;
  const shiftY = minimumY < padding ? padding - minimumY : 0;
  if (!shiftX && !shiftY) return nodes;
  return nodes.map((node) => ({ ...node, x: node.x + shiftX, y: node.y + shiftY }));
}

function handlePositions(direction: FlowLayoutInput["layout_hints"]["direction"]) {
  if (direction === "RIGHT_TO_LEFT") return { source: "left" as const, target: "right" as const };
  if (direction === "TOP_TO_BOTTOM") return { source: "bottom" as const, target: "top" as const };
  if (direction === "BOTTOM_TO_TOP") return { source: "top" as const, target: "bottom" as const };
  return { source: "right" as const, target: "left" as const };
}
export function allocateStableHandles(
  nodes: readonly FlowLayoutNode[],
  edges: readonly FlowLayoutInputEdge[],
  sourcePosition: FlowLayoutHandle["position"] = "right",
  targetPosition: FlowLayoutHandle["position"] = "left"
) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, FlowLayoutInputEdge[]>();
  const incoming = new Map<string, FlowLayoutInputEdge[]>();
  for (const edge of edges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) continue;
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge]);
  }
  for (const list of outgoing.values()) {
    list.sort((left, right) => compareIncidentEdges(left, right, nodeById, "target"));
  }
  for (const list of incoming.values()) {
    list.sort((left, right) => compareIncidentEdges(left, right, nodeById, "source"));
  }

  const handlesByNode: Record<string, FlowLayoutHandle[]> = Object.fromEntries(nodes.map((node) => [node.id, []]));
  const sourceHandleByEdge = new Map<string, string>();
  const targetHandleByEdge = new Map<string, string>();
  for (const [nodeId, list] of outgoing) {
    list.forEach((edge, index) => {
      const handle = makeHandle(nodeId, edge.id, "source", sourcePosition, index, list.length);
      handlesByNode[nodeId].push(handle);
      sourceHandleByEdge.set(edge.id, handle.id);
    });
  }
  for (const [nodeId, list] of incoming) {
    list.forEach((edge, index) => {
      const handle = makeHandle(nodeId, edge.id, "target", targetPosition, index, list.length);
      handlesByNode[nodeId].push(handle);
      targetHandleByEdge.set(edge.id, handle.id);
    });
  }

  const parallelCounts = new Map<string, number>();
  for (const edge of edges) {
    const key = `${edge.source}\u0000${edge.target}`;
    parallelCounts.set(key, (parallelCounts.get(key) ?? 0) + 1);
  }
  const layoutEdges = edges.flatMap((edge): FlowLayoutEdge[] => {
    const sourceHandle = sourceHandleByEdge.get(edge.id);
    const targetHandle = targetHandleByEdge.get(edge.id);
    if (!sourceHandle || !targetHandle) return [];
    const route = routeEdgeAroundNodes(
      edge,
      nodeById,
      handlesByNode,
      sourceHandle,
      targetHandle,
      (parallelCounts.get(`${edge.source}\u0000${edge.target}`) ?? 0) > 1
    );
    return [{
      id: edge.id,
      source: edge.source,
      target: edge.target,
      source_handle: sourceHandle,
      target_handle: targetHandle,
      path_kind: route?.path_kind ?? "straight",
      control_points: route?.control_points ?? null,
      curve_segments: route?.curve_segments ?? null
    }];
  });
  return { edges: layoutEdges, handlesByNode };
}

type FlowPoint = { x: number; y: number };
const routeNodeClearance = 10;
const renderedCurveSamples = 96;
type RoutedEdgeGeometry = Pick<FlowLayoutEdge, "path_kind" | "control_points" | "curve_segments">;

function routeEdgeAroundNodes(
  edge: FlowLayoutInputEdge,
  nodeById: Map<string, FlowLayoutNode>,
  handlesByNode: Record<string, FlowLayoutHandle[]>,
  sourceHandleId: string,
  targetHandleId: string,
  forceCurve: boolean
): RoutedEdgeGeometry | null {
  const source = nodeById.get(edge.source);
  const target = nodeById.get(edge.target);
  const sourceHandle = handlesByNode[edge.source]?.find((handle) => handle.id === sourceHandleId);
  const targetHandle = handlesByNode[edge.target]?.find((handle) => handle.id === targetHandleId);
  if (!source || !target || !sourceHandle || !targetHandle) return null;
  const start = handlePoint(source, sourceHandle);
  const end = handlePoint(target, targetHandle);
  const obstacles = [...nodeById.values()].filter((node) => node.id !== edge.source && node.id !== edge.target);
  const directBlocked = pathIntersectsNodes([start, end], obstacles, routeNodeClearance);
  if (!forceCurve && !directBlocked) return null;

  const horizontal = sourceHandle.position === "left" || sourceHandle.position === "right";
  const primaryDistance = horizontal ? Math.abs(end.x - start.x) : Math.abs(end.y - start.y);
  const lead = Math.max(44, Math.min(190, primaryDistance * 0.34));
  const midpointCross = horizontal ? (start.y + end.y) / 2 : (start.x + end.x) / 2;
  const crossExtents = [...nodeById.values()].flatMap((node) => horizontal
    ? [node.y, node.y + node.height]
    : [node.x, node.x + node.width]);
  const minimumCross = Math.min(midpointCross, ...crossExtents);
  const maximumCross = Math.max(midpointCross, ...crossExtents);
  const maximumDetour = Math.max(320, (maximumCross - minimumCross) * 2 + 240);
  const preferredSign = stableHash(edge.id) % 2 === 0 ? 1 : -1;
  const initialOffset = forceCurve ? preferredSign * 28 : 0;

  for (const offset of symmetricOffsets(initialOffset, maximumDetour, preferredSign)) {
    const cross = midpointCross + offset;
    const controls = controlPointsForCross(start, end, sourceHandle.position, targetHandle.position, horizontal, lead, cross);
    const points = sampleCubicBezier(start, controls[0], controls[1], end, renderedCurveSamples);
    if (!pathIntersectsNodes(points, obstacles, routeNodeClearance)) return { path_kind: "minimal_bezier", control_points: controls, curve_segments: null };
  }

  const curveSegments = findMinimalSplineRoute(
    edge.id,
    start,
    end,
    sourceHandle.position,
    targetHandle.position,
    source,
    target,
    [...nodeById.values()]
  );
  if (curveSegments) return { path_kind: "minimal_bezier", control_points: null, curve_segments: curveSegments };
  if (!pathIntersectsNodes([start, end], obstacles, 0)) return null;
  throw new Error(`Flow edge '${edge.id}' could not be routed without crossing an unrelated node.`);
}

function findMinimalSplineRoute(
  edgeId: string,
  start: FlowPoint,
  end: FlowPoint,
  sourcePosition: FlowLayoutHandle["position"],
  targetPosition: FlowLayoutHandle["position"],
  source: FlowLayoutNode,
  target: FlowLayoutNode,
  nodes: readonly FlowLayoutNode[]
): FlowLayoutEdge["curve_segments"] {
  const obstacles = nodes.filter((node) => node.id !== source.id && node.id !== target.id);
  const horizontal = sourcePosition === "left" || sourcePosition === "right";
  const sourceNormal = handleNormal(sourcePosition);
  const targetNormal = handleNormal(targetPosition);
  const minimumX = Math.min(...nodes.map((node) => node.x));
  const maximumX = Math.max(...nodes.map((node) => node.x + node.width));
  const minimumY = Math.min(...nodes.map((node) => node.y));
  const maximumY = Math.max(...nodes.map((node) => node.y + node.height));
  const lane = 18 + (stableHash(edgeId) % 101) * 0.41;
  const expansions = [0, 160, 360, 720];
  const outerCandidates = expansions.flatMap((expansion) => horizontal
    ? [minimumY - routeNodeClearance - 36 - lane - expansion, maximumY + routeNodeClearance + 36 + lane + expansion]
    : [minimumX - routeNodeClearance - 36 - lane - expansion, maximumX + routeNodeClearance + 36 + lane + expansion]);
  const midpointCross = horizontal ? (start.y + end.y) / 2 : (start.x + end.x) / 2;
  outerCandidates.sort((left, right) => Math.abs(left - midpointCross) - Math.abs(right - midpointCross));

  for (const stubDistance of [36, 52, 72, 96, 128, 168]) {
    for (const outer of outerCandidates) {
      const firstGuide = horizontal
        ? { x: start.x + sourceNormal.x * stubDistance, y: outer }
        : { x: outer, y: start.y + sourceNormal.y * stubDistance };
      const secondGuide = horizontal
        ? { x: end.x + targetNormal.x * stubDistance, y: outer }
        : { x: outer, y: end.y + targetNormal.y * stubDistance };
      const segments = smoothCubicSegments([start, firstGuide, secondGuide, end], sourceNormal, targetNormal, stubDistance);
      const points = sampleCubicSegments(start, segments, renderedCurveSamples);
      if (!pathIntersectsNodes(points, obstacles, routeNodeClearance)) return segments;
    }
  }
  return null;
}

function smoothCubicSegments(
  points: readonly FlowPoint[],
  sourceNormal: FlowPoint,
  targetNormal: FlowPoint,
  endpointLead: number
): NonNullable<FlowLayoutEdge["curve_segments"]> {
  return points.slice(1).map((end, index) => {
    const start = points[index];
    const previous = points[index - 1];
    const following = points[index + 2];
    const control1 = index === 0
      ? { x: start.x + sourceNormal.x * endpointLead, y: start.y + sourceNormal.y * endpointLead }
      : { x: start.x + (end.x - previous.x) / 6, y: start.y + (end.y - previous.y) / 6 };
    const control2 = index === points.length - 2
      ? { x: end.x + targetNormal.x * endpointLead, y: end.y + targetNormal.y * endpointLead }
      : { x: end.x - (following.x - start.x) / 6, y: end.y - (following.y - start.y) / 6 };
    return { control_1: control1, control_2: control2, end };
  });
}

function sampleCubicSegments(
  start: FlowPoint,
  segments: NonNullable<FlowLayoutEdge["curve_segments"]>,
  totalSamples: number
) {
  const samplesPerSegment = Math.max(24, Math.ceil(totalSamples / Math.max(1, segments.length)));
  const points: FlowPoint[] = [start];
  let segmentStart = start;
  for (const segment of segments) {
    points.push(...sampleCubicBezier(segmentStart, segment.control_1, segment.control_2, segment.end, samplesPerSegment).slice(1));
    segmentStart = segment.end;
  }
  return points;
}
function symmetricOffsets(initial: number, maximum: number, preferredSign: 1 | -1) {
  const offsets: number[] = [];
  const seen = new Set<number>();
  const add = (value: number) => {
    const rounded = Math.round(value * 1000) / 1000;
    if (Math.abs(rounded) <= maximum && !seen.has(rounded)) {
      seen.add(rounded);
      offsets.push(rounded);
    }
  };
  add(initial);
  add(0);
  for (let distance = 24; distance <= maximum; distance += 24) {
    add(preferredSign * distance);
    add(-preferredSign * distance);
  }
  add(preferredSign * maximum);
  add(-preferredSign * maximum);
  return offsets;
}

function controlPointsForCross(
  start: FlowPoint,
  end: FlowPoint,
  sourcePosition: FlowLayoutHandle["position"],
  targetPosition: FlowLayoutHandle["position"],
  horizontal: boolean,
  lead: number,
  cross: number
): NonNullable<FlowLayoutEdge["control_points"]> {
  const sourceNormal = handleNormal(sourcePosition);
  const targetNormal = handleNormal(targetPosition);
  const first = { x: start.x + sourceNormal.x * lead, y: start.y + sourceNormal.y * lead };
  const second = { x: end.x + targetNormal.x * lead, y: end.y + targetNormal.y * lead };
  if (horizontal) {
    first.y = cross;
    second.y = cross;
  } else {
    first.x = cross;
    second.x = cross;
  }
  return [first, second];
}

function handleNormal(position: FlowLayoutHandle["position"]): FlowPoint {
  if (position === "left") return { x: -1, y: 0 };
  if (position === "top") return { x: 0, y: -1 };
  if (position === "bottom") return { x: 0, y: 1 };
  return { x: 1, y: 0 };
}

function pathIntersectsNodes(points: readonly FlowPoint[], nodes: readonly FlowLayoutNode[], clearance: number) {
  for (let index = 1; index < points.length; index += 1) {
    for (const node of nodes) {
      if (segmentIntersectsBox(points[index - 1], points[index], expandBox(node, clearance))) return true;
    }
  }
  return false;
}

function expandBox(node: FlowLayoutNode, margin: number): FlowLayoutNode {
  return {
    ...node,
    x: node.x - margin,
    y: node.y - margin,
    width: node.width + margin * 2,
    height: node.height + margin * 2
  };
}

export function flowEdgePathGeometry(
  edge: Pick<FlowLayoutEdge, "path_kind" | "control_points" | "curve_segments">,
  start: FlowPoint,
  end: FlowPoint
) {
  if (edge.path_kind === "minimal_bezier" && edge.control_points) {
    const [first, second] = edge.control_points;
    const label = cubicBezierPoint(start, first, second, end, 0.5);
    return {
      path: `M ${start.x},${start.y} C ${first.x},${first.y} ${second.x},${second.y} ${end.x},${end.y}`,
      label_x: label.x,
      label_y: label.y
    };
  }
  if (edge.path_kind === "minimal_bezier" && edge.curve_segments) {
    const points = sampleCubicSegments(start, edge.curve_segments, renderedCurveSamples);
    const label = pointAlongPolyline(points, 0.5);
    return {
      path: [`M ${start.x},${start.y}`, ...edge.curve_segments.map((segment) => (
        `C ${segment.control_1.x},${segment.control_1.y} ${segment.control_2.x},${segment.control_2.y} ${segment.end.x},${segment.end.y}`
      ))].join(" "),
      label_x: label.x,
      label_y: label.y
    };
  }
  return {
    path: `M ${start.x},${start.y} L ${end.x},${end.y}`,
    label_x: (start.x + end.x) / 2,
    label_y: (start.y + end.y) / 2
  };
}

export function sampleRenderedFlowEdge(
  edge: Pick<FlowLayoutEdge, "path_kind" | "control_points" | "curve_segments">,
  start: FlowPoint,
  end: FlowPoint,
  samples = renderedCurveSamples
) {
  if (edge.path_kind === "minimal_bezier" && edge.control_points) {
    return sampleCubicBezier(start, edge.control_points[0], edge.control_points[1], end, samples);
  }
  if (edge.path_kind === "minimal_bezier" && edge.curve_segments) return sampleCubicSegments(start, edge.curve_segments, samples);
  return [start, end];
}

function pointAlongPolyline(points: readonly FlowPoint[], ratio: number) {
  const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y));
  const target = lengths.reduce((sum, length) => sum + length, 0) * ratio;
  let traversed = 0;
  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index];
    if (traversed + length >= target && length > 0) {
      const local = (target - traversed) / length;
      return {
        x: points[index].x + (points[index + 1].x - points[index].x) * local,
        y: points[index].y + (points[index + 1].y - points[index].y) * local
      };
    }
    traversed += length;
  }
  return points.at(-1) ?? { x: 0, y: 0 };
}

function sampleCubicBezier(start: FlowPoint, first: FlowPoint, second: FlowPoint, end: FlowPoint, samples: number) {
  return Array.from({ length: Math.max(2, samples) + 1 }, (_, index) => (
    cubicBezierPoint(start, first, second, end, index / Math.max(2, samples))
  ));
}

function cubicBezierPoint(start: FlowPoint, first: FlowPoint, second: FlowPoint, end: FlowPoint, t: number) {
  const complement = 1 - t;
  return {
    x: complement ** 3 * start.x
      + 3 * complement ** 2 * t * first.x
      + 3 * complement * t ** 2 * second.x
      + t ** 3 * end.x,
    y: complement ** 3 * start.y
      + 3 * complement ** 2 * t * first.y
      + 3 * complement * t ** 2 * second.y
      + t ** 3 * end.y
  };
}
export function findNodeOverlaps(nodes: readonly FlowLayoutNode[]) {
  const overlaps: Array<{ first: string; second: string }> = [];
  for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
      if (boxesOverlap(nodes[leftIndex], nodes[rightIndex])) {
        overlaps.push({ first: nodes[leftIndex].id, second: nodes[rightIndex].id });
      }
    }
  }
  return overlaps;
}

export function findDuplicateNodePositions(nodes: readonly FlowLayoutNode[]) {
  const positionOwners = new Map<string, string>();
  const duplicates: Array<{ first: string; second: string }> = [];
  for (const node of nodes) {
    const key = `${node.x}\u0000${node.y}`;
    const owner = positionOwners.get(key);
    if (owner) duplicates.push({ first: owner, second: node.id });
    else positionOwners.set(key, node.id);
  }
  return duplicates;
}

/** Checks the exact straight/cubic geometry consumed by the React Flow renderer. */
export function findRenderedEdgeNodeIntersections(layout: FlowLayout) {
  return findEdgeNodeIntersections(layout, () => true);
}

/** Retained as a focused diagnostic for clear edges; prefer the rendered-path check above. */
export function findStraightEdgeNodeIntersections(layout: FlowLayout) {
  return findEdgeNodeIntersections(layout, (edge) => edge.path_kind === "straight");
}

function findEdgeNodeIntersections(layout: FlowLayout, include: (edge: FlowLayoutEdge) => boolean) {
  const nodeById = new Map(layout.nodes.map((node) => [node.id, node]));
  const handleById = new Map(Object.values(layout.handles_by_node).flat().map((handle) => [handle.id, handle]));
  const intersections: Array<{ edge: string; node: string }> = [];
  for (const edge of layout.edges.filter(include)) {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    const sourceHandle = handleById.get(edge.source_handle);
    const targetHandle = handleById.get(edge.target_handle);
    if (!source || !target || !sourceHandle || !targetHandle) continue;
    const points = sampleRenderedFlowEdge(edge, handlePoint(source, sourceHandle), handlePoint(target, targetHandle));
    for (const node of layout.nodes) {
      if (node.id === edge.source || node.id === edge.target) continue;
      if (pathIntersectsNodes(points, [node], 0)) intersections.push({ edge: edge.id, node: node.id });
    }
  }
  return intersections;
}

export function preservesProjectedLayerOrder(flow: FlowLayoutInput, layout: FlowLayout) {
  const layoutById = new Map(layout.nodes.map((node) => [node.id, node]));
  for (let layerIndex = 0; layerIndex < flow.layers.length; layerIndex += 1) {
    const ids = flow.node_order[flow.layers[layerIndex]] ?? [];
    if (flow.layout_hints.preserve_source_order) {
      const actual = ids.slice().sort((left, right) => (layoutById.get(left)?.order_index ?? 0) - (layoutById.get(right)?.order_index ?? 0));
      if (actual.some((id, index) => id !== ids[index])) return false;
    }
    if (ids.some((id) => layoutById.get(id)?.layer_index !== layerIndex)) return false;
  }
  return true;
}

function handlePoint(node: FlowLayoutNode, handle: FlowLayoutHandle) {
  const offsetX = node.x + node.width * handle.offset_percent / 100;
  const offsetY = node.y + node.height * handle.offset_percent / 100;
  if (handle.position === "left") return { x: node.x, y: offsetY };
  if (handle.position === "right") return { x: node.x + node.width, y: offsetY };
  if (handle.position === "top") return { x: offsetX, y: node.y };
  return { x: offsetX, y: node.y + node.height };
}

function contentAwareNodeHeight(node: FlowLayoutInputNode) {
  const titleLines = Math.max(1, Math.min(4, Math.ceil(node.title.length / 31)));
  return Math.max(118, Math.min(168, 94 + titleLines * 18));
}

function compareIncidentEdges(
  left: FlowLayoutInputEdge,
  right: FlowLayoutInputEdge,
  nodeById: Map<string, FlowLayoutNode>,
  endpoint: "source" | "target"
) {
  const leftNode = nodeById.get(left[endpoint]);
  const rightNode = nodeById.get(right[endpoint]);
  return (leftNode?.layer_index ?? 0) - (rightNode?.layer_index ?? 0)
    || (leftNode?.order_index ?? 0) - (rightNode?.order_index ?? 0)
    || left[endpoint].localeCompare(right[endpoint])
    || left.id.localeCompare(right.id);
}

function makeHandle(
  nodeId: string,
  edgeId: string,
  side: FlowLayoutHandle["side"],
  position: FlowLayoutHandle["position"],
  index: number,
  count: number
): FlowLayoutHandle {
  return {
    id: `okf-${side}-${stableToken(nodeId)}-${stableToken(edgeId)}`,
    edge_id: edgeId,
    side,
    offset_percent: ((index + 1) / (count + 1)) * 100,
    position
  };
}

function stableToken(value: string) {
  return stableHash(value).toString(36);
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function boxesOverlap(left: FlowLayoutNode, right: FlowLayoutNode) {
  return left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y;
}

function segmentIntersectsBox(start: { x: number; y: number }, end: { x: number; y: number }, box: FlowLayoutNode) {
  if (pointInside(start, box) || pointInside(end, box)) return true;
  const topLeft = { x: box.x, y: box.y };
  const topRight = { x: box.x + box.width, y: box.y };
  const bottomLeft = { x: box.x, y: box.y + box.height };
  const bottomRight = { x: box.x + box.width, y: box.y + box.height };
  return segmentsIntersect(start, end, topLeft, topRight)
    || segmentsIntersect(start, end, topRight, bottomRight)
    || segmentsIntersect(start, end, bottomRight, bottomLeft)
    || segmentsIntersect(start, end, bottomLeft, topLeft);
}

function pointInside(point: { x: number; y: number }, box: FlowLayoutNode) {
  return point.x > box.x && point.x < box.x + box.width && point.y > box.y && point.y < box.y + box.height;
}

function segmentsIntersect(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, d: { x: number; y: number }) {
  const orientation = (p: typeof a, q: typeof a, r: typeof a) => Math.sign((q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y));
  return orientation(a, b, c) !== orientation(a, b, d) && orientation(c, d, a) !== orientation(c, d, b);
}
