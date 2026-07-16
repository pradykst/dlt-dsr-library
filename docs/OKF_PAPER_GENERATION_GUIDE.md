# OKF Paper Generation Guide

## Purpose

Use this workflow for every paper added to the DSR library. The objective is one predictable, machine-readable `okf-dsr-v1` bundle per paper, with traceable evidence and no invented bibliographic or DSR facts.

Git OKF files are canonical. Supabase is an indexed runtime copy. A correction is complete only after the OKF files are changed, validated, reviewed, committed, and re-indexed.

The normative field contract is in `docs/OKF_SCHEMA.md`. The reusable source is `library/okf/TEMPLATE/`.

## 1. Create one folder per paper

Copy the template:

```powershell
Copy-Item -Recurse library/okf/TEMPLATE library/okf/papers/<paper-slug>
```

The resulting folder must contain exactly:

```text
library/okf/papers/<paper-slug>/
  README.md
  index.md
  presentation.yaml
  dsr.md
  evidence.md
  relations.yaml
  aliases.yaml
  graph.json
```

Do not put PDFs, notes, temporary extraction files, or alternate graph files inside the bundle.

## 2. Choose stable identifiers

### Slug

Use lowercase ASCII kebab case:

```text
<distinctive-title-terms>-<year>
```

Example: `blockchain-iot-sdps-2019`.

Rules:

- lowercase letters, digits, and single hyphens only;
- no spaces, underscores, DOI punctuation, or author names unless needed for disambiguation;
- the `index.md` `slug` must exactly match the directory;
- never reuse a slug for another paper.

### Paper ID

Derive a stable uppercase snake-case ID:

```text
<DISTINCTIVE_TITLE_TERMS>_<YEAR>
```

Example: `BLOCKCHAIN_IOT_SDPS_2019`.

Every concept, evidence, and relation ID must be scoped:

```text
<paper_id>:<local_id>
```

Recommended local prefixes are `prob_`, `dr_`, `dp_`, `df_`, `art_`, `eval_`, `ok_`, `ev_`, and `rel_`. IDs are stable references; do not renumber them merely to improve presentation.

After copying, replace every `TEMPLATE_PAPER` and `template-paper` occurrence consistently.

## 3. Fill paper metadata

Populate every exact frontmatter key in `index.md`. Use:

- exact title, authors, publication year, venue, DOI, and source details when recorded;
- `null` for an unknown scalar;
- `[]` for an unknown or empty list;
- the canonical DOI URL `https://doi.org/<doi>` when a DOI exists;
- `extraction_status: "okf_draft"`;
- `review_status: "unreviewed"`;
- `author_check_status: "not_requested"`;
- `reviewed_by: null` and `reviewed_at: null`.

Never infer a DOI, venue, publication outlet, source URL, method, evaluation, or contribution from filenames or general knowledge. Do not turn research questions into research objectives. If the source does not record a field, preserve that absence.

Use the metadata arrays as follows:

- `research_problem`: paper-level problem statements;
- `research_objective`: explicitly recorded objectives only;
- `research_questions`: research questions;
- `theoretical_foundations`: kernel theories and theoretical lenses;
- `limitations`: reported limitations;
- `evaluation_method`, `key_contributions`, and `design_knowledge_output`: source-grounded paper summaries.

These context fields may be explained in prose below the frontmatter.

## 4. Write the Workbench presentation profile

Populate `presentation.yaml` with `presentation_version: workbench-v1` and the same canonical `paper_id`. This profile is the source for landing cards, Overview, and the default six-card Design Summary. It is not a second concept or review model.

Complete these human-facing sections:

- `card`: domain label, artifact summary, and DLT role;
- `overview`: abstract summary, research problem/objective, methodology, evaluation methods, contributions, and design-knowledge outputs;
- `dsr_summary_grid`: Problem, Input Knowledge, Research Process, Key Concepts, Solution, and Output Knowledge;
- `additional_context`: synthesis summary and limitations;
- `provenance`: source identifier for migrated or curated fields and migration notes.

Use stable, source-grounded prose. Do not turn machine IDs or concatenated graph labels into presentation text. Do not redefine concepts, evidence, relations, or review status.

Rules:

- All six Design Summary sections and at least one key concept are required.
- Optional unavailable scalars are YAML `null`; do not write placeholder prose.
- Empty evaluation, contribution, output-knowledge, or limitation arrays require a provenance note stating that the source genuinely provides none.
- Use `migrated_from_legacy_csv: false` for a newly curated paper.
- Record exact source locations or canonical-field references in `provenance.source_fields`.
- Keep the paper `unreviewed`; writing a presentation profile is not human review.

