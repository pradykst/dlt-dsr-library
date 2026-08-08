"use client";

import { useViewport } from "reactflow";

import type { SemanticPositionedColumn } from "./semantic-column-layout.ts";

export function SemanticColumnHeadings({
  columns,
  orientation,
}: {
  columns: readonly SemanticPositionedColumn[];
  orientation: "horizontal" | "vertical";
}) {
  const viewport = useViewport();
  const horizontalCenters = columns.map(
    (column) => viewport.x + column.headingPosition.x * viewport.zoom,
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {columns.map((column, index) => {
        const x = viewport.x + column.headingPosition.x * viewport.zoom;
        const y = viewport.y + column.headingPosition.y * viewport.zoom;
        const previousGap = index > 0
          ? x - horizontalCenters[index - 1]
          : Number.POSITIVE_INFINITY;
        const nextGap = index < horizontalCenters.length - 1
          ? horizontalCenters[index + 1] - x
          : Number.POSITIVE_INFINITY;
        const nearestGap = Math.min(previousGap, nextGap);
        const availableWidth = Number.isFinite(nearestGap)
          ? Math.max(48, nearestGap - 4)
          : undefined;
        const fittedFontSize = Math.max(
          9,
          Math.min(14, 8 + viewport.zoom * 6),
        );
        return (
          <div
            key={column.key}
            className="absolute overflow-hidden text-ellipsis whitespace-nowrap font-serif font-semibold text-ink"
            style={{
              left: x,
              top: y,
              fontSize: orientation === "horizontal" ? fittedFontSize : undefined,
              maxWidth: orientation === "horizontal" ? availableWidth : undefined,
              transform: orientation === "horizontal" ? "translateX(-50%)" : undefined,
              transformOrigin: "top left",
            }}
          >
            {column.title}
          </div>
        );
      })}
    </div>
  );
}
