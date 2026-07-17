import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseOkfLibrary, readOkfYamlDocument } from "../lib/okf/parser.ts";
import { validateSourceViews, type SourceViewValidationEntry, type SourceViewValidationIssue } from "../lib/okf/source-view-validator.ts";

export type SourceViewAuditPaper = {
  paper_id: string;
  slug: string;
  source_references: string[];
  source_reference_gaps: Array<{
    reference: string;
    mapped_source_view_ids: string[];
    gap: boolean;
  }>;
  root_validation_issues: SourceViewValidationIssue[];
  source_view_count: number;
  node_counts_by_layer: Record<string, number>;
  edge_count: number;
  relation_provenance: Record<string, number>;
  missing_node_references: number;
  missing_edge_references: number;
  inferred_edges: number;
  unresolved_aliases: number;
  source_order_complete: boolean;
  structurally_valid_source_views: number;
  semantic_statuses: Record<string, number>;
  requires_manual_transcription: boolean;
  entries: SourceViewValidationEntry[];
  source_view_inventories: Array<{
    source_view_id: string;
    title: string;
    source_reference: string;
    caption: string;
    ordered_nodes_by_layer: Array<{
      layer: string;
      node_ids: string[];
    }>;
    edges: Array<{
      relation_id: string;
      source: string;
      target: string;
      provenance: string;
      evidence_id: string | null;
      exists_in_relations: boolean;
    }>;
  }>;
};

export type SourceViewAudit = {
  papers: SourceViewAuditPaper[];
  root_issues: Array<{ file: string; message: string }>;
  totals: {
    papers: number;
    source_views: number;
    structurally_valid_source_views: number;
    papers_with_source_references_without_source_views: number;
    papers_requiring_manual_transcription: number;
  };
};

