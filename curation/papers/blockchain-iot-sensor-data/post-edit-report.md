# Post-Edit Curation Report: Blockchain for the IoT (Chanson et al., 2019)

## Verified citation

Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann. "Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data." *Journal of the Association for Information Systems* 20(9), 2019, 1271-1307. https://doi.org/10.17705/1jais.00567

Authors, year, venue, pagination, and DOI in the repo all matched the PDF exactly; no changes were needed to these fields.

## Source PDF

`D:\projects\unileipzig\papers-okf-curation\Blockchain for the IoT.pdf` (37-page scan including references and appendix). Read in full, front matter through appendix (Figures A-1, A-2) and "About the Authors."

## Key pages/tables/figures used

- Abstract, p. 1272
- Table 1 "General SDPS Challenges and Design Requirements," p. 1281
- Section 4.1 "Developing Design Requirements" (bolded DR1-DR4 statements), pp. 1279-1280
- Section 4.2 "Deriving Design Principles" (bolded DP1-DP4 statements), pp. 1281-1282
- Section 4.3 "Mapping Design Principles to Design Features," pp. 1282-1283
- Figure 3 "Design Requirements, Principles, and Features" (DR→DP→DF mapping diagram, with capture/store/provide groupings), p. 1283
- Figure 4 "Artifact Architecture," p. 1284
- Table 4 "Components of an SDPS Design Theory," p. 1294

## Final concept inventory (unchanged in count — verified correct)

- 4 design requirements: DR1-DR4
- 4 design principles: DP1-DP4
- 9 design features: DF1-DF9
- Total: 17 concept nodes (matches Table 1, Section 4.2, and Figure 3 exactly)

## Final relationship inventory (11 edges)

**Addresses (DP → DR):**
- DP1 → DR1
- DP2 → DR1
- DP3 → DR2
- DP4 → DR3
- DP4 → DR4

**Implements (DF → DP):**
- DF1 → DP1
- DF3 → DP1
- DF2 → DP2
- DF8 → DP2
- DF7 → DP3
- DF9 → DP3
- DF4 → DP4
- DF5 → DP4
- DF6 → DP4

All DR→DP and DP→DR edges were already correct in the repo (verified against explicit prose: "With respect to DR1... DP1... DP2"; "we derive the following design principle that addresses DR2: DP3"; "DR3... and DR4... DP4"). **No changes were needed to these edges.**

## Corrections made

### 1. Fixed DF6 → DP mismapping (the flagged issue)

The repo previously had **DF6 "Verification storage system" implementing DP1**, and correspondingly DP1 listed DF6 under "Implemented by." This contradicted the paper's own explicit text in Section 4.3, p. 1283:

> "The fourth design principle, requiring a linearly scalable system architecture, needs three more design features—namely, a storage service (DF4) that writes into the raw data storage (DF5) and also into an independent verification storage system (DF6)."

DP1's features are explicitly limited to DF1 and DF3 ("To implement the first design principle... two features are needed. First, we have to collect the data (DF1) and, second, we need to preprocess the data... (DF3)"). Figure 3 confirms this — DF6 is grouped under the "Store Data" bracket alongside DF4/DF5, all flowing from DP4, not DP1.

**Files changed:**
- `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-df6.md` — "Implements" changed from DP1 to DP4.
- `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-dp1.md` — removed DF6 from "Implemented by" (now DF1, DF3 only).
- `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-dp4.md` — added DF6 to "Implemented by" (now DF4, DF5, DF6).

### 2. Normalized DR1-DR4 descriptions to the paper's exact bolded formal statements

The prior descriptions were paraphrases that merged the paper's bolded DR heading with its explanatory second sentence (e.g., "Enable tamper-resistant generation, processing, and exchange of IoT sensor data" — reordering "data" and dropping "IoT," a combination not found verbatim anywhere in the source). Replaced with the source's own formal statement (the labeled bold sentence in Section 4.1), and added the second (explanatory) sentence verbatim in the body text rather than blending it into one paraphrased sentence.

- DR1: "Enable tamper-resistant data generation, processing, and exchange." (was: "Enable tamper-resistant generation, processing, and exchange of IoT sensor data.")
- DR2: "Enable privacy-preserving data generation, processing, and exchange." (was reworded similarly)
- DR3: "Enable large data volume throughput." (was expanded with prose not in the formal DR statement)
- DR4: "Ensure economic feasibility." (was expanded with prose not in the formal DR statement)

