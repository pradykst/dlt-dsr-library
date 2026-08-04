# Post-edit report: aligning-newsvendors-scoring-rules

## Verified citation

Arthur Carvalho, Majid Karimi. "Aligning the interests of newsvendors and
forecasters through blockchain-based smart contracts and proper scoring
rules." Decision Support Systems 151 (2021) 113626.
https://doi.org/10.1016/j.dss.2021.113626 (matches canonical record on
file — no change needed).

## Source PDF and mapping confirmation

Read against the on-disk file `ALIGNI~1.PDF`, which the setup queue
flagged as lower-confidence (a literal 8.3-style filename, not a display
truncation). Title, author names, and DOI printed in the PDF all match the
canonical record exactly, confirming the mapping. The `[2] Source
document` citation line in the paper and all three concept files was
corrected to reference the actual on-disk filename `ALIGNI~1.PDF` (it
previously referenced a reconstructed long filename that does not exist
on disk), with a note identifying which paper it corresponds to.

## Source locations

- Section 4.1 ("Design principles"), article p. 7 — all three formally
  numbered design principles.
- Section 4.3.1 ("Validating the design principles"), article p. 9 —
  elaboration for DP1 and DP2.

## Finding and correction

Section 4.1 explicitly presents three numbered design principles
("Design principle #1", "#2", "#3"), but the canonical record only had
two (DP1, DP2) — Design principle #3 ("the source of the realized
outcome must be unambiguous") was missing entirely. Added as a new DP3
concept, quoting the source's exact statement.

Additionally, DP1's existing body was a loose paraphrase ("The contract
and its escrow/payment mechanism should be governed in a decentralized
manner so that it is controlled by neither...") rather than the source's
own crisp statement ("payments should be handled by escrow accounts
controlled by no individual entity"). Tightened to lead with the exact
source statement, followed by the same-paragraph elaboration explaining
how blockchain fulfills it (Section 4.3.1). DP2 was already close to
verbatim and required no substantive change. No relationships exist
between the three principles in the source (they are independently
numbered, not cross-referenced), so none were added.

## Final concept inventory

3 design-principle concepts (was 2):
DP1 Decentralized, party-independent control of the escrow/payment
(tightened wording), DP2 Enforceable and immutable algorithmic contracts
(unchanged wording), DP3 Unambiguous source of the realized outcome (new).

## Final relationship inventory

None (unchanged — the source does not state or depict any relationship
between the three principles).

## Before / after counts (whole corpus, from `npm run okf:validate`)

| metric | before | after |
|---|---|---|
| Markdown files | 296 | 297 |
| Concepts | 292 | 293 |
| design-principle concepts | 114 | 115 |
| Internal links | 691 | 693 |

Delta (+1 document, +1 concept, +1 design-principle, +2 internal links)
is fully explained by adding the one missing DP3 concept file and its
cross-links from the paper record and the design-knowledge index.

## Deterministic test updated (directly caused by this paper's change)

`src/native-okf/tests/workbench.test.ts` hardcoded this exact paper's
linked-concept list and type count ("...contains only its own two
principles" / `[["design-principle", 2]]`). Updated to the actual list
of three concept IDs and `[["design-principle", 3]]`, renaming the test
title accordingly. This is the only test in the required suites that
referenced this paper by name; verified via `grep` that no other test
file hardcodes counts for this paper.

## Changed-file manifest

- `knowledge/okf/design-knowledge/aligning-newsvendors-scoring-rules-dp1.md` (rewritten: tightened wording, corrected source-document filename, added evidence citation)
- `knowledge/okf/design-knowledge/aligning-newsvendors-scoring-rules-dp2.md` (updated: corrected source-document filename, added evidence citation)
- `knowledge/okf/design-knowledge/aligning-newsvendors-scoring-rules-dp3.md` (new)
- `knowledge/okf/design-knowledge/index.md` (updated: 2 bullets → 3 bullets)
- `knowledge/okf/papers/aligning-newsvendors-scoring-rules.md` (updated: Output knowledge, Design knowledge section 2 → 3 bullets, corrected source-document filename, added evidence citation)
- `knowledge/okf/papers/index.md` (updated: item count 2 → 3)
- `src/native-okf/server/release-readiness.ts` (updated:
  `EXPECTED_MARKDOWN_DOCUMENT_COUNT` 296 → 297 — deterministic corpus-count
  assertion directly caused by adding the missing DP3 concept)
- `src/native-okf/tests/parser.test.ts` (updated: markdownFileCount,
  concepts.length, id-set size, design-principle type count — same cause)
- `src/native-okf/tests/repository.test.ts` (updated: allConcepts.length —
  same cause)
- `src/native-okf/tests/validation.test.ts` (updated: markdownFileCount,
  conceptCount, internalLinkCount, design-principle type count, and the
  matching formatted-output assertions — same cause)
- `src/native-okf/tests/workbench.test.ts` (updated: this paper's exact
  linked-concept-ID list and type count, test title — same cause)

## Validation results

All commands run from repository root, in order, after the edit:

- `git diff --check` — clean (only harmless LF→CRLF warnings on Windows).
- `npm run okf:validate` — 297 Markdown files, 293 concepts, 0 fatal
  errors, 0 broken links.
- `npm run native-okf:release:check` — Overall: ready; all checks PASS.
- `npm run test:native-okf` — 21/21 passed.
- `npm run test:native-okf:ui` — 23/23 passed (one failure found and
  resolved before this final run — see above).

## Commit hash

Recorded in `.claude/curation-state.json` after commit (see below).
