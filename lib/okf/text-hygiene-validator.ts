import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { inspectOkfHumanText, type OkfTextFinding } from "./text-hygiene.ts";
import { parseOkfJsonBlocks, readOkfFrontmatter } from "./parser.ts";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml") as { load: (text: string) => unknown };

const indexHumanFields = [
  "title",
  "short_title",
  "venue",
  "domain_context",
  "abstract",
  "research_problem",
  "research_objective",
  "research_questions",
  "artifact_type",
  "blockchain_dlt_role",
  "methodology",
  "theoretical_foundations",
  "evaluation_method",
  "key_contributions",
  "design_knowledge_output",
  "limitations",
  "notes"
] as const;

const graphHumanKeys = new Set([
  "title",
  "subtitle",
  "label",
  "caption",
  "description",
  "display_label",
  "validation_notes"
]);

export type OkfTextAuditItem = OkfTextFinding & {
  paperId: string;
  bundle: string;
  file: string;
  field: string;
  priorText: string;
  textClass: "canonical_human_text" | "source_location";
  correctionMode: "automatic_suggestion" | "manual_inspection_required";
};

export type OkfTextAuditResult = {
  rootDir: string;
  runtimePaperCount: number;
  templateCount: number;
  bundleCount: number;
  checkedFileCount: number;
  inspectedFieldCount: number;
  verbatimQuoteCount: number;
  findings: OkfTextAuditItem[];
};

export function validateOkfTextLibrary(rootDir = path.join(process.cwd(), "library", "okf")): OkfTextAuditResult {
  const bundleDirs = discoverBundleDirs(rootDir);
  const findings: OkfTextAuditItem[] = [];
  let checkedFileCount = 0;
  let inspectedFieldCount = 0;
  let verbatimQuoteCount = 0;

  for (const bundleDir of bundleDirs) {
    const indexFile = path.join(bundleDir, "index.md");
    const bundle = path.basename(bundleDir);
    const frontmatter = fs.existsSync(indexFile) ? readOkfFrontmatter(indexFile) : {};
    const paperId = typeof frontmatter.paper_id === "string" ? frontmatter.paper_id : bundle;
    const inspect = (file: string, field: string, value: unknown, options: { visible?: boolean; sourceLocation?: boolean } = {}) => {
      for (const text of stringsFrom(value)) {
        inspectedFieldCount += 1;
        for (const finding of inspectOkfHumanText(text, options)) {
          findings.push({
            ...finding,
            paperId,
            bundle,
            file: relativeFile(file),
            field,
            priorText: text,
            textClass: options.sourceLocation ? "source_location" : "canonical_human_text",
            correctionMode: finding.suggestedText ? "automatic_suggestion" : "manual_inspection_required"
          });
        }
      }
    };

    if (fs.existsSync(indexFile)) {
      checkedFileCount += 1;
      for (const field of indexHumanFields) inspect(indexFile, `frontmatter.${field}`, frontmatter[field]);
      for (const [index, paragraph] of markdownProseParagraphs(fs.readFileSync(indexFile, "utf8")).entries()) {
        inspect(indexFile, `body.paragraph[${index}]`, paragraph);
      }
    }

    const presentationFile = path.join(bundleDir, "presentation.yaml");
    if (fs.existsSync(presentationFile)) {
      checkedFileCount += 1;
      const presentation = asRecord(yaml.load(fs.readFileSync(presentationFile, "utf8")));
      scanPresentation(presentationFile, presentation, inspect);
    }

    const dsrFile = path.join(bundleDir, "dsr.md");
    if (fs.existsSync(dsrFile)) {
      checkedFileCount += 1;
      for (const block of parseOkfJsonBlocks(dsrFile)) {
        const id = stringValue(block.value.id) || block.heading;
        inspect(dsrFile, `concept.${id}.title`, block.value.title);
        inspect(dsrFile, `concept.${id}.description`, block.value.description);
      }
    }

    const evidenceFile = path.join(bundleDir, "evidence.md");
    if (fs.existsSync(evidenceFile)) {
      checkedFileCount += 1;
      for (const block of parseOkfJsonBlocks(evidenceFile)) {
        const id = stringValue(block.value.id) || block.heading;
        inspect(evidenceFile, `evidence.${id}.source_location`, block.value.source_location, { sourceLocation: true });
        if (block.value.evidence_type === "quote") verbatimQuoteCount += 1;
        else inspect(evidenceFile, `evidence.${id}.quote_or_summary`, block.value.quote_or_summary);
      }
    }

    const graphFile = path.join(bundleDir, "graph.json");
    if (fs.existsSync(graphFile)) {
      checkedFileCount += 1;
      const graph = asRecord(JSON.parse(fs.readFileSync(graphFile, "utf8").replace(/^\uFEFF/, "")));
      scanGraphHumanText(graphFile, graph, "graph", inspect);
    }
  }

  const templateDir = path.resolve(rootDir, "TEMPLATE");
  return {
    rootDir,
    runtimePaperCount: bundleDirs.filter((dir) => path.dirname(dir) === path.resolve(rootDir, "papers")).length,
    templateCount: bundleDirs.filter((dir) => path.resolve(dir) === templateDir).length,
    bundleCount: bundleDirs.length,
    checkedFileCount,
    inspectedFieldCount,
    verbatimQuoteCount,
    findings: findings.sort(compareFindings)
  };
}

