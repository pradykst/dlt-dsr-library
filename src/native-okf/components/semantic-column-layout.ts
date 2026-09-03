export type SemanticOrientation = "horizontal" | "vertical";

export const PAPER_DESIGN_FIT_MIN_ZOOM = 0.2;

export interface SemanticLayoutInputNode<T> {
  id: string;
  columnKey: string;
  label: string;
  producerLabel?: string;
  order?: number;
  /**
   * Reserved rendered height for this node, in px. When omitted the shared
   * `nodeHeight` option is used, so callers that do not measure their cards keep
   * the previous uniform-height behaviour exactly.
   */
  height?: number;
  value: T;
}

export interface SemanticLayoutInputEdge<T> {
  id: string;
  source: string;
  target: string;
  label: string;
  value: T;
}

export interface SemanticLayoutInputColumn {
  key: string;
  title: string;
}

export interface SemanticPoint {
  x: number;
  y: number;
}

export interface SemanticBounds extends SemanticPoint {
  width: number;
  height: number;
}

export interface SemanticPositionedNode<T> extends SemanticLayoutInputNode<T> {
  position: SemanticPoint;
  width: number;
  height: number;
  sourcePosition: "right" | "bottom";
  targetPosition: "left" | "top";
}

export interface SemanticPositionedEdge<T> extends SemanticLayoutInputEdge<T> {
  points: [SemanticPoint, SemanticPoint];
  labelPosition: SemanticPoint;
}

export interface SemanticPositionedColumn {
  key: string;
  title: string;
  nodeIds: string[];
  headingPosition: SemanticPoint;
  bounds: SemanticBounds;
}

export interface SemanticColumnLayout<TNode, TEdge> {
  orientation: SemanticOrientation;
  nodes: SemanticPositionedNode<TNode>[];
  edges: SemanticPositionedEdge<TEdge>[];
  columns: SemanticPositionedColumn[];
  bounds: SemanticBounds;
}

export interface SemanticColumnLayoutOptions {
  orientation?: SemanticOrientation;
  nodeWidth?: number;
  nodeHeight?: number;
  nodeGap?: number;
  columnGap?: number;
  outerPadding?: number;
  headingSpace?: number;
  crossingPasses?: number;
}

const DEFAULTS: Required<SemanticColumnLayoutOptions> = {
  orientation: "horizontal",
  nodeWidth: 240,
  nodeHeight: 96,
  nodeGap: 34,
  columnGap: 150,
  outerPadding: 36,
  headingSpace: 42,
  crossingPasses: 3,
};

function compareText(left: string, right: string): number {
  return left.localeCompare(right, "en", { sensitivity: "base", numeric: true });
}

function naturalProducerLabel(value: string | undefined): { prefix: string; number: number } | undefined {
  const match = value?.trim().match(/^([\p{L}]+)[\s-]*0*(\d+)\b/iu);
  if (!match?.[1] || !match[2]) return undefined;
  return { prefix: match[1].toLocaleLowerCase("en"), number: Number(match[2]) };
}

export function compareSemanticLayoutNodes<T>(
  left: SemanticLayoutInputNode<T>,
  right: SemanticLayoutInputNode<T>,
): number {
  if (left.order !== undefined || right.order !== undefined) {
    const order = (left.order ?? Number.MAX_SAFE_INTEGER) -
      (right.order ?? Number.MAX_SAFE_INTEGER);
    if (order !== 0) return order;
  }
  const leftProducer = naturalProducerLabel(left.producerLabel);
  const rightProducer = naturalProducerLabel(right.producerLabel);
  if (leftProducer && rightProducer && leftProducer.prefix === rightProducer.prefix) {
    const number = leftProducer.number - rightProducer.number;
    if (number !== 0) return number;
  } else if (leftProducer && !rightProducer) {
    return -1;
  } else if (!leftProducer && rightProducer) {
    return 1;
  }
  return compareText(left.label, right.label) || compareText(left.id, right.id);
}

function barycenter(
  nodeId: string,
  neighborColumn: ReadonlyMap<string, number>,
  adjacency: ReadonlyMap<string, ReadonlySet<string>>,
): number | undefined {
  const indexes = [...(adjacency.get(nodeId) ?? [])]
    .flatMap((neighbor) => {
      const index = neighborColumn.get(neighbor);
      return index === undefined ? [] : [index];
    });
  if (indexes.length === 0) return undefined;
  return indexes.reduce((sum, index) => sum + index, 0) / indexes.length;
}

