"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  type XYPosition,
} from "reactflow";

import {
  straightLineMidpoint,
  straightLinePath,
} from "./straight-edge.ts";

export { straightLineMidpoint, straightLinePath };
export interface StraightFlowEdgeData {
  points: readonly [XYPosition, XYPosition];
  label: string;
  labelPoint?: XYPosition;
  showLabel: boolean;
  highlighted: boolean;
  dimmed: boolean;
}


export function StraightFlowEdge({
  data,
  markerEnd,
  style,
}: EdgeProps<StraightFlowEdgeData>) {
  if (!data) return null;
  const path = straightLinePath(data.points);
  if (!path) return null;
  const labelPoint = data.labelPoint ?? straightLineMidpoint(data.points);
  const stroke = data.highlighted ? "#1f5f8b" : "#64748b";
  const opacity = data.dimmed ? 0.18 : 1;

  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        interactionWidth={16}
        style={{
          ...style,
          stroke,
          strokeWidth: data.highlighted ? 2.25 : 1.5,
          strokeLinecap: "round",
          opacity,
        }}
      />
      {data.showLabel && data.label.trim() !== "" ? (
        <EdgeLabelRenderer>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-10 max-w-28 -translate-x-1/2 -translate-y-1/2 rounded border border-line bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold leading-4 text-slate-700 shadow-sm"
            style={{
              transform: `translate(-50%, -50%) translate(${labelPoint.x}px, ${labelPoint.y}px)`,
              opacity,
            }}
          >
            {data.label}
          </span>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
