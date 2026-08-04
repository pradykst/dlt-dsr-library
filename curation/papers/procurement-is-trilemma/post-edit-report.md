# Post-edit report: procurement-is-trilemma

## Verified citation

Valeriya Arnold, Tobias Guggenberger, Jan Stramm, Nils Urbach. "Designing
a blockchain-based information system for procurement processes —
Balancing decentralization, scalability, and security while maintaining
privacy." Information Systems 140 (2026) 102723.
https://doi.org/10.1016/j.is.2026.102723 (corrected — see below).

## Source PDF

`Designing a blockchain-based information system for procurement.pdf` —
read in full (22 content pages + references, Elsevier journal article).

## Source locations

- Table 3 ("Evaluated Design Objectives"), article p. 9.
- Table 6 ("Design Principle 1"), article p. 18.
- Table 7 ("Design Principle 2"), article p. 19.
- Section 8.1 ("Design principles"), article p. 17-18 (explicit DP-to-DO prose mapping).

## Finding and correction

This paper's canonical record already had two design-principle concepts
(DP1, DP2), but the paper's formal **Table 3 ("Evaluated Design
Objectives")** — five individually labelled design objectives DO1–DO5,
each with its own description, literature grounding, and expert-interview
evidence — was entirely absent from the canonical corpus, even though the
paper record's own DSR-grid text already referenced "five design
objectives." This was a genuine coverage gap, not a merge violation.

Additionally, Table 6 and Table 7 present each design principle in a full
formal anatomy (statement, aim/implementer/user, context, one or more
numbered mechanisms, and a rationale per mechanism — following Gregor
et al. 2020's "anatomy of a design principle"). The existing DP1/DP2
records only carried the top-level statement; they have been enriched
with the complete anatomy from the same single table row (not combined
from different sections — each table is one self-contained formal unit).
DP1 and DP2 remain single concepts each (mechanisms 1.1/1.2 and 2.1/2.2/2.3
are internal structure of one principle, not separate principles — unlike
prior batch papers where each table row was its own distinct, separately
labelled objective).

Two relationships were added, both explicitly stated in prose (Section
8.1, p. 17-18): "a public-permissionless infrastructure fosters
standardization (DO1) and strengthens trust (DO3), while L2 rollups
mitigate scalability challenges (DO4), thus contributing to efficient
payments (DO2)" grounds `DP1 → DO1, DO2, DO3, DO4`; "As outlined in DO5,
privacy often plays a crucial role... DP2... addresses a complementary
gap concerning the integration of privacy" grounds `DP2 → DO5`. Neither
was inferred from numbering or proximity.

## Corrections made (full-paper fidelity audit)

- **Resource DOI**: corrected from `https://doi.org/10.1016/j.is.2025.102723`
  to `https://doi.org/10.1016/j.is.2026.102723`, matching the DOI printed
  on the PDF itself and consistent with the journal's own "Information
  Systems 140 (2026)" volume/year and "Available online 27 March 2026"
  notice.
- **Methodology / DSR grid research process**: expanded to name the
  structured literature review (Webster and Watson 2002, 34 papers) and
  the Peffers et al. (2007) six-step process explicitly, rather than only
  "prototype... 16 expert interviews... viability assessment."
- **Artifact**: expanded from a one-line summary to include the verified
  architecture (PXE, zk-SNARKs/PLONK, sequencer network, MiCAR-compliant
  stablecoin, Token/Trade/Bridge contracts), sourced from Sections 6.1-6.3.
- Authors, year, venue, and title were all verified accurate against the
  source and left unchanged.

## Final concept inventory

7 design-knowledge concepts (was 2):
DO1 Publicly accessible, interoperable blockchain infrastructure, DO2
Stable, regulation-compliant payment processing, DO3 Strengthen
dispute-resolution trust via permissionless blockchain, DO4 Infrastructure
that scales with volume and users, DO5 Privacy-enabled while maintaining
auditability (all new), plus the existing DP1 Balance decentralization,
scalability and security and DP2 Maintain the balance under privacy
requirements (both enriched, unchanged count).

## Final relationship inventory

2 relationships (both new, both explicitly source-stated):
`DP1 Addresses DO1`, `DP1 Addresses DO2`, `DP1 Addresses DO3`, `DP1
Addresses DO4` (one DP1 node with four Addresses links), and `DP2
Addresses DO5`.

## Before / after counts (whole corpus, from `npm run okf:validate`)

| metric | before | after |
|---|---|---|
| Markdown files | 291 | 296 |
| Concepts | 287 | 292 |
| design-objective concepts | 54 | 59 |
| Internal links | 676 | 691 |

Delta (+5 documents, +5 concepts, +5 design-objective, +15 internal
links) is fully explained by adding the 5 missing DO concepts: 5 new
files (+5 documents/concepts), plus their cross-links from the paper
file, the design-knowledge index, each new DO's own source-paper
backlink, and the 5 new DP1/DP2 `Addresses` relationship links.

## Changed-file manifest

- `knowledge/okf/design-knowledge/procurement-is-trilemma-do1.md` through `-do5.md` (5 new files)
- `knowledge/okf/design-knowledge/procurement-is-trilemma-dp1.md` (rewritten: full anatomy, Addresses relationships, corrected DOI)
- `knowledge/okf/design-knowledge/procurement-is-trilemma-dp2.md` (rewritten: full anatomy, Addresses relationship, corrected DOI)
- `knowledge/okf/design-knowledge/index.md` (updated: 2 bullets → 7 bullets)
- `knowledge/okf/papers/procurement-is-trilemma.md` (rewritten: corrected DOI, expanded methodology/DSR-grid/Artifact, Design knowledge section 2 → 7 bullets)
- `knowledge/okf/papers/index.md` (updated: item count 2 → 7)
- `src/native-okf/server/release-readiness.ts` (updated:
  `EXPECTED_MARKDOWN_DOCUMENT_COUNT` 291 → 296 — deterministic corpus-count
  assertion directly caused by adding the 5 missing DO concepts)
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
- `npm run okf:validate` — 296 Markdown files, 292 concepts, 0 fatal
  errors, 0 broken links (confirming the new Addresses links resolve).
- `npm run native-okf:release:check` — Overall: ready; all checks PASS.
- `npm run test:native-okf` — 21/21 passed.
- `npm run test:native-okf:ui` — 23/23 passed.

## Commit hash

Recorded in `.claude/curation-state.json` after commit (see below).
