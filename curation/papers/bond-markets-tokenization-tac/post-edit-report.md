# Post-edit report: bond-markets-tokenization-tac

## Verified citation

David Cisar, Benjamin Schellinger, Jens-Christian Stoetzer, Vincent Gramlich,
Tobias Guggenberger, Nils Urbach, Florian Lennart Weiß. "Designing the
future of bond markets: Reducing transaction costs through tokenization."
Electronic Markets 35:9 (2025). https://doi.org/10.1007/s12525-025-00753-3
(matches canonical record — no change needed).

## Source PDF

`Designing the future of bond markets - Reducing transaction costs.pdf` —
read in full (22 pages).

## Source locations

- Table 2 ("List of identified meta-requirements"), article p. 8 — seven
  formally labelled meta-requirements (MR-1 to MR-7).
- Table 3 ("List of DOs"), article p. 9 — five formally labelled design
  objectives (DO-1 to DO-5).
- Section "Design principles" and its five numbered subsections, article
  p. 16-18 — five design principles (DP1-DP5, already present).
- Figure 6 ("Classification of meta requirements, design objectives, and
  design principles"), article p. 17 — an explicit diagram tracing every
  MR -> DO and DO -> DP arrow.

## Findings and corrections

**Missing meta-requirements and design objectives.** The DSR grid's
"Research process" field already referenced "meta-requirements, design
objectives and principles," and the paper explicitly derives MRs (Table
2) and DOs (Table 3) as formal, individually labelled intermediate
artifacts before the five DPs — but the corpus previously contained only
the five DPs. Added all seven MRs and all five DOs as new
`meta-requirement` and `design-objective` concepts, quoting each table
row's own description.

**Relationships.** Figure 6 explicitly diagrams the full derivation
chain with arrows from each MR to its DO and from each DO to its DP,
including one point of divergence from Table 2's own TAC-dimension
grouping: MR-4 ("Reduce dependency on CSDs") is categorized under
"asset specificity" in Table 2 but is drawn feeding DO-2 (a
"frequency"-dimension objective) in Figure 6 — the figure's explicit
arrows were followed as the relationship source of truth, per the
project's rule to prefer explicit figure/table mappings over inferred
groupings. Added 8 `Addresses` relationships from DO to MR (DO-1->MR-1;
DO-2->MR-2,MR-3,MR-4; DO-3->MR-5,MR-6; DO-4->MR-7; DO-5->MR-7) and 6
`Addresses` relationships from DP to DO (DP1->DO-1,DO-2; DP2->DO-3;
DP3->DO-4; DP4->DO-4; DP5->DO-5), all directly read off Figure 6's
arrows — none inferred from numbering or proximity alone.

**Minor fixes to existing DP1/DP3.** Both had truncated (`"..."`)
frontmatter `description` fields (the body text was already complete and
correct); fixed to the full untruncated sentence matching the body.

## Final concept inventory

17 concepts (was 5): MR-1 through MR-7 (new), DO-1 through DO-5 (new),
DP1-DP5 (unchanged wording, 2 frontmatter-description fixes, all 5 now
carry `Addresses` relationships).

## Final relationship inventory

14 `Addresses` relationships (was 0): 8 DO->MR and 6 DP->DO, all
matching Figure 6's explicit arrows exactly.

## Before / after counts (whole corpus, from `npm run okf:validate`)

| metric | before | after |
|---|---|---|
| Markdown files | 323 | 335 |
| Concepts | 319 | 331 |
| design-objective concepts | 67 | 72 |
| meta-requirement concepts | 10 | 17 |
| Internal links | 759 | 797 |

Delta (+12 documents, +12 concepts, +5 design-objective, +7
meta-requirement, +38 internal links) is fully explained by the 12 new
concept files (24 backlinks: paper -> concept, concept -> paper) plus
the 14 new `Addresses` relationships = 38.

## Deterministic tests updated (directly caused by this paper's change)

- `src/native-okf/server/release-readiness.ts`:
  `EXPECTED_MARKDOWN_DOCUMENT_COUNT` 323 -> 335.
- `src/native-okf/tests/parser.test.ts`: `design-objective` 67 -> 72,
  `meta-requirement` 10 -> 17, `markdownFileCount` 323 -> 335,
  `concepts.length` and id-set size 319 -> 331.
- `src/native-okf/tests/validation.test.ts`: same type-count and
  document/concept-count changes, plus `internalLinkCount` 759 -> 797
  and the matching formatted-output assertions.
- `src/native-okf/tests/repository.test.ts`: `allConcepts.length`
  319 -> 331.
- `src/native-okf/tests/workbench.test.ts`: checked via grep — no
  hardcoded reference to this paper.
- `src/native-okf/tests/retrieval.test.ts`: contains one assertion that
  this paper appears among search results for a "tokenization" query;
  it asserts paper-level presence only, not a concept count, and was
  unaffected by this change (not part of the required validation suite,
  checked as due diligence).

## Changed-file manifest

- `knowledge/okf/design-knowledge/bond-markets-tokenization-tac-mr1.md` through `-mr7.md` (new)
- `knowledge/okf/design-knowledge/bond-markets-tokenization-tac-do1.md` through `-do5.md` (new)
- `knowledge/okf/design-knowledge/bond-markets-tokenization-tac-dp1.md` through `-dp5.md` (updated: added `Addresses` relationships; DP1/DP3 frontmatter description fixed)
- `knowledge/okf/design-knowledge/index.md` (updated: 5 bullets -> 17 bullets)
- `knowledge/okf/papers/bond-markets-tokenization-tac.md` (updated: Summary, Output knowledge, Design knowledge section 5 -> 17 bullets, added `[3]` evidence citation)
- `knowledge/okf/papers/index.md` (updated: item count 5 -> 17)
- `src/native-okf/server/release-readiness.ts` (deterministic count)
- `src/native-okf/tests/parser.test.ts` (deterministic counts)
- `src/native-okf/tests/repository.test.ts` (deterministic count)
- `src/native-okf/tests/validation.test.ts` (deterministic counts)

## Validation results

All commands run from repository root, in order, after the edit:

- `git diff --check` — clean (only harmless LF->CRLF warnings on Windows).
- `npm run okf:validate` — 335 Markdown files, 331 concepts, 0 fatal
  errors, 0 broken links.
- `npm run native-okf:release:check` — Overall: ready; all checks PASS.
- `npm run test:native-okf` — 21/21 passed.
- `npm run test:native-okf:ui` — 23/23 passed.

## Commit hash

Recorded in `.claude/curation-state.json` after commit (see below).
