import {
  okfConceptTypes,
  okfGraphValidationStatuses,
  okfSourceViewDirections,
  okfSourceViewTypes,
  okfSourceViewVisualParityValues
} from "./schema.ts";

const sourceViewKeys = [
  "source_view_id", "title", "view_type", "source_reference", "layers",
  "edge_ids", "ordering", "layout"
] as const;
const sourceReferenceKeys = [
  "type", "label", "page", "caption", "validation_status",
  "validation_notes", "reviewed_by", "reviewed_at", "author_verification"
] as const;
const authorVerificationKeys = ["author_name", "verification_record"] as const;
const layerKeys = ["concept_type", "node_ids"] as const;
const orderingKeys = ["layer_order", "node_order"] as const;
const layoutKeys = [
  "direction", "preserve_source_order", "semantic_parity",
  "ordering_parity", "visual_parity"
] as const;

export type SourceViewConceptInput = {
  id?: unknown;
  concept_id?: unknown;
  paper_id?: unknown;
  type?: unknown;
};

export type SourceViewRelationInput = {
  id?: unknown;
  relation_id?: unknown;
  source?: unknown;
  source_concept_id?: unknown;
  target?: unknown;
  target_concept_id?: unknown;
  extraction_type?: unknown;
  relation_scope?: unknown;
};

export type SourceViewValidationContext = {
  paper_id: string;
  concepts: readonly SourceViewConceptInput[];
  relations: readonly SourceViewRelationInput[];
};

export type SourceViewValidationIssue = {
  code: string;
  path: string;
  message: string;
};

export type SourceViewValidationEntry = {
  source_view_id: string;
  structurally_valid: boolean;
  semantic_status: "unreviewed" | "internally_validated" | "author_verified" | "invalid";
  issues: SourceViewValidationIssue[];
};

export type SourceViewValidationResult = {
  ok: boolean;
  source_view_count: number;
  entries: SourceViewValidationEntry[];
  issues: SourceViewValidationIssue[];
};

export function validateSourceViewKeys(
  candidate: unknown,
  path = "source_view"
): SourceViewValidationIssue[] {
  const issues: SourceViewValidationIssue[] = [];
  const view = asRecord(candidate);
  exactKeys(view, sourceViewKeys, path, "SOURCE_VIEW_KEYS", issues);

  const source = asRecord(view.source_reference);
  exactKeys(source, sourceReferenceKeys, `${path}.source_reference`, "SOURCE_VIEW_REFERENCE_KEYS", issues);
  if (source.author_verification !== null) {
    exactKeys(
      asRecord(source.author_verification),
      authorVerificationKeys,
      `${path}.source_reference.author_verification`,
      "SOURCE_VIEW_AUTHOR_VERIFICATION_KEYS",
      issues
    );
  }

  const layers = Array.isArray(view.layers) ? view.layers.map(asRecord) : [];
  layers.forEach((layer, index) => {
    exactKeys(layer, layerKeys, `${path}.layers[${index}]`, "SOURCE_VIEW_LAYER_KEYS", issues);
  });
  const layerTypes = layers.map((layer) => stringValue(layer.concept_type)).filter(Boolean);

  const ordering = asRecord(view.ordering);
  exactKeys(ordering, orderingKeys, `${path}.ordering`, "SOURCE_VIEW_ORDERING_KEYS", issues);
  if (isRecord(ordering.node_order)) {
    exactDynamicKeys(
      ordering.node_order,
      layerTypes,
      `${path}.ordering.node_order`,
      "SOURCE_VIEW_NODE_ORDER_KEYS",
      issues
    );
  }

  exactKeys(asRecord(view.layout), layoutKeys, `${path}.layout`, "SOURCE_VIEW_LAYOUT_KEYS", issues);
  return issues;
}

