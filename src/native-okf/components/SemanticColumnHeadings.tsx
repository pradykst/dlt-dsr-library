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

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {columns.map((column) => {
        const x = viewport.x + column.headingPosition.x * viewport.zoom;
        const y = viewport.y + column.headingPosition.y * viewport.zoom;
        return (
          <div
            key={column.key}
            className="absolute whitespace-nowrap font-serif text-sm font-semibold text-ink"
            style={{
              left: x,
              top: y,
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
