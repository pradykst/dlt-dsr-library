"use client";

import { Handle, Position, type NodeProps } from "reactflow";

import type { GeneratedDiagramNode as DiagramNode } from "../../shared/chat-types.ts";
import { equivalentSemanticLabels } from "../../shared/presentation.ts";
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
  return stage
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function provenanceCaption(node: DiagramNode): string {
  if (node.provenance === "user-provided") return "User-provided";
  if (node.provenance === "synthesized") return "Synthesized";
  return "Stored";
}

function semanticClass(stage: DiagramNode["stage"]): string {
  if (
    ["design-goal", "design-objective", "meta-requirement", "design-requirement", "requirements"].includes(stage)
  ) {
    return "bg-purple/5";
  }
  if (["design-principle", "principles"].includes(stage)) {
    return "bg-emerald-50/70";
  }
  if (["design-feature", "features"].includes(stage)) {
    return "bg-amber-50/80";
  }
  if (stage === "artifact") return "bg-blue/5";
  if (stage === "evaluation" || stage === "outcome") return "bg-slate-50";
  return "bg-white";
}

function provenanceBorder(node: DiagramNode): string {
  if (node.provenance === "user-provided") {
    return "border-double border-slate-600";
  }
  if (node.provenance === "synthesized") {
    return "border-dashed border-purple/70";
  }
  return "border-solid border-blue/70";
}

export function GeneratedDiagramNodeRenderer({
  data,
  selected,
}: NodeProps<GeneratedDiagramNodeData>) {
  const { diagramNode, dimmed, orientation } = data;
  const horizontal = orientation === "horizontal";
  const targetPosition = horizontal ? Position.Left : Position.Top;
  const sourcePosition = horizontal ? Position.Right : Position.Bottom;
  const provenance = provenanceCaption(diagramNode);

  return (
    <div
      aria-label={`${diagramNode.label}. ${stageCaption(diagramNode.stage)}. ${provenance}. ${
        diagramNode.provenance === "user-provided"
          ? "Provided in the research question."
          : `${diagramNode.sourcePaths.length} grounding source${diagramNode.sourcePaths.length === 1 ? "" : "s"}.`
      }`}
      className={`flex w-56 flex-col rounded-xl border-2 px-3.5 py-3 text-left shadow-md motion-safe:transition-[border-color,box-shadow,opacity] motion-safe:duration-150 ${semanticClass(
        diagramNode.stage,
      )} ${provenanceBorder(diagramNode)} ${
        selected ? "border-ink ring-2 ring-blue/30 ring-offset-2" : ""
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
          {!equivalentSemanticLabels(diagramNode.category, diagramNode.stage)
            ? ` / ${diagramNode.category}`
            : ""}
        </span>
        <span
          className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${
            diagramNode.provenance === "synthesized"
              ? "border-dashed border-purple/40 bg-purple/10 text-purple"
              : diagramNode.provenance === "user-provided"
                ? "border-double border-slate-500 bg-slate-100 text-slate-700"
                : "border-blue/30 bg-blue/10 text-blue"
          }`}
        >
          {provenance}
        </span>
      </div>

      <p
        className="mt-1 line-clamp-3 min-h-0 flex-1 text-[15px] font-semibold leading-5 text-ink"
        title={diagramNode.label}
      >
        {diagramNode.label}
      </p>

      <p className="mt-0.5 text-[9px] font-medium text-muted">
        {diagramNode.provenance === "user-provided"
          ? "Provided in question"
          : `${diagramNode.sourcePaths.length} source${diagramNode.sourcePaths.length === 1 ? "" : "s"}`}
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