export function validateSourceViews(
  sourceViews: unknown,
  context: SourceViewValidationContext
): SourceViewValidationResult {
  if (sourceViews == null) {
    return { ok: true, source_view_count: 0, entries: [], issues: [] };
  }
  if (!Array.isArray(sourceViews)) {
    const issue = validationIssue(
      "SOURCE_VIEWS_NOT_ARRAY",
      "source_views",
      "source_views must be an array when present."
    );
    return { ok: false, source_view_count: 0, entries: [], issues: [issue] };
  }

  const ids = new Set<string>();
  const entries = sourceViews.map((candidate, index) => {
    const path = `source_views[${index}]`;
    const row = asRecord(candidate);
    const sourceViewId = stringValue(row.source_view_id);
    const issues = validateSourceView(row, path, context);
    if (sourceViewId) {
      if (ids.has(sourceViewId)) {
        issues.push(validationIssue(
          "SOURCE_VIEW_ID_DUPLICATE",
          `${path}.source_view_id`,
          `Duplicate source_view_id ${sourceViewId}.`
        ));
      }
      ids.add(sourceViewId);
    }
    const status = asRecord(row.source_reference).validation_status;
    return {
      source_view_id: sourceViewId || `<source_views[${index}]>`,
      structurally_valid: issues.length === 0,
      semantic_status: includes(okfGraphValidationStatuses, status)
        ? status as SourceViewValidationEntry["semantic_status"]
        : "invalid" as const,
      issues
    };
  });
  const issues = entries.flatMap((entry) => entry.issues);
  return {
    ok: issues.length === 0,
    source_view_count: sourceViews.length,
    entries,
    issues
  };
}