function discoverBundleDirs(rootDir: string) {
  const paperRoot = path.resolve(rootDir, "papers");
  const dirs = fs.existsSync(paperRoot)
    ? fs.readdirSync(paperRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => path.join(paperRoot, entry.name))
    : [];
  const template = path.resolve(rootDir, "TEMPLATE");
  if (fs.existsSync(template) && fs.statSync(template).isDirectory()) dirs.push(template);
  return dirs.sort((left, right) => left.localeCompare(right));
}

function scanPresentation(
  file: string,
  presentation: Record<string, unknown>,
  inspect: (file: string, field: string, value: unknown, options?: { visible?: boolean; sourceLocation?: boolean }) => void
) {
  const sections = ["card", "overview", "dsr_summary_grid", "additional_context"];
  for (const section of sections) scanStringLeaves(file, presentation[section], section, inspect, true);
  const provenance = asRecord(presentation.provenance);
  // Migration notes are provenance, not default presentation text; spacing still matters,
  // while source-field identifiers intentionally remain machine-readable.
  scanStringLeaves(file, provenance.migration_notes, "provenance.migration_notes", inspect, false);
}

function scanGraphHumanText(
  file: string,
  value: unknown,
  field: string,
  inspect: (file: string, field: string, value: unknown, options?: { visible?: boolean; sourceLocation?: boolean }) => void
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanGraphHumanText(file, item, `${field}[${index}]`, inspect));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const child = `${field}.${key}`;
    if (graphHumanKeys.has(key)) inspect(file, child, item);
    else scanGraphHumanText(file, item, child, inspect);
  }
}

function scanStringLeaves(
  file: string,
  value: unknown,
  field: string,
  inspect: (file: string, field: string, value: unknown, options?: { visible?: boolean; sourceLocation?: boolean }) => void,
  visible: boolean
) {
  if (typeof value === "string") {
    inspect(file, field, value, { visible });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanStringLeaves(file, item, `${field}[${index}]`, inspect, visible));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) scanStringLeaves(file, item, `${field}.${key}`, inspect, visible);
}

function markdownProseParagraphs(markdown: string) {
  const body = markdown
    .replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/^Evidence:\s+.*$/gm, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .trim();
  // Markdown line breaks and list indentation are layout, not canonical text
  // whitespace. Flatten them before running prose-level hygiene checks.
  return body.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.replace(/\s+/g, " ").trim()).filter(Boolean);
}

function stringsFrom(value: unknown): string[] {
  if (typeof value === "string" && value.length) return [value];
  if (Array.isArray(value)) return value.flatMap(stringsFrom);
  return [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function relativeFile(file: string) {
  return path.relative(process.cwd(), file).replace(/\\/g, "/");
}

function compareFindings(left: OkfTextAuditItem, right: OkfTextAuditItem) {
  return left.file.localeCompare(right.file) || left.field.localeCompare(right.field) || left.code.localeCompare(right.code);
}
