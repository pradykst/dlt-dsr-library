# Post-edit fidelity report: Decentralized Procurement Mechanisms for Efficient Logistics Services Mapping

**Date of audit:** 2026-08-08
**Source PDF:** `Decentralized Procurement Mechanisms for Efficient Logistics Services.pdf` (Proceedings of the 55th Hawaii International Conference on System Sciences | 2022, pp. 5050-5059)
**Full text read:** All 10 pages (abstract through references), including Table 1, Table 2, and Figure 1.

## Verified citation

Tiphaine Henry, Roman Beck, Nassim Laga, Walid Gaaloul, Shenle Pan. "Decentralized Procurement Mechanisms for Efficient Logistics Services Mapping - a Design Science Research Approach." Proceedings of the 55th Hawaii International Conference on System Sciences (HICSS-55), 2022, pp. 5050-5059. https://hdl.handle.net/10125/79952

## Source pages/sections used

* p. 5050 - title page (author names, order, affiliations; footer URI).
* p. 5051-5052 - Introduction, RQ1/RQ2.
* p. 5052-5053 - Section 4, DSR methodology (requirements -> objectives -> features -> principles pipeline; two evaluation cycles: 14-participant usability test, then two focus groups of academics/industry experts).
* p. 5053-5054 - Section 5.1 "Designing requirements" (R1-R5) and Section 5.2 "Artifact principles" (P1-P3), with explicit "(cf R#)" cross-references between them.
* p. 5054-5055 - Section 5.3 "Emerging features" (prose only, no F1/F2/F3 labels or table - not formally enumerated, so not added as design-knowledge items).
* p. 5056 - Section 6.2 "Theory generation" and Table 2 ("Blockchain-based FTSP mapping nascent design principles": Understandability, Automation, QoS-metrics privacy).
* p. 5056-5057 - elaboration of DP1-DP3 and their resonance with other papers' principles (no explicit relationship stated between DP1, DP2 and DP3 themselves).
* p. 5057-5058 - Discussion/conclusion, restating the three nascent principles.

## Corrections made

### Paper record (`knowledge/okf/papers/decentralized-procurement-logistics.md`)