function validateSourceView(
  view: Record<string, unknown>,
  path: string,
  context: SourceViewValidationContext
): SourceViewValidationIssue[] {
  const issues = validateSourceViewKeys(view, path);
  requiredString(view.source_view_id, `${path}.source_view_id`, "SOURCE_VIEW_ID_INVALID", issues);
  if (
    stringValue(view.source_view_id)
    && !/^[a-z0-9][a-z0-9_-]*$/i.test(stringValue(view.source_view_id))
  ) {
    issues.push(validationIssue(
      "SOURCE_VIEW_ID_UNSTABLE",
      `${path}.source_view_id`,
      "source_view_id must use only letters, digits, underscores, and hyphens."
    ));
  }
  requiredString(view.title, `${path}.title`, "SOURCE_VIEW_TITLE_INVALID", issues);
  enumValue(view.view_type, okfSourceViewTypes, `${path}.view_type`, "SOURCE_VIEW_TYPE_INVALID", issues);

  const source = asRecord(view.source_reference);
  validateSourceReference(source, `${path}.source_reference`, issues);
  if (
    includes(okfSourceViewTypes, view.view_type)
    && includes(okfSourceViewTypes, source.type)
    && view.view_type !== source.type
  ) {
    issues.push(validationIssue(
      "SOURCE_VIEW_REFERENCE_TYPE_MISMATCH",
      `${path}.source_reference.type`,
      "source_reference.type must match source_view.view_type."
    ));
  }

  const conceptById = new Map(
    context.concepts.map((concept) => [
      stringValue(concept.id) || stringValue(concept.concept_id),
      concept
    ])
  );
  const relationById = new Map(
    context.relations.map((relation) => [
      stringValue(relation.id) || stringValue(relation.relation_id),
      relation
    ])
  );

  if (!Array.isArray(view.layers) || view.layers.length === 0) {
    issues.push(validationIssue(
      "SOURCE_VIEW_LAYERS_INVALID",
      `${path}.layers`,
      "layers must be a nonempty array."
    ));
  }
  const layers = Array.isArray(view.layers) ? view.layers.map(asRecord) : [];
  const layerTypes: string[] = [];
  const nodeIds: string[] = [];
  const seenLayerTypes = new Set<string>();
  const seenNodeIds = new Set<string>();

  layers.forEach((layer, index) => {
    const layerPath = `${path}.layers[${index}]`;
    enumValue(
      layer.concept_type,
      okfConceptTypes,
      `${layerPath}.concept_type`,
      "SOURCE_VIEW_LAYER_TYPE_INVALID",
      issues
    );
    const layerType = stringValue(layer.concept_type);
    if (layerType) {
      if (seenLayerTypes.has(layerType)) {
        issues.push(validationIssue(
          "SOURCE_VIEW_LAYER_DUPLICATE",
          `${layerPath}.concept_type`,
          `Layer ${layerType} is declared more than once.`
        ));
      }
      seenLayerTypes.add(layerType);
      layerTypes.push(layerType);
    }

    if (!isNonemptyStringArray(layer.node_ids)) {
      issues.push(validationIssue(
        "SOURCE_VIEW_LAYER_NODES_INVALID",
        `${layerPath}.node_ids`,
        "node_ids must be a nonempty array of canonical concept IDs."
      ));
      return;
    }

    for (const [nodeIndex, nodeId] of (layer.node_ids as string[]).entries()) {
      const nodePath = `${layerPath}.node_ids[${nodeIndex}]`;
      nodeIds.push(nodeId);
      if (seenNodeIds.has(nodeId)) {
        issues.push(validationIssue(
          "SOURCE_VIEW_NODE_DUPLICATE",
          nodePath,
          `Node ${nodeId} appears more than once in source-view layers.`
        ));
      }
      seenNodeIds.add(nodeId);
      validateOwnedId(nodeId, context.paper_id, nodePath, "SOURCE_VIEW_NODE_PAPER_MISMATCH", issues);
      const concept = conceptById.get(nodeId);
      if (!concept) {
        issues.push(validationIssue(
          "SOURCE_VIEW_NODE_UNKNOWN",
          nodePath,
          `Node ${nodeId} is not a canonical concept.`
        ));
      } else {
        if (concept.paper_id != null && concept.paper_id !== context.paper_id) {
          issues.push(validationIssue(
            "SOURCE_VIEW_CONCEPT_PAPER_MISMATCH",
            nodePath,
            `Concept ${nodeId} does not belong to ${context.paper_id}.`
          ));
        }
        if (concept.type !== layer.concept_type) {
          issues.push(validationIssue(
            "SOURCE_VIEW_NODE_TYPE_MISMATCH",
            nodePath,
            `Node ${nodeId} has canonical type ${String(concept.type)} rather than ${layerType}.`
          ));
        }
      }
    }
  });

  if (!isStringArray(view.edge_ids)) {
    issues.push(validationIssue(
      "SOURCE_VIEW_EDGES_INVALID",
      `${path}.edge_ids`,
      "edge_ids must be an array containing only canonical relation ID strings."
    ));
  }
  const edgeIds = isStringArray(view.edge_ids) ? view.edge_ids : [];
  const seenEdgeIds = new Set<string>();
  for (const [edgeIndex, edgeId] of edgeIds.entries()) {
    const edgePath = `${path}.edge_ids[${edgeIndex}]`;
    if (!edgeId.trim()) {
      issues.push(validationIssue(
        "SOURCE_VIEW_EDGE_ID_INVALID",
        edgePath,
        "Source-view relation IDs must be nonempty."
      ));
      continue;
    }
    if (seenEdgeIds.has(edgeId)) {
      issues.push(validationIssue(
        "SOURCE_VIEW_EDGE_DUPLICATE",
        edgePath,
        `Relation ${edgeId} appears more than once.`
      ));
    }
    seenEdgeIds.add(edgeId);
    validateOwnedId(edgeId, context.paper_id, edgePath, "SOURCE_VIEW_EDGE_PAPER_MISMATCH", issues);
    const relation = relationById.get(edgeId);
    if (!relation) {
      issues.push(validationIssue(
        "SOURCE_VIEW_EDGE_UNKNOWN",
        edgePath,
        `Relation ${edgeId} is not a canonical stored relation.`
      ));
      continue;
    }
    const sourceId = stringValue(relation.source) || stringValue(relation.source_concept_id);
    const targetId = stringValue(relation.target) || stringValue(relation.target_concept_id);
    if (!seenNodeIds.has(sourceId) || !seenNodeIds.has(targetId)) {
      issues.push(validationIssue(
        "SOURCE_VIEW_EDGE_ENDPOINT_OUTSIDE_VIEW",
        edgePath,
        `Relation ${edgeId} endpoints must both be included in the source view.`
      ));
    }
    validateOwnedId(sourceId, context.paper_id, edgePath, "SOURCE_VIEW_EDGE_SOURCE_PAPER_MISMATCH", issues);
    validateOwnedId(targetId, context.paper_id, edgePath, "SOURCE_VIEW_EDGE_TARGET_PAPER_MISMATCH", issues);
    if (relation.relation_scope === "query_generated") {
      issues.push(validationIssue(
        "SOURCE_VIEW_QUERY_GENERATED_EDGE",
        edgePath,
        `Relation ${edgeId} is query-generated and cannot belong to a source view.`
      ));
    }
    if (relation.extraction_type === "inferred") {
      issues.push(validationIssue(
        "SOURCE_VIEW_INFERRED_EDGE",
        edgePath,
        `Relation ${edgeId} is inferred and cannot belong to a source view.`
      ));
    } else if (
      relation.extraction_type !== "explicit"
      && relation.extraction_type !== "explicit-in-artifact"
    ) {
      issues.push(validationIssue(
        "SOURCE_VIEW_EDGE_PROVENANCE_INVALID",
        edgePath,
        `Relation ${edgeId} must be explicit or explicit-in-artifact.`
      ));
    }
  }

  validateOrdering(
    asRecord(view.ordering),
    `${path}.ordering`,
    layers,
    layerTypes,
    nodeIds,
    issues
  );
  validateLayout(
    asRecord(view.layout),
    `${path}.layout`,
    source,
    issues
  );
  return issues;
}

