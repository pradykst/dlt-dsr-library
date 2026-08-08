# Post-edit report: rule-the-waves-shipping

## Verified citation

Kristoffer Nærland, Christoph Müller-Bloch, Roman Beck, Søren Palmund. "Blockchain to Rule the Waves - Nascent Design Principles for Reducing Risk and Uncertainty in Decentralized Environments." ICIS 2017 Proceedings. https://aisel.aisnet.org/icis2017/HCI/Presentations/12

## Source

- **PDF:** `D:\projects\unileipzig\papers-okf-curation\Blockchain to Rule the Waves - Nascent Design Principles for Reducing Risk and Uncertainty.pdf` (full document read, 16 pages including cover sheet, references, and Appendix A process-flow diagram).
- **Pages/sections used for verification and citation:**
  - Cover sheet (doc p.1) - AISeL metadata, exact author names with diacritics (Nærland, Müller-Bloch, Palmund with Søren), venue, resource URL.
  - Title/abstract/author block (doc p.2, article p.1) - title, author affiliations, abstract.
  - Introduction (article pp.1-2) - problem framing, Maersk collaboration.
  - Methodology, Table 3 "Evaluation Episodes" (article pp.5-8) - DSR process steps; process-narrative mention of "tentative design requirements" (article p.7) that are NOT formally enumerated as a numbered/tabled construct.
  - Blockchain Prototype / Demonstration (article pp.7-11) - artifact description.
  - Final Evaluation (article pp.10-11) - expert quotes.
  - "Discussion and Nascent Design Principles" section and Table 4 "Nascent Design Principles" (article p.11) - the formal, exhaustive enumeration of exactly 4 design principles.
  - Per-principle elaboration subsections: Digitization (article pp.11-12), Tamper-proof storage (article p.12), Accessibility (article p.12), User authentication (article p.12) - including the two explicit cross-references linking tamper-proof storage and user authentication.
  - Conclusion and Limitations (article pp.12-13).

## Final concept inventory (by type)

| Type | Count |
|---|---|
| Design principle | 4 (DP1 Digitization, DP2 Tamper-proof storage, DP3 Accessibility, DP4 User authentication) |
| Design requirement | 0 |
| Design feature | 0 |
| Meta-requirement / objective / goal | 0 |

No change to the inventory count (still 4 principles, 0 of anything else) - the PDF's Table 4 exhaustively enumerates exactly these four principles ("These are (1) digitization, (2) tamper-proof storage of documents, (3) accessibility of the application, and (4) user authentication. Table 4 defines all four nascent design principles," article p.11). The paper's Methodology section mentions "tentative design requirements" that were "derived [from the use case]... and refined over time" (article p.7), but this is process narrative describing the research steps, not a formally enumerated, reusable design-requirement construct (no table, no numbered list, no dedicated subsection defining them) - so no design-requirement concepts were created, consistent with the existing repo state.

## Final relationship inventory

**1 relationship** (previously 0): DP2 (Tamper-proof storage) <-> DP4 (User authentication), added as a symmetric "Related design principles" link in both concept files.

This is grounded in two explicit, reciprocal statements in the source:
- Tamper-proof storage subsection (article p.12): "Together with another design principle, user authentication, tamper-proof storage allows for tracing back all changes that have been made to identifiable users."
- User authentication subsection (article p.12): "In connection with tamper-proof storage, user authentication allows for tracing back all changes made to the data that is stored in the system to authenticated users."

No other relationships (DP1-DP2, DP1-DP3, DP1-DP4, DP2-DP3, DP3-DP4, etc.) are explicitly stated anywhere in prose, table, or figure, so none were added. The repository has no pre-existing convention for peer design-principle-to-design-principle relationships (existing conventions are "Addresses" for DP->requirement/objective and "Implemented by"/"Implements" for DF<->DP); a new "## Related design principles" section was added to DP2 and DP4 only, following the existing link-list style used by "Addresses"/"Implemented by" sections elsewhere in the repo.

