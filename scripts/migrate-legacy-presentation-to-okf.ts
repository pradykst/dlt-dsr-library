import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const Papa = require("papaparse") as {
  parse: <T>(text: string, options: Record<string, unknown>) => { data: T[]; errors: Array<{ message: string }> };
};
const yaml = require("js-yaml") as { load: (text: string) => unknown };

export type JsonMap = Record<string, unknown>;
export type LegacyRow = Record<string, string>;
export type Candidate = { value: unknown; source: string; legacy?: unknown };
export type Migration = {
  slug: string;
  paperId: string;
  legacyId: string;
  csv: string;
  baselineDoiMissing?: boolean;
};
export type Presentation = {
  presentation_version: "workbench-v1";
  paper_id: string;
  card: { domain_label: string; artifact_summary: string | null; dlt_role: string | null };
  overview: {
    abstract_summary: string | null;
    research_problem: string;
    research_objective: string | null;
    methodology: string | null;
    evaluation_method: string[];
    key_contributions: string[];
    design_knowledge_output: string[];
  };
  dsr_summary_grid: {
    problem: string;
    input_knowledge: string;
    research_process: string;
    key_concepts: string[];
    solution: string;
    output_knowledge: string;
  };
  additional_context: { summary: string; limitations: string[] };
  provenance: {
    migrated_from_legacy_csv: boolean;
    source_fields: Record<string, string>;
    migration_notes: string[];
  };
};

const root = process.cwd();
const papersRoot = path.join(root, "library", "okf", "papers");
const auditPath = path.join(root, "docs", "WORKBENCH_PRESENTATION_MIGRATION_AUDIT.md");
const args = process.argv.slice(2);
const legacyArg = args.indexOf("--legacy-root");
const legacyRoot = legacyArg >= 0 && args[legacyArg + 1]
  ? path.resolve(args[legacyArg + 1])
  : path.resolve(process.env.OKF_LEGACY_WORKBENCH_ROOT ?? path.join(root, "..", "excelcsvdataforsite"));

export const migrations: Migration[] = [
  { slug: "blockchain-iot-sdps-2019", paperId: "BLOCKCHAIN_IOT_SDPS_2019", legacyId: "BLOCKCHAIN_IOT_SDPS_2019", csv: "iot_sdps_csvs/iot_v2_papers.csv" },
  { slug: "hie-consent-self-management-blockchain-2023", paperId: "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023", legacyId: "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023", csv: "hie_consent_dsr_csvs/hie_consent_papers.csv" },
  { slug: "integrated-blockchain-isdm-framework-2024", paperId: "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024", legacyId: "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024", csv: "integrated_blockchain_isdm_csvs/integrated_blockchain_isdm_papers_FIXED.csv", baselineDoiMissing: true },
  { slug: "newsvendor-forecasting-smart-contract-2021", paperId: "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021", legacyId: "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021", csv: "dsr_news_vendor_csvs/v2_papers.csv" },
  { slug: "nil-nft-marketplace-2026", paperId: "NIL_NFT_MARKETPLACE_2026", legacyId: "NIL_NFT_MARKETPLACE_2026", csv: "nil_marketplace_dsr_csvs/nil_marketplace_papers.csv" },
  { slug: "peer-review-token-incentives-2025", paperId: "PEER_REVIEW_TOKEN_INCENTIVES_2025", legacyId: "PEER_REVIEW_TOKEN_INCENTIVES_2025", csv: "peer_review_token_dsr_csvs/peer_review_token_papers.csv" },
  { slug: "short-end-stick-2025", paperId: "SHORT_END_STICK_2025", legacyId: "TWO_SIDED_OPPORTUNISM_BLOCKCHAIN_2025", csv: "stick_dsr_csvs/stick_papers.csv" },
  { slug: "ssi-kyc-framework-2022", paperId: "SSI_KYC_FRAMEWORK_2022", legacyId: "SSI_KYC_FRAMEWORK_2022", csv: "ssi_kyc_v2_flowfix/ssi_kyc_v2_papers.csv", baselineDoiMissing: true },
  { slug: "trust-capacity-exchange-blockchain-2024", paperId: "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024", legacyId: "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024", csv: "trust_capacity_exchange_dsr/trust_capacity_v3_papers.csv", baselineDoiMissing: true }
];

