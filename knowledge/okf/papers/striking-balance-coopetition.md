---
type: paper
title: "Striking a balance: Designing a blockchain-based solution to navigate coopetition dynamics in supply chain management"
description: "The paper suggests a blockchain architecture tailored to the construction industry that manages competition dependencies and privacy in coopetitive supply chains, deriving eight design objectives: data protection, accountability, decentralization, performance, interoperability, traceability, transparency and automation."
resource: "https://doi.org/10.1007/s12525-025-00809-4"
authors: "Jonathan Lautenschlager, Jan Stramm, Tobias Guggenberger, Nils Urbach"
year: 2025
venue: "Electronic Markets 35:70 (2025)"
methodology: "Design science research; systematic literature review (23 items); iterative stakeholder engagement; evaluation against design objectives."
dsr_grid: true
dsr_solution_space: "Instantiation (prototype/architecture) plus eight design objectives and three implementation guidelines."
tags:
  - striking-balance-coopetition
  - construction
  - supply-chain
  - coopetition
  - privacy
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# Striking a balance: Designing a blockchain-based solution to navigate coopetition dynamics in supply chain management

**Authors:** Jonathan Lautenschlager, Jan Stramm, Tobias Guggenberger, Nils Urbach  
**Venue:** Electronic Markets 35:70 (2025)  
**Link:** https://doi.org/10.1007/s12525-025-00809-4

## Summary

The paper suggests a blockchain architecture tailored to the construction industry that manages competition dependencies and privacy in coopetitive supply chains, deriving eight design objectives: data protection, accountability, decentralization, performance, interoperability, traceability, transparency and automation.

## Artifact

A blockchain architecture for coopetitive supply chains (construction industry) with privacy-enhancing technologies.

## Methodology

Design science research; systematic literature review (23 items); iterative stakeholder engagement; evaluation against design objectives.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Blockchain supply-chain systems do not adequately manage competition dependencies and the excessive disclosure of sensitive information in coopetition.
* **Input knowledge.** Coopetition as the theoretical lens; trust; data-protection and privacy-enhancing technologies; construction supply-chain-management literature.
* **Research process.** Design science research: a systematic literature review (23 items), grounded coding to derive design objectives, iterative stakeholder engagement, and evaluation against the objectives.
* **Key concepts.** Coopetition, blockchain technology, data transparency, delivery invoices, construction industry, supply chain automation.
* **Solution description.** A blockchain architecture with privacy-enhancing technologies that balances cooperation and competition in construction supply chains. Solution-space representation: Instantiation (prototype/architecture) plus eight design objectives and three implementation guidelines.
* **Output knowledge.** Eight design objectives (Table 2, article p. 10) - grouped by the paper itself into a "Competition" cluster (data protection, accountability, decentralization, performance - DO1-DO4) and a "Cooperation" cluster (interoperability, traceability, transparency, automation - DO5-DO8) - plus three implementation guidelines derived from the artifact development and expert evaluations.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

### Design objectives - Competition cluster (Table 2, article p. 10)

* [Design objective DO1: Data protection](../design-knowledge/striking-balance-coopetition-do1.md) - Protect data against internal and external attackers; sensitive business data and personal data must be protected from access by unauthorized third parties.
* [Design objective DO2: Accountability](../design-knowledge/striking-balance-coopetition-do2.md) - Ensure organizations are identifiable in the network to enable accountability.
* [Design objective DO3: Decentralization](../design-knowledge/striking-balance-coopetition-do3.md) - Provide a decentralized solution to prevent monopolistic market dependencies.
* [Design objective DO4: Performance](../design-knowledge/striking-balance-coopetition-do4.md) - Enable the system to handle many transactions fast.

### Design objectives - Cooperation cluster (Table 2, article p. 10)

* [Design objective DO5: Interoperability](../design-knowledge/striking-balance-coopetition-do5.md) - Make the solution integrable and interoperable with existing systems to accomplish true cooperation.
* [Design objective DO6: Traceability](../design-knowledge/striking-balance-coopetition-do6.md) - Provide product information at any time to enforce process automation through traceability.
* [Design objective DO7: Transparency](../design-knowledge/striking-balance-coopetition-do7.md) - Provide transparency to achieve the benefits of cooperation and information sharing.
* [Design objective DO8: Automation](../design-knowledge/striking-balance-coopetition-do8.md) - Boost process efficiency by enforcing automation.

### Implementation guidelines (article pp. 16-18)

* [Design principle DP1: Adopt decentralization when network effects outweigh implementation complexity](../design-knowledge/striking-balance-coopetition-dp1.md) - Opt for a decentralized solution when the benefits of leveraging network effects in a coopetitive market surpass the complexities and challenges of its implementation.
* [Design principle DP2: Use private data collections and channels for inter-organizational data protection](../design-knowledge/striking-balance-coopetition-dp2.md) - Utilize private data collections and private channels to protect inter-organizational data exchanges from unauthorized third-party access.
* [Design principle DP3: Layer privacy-enhancing technologies onto private channels for complete confidentiality](../design-knowledge/striking-balance-coopetition-dp3.md) - Enhance private data collections and channels with additional privacy-preserving technologies to ensure complete data confidentiality.

# Citations
[1] Jonathan Lautenschlager, Jan Stramm, Tobias Guggenberger, Nils Urbach. Striking a balance: Designing a blockchain-based solution to navigate coopetition dynamics in supply chain management. Electronic Markets 35:70 (2025). https://doi.org/10.1007/s12525-025-00809-4
[2] Source document: Striking a balance - Designing a blockchain-based solution to navigate.pdf
[3] Source evidence: Table 2 "Derivation of Design Objectives" (article p. 10) formally states and groups DO1-DO8 under "Competition" (Data Protection, Accountability, Decentralization, Performance) and "Cooperation" (Interoperability, Traceability, Transparency, Automation); each objective is individually elaborated in "Design Objective 1-8" subsections (article pp. 9-12). The three implementation guidelines are formally, individually bolded and numbered under "Derivation of the coopetitive blockchain solution implementation guidelines" (article pp. 16-18): "Our artifact development and expert evaluations resulted in the formulation of three implementation guidelines... we present the three implementation guidelines ensuring they are actionable and rooted in the coopetition theoretical lens" (article p. 16). Each guideline's elaboration paragraph explicitly cross-references specific design objectives via inline "(DO: n)" citations, which are the source for the DP->DO "Addresses" relationships recorded in the individual DP concept files. No explicit relationships between the design objectives themselves (DO-DO) are stated anywhere in the paper via prose, table, or figure.
