# Post-edit fidelity audit: "Digging for Quality Management in Production Systems"

## Verified citation

Norman Pytel, Benedikt Putz, Fabian Boehm, Axel Winkelmann. "Digging for Quality Management in Production Systems: A Solution Space for Blockchain Collaborations." *ICIS 2022 Proceedings*, paper 15. https://aisel.aisnet.org/icis2022/blockchain/blockchain/15

Source PDF: `Digging for Quality Management in Production Systems.pdf` (17 printed pages; PDF pages 1-18 including AISeL cover sheet). Read in full. All metadata fields (title, author order — Pytel, Putz, Böhm, Winkelmann — year 2022, venue, resource URL, keywords) were checked against the title page/abstract and found already correct; no changes were needed there.

## Figure 5 mapping determination — AMBIGUOUS, DELIBERATELY LEFT UNMAPPED

Figure 5, "Mapping of meta-design requirements and corresponding design principles" (printed p. 13 / PDF page 14), is a two-column, six-row table (MDR1-MDR6 on the left, DP1-DP6 on the right) connected by line-segment connectors drawn in the gutter between the columns. An initial pass concluded the mapping was a simple row-i-to-row-i diagonal based on `pdftotext -layout` column alignment and thematic word-matching in the surrounding prose (e.g. "UTID" appears in both MDR3 and DP3; "confidentiality" in both MDR6 and DP6). That conclusion was overridden after direct inspection:

1. **Visual inspection.** The figure was rendered as a high-resolution image directly from the PDF (`pdfplumber`, 400-2400 dpi crops of PDF page 14) and the connector region between the two columns was visually inspected. The connectors are not six parallel horizontal lines; they visibly cross between MDR2/MDR3 and DP2/DP3, and again between MDR5/MDR6 and DP5/DP6, forming X-shaped crossings.
2. **Vector-level inspection.** The underlying PDF line objects for the connector region were extracted directly (`page.lines`, exact x/y coordinates). The MDR-column and DP-column row label y-positions were independently confirmed (MDR*i* and DP*i* labels sit at matching y-levels: rows at y ≈ 82.4, 103.2, 124.0, 144.8, 165.6, 186.3 pt for rows 1-6). Ten line segments were found in the connector gutter, not six. Critically, one segment runs from y=82.4 (the row-1 level on the MDR side) to y=103.2 (the row-2 level on the DP side) — i.e., a connector spanning from MDR1's row position to DP2's row position, which is inconsistent with a clean, monotonic MDR*i*->DP*i* diagonal. The remaining segments include further row-crossing spans (e.g. y=103.2->144.9, spanning from row 2 to row 4) mixed with near-zero-length segments at each row boundary, consistent with a genuinely non-diagonal or zig-zag-style connector drawing that cannot be confidently resolved into six unambiguous 1:1 pairs from geometry alone.
3. **Prose check.** The paragraph immediately following Figure 5 discusses DP1-DP6 in order but never writes a sentence of the form "DPx addresses MDRx" or otherwise explicitly states the pairing; the apparent thematic overlaps (UTID, confidentiality, events) are the curator's own inference from shared vocabulary, not an explicit source statement.

**Conclusion: the exact MDR-to-DP pairing cannot be determined with confidence, either from the figure's connector geometry or from explicit prose.** Per this corpus's rule that ambiguous figure mappings must not be guessed, no MDR-to-DP relationship is recorded. All 12 source-authored concepts (6 MDR + 6 DP) are represented; the ambiguity is documented in each DP file's `[3] Source evidence` line and in the paper record, rather than resolved by invented edges. Zero speculative edges is treated as correct here, not as an incomplete result.

## Final concept inventory (12 concepts, up from 6)

**Meta-requirements (6, all new):**
- MDR1 — Minimal necessary traceability objects (`quality-management-production-mdr1.md`)
- MDR2 — Efficient communication of affected PS, Quality, and System objects (`quality-management-production-mdr2.md`)
- MDR3 — UTIDs for harmonized object identification (`quality-management-production-mdr3.md`)
- MDR4 — Integration of object types and events (`quality-management-production-mdr4.md`)
- MDR5 — Simple architecture for horizontal network-partner scalability (`quality-management-production-mdr5.md`)
- MDR6 — Security mechanisms for confidentiality (`quality-management-production-mdr6.md`)

**Design principles (6, pre-existing, corrected):**
- DP1 — Standardized representation of traceability objects (`quality-management-production-dp1.md`)
- DP2 — Extended quality control over communication and objects (`quality-management-production-dp2.md`)
- DP3 — Import objects from traditional information systems (`quality-management-production-dp3.md`)
- DP4 — Standardized token events (`quality-management-production-dp4.md`)
- DP5 — Easy integration without enterprise-system modification (`quality-management-production-dp5.md`)
- DP6 — Confidentiality of available information (`quality-management-production-dp6.md`)

`type: meta-requirement` was used for the new concepts (matching the repo-wide convention for this construct, confirmed against `bemi-marketplace-interfaces-mr1.md`, `matchmaking-additive-manufacturing-mr1.md`, `bond-markets-tokenization-tac-mr1.md`, `msp-sustainability-circular-mr1.md`, `gdpr-credential-verification-mr1.md`). The paper's own abbreviation "MDR" (meta-design requirement, as used in Figure 5) was preserved verbatim in `label`, `title`, and headings/file-slugs for source fidelity, since it is textually distinct from the generic "MR" used by other corpus papers.

## Final relationship inventory: 0 (deliberately)

No MDR-to-DP relationships are recorded. See the "Figure 5 mapping determination" section above for the full reasoning. No other relationship types (MDR-to-MDR, DP-to-DP) are stated anywhere in the source, so none were added there either.

