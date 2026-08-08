# Post-edit report: Striking a balance (coopetition dynamics, construction supply chains)

## Verified citation

Jonathan Lautenschlager, Jan Stramm, Tobias Guggenberger, Nils Urbach. "Striking a balance: Designing a blockchain-based solution to navigate coopetition dynamics in supply chain management." *Electronic Markets* 35:70 (2025). https://doi.org/10.1007/s12525-025-00809-4

Source PDF: `Striking a balance - Designing a blockchain-based solution to navigate.pdf` (24 pages, read in full).

## Source pages/tables/sections used

* p. 1: title, author list and order, affiliations, abstract, keywords.
* p. 3: RQ, DSR approach (Peffers et al. 2007).
* pp. 7-8: SLR method (23 items), coding procedure (Corbin & Strauss 1994), nine ex-post expert interviews (Table 1).
* p. 8: rationale for treating DOs as *overarching* (Integration Principle), not strictly separable.
* **p. 9-12**: "Design Objective 1-8" prose subsections, each individually headed and bolded.
* **p. 10, Table 2** ("Derivation of Design Objectives"): the paper's own formal, tabled statement of all eight design objectives, plus its own two-row grouping label column ("Competition" / "Cooperation").
* pp. 12-15: prototype architecture (Fig. 4), process views (Figs. 5-6), prototype screenshots (Fig. 7).
* **pp. 15-18**: "Derivation of the coopetitive blockchain solution implementation guidelines" - three individually bolded, numbered "Implementation Guideline" statements, each followed by an elaboration paragraph containing inline `(DO: n)` cross-references to specific design objectives.
* pp. 18-20: Discussion (Contributions, Limitations and future research).
* p. 20: Conclusion.

## Final concept inventory (11 items, up from 8)

**Design objectives (8, Table 2, article p. 10) - Competition cluster:**
* DO1 - Data protection
* DO2 - Accountability
* DO3 - Decentralization
* DO4 - Performance

**Design objectives - Cooperation cluster:**
* DO5 - Interoperability
* DO6 - Traceability
* DO7 - Transparency
* DO8 - Automation

**Design principles (3, new - "Implementation Guidelines," article pp. 16-18):**
* DP1 - Adopt decentralization when network effects outweigh implementation complexity
* DP2 - Use private data collections and channels for inter-organizational data protection
* DP3 - Layer privacy-enhancing technologies onto private channels for complete confidentiality

## Final relationship inventory

* **DO-DO relationships: 0.** No table, figure, or prose passage in the paper states an explicit relationship between the eight design objectives themselves. Left at 0 as instructed.
* **DP-DO relationships: 9**, all sourced from explicit inline `(DO: n)` citations inside each Implementation Guideline's elaboration paragraph (not inferred):
  * DP1 -> DO1, DO2, DO4, DO6, DO7, DO8 (citations: "(DO: 2, 6, 7)", "(DO: 4, 8)", "(DO: 4)" x2, "(DO: 1)", article pp. 16-17)
  * DP2 -> DO1, DO2, DO3, DO8 (citations: "(DO: 1)", "(DO: 2)", "(DO:3)", "(DO: 1, 3, 8)", "(DO: 3)", article p. 17)
  * DP3 -> DO1, DO2 (citation: "(DO: 1, 2)", article p. 18)

  These are recorded as one-directional "## Addresses" sections in each DP file (DP -> DO), matching the repo's existing convention (e.g. `short-end-opportunism-sharing-dp3.md`).

## Summary of every correction made

### 1. DO1 "verifiable by participants" clause - CONFIRMED and removed
`striking-balance-coopetition-do1.md`'s body previously read: *"...must be protected from unauthorized third parties **while remaining verifiable by participants**."* This clause is **not** part of the paper's own formal DO1 statement in Table 2 (p. 10): *"Data must be protected against internal and external attackers. Sensitive business data and personal data must be protected from access of unauthorized third parties."* The "verifiable by participants" phrase originates from a sentence in the DO1 elaboration paragraph that attributes the idea to a **different, cited paper**: "Bons et al. (2020) emphasize the need for data to be protected yet verifiable by participants, highlighting the necessity of robust data protection solutions" (p. 9). This is the source paper reporting someone else's finding, not its own formal design-objective statement - so it was removed as unsupported enrichment. Documented explicitly in DO1's new `[3] Source evidence` citation line.

### 2. Systemic over-enrichment across all 8 DOs - corrected
The DO1 issue turned out not to be isolated: **every one of DO2-DO8** also carried prose-derived enrichment beyond Table 2's terse formal wording (task instruction #4 required checking "each DO's exact wording," not just DO1). All eight were rewritten to track Table 2's own statement with only minimal grammatical normalization, removing narrative-only material:

| DO | Removed (not in Table 2, sourced from narrative prose elsewhere) |
|----|---|
| DO1 | "...while remaining verifiable by participants" (attributed to Bons et al. 2020, a cited paper) |
| DO2 | "...so participants know with whom they conduct business and actions can be attributed" |
| DO3 | "...and enable democratic decision-making and balanced power structures" |
| DO4 | "...with scalability, low latency and throughput sufficient for large construction supply networks" |
| DO5 | "(e.g., ERP, BIM)" and "...and lower market-entry barriers" |
| DO6 | "of products and goods" -> "product information" (Table 2's own noun); "...while protecting confidentiality in a coopetitive environment" |
| DO7 | "...with transparency levels adjustable to protect sensitive data" |
| DO8 | "(e.g., smart contracts executing payments on predefined conditions)" and "...and reduce human error" |

Each DO file's frontmatter `description`, body text, and citation section were kept in sync; the paper record (`striking-balance-coopetition.md`) and `design-knowledge/index.md` bullet lists were updated identically so no file states a different wording for the same objective.

### 3. Competition/Cooperation grouping - corrected (was materially wrong)
The task brief described the repo's claimed split as "DO1-DO3 under Competition and DO4-DO8 under Cooperation." That specific split was **not actually present anywhere in the repo** before this edit (grep confirmed no "Competition"/"Cooperation" text existed in any of this paper's files). However, Table 2 (p. 10) **does** formally label and group the objectives with its own row header column, and the correct grouping is:
* **Competition: DO1 (Data Protection), DO2 (Accountability), DO3 (Decentralization), DO4 (Performance)** - i.e., DO1-DO4, not DO1-DO3.
* **Cooperation: DO5 (Interoperability), DO6 (Traceability), DO7 (Transparency), DO8 (Automation)** - i.e., DO5-DO8, not DO4-DO8.

