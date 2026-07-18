/** The lowest zoom used by the generated-diagram fit-to-all operation. */
export const GENERATED_DIAGRAM_FIT_MIN_ZOOM = 0.4;

/** The largest zoom used by the generated-diagram fit-to-all operation. */
export const GENERATED_DIAGRAM_FIT_MAX_ZOOM = 1.08;

/** Screen-space clearance retained around fitted generated diagrams. */
export const GENERATED_DIAGRAM_FIT_SCREEN_PADDING = 32;

export interface DiagramViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiagramViewportSize {
  width: number;
  height: number;
}

export interface DiagramViewportPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type DiagramViewportPaddingInput = number | DiagramViewportPadding;

export interface DiagramViewportLimits {
  minZoom?: number;
  maxZoom?: number;
}

export interface DiagramViewportTransform {
  x: number;
  y: number;
  zoom: number;
  /** The scale required before applying the configured zoom limits. */
  requiredZoom: number;
  /** False only when the safe minimum zoom prevents a very small viewport fitting. */
  contentFits: boolean;
  padding: DiagramViewportPadding;
}

const MINIMUM_DIMENSION = 1;
const FIT_TOLERANCE = 0.001;

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function positiveDimension(value: number): number {
  return Math.max(MINIMUM_DIMENSION, finiteOr(value, MINIMUM_DIMENSION));
}

function nonNegative(value: number): number {
  return Math.max(0, finiteOr(value, 0));
}

function normalizePadding(
  input: DiagramViewportPaddingInput,
): DiagramViewportPadding {
  if (typeof input === "number") {
    const value = nonNegative(input);
    return { top: value, right: value, bottom: value, left: value };
  }

  return {
    top: nonNegative(input.top),
    right: nonNegative(input.right),
    bottom: nonNegative(input.bottom),
    left: nonNegative(input.left),
  };
}

function fitPaddingToDimension(
  start: number,
  end: number,
  dimension: number,
): [number, number] {
  const combined = start + end;
  const maximumCombined = Math.max(0, dimension - MINIMUM_DIMENSION);

  if (combined <= maximumCombined || combined === 0) {
    return [start, end];
  }

  const scale = maximumCombined / combined;
  return [start * scale, end * scale];
}

function normalizeLimits(limits: DiagramViewportLimits): {
  minZoom: number;
  maxZoom: number;
} {
  const minZoom = Math.max(
    Number.EPSILON,
    finiteOr(
      limits.minZoom ?? GENERATED_DIAGRAM_FIT_MIN_ZOOM,
      GENERATED_DIAGRAM_FIT_MIN_ZOOM,
    ),
  );
  const requestedMaximum = Math.max(
    Number.EPSILON,
    finiteOr(
      limits.maxZoom ?? GENERATED_DIAGRAM_FIT_MAX_ZOOM,
      GENERATED_DIAGRAM_FIT_MAX_ZOOM,
    ),
  );

  return {
    minZoom,
    maxZoom: Math.max(minZoom, requestedMaximum),
  };
}

/**
 * Calculates the React Flow viewport transform needed to center complete
 * generated-diagram bounds inside the currently mounted canvas.
 *
 * The supplied padding is measured in screen pixels. It is reduced
 * proportionally only when a container is too small to retain one usable
 * screen pixel. The safe minimum zoom intentionally wins for such pathological
 * containers; `contentFits` reports that exceptional case to callers.
 */
export function calculateDiagramViewport(
  bounds: DiagramViewportBounds,
  viewport: DiagramViewportSize,
  padding: DiagramViewportPaddingInput,
  limits: DiagramViewportLimits = {},
): DiagramViewportTransform {
  const viewportWidth = positiveDimension(viewport.width);
  const viewportHeight = positiveDimension(viewport.height);
  const graphX = finiteOr(bounds.x, 0);
  const graphY = finiteOr(bounds.y, 0);
  const graphWidth = positiveDimension(bounds.width);
  const graphHeight = positiveDimension(bounds.height);
  const requestedPadding = normalizePadding(padding);
  const [left, right] = fitPaddingToDimension(
    requestedPadding.left,
    requestedPadding.right,
    viewportWidth,
  );
  const [top, bottom] = fitPaddingToDimension(
    requestedPadding.top,
    requestedPadding.bottom,
    viewportHeight,
  );
  const effectivePadding = { top, right, bottom, left };
  const usableWidth = Math.max(MINIMUM_DIMENSION, viewportWidth - left - right);
  const usableHeight = Math.max(MINIMUM_DIMENSION, viewportHeight - top - bottom);
  const requiredZoom = Math.min(
    usableWidth / graphWidth,
    usableHeight / graphHeight,
  );
  const { minZoom, maxZoom } = normalizeLimits(limits);
  const zoom = Math.min(maxZoom, Math.max(minZoom, requiredZoom));
  const contentWidth = graphWidth * zoom;
  const contentHeight = graphHeight * zoom;
  const contentFits =
    contentWidth <= usableWidth + FIT_TOLERANCE &&
    contentHeight <= usableHeight + FIT_TOLERANCE;
  const centeredX = left + (usableWidth - contentWidth) / 2 - graphX * zoom;
  const centeredY = top + (usableHeight - contentHeight) / 2 - graphY * zoom;
  const x = contentFits ? centeredX : Math.max(0, left - graphX * zoom);
  const y = contentFits ? centeredY : Math.max(0, top - graphY * zoom);

  return {
    x,
    y,
    zoom,
    requiredZoom,
    contentFits,
    padding: effectivePadding,
  };
}
