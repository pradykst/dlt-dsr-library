# Post-edit report: forgetting-blockchain-gdpr

## Verified citation

Simon Farshid, Andreas Reitz, Peter Roßbach. "Design of a forgetting
blockchain: A possible way to accomplish GDPR compatibility." HICSS 52
(2019), pp. 7087–7095. https://hdl.handle.net/10125/60145 (corrected from
the URI previously on file — see "Corrections made" below).

## Source PDF

`Design of a forgetting blockchain.pdf` — read in full (9 content pages +
references).

## Final representation: 0 canonical design-knowledge nodes, 0 edges

Applying the project's canonicalization rule (a formal design-knowledge
concept may exist only when the source paper explicitly labels,
enumerates, tables, or otherwise formally presents it as reusable design
knowledge), the paper's single existing design-principle node was removed.
It was not source-authored formal design knowledge: it synthesized
paraphrased clauses from three disjoint, non-formal parts of the paper —
an artifact-description sentence in the Discussion (Section 6), two
sentences embedded in unlabelled interview Q&A prose (Section 4.5), and
recommendation fragments embedded within four ordinal ("First/Second/
Third/Lastly") limitation discussions (Section 5). Re-reading the complete
PDF confirmed no table, figure, or numbered list of "design principles"
exists anywhere in the source; the abstract's and conclusion's claim to
"derive principles" is never itemized formally. A zero-node
representation is the correct outcome here: the paper contributes a
working artifact and evaluated lessons, not formally reusable design
knowledge in this corpus's sense.

### Where the paper's real content now lives

- **Artifact and forgetting mechanism** (new section) — the state-pruning
  plus custom nine-database deletion function, the pruning-algorithm
  design process (Table 1's action-dependency summary), and the six
  prototype requirements, sourced from Sections 4.2–4.3.
- **Evaluation** (new section) — the three-expert demonstration walkthrough
  (Ether transfer, contract deployment, contract update, self-destruct,
  node-restart test) and the Table 2 comparison against anonymization and
  chain-editing approaches, sourced from Section 4.4 and Table 2.
- **Findings** (new section) — the expert consensus that a GDPR-compliant
  transaction is possible, the objectives-met assessment, and the
  Q&A answers explaining node security, backups, data persistence, and
  new-node bootstrapping, sourced from Section 4.5.
- **Limitations** (new section) — all four of the paper's own numbered
  limitations (restricted-environment applicability; loss of built-in
  contract history; weak-subjectivity node bootstrapping; downtime-driven
  deletion-time recommendation), sourced from Section 5.
- **Future research** (new section) — sourced from Section 6.

## Corrections made (full-paper fidelity audit)

- **Authors**: added the paper's third author, Peter Roßbach, confirmed
  present in the PDF byline (previously listed as only Simon Farshid,
  Andreas Reitz).
- **Resource URI**: corrected from `https://hdl.handle.net/10125/59571` to
  `https://hdl.handle.net/10125/60145`, matching the URI printed directly
  on the PDF's own first page ("URI: https://hdl.handle.net/10125/60145").
- **Timestamp**: updated to reflect this curation pass.
- All other audited fields (title, year, venue, methodology, DSR grid
  narrative) were verified accurate against the source and left
  substantively unchanged; `dsr_solution_space` and the "Output knowledge"
  framing were reworded to state plainly that no atomic design-knowledge
  concepts are canonicalized for this paper.
- `description`/`Summary` rewritten to reflect the full artifact +
  evaluation + limitations scope rather than only the principles claim.

## Before / after counts (whole corpus, from `npm run okf:validate`)

| metric | before | after |
|---|---|---|
| Markdown files | 279 | 278 |
| Concepts | 275 | 274 |
| design-principle concepts | 115 | 114 |
| Internal links | 653 | 650 |

Delta (−1 document, −1 concept, −1 design-principle, −3 internal links) is
fully explained by this paper's removal: 1 concept file deleted, its
bullet link removed from the paper record, and its bullet link removed
from `design-knowledge/index.md`.

## Changed-file manifest

- `knowledge/okf/design-knowledge/forgetting-blockchain-gdpr-dp.md` (deleted — unsupported synthetic concept)
- `knowledge/okf/design-knowledge/index.md` (updated: removed this paper's now-empty section)
- `knowledge/okf/papers/forgetting-blockchain-gdpr.md` (rewritten: full-fidelity audit — authors, resource URI, and new Artifact/Evaluation/Findings/Limitations/Future research sections; Design knowledge section now states and explains the zero-node outcome)
- `knowledge/okf/papers/index.md` (updated: item count 1 → 0)
- `src/native-okf/server/release-readiness.ts` (updated: `EXPECTED_MARKDOWN_DOCUMENT_COUNT` 279 → 278 — deterministic corpus-count assertion directly caused by this removal)
- `src/native-okf/tests/parser.test.ts` (updated: markdownFileCount, concepts.length, id-set size, design-principle type count — same cause)
- `src/native-okf/tests/repository.test.ts` (updated: allConcepts.length — same cause)
- `src/native-okf/tests/validation.test.ts` (updated: markdownFileCount, conceptCount, internalLinkCount, design-principle type count, and the matching formatted-output assertions — same cause)
- `curation/papers/forgetting-blockchain-gdpr/pre-edit-report.md` (updated: resolution note added, original blocker preserved as decision history)

## Validation results

All commands run from repository root, in order, after the edit:

- `git diff --check` — clean (only harmless LF→CRLF warnings on Windows).
- `npm run okf:validate` — 278 Markdown files, 274 concepts, 0 fatal
  errors, 0 broken links.
- `npm run native-okf:release:check` — Overall: ready; all checks PASS.
- `npm run test:native-okf` — 21/21 passed.
- `npm run test:native-okf:ui` — 23/23 passed.

## Commit hash

Recorded in `.claude/curation-state.json` after commit (see below).
