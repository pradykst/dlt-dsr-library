import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseOkfJsonBlocks,
  parseOkfLibrary,
  readOkfFrontmatter,
  readOkfYamlDocument
} from "../lib/okf/parser.ts";
import {
  getAvailableSourceViews,
  projectSourceView,
  validateProjectedFlow,
  type CanonicalFlowBundle
} from "../lib/okf/flow-projection.ts";
import type { OkfConcept, OkfRelation } from "../lib/okf/schema.ts";
import { parseOkfSourceViews } from "../lib/okf/source-view.ts";
import { validateSourceViews, type SourceViewValidationResult } from "../lib/okf/source-view-validator.ts";

export type SourceViewProjectionCheck = {
  source_view_id: string;
  projected: boolean;
  deterministic: boolean;
  projection_errors: string[];
};

export type BundleValidation = {
  paper_id: string;
  bundle: string;
  runtime: boolean;
  result: SourceViewValidationResult;
  projection_checks: SourceViewProjectionCheck[];
  projection_issues: string[];
};

export function validateAllOkfSourceViews(
  rootDir = path.join(process.cwd(), "library", "okf")
): BundleValidation[] {
  const kb = parseOkfLibrary(rootDir);
  const runtime = kb.papers.map((paper) => {
    const bundleDir = path.dirname(paper.source_file);
    const graph = readJson(path.join(bundleDir, "graph.json"));
    const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
    const relations = kb.relations.filter((relation) =>
      relation.source_concept_id.startsWith(paper.paper_id + ":")
      || relation.target_concept_id.startsWith(paper.paper_id + ":")
    );
    const result = validateSourceViews(graph.source_views, {
      paper_id: paper.paper_id,
      concepts,
      relations
    });
    const bundle: CanonicalFlowBundle = {
      paper_id: paper.paper_id,
      concepts,
      relations,
      recommended_paths: stringMatrix(graph.recommended_paths),
      source_views: paper.source_views ?? [],
      graph_source_reference: paper.graph_source_reference ?? null
    };
    const projection = validateProjectionContract(bundle, result);
    return {
      paper_id: paper.paper_id,
      bundle: path.basename(bundleDir),
      runtime: true,
      result,
      projection_checks: projection.checks,
      projection_issues: projection.issues
    };
  });

  const templateDir = path.join(rootDir, "TEMPLATE");
  if (!fs.existsSync(templateDir)) return runtime;
  const templateGraph = readJson(path.join(templateDir, "graph.json"));
  const templatePaper = readOkfFrontmatter(path.join(templateDir, "index.md"));
  const paperId = stringValue(templatePaper.paper_id);
  const conceptRecords = parseOkfJsonBlocks(path.join(templateDir, "dsr.md")).map((block) => block.value);
  const relationDocument = asRecord(readOkfYamlDocument(path.join(templateDir, "relations.yaml")));
  const relationRecords = arrayRecords(relationDocument.relations);
  const result = validateSourceViews(templateGraph.source_views, {
    paper_id: paperId,
    concepts: conceptRecords,
    relations: relationRecords
  });
  const bundle: CanonicalFlowBundle = {
    paper_id: paperId,
    concepts: normalizeTemplateConcepts(conceptRecords, paperId),
    relations: normalizeTemplateRelations(relationRecords),
    recommended_paths: stringMatrix(templateGraph.recommended_paths),
    source_views: parseOkfSourceViews(templateGraph.source_views, path.join(templateDir, "graph.json")),
    graph_source_reference: null
  };
  const projection = validateProjectionContract(bundle, result);
  return [
    ...runtime,
    {
      paper_id: paperId,
      bundle: "TEMPLATE",
      runtime: false,
      result,
      projection_checks: projection.checks,
      projection_issues: projection.issues
    }
  ];
}

