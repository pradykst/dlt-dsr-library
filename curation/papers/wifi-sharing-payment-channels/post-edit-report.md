# Post-edit report: wifi-sharing-payment-channels

## Paper

An Architecture Using Payment Channel Networks for Blockchain-based Wi-Fi Sharing (Janiesch, Fischer, Imgrund, Hofmann, Winkelmann, 2023). ACM TMIS 14(1), Article 1.

## Correction

The corpus previously held only the paper's 14 design principles (DP1-DP14), with no representation of the 10 formally derived design requirements (S#IA, S#RE, S#B, S#FA, S#UPT, AU#AC, AU#AS, AU#LT, AR#RO, AR#RR) that Section 4.1 and Fig. 3 present as the paper's own precursor artifact ("The threats and risks constitute our design requirements", p. 1:7) and that Table 1 and Table 2 formally table and evaluate. Added all 10 as new design-requirement concepts, each citing Fig. 3 (risk/threat taxonomy), Section 4.1 (the paragraph coining that requirement's code), and Table 2 (article p. 1:18).

Added 38 `## Addresses` relationships (one per DP-to-DR link) to the 14 existing design-principle files, derived by inverting Table 2's own explicit "Addressed by DPx, DPy, ..." sentence for each of the 10 requirements — the strongest and most literal relationship evidence encountered in this curation session (exact table text, not figure-connector inference).

Fixed 5 pre-existing truncated frontmatter descriptions (DP3, DP6, DP11, DP13, DP14) that ended mid-sentence with "...", restoring the full sentence from the concept body / Section 5's own DP3/DP6/DP11/DP13 wording.

Synchronized the paper record (`knowledge/okf/papers/wifi-sharing-payment-channels.md`) with the 10 new DR bullets, the 5 corrected DP bullets, and a `[3] Source evidence` citation; updated `knowledge/okf/design-knowledge/index.md` (this paper's section) and `knowledge/okf/papers/index.md` (design-knowledge item count 14 -> 24).

## Concept count

Before: 14 (design-principle only). After: 24 (14 design-principle + 10 design-requirement).

## Deterministic counts (from `npm run okf:validate`)

- Markdown files: 372 -> 382
- Concepts: 368 -> 378
- design-requirement type count: 58 -> 68
- Internal links: 906 -> 964

Updated in `src/native-okf/server/release-readiness.ts`, `src/native-okf/tests/parser.test.ts`, `src/native-okf/tests/validation.test.ts`, `src/native-okf/tests/repository.test.ts`.

## Validation

- `git diff --check`: pass
- `npm run okf:validate`: pass (0 fatal errors, 0 broken links)
- `npm run native-okf:release:check`: pass (all checks)
- `npm run test:native-okf`: pass (21/21)
- `npm run test:native-okf:ui`: pass (23/23)

## Recovery note

This paper's work was interrupted mid-session by a planned Windows Update restart, after the 14 DP `## Addresses` edits and 10 new DR files had been written but before the paper record, index files, or deterministic counts were updated. On resumption, all 14 modified DP files and 10 new DR files were re-verified against the source PDF (Fig. 3, Section 4.1, Table 1, Table 2) before continuing; all were internally consistent, complete, and faithful to the source, so the interrupted work was retained and completed rather than discarded.
