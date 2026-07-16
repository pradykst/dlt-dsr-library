import fs from "node:fs";
import {
  okfConceptTypes,
  okfGraphValidationStatuses,
  okfSourceViewDirections,
  okfSourceViewTypes,
  okfSourceViewVisualParityValues,
  type OkfConceptType,
  type OkfSourceView,
  type OkfValidationWarning
} from "./schema.ts";
import { validateSourceViewKeys } from "./source-view-validator.ts";

export type OkfGraphWithSourceViews = {
  paper_id?: string;
  source_views?: unknown;
  [key: string]: unknown;
};

export function readOkfSourceViews(
  graphFile: string,
  warnings: OkfValidationWarning[] = []
): OkfSourceView[] {
  let graph: OkfGraphWithSourceViews;
  try {
    graph = asRecord(JSON.parse(fs.readFileSync(graphFile, "utf8").replace(/^\uFEFF/, "")));
  } catch (error) {
    warnings.push({
      file: graphFile,
      message: `graph.json is invalid JSON: ${error instanceof Error ? error.message : String(error)}.`
    });
    return [];
  }
  return parseOkfSourceViews(graph.source_views, graphFile, warnings);
}

export function parseOkfSourceViews(
  value: unknown,
  file = "graph.json",
  warnings: OkfValidationWarning[] = []
): OkfSourceView[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    warnings.push({ file, message: "graph.json source_views must be an array when present." });
    return [];
  }

  return value.flatMap((candidate, index) => {
    const keyIssues = validateSourceViewKeys(candidate, `source_views[${index}]`);
    if (keyIssues.length) {
      warnings.push({
        file,
        message: `graph.json source_views[${index}] has noncanonical machine keys and was not loaded: ${keyIssues.map((issue) => `${issue.code} at ${issue.path}`).join("; ")}.`
      });
      return [];
    }
    const view = parseSourceView(candidate);
    if (!view) {
      warnings.push({ file, message: `graph.json source_views[${index}] is malformed and was not loaded.` });
      return [];
    }
    return [view];
  });
}

export function getSourceViewNodeIds(sourceView: OkfSourceView): string[] {
  return sourceView.layers.flatMap((layer) => layer.node_ids);
}

export function getSourceViewById(
  sourceViews: readonly OkfSourceView[],
  sourceViewId: string
): OkfSourceView | undefined {
  return sourceViews.find((sourceView) => sourceView.source_view_id === sourceViewId);
}

export function getSourceViewLayer(
  sourceView: OkfSourceView,
  conceptType: OkfConceptType
) {
  return sourceView.layers.find((layer) => layer.concept_type === conceptType);
}

function parseSourceView(value: unknown): OkfSourceView | undefined {
  const row = asRecord(value);
  const source = asRecord(row.source_reference);
  const ordering = asRecord(row.ordering);
  const layout = asRecord(row.layout);
  const authorVerification = asRecord(source.author_verification);
  const layers = Array.isArray(row.layers)
    ? row.layers.map(asRecord)
    : [];
  const layerOrder = stringArray(ordering.layer_order);
  const nodeOrderRecord = asRecord(ordering.node_order);

  if (
    !nonempty(row.source_view_id)
    || !nonempty(row.title)
    || !includes(okfSourceViewTypes, row.view_type)
    || !includes(okfSourceViewTypes, source.type)
    || !nonempty(source.label)
    || !positiveInteger(source.page)
    || !nonempty(source.caption)
    || !includes(okfGraphValidationStatuses, source.validation_status)
    || !Array.isArray(row.layers)
    || !Array.isArray(row.edge_ids)
    || !Array.isArray(ordering.layer_order)
    || !isRecord(ordering.node_order)
    || !includes(okfSourceViewDirections, layout.direction)
    || typeof layout.preserve_source_order !== "boolean"
    || typeof layout.semantic_parity !== "boolean"
    || typeof layout.ordering_parity !== "boolean"
    || !includes(okfSourceViewVisualParityValues, layout.visual_parity)
  ) return undefined;

  if (layers.some((layer) =>
    !includes(okfConceptTypes, layer.concept_type)
    || !Array.isArray(layer.node_ids)
    || stringArray(layer.node_ids).length !== layer.node_ids.length
  )) return undefined;

  if (
    layerOrder.some((type) => !includes(okfConceptTypes, type))
    || Object.values(nodeOrderRecord).some((ids) =>
      !Array.isArray(ids) || stringArray(ids).length !== ids.length
    )
    || stringArray(row.edge_ids).length !== row.edge_ids.length
  ) return undefined;

  if (source.author_verification != null && (
    !nonempty(authorVerification.author_name)
    || !nonempty(authorVerification.verification_record)
  )) return undefined;

  return {
    source_view_id: String(row.source_view_id),
    title: String(row.title),
    view_type: row.view_type as OkfSourceView["view_type"],
    source_reference: {
      type: source.type as OkfSourceView["source_reference"]["type"],
      label: String(source.label),
      page: Number(source.page),
      caption: String(source.caption),
      validation_status: source.validation_status as OkfSourceView["source_reference"]["validation_status"],
      validation_notes: nullableString(source.validation_notes),
      reviewed_by: nullableString(source.reviewed_by),
      reviewed_at: nullableString(source.reviewed_at),
      author_verification: source.author_verification == null
        ? null
        : {
            author_name: String(authorVerification.author_name),
            verification_record: String(authorVerification.verification_record)
          }
    },
    layers: layers.map((layer) => ({
      concept_type: layer.concept_type as OkfConceptType,
      node_ids: stringArray(layer.node_ids)
    })),
    edge_ids: stringArray(row.edge_ids),
    ordering: {
      layer_order: layerOrder as OkfConceptType[],
      node_order: Object.fromEntries(
        Object.entries(nodeOrderRecord).map(([key, ids]) => [key, stringArray(ids)])
      ) as OkfSourceView["ordering"]["node_order"]
    },
    layout: {
      direction: layout.direction as OkfSourceView["layout"]["direction"],
      preserve_source_order: layout.preserve_source_order as boolean,
      semantic_parity: layout.semantic_parity as boolean,
      ordering_parity: layout.ordering_parity as boolean,
      visual_parity: layout.visual_parity as OkfSourceView["layout"]["visual_parity"]
    }
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : [];
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function includes(values: readonly unknown[], value: unknown) {
  return values.includes(value);
}