For the current nine-paper one-time conversion only, `npm run okf:migrate-presentation` reads archived legacy data, preserves better existing canonical values, records provenance, and is idempotent. Normal runtime code never reads legacy CSV.

## 5. Create canonical DSR concepts

The `type` field may contain only:

1. `Problem`
2. `Design Requirement`
3. `Design Principle`
4. `Design Feature`
5. `Artifact`
6. `Evaluation`
7. `Output Knowledge`

Do not use `Objective`, `Goal`, `Requirement`, `Req`, `Mechanism`, `Implementation`, `ResearchQuestion`, `KernelTheory`, `Limitation`, or other synonyms as concept types.

Research questions, kernel theories, and limitations are paper context:

- put their structured summaries in `index.md`;
- preserve useful details in human-readable context prose;
- do not force them into one of the seven DSR layers;
- do not create canonical graph nodes or relations with them as endpoints.

Each `dsr.md` record must use a level-two heading and one JSON object:

````markdown
## Concept: EXAMPLE_2026:dr_001
```json
{"id":"EXAMPLE_2026:dr_001","type":"Design Requirement","title":"Exact concise label","description":"Faithful source-grounded description.","evidence":["EXAMPLE_2026:ev_001"],"confidence":"high","extraction_type":"explicit","review_status":"unreviewed"}
```
````

Use confidence for extraction certainty, not review quality. Use `inferred` only when the record is a curator-supported interpretation and retain the evidence that justifies it.

## 6. Write evidence records

Create one evidence record for each reusable quotation or faithful summary. Record:

- a stable scoped ID;
- one or more canonical concept IDs in `supports`, or the paper ID for paper-level metadata;
- an exact PDF filename and page/section in `source_location`;
- the quotation or faithful summary in `quote_or_summary`;
- `quote`, `paraphrase`, or `summary` as `evidence_type`.

```json
{"id":"EXAMPLE_2026:ev_001","supports":["EXAMPLE_2026:dr_001"],"source_location":"example.pdf ? page 12 ? Requirements","quote_or_summary":"The paper requires detectable integrity violations.","evidence_type":"paraphrase"}
```

Add the evidence ID to every supported concept's `evidence` array. Never leave a dangling concept evidence ID or evidence support target.

## 7. Write canonical relations

Relations connect canonical concepts only. Use the exact keys and an allowed predicate from the schema. Direction matters.

```json
{"id":"EXAMPLE_2026:rel_001","source":"EXAMPLE_2026:dr_001","target":"EXAMPLE_2026:dp_001","predicate":"addressed_by","evidence":"EXAMPLE_2026:ev_001","confidence":"high","extraction_type":"explicit"}
```

Use `evidence: null` only when no relation-specific evidence is recorded. Do not create links merely to complete a visually attractive path. If the paper does not support a connection, leave the concepts unmapped.

## 8. Add retrieval aliases

Aliases help retrieval resolve source wording, legacy labels, abbreviations, and natural-language variants. They never create concepts or redefine types.

```json
{"target_id":"EXAMPLE_2026:dr_001","terms":["integrity requirement","tamper detection"]}
```

Only `target_id` and `terms` are allowed. A field such as `type`, `canonical_type`, or `maps_to_type` is invalid.

## 9. Construct `graph.json`

The stored graph is a projection of canonical concepts and relations:

1. Include only nodes whose IDs exist in `dsr.md`.
2. Copy each node's `type` and `title` exactly.
3. Include only edges whose IDs exist in `relations.yaml`.
4. Copy edge endpoints and predicates exactly.
5. Define `recommended_paths` as ordered node-ID arrays.
6. Ensure every consecutive path pair has a stored edge in that direction.
7. Prefer concise, paper-supported `recommended_paths`; leave other concepts available to Full Relations / Advanced.

Never invent graph-only nodes or edges. Never reverse an edge for layout convenience. Research questions, theories, and limitations remain context and do not become graph nodes.
When a paper figure or table is the source of the stored projection, add the optional exact `source_reference` block:

```json
"source_reference": {
  "type": "paper_figure",
  "label": "Figure 3",
  "page": 8,
  "caption": "Design requirements, principles, and features.",
  "validation_status": "unreviewed",
  "validation_notes": "Source located; semantic mapping still requires manual review."
}
```

Use `paper_figure`, `paper_table`, or `okf_relations_projection`. A source location does not make the mapping reviewed; keep `validation_status: unreviewed` until explicit review metadata exists.

