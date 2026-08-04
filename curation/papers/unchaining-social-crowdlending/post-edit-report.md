# Post-edit report: unchaining-social-crowdlending

## Verified citation

André Schweizer, Vincent Schlatt, Nils Urbach, Gilbert Fridgen. "Unchaining
Social Businesses – Blockchain as the Basic Technology of a Crowdlending
Platform." Thirty Eighth International Conference on Information Systems
(ICIS 2017), South Korea, pp. 1–21.
https://aisel.aisnet.org/icis2017/TransformingSociety/Presentations/8
(matches canonical record on file — no change needed).

## Source PDF

`Unchaining Social Businesses (only objectives).pdf` — read in full (21
content pages + references).

## Source locations

- Table 1 ("Deficits of the Status Quo"), article p. 7.
- Table 2 ("Objectives of the Blockchain Prototype"), article p. 8–10.
- Table 3 ("Criteria-based Comparison between the Non-blockchain Solution
  and the Blockchain Solution"), article p. 14–16.
- Section "The Derivation of Objectives of the Blockchain Prototype" (p. 9);
  Conclusion / limitations (p. 17).

## Finding and correction

The canonical record held a single design-objective concept
(`unchaining-social-crowdlending-do.md`) that concatenated all 17 objectives
into one merged, paraphrased statement out of the source table's own order.
Table 2 formally lists 17 individually named objectives, grouped under
three category headers ("Social business", "Crowdlending", "Use case"),
each with its own "Description and evidence" cell. Per the source-fidelity
rule against combining separate ideas into one statement, the merged node
was replaced with 17 atomic design-objective concepts (DO1–DO17), one per
table row, using the table's own description text verbatim (including its
inline citation markers, e.g. "(Yunus et al. 2010)").

No relationships were added: this paper's only formal design-knowledge
concept type is design-objective. Table 3's evaluation results are
comparison/evaluation content tied to each objective, not a separate
concept type or an explicit cross-concept relationship, so nothing further
was modeled. DSR grid / solution-space fields were audited against the
source and left unchanged — they were already accurate (author order,
venue, resource link, problem description, research process, and output
knowledge summary all match the PDF).

## Final concept inventory

17 design-objective concepts (was 1):
DO1 Financial sustainability, DO2 Social purpose, DO3 Allow small amount
investments, DO4 Provide editable information about funding projects, DO5
Provide mechanism to establish and measure user reputation, DO6 Define and
enforce platform rules, DO7 Crowd due diligence, DO8 Provision point
mechanism, DO9 Provide reporting functions, DO10 Transaction time, DO11
Data persistency, DO12 Transaction volume, DO13 Trust and personal
identification, DO14 Reduction of manual activities, DO15 Reliable and
trustworthy transaction processing, DO16 Stability of credit currency,
DO17 Avoidance of complex interfaces — all in
`knowledge/okf/design-knowledge/unchaining-social-crowdlending-do{1..17}.md`.

## Final relationship inventory

None (unchanged — no explicit relationships stated or depicted in the
source for this paper's single concept type).

## Before / after counts (whole corpus, from `npm run okf:validate`)

| metric | before | after |
|---|---|---|
| Markdown files | 254 | 270 |
| Concepts | 250 | 266 |
| design-objective concepts | 29 | 45 |
| Internal links | 603 | 635 |

Delta (+16 documents, +16 concepts, +16 design-objective, +32 internal
links) is fully explained by this paper's split (17 new atomic files − 1
removed merged file = +16 documents/concepts; new cross-links from the
paper file, both index files, and each new concept's own source-paper
backlink account for the link delta).

## Changed-file manifest

- `knowledge/okf/design-knowledge/unchaining-social-crowdlending-do.md` (deleted)
- `knowledge/okf/design-knowledge/unchaining-social-crowdlending-do1.md` through `-do17.md` (17 new files)
- `knowledge/okf/design-knowledge/index.md` (updated: 1 bullet → 17 bullets)
- `knowledge/okf/papers/unchaining-social-crowdlending.md` (updated: Design
  knowledge section, 1 bullet → 17 bullets)
- `knowledge/okf/papers/index.md` (updated: item count 1 → 17)
- `src/native-okf/server/release-readiness.ts` (updated:
  `EXPECTED_MARKDOWN_DOCUMENT_COUNT` 254 → 270 — deterministic corpus-count
  assertion directly caused by this paper's source-faithful split)
- `src/native-okf/tests/parser.test.ts` (updated: markdownFileCount,
  concepts.length, id-set size, design-objective type count — same cause)
- `src/native-okf/tests/repository.test.ts` (updated: allConcepts.length —
  same cause)
- `src/native-okf/tests/validation.test.ts` (updated: markdownFileCount,
  conceptCount, internalLinkCount, design-objective type count, and the
  matching formatted-output assertions — same cause)

## Validation results

All commands run from repository root, in order, after the edit:

- `git diff --check` — clean (only harmless LF→CRLF warnings on Windows).
- `npm run okf:validate` — 270 Markdown files, 266 concepts, 0 fatal
  errors, 0 broken links.
- `npm run native-okf:release:check` — Overall: ready; all checks PASS.
- `npm run test:native-okf` — 21/21 passed.
- `npm run test:native-okf:ui` — 23/23 passed.

## Commit hash

Recorded in `.claude/curation-state.json` after commit (see below).