function validateSourceReference(
  source: Record<string, unknown>,
  path: string,
  issues: SourceViewValidationIssue[]
) {
  enumValue(source.type, okfSourceViewTypes, `${path}.type`, "SOURCE_VIEW_REFERENCE_TYPE_INVALID", issues);
  requiredString(source.label, `${path}.label`, "SOURCE_VIEW_REFERENCE_LABEL_INVALID", issues);
  if (!Number.isInteger(source.page) || Number(source.page) < 1) {
    issues.push(validationIssue(
      "SOURCE_VIEW_REFERENCE_PAGE_INVALID",
      `${path}.page`,
      "Source-view page must be a positive one-based integer."
    ));
  }
  requiredString(source.caption, `${path}.caption`, "SOURCE_VIEW_REFERENCE_CAPTION_INVALID", issues);
  enumValue(
    source.validation_status,
    okfGraphValidationStatuses,
    `${path}.validation_status`,
    "SOURCE_VIEW_REFERENCE_STATUS_INVALID",
    issues
  );
  nullableString(source.validation_notes, `${path}.validation_notes`, "SOURCE_VIEW_REFERENCE_NOTES_INVALID", issues);
  nullableString(source.reviewed_by, `${path}.reviewed_by`, "SOURCE_VIEW_REVIEWER_INVALID", issues);
  nullableString(source.reviewed_at, `${path}.reviewed_at`, "SOURCE_VIEW_REVIEW_DATE_INVALID", issues);

  const reviewedBy = stringValue(source.reviewed_by);
  const reviewedAt = stringValue(source.reviewed_at);
  if (reviewedAt && Number.isNaN(Date.parse(reviewedAt))) {
    issues.push(validationIssue(
      "SOURCE_VIEW_REVIEW_DATE_INVALID",
      `${path}.reviewed_at`,
      "reviewed_at must be a valid ISO-compatible timestamp."
    ));
  }

  const authorVerification = source.author_verification;
  if (authorVerification !== null) {
    const author = asRecord(authorVerification);
    requiredString(author.author_name, `${path}.author_verification.author_name`, "SOURCE_VIEW_AUTHOR_NAME_INVALID", issues);
    requiredString(author.verification_record, `${path}.author_verification.verification_record`, "SOURCE_VIEW_AUTHOR_RECORD_INVALID", issues);
    if (!isRecord(authorVerification)) {
      issues.push(validationIssue(
        "SOURCE_VIEW_AUTHOR_VERIFICATION_INVALID",
        `${path}.author_verification`,
        "author_verification must be an object or null."
      ));
    }
  }

  if (source.validation_status === "unreviewed") {
    if (reviewedBy || reviewedAt || authorVerification !== null) {
      issues.push(validationIssue(
        "SOURCE_VIEW_UNREVIEWED_HAS_REVIEW_METADATA",
        path,
        "An unreviewed source view cannot carry reviewer or author-verification metadata."
      ));
    }
  } else if (source.validation_status === "internally_validated") {
    if (!reviewedBy || !reviewedAt) {
      issues.push(validationIssue(
        "SOURCE_VIEW_INTERNAL_REVIEW_METADATA_MISSING",
        path,
        "internally_validated requires reviewed_by and reviewed_at."
      ));
    }
    if (authorVerification !== null) {
      issues.push(validationIssue(
        "SOURCE_VIEW_INTERNAL_REVIEW_HAS_AUTHOR_RECORD",
        `${path}.author_verification`,
        "Internal validation must not claim author verification."
      ));
    }
  } else if (source.validation_status === "author_verified") {
    if (!reviewedBy || !reviewedAt || !isRecord(authorVerification)) {
      issues.push(validationIssue(
        "SOURCE_VIEW_AUTHOR_REVIEW_METADATA_MISSING",
        path,
        "author_verified requires reviewed_by, reviewed_at, and author_verification metadata."
      ));
    }
  }
}

