"use client";

import { Handle, Position, type NodeProps } from "reactflow";

import type { GeneratedDiagramNode as DiagramNode } from "../../shared/chat-types.ts";
import {
  GENERATED_DIAGRAM_NODE_HEIGHT,
  GENERATED_DIAGRAM_NODE_WIDTH,
  type DiagramOrientation,
} from "./diagram-layout.ts";

export interface GeneratedDiagramNodeData {
  diagramNode: DiagramNode;
  orientation: DiagramOrientation;
  dimmed: boolean;
}

function stageCaption(stage: DiagramNode["stage"]): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

export function GeneratedDiagramNodeRenderer({
  data,
  selected,
}: NodeProps<GeneratedDiagramNodeData>) {
  const { diagramNode, dimmed, orientation } = data;
  const horizontal = orientation === "horizontal";
  const targetPosition = horizontal ? Position.Left : Position.Top;
  const sourcePosition = horizontal ? Position.Right : Position.Bottom;

  return (
    <div
      aria-label={`${diagramNode.label}. ${stageCaption(diagramNode.stage)}. ${
        diagramNode.synthesis ? "Synthesis" : "Stored knowledge"
      }. ${diagramNode.sourcePaths.length} grounding source${
        diagramNode.sourcePaths.length === 1 ? "" : "s"
      }.`}
      className={`flex w-56 flex-col rounded-xl border-2 bg-white px-3.5 py-3 text-left shadow-md motion-safe:transition-[border-color,box-shadow,opacity] motion-safe:duration-150 ${
        diagramNode.synthesis
          ? "border-dashed border-purple/70"
          : "border-solid border-blue/70"
      } ${
        selected
          ? "border-ink ring-2 ring-blue/30 ring-offset-2"
          : ""
      } ${dimmed ? "opacity-40" : "opacity-100"}`}
      style={{
        width: GENERATED_DIAGRAM_NODE_WIDTH,
        height: GENERATED_DIAGRAM_NODE_HEIGHT,
      }}
    >
      <Handle
        type="target"
        position={targetPosition}
        aria-label="Incoming connection"
        className="!h-2.5 !w-2.5 !border-2 !border-slate-500 !bg-white"
      />

      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="min-w-0 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
          {stageCaption(diagramNode.stage)}
          {diagramNode.category.toLowerCase() !== diagramNode.stage
            ? ` / ${diagramNode.category}`
            : ""}
        </span>
        <span
          className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${
            diagramNode.synthesis
              ? "border-dashed border-purple/40 bg-purple/10 text-purple"
              : "border-blue/30 bg-blue/10 text-blue"
          }`}
        >
          {diagramNode.synthesis ? "Synthesis" : "Stored"}
        </span>
      </div>

      <p
        className="mt-1 line-clamp-3 min-h-0 flex-1 text-[15px] font-semibold leading-5 text-ink"
        title={diagramNode.label}
      >
        {diagramNode.label}
      </p>

      <p className="mt-0.5 text-[9px] font-medium text-muted">
        {diagramNode.sourcePaths.length} source
        {diagramNode.sourcePaths.length === 1 ? "" : "s"}
      </p>

      <Handle
        type="source"
        position={sourcePosition}
        aria-label="Outgoing connection"
        className="!h-2.5 !w-2.5 !border-2 !border-slate-500 !bg-white"
      />
    </div>
  );
}