### Curate an exact Source Figure only when complete

`graph.json.source_views` is optional. Add an entry only for a formal figure or table whose complete node and arrow inventory can be verified. A graph-level `source_reference` records provenance for the stored projection; it does not by itself create Source Figure mode.

For each candidate figure or table:

1. Record its exact label, one-based page, and caption.
2. Inventory every visible formal node in source order and map it to an existing canonical concept.
3. Inventory every visible directed arrow and map it to an existing canonical relation.
4. Before changing canonical data, write down the candidate node IDs, candidate relation IDs, source evidence, whether every relation already exists, and whether any provenance correction is required.
5. If a visibly supported formal relation is genuinely absent, add it to `relations.yaml` only with appropriate evidence. Figure-explicit arrows use `extraction_type: explicit-in-artifact`. Do not add UI-only symmetry or path-completion links.
6. Declare each layer once, list each node once, and repeat the exact layer and node order in `ordering`.
7. Keep `validation_status: unreviewed`, `reviewed_by: null`, `reviewed_at: null`, and `author_verification: null` until a real review record exists.
8. Use `visual_parity: automatic_approximation` unless the rendered geometry itself has been manually validated.
9. Run the source-view audit and validator.

Never derive an exact source view from `recommended_paths`, all relations, an LLM, visual proximity, or legacy CSV. Legacy data may reveal a comparison gap but is not canonical truth. If even one formal node or arrow remains unresolved, omit that source view and record the manual-transcription gap in `docs/OKF_SOURCE_VIEW_AUDIT.md`.

A source view may use any ordered subset of the seven canonical layers. Do not force a Requirement layer or an R->P->F shape. Multiple complete source figures/tables become separate entries with unique `source_view_id` values and data-driven titles.

The runtime modes remain separate:

- Source Figure is the exact stored source-view node/relation set and stored order.
- Recommended Flow is a readable stored pathway and never claims figure parity.
- Full Relations / Advanced is the complete canonical stored relation scope.

Runtime rendering uses the shared canonical projector and one deterministic ELK layered layout. Curators store semantic layer/node order, not UI coordinates. Source Figure preserves the declared order; other stored views allow ELK crossing minimization. Edges remain direct border-to-border straight lines, except low-curvature separation for parallel relations, with closed target arrowheads and provenance styling. This rendering is an automatic approximation unless a separately reviewed visual-parity record says otherwise.

## 10. Keep review state honest

New extractions are always:

```yaml
extraction_status: "okf_draft"
review_status: "unreviewed"
author_check_status: "not_requested"
reviewed_by: null
reviewed_at: null
```

Confidence does not imply review. Use `internally_reviewed` or `author_verified` only after an explicit human review record supplies both `reviewed_by` and `reviewed_at`. Author verification also requires `author_check_status: "verified"`.

## 11. Validate, inspect, and index

Run before committing:

```powershell
npm run okf:validate
npm run okf:validate:strict
npm run okf:validate:source-views
npm run okf:audit:source-views
node --experimental-strip-types scripts/validate-okf-flows.ts
npm test
npm run okf:index
npm run lint
npm run build
```

Then inspect the Workbench Overview, default Design Summary, Pathway Matrix and Concept Catalog, Source Figure when curated, Recommended Flow, Full Relations / Advanced, evidence, and source provenance.

Only after validation and human inspection should the Git change be committed. Re-index the runtime copy with:

```powershell
npm run okf:index
```

Indexing is not a substitute for committing canonical OKF files.

## Completion checklist

- [ ] Folder and slug match.
- [ ] All eight files exist; no extra files are inside the bundle.
- [ ] Every machine-readable key is exact.
- [ ] All concept types are canonical.
- [ ] Context records are metadata/prose, not concepts.
- [ ] Bibliographic fields are exact or explicitly missing.
- [ ] All IDs are scoped and unique.
- [ ] Evidence references resolve in both directions.
- [ ] Relation endpoints and evidence IDs resolve.
- [ ] Graph nodes and edges are canonical projections.
- [ ] Recommended paths use stored directed edges.
- [ ] Every optional source view is a complete formal mapping backed only by canonical concepts and explicit/explicit-in-artifact relations.
- [ ] Source-view layer/node order, provenance, and honest unreviewed status are recorded; unresolved figures remain audit gaps rather than fabricated views.
- [ ] Review state is unreviewed unless an explicit record exists.
- [ ] Validation, flow validation, tests, lint, and build pass.
