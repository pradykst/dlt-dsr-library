import type { DesignFlowExtraction, DsrField } from "@/lib/ingest/parser-types";

export const ingestFlowStages: Array<{ key: keyof Omit<DesignFlowExtraction, "edges">; label: string; color: string }> = [
  { key: "problems", label: "Problem", color: "#9b636d" },
  { key: "requirements", label: "Requirements", color: "#77658f" },
  { key: "principles", label: "Design principles", color: "#5f7f67" },
  { key: "features", label: "Design features", color: "#a77b37" },
  { key: "artifacts", label: "Artifact", color: "#4d7a84" },
  { key: "evaluations", label: "Evaluation", color: "#77766f" },
  { key: "patterns", label: "Reusable pattern", color: "#6f8a5d" }
];

export function allFlowFields(flow: DesignFlowExtraction): DsrField[] {
  return ingestFlowStages.flatMap((stage) => flow[stage.key]);
}
