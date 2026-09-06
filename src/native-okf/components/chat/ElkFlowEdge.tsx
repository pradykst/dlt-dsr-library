"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  type XYPosition,
} from "reactflow";

export interface ElkFlowEdgeData {
  points: XYPosition[];
  label: string;
  labelPoint?: XYPosition;
  showLabel: boolean;
  highlighted: boolean;
  dimmed: boolean;
  /** Legacy provenance-based dashing (stored/comparative maps). */
  dashed: boolean;
  /**
   * SECONDARY dependency relationship ("depends on" / "interoperates with").
   * Rendered as a thin dotted amber line so the primary design flow visually
   * dominates.
   */
  secondary: boolean;
}

function finitePoint(point: XYPosition): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

export function orthogonalPolylinePath(points: readonly XYPosition[]): string {
  const finite = points.filter(finitePoint);
  if (finite.length === 0) return "";
  return finite
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

export function polylineMidpoint(points: readonly XYPosition[]): XYPosition {
  const finite = points.filter(finitePoint);
  if (finite.length === 0) return { x: 0, y: 0 };
  if (finite.length === 1) return { ...finite[0]! };

  const segments = finite.slice(1).map((point, index) => {
    const previous = finite[index]!;
    return {
      start: previous,
      end: point,
      length: Math.hypot(point.x - previous.x, point.y - previous.y),
    };
  });
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  if (total === 0) return { ...finite[0]! };

  const target = total / 2;
  let travelled = 0;
  for (const segment of segments) {
    if (travelled + segment.length >= target) {
      const ratio = (target - travelled) / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        y: segment.start.y + (segment.end.y - segment.start.y) * ratio,
      };
    }
    travelled += segment.length;
  }

  return { ...finite[finite.length - 1]! };
}


export function ElkFlowEdge({
  data,
  markerEnd,
  style,
}: EdgeProps<ElkFlowEdgeData>) {
  if (!data) return null;

  const path = orthogonalPolylinePath(data.points);
  if (!path) return null;

  const labelPoint = data.labelPoint ?? polylineMidpoint(data.points);
  const stroke = data.secondary
    ? (data.highlighted ? "#b45309" : "#d97706")
    : (data.highlighted ? "#1f5f8b" : "#64748b");
  const opacity = data.dimmed ? 0.18 : 1;
  const shouldShowLabel = data.showLabel && data.label.length > 0;
  const strokeDasharray = data.secondary
    ? "2 4"
    : data.dashed
      ? "7 5"
      : undefined;

  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        interactionWidth={16}
        style={{
          ...style,
          stroke,
          strokeWidth: data.highlighted ? 2.25 : data.secondary ? 1.1 : 1.6,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeDasharray,
          opacity,
        }}
      />
      {shouldShowLabel ? (
        <EdgeLabelRenderer>
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute z-10 max-w-32 -translate-x-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-4 shadow-sm ${
              data.secondary
                ? "border-amber-300 bg-amber-50/95 text-amber-800"
                : "border-line bg-white/95 text-slate-700"
            }`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelPoint.x}px, ${labelPoint.y}px)`,
              opacity,
            }}
          >
            {data.secondary ? `⇢ ${data.label}` : data.label}
          </span>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
