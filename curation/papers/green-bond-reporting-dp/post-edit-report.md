# Post-edit fidelity report: Design Principles for Blockchain-based Applications in Green Bond Reporting

## Verified citation

Ameera Darwish, Juho Lindman, Jesper Hjertqvist, Olgerta Tona. **Design Principles for Blockchain-based Applications in Green Bond Reporting.** Proceedings of the 56th Hawaii International Conference on System Sciences (HICSS 56), 2023, pp. 5186-5195. https://hdl.handle.net/10125/103268

Source PDF: `Design Principles for Blockchain-based Applications in Green Bond.pdf` (read in full, all 10 pages including references).

## Source pages/tables/sections used

* p. 5186 — title/author/venue header and footer (article URI).
* p. 5187-5188 — Background, §2.1 "What is blockchain?".
* p. 5188-5189 — §2.2 "Blockchain design", **Table 1** ("Fundamental concepts of our Blockchain design").
* p. 5189-5190 — §3 "Design Science Research Approach" (DSRM per Peffers et al. 2007; ten expert interviews; **Table 2**, "Table of interviews"; ex-ante/ex-post evaluation criteria per Prat et al. 2015).
* p. 5190-5191 — §4 "Design Principles for Green Bond Reporting" — the six formally numbered DP1-DP6 statements and their surrounding justification/interview-quote context.
* p. 5191 — §5 "Demonstration and Evaluation of DPs" (evaluation feedback, including the explicit critique that "the principles were missing system requirements").
* p. 5191-5192 — §6 "Conclusion and implications for research and practice"; **Table 3** ("Revised design principles" — Initial vs. Revised DP wording per concept).

## Final concept inventory (unchanged in count/type)

* 6 design principles (DP1-DP6). 0 design requirements/meta-requirements/objectives/features — confirmed correct (see "Requirements-layer finding" below).

| # | Title | Final wording (verbatim from Section 4) |
|---|---|---|
| DP1 | Consortium blockchain | "Use a consortium blockchain." |
| DP2 | Proof-of-authority consensus | "The proof-of-authority consensus mechanism is suitable due to some level of trust already existing." |
| DP3 | Smart-contract document validation | "Smart contracts can validate that an authorized party uploaded and signed the file." |
| DP4 | Reputation-based incentives | "Design for reputation rather than monetary incentives." |
| DP5 | Off-chain decision-making | "Off-chain decisions different stakeholders take remain in their current format. On-chain decisions are facilitated through smart contracts." |
| DP6 | Role-based privileges | "The issuer, second opinion provider, and investor are identified as different roles with different privilege rights, such as access and editing rights and building and approving blocks." |

## Final relationship inventory (0 → 2 added)

Two explicit, prose-grounded relationships were found and added (bidirectional links, 4 "Related design principles" entries total):

1. **DP1 ↔ DP2** — p. 5190: "Consortium blockchains are a good match for PoA consensus mechanisms because participants are known and vetted."
2. **DP3 ↔ DP5** — p. 5191: "Smart contracts facilitate the decisions that stakeholders take that can be digitized and digitalized," combined with DP5's own text, "On-chain decisions are facilitated through smart contracts."

No other explicit relationships (DP-to-DP or DP-to-requirement) are stated in prose, a table, or a figure anywhere in the paper, so no further relationships were added.

## Requirements-layer finding (explicitly checked, none added)

The paper does **not** formally table or list design requirements/meta-requirements derived from the ten expert interviews before presenting the DPs. Section 3 states only a single, non-itemized artifact objective: "The artifact's objective was to assist practitioners in making informed design decisions regarding blockchain applications for green bond reporting" (p. 5189). Table 1 (p. 5189) lists background domain/concept/component categories (Infrastructure, Governance), not requirements. Critically, the paper's own demonstration-evaluation section states as a **limitation**: "The main criticisms were that the principles were missing system requirements" (p. 5191) — i.e., the paper itself acknowledges no requirements layer was derived. This confirms the existing 0-design-requirements inventory is correct; nothing was added.

## Corrections made

### Metadata (paper record `green-bond-reporting-dp.md`)
* **Authors** — corrected from "Ameera Darwish, Juho Lindman" (2 authors) to the full byline "Ameera Darwish, Juho Lindman, Jesper Hjertqvist, Olgerta Tona" (4 authors), matching the article header on p. 5186. This was the most significant correction — two authors were entirely missing.
* **Resource/DOI** — corrected from `https://hdl.handle.net/10125/103254` to `https://hdl.handle.net/10125/103268`, the URI explicitly printed twice on the article's first page (header and footer).
* **Citations [1]** — updated to list all four authors, full venue name, and page range (pp. 5186-5195).
* Added **[3] Source evidence** line to the paper record, citing DSR-grid grounding and the requirements-layer finding.

