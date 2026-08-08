---
type: paper
title: "Design Principles for Blockchain-based Applications in Green Bond Reporting"
description: "The paper derives six design principles for blockchain-based green bond reporting that reflect the most relevant blockchain concepts and today's green bond process, helping organizations make informed design decisions to strengthen the credibility of sustainable capital markets."
resource: "https://hdl.handle.net/10125/103268"
authors: "Ameera Darwish, Juho Lindman, Jesper Hjertqvist, Olgerta Tona"
year: 2023
venue: "HICSS 56 (2023)"
methodology: "Design science research; ten expert interviews and blockchain literature; artificial evaluation and demonstration."
dsr_grid: true
dsr_solution_space: "Design principles (nascent design theory) with artificial evaluation and demonstration."
tags:
  - green-bond-reporting-dp
  - finance-bonds
  - sustainability
  - green-bonds
  - reporting
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# Design Principles for Blockchain-based Applications in Green Bond Reporting

**Authors:** Ameera Darwish, Juho Lindman, Jesper Hjertqvist, Olgerta Tona  
**Venue:** HICSS 56 (2023)  
**Link:** https://hdl.handle.net/10125/103268

## Summary

The paper derives six design principles for blockchain-based green bond reporting that reflect the most relevant blockchain concepts and today's green bond process, helping organizations make informed design decisions to strengthen the credibility of sustainable capital markets.

## Artifact

Design principles for blockchain-based applications supporting green bond reporting.

## Methodology

Design science research; ten expert interviews and blockchain literature; artificial evaluation and demonstration.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** The credibility of emerging sustainable capital markets depends on the trustworthiness of the data used to report the green impact of projects financed by green bonds.
* **Input knowledge.** Blockchain literature on consensus, smart contracts, incentives and roles; the green-bond reporting process and domain; expert interviews.
* **Research process.** Design science research: ten expert interviews plus blockchain literature, with an artificial evaluation and demonstration of the principles.
* **Key concepts.** Blockchain, green bond reporting, design science, sustainable finance.
* **Solution description.** Design principles for blockchain-based green-bond reporting (consortium chain, PoA consensus, smart-contract validation, reputation incentives, off-chain decisions, role-based privileges). Solution-space representation: Design principles (nascent design theory) with artificial evaluation and demonstration.
* **Output knowledge.** Six design principles for blockchain-based green-bond reporting.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design principle DP1: Consortium blockchain](../design-knowledge/green-bond-reporting-dp-dp1.md) - Use a consortium blockchain.
* [Design principle DP2: Proof-of-authority consensus](../design-knowledge/green-bond-reporting-dp-dp2.md) - The proof-of-authority consensus mechanism is suitable due to some level of trust already existing.
* [Design principle DP3: Smart-contract document validation](../design-knowledge/green-bond-reporting-dp-dp3.md) - Smart contracts can validate that an authorized party uploaded and signed the file.
* [Design principle DP4: Reputation-based incentives](../design-knowledge/green-bond-reporting-dp-dp4.md) - Design for reputation rather than monetary incentives.
* [Design principle DP5: Off-chain decision-making](../design-knowledge/green-bond-reporting-dp-dp5.md) - Off-chain decisions different stakeholders take remain in their current format. On-chain decisions are facilitated through smart contracts.
* [Design principle DP6: Role-based privileges](../design-knowledge/green-bond-reporting-dp-dp6.md) - The issuer, second opinion provider, and investor are identified as different roles with different privilege rights, such as access and editing rights and building and approving blocks.

# Citations
[1] Ameera Darwish, Juho Lindman, Jesper Hjertqvist, Olgerta Tona. Design Principles for Blockchain-based Applications in Green Bond Reporting. Proceedings of the 56th Hawaii International Conference on System Sciences (HICSS 56), 2023, pp. 5186-5195. https://hdl.handle.net/10125/103268
[2] Source document: Design Principles for Blockchain-based Applications in Green Bond.pdf
[3] Source evidence: Title, authors and venue verified against article header and footer, p. 5186 ("Proceedings of the 56th Hawaii International Conference on System Sciences | 2023", "URI: https://hdl.handle.net/10125/103268"). DSR grid fields verified against Section 3 ("Design Science Research Approach"), pp. 5189-5190 (DSRM per Peffers et al., 2007: problem identification via ten expert interviews plus literature, Table 2 lists respondents; objective definition; two design-and-development iterations; ex-ante evaluation via two expert interviews using Prat et al. 2015 criteria - understandability, operational feasibility, usefulness; ex-post demonstration via a Nordic green-loan organization interview, Section 5, p. 5191). The six design principles are the atomic output knowledge, individually numbered DP1-DP6 in Section 4, pp. 5190-5191, and summarized in Table 3 ("Revised design principles"), p. 5192. No formally numbered design requirements/meta-requirements layer precedes the DPs in the source: Section 3 states only a single, non-itemized artifact objective ("to assist practitioners in making informed design decisions regarding blockchain applications for green bond reporting", p. 5189), and Table 1 ("Fundamental concepts of our Blockchain design", p. 5189) lists background domain/concept/component categories, not formal requirements. The demonstration evaluation (Section 5, p. 5191) explicitly notes as a limitation/critique that "the principles were missing system requirements" - confirming the paper itself did not derive a separate requirements layer.