## Corrections made

1. **DP1/DP3 truncation fixed.** Both `description` frontmatter fields were cut off mid-sentence ("...before developin...", "...supply..."). Root cause: the prior descriptions used a *paraphrased* run-on sentence built from the discussion prose after Figure 5, rather than the source's own formally tabled DP statement, and got truncated. Fix: replaced the body/description of **all six** DP files with the exact, complete, formally tabled wording from Figure 5 itself (not just DP1/DP3), per the task's instruction to verify all six against the source's own numbered/tabled list. Each new statement is a single complete sentence copied verbatim from the table.
   - DP1: "The system contains a consistent understanding among organizations of traceability terminologies and valuable objects."
   - DP2: "The system provides hybrid tokens to map direct and indirect objects of different object types."
   - DP3: "The system provides import of objects from traditional IS (e.g., ERP, MES, QMS) and export of UTIDs."
   - DP4: "The system provides functions to ensure standardized events for tokens."
   - DP5: "The system provides USID (e.g., system IDs, license) integration through the BC system or token configuration."
   - DP6: "The system provides confidentiality by design mechanisms."
   (DP titles were left unchanged — they are curator-authored summaries and remained accurate under the corrected wording.)
2. **Added six missing meta-design-requirement concepts** (MDR1–MDR6), which the source paper formally tables in Figure 5 alongside the DPs, and which were completely absent from the corpus prior to this audit.
3. **Deliberately added zero MDR-to-DP relationships** — see determination above. An initial draft had added six `Addresses` edges (DPi -> MDRi) based on an insufficiently rigorous reading of Figure 5 (column alignment via `pdftotext -layout` plus thematic word-matching); this was corrected after direct visual and vector-level inspection of the figure's connector-line geometry showed the mapping does not resolve to a clean diagonal.
4. **Updated `[3] Source evidence:` citation lines** in all 6 DP files (previously absent) and added them to all 6 new MDR files and to the paper record, each citing the precise page/section/figure used, and each DP file's citation explicitly documents why no MDR relationship is recorded.
5. **Paper record (`quality-management-production.md`):** description/summary updated to state "six meta-design requirements (MDR1-MDR6) and six corresponding design principles (DP1-DP6)"; "Output knowledge" grid field updated to state that Figure 5 visually pairs them but the connector geometry does not resolve to an unambiguous mapping, so no canonical relationship is recorded; "Design knowledge" list extended to include the 6 new MDR entries (ordered before the DPs, matching the corpus's existing MR-before-DP convention); citations block gained a `[3] Source evidence` line documenting the ambiguity analysis in detail.
6. No other metadata fields (title, authors, year, venue, resource, methodology, dsr_grid, tags) required correction — all were already accurate against the PDF.

## Before/after counts

| | Before | After |
|---|---|---|
| Concepts for this paper | 6 (DP1–DP6 only) | 12 (MDR1–MDR6 + DP1–DP6) |
| Relationships for this paper | 0 | 0 (deliberately; see determination above) |
| DP files with truncated description | 2 (DP1, DP3) | 0 |
| DP files with `[3] Source evidence` citation | 0 | 6 |
| Paper record "Design knowledge" list entries | 6 | 12 |
| `papers/index.md` item count for this paper | "6 design-knowledge item(s)" | "12 design-knowledge item(s)" |

## Changed-file manifest

- `knowledge/okf/papers/quality-management-production.md` — description/summary/output-knowledge updated, Design knowledge list extended with MDR1–MDR6, `[3]` citation added documenting the Figure-5 ambiguity, timestamp bumped.
- `knowledge/okf/design-knowledge/quality-management-production-dp1.md` — description/body fixed (truncation resolved, exact tabled wording), `[3]` citation added (no relationship recorded).
- `knowledge/okf/design-knowledge/quality-management-production-dp2.md` — description/body corrected to exact tabled wording, `[3]` citation added (no relationship recorded).
- `knowledge/okf/design-knowledge/quality-management-production-dp3.md` — description/body fixed (truncation resolved, exact tabled wording), `[3]` citation added (no relationship recorded).
- `knowledge/okf/design-knowledge/quality-management-production-dp4.md` — description/body corrected to exact tabled wording, `[3]` citation added (no relationship recorded).
- `knowledge/okf/design-knowledge/quality-management-production-dp5.md` — description/body corrected to exact tabled wording, `[3]` citation added (no relationship recorded).
- `knowledge/okf/design-knowledge/quality-management-production-dp6.md` — description/body corrected to exact tabled wording, `[3]` citation added (no relationship recorded).
- `knowledge/okf/design-knowledge/quality-management-production-mdr1.md` — new file (meta-requirement MDR1).
- `knowledge/okf/design-knowledge/quality-management-production-mdr2.md` — new file (meta-requirement MDR2).
- `knowledge/okf/design-knowledge/quality-management-production-mdr3.md` — new file (meta-requirement MDR3).
- `knowledge/okf/design-knowledge/quality-management-production-mdr4.md` — new file (meta-requirement MDR4).
- `knowledge/okf/design-knowledge/quality-management-production-mdr5.md` — new file (meta-requirement MDR5).
- `knowledge/okf/design-knowledge/quality-management-production-mdr6.md` — new file (meta-requirement MDR6).
- `knowledge/okf/design-knowledge/index.md` — this paper's section updated to list MDR1–MDR6 before DP1–DP6, with corrected DP descriptions.
- `knowledge/okf/papers/index.md` — this paper's item-count updated from 6 to 12.
- `curation/papers/quality-management-production/post-edit-report.md` — this report.

No other paper's files, tests, or indexes were touched.
