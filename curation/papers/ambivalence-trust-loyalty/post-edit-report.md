# Post-edit report: ambivalence-trust-loyalty

## Verified citation

Manuel Utz, Simon Johanning, Tamara Roth, Thomas Bruckner, Jens Strüker.
"From ambivalence to trust: Using blockchain in customer loyalty
programs." International Journal of Information Management 68 (2023)
102496. https://doi.org/10.1016/j.ijinfomgt.2022.102496 (matches
canonical record — no change needed).

## Source PDF

`From ambivalence to trust - Using blockchain in customer loyalty
programs.pdf` — read in full (18 content pages + appendix + references).

## Source locations

- Section 4.1 ("Objectives of the artifact") and its six numbered
  subsections 4.1.1-4.1.6, article p. 5-7 — six formally headed design
  objectives (DO1-DO6).
- Table A2 ("Description of Design Requirements"), article p. 14 — the
  fourteen design requirements (DR1-DR14), each individually labelled and
  grouped under its governing DO.
- Section 5.1 ("Practical implications") and its four numbered
  subsections 5.1.1-5.1.4, article p. 9-10 — four formally headed design
  principles (DP1-DP4).

## Findings and corrections

**Mislabeled objectives.** Three of the six existing design-objective
concepts had titles that did not match the paper's own formal Section
4.1.x headings: DO1 was titled "Authenticity" (source: "DO1 –
Accountability", 4.1.1), DO3 was titled "Transparency" (source: "DO3 –
Simplicity", 4.1.3), and DO5 was titled "Usability" (source: "DO5 –
Maintainability", 4.1.5). All three appear to have been derived from
informal "(DOx)" prose tags scattered in Section 4.2's artifact
description rather than from the paper's actual formal subsection
headings. Retitled and rewrote the bodies of DO1, DO3, and DO5 to match
the source's own formal definitions in Sections 4.1.1, 4.1.3, and 4.1.5
respectively. DO2, DO4, and DO6 were already correctly titled and worded
and were not changed. Also fixed a truncated (`"..."`) frontmatter
`description` field on DO1.

**Missing design requirements.** Table A2 formally and individually
labels fourteen design requirements (DR1-DR14), each grouped under its
governing design objective, entirely absent from the corpus (only the six
parent DOs existed). Added all fourteen as new `design-requirement`
concepts, quoting Table A2's own Description column, with an `Addresses`
relationship from each DR to its parent DO (matching the table's explicit
DO-header/DR-row grouping) — following the same source-to-goal direction
convention already used elsewhere in the corpus (e.g.
`blockchain-iot-sensor-data-dp1.md`'s `DP1 -> DR1` and
`procurement-is-trilemma-dp1.md`'s `DP1 -> DO1-4`).

**Missing design principles.** Section 5.1 formally presents four
numbered design principles (DP1-DP4) — the paper's headline DSR
contribution, explicitly framed in the abstract as "a nascent design
theory" — entirely absent from the corpus. Added all four, quoting each
subsection's own generalizing "should" statement verbatim or
near-verbatim. No `Addresses` relationships were added from the DPs to
any DO/DR: the paper never explicitly ties a DP to a specific DO or DR
label (unlike, e.g., `procurement-is-trilemma`'s explicit "(DO1)"
parenthetical citations); Section 5.2's discussion of DP1-DP4 connects
them only to abstract trust/distrust theory constructs, not to the DO/DR
labels, so no relationship was inferred.

## Final concept inventory

24 concepts (was 6): DO1-DO6 (3 retitled/corrected, 3 unchanged), DR1-DR14
(all new), DP1-DP4 (all new).

## Final relationship inventory

14 `Addresses` relationships (was 0): DR1-DR2 -> DO1, DR3-DR5 -> DO2,
DR6-DR8 -> DO3, DR9-DR10 -> DO4, DR11-DR12 -> DO5, DR13-DR14 -> DO6,
matching Table A2's explicit DO/DR grouping. No DP relationships (none
explicitly stated in source).

## Before / after counts (whole corpus, from `npm run okf:validate`)

| metric | before | after |
|---|---|---|
| Markdown files | 305 | 323 |
| Concepts | 301 | 319 |
| design-principle concepts | 115 | 119 |
| design-requirement concepts | 28 | 42 |
| Internal links | 709 | 759 |

Delta (+18 documents, +18 concepts, +4 design-principle, +14
design-requirement, +50 internal links) is fully explained by adding the
14 missing DRs and 4 missing DPs: each new concept contributes 2 links
(paper bullet -> concept, concept "Source paper" -> paper) = 36, plus the
14 new `Addresses` relationships (DR -> DO) = 50.

## Deterministic tests updated (directly caused by this paper's change)

- `src/native-okf/server/release-readiness.ts`:
  `EXPECTED_MARKDOWN_DOCUMENT_COUNT` 305 -> 323.
- `src/native-okf/tests/parser.test.ts`: `design-principle` 115 -> 119,
  `design-requirement` 28 -> 42, `markdownFileCount` 305 -> 323,
  `concepts.length` and id-set size 301 -> 319.
- `src/native-okf/tests/validation.test.ts`: same type-count and
  document/concept-count changes, plus `internalLinkCount` 709 -> 759 and
  the matching formatted-output assertions.
- `src/native-okf/tests/repository.test.ts`: `allConcepts.length`
  301 -> 319.
- `src/native-okf/tests/workbench.test.ts`: checked via grep — no
  hardcoded reference to this paper exists, so no change was needed.

## Changed-file manifest

- `knowledge/okf/design-knowledge/ambivalence-trust-loyalty-do1.md` (retitled/rewritten: Accountability, fixed truncated description)
- `knowledge/okf/design-knowledge/ambivalence-trust-loyalty-do3.md` (retitled/rewritten: Simplicity)
- `knowledge/okf/design-knowledge/ambivalence-trust-loyalty-do5.md` (retitled/rewritten: Maintainability)
- `knowledge/okf/design-knowledge/ambivalence-trust-loyalty-dr1.md` through `-dr14.md` (new)
- `knowledge/okf/design-knowledge/ambivalence-trust-loyalty-dp1.md` through `-dp4.md` (new)
- `knowledge/okf/design-knowledge/index.md` (updated: 6 bullets -> 24 bullets)
- `knowledge/okf/papers/ambivalence-trust-loyalty.md` (updated: Summary, Output knowledge, DSR grid, Design knowledge section 6 -> 24 bullets, added `[3]` evidence citation)
- `knowledge/okf/papers/index.md` (updated: item count 6 -> 24)
- `src/native-okf/server/release-readiness.ts` (deterministic count)
- `src/native-okf/tests/parser.test.ts` (deterministic counts)
- `src/native-okf/tests/repository.test.ts` (deterministic count)
- `src/native-okf/tests/validation.test.ts` (deterministic counts)

## Validation results

All commands run from repository root, in order, after the edit:

- `git diff --check` — clean (only harmless LF->CRLF warnings on Windows).
- `npm run okf:validate` — 323 Markdown files, 319 concepts, 0 fatal
  errors, 0 broken links.
- `npm run native-okf:release:check` — Overall: ready; all checks PASS.
- `npm run test:native-okf` — 21/21 passed.
- `npm run test:native-okf:ui` — 23/23 passed.

## Commit hash

Recorded in `.claude/curation-state.json` after commit (see below).