export function auditOkfSourceViews(rootDir = path.join(process.cwd(), "library", "okf")): SourceViewAudit {
  const kb = parseOkfLibrary(rootDir);
  const papers = kb.papers.map((paper) => {
    const bundleDir = path.dirname(paper.source_file);
    const graph = readJson(path.join(bundleDir, "graph.json"));
    const rawViews = arrayRecords(graph.source_views);
    const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
    const relations = kb.relations.filter((relation) =>
      relation.source_concept_id.startsWith(paper.paper_id + ":")
      || relation.target_concept_id.startsWith(paper.paper_id + ":")
    );
    const validation = validateSourceViews(graph.source_views, {
      paper_id: paper.paper_id,
      concepts,
      relations
    });
    const edgeIds = rawViews.flatMap((view) => stringArray(view.edge_ids));
    const relationById = new Map(relations.map((relation) => [relation.relation_id, relation]));
    const sourceViewInventories = rawViews.map((view) => {
      const source = asRecord(view.source_reference);
      const ordering = asRecord(view.ordering);
      const nodeOrder = asRecord(ordering.node_order);
      const layerOrder = stringArray(ordering.layer_order);
      return {
        source_view_id: stringValue(view.source_view_id),
        title: stringValue(view.title),
        source_reference: formatReference(source),
        caption: stringValue(source.caption),
        ordered_nodes_by_layer: layerOrder.map((layer) => ({
          layer,
          node_ids: stringArray(nodeOrder[layer])
        })),
        edges: stringArray(view.edge_ids).map((relationId) => {
          const relation = relationById.get(relationId);
          return {
            relation_id: relationId,
            source: relation?.source_concept_id ?? "<missing>",
            target: relation?.target_concept_id ?? "<missing>",
            provenance: relation?.extraction_type ?? "missing",
            evidence_id: relation?.evidence_id ?? null,
            exists_in_relations: Boolean(relation)
          };
        })
      };
    });
    const nodeCountsByLayer: Record<string, number> = {};
    for (const view of rawViews) {
      for (const layer of arrayRecords(view.layers)) {
        const type = stringValue(layer.concept_type) || "<invalid>";
        nodeCountsByLayer[type] = (nodeCountsByLayer[type] || 0) + stringArray(layer.node_ids).length;
      }
    }
    const relationProvenance: Record<string, number> = {};
    for (const edgeId of edgeIds) {
      const provenance = relationById.get(edgeId)?.extraction_type || "missing";
      relationProvenance[provenance] = (relationProvenance[provenance] || 0) + 1;
    }
    const sourceReferences = collectSourceReferences(graph, paper.paper_id, kb);
    const sourceReferenceGaps = sourceReferences.map((reference) => {
      const referenceKey = normalizeReferenceLabel(reference);
      const mappedSourceViewIds = rawViews
        .filter((view) => normalizeReferenceLabel(formatReference(asRecord(view.source_reference))) === referenceKey)
        .map((view) => stringValue(view.source_view_id))
        .filter(Boolean)
        .sort();
      return {
        reference,
        mapped_source_view_ids: mappedSourceViewIds,
        gap: mappedSourceViewIds.length === 0
      };
    });
    const rootValidationIssues = validation.issues.filter((issue) =>
      !validation.entries.some((entry) => entry.issues.includes(issue))
    );
    const aliases = readAliases(path.join(bundleDir, "aliases.yaml"));
    const conceptIds = new Set(concepts.map((concept) => concept.concept_id));
    const unresolvedAliases = aliases.filter((alias) => {
      const target = stringValue(alias.target_id);
      return target !== paper.paper_id && !conceptIds.has(target);
    }).length;
    const issueCodes = validation.issues.map((issue) => issue.code);
    const semanticStatuses = validation.entries.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.semantic_status] = (counts[entry.semantic_status] || 0) + 1;
      return counts;
    }, {});
    const requiresManualTranscription = sourceReferenceGaps.some((entry) => entry.gap)
      || rootValidationIssues.length > 0
      || validation.entries.some((entry) => !entry.structurally_valid || entry.semantic_status === "unreviewed");

    return {
      paper_id: paper.paper_id,
      slug: paper.slug,
      source_references: sourceReferences,
      source_reference_gaps: sourceReferenceGaps,
      root_validation_issues: rootValidationIssues,
      source_view_count: rawViews.length,
      node_counts_by_layer: nodeCountsByLayer,
      edge_count: edgeIds.length,
      relation_provenance: relationProvenance,
      missing_node_references: issueCodes.filter((code) => code === "SOURCE_VIEW_NODE_UNKNOWN").length,
      missing_edge_references: issueCodes.filter((code) => code === "SOURCE_VIEW_EDGE_UNKNOWN").length,
      inferred_edges: issueCodes.filter((code) =>
        code === "SOURCE_VIEW_INFERRED_EDGE" || code === "SOURCE_VIEW_QUERY_GENERATED_EDGE"
      ).length,
      unresolved_aliases: unresolvedAliases,
      source_order_complete: !issueCodes.some((code) => code.includes("ORDER")),
      structurally_valid_source_views: validation.entries.filter((entry) => entry.structurally_valid).length,
      semantic_statuses: semanticStatuses,
      requires_manual_transcription: requiresManualTranscription,
      entries: validation.entries,
      source_view_inventories: sourceViewInventories
    };
  });

  return {
    papers,
    root_issues: kb.warnings.map((warning) => ({ file: warning.file, message: warning.message })),
    totals: {
      papers: papers.length,
      source_views: sum(papers.map((paper) => paper.source_view_count)),
      structurally_valid_source_views: sum(papers.map((paper) => paper.structurally_valid_source_views)),
      papers_with_source_references_without_source_views: papers.filter((paper) =>
        paper.source_references.length > 0 && paper.source_view_count === 0
      ).length,
      papers_requiring_manual_transcription: papers.filter((paper) => paper.requires_manual_transcription).length
    }
  };
}

