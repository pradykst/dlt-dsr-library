# Pre-edit blocker report: trust-enabling-capacity-exchange

## Status: RESOLVED — see post-edit-report.md

Resolved in a later session under explicit project authorization that
source fidelity overrides historical known-mismatch fixtures. Both the 19
meta-requirements (Fig. 3) and 14 design features (Fig. 6) identified below
were added; Fig. 3's MR->DP mapping was confirmed too ambiguous (crossing
connector lines, no explicit per-MR prose statement) and no relationships
were added for it, consistent with this report's own original assessment.
See `post-edit-report.md` for the full resolution. This report is retained
below as decision history.

## Status (original, pre-resolution): blocked (required shared application-logic change — no file changes retained)

## Exact ambiguity

Fig. 3 ("Formulation and categorization of meta-requirements and design
principles") formally presents 19 individually coded meta-requirements
(MR-S1, MR-S2, MR-I1-I3, MR-N1-N3, MR-F1-F2, MR-A1-A2, MR-O1-O7) across
six dimensions, entirely absent from the corpus (which currently
contains only the six design principles). By the pattern applied
throughout this session, this would normally justify adding 19
`meta-requirement` concepts.

However, `src/native-okf/tests/coverage-audit.test.ts` (lines 54-56)
pins a regression test asserting this exact paper's coverage-audit
warning must continue to match **both** `/meta-requirements/` and
`/design features/`:

```
const trust = warningMessages(report, "papers/trust-enabling-capacity-exchange");
assert.match(trust, /meta-requirements/iu);
assert.match(trust, /design features/iu);
```

This is the same class of conflict already found and blocked tonight
for `consent-self-management-hie`. Two compounding factors make this
paper more complex, not less:

1. Adding the 19 meta-requirements (which I initially did) resolves the
   "meta-requirements" half of the pinned warning, breaking the test's
   first assertion.
2. The paper also contains a second, entirely separate formal layer —
   Fig. 6 ("Design features and their consideration in a blockchain-based
   instantiation using Solidity") enumerates 14 individually coded design
   features (DF 1.1, DF 1.2, DF 2.1, DF 2.2, DF 3.1*-DF 3.3*, DF
   4.1*-DF 4.2*, DF 5.1-DF 5.3, DF 6.1-DF 6.2, several marked with an
   asterisk indicating a less direct/inferred mapping) — which I have
   not yet added and which the test's second assertion
   (`/design features/`) is presumably guarding. Resolving both
   mismatches at once would require adding both concept layers and
   editing the shared coverage-audit test, well beyond a single-paper
   deterministic-count update.

The overnight execution instructions explicitly authorized resolving
the coverage-audit conflict only for `consent-self-management-hie`
("You are authorized to resolve consent-self-management-hie when...").
No equivalent authorization was given for this paper, so per protocol M
("required shared application-logic change") this is treated as a
genuine blocker rather than an autonomous judgment call.

## Source evidence

- Fig. 3 ("Formulation and categorization of meta-requirements and
  design principles"), article p. 5 — 19 meta-requirements.
- Fig. 6 ("Design features and their consideration in a blockchain-based
  instantiation using Solidity"), article p. 8 — 14 design features.
- `src/native-okf/tests/coverage-audit.test.ts`, lines 47-56 (test:
  "known text/category mismatches are audit warnings, not invented
  concepts").

## Affected concepts

- Would-be new concepts (not created; all changes restored): 19
  `meta-requirement` concepts (MR-S1 through MR-O7). A further 14
  `design-feature` concepts (DF1.1 through DF6.2) were identified but
  not drafted, since resolving only the MR half would still leave the
  DF half of the pinned warning unaddressed.
- Existing `trust-enabling-capacity-exchange-dp1.md`, `-dp3.md`,
  `-dp5.md`, `-dp6.md`: their truncated frontmatter `description`
  fields were fixed during the initial pass; all edits reverted via
  `git checkout --`.

## Affected relationships

None created or proposed. Fig. 3's MR-to-DP mapping uses crossing,
many-to-many connector lines with no accompanying explicit textual
statement of which MR maps to which DP, so no relationships would be
added even if the MRs were resolved (per the project's rule against
inferring relationships from unclear or crossing figure connectors).

## Decision required

A human decision on one of:
1. Add both the 19 meta-requirements and the 14 design features as
   drafted concepts (matching the pattern used for every other paper in
   this session), and update `coverage-audit.test.ts`'s pinned
   assertion for this paper to reflect that both mismatches are now
   resolved.
2. Leave the corpus as-is (6 DPs only, 0 MRs/DFs) and treat the
   coverage-audit warning as the intended, permanent representation for
   this paper, matching the same reasoning applied to
   `consent-self-management-hie`.
3. Resolve only one of the two layers (e.g. meta-requirements) and
   split the pinned test's compound assertion into two independent
   per-mismatch checks, one of which is updated and one of which
   remains — a more surgical schema change still requiring explicit
   approval.

## Files restored

`knowledge/okf/design-knowledge/index.md`, all four
`trust-enabling-capacity-exchange-dp*.md` files touched, `knowledge/okf/papers/index.md`,
`knowledge/okf/papers/trust-enabling-capacity-exchange.md`,
`src/native-okf/server/release-readiness.ts`,
`src/native-okf/tests/parser.test.ts`,
`src/native-okf/tests/repository.test.ts`,
`src/native-okf/tests/validation.test.ts` restored via `git checkout --`
to their committed state (as of commit
`c4a7e2a30092accff824e3cb34c4646cc90ea5cc`). The 19 new untracked
`trust-enabling-capacity-exchange-mr-*.md` concept files were deleted.
`git status --short` confirmed empty (clean) after restoration.