1. **Authors — factual error, corrected.** The record listed only 3 authors ("Tiphaine Henry, Roman Beck, Walid Gaaloul"), omitting two authors present on the title page. Corrected to the full 5-author list in title-page order: **Tiphaine Henry, Roman Beck, Nassim Laga, Walid Gaaloul, Shenle Pan.**
2. **Resource URL — factual error, corrected.** The record cited `https://hdl.handle.net/10125/79936`. The PDF's own footer (printed on pp. 5050-5051) states `URI: https://hdl.handle.net/10125/79952`. Corrected to `79952` (and matched in all three DP files, the three new DO files, and the five new DR files).
3. **Venue — normalized to the paper's own naming.** "HICSS 55 (2022)" -> "Proceedings of the 55th Hawaii International Conference on System Sciences (HICSS-55), 2022" (as printed on the paper's running header).
4. **Description/summary — expanded to reflect the full formal concept inventory** (previously described only the 3 nascent design principles, omitting the paper's formally listed R1-R5 requirements and P1-P3 objectives).
5. **Methodology — expanded** to name the two concrete evaluation cycles (14-participant moderated usability test; two expert focus groups) instead of the generic "prototype development cycles; evaluation."
6. **DSR grid "Research process" and "Output knowledge"** updated to mention the requirements/objectives derivation step and the R1-R5/P1-P3/DP1-DP3 inventory.
7. **Design knowledge section** rebuilt to list all 11 concepts (5 requirements, 3 objectives, 3 principles) instead of only the 3 principles.
8. Added `[3] Source evidence: ...` citation line.

### DP1/DP2/DP3 concept files

* **Wording correction (paraphrase -> exact source statement).** All three descriptions were previously paraphrased/enriched restatements drawn loosely from the discussion prose (e.g. DP1: "Adequately explain the smart-contract decision-making process (e.g., allocation computation outputs) to non-technical users in order to counter the black-box issue and encourage adoption."). These have been replaced with the paper's own formally tabled statement from **Table 2** ("Blockchain-based FTSP mapping nascent design principles," p. 5056):
  * DP1 (Understandability): "The smart contract shipper-carrier allocation protocol must be displayed to the shipper."
  * DP2 (Automation): "The FTSP process must be carried on in an end-to-end fashion by the smart contract."
  * DP3 (Metrics privacy): "The allocation mechanism must keep sensitive data off-chain in competitive markets."
* **Table 2 row label note.** Table 2 itself labels the third row "QoS-metrics privacy," while the abstract, introduction, and conclusion consistently shorten this to "metrics privacy." Kept the existing title "DP3 - Metrics privacy" (matching the paper's own predominant usage) and documented both labels in the `[3] Source evidence` line so the discrepancy is traceable rather than silently dropped.
* **Resource URL** corrected from `79936` to `79952` in all three files.
* **Author list** corrected to the full 5 authors in all three files.
* **Venue/citation line [1]** updated to the corrected 5-author, full-venue citation.
* **Added `[3] Source evidence: ...` line** in all three files, citing Table 2 (p. 5056) plus the elaborating paragraph in Section 6.2 (pp. 5056-5057), with a note that no explicit relationship between DP1, DP2 and DP3 is stated in the source (each principle's "resonance" is drawn only to *other papers'* principles, e.g. [30], [47], [31], [28] - not to each other), so no "Related design principles" section was added — relationship count among DP1-DP3 remains **0**, confirmed correct.

### New concept files added (previously missing from the corpus)

The paper formally and reusably enumerates two additional knowledge layers **before** the three nascent design principles, both under dedicated, explicitly labeled subsections — not general discussion prose:

* **Section 5.1 "Designing requirements" (p. 5053-5054)** explicitly identifies "five design requirements... (R1-R5 hereinafter)" via a numbered in-text list. Added as 5 design-requirement concepts:
  * `decentralized-procurement-logistics-dr1.md` - R1: Allocation flexibility
  * `decentralized-procurement-logistics-dr2.md` - R2: Autonomous allocation process
  * `decentralized-procurement-logistics-dr3.md` - R3: Real-time payment (source text has a duplicated verb, "must provide enact real-time payment"; normalized minimally to "must enact real-time payment," documented in the citation note — no wording added beyond the source)
  * `decentralized-procurement-logistics-dr4.md` - R4: CMR regulations compliance
  * `decentralized-procurement-logistics-dr5.md` - R5: Delivery history integrity and traceability
* **Section 5.2 "Artifact principles" (p. 5054)** explicitly labels three artifact-level constructs P1, P2, P3, which the paper's own Section 4 methodology narrative (p. 5053) describes as "a set of three design objectives" merged from R1-R5. Added as 3 design-objective concepts (typed `design-objective` to match this corpus's convention for the requirements->objectives->principles pipeline, and to avoid collision with the "DP" prefix already used for the nascent design principles):
  * `decentralized-procurement-logistics-do1.md` - P1: Platform operating costs reduction
  * `decentralized-procurement-logistics-do2.md` - P2: Contractual flexibility
  * `decentralized-procurement-logistics-do3.md` - P3: Allocation integrity
* **Section 5.3 "Emerging features" (p. 5054-5055) was checked and deliberately NOT added.** Although organized by P1/P2/P3, the features (autonomous allocation mechanism, customizable QoS weighting formula, profile smart contract) are described only in discursive prose with no F1/F2/F3 labels, numbered list, or table — this fails the "formally/reusably tabled or listed" bar set for this audit, so no design-feature concepts were created.

### Relationships found and encoded

The paper explicitly cross-references its own requirements and objectives with "(cf R#)" citations in Section 5.2 (p. 5054), which were encoded as explicit `Addresses` / `Addressed by` links:

* R1 (Allocation flexibility) -> addresses P1 and P2
* R2 (Autonomous allocation process) -> addresses P1
* R3 (Real-time payment) -> addresses P2
* R4 (CMR regulations compliance) -> addresses P3
* R5 (Delivery history integrity and traceability) -> addresses P3

No explicit relationship is stated in the source between the R1-R5/P1-P3 layer and the DP1-DP3 nascent design principles (they are derived independently, from the later prototype-evaluation cycles), and no explicit relationship is stated among DP1, DP2, and DP3 themselves. Both were left at 0 relationships, per the "only add if explicit" rule.

## Final concept inventory by type

| Type | Count | Items |
|---|---|---|
| Design requirement | 5 | R1 Allocation flexibility, R2 Autonomous allocation process, R3 Real-time payment, R4 CMR regulations compliance, R5 Delivery history integrity and traceability |
| Design objective | 3 | P1 Platform operating costs reduction, P2 Contractual flexibility, P3 Allocation integrity |
| Design principle | 3 | DP1 Understandability, DP2 Automation, DP3 Metrics privacy |
| Design feature | 0 | (not formally tabled/listed in source - correctly absent) |
| **Total** | **11** | |

## Final relationship inventory

| From | Relationship | To |
|---|---|---|
| R1 | addresses | P1 |
| R1 | addresses | P2 |
| R2 | addresses | P1 |
| R3 | addresses | P2 |
| R4 | addresses | P3 |
| R5 | addresses | P3 |
| DP1, DP2, DP3 | (none) | — no explicit inter-principle relationship in source |
| R/P layer <-> DP layer | (none) | — no explicit cross-layer relationship in source |

## Before/after counts

* Design-knowledge concept files: **3 -> 11** (+8: 5 new DR files, 3 new DO files)
* Relationships: **0 -> 6** (R-to-P "Addresses" links; DP-to-DP relationships remain 0, correctly)
* Authors on record: **3 -> 5** (added Nassim Laga, Shenle Pan; corrected order)
* Resource identifier: `10125/79936` -> `10125/79952` (9 files corrected)

## Changed-file manifest

Modified:
* `knowledge/okf/papers/decentralized-procurement-logistics.md`
* `knowledge/okf/design-knowledge/decentralized-procurement-logistics-dp1.md`
* `knowledge/okf/design-knowledge/decentralized-procurement-logistics-dp2.md`
* `knowledge/okf/design-knowledge/decentralized-procurement-logistics-dp3.md`
* `knowledge/okf/design-knowledge/index.md` (this paper's section only)
* `knowledge/okf/papers/index.md` (this paper's line only)

Created:
* `knowledge/okf/design-knowledge/decentralized-procurement-logistics-dr1.md`
* `knowledge/okf/design-knowledge/decentralized-procurement-logistics-dr2.md`
* `knowledge/okf/design-knowledge/decentralized-procurement-logistics-dr3.md`
* `knowledge/okf/design-knowledge/decentralized-procurement-logistics-dr4.md`
* `knowledge/okf/design-knowledge/decentralized-procurement-logistics-dr5.md`
* `knowledge/okf/design-knowledge/decentralized-procurement-logistics-do1.md`
* `knowledge/okf/design-knowledge/decentralized-procurement-logistics-do2.md`
* `knowledge/okf/design-knowledge/decentralized-procurement-logistics-do3.md`
* `curation/papers/decentralized-procurement-logistics/post-edit-report.md` (this report)

No other papers' files, tests, or indexes were touched.