export function renderSourceViewAudit(audit: SourceViewAudit): string {
  const q = String.fromCharCode(96);
  const sourceViewRelationCount = sum(audit.papers.map((paper) => paper.edge_count));
  const explicitArtifactRelationCount = sum(audit.papers.map((paper) => paper.relation_provenance["explicit-in-artifact"] ?? 0));
  const lines = [
    "# OKF Source View Audit",
    "",
    "This report inventories formal figure/table references and optional canonical " + q + "source_views" + q + ". Structural validity is not semantic human verification. Legacy CSV data is a comparison source only and is never promoted to canonical truth by this audit.",
    "",
    "## Summary",
    "",
    "- Runtime papers: " + audit.totals.papers,
    "- Canonical source views: " + audit.totals.source_views,
    "- Structurally valid source views: " + audit.totals.structurally_valid_source_views,
    "- Papers with a figure/table reference but no exact source view: " + audit.totals.papers_with_source_references_without_source_views,
    "- Papers requiring manual transcription or semantic review: " + audit.totals.papers_requiring_manual_transcription,
    "- Existing canonical relations referenced by source views: " + sourceViewRelationCount,
    "- Source-view relations marked explicit-in-artifact: " + explicitArtifactRelationCount,
    "- Canonical relations synthesized or added by projection: 0",
    "- Parser/root-level issues: " + audit.root_issues.length,
    "",
    "No source view is generated from recommended paths, all relations, PDF proximity, or legacy CSV. A paper without a complete curated mapping exposes Recommended Flow and Full Relations only.",
    "",
    "## Per-paper inventory",
    "",
    "| Paper ID | Referenced sources | Reference gaps | Source views | Nodes by layer | Edges | Provenance | Structural result | Semantic state | Manual work |",
    "|---|---|---:|---:|---|---:|---|---|---|---|"
  ];

  for (const paper of audit.papers) {
    lines.push("| " + escapeTable(paper.paper_id)
      + " | " + escapeTable(paper.source_references.join("; ") || "None recorded")
      + " | " + paper.source_reference_gaps.filter((entry) => entry.gap).length
      + " | " + paper.source_view_count
      + " | " + escapeTable(formatCounts(paper.node_counts_by_layer))
      + " | " + paper.edge_count
      + " | " + escapeTable(formatCounts(paper.relation_provenance))
      + " | " + paper.structurally_valid_source_views + "/" + paper.source_view_count + " valid"
      + " | " + escapeTable(formatCounts(paper.semantic_statuses))
      + " | " + (paper.requires_manual_transcription ? "Required" : "None structurally indicated") + " |");
  }

  lines.push("", "## Detailed validation", "");
  for (const paper of audit.papers) {
    lines.push("### " + paper.paper_id, "");
    lines.push("- Bundle: " + q + paper.slug + q);
    lines.push("- Figure/table references: " + (paper.source_references.join("; ") || "None recorded"));
    lines.push("- Per-reference coverage:");
    if (!paper.source_reference_gaps.length) {
      lines.push("  - No formal figure/table reference was detected.");
    } else {
      for (const reference of paper.source_reference_gaps) {
        lines.push("  - " + q + reference.reference + q + ": " + (reference.gap
          ? "gap - no complete canonical source_view mapping is recorded."
          : "mapped by " + reference.mapped_source_view_ids.map((id) => q + id + q).join(", ") + "."));
      }
    }
    lines.push("- Root-level source-view validation issues: " + paper.root_validation_issues.length);
    for (const issue of paper.root_validation_issues) {
      lines.push("  - " + q + issue.code + q + " at " + q + issue.path + q + ": " + issue.message);
    }
    lines.push("- Source views: " + paper.source_view_count);
    lines.push("- Missing node references: " + paper.missing_node_references);
    lines.push("- Missing edge references: " + paper.missing_edge_references);
    lines.push("- Inferred/query-generated edges incorrectly included: " + paper.inferred_edges);
    lines.push("- Unresolved aliases: " + paper.unresolved_aliases);
    lines.push("- Source-order completeness: " + (paper.source_order_complete ? "Complete for declared source views" : "Incomplete"));
    if (!paper.entries.length) {
      lines.push("- Result: no exact source view is currently curated.");
    } else {
      for (const entry of paper.entries) {
        lines.push("- " + q + entry.source_view_id + q + ": "
          + (entry.structurally_valid ? "structurally valid" : "structurally invalid")
          + "; semantic status " + q + entry.semantic_status + q + ".");
        for (const issue of entry.issues) {
          lines.push("  - " + q + issue.code + q + " at " + q + issue.path + q + ": " + issue.message);
        }
      }
    }
    for (const inventory of paper.source_view_inventories) {
      lines.push("", "#### " + inventory.title, "");
      lines.push("- Source view ID: " + q + inventory.source_view_id + q);
      lines.push("- Source: " + inventory.source_reference);
      lines.push("- Caption: " + inventory.caption);
      lines.push("- Candidate node inventory and stored source order:");
      for (const layer of inventory.ordered_nodes_by_layer) {
        lines.push("  - " + layer.layer + ": " + layer.node_ids.map((id) => q + id + q).join(", "));
      }
      lines.push("- Candidate edge inventory (all must already exist as canonical relations):");
      for (const edge of inventory.edges) {
        lines.push("  - " + q + edge.relation_id + q + ": "
          + q + edge.source + q + " -> " + q + edge.target + q
          + "; provenance " + q + edge.provenance + q
          + "; evidence " + (edge.evidence_id ? q + edge.evidence_id + q : "none")
          + "; canonical relation exists: " + (edge.exists_in_relations ? "yes" : "no") + ".");
      }
      lines.push("- Runtime projection adds no relations; this source view references canonical relation IDs only.");
      lines.push("- Remaining provenance correction needed: "
        + (inventory.edges.some((edge) => edge.provenance !== "explicit" && edge.provenance !== "explicit-in-artifact")
          ? "yes; inspect the listed relation provenance."
          : "none."));
    }
    if (paper.requires_manual_transcription) {
      lines.push("- Manual action: " + (paper.source_view_count
        ? "independently review the curated mapping before elevating its semantic validation status."
        : "inspect the source figure/table and transcribe only complete, visibly supported canonical nodes and relations; otherwise leave Source Figure unavailable."));
    }
    lines.push("");
  }

  lines.push("## Parser/root-level issues", "");
  if (!audit.root_issues.length) {
    lines.push("No parser-level OKF issues were reported while constructing the audit inventory.", "");
  } else {
    for (const issue of audit.root_issues) {
      lines.push("- " + q + issue.file + q + ": " + issue.message);
    }
    lines.push("");
  }

  lines.push(
    "## Interpretation",
    "",
    "- Structurally valid means the mapping obeys the canonical schema and references stored concepts/relations.",
    "- Unreviewed means semantic parity has not been established by a recorded human reviewer.",
    "- Internal validation and author verification require explicit reviewer metadata.",
    "- Automatic approximation describes layout only; it is not exact visual reproduction.",
    ""
  );
  return lines.join("\n");
}

