---
type: paper
title: "Yes, I Do: Marrying Blockchain Applications with GDPR"
description: "The paper offers comprehensive guidance for developing GDPR-compliant blockchain solutions, contributing a generic framework and four design principles, and emphasizing the distinction between applications based on blockchain's data-integrity versus computational-integrity guarantees."
resource: "https://hdl.handle.net/10125/79900"
authors: "Benjamin Schellinger, Fabiane Voelter, Nils Urbach, Johannes Sedlmeir"
year: 2022
venue: "HICSS 55 (2022)"
methodology: "Action design research; structured literature review; derivation of a generic framework and design principles."
dsr_grid: true
dsr_solution_space: "Model/framework plus four design principles (design theory)."
tags:
  - yes-i-do-gdpr
  - gdpr-privacy
  - energy
  - compliance
  - framework
  - design-science-research
  - blockchain
timestamp: '2026-08-05T00:00:00+00:00'
---

# Yes, I Do: Marrying Blockchain Applications with GDPR

**Authors:** Benjamin Schellinger, Fabiane Voelter, Nils Urbach, Johannes Sedlmeir  
**Venue:** HICSS 55 (2022)  
**Link:** https://hdl.handle.net/10125/79900

## Summary

The paper offers comprehensive guidance for developing GDPR-compliant blockchain solutions, contributing a generic framework and four design principles, and emphasizing the distinction between applications based on blockchain's data-integrity versus computational-integrity guarantees.

## Artifact

A generic framework and design principles for GDPR-compliant blockchain applications (energy-sector use case).

## Methodology

Action design research; structured literature review; derivation of a generic framework and design principles.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Because of blockchains' intrinsic transparency and immutability, blockchain applications are challenged by privacy regulation such as the GDPR, so use cases often fail to scale to production.
* **Input knowledge.** GDPR requirements; the distinction between blockchains' data-integrity and computational-integrity guarantees; cryptographic and anonymization techniques; an energy-sector use case.
* **Research process.** Action design research: a structured literature review and derivation of a generic framework and design principles.
* **Key concepts.** Blockchain, GDPR, data integrity, computational integrity, privacy, design principles.
* **Solution description.** A generic framework and four design principles for developing GDPR-compliant blockchain applications. Solution-space representation: Model/framework plus four design principles (design theory).
* **Output knowledge.** Four design principles: GDPR compliance by design, state-of-the-art cryptography, differentiate the aims of data processing, and review all relevant laws.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design principle DP1: Acknowledge GDPR compliance by design](../design-knowledge/yes-i-do-gdpr-dp1.md) - Consider the requirements of the GDPR throughout the whole development cycle of the blockchain application.
* [Design principle DP2: Use state-of-the-art cryptography](../design-knowledge/yes-i-do-gdpr-dp2.md) - Always use the latest but established cryptographic techniques for hiding personal data.
* [Design principle DP3: Differentiate aims of data processing](../design-knowledge/yes-i-do-gdpr-dp3.md) - Differentiate the aims of data processing, since different anonymization techniques allow proving data integrity or computational integrity.
* [Design principle DP4: Review all relevant laws](../design-knowledge/yes-i-do-gdpr-dp4.md) - Do not only evaluate reconciliation with the GDPR but also further industry-specific laws.

# Citations
[1] Benjamin Schellinger, Fabiane Voelter, Nils Urbach, Johannes Sedlmeir. Yes, I Do: Marrying Blockchain Applications with GDPR. HICSS 55 (2022). https://hdl.handle.net/10125/79900
[2] Source document: Yes, I Do - Marrying Blockchain Applications with GDPR.pdf
[3] Source evidence: Section 6 ("Discussion and conclusion"), article p. 4638, for DP1-DP4 (already correctly represented in the corpus; corrected resource URI to match the PDF's own printed header "URI: https://hdl.handle.net/10125/79900", article p. 4631, which previously read 79760).
