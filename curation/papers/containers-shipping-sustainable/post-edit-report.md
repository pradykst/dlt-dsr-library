# Post-edit audit report: containers-shipping-sustainable

## Verified citation

Radonic, N., Kildetoft, M. B., Beck, R. (2020). "Using Blockchain to Sustainably Manage Containers in International Shipping." *ICIS 2020 Proceedings*, paper 5. https://aisel.aisnet.org/icis2020/blockchain_fintech/blockchain_fintech/5

Source PDF: `Using Blockchain to Sustainably Manage Containers in Internationa.pdf` (17 pages incl. AISeL cover page; 16-page paper body + references). Read in full, including both tables of interviews/evaluation, both figures of the process diagrams, Table 1-6, Figure 1-4, and the full reference list.

## Source pages/sections used

- p. 1 (AISeL cover page) - repository-generated bibliographic citation and metadata
- p. 2 - title page, byline (true author order), Abstract, Keywords
- pp. 2-5 - Introduction, Literature Background
- pp. 5-9 - Qualitative Research and Design Science Methodology (Table 1 Interviews, Table 2 Evaluation Episodes, Figure 1 Hierarchy of Codes, Table 3 Grouped Theory Codes, Table 4 Functional User Requirements F1-F7, Table 5 Non-functional System Requirements NF1-NF8)
- pp. 9-11 - Development of the Blockchain Artefact (System Architecture, Figure 2, Smart Contracts, Secondhand Container Trading Figure 3, Matching Containers for Lease Figure 4, Incentive Structure)
- pp. 11-13 - Evaluation of the Artefact (Table 6)
- pp. 12-15 - Discussion of Empirical Findings ("Nascent Design Principle 1: Define Incentives", p. 12-13; "Nascent Design Principle 2: Address Environmental Sustainability", p. 13-14; "Positioning the Solution Type")
- p. 14 - Conclusion (restates both nascent design principles)
- pp. 15-17 - References

## Final concept inventory

| Type | Count | Items |
|---|---|---|
| Design principles | 2 | DP1 (Define incentives explicitly), DP2 (Address environmental sustainability) |
| Design requirements | 0 | (see "Considered but excluded" below) |
| Design objectives/features | 0 | none formally enumerated as generalizable |

Both DP statements were verified as verbatim matches (word-for-word) to the source's own formal statements, which appear identically in three places: the Abstract's numbered list (p. 1), the labelled Discussion subsections "Nascent Design Principle 1: Define Incentives" (p. 12) and "Nascent Design Principle 2: Address Environmental Sustainability" (p. 13), and (in paraphrased form) the Conclusion (p. 16). No wording changes were needed to either DP file's principle text.

## Final relationship inventory

0 relationships. The paper does not explicitly state any relationship between DP1 and DP2, or between either principle and any other formal construct (e.g., the functional/non-functional requirement tables). They are presented as two independent, parallel findings ("First, ... Finally, ...") in the Conclusion, with no stated dependency, conflict, or hierarchy.

## Considered but excluded: F1-F7 / NF1-NF8

Table 4 (p. 7) formally enumerates six functional user requirements (F1-F7) and Table 5 (p. 8) formally enumerates eight non-functional system requirements (NF1-NF8) for the Greenbox Platform, each with an ID and "The system shall..." wording. These are formal and tabled, but were judged **not** to belong in the design-knowledge corpus as separate design-requirement concepts because:
1. They are Sommerville-style software/system requirements specific to the one Greenbox Platform instantiation (e.g., NF7: "handle 3,000 transactions per second"; F3: input "container-prefix, -number, -type, -logo") rather than requirements generalized for reuse across artifacts, unlike this corpus's existing DR-type entries (e.g., `blockchain-iot-sensor-data-dr1.md`, which states a portable, kernel-theory-linked requirement).
2. The authors themselves explicitly and repeatedly delimit their generalizable theoretical DSR contribution to only "two nascent design principles" (Abstract p. 1; Conclusion p. 16), never framing F1-F7/NF1-NF8 as portable design knowledge.

This reasoning is documented as a `[3] Source evidence` citation in the paper record so the decision is auditable.

## Corrections made

1. **Author order** (paper record frontmatter `authors`, body `**Authors:**` line, both DP files' "Source paper" line, and all three files' `Citations [1]` lines): changed from "Roman Beck, Mikkel Boding Kildetoft, Nebojsa Radonic" (the AISeL cover-page auto-generated, alphabetized citation on p. 1) to "Nebojsa Radonic, Mikkel Boding Kildetoft, Roman Beck" — the paper's own byline order as printed on its actual title page (p. 2).
2. **Description/Summary text** (paper record): restored the dropped word "necessarily" — "stakeholders' interests are not necessarily aligned" — to match the source's own DP1 wording exactly.
3. **Methodology field**: enriched from "Design science research; qualitative coding; prototype; derivation of nascent design principles" to "Design science research merged with grounded theory; qualitative coding of interviews; prototype (Greenbox Platform); FEDS-based evaluation; derivation of nascent design principles" — the original omitted the explicitly-stated grounded-theory methodology (Beck, Weber, Gregory 2013) and the FEDS evaluation framework (Venable, Pries-Heje, Baskerville 2016), both of which are named methodological pillars of the paper.
4. **DSR grid "Key concepts" field**: trimmed "Blockchain, shipping industry, DLT systems, design science research, sustainability" to "Blockchain, shipping industry, DLT systems, design science research" — matching the paper's own formal Keywords line exactly (p. 2); "sustainability" was a curator addition not present in the source's own keyword list.
5. **Added `[3] Source evidence` citation lines** to the paper record and both DP files, giving precise section/page citations for the DP statements and (in the paper record) documenting the F1-F7/NF1-NF8 exclusion decision and the "0 relationships" finding.
6. **papers/index.md**: updated the author-order display from "Roman Beck et al., 2020" to "Nebojsa Radonic et al., 2020" to stay consistent with the corrected authors field.
7. **design-knowledge/index.md**: no change needed — DP titles/descriptions/count were already correct and unchanged.

No changes were needed to: title, year, venue, resource/DOI link, Artifact section, dsr_grid Problem description/Input knowledge/Research process/Solution description/Output knowledge bullets, DP1/DP2 principle wording, or the design-knowledge item count (2).

## Before/after counts

| Field | Before | After |
|---|---|---|
| Design principles | 2 | 2 (unchanged) |
| Design requirements | 0 | 0 (unchanged, decision documented) |
| Relationships | 0 | 0 (unchanged, confirmed correct) |
| `[3] Source evidence` citations present | 0/3 files | 3/3 files |
| Author order correct (matches p. 2 byline) | No | Yes |

## Changed-file manifest

- `knowledge/okf/papers/containers-shipping-sustainable.md`
- `knowledge/okf/design-knowledge/containers-shipping-sustainable-dp1.md`
- `knowledge/okf/design-knowledge/containers-shipping-sustainable-dp2.md`
- `knowledge/okf/papers/index.md` (this paper's entry only)
- `curation/papers/containers-shipping-sustainable/post-edit-report.md` (new)

`knowledge/okf/design-knowledge/index.md` was checked but required no edit (this paper's entry was already accurate).
