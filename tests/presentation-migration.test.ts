import assert from "node:assert/strict";
import test from "node:test";
import {
  backfill,
  makePresentation,
  normalizeDoi,
  paperAudit,
  presentationCandidates,
  type LegacyRow,
  type Migration
} from "../scripts/migrate-legacy-presentation-to-okf.ts";

const migration: Migration = {
  slug: "fixture-paper",
  paperId: "FIXTURE_2026",
  legacyId: "LEGACY_FIXTURE_2026",
  csv: "fixture/papers.csv",
  baselineDoiMissing: true
};

const legacy: LegacyRow = {
  Paper_ID: "LEGACY_FIXTURE_2026",
  Domain: "Legacy domain",
  Artifact_Type: "Legacy artifact",
  Blockchain_DLT_Role: "Verbatim legacy DLT role",
  Problem_Description: "Legacy problem",
  Input_Knowledge: "Legacy input knowledge",
  Research_Process: "Legacy research process",
  Key_Concepts: "Concept one; Concept two",
  Solution_Description: "Legacy solution",
  Output_Knowledge: "Legacy output knowledge",
  Evaluation_Summary: "Legacy evaluation",
  Boundary_Conditions: "Legacy limitation",
  Review_Status: "REVIEWED",
  Notes: "Legacy workflow note",
  Full_Citation: "Author (2026). Title. Journal, 1(1).",
  DOI_or_URL: "https://doi.org/10.1234/Fixture.1"
};

test("presentation migration preserves legacy DLT role and six summary fields", () => {
  const candidates = presentationCandidates(migration, legacy, {
    paper_id: migration.paperId,
    abstract: null,
    research_objective: [],
    methodology: null,
    key_contributions: ["Canonical contribution"],
    design_knowledge_output: ["Canonical design knowledge"]
  });
  const presentation = makePresentation(migration, legacy, candidates);

  assert.equal(presentation.card.dlt_role, legacy.Blockchain_DLT_Role);
  assert.equal(presentation.dsr_summary_grid.problem, legacy.Problem_Description);
  assert.equal(presentation.dsr_summary_grid.input_knowledge, legacy.Input_Knowledge);
  assert.equal(presentation.dsr_summary_grid.research_process, legacy.Research_Process);
  assert.deepEqual(presentation.dsr_summary_grid.key_concepts, ["Concept one", "Concept two"]);
  assert.equal(presentation.dsr_summary_grid.solution, legacy.Solution_Description);
  assert.equal(presentation.dsr_summary_grid.output_knowledge, legacy.Output_Knowledge);
});

test("presentation migration normalizes DOI values and their canonical URL", () => {
  assert.equal(normalizeDoi("https://doi.org/10.1234/Fixture.1"), "10.1234/Fixture.1");
  assert.equal(normalizeDoi("doi: 10.5555/example"), "10.5555/example");
  assert.equal(normalizeDoi("https://example.org/not-a-doi"), null);

  const original = "---\npaper_id: FIXTURE_2026\ndoi: null\ndoi_url: null\n---\n";
  const doi = normalizeDoi(legacy.DOI_or_URL);
  assert.ok(doi);
  const rows: Parameters<typeof backfill>[6] = [];
  const withDoi = backfill(original, { doi: null, doi_url: null }, "doi", doi, "legacy DOI", null, rows);
  const doiUrl = "https://doi.org/" + doi;
  const withUrl = backfill(withDoi, { doi, doi_url: null }, "doi_url", doiUrl, "legacy DOI", null, rows);

  assert.match(withUrl, /doi: "10\.1234\/Fixture\.1"/);
  assert.match(withUrl, /doi_url: "https:\/\/doi\.org\/10\.1234\/Fixture\.1"/);
});

test("presentation migration preserves better canonical values and is idempotent", () => {
  const candidates = presentationCandidates(migration, legacy, {
    abstract: null,
    research_objective: [],
    methodology: null,
    key_contributions: ["Canonical contribution"],
    design_knowledge_output: ["Canonical design knowledge"]
  });
  const initial = makePresentation(migration, legacy, candidates);
  const curated = JSON.parse(JSON.stringify(initial)) as typeof initial;
  curated.card.artifact_summary = "Curated canonical artifact";
  curated.overview.research_problem = "Curated canonical problem";
  curated.provenance.source_fields["card.artifact_summary"] = "canonical:presentation.yaml#card.artifact_summary";
  curated.provenance.source_fields["overview.research_problem"] = "canonical:presentation.yaml#overview.research_problem";

  const preserved = makePresentation(migration, legacy, candidates, curated);
  assert.equal(preserved.card.artifact_summary, "Curated canonical artifact");
  assert.equal(preserved.overview.research_problem, "Curated canonical problem");

  const rerun = makePresentation(migration, legacy, candidates, preserved);
  assert.deepEqual(rerun, preserved);

  const canonicalIndex = "---\ndoi: \"10.9999/canonical\"\n---\n";
  const rows: Parameters<typeof backfill>[6] = [];
  const unchanged = backfill(
    canonicalIndex,
    { doi: "10.9999/canonical" },
    "doi",
    "10.1234/legacy",
    "legacy DOI",
    "10.9999/canonical",
    rows
  );
  assert.equal(unchanged, canonicalIndex);
  assert.equal(rows[0].conflict, "canonical non-empty value preserved");
  assert.equal(rows[0].source, "canonical:index.md#doi");
});

test("presentation migration leaves missing values null, audits them, and excludes legacy review state", () => {
  const candidates = presentationCandidates(migration, legacy, {
    abstract: null,
    research_objective: [],
    methodology: null,
    key_contributions: [],
    design_knowledge_output: []
  });
  const presentation = makePresentation(migration, legacy, candidates);
  const audit = paperAudit(migration, legacy, candidates, presentation, []);

  assert.equal(presentation.overview.abstract_summary, null);
  assert.equal(presentation.overview.research_objective, null);
  assert.equal(presentation.overview.methodology, null);
  assert.ok(presentation.provenance.migration_notes.some((note) => note.includes("remains null")));
  assert.match(audit, /presentation\.overview\.abstract_summary/);
  assert.match(audit, /null; no exact source value/);
  assert.match(audit, /legacy workflow status deliberately excluded/);
  assert.match(audit, /unreviewed/);

  const serialized = JSON.stringify(presentation);
  assert.equal(serialized.includes("REVIEWED"), false);
  assert.equal(serialized.includes("Review_Status"), false);
  assert.equal(Object.hasOwn(presentation, "review_status"), false);

  const source = "---\ndoi: null\n---\n";
  const rows: Parameters<typeof backfill>[6] = [];
  assert.equal(backfill(source, { doi: null }, "doi", null, "legacy DOI", null, rows), source);
  assert.equal(rows[0].after, "null");
  assert.equal(rows[0].missing, "null; no exact source value");
});

