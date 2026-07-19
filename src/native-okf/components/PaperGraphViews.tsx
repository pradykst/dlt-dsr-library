"use client";

import { useState } from "react";

import type { GraphDto, PaperDesignMapDto } from "../shared/types.ts";
import { NativeOkfGraph } from "./NativeOkfGraph.tsx";
import { PaperDesignMap } from "./PaperDesignMap.tsx";

export function PaperGraphViews({
  designMap,
  graphOneHop,
  graphTwoHops,
  selectedId,
}: {
  designMap: PaperDesignMapDto;
  graphOneHop: GraphDto;
  graphTwoHops: GraphDto;
  selectedId: string;
}) {
  const [view, setView] = useState<"design" | "raw">("design");
  const buttonClass =
    "rounded-md px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-1";

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Paper graph view"
        className="inline-flex rounded-lg border border-line bg-white p-1 shadow-sm"
      >
        <button
          type="button"
          aria-pressed={view === "design"}
          className={`${buttonClass} ${
            view === "design" ? "bg-ink text-white" : "text-muted hover:bg-paper hover:text-ink"
          }`}
          onClick={() => setView("design")}
        >
          Design map
        </button>
        <button
          type="button"
          aria-pressed={view === "raw"}
          className={`${buttonClass} ${
            view === "raw" ? "bg-ink text-white" : "text-muted hover:bg-paper hover:text-ink"
          }`}
          onClick={() => setView("raw")}
        >
          Raw links
        </button>
      </div>

      {view === "design" ? (
        <PaperDesignMap map={designMap} />
      ) : (
        <div>
          <p className="mb-3 text-xs leading-5 text-muted">
            Technical relationship view: concept files and directed Markdown links, including catalogue and backlink structure.
          </p>
          <NativeOkfGraph
            graphOneHop={graphOneHop}
            graphTwoHops={graphTwoHops}
            selectedId={selectedId}
          />
        </div>
      )}
    </div>
  );
}