export function runPresentationMigration(): void {
let changed = 0;
let indexChanged = 0;
const summaries: string[] = [];
const details: string[] = [];

for (const migration of migrations) {
  const bundle = path.join(papersRoot, migration.slug);
  const indexPath = path.join(bundle, "index.md");
  const presentationPath = path.join(bundle, "presentation.yaml");
  const csvPath = path.join(legacyRoot, ...migration.csv.split("/"));
  assertFile(indexPath);
  assertFile(csvPath);

  const legacy = readLegacy(csvPath, migration.legacyId);
  let indexText = fs.readFileSync(indexPath, "utf8");
  const beforeIndex = frontMatter(indexText, indexPath);
  if (text(beforeIndex.paper_id) !== migration.paperId) throw new Error(`${indexPath}: paper_id mismatch`);

  const doi = normalizeDoi(legacy.DOI_or_URL);
  const doiUrl = doi ? `https://doi.org/${doi}` : null;
  const indexRows: AuditRow[] = [];
  indexText = backfill(indexText, beforeIndex, "venue", required(legacy, "Domain", migration.paperId) && venueFromCitation(legacy.Full_Citation), source(migration, "Full_Citation"), text(beforeIndex.venue), indexRows);
  indexText = backfill(indexText, beforeIndex, "doi", doi, source(migration, "DOI_or_URL"), migration.baselineDoiMissing ? null : text(beforeIndex.doi), indexRows);
  indexText = backfill(indexText, beforeIndex, "doi_url", doiUrl, source(migration, "DOI_or_URL"), migration.baselineDoiMissing ? null : text(beforeIndex.doi_url), indexRows);
  if (!doi) indexText = backfill(indexText, beforeIndex, "source_url", optional(legacy.DOI_or_URL), source(migration, "DOI_or_URL"), text(beforeIndex.source_url), indexRows);
  if (writeChanged(indexPath, indexText)) { changed += 1; indexChanged += 1; }

  const index = frontMatter(indexText, indexPath);
  const existing = fs.existsSync(presentationPath)
    ? yaml.load(fs.readFileSync(presentationPath, "utf8")) as Presentation
    : undefined;
  const candidates = presentationCandidates(migration, legacy, index);
  const presentation = makePresentation(migration, legacy, candidates, existing);
  if (writeChanged(presentationPath, `${JSON.stringify(presentation, null, 2)}\n`)) changed += 1;

  const missing = [
    presentation.overview.abstract_summary === null ? "abstract summary" : null,
    presentation.overview.research_objective === null ? "research objective" : null,
    presentation.overview.methodology === null ? "methodology" : null
  ].filter((value): value is string => Boolean(value));
  summaries.push(`| ${migration.paperId} | yes | ${doi ? `\`${doi}\`` : "no exact DOI source"} | ${missing.join(", ") || "none"} |`);
  details.push(paperAudit(migration, legacy, candidates, presentation, indexRows));
}

if (writeChanged(auditPath, auditDocument(summaries, details))) changed += 1;
console.log("OKF Workbench presentation migration complete");
console.log(`papers: ${migrations.length}`);
console.log(`presentation profiles: ${migrations.length}`);
console.log(`index files changed this run: ${indexChanged}`);
console.log(`files changed this run: ${changed}`);
console.log(`legacy root: ${legacyRoot}`);
console.log(`audit: ${path.relative(root, auditPath)}`);

}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runPresentationMigration();
}

export function presentationCandidates(migration: Migration, legacy: LegacyRow, index: JsonMap): Record<string, Candidate> {
  const legacySource = (field: string) => source(migration, field);
  const indexSource = (field: string) => `canonical:index.md#${field}`;
  const evaluation = required(legacy, "Evaluation_Summary", migration.paperId);
  const output = required(legacy, "Output_Knowledge", migration.paperId);
  const contributions = array(index.key_contributions);
  const knowledge = array(index.design_knowledge_output);
  const objective = array(index.research_objective);
  const methodology = text(index.methodology);
  return {
    "card.domain_label": candidate(required(legacy, "Domain", migration.paperId), legacySource("Domain")),
    "card.artifact_summary": candidate(optional(legacy.Artifact_Type), legacySource("Artifact_Type")),
    "card.dlt_role": candidate(optional(legacy.Blockchain_DLT_Role), legacySource("Blockchain_DLT_Role")),
    "overview.abstract_summary": candidate(text(index.abstract), indexSource("abstract")),
    "overview.research_problem": candidate(required(legacy, "Problem_Description", migration.paperId), legacySource("Problem_Description")),
    "overview.research_objective": candidate(objective.length ? objective.join(" ") : null, indexSource("research_objective")),
    "overview.methodology": candidate(methodology ? humanize(methodology) : null, indexSource("methodology")),
    "overview.evaluation_method": candidate([evaluation], legacySource("Evaluation_Summary")),
    "overview.key_contributions": candidate(contributions.length ? contributions : [output], contributions.length ? indexSource("key_contributions") : legacySource("Output_Knowledge"), output),
    "overview.design_knowledge_output": candidate(knowledge.length ? knowledge : [output], knowledge.length ? indexSource("design_knowledge_output") : legacySource("Output_Knowledge"), output),
    "dsr_summary_grid.problem": candidate(required(legacy, "Problem_Description", migration.paperId), legacySource("Problem_Description")),
    "dsr_summary_grid.input_knowledge": candidate(required(legacy, "Input_Knowledge", migration.paperId), legacySource("Input_Knowledge")),
    "dsr_summary_grid.research_process": candidate(required(legacy, "Research_Process", migration.paperId), legacySource("Research_Process")),
    "dsr_summary_grid.key_concepts": candidate(required(legacy, "Key_Concepts", migration.paperId).split(";").map((item) => item.trim()).filter(Boolean), legacySource("Key_Concepts")),
    "dsr_summary_grid.solution": candidate(required(legacy, "Solution_Description", migration.paperId), legacySource("Solution_Description")),
    "dsr_summary_grid.output_knowledge": candidate(output, legacySource("Output_Knowledge")),
    "additional_context.summary": candidate(evaluation, legacySource("Evaluation_Summary")),
    "additional_context.limitations": candidate([required(legacy, "Boundary_Conditions", migration.paperId)], legacySource("Boundary_Conditions"))
  };
}

export function makePresentation(migration: Migration, legacy: LegacyRow, candidates: Record<string, Candidate>, existing?: Presentation): Presentation {
  const sourceFields: Record<string, string> = {};
  const pick = <T>(field: string): T => {
    const old = at(existing, field);
    const selected = present(old) ? old : candidates[field].value;
    if (present(selected)) sourceFields[field] = existing?.provenance?.source_fields?.[field] ?? (present(old) ? `canonical:presentation.yaml#${field}` : candidates[field].source);
    return selected as T;
  };
  const notes: string[] = [];
  if (pick<string | null>("overview.abstract_summary") === null) notes.push("The legacy paper CSV and canonical index contain no dedicated abstract summary; overview.abstract_summary remains null.");
  if (pick<string | null>("overview.research_objective") === null) notes.push("The legacy paper CSV and canonical index contain no separate research objective; overview.research_objective remains null.");
  if (pick<string | null>("overview.methodology") === null) notes.push("The canonical index contains no dedicated methodology value; overview.methodology remains null rather than inferring one from research-process prose.");
  notes.push("Legacy extraction and review workflow fields were intentionally excluded; the canonical paper remains unreviewed.");
  if (optional(legacy.Notes)) notes.push(`Legacy source note (provenance only; not a review record): ${legacy.Notes}`);
  return {
    presentation_version: "workbench-v1",
    paper_id: migration.paperId,
    card: { domain_label: pick("card.domain_label"), artifact_summary: pick("card.artifact_summary"), dlt_role: pick("card.dlt_role") },
    overview: {
      abstract_summary: pick("overview.abstract_summary"), research_problem: pick("overview.research_problem"), research_objective: pick("overview.research_objective"), methodology: pick("overview.methodology"),
      evaluation_method: pick("overview.evaluation_method"), key_contributions: pick("overview.key_contributions"), design_knowledge_output: pick("overview.design_knowledge_output")
    },
    dsr_summary_grid: {
      problem: pick("dsr_summary_grid.problem"), input_knowledge: pick("dsr_summary_grid.input_knowledge"), research_process: pick("dsr_summary_grid.research_process"),
      key_concepts: pick("dsr_summary_grid.key_concepts"), solution: pick("dsr_summary_grid.solution"), output_knowledge: pick("dsr_summary_grid.output_knowledge")
    },
    additional_context: { summary: pick("additional_context.summary"), limitations: pick("additional_context.limitations") },
    provenance: { migrated_from_legacy_csv: true, source_fields: sourceFields, migration_notes: unique([...(existing?.provenance?.migration_notes ?? []).filter((note) => !note.startsWith("Legacy Notes are documented in the migration audit")), ...notes]) }
  };
}

export type AuditRow = { field: string; legacy: string; before: string; after: string; source: string; conflict: string; missing: string };

export function paperAudit(migration: Migration, legacy: LegacyRow, candidates: Record<string, Candidate>, presentation: Presentation, indexRows: AuditRow[]): string {
  const rows: AuditRow[] = [...indexRows, ...Object.entries(candidates).map(([field, item]) => {
    const after = at(presentation, field);
    return {
      field: `presentation.${field}`,
      legacy: show(item.legacy ?? (item.source.startsWith("legacy_csv:") ? item.value : null), "No dedicated legacy field"),
      before: "No presentation profile in migration baseline",
      after: show(after, "null"),
      source: presentation.provenance.source_fields[field] ?? item.source,
      conflict: JSON.stringify(after) === JSON.stringify(item.value) ? "none" : "pre-existing canonical presentation value preserved",
      missing: present(after) ? "present" : "null; no exact source value"
    };
  })];
  rows.push({ field: "legacy.Review_Status", legacy: show(optional(legacy.Review_Status), "No value"), before: "unreviewed", after: "unreviewed", source: "canonical:index.md#review_status", conflict: "legacy workflow status deliberately excluded", missing: "not applicable" });
  rows.push({ field: "legacy.Notes", legacy: show(optional(legacy.Notes), "No value"), before: "null canonical notes", after: "preserved in presentation.provenance.migration_notes", source: source(migration, "Notes"), conflict: "provenance only; does not change review state", missing: optional(legacy.Notes) ? "present in provenance and audit" : "source empty" });
  return [`## ${migration.paperId}`, "", `Canonical slug: \`${migration.slug}\``, `Legacy ID: \`${migration.legacyId}\``, `Legacy source: \`${migration.csv}\``, "", "| Field | Legacy value found | Canonical value before | Canonical value after | Source selected | Conflict status | Missing status |", "|---|---|---|---|---|---|---|", ...rows.map((row) => `| ${cell(row.field)} | ${cell(row.legacy)} | ${cell(row.before)} | ${cell(row.after)} | ${cell(row.source)} | ${cell(row.conflict)} | ${cell(row.missing)} |`), ""].join("\n");
}

export function auditDocument(summary: string[], details: string[]): string {
  return `# Workbench Presentation Migration Audit

## Scope and result

This one-time migration maps the previous researcher-facing Workbench paper rows into canonical \`workbench-v1\` presentation profiles for all nine \`okf-dsr-v1\` bundles. Canonical \`index.md\` metadata is preferred where it already contains a better non-empty structured value. The migration is deterministic and idempotent: it uses stable mappings, omits timestamps, preserves better canonical values, and writes only byte-different files.

| Paper ID | Legacy DLT role migrated | DOI result | Presentation gaps remaining |
|---|---|---|---|
${summary.join("\n")}

## Preservation guarantees

- The migration writes only \`presentation.yaml\`, exact missing bibliographic fields in \`index.md\`, and this audit.
- It does not read or modify \`dsr.md\`, \`evidence.md\`, \`relations.yaml\`, \`aliases.yaml\`, or \`graph.json\`. No machine-graph fact changes.
- Legacy review, reviewer, extraction-status, confidence, coder, and date fields are excluded. All nine papers remain \`unreviewed\`.
- Missing values remain YAML/JSON \`null\`; no DOI, venue, objective, abstract, or methodology is invented.
- Every available legacy DLT-role description is preserved verbatim in \`card.dlt_role\`.
- DOI values are stored raw and DOI links are normalized as \`https://doi.org/<raw-doi>\`.
- The migration script is the only new CSV consumer. Normal Workbench runtime data comes from canonical bundles/Supabase; existing CSV import support remains Legacy/Admin-only.

## Source policy

Human synthesis comes directly from legacy \`Domain\`, \`Artifact_Type\`, \`Blockchain_DLT_Role\`, \`Problem_Description\`, \`Input_Knowledge\`, \`Research_Process\`, \`Key_Concepts\`, \`Solution_Description\`, \`Output_Knowledge\`, \`Evaluation_Summary\`, and \`Boundary_Conditions\`. Structured contribution/output lists already in canonical \`index.md\` are retained. Legacy Notes are preserved verbatim as provenance-only migration notes and never treated as review records.

${details.join("\n")}## Idempotency

Run \`npm run okf:migrate-presentation\` twice. The second run must report \`files changed this run: 0\`. Override the archived source location with \`OKF_LEGACY_WORKBENCH_ROOT\` or \`--legacy-root <path>\`.
`;
}

export function backfill(content: string, metadata: JsonMap, field: string, candidateValue: string | null, selectedSource: string, baseline: string | null, rows: AuditRow[]): string {
  const current = text(metadata[field]);
  const after = current ?? candidateValue;
  const conflict = Boolean(current && candidateValue && current !== candidateValue);
  const provenance = baseline || conflict ? `canonical:index.md#${field}` : selectedSource;
  rows.push({ field: `index.${field}`, legacy: show(candidateValue, "No exact source value"), before: show(baseline, "null"), after: show(after, "null"), source: provenance, conflict: conflict ? "canonical non-empty value preserved" : "none", missing: after ? "present" : "null; no exact source value" });
  if (current || !candidateValue) return content;
  const pattern = new RegExp(`^${field}:\\s*(?:null|""|'')\\s*$`, "m");
  if (!pattern.test(content)) throw new Error(`Cannot safely backfill ${field}; explicit null expected.`);
  return content.replace(pattern, `${field}: ${JSON.stringify(candidateValue)}`);
}

function frontMatter(content: string, file: string): JsonMap {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`${file}: missing front matter`);
  const value = yaml.load(match[1]);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${file}: invalid front matter`);
  return value as JsonMap;
}

function readLegacy(file: string, id: string): LegacyRow {
  const result = Papa.parse<LegacyRow>(fs.readFileSync(file, "utf8"), { header: true, skipEmptyLines: "greedy", transformHeader: (value: string) => value.trim(), transform: (value: string) => value.trim() });
  if (result.errors.length) throw new Error(`${file}: ${result.errors.map((error) => error.message).join("; ")}`);
  const row = result.data.find((item) => item.Paper_ID === id);
  if (!row) throw new Error(`${file}: missing ${id}`);
  return row;
}

function venueFromCitation(citation: string): string | null {
  const match = citation.match(/\)\.\s+.+?\.\s+([^,]+),\s+\d+/);
  return match?.[1]?.trim() || null;
}
export function normalizeDoi(value: string | undefined): string | null {
  const cleaned = optional(value)?.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "").trim();
  return cleaned && /^10\.\d{4,9}\/.+/.test(cleaned) ? cleaned : null;
}
function source(migration: Migration, field: string) { return `legacy_csv:${migration.csv}#${field}`; }
function candidate(value: unknown, selectedSource: string, legacy?: unknown): Candidate { return { value, source: selectedSource, legacy }; }
function required(row: LegacyRow, field: string, paper: string): string { const value = optional(row[field]); if (!value) throw new Error(`${paper}: missing legacy ${field}`); return value; }
function optional(value: string | null | undefined): string | null { const clean = value?.trim(); return clean || null; }
function text(value: unknown): string | null { return typeof value === "string" && value.trim() ? value.trim() : null; }
function array(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : []; }
function humanize(value: string): string { if (!/^[a-z0-9_]+$/.test(value)) return value; const clean = value.replaceAll("_", " "); return clean.charAt(0).toUpperCase() + clean.slice(1); }
function at(value: unknown, field: string): unknown { return field.split(".").reduce<unknown>((current, key) => current && typeof current === "object" && !Array.isArray(current) ? (current as JsonMap)[key] : undefined, value); }
function present(value: unknown): boolean { if (typeof value === "string") return Boolean(value.trim()); if (Array.isArray(value)) return value.length > 0; return value !== null && value !== undefined; }
function unique(values: string[]): string[] { return [...new Set(values.map((value) => value.trim()).filter(Boolean))]; }
function show(value: unknown, absent: string): string { if (!present(value)) return absent; return Array.isArray(value) ? value.map(String).join("<br>") : String(value); }
function cell(value: string): string { return value.replaceAll("|", "\\|").replaceAll("\r", " ").replaceAll("\n", "<br>"); }
function assertFile(file: string): void { if (!fs.existsSync(file)) throw new Error(`Missing migration source: ${file}`); }
function writeChanged(file: string, content: string): boolean { if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === content) return false; fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content, "utf8"); return true; }
