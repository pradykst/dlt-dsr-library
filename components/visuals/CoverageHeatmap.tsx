"use client";

import { Fragment } from "react";
import { capabilityPalette } from "@/lib/colors";
import { getCapabilityCoverage, knowledgeNodes, papers } from "@/lib/knowledge";

const capabilities = knowledgeNodes.filter((node) => node.type === "capability");

export function CoverageHeatmap() {
  const coverage = getCapabilityCoverage();
  return (
    <section className="border border-line bg-white p-5 shadow-research">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-ink">Capability Coverage</h2>
          <p className="mt-1 text-sm text-muted">Cell intensity indicates whether a DLT mechanism is peripheral, supporting, or central in a paper.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>none</span>
          {[0, 1, 2, 3].map((score) => <span key={score} className="h-4 w-6 border border-line" style={{ background: capabilityPalette[score] }} />)}
          <span>central</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[980px]" style={{ gridTemplateColumns: `220px repeat(${capabilities.length}, minmax(58px, 1fr))` }}>
          <div className="border-b border-line pb-2 text-xs uppercase tracking-[0.12em] text-muted">Paper</div>
          {capabilities.map((capability) => (
            <div key={capability.id} className="border-b border-line px-1 pb-2 text-center text-[10px] leading-4 text-muted [writing-mode:vertical-rl]">
              {capability.label}
            </div>
          ))}
          {papers.map((paper) => (
            <Fragment key={paper.id}>
              <div key={`${paper.id}-label`} className="border-b border-line py-2 pr-3 text-sm font-medium text-ink">{paper.shortTitle}</div>
              {capabilities.map((capability) => {
                const item = coverage[paper.id]?.[capability.id];
                const score = item?.score ?? 0;
                return (
                  <div key={`${paper.id}-${capability.id}`} title={item?.note ?? "No direct coverage"} className="border-b border-line p-1">
                    <div className="h-8 border border-white/70" style={{ background: capabilityPalette[score] }} />
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
