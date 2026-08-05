# Resolution report: consent-self-management-hie

## Status: resolved (per explicit human authorization to revisit this paper's blocker)

## Decision applied

Option 1 from `pre-edit-report.md`: added the 5 design requirements and 5 design features already drafted and blocked in the earlier pass, and narrowly updated `coverage-audit.test.ts`'s pinned assertion for this one paper to reflect that the text/category mismatch is now resolved.

## Source evidence

Fig. 3 ("Design requirements, principles, and features", article p. 8) formally diagrams all 5 requirements (Sections 5.1-5.5, article p. 6-7), the 5 existing design principles, and 5 design features, connected by explicit arrows. Section 6 (article p. 7) gives a literal DR->DP prose mapping ("The requirement for privacy can be met through the design principle (DP1)..."). Section 7 (article p. 7-9) gives a literal DP->DF prose mapping ("Blockchain wallets encapsulate the design features 'encryption' and 'key management' in Fig. 3 that satisfy DP1 and DP2"; "the design feature 'immutability' in Fig. 3 that satisfies DP3"; "the design features 'decentralization' and 'distribution' in Fig. 3 that satisfy DP4 and DP5"). This is the most literal, textually explicit DR->DP->DF evidence encountered in the corpus — direct quotation, not figure-connector inference.

## Concepts added

- 5 design-requirement concepts: DR1 Privacy, DR2 Self-management, DR3 Trust, DR4 Compliance, DR5 Interoperability.
- 5 design-feature concepts: DF1 Encryption, DF2 Key management, DF3 Immutability, DF4 Decentralization, DF5 Distribution.
- 7 `Addresses` relationships (DP->DR): DP1->DR1, DP2->DR2, DP2->DR3, DP3->DR3, DP3->DR4, DP4->DR5, DP5->DR5.
- 9 `Implements` relationships (DF->DP): DF1->DP1, DF1->DP2, DF2->DP1, DF2->DP2, DF3->DP3, DF4->DP4, DF4->DP5, DF5->DP4, DF5->DP5.

## Concept count

Before: 5 (design-principle only). After: 15 (5 design-requirement + 5 design-principle + 5 design-feature).

## Coverage-audit test change

`src/native-okf/tests/coverage-audit.test.ts`: replaced the pinned assertion that `papers/consent-self-management-hie` must always carry "design requirements"/"design features" warnings with an assertion (matching the existing `peer-review-token-incentives` pattern) that no such warning fires post-resolution.

## Unrelated pre-existing defect discovered and fixed while re-running the coverage-audit suite

`knowledge/okf/papers/peer-review-token-incentives.md`'s own `[3] Source evidence` line contained the literal phrase "no design-requirements layer exists in this paper" — the denial itself tripped the audit's `/\bdesign[\s-]+requirements?\b/iu` pattern matcher, causing a false-positive `mentioned-category-missing` warning for that unrelated paper. This was introduced in commit `7a4e8d2` earlier this session and was not caught until `test:native-okf:coverage` (not part of the routine per-paper `test:native-okf`/`test:native-okf:ui` cycle) was run as part of this paper's resolution. Reworded to "the paper defines no separate class of formal precursor requirements to its design principles" — same meaning, no longer trips the pattern.

## Deterministic counts (from `npm run okf:validate`)

- Markdown files: 394 -> 404
- Concepts: 390 -> 400
- design-feature type count: 42 -> 47
- design-requirement type count: 68 -> 73
- Internal links: 1004 -> 1049

Updated in `src/native-okf/server/release-readiness.ts`, `src/native-okf/tests/parser.test.ts`, `src/native-okf/tests/validation.test.ts`, `src/native-okf/tests/repository.test.ts`.

## Other test fixtures updated as a direct, mechanical consequence

- `src/native-okf/tests/paper-design-map.test.ts`: the "a principle-only paper honestly renders one semantic column" test asserted a single-column, zero-edge map for this paper; replaced with a 3-column (5/5/5), 16-edge assertion matching the new state, renamed to match.
- `src/native-okf/tests/retrieval.test.ts`: `indexedConceptCount` assertion was stale at 241 against an actual current total of 400 (this staleness predated today's session and was only surfaced by running `test:native-okf:retrieval`, which is outside the routine per-paper cycle); updated to 400.

## Validation

- `git diff --check`: pass
- `npm run okf:validate`: pass (0 fatal errors, 0 broken links)
- `npm run native-okf:release:check`: pass (all checks)
- `npm run test:native-okf`: pass (21/21)
- `npm run test:native-okf:ui`: pass (23/23)
- `npm run test:native-okf:coverage`: pass (4/4)
- `npm run test:native-okf:retrieval`: pass (20/20)

## Pre-existing, unrelated failures discovered (not fixed — outside this paper's scope, require a product decision)

Running `npm run test:native-okf:chat` (not part of the established per-paper validation cycle used throughout this whole session) surfaced two failures in `src/native-okf/tests/corpus-genericity.test.ts`, both traced to `forgetting-blockchain-gdpr`, a paper that was deliberately corrected to 0 design-knowledge concepts in an earlier session (commit `55e342911e831d2bfb6bf13d3c19d189406ef355`, well before this overnight run):

1. "the dynamic structural-diversity matrix covers every repository shape without invented columns" — a hardcoded `REQUIRED_STRUCTURES` set (9 entries) no longer matches the corpus's actual 14 distinct type-shape combinations, including an empty-string shape for the zero-concept paper and several `design-objective`/`meta-requirement` combinations introduced by already-committed papers across this and prior sessions.
2. "all 34 deterministic stored maps equal repository-derived semantic projections" — `buildStoredPaperDesignMap` returns `undefined` for any paper with zero design-knowledge concepts (`stored-source-map.ts:247`), which the test's blanket `assert.ok(storedMap, ...)` does not accommodate.

Both require a product decision (should zero-concept papers be a supported shape in these fixtures, and if so how) rather than a mechanical count update, so they were left unresolved and are reported here rather than autonomously patched.