function collectSourceReferences(
  graph: Record<string, unknown>,
  paperId: string,
  kb: ReturnType<typeof parseOkfLibrary>
) {
  const references = new Set<string>();
  const graphSource = asRecord(graph.source_reference);
  if (graphSource.type === "paper_figure" || graphSource.type === "paper_table") {
    references.add(formatReference(graphSource));
  }
  for (const sourceView of arrayRecords(graph.source_views)) {
    const source = asRecord(sourceView.source_reference);
    if (source.type === "paper_figure" || source.type === "paper_table") references.add(formatReference(source));
  }
  const pattern = /\b(?:fig(?:ure)?s?|tables?)\s+[A-Za-z]?\d+(?:[.-]\d+)*(?:\s+(?:and|&)\s+[A-Za-z]?\d+(?:[.-]\d+)*)?/gi;
  for (const evidence of kb.evidence_items.filter((item) => item.paper_id === paperId)) {
    for (const match of evidence.source_location?.match(pattern) || []) {
      references.add(match.replace(/\s+/g, " ").trim());
    }
  }
  return [...references].sort((left, right) => left.localeCompare(right));
}

function formatReference(source: Record<string, unknown>) {
  const label = stringValue(source.label) || String(source.type);
  const page = Number.isInteger(source.page) ? ", page " + source.page : "";
  return label + page;
}

function normalizeReferenceLabel(reference: string) {
  return reference
    .toLowerCase()
    .replace(/,\s*page\s+\d+\s*$/i, "")
    .replace(/\bfig\.?\b/g, "figure")
    .replace(/\s+/g, " ")
    .trim();
}

function readAliases(file: string) {
  if (!fs.existsSync(file)) return [];
  return arrayRecords(asRecord(readOkfYamlDocument(file)).aliases);
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatCounts(counts: Record<string, number>) {
  const entries = Object.entries(counts).sort(([left], [right]) => left.localeCompare(right));
  return entries.length ? entries.map(([key, count]) => key + ": " + count).join("; ") : "None";
}

function escapeTable(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

const curatedStart = "<!-- CURATED_NINE_PAPER_AUDIT_START -->";
const curatedEnd = "<!-- CURATED_NINE_PAPER_AUDIT_END -->";

function readCuratedAppendix(file: string) {
  if (!fs.existsSync(file)) return "";
  const current = fs.readFileSync(file, "utf8");
  const start = current.indexOf(curatedStart);
  const end = current.indexOf(curatedEnd);
  if (start < 0 || end < start) return "";
  return "\n" + current.slice(start, end + curatedEnd.length) + "\n";
}

function main() {
  const audit = auditOkfSourceViews();
  const output = path.join(process.cwd(), "docs", "OKF_SOURCE_VIEW_AUDIT.md");
  const curatedAppendix = readCuratedAppendix(output);
  fs.writeFileSync(output, renderSourceViewAudit(audit) + curatedAppendix, "utf8");
  console.log("papers: " + audit.totals.papers);
  console.log("source_views: " + audit.totals.source_views);
  console.log("structurally_valid: " + audit.totals.structurally_valid_source_views);
  console.log("manual_transcription_or_review: " + audit.totals.papers_requiring_manual_transcription);
  console.log("report: " + path.relative(process.cwd(), output).replace(/\\/g, "/"));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