export function validateProjectionContract(
  bundle: CanonicalFlowBundle,
  validation: SourceViewValidationResult
): { checks: SourceViewProjectionCheck[]; issues: string[] } {
  const issues: string[] = [];
  const structurallyValidIds = validation.entries
    .filter((entry) => entry.structurally_valid)
    .map((entry) => entry.source_view_id)
    .sort();
  const availableIds = getAvailableSourceViews(bundle)
    .map((view) => view.source_view_id)
    .sort();
  if (JSON.stringify(availableIds) !== JSON.stringify(structurallyValidIds)) {
    issues.push(
      `Runtime availability mismatch: strict validator allows [${structurallyValidIds.join(", ")}] but projector exposes [${availableIds.join(", ")}].`
    );
  }

  const sourceViewById = new Map((bundle.source_views ?? []).map((view) => [view.source_view_id, view]));
  const checks = structurallyValidIds.map((sourceViewId): SourceViewProjectionCheck => {
    const projectionErrors: string[] = [];
    let projected = false;
    let deterministic = false;
    try {
      const first = projectSourceView(bundle, sourceViewId);
      const second = projectSourceView(bundle, sourceViewId);
      projected = true;
      deterministic = JSON.stringify(first) === JSON.stringify(second);
      projectionErrors.push(...validateProjectedFlow(first));
      if (!deterministic) {
        projectionErrors.push("Repeated projection from the same canonical bundle was not deterministic.");
      }
      const declared = sourceViewById.get(sourceViewId);
      if (!declared) {
        projectionErrors.push("Projected source view is absent from the normalized runtime bundle.");
      } else {
        const declaredNodes = declared.ordering.layer_order.flatMap(
          (layer) => declared.ordering.node_order[layer] ?? []
        );
        if (JSON.stringify(first.ordered_node_ids) !== JSON.stringify(declaredNodes)) {
          projectionErrors.push("Projected node order differs from the declared source-view order.");
        }
        if (JSON.stringify(first.edges.map((edge) => edge.id)) !== JSON.stringify(declared.edge_ids)) {
          projectionErrors.push("Projected edge order or membership differs from the declared source view.");
        }
      }
      if (first.source_view_id !== sourceViewId || first.projection_source !== "source_view") {
        projectionErrors.push("Projection identity does not match the requested source view.");
      }
    } catch (error) {
      projectionErrors.push(error instanceof Error ? error.message : String(error));
    }
    if (projectionErrors.length) {
      issues.push(...projectionErrors.map((message) => `${sourceViewId}: ${message}`));
    }
    return {
      source_view_id: sourceViewId,
      projected,
      deterministic,
      projection_errors: projectionErrors
    };
  });

  return { checks, issues };
}

export function renderSourceViewValidationReport(rows: BundleValidation[]) {
  const q = String.fromCharCode(96);
  const sourceViews = rows.reduce((count, row) => count + row.result.source_view_count, 0);
  const valid = rows.reduce(
    (count, row) => count + row.result.entries.filter((entry) => entry.structurally_valid).length,
    0
  );
  const projected = rows.reduce(
    (count, row) => count + row.projection_checks.filter((entry) => entry.projected).length,
    0
  );
  const deterministic = rows.reduce(
    (count, row) => count + row.projection_checks.filter((entry) => entry.deterministic).length,
    0
  );
  const structuralIssues = rows.flatMap((row) => row.result.issues);
  const projectionIssues = rows.flatMap((row) => row.projection_issues);
  const semanticCounts = rows.flatMap((row) => row.result.entries).reduce<Record<string, number>>((counts, entry) => {
    counts[entry.semantic_status] = (counts[entry.semantic_status] || 0) + 1;
    return counts;
  }, {});
  const lines = [
    "# OKF Source View Validation Report",
    "",
    "This report separates machine-checkable structural validity from human semantic verification. A structurally valid source view is not automatically semantically validated and does not claim exact visual reproduction.",
    "",
    "## Summary",
    "",
    "- Runtime bundles: " + rows.filter((row) => row.runtime).length,
    "- TEMPLATE checked: " + (rows.some((row) => !row.runtime) ? "yes" : "no"),
    "- Source views checked: " + sourceViews,
    "- Structurally valid source views: " + valid,
    "- Source-view projections executed: " + projected,
    "- Deterministic repeated projections: " + deterministic,
    "- Structural errors: " + structuralIssues.length,
    "- Projection errors: " + projectionIssues.length,
    "- Semantic statuses: " + formatCounts(semanticCounts),
    "",
    "## Bundle results",
    "",
    "| Bundle | Paper ID | Runtime | Source views | Structurally valid | Projected | Deterministic | Semantic status |",
    "|---|---|---|---:|---:|---:|---:|---|"
  ];

  for (const row of rows) {
    const statuses = row.result.entries.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.semantic_status] = (counts[entry.semantic_status] || 0) + 1;
      return counts;
    }, {});
    lines.push("| " + row.bundle
      + " | " + row.paper_id
      + " | " + (row.runtime ? "yes" : "no")
      + " | " + row.result.source_view_count
      + " | " + row.result.entries.filter((entry) => entry.structurally_valid).length
      + " | " + row.projection_checks.filter((entry) => entry.projected).length
      + " | " + row.projection_checks.filter((entry) => entry.deterministic).length
      + " | " + formatCounts(statuses) + " |");
  }

  lines.push("", "## Structural issues", "");
  if (!structuralIssues.length) {
    lines.push("No structural source-view errors were found.");
  } else {
    for (const row of rows) {
      for (const entry of row.result.entries) {
        for (const issue of entry.issues) {
          lines.push("- " + q + row.paper_id + "/" + entry.source_view_id + q
            + " - " + q + issue.code + q + " at " + q + issue.path + q + ": " + issue.message);
        }
      }
      for (const issue of row.result.issues.filter((candidate) =>
        !row.result.entries.some((entry) => entry.issues.includes(candidate))
      )) {
        lines.push("- " + q + row.paper_id + q + " - " + q + issue.code + q
          + " at " + q + issue.path + q + ": " + issue.message);
      }
    }
  }

  lines.push("", "## Projection issues", "");
  if (!projectionIssues.length) {
    lines.push("Every structurally valid source view was projected twice, both outputs were identical, and each projected flow passed the runtime projection validator.");
  } else {
    for (const row of rows) {
      for (const issue of row.projection_issues) {
        lines.push("- " + q + row.paper_id + q + ": " + issue);
      }
    }
  }

  lines.push(
    "",
    "## Guarantees checked",
    "",
    "- Owning paper identity and fully scoped node/relation IDs.",
    "- Complete source reference and strict unknown-key rejection.",
    "- Canonical node and relation existence.",
    "- Edge endpoint inclusion.",
    "- Exact layer membership and complete stored ordering.",
    "- No duplicate nodes, edges, or source-view IDs.",
    "- No inferred or query-generated Source Figure edge.",
    "- Explicit or explicit-in-artifact relation provenance only.",
    "- Review metadata for elevated validation states.",
    "- Manual visual-parity claims require reviewer metadata.",
    "- Runtime availability matches the strict structural validator.",
    "- Each eligible view is projected twice; node order, edge membership, projection validity, and deterministic output are checked.",
    "",
    "## Semantic interpretation",
    "",
    "- " + q + "unreviewed" + q + ": structurally represented but not semantically verified by a recorded reviewer.",
    "- " + q + "internally_validated" + q + ": reviewer and timestamp are recorded.",
    "- " + q + "author_verified" + q + ": reviewer, timestamp, and author-verification record are present.",
    "- " + q + "automatic_approximation" + q + ": layout approximates the source and is not a pixel-identical reproduction.",
    ""
  );
  return lines.join("\n");
}