function validateOrdering(
  ordering: Record<string, unknown>,
  path: string,
  layers: Record<string, unknown>[],
  layerTypes: string[],
  nodeIds: string[],
  issues: SourceViewValidationIssue[]
) {
  if (!isStringArray(ordering.layer_order)) {
    issues.push(validationIssue(
      "SOURCE_VIEW_LAYER_ORDER_INVALID",
      `${path}.layer_order`,
      "layer_order must be an array of canonical concept types."
    ));
  }
  const layerOrder = isStringArray(ordering.layer_order) ? ordering.layer_order : [];
  if (layerOrder.some((type) => !includes(okfConceptTypes, type))) {
    issues.push(validationIssue(
      "SOURCE_VIEW_LAYER_ORDER_TYPE_INVALID",
      `${path}.layer_order`,
      "layer_order contains a noncanonical concept type."
    ));
  }
  if (new Set(layerOrder).size !== layerOrder.length) {
    issues.push(validationIssue(
      "SOURCE_VIEW_LAYER_ORDER_DUPLICATE",
      `${path}.layer_order`,
      "Each declared layer must appear exactly once in layer_order."
    ));
  }
  if (!sameMembers(layerOrder, layerTypes)) {
    issues.push(validationIssue(
      "SOURCE_VIEW_LAYER_ORDER_INCOMPLETE",
      `${path}.layer_order`,
      "layer_order must contain every declared layer exactly once and no other layer."
    ));
  }

  if (!isRecord(ordering.node_order)) {
    issues.push(validationIssue(
      "SOURCE_VIEW_NODE_ORDER_INVALID",
      `${path}.node_order`,
      "node_order must be an object keyed by declared concept type."
    ));
    return;
  }
  const nodeOrder = ordering.node_order as Record<string, unknown>;
  const orderedNodes: string[] = [];
  for (const layer of layers) {
    const type = stringValue(layer.concept_type);
    const declaredIds = isStringArray(layer.node_ids) ? layer.node_ids : [];
    const orderedIds = isStringArray(nodeOrder[type]) ? nodeOrder[type] as string[] : [];
    if (!isStringArray(nodeOrder[type])) {
      issues.push(validationIssue(
        "SOURCE_VIEW_NODE_ORDER_LAYER_INVALID",
        `${path}.node_order.${type}`,
        `node_order for ${type} must be an array of canonical concept IDs.`
      ));
    }
    if (!sameOrderedValues(declaredIds, orderedIds)) {
      issues.push(validationIssue(
        "SOURCE_VIEW_NODE_ORDER_MISMATCH",
        `${path}.node_order.${type}`,
        `node_order for ${type} must include each layer node exactly once in stored source order.`
      ));
    }
    orderedNodes.push(...orderedIds);
  }
  if (new Set(orderedNodes).size !== orderedNodes.length || !sameMembers(orderedNodes, nodeIds)) {
    issues.push(validationIssue(
      "SOURCE_VIEW_NODE_ORDER_INCOMPLETE",
      `${path}.node_order`,
      "Every source-view node must appear exactly once in node_order."
    ));
  }
}