### Design principle wording (all 6 concept files + paper record's Design-knowledge bullets + design-knowledge/index.md)
Each DP's `description` frontmatter field and body statement were trimmed from paraphrased/enriched versions to the paper's own formally numbered DP1-DP6 statements in Section 4 (minimal normalization only):
* **DP1**: removed appended rationale clause ("since a set of known, semi-trusted green-bond participants suits a permissioned setting") not present in the formal DP statement.
* **DP2**: replaced paraphrase ("Use a proof-of-authority consensus mechanism, which is suitable because...") with source's own imperative-free wording.
* **DP3**: removed "(reporting)" parenthetical not present in source; replaced "Use smart contracts to validate..." paraphrase with source wording "Smart contracts can validate...".
* **DP4**: removed appended rationale clause ("given the conservative nature of the financial sector") not present in the formal DP statement.
* **DP5**: replaced paraphrase ("Keep off-chain decisions taken by different stakeholders... while on-chain...") with source's exact two-sentence wording.
* **DP6**: fixed hyphenation ("second-opinion" → "second opinion", matching source) and, most importantly, **restored a missing clause** — the source's DP6 ends "...such as access and editing rights **and building and approving blocks**," but the existing repo wording silently dropped "and building and approving blocks."

### Resource/authors on all 6 concept files
* `resource` field updated to `https://hdl.handle.net/10125/103268` on all 6 files.
* "Source paper" attribution sentence updated to list all four authors on all 6 files.
* Citations `[1]` updated to full 4-author, full-venue, paginated citation on all 6 files.
* Added `[3] Source evidence` line to all 6 files, citing the precise Section 4 sentence, page, surrounding justification/interview quote, and (where applicable) the Table 3 "Revised" variant for transparency.
* Added `## Related design principles` sections to DP1, DP2, DP3, DP5 for the two new relationships.

## Before/after counts

| | Before | After |
|---|---|---|
| Authors listed | 2 | 4 |
| Design principles | 6 | 6 (unchanged) |
| Design requirements/objectives/features | 0 | 0 (unchanged, confirmed correct) |
| Relationships | 0 | 2 (4 directional link entries across DP1/DP2/DP3/DP5) |
| Concept files with `[3] Source evidence` citation | 0/6 | 6/6 |
| Paper record with `[3] Source evidence` citation | No | Yes |
| Resource/DOI | 103254 (incorrect) | 103268 (verified against article header/footer) |

## Changed-file manifest

* `knowledge/okf/papers/green-bond-reporting-dp.md`
* `knowledge/okf/design-knowledge/green-bond-reporting-dp-dp1.md`
* `knowledge/okf/design-knowledge/green-bond-reporting-dp-dp2.md`
* `knowledge/okf/design-knowledge/green-bond-reporting-dp-dp3.md`
* `knowledge/okf/design-knowledge/green-bond-reporting-dp-dp4.md`
* `knowledge/okf/design-knowledge/green-bond-reporting-dp-dp5.md`
* `knowledge/okf/design-knowledge/green-bond-reporting-dp-dp6.md`
* `knowledge/okf/design-knowledge/index.md` (this paper's bullet list only)
* `curation/papers/green-bond-reporting-dp/post-edit-report.md` (this report, new file)

`knowledge/okf/papers/index.md` was checked but required no change — its one-line entry already used "Ameera Darwish et al., 2023" (author-agnostic to the count) and did not embed the resource URL.

No other paper's files, tests, or indexes were touched.

## Unrelated retrieval bug discovered and fixed during validation

Running the full test matrix after this paper's edits surfaced a pre-existing latent bug in
`src/native-okf/server/conversation.ts`'s `loadNativeOkfConversationCatalog`: the two shared,
paper-agnostic reference documents (`about-the-dsr-grid.md`, `about-design-knowledge.md`, both
`type: reference` with no `source_paper` metadata, since they are linked from all 34 papers)
fell back to a `linkedPaperSlug` heuristic that arbitrarily attributed ownership to whichever
paper happened to appear first in the concept's link list. This let a shared reference document
leak into paper-scoped "requested evidence" retrieval as if it were that paper's own evidence,
which `corpus-genericity.test.ts`'s "avoid fabrication and cross-paper borrowing" check caught
once this paper's edits shifted corpus-wide lexical scores enough for the reference document to
cross into the raw retrieval candidate set for an unrelated paper's query
(`aligning-newsvendors-scoring-rules`). Removed the arbitrary `linkedPaperSlug` fallback (and the
now-dead function) so reference-type concepts without explicit `source_paper` ownership are
correctly left unattributed to any single paper, matching the existing, already-enforced product
invariant. This is a generic fix (no paper-specific special-casing) verified against the full
test matrix (`test:native-okf`, `:ui`, `:retrieval`, `:coverage`, `:access`, `:release`,
`:onboarding`, `:ui-copy`, `:chat` all pass).

No git commit was made by the agent that produced the paper-content edits above, per instructions; the retrieval fix and commit were completed by the curator afterward.