function normalizeTemplateConcepts(records: Record<string, unknown>[], paperId: string): OkfConcept[] {
  return records.map((record) => ({
    concept_id: stringValue(record.id),
    paper_id: paperId,
    type: record.type as OkfConcept["type"],
    dsr_layer: stringValue(record.type),
    title: stringValue(record.title),
    description: stringValue(record.description),
    body_text: "",
    evidence_ids: stringArray(record.evidence),
    tags: [],
    confidence: record.confidence as OkfConcept["confidence"],
    extraction_type: record.extraction_type as OkfConcept["extraction_type"],
    review_status: record.review_status as OkfConcept["review_status"],
    source_file: "library/okf/TEMPLATE/dsr.md"
  }));
}

function normalizeTemplateRelations(records: Record<string, unknown>[]): OkfRelation[] {
  return records.map((record) => ({
    relation_id: stringValue(record.id),
    source_concept_id: stringValue(record.source),
    target_concept_id: stringValue(record.target),
    predicate: record.predicate as OkfRelation["predicate"],
    ...(stringValue(record.evidence) ? { evidence_id: stringValue(record.evidence) } : {}),
    confidence: record.confidence as OkfRelation["confidence"],
    extraction_type: record.extraction_type as OkfRelation["extraction_type"],
    relation_scope: "paper_level",
    source_file: "library/okf/TEMPLATE/relations.yaml"
  }));
}

function readJson(file: string): Record<string, unknown> {
  return asRecord(JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")));
}

function arrayRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringMatrix(value: unknown): string[][] {
  return Array.isArray(value) ? value.map(stringArray) : [];
}

function formatCounts(counts: Record<string, number>) {
  const entries = Object.entries(counts).sort(([left], [right]) => left.localeCompare(right));
  return entries.length ? entries.map(([key, count]) => key + ": " + count).join("; ") : "none";
}

function main() {
  const rows = validateAllOkfSourceViews();
  const output = path.join(process.cwd(), "docs", "OKF_SOURCE_VIEW_VALIDATION_REPORT.md");
  fs.writeFileSync(output, renderSourceViewValidationReport(rows), "utf8");
  const structuralIssues = rows.flatMap((row) => row.result.issues);
  const projectionIssues = rows.flatMap((row) => row.projection_issues);
  console.log("runtime_papers: " + rows.filter((row) => row.runtime).length);
  console.log("source_views: " + rows.reduce((count, row) => count + row.result.source_view_count, 0));
  console.log("projected_source_views: " + rows.reduce((count, row) => count + row.projection_checks.filter((check) => check.projected).length, 0));
  console.log("deterministic_projections: " + rows.reduce((count, row) => count + row.projection_checks.filter((check) => check.deterministic).length, 0));
  console.log("structural_errors: " + structuralIssues.length);
  console.log("projection_errors: " + projectionIssues.length);
  console.log("report: " + path.relative(process.cwd(), output).replace(/\\/g, "/"));
  if (structuralIssues.length || projectionIssues.length) {
    for (const row of rows) {
      for (const issue of row.result.issues) {
        console.error(row.paper_id + " " + issue.code + " " + issue.path + ": " + issue.message);
      }
      for (const issue of row.projection_issues) {
        console.error(row.paper_id + " PROJECTION: " + issue);
      }
    }
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();