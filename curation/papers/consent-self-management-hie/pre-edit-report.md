# Pre-edit blocker report: consent-self-management-hie

## Status: blocked (required shared application-logic change — no file changes retained)

## Exact ambiguity

The paper's Figure 3 ("Design requirements, principles, and features")
formally diagrams five named requirements (Privacy, Self-management,
Trust, Compliance, Interoperability, Sections 5.1-5.5) and five named
features (Encryption, Key Management, Immutability, Decentralization,
Distribution), with explicit prose in Section 6 and Section 7 stating
which design principles (DP1-DP5, already canonical) each requirement
and feature connects to. By the same standard applied throughout this
session (e.g. `ambivalence-trust-loyalty`, `bond-markets-tokenization-tac`),
this would normally justify adding five `design-requirement` and five
`design-feature` concepts with `Addresses`/`Implements` relationships.

However, `src/native-okf/tests/coverage-audit.test.ts` contains a test
named **"known text/category mismatches are audit warnings, not invented
concepts"** that explicitly pins this exact paper's missing design
requirements and design features as a permanent, intended warning state:

```
const consent = warningMessages(report, "papers/consent-self-management-hie");
assert.match(consent, /design requirements/iu);
assert.match(consent, /design features/iu);
```

The test's own name states the governing principle in the affirmative:
these text/category mismatches should surface as coverage-audit warnings
for researcher review, not be resolved by minting new canonical concepts.
Adding the five DRs and five DFs (which I initially did) makes the
mismatch disappear, which would break this test's specific assertion
that the warning still fires for this paper — a change to
`coverage-audit.test.ts`'s pinned per-paper expectation, not a
deterministic count update. Per protocol, updating a shared
application-logic test's specific behavioral assertion (as opposed to an
exact corpus-count assertion directly caused by a source-faithful
change) requires an explicit schema/product decision, not an autonomous
judgment call.

## Source evidence

- Fig. 3 ("Design requirements, principles, and features"), article p. 8.
- Sections 5.1-5.5 (Privacy, Self-management, Trust, Compliance,
  Interoperability), article p. 7-8.
- Section 6, explicit DR->DP prose mapping, article p. 8.
- Section 7, explicit DP->DF prose mapping ("design features 'encryption'
  and 'key management' in Fig. 3 that satisfy DP1 and DP2"; "'immutability'
  ... that satisfies DP3"; "'decentralization' and 'distribution' ...
  that satisfy DP4 and DP5"), article p. 7-9.
- `src/native-okf/tests/coverage-audit.test.ts`, lines 47-71 (test:
  "known text/category mismatches are audit warnings, not invented
  concepts").

## Affected concepts

- Would-be new concepts (not created; all changes restored): `design-requirement`
  DR1-DR5 (Privacy, Self-management, Trust, Compliance, Interoperability)
  and `design-feature` DF1-DF5 (Encryption, Key Management, Immutability,
  Decentralization, Distribution) for this paper.
- Existing `consent-self-management-hie-dp1.md` through `-dp5.md`: edited
  during the initial pass to add `Addresses`/`Implemented by` sections;
  all edits reverted via `git checkout --`.

## Affected relationships

Would-be 7 `Addresses` (DP->DR) and 9 `Implements` (DF->DP) relationships,
none created.

## Decision required

A human decision on one of:
1. Add the five DRs and five DFs as I initially drafted (matching the
   pattern used for every other paper in this session), and update
   `coverage-audit.test.ts`'s pinned assertion for this paper to reflect
   that the mismatch is now resolved — treating the existing test as a
   stale snapshot of a since-fixed gap, not a permanent product
   requirement.
2. Leave the corpus as-is (5 DPs only, 0 DRs/DFs) and treat the
   coverage-audit warning as the intended, permanent representation for
   this paper — i.e., the text mentions of "design requirements" and
   "design features" are deliberately NOT canonicalized, by design, and
   my reading of Fig. 3/Sections 5-7 as sufficiently formal was
   incorrect relative to this corpus's actual editorial standard.
3. Some other resolution the reviewing human specifies, e.g. adding the
   DPs' relationships to DRs/DFs without exposing them as separate
   canonical concept files (not clearly supported by current schema).

## Files restored

All five `consent-self-management-hie-dp*.md` files, `knowledge/okf/design-knowledge/index.md`,
`knowledge/okf/papers/consent-self-management-hie.md`,
`knowledge/okf/papers/index.md`, `src/native-okf/server/release-readiness.ts`,
`src/native-okf/tests/parser.test.ts`, `src/native-okf/tests/repository.test.ts`,
`src/native-okf/tests/validation.test.ts` restored via `git checkout --`
to their committed state (as of commit
`4f60cc464e7110c2c35803fc0a3e0ef69031cf65`). The ten new untracked
concept files (`consent-self-management-hie-dr1.md` through `-dr5.md`,
`-df1.md` through `-df5.md`) were deleted. `git status --short` confirmed
empty (clean) after restoration.
