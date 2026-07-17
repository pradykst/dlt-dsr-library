"use client";

import { useMemo } from "react";

import type { GraphNodeDto } from "../shared/types.ts";

export interface GraphTypeColors {
  background: string;
  border: string;
  text: string;
}

const TYPE_PALETTE: readonly GraphTypeColors[] = [
  { background: "#e8f0f7", border: "#4f6f91", text: "#29445d" },
  { background: "#eaf2eb", border: "#5f7f67", text: "#35523b" },
  { background: "#f0ecf5", border: "#77658f", text: "#4f4163" },
  { background: "#f8f0df", border: "#a77b37", text: "#694a19" },
  { background: "#f6e9e5", border: "#9a6759", text: "#653d33" },
  { background: "#e6f1f1", border: "#4f7d7d", text: "#315656" },
  { background: "#f2ece5", border: "#8a7158", text: "#5b4937" },
  { background: "#eceef5", border: "#68759b", text: "#434e70" },
];

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/** Stable producer-type color assignment without imposing a closed type list. */
export function colorsForGraphType(type: string): GraphTypeColors {
  return TYPE_PALETTE[stableHash(type) % TYPE_PALETTE.length] ?? TYPE_PALETTE[0]!;
}

interface LegendEntry {
  type: string;
  label: string;
  count: number;
}

export interface GraphLegendProps {
  nodes: readonly GraphNodeDto[];
  hiddenTypes: ReadonlySet<string>;
  onToggleType: (type: string) => void;
  onShowAll: () => void;
}

export function GraphLegend({
  nodes,
  hiddenTypes,
  onToggleType,
  onShowAll,
}: GraphLegendProps) {
  const entries = useMemo<LegendEntry[]>(() => {
    const byType = new Map<string, LegendEntry>();

    for (const node of nodes) {
      const current = byType.get(node.type);
      if (current) {
        current.count += 1;
      } else {
        byType.set(node.type, {
          type: node.type,
          label: node.typeLabel,
          count: 1,
        });
      }
    }

    return [...byType.values()].sort(
      (left, right) =>
        left.label.localeCompare(right.label) || left.type.localeCompare(right.type),
    );
  }, [nodes]);

  return (
    <fieldset className="min-w-0 border-0 p-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Concept types
        </legend>
        <button
          type="button"
          className="text-xs font-medium text-blue underline-offset-2 hover:underline disabled:cursor-default disabled:text-muted/60 disabled:no-underline"
          disabled={hiddenTypes.size === 0}
          onClick={onShowAll}
        >
          Show all
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {entries.map((entry) => {
          const colors = colorsForGraphType(entry.type);
          const active = !hiddenTypes.has(entry.type);

          return (
            <button
              key={entry.type}
              type="button"
              aria-pressed={active}
              className="inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
              style={{
                backgroundColor: active ? colors.background : "#f7f6f1",
                borderColor: active ? colors.border : "#d8d6cc",
                color: active ? colors.text : "#667085",
                opacity: active ? 1 : 0.62,
              }}
              title={`${active ? "Hide" : "Show"} ${entry.label}`}
              onClick={() => onToggleType(entry.type)}
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full border"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }}
              />
              <span>{entry.label}</span>
              <span className="font-normal opacity-70">{entry.count}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default GraphLegend;