function minimizeCrossings<TNode, TEdge>(
  columns: SemanticLayoutInputColumn[],
  initial: Map<string, SemanticLayoutInputNode<TNode>[]>,
  edges: readonly SemanticLayoutInputEdge<TEdge>[],
  passes: number,
): Map<string, SemanticLayoutInputNode<TNode>[]> {
  const ordered = new Map(
    columns.map((column) => [column.key, [...(initial.get(column.key) ?? [])]]),
  );
  const adjacency = new Map<string, Set<string>>();
  for (const edge of edges) {
    const source = adjacency.get(edge.source) ?? new Set<string>();
    source.add(edge.target);
    adjacency.set(edge.source, source);
    const target = adjacency.get(edge.target) ?? new Set<string>();
    target.add(edge.source);
    adjacency.set(edge.target, target);
  }

  const sweep = (start: number, end: number, step: number) => {
    for (let columnIndex = start; columnIndex !== end; columnIndex += step) {
      const column = columns[columnIndex];
      const neighbor = columns[columnIndex - step];
      if (!column || !neighbor) continue;
      const neighborIndex = new Map(
        (ordered.get(neighbor.key) ?? []).map((node, index) => [node.id, index]),
      );
      const current = [...(ordered.get(column.key) ?? [])];
      current.sort((left, right) => {
        const leftCenter = barycenter(left.id, neighborIndex, adjacency);
        const rightCenter = barycenter(right.id, neighborIndex, adjacency);
        if (leftCenter !== undefined && rightCenter !== undefined && leftCenter !== rightCenter) {
          return leftCenter - rightCenter;
        }
        if (leftCenter !== undefined && rightCenter === undefined) return -1;
        if (leftCenter === undefined && rightCenter !== undefined) return 1;
        return compareSemanticLayoutNodes(left, right);
      });
      ordered.set(column.key, current);
    }
  };

  for (let pass = 0; pass < passes; pass += 1) {
    sweep(1, columns.length, 1);
    sweep(columns.length - 2, -1, -1);
  }
  return ordered;
}

function finitePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function layoutSemanticColumns<TNode, TEdge>(
  inputNodes: readonly SemanticLayoutInputNode<TNode>[],
  inputEdges: readonly SemanticLayoutInputEdge<TEdge>[],
  inputColumns: readonly SemanticLayoutInputColumn[],
  options: SemanticColumnLayoutOptions = {},
): SemanticColumnLayout<TNode, TEdge> {
  const settings = {
    ...DEFAULTS,
    ...options,
    nodeWidth: finitePositive(options.nodeWidth ?? DEFAULTS.nodeWidth, DEFAULTS.nodeWidth),
    nodeHeight: finitePositive(options.nodeHeight ?? DEFAULTS.nodeHeight, DEFAULTS.nodeHeight),
    nodeGap: finitePositive(options.nodeGap ?? DEFAULTS.nodeGap, DEFAULTS.nodeGap),
    columnGap: finitePositive(options.columnGap ?? DEFAULTS.columnGap, DEFAULTS.columnGap),
    outerPadding: finitePositive(options.outerPadding ?? DEFAULTS.outerPadding, DEFAULTS.outerPadding),
    headingSpace: finitePositive(options.headingSpace ?? DEFAULTS.headingSpace, DEFAULTS.headingSpace),
    crossingPasses: Math.max(1, Math.floor(options.crossingPasses ?? DEFAULTS.crossingPasses)),
  };
  const columnKeys = new Set(inputColumns.map((column) => column.key));
  const nodes = inputNodes
    .filter((node) => columnKeys.has(node.columnKey))
    .sort(compareSemanticLayoutNodes);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = inputEdges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .sort((left, right) =>
      compareText(left.source, right.source) ||
      compareText(left.target, right.target) ||
      compareText(left.label, right.label) ||
      compareText(left.id, right.id)
    );
  const columns = inputColumns.filter((column) =>
    nodes.some((node) => node.columnKey === column.key)
  );
  const initial = new Map<string, SemanticLayoutInputNode<TNode>[]>();
  for (const column of columns) {
    initial.set(
      column.key,
      nodes.filter((node) => node.columnKey === column.key).sort(compareSemanticLayoutNodes),
    );
  }
  const ordered = minimizeCrossings(
    columns,
    initial,
    edges,
    settings.crossingPasses,
  );
  const nodeHeightOf = (node: SemanticLayoutInputNode<TNode>): number =>
    finitePositive(node.height ?? settings.nodeHeight, settings.nodeHeight);
  const columnNodesByKey = new Map(
    columns.map((column) => [column.key, ordered.get(column.key) ?? []]),
  );
  const columnStackHeight = (
    columnNodes: readonly SemanticLayoutInputNode<TNode>[],
  ): number =>
    columnNodes.reduce((sum, node) => sum + nodeHeightOf(node), 0) +
    Math.max(0, columnNodes.length - 1) * settings.nodeGap;
  const maximumCount = Math.max(1, ...columns.map((column) =>
    columnNodesByKey.get(column.key)?.length ?? 0
  ));
  const maximumStack = Math.max(
    settings.nodeHeight,
    ...columns.map((column) =>
      columnStackHeight(columnNodesByKey.get(column.key) ?? [])
    ),
  );
  const positionedNodes: SemanticPositionedNode<TNode>[] = [];
  const positionedColumns: SemanticPositionedColumn[] = [];
  let verticalCursor = settings.outerPadding + settings.headingSpace;

  for (const [columnIndex, column] of columns.entries()) {
    const columnNodes = columnNodesByKey.get(column.key) ?? [];
    const stack = columnStackHeight(columnNodes);
    if (settings.orientation === "horizontal") {
      const x = settings.outerPadding +
        columnIndex * (settings.nodeWidth + settings.columnGap);
      let cursorY = settings.outerPadding + settings.headingSpace +
        (maximumStack - stack) / 2;
      columnNodes.forEach((node) => {
        const height = nodeHeightOf(node);
        positionedNodes.push({
          ...node,
          position: { x, y: cursorY },
          width: settings.nodeWidth,
          height,
          sourcePosition: "right",
          targetPosition: "left",
        });
        cursorY += height + settings.nodeGap;
      });
      positionedColumns.push({
        key: column.key,
        title: column.title,
        nodeIds: columnNodes.map((node) => node.id),
        headingPosition: { x: x + settings.nodeWidth / 2, y: settings.outerPadding },
        bounds: {
          x,
          y: settings.outerPadding,
          width: settings.nodeWidth,
          height: settings.headingSpace + maximumStack,
        },
      });
    } else {
      const y = verticalCursor;
      const bandHeight = Math.max(
        settings.nodeHeight,
        ...columnNodes.map((node) => nodeHeightOf(node)),
      );
      const maximumRow = maximumCount * settings.nodeWidth +
        Math.max(0, maximumCount - 1) * settings.nodeGap;
      const row = columnNodes.length * settings.nodeWidth +
        Math.max(0, columnNodes.length - 1) * settings.nodeGap;
      const startX = settings.outerPadding + (maximumRow - row) / 2;
      columnNodes.forEach((node, index) => {
        const height = nodeHeightOf(node);
        positionedNodes.push({
          ...node,
          position: {
            x: startX + index * (settings.nodeWidth + settings.nodeGap),
            y: y + (bandHeight - height) / 2,
          },
          width: settings.nodeWidth,
          height,
          sourcePosition: "bottom",
          targetPosition: "top",
        });
      });
      positionedColumns.push({
        key: column.key,
        title: column.title,
        nodeIds: columnNodes.map((node) => node.id),
        headingPosition: { x: settings.outerPadding, y: y - settings.headingSpace },
        bounds: {
          x: settings.outerPadding,
          y: y - settings.headingSpace,
          width: maximumRow,
          height: settings.headingSpace + bandHeight,
        },
      });
      verticalCursor = y + bandHeight + settings.columnGap + settings.headingSpace;
    }
  }

  const positionedById = new Map(positionedNodes.map((node) => [node.id, node]));
  const positionedEdges = edges.flatMap((edge): SemanticPositionedEdge<TEdge>[] => {
    const source = positionedById.get(edge.source);
    const target = positionedById.get(edge.target);
    if (!source || !target) return [];
    const start = settings.orientation === "horizontal"
      ? { x: source.position.x + source.width, y: source.position.y + source.height / 2 }
      : { x: source.position.x + source.width / 2, y: source.position.y + source.height };
    const end = settings.orientation === "horizontal"
      ? { x: target.position.x, y: target.position.y + target.height / 2 }
      : { x: target.position.x + target.width / 2, y: target.position.y };
    return [{
      ...edge,
      points: [start, end],
      labelPosition: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    }];
  });

  const maxX = Math.max(
    settings.outerPadding,
    ...positionedNodes.map((node) => node.position.x + node.width),
  );
  const maxY = Math.max(
    settings.outerPadding,
    ...positionedNodes.map((node) => node.position.y + node.height),
  );
  return {
    orientation: settings.orientation,
    nodes: positionedNodes,
    edges: positionedEdges,
    columns: positionedColumns,
    bounds: {
      x: 0,
      y: 0,
      width: maxX + settings.outerPadding,
      height: maxY + settings.outerPadding,
    },
  };
}