**Files changed:** `blockchain-iot-sensor-data-dr1.md`, `-dr2.md`, `-dr3.md`, `-dr4.md` (frontmatter `description` + body first paragraph).

### 3. Normalized DP1-DP4 descriptions to the paper's exact bolded formal statements

Same issue as DRs — the DP1, DP2, and DP4 descriptions had been rewritten into active voice and/or had extra clauses appended from surrounding prose (not the formal DP statement itself).

- DP1: "Sensor data are certified on the basis of source-to-sink protection." (was: "Certify sensor data on the basis of source-to-sink protection so that data producers are accountable for the data they provide." — the "so that..." clause is from separate explanatory prose, not the DP1 statement.)
- DP2: "Sensor data are certified on the basis of cross-validation." (was: "...and plausibility checks to reduce the risk of manipulation" appended from elsewhere.) Note: the paper's own DP2 sentence literally reads "Sensor data **is** certified..." (a grammatical inconsistency versus DP1/DP3/DP4's "are"); normalized to "are" for internal consistency, flagged explicitly in the DP2 citation note.
- DP3: "Data owners determine when and to what extent their certified data is communicated to others." (was prefixed with "Let " — not in the source's DP3 sentence.)
- DP4: "Data are certified on the basis of a linearly scalable system architecture." (was: "Certify data on the basis of..." — active-voice paraphrase.)

**Files changed:** `blockchain-iot-sensor-data-dp1.md`, `-dp2.md`, `-dp3.md`, `-dp4.md` (frontmatter `description` + body text).

### 4. Design feature (DF1-DF9) descriptions

Checked against Section 4.3, Figure 3's short labels, and Figure 4's architecture. All 9 existing descriptions were accurate paraphrases consistent with the source (the paper does not give DFs single-sentence formal definitions the way it does for DRs/DPs, so no source-exact-quote substitution was applicable). **No content changes made** to DF1-DF5, DF7-DF9 descriptions; only DF6's relationship was corrected (see #1).

### 5. Citation evidence lines

Added a `[3] Source evidence: ...` line (matching the convention used elsewhere in the repo, e.g. `aligning-newsvendors-scoring-rules-dp1.md`) to **all 17 concept files** and to the paper record, citing precise section/table/figure/page. These lines were previously absent from every file in this paper's knowledge set.

### 6. Paper record (`knowledge/okf/papers/blockchain-iot-sensor-data.md`)

Updated the "Design knowledge" and "Design features" bullet-list summary lines to match the corrected DR/DP exact wording (item #2/#3 above), and added a `[3] Source evidence` citation line.

## Fields verified as already correct (no changes)

- Title, authors (exact order/spelling), year, venue, DOI/resource
- Methodology, DSR grid fields (problem description, input knowledge, research process, key concepts, solution description, output knowledge), dsr_solution_space
- Artifact description, summary
- DR1-DR4, DP1-DP4 labels and DR→DP "Addresses" edges (all matched Figure 3 and the surrounding text)
- DF1-DF9 labels, descriptions, and DP→DF "Implemented by"/DF→DP "Implements" edges except the DF6 mismapping

## Before/after counts

| | Before | After |
|---|---|---|
| Nodes (paper + concepts) | 18 | 18 (unchanged) |
| DR/DP/DF concept nodes | 17 (4+4+9) | 17 (4+4+9, unchanged) |
| Addresses/Implements edges | 11 | 11 (same count; 1 edge target corrected: DF6 moved from DP1 to DP4, DP1's "Implemented by" list shrank by 1, DP4's grew by 1) |

## Exact changed-file manifest

1. `knowledge/okf/papers/blockchain-iot-sensor-data.md`
2. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-dr1.md`
3. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-dr2.md`
4. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-dr3.md`
5. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-dr4.md`
6. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-dp1.md`
7. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-dp2.md`
8. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-dp3.md`
9. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-dp4.md`
10. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-df1.md` (citations only)
11. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-df2.md` (citations only)
12. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-df3.md` (citations only)
13. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-df4.md` (citations only)
14. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-df5.md` (citations only)
15. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-df6.md` (relationship fix + citations)
16. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-df7.md` (citations only)
17. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-df8.md` (citations only)
18. `knowledge/okf/design-knowledge/blockchain-iot-sensor-data-df9.md` (citations only)

No other paper's files were touched. `package.json`, tests, and indexes were left untouched per instructions.
