---
type: paper
title: "And No One Gets the Short End of the Stick: A Blockchain-Based Approach to Solving the Two-Sided Opportunism Problem in Interorganizational Information Sharing"
description: "To counter two-sided opportunism (information poaching by the recipient and information manipulation by the provider), the paper derives three design principles for an IS that facilitates reliable information sharing on sensitive data without revealing the actual data, and instantiates them in a machine-tool leasing consortium."
resource: "https://doi.org/10.1287/isre.2022.0065"
authors: "Lukas Florian Bossler, Arne Buchwald, Kai Spohrer"
year: 2025
venue: "Information Systems Research 36(3), 2025, 1565-1586"
methodology: "Design science research; multicompany consortium (wear-based machine-tool leasing); expert interviews; survey-based evaluation."
dsr_grid: true
dsr_solution_space: "Instantiation (consortium artifact) plus three design principles (design theory)."
tags:
  - short-end-opportunism-sharing
  - interorganizational
  - information-sharing
  - trust
  - manufacturing
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# And No One Gets the Short End of the Stick: A Blockchain-Based Approach to Solving the Two-Sided Opportunism Problem in Interorganizational Information Sharing

**Authors:** Lukas Florian Bossler, Arne Buchwald, Kai Spohrer  
**Venue:** Information Systems Research 36(3), 2025, 1565-1586  
**Link:** https://doi.org/10.1287/isre.2022.0065

## Summary

To counter two-sided opportunism (information poaching by the recipient and information manipulation by the provider), the paper derives three design principles for an IS that facilitates reliable information sharing on sensitive data without revealing the actual data, and instantiates them in a machine-tool leasing consortium.

## Artifact

An information system that enables sensitive interorganizational information sharing without revealing the underlying data.

## Methodology

Design science research; multicompany consortium (wear-based machine-tool leasing); expert interviews; survey-based evaluation.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Two-sided opportunism - information poaching by the recipient and information manipulation by the provider - can preclude beneficial interorganizational information sharing based on sensitive data.
* **Input knowledge.** Opportunism from a transaction-cost/agency perspective; prior organizational and technical countermeasures against opportunism; blockchain.
* **Research process.** Design science research in a multicompany consortium for wear-based machine-tool leasing: workshops, in-depth expert interviews (demonstration), and a survey-based utility evaluation.
* **Key concepts.** Information sharing, interorganizational information systems, opportunism, poaching, manipulation, blockchain.
* **Solution description.** An information system that shares information derived from sensitive data without revealing it, via confidential storage with proof of integrity, nonreversible independent computation, and joint approval. Solution-space representation: Instantiation (consortium artifact) plus three design principles (design theory).
* **Output knowledge.** Three design principles addressing the prevention of manipulation (DR1) and poaching (DR2).

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design requirement DR1: Prevent information manipulation](../design-knowledge/short-end-opportunism-sharing-dr1.md) - The system must prevent the information provider from manipulating the sensitive information it contributes.
* [Design requirement DR2: Prevent information poaching](../design-knowledge/short-end-opportunism-sharing-dr2.md) - The system must prevent the information recipient from poaching (misappropriating) the provider's sensitive data.
* [Design principle DP1: Confidential storage with proof of integrity](../design-knowledge/short-end-opportunism-sharing-dp1.md) - Store the sensitive data in a manipulation-resistant storage exclusively with the information provider and instantly create a manipulation-resistant proof of integrity for the information recipient...
* [Design principle DP2: Nonreversible shared computation](../design-knowledge/short-end-opportunism-sharing-dp2.md) - Utilize nonreversible functions that are reliably and independently executed to compute the shared information from the confidentially stored sensitive data, allowing predefinition of what informat...
* [Design principle DP3: Joint approval of computation changes](../design-knowledge/short-end-opportunism-sharing-dp3.md) - Require joint approval for any changes to the computation mechanisms, so that no single party controls the key data.

# Citations
[1] Lukas Florian Bossler, Arne Buchwald, Kai Spohrer. And No One Gets the Short End of the Stick: A Blockchain-Based Approach to Solving the Two-Sided Opportunism Problem in Interorganizational Information Sharing. Information Systems Research 36(3), 2025, 1565-1586. https://doi.org/10.1287/isre.2022.0065
[2] Source document: And No One Gets the Short End of the Stick.pdf