function validateLayout(
  layout: Record<string, unknown>,
  path: string,
  source: Record<string, unknown>,
  issues: SourceViewValidationIssue[]
) {
  enumValue(layout.direction, okfSourceViewDirections, `${path}.direction`, "SOURCE_VIEW_DIRECTION_INVALID", issues);
  for (const key of ["preserve_source_order", "semantic_parity", "ordering_parity"] as const) {
    if (typeof layout[key] !== "boolean") {
      issues.push(validationIssue(
        "SOURCE_VIEW_LAYOUT_FLAG_INVALID",
        `${path}.${key}`,
        `${key} must be boolean.`
      ));
    }
  }
  enumValue(
    layout.visual_parity,
    okfSourceViewVisualParityValues,
    `${path}.visual_parity`,
    "SOURCE_VIEW_VISUAL_PARITY_INVALID",
    issues
  );
  if (
    layout.visual_parity === "manually_validated"
    && (
      source.validation_status === "unreviewed"
      || !stringValue(source.reviewed_by)
      || !stringValue(source.reviewed_at)
    )
  ) {
    issues.push(validationIssue(
      "SOURCE_VIEW_VISUAL_PARITY_REVIEW_MISSING",
      `${path}.visual_parity`,
      "manually_validated visual parity requires an internally validated or author-verified review record."
    ));
  }
}

function validateOwnedId(
  id: string,
  paperId: string,
  path: string,
  code: string,
  issues: SourceViewValidationIssue[]
) {
  if (!id.startsWith(`${paperId}:`) || id.length <= paperId.length + 1) {
    issues.push(validationIssue(code, path, `${id || "<missing>"} does not belong to ${paperId}.`));
  }
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
  code: string,
  issues: SourceViewValidationIssue[]
) {
  exactDynamicKeys(value, expected, path, code, issues);
}

function exactDynamicKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
  code: string,
  issues: SourceViewValidationIssue[]
) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  const missing = wanted.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !wanted.includes(key));
  if (missing.length || extra.length) {
    issues.push(validationIssue(
      code,
      path,
      `Expected exact keys. Missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}.`
    ));
  }
}

function requiredString(
  value: unknown,
  path: string,
  code: string,
  issues: SourceViewValidationIssue[]
) {
  if (!stringValue(value)) {
    issues.push(validationIssue(code, path, "Expected a nonempty string."));
  }
}

function nullableString(
  value: unknown,
  path: string,
  code: string,
  issues: SourceViewValidationIssue[]
) {
  if (value !== null && !stringValue(value)) {
    issues.push(validationIssue(code, path, "Expected a nonempty string or null."));
  }
}

function enumValue(
  value: unknown,
  allowed: readonly unknown[],
  path: string,
  code: string,
  issues: SourceViewValidationIssue[]
) {
  if (!allowed.includes(value)) {
    issues.push(validationIssue(code, path, `${String(value)} is not allowed.`));
  }
}

function sameMembers(left: readonly string[], right: readonly string[]) {
  return left.length === right.length
    && left.every((value) => right.includes(value))
    && right.every((value) => left.includes(value));
}

function sameOrderedValues(left: readonly string[], right: readonly string[]) {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function isNonemptyStringArray(value: unknown): value is string[] {
  return isStringArray(value) && value.length > 0 && value.every((item) => item.trim());
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function includes(values: readonly unknown[], value: unknown) {
  return values.includes(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function validationIssue(
  code: string,
  path: string,
  message: string
): SourceViewValidationIssue {
  return { code, path, message };
}
