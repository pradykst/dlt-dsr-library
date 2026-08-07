# Pre-edit blocker report: nil-marketplace-fair-inclusive

## Status: RESOLVED — see post-edit-report.md

Resolved in a later session under explicit project authorization that
source fidelity overrides historical known-mismatch fixtures. The five
design requirements (Fig. 1, Section 5.1) and their five DR->DP
relationships identified below were added exactly as this report
described. See `post-edit-report.md` for the full resolution. This report
is retained below as decision history.

## Status (original, pre-resolution): blocked (required shared application-logic change — no file changes made)

## Exact ambiguity

Section 5.1 and Fig. 1 formally present five individually numbered and
labelled design requirements:

- Design Requirement #1 (Inclusiveness)
- Design Requirement #2 (Meritocratic Allocation)
- Design Requirement #3 (Market Thickness)
- Design Requirement #4 (No Congestion)
- Design Requirement #5 (Market Safety)

These are entirely absent from the corpus, which currently contains
only the paper's three design principles (DP1-DP3) and two design
features (DF1-DF2). Fig. 1 ("Design requirements (DR), principles
(DP), and features (DF)") depicts an unambiguous, non-crossing
derivation diagram: DR1->DP1, DR2->DP2, and DR3/DR4/DR5->DP3, matching
explicit textual statements ("Our first design principle in Table 2
tackles the design requirement of inclusiveness" [DR1->DP1]; "the
design principle in Table 3 that tackles the meritocratic-allocation
requirement" [DR2->DP2]; "Design Requirements #3, #4, and #5 ground
our work... The third design principle in Table 4 suggests that
blockchain technology should serve as the foundational infrastructure"
[DR3,DR4,DR5->DP3]). Under this session's source-fidelity and
relationship-fidelity rules, this evidence would ordinarily justify
adding all five DR concepts and five DR->DP `## Addresses`
relationships with high confidence (the mapping is textually explicit
and the figure has clean, non-crossing connectors — a stronger case
than trust-enabling-capacity-exchange's crossing-line Fig. 3).

However, `src/native-okf/tests/coverage-audit.test.ts` (lines 58-59)
pins a regression assertion that this exact paper's coverage-audit
warning must continue to match `/design requirements/iu`:

```
const nil = warningMessages(report, "papers/nil-marketplace-fair-inclusive");
assert.match(nil, /design requirements/iu);
```

The overnight execution instructions explicitly authorize resolving
this class of stale-fixture conflict only for `consent-self-management-hie`
("You are authorized to resolve consent-self-management-hie when, and
only when..."). No equivalent authorization was given for this paper.
Per protocol M ("required shared application-logic change" / "collision
with... a required shared application-semantics decision"), this is
treated as a genuine blocker rather than an autonomous judgment call,
consistent with how `trust-enabling-capacity-exchange` was handled
earlier in this run.

## Source evidence

- Section 5.1 ("Design requirements"), article pp. 4-5 — Design
  Requirement #1 through #5, each individually numbered and labelled.
- Fig. 1 ("Design requirements (DR), principles (DP), and features
  (DF)"), article p. 5 — explicit, non-crossing DR->DP derivation
  diagram.
- Section 6 ("Design evaluation"), article p. 8 — confirms the same
  DR->DP mapping in prose ("Design Principle #1... aligning with the
  design requirement of inclusiveness"; "Design Principle #2...
  satisfying the meritocratic allocation design requirement").
- `src/native-okf/tests/coverage-audit.test.ts`, lines 47-59 (test:
  "known text/category mismatches are audit warnings, not invented
  concepts").

## Affected concepts

No new concepts created. Would-be new concepts: 5 `design-requirement`
concepts (DR1 Inclusiveness, DR2 Meritocratic Allocation, DR3 Market
Thickness, DR4 No Congestion, DR5 Market Safety).

## Affected relationships

No new relationships created. Would-be new relationships: 5
`## Addresses` (DR1->DP1, DR2->DP2, DR3->DP3, DR4->DP3, DR5->DP3), all
explicitly textually and diagrammatically supported (unlike
trust-enabling-capacity-exchange, this mapping has no ambiguity — the
sole blocker is the pinned coverage-audit fixture).

## Decision required

A human decision on one of:
1. Add the five design requirements and five DR->DP relationships
   (matching the pattern used for every other paper in this session),
   and update `coverage-audit.test.ts`'s pinned assertion for this
   paper to reflect that the mismatch is now resolved.
2. Leave the corpus as-is (3 DPs + 2 DFs only, 0 DRs) and treat the
   coverage-audit warning as the intended, permanent representation for
   this paper.

## Files changed

None. No corpus files were edited for this paper; this report is the
only new file.