## Corrections made

1. **Author names (diacritics restored to match source exactly)** - was ASCII-stripped ("Kristoffer Naerland, Christoph Mueller-Bloch, Roman Beck, Soren Palmund"), corrected to "Kristoffer Nærland, Christoph Müller-Bloch, Roman Beck, Søren Palmund" (verified against cover sheet and title page of the PDF; the repo's existing convention elsewhere preserves diacritics, e.g. "Daniela Kühne," "Peter Roßbach"). Fixed in: paper record frontmatter/body/citation, all 4 concept-file bodies/citations, `design-knowledge/index.md` is unaffected (no author names there), `papers/index.md` summary line.
2. **DP1 description over-enriched vs. formal statement** - was "All data is stored and exchanged digitally, reducing the likelihood of data loss and enabling faster, more cost-effective information exchange as well as the use of blockchain technology," which paraphrases/merges the Table 4 definition with sentences from the elaboration paragraph. Corrected to the exact Table 4 wording: "All data is stored and exchanged digitally." Fixed in frontmatter description, body, paper record bullet, and `design-knowledge/index.md` bullet.
3. **DP2 description over-enriched vs. formal statement** - was "All changes made to the data stored in the system can be retraced, so that information cannot be lost and (together with user authentication) all changes can be traced to identifiable users," which merges the Table 4 definition with two additional sentences from the elaboration paragraph. Corrected to the exact Table 4 wording: "All changes made to the data that are stored in the system can be retraced" (note: Table 4 also has "that are stored," which the previous text had dropped). Fixed in frontmatter description, body, paper record bullet, and `design-knowledge/index.md` bullet. The relationship content that was folded into the old description (the tamper-proof-storage/user-authentication link) was preserved, but relocated to the new "Related design principles" section instead of being baked into the formal principle statement.
4. **DP3 and DP4 descriptions** - already verbatim matches to Table 4; no wording change needed.
5. **Missing DP2<->DP4 relationship** - added (see above); previously the repo showed 0 relationships despite the source explicitly stating one.
6. **Citations sections** - added a `[3] Source evidence: ...` line (matching the convention used in, e.g., `blockchain-iot-sensor-data-dp1.md`) to the paper record and all 4 concept files, each citing the precise Table/section/page location and quoting the relevant source sentence(s).
7. **Metadata fields checked and found already correct (no change needed):** title, year (2017), venue ("ICIS 2017 Proceedings"), resource URL, methodology, dsr_grid, dsr_solution_space, description/summary, artifact, DSR-grid six dimensions, tags.

## Node/edge count

| | Before | After |
|---|---|---|
| Design-knowledge nodes (this paper) | 4 | 4 |
| Relationships/edges (this paper) | 0 | 1 (DP2 <-> DP4, represented as a pair of reciprocal links) |

## Changed-file manifest

- `knowledge/okf/papers/rule-the-waves-shipping.md` - author names, DP1/DP2 bullet descriptions, added citation [3].
- `knowledge/okf/design-knowledge/rule-the-waves-shipping-dp1.md` - description (frontmatter + body), author names, added citation [3].
- `knowledge/okf/design-knowledge/rule-the-waves-shipping-dp2.md` - description (frontmatter + body), author names, added "Related design principles" section (link to DP4), added citation [3].
- `knowledge/okf/design-knowledge/rule-the-waves-shipping-dp3.md` - author names, added citation [3] (description/body already correct).
- `knowledge/okf/design-knowledge/rule-the-waves-shipping-dp4.md` - author names, added "Related design principles" section (link to DP2), added citation [3] (description/body already correct).
- `knowledge/okf/design-knowledge/index.md` - updated DP1/DP2 bullet descriptions in the rule-the-waves-shipping section only.
- `knowledge/okf/papers/index.md` - updated author name in the rule-the-waves-shipping summary line only.
- `curation/papers/rule-the-waves-shipping/post-edit-report.md` - this report (new file).

No other paper's files, tests, or indexes were modified. No commits were made.