This four-and-four split (sourced directly from Table 2's own column) was added to the paper record's "Output knowledge" DSR-grid line and as `###` subheadings in its "Design knowledge" list, since it is directly checkable, paper-native information that improves fidelity without adding unsupported enrichment.

### 4. Implementation guidelines - CONFIRMED as formal, reusable concepts; added as DP1-DP3
The three "implementation guidelines" (article pp. 16-18) are **not** informal discussion asides. Each is individually presented as a bolded, numbered, freestanding, actionable statement using the exact same formal-labeling convention the paper itself uses for its design objectives ("Design Objective 1-Data protection", etc.), under a dedicated named subsection ("Derivation of the coopetitive blockchain solution implementation guidelines"). The paper explicitly frames them as a deliberate, numbered output: *"we present the three implementation guidelines ensuring they are actionable and rooted in the coopetition theoretical lens"* (p. 16). They are located in the "Conceptual architecture and prototype" section (immediately before "Evaluation"), not in "Discussion" as the task brief's paraphrase suggested - the Discussion section only *references* guidelines already derived earlier, it does not introduce them.

Given this formal labeling and the presence of explicit, source-stated `(DO: n)` cross-references to specific design objectives (satisfying the "explicit relationship" bar for step 6), three new design-principle concepts were added:
* `striking-balance-coopetition-dp1.md` (verbatim Implementation Guideline 1 statement)
* `striking-balance-coopetition-dp2.md` (verbatim Implementation Guideline 2 statement)
* `striking-balance-coopetition-dp3.md` (verbatim Implementation Guideline 3 statement)

### 5. Metadata verification (title, authors, year, venue, DOI, description, summary, artifact, methodology, dsr_grid, dsr_solution_space)
All confirmed accurate against the PDF and left unchanged, except:
* `dsr_solution_space` in the frontmatter: changed "...eight design objectives and implementation guidelines" -> "...eight design objectives and **three** implementation guidelines" (precise count, matching the paper's own count).
* "Solution description" DSR-grid bullet: same "three" correction.
* "Output knowledge" DSR-grid bullet: expanded to state the Competition/Cooperation grouping (correction #3) and the addition of the three implementation guidelines (correction #4).

Author order (Jonathan Lautenschlager, Jan Stramm, Tobias Guggenberger, Nils Urbach), year (2025), venue (Electronic Markets 35:70, 2025), and DOI (10.1007/s12525-025-00809-4) all verified correct against the PDF header/byline - no change needed.

### 6. Citations - `[3] Source evidence` lines added/updated
Added or corrected precise `[3] Source evidence` lines (citing exact table row / section / page) in:
* All 8 DO files (each now cites its Table 2 row + elaboration subsection + page).
* All 3 new DP files (each cites its Implementation Guideline number + page + the specific inline `(DO: n)` citations that ground its DP->DO relationships).
* The paper record (cites Table 2's grouping, the "Design Objective 1-8" subsections, and the implementation-guidelines section, and explicitly notes the absence of any DO-DO relationship statement in the source).

## Before/after counts

| | Before | After |
|---|---|---|
| Design objectives | 8 | 8 (all 8 wording-corrected) |
| Design principles | 0 | 3 (new) |
| Total design-knowledge concepts | 8 | 11 |
| DO-DO relationships | 0 | 0 (confirmed, none exist in source) |
| DP-DO relationships | 0 | 9 (all source-explicit via inline `(DO: n)` citations) |

## Changed-file manifest

Edited:
* `knowledge/okf/papers/striking-balance-coopetition.md`
* `knowledge/okf/design-knowledge/striking-balance-coopetition-do1.md`
* `knowledge/okf/design-knowledge/striking-balance-coopetition-do2.md`
* `knowledge/okf/design-knowledge/striking-balance-coopetition-do3.md`
* `knowledge/okf/design-knowledge/striking-balance-coopetition-do4.md`
* `knowledge/okf/design-knowledge/striking-balance-coopetition-do5.md`
* `knowledge/okf/design-knowledge/striking-balance-coopetition-do6.md`
* `knowledge/okf/design-knowledge/striking-balance-coopetition-do7.md`
* `knowledge/okf/design-knowledge/striking-balance-coopetition-do8.md`
* `knowledge/okf/design-knowledge/index.md` (this paper's section only)
* `knowledge/okf/papers/index.md` (this paper's line only, item count 8 -> 11)

Created:
* `knowledge/okf/design-knowledge/striking-balance-coopetition-dp1.md`
* `knowledge/okf/design-knowledge/striking-balance-coopetition-dp2.md`
* `knowledge/okf/design-knowledge/striking-balance-coopetition-dp3.md`
* `curation/papers/striking-balance-coopetition/post-edit-report.md` (this file)

No other paper's files, tests, or indexes were touched.
