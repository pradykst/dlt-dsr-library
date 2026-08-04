---
type: paper
title: "Know-Your-Customer (KYC) Requirements for Initial Coin Offerings: Toward Designing a Compliant-by-Design KYC-System Based on Blockchain Technology"
description: "Using an objective-centered DSR approach, the paper identifies KYC and legal requirements and translates them into system design objectives for a compliant-by-design blockchain-based KYC system for ICOs that automatically enforces KYC regulations to prevent money laundering."
resource: "https://doi.org/10.1007/s12599-020-00677-6"
authors: "Nadine Kathrin Ostern, Johannes Riedel"
year: 2021
venue: "Business & Information Systems Engineering 63(5), 2021, 551-567"
methodology: "Objective-centered design science research; identification of KYC/legal requirements; prototype; requirements-evaluation."
dsr_grid: true
dsr_solution_space: "Instantiation (prototype) driven by design objectives (model / nascent design knowledge)."
tags:
  - kyc-ico-requirements
  - kyc
  - ico
  - compliance
  - regulation
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# Know-Your-Customer (KYC) Requirements for Initial Coin Offerings: Toward Designing a Compliant-by-Design KYC-System Based on Blockchain Technology

**Authors:** Nadine Kathrin Ostern, Johannes Riedel  
**Venue:** Business & Information Systems Engineering 63(5), 2021, 551-567  
**Link:** https://doi.org/10.1007/s12599-020-00677-6

## Summary

Using an objective-centered DSR approach, the paper identifies KYC and legal requirements and translates them into system design objectives for a compliant-by-design blockchain-based KYC system for ICOs that automatically enforces KYC regulations to prevent money laundering.

## Artifact

A compliant-by-design blockchain-based KYC system for the conduct of ICOs.

## Methodology

Objective-centered design science research; identification of KYC/legal requirements; prototype; requirements-evaluation.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Existing blockchain-based KYC proposals for initial coin offerings (ICOs) ignore the severe penalties for non-compliance, so they are inapplicable when legal KYC requirements cannot be met.
* **Input knowledge.** Gregor & Hevner's descriptive/prescriptive knowledge distinction; KYC/AML regulation (e.g., GwG, GDPR, eIDAS); electronic identity (eID).
* **Research process.** Objective-centered design science research: identification of KYC and legal requirements, translation into design objectives, a prototype, and a requirements-based evaluation.
* **Key concepts.** Blockchain, distributed ledger, know-your-customer, anti-money-laundering, initial coin offering.
* **Solution description.** A compliant-by-design blockchain-based KYC system for ICOs that automatically enforces KYC regulations. Solution-space representation: Instantiation (prototype) driven by design objectives (model / nascent design knowledge).
* **Output knowledge.** A set of design objectives derived from KYC and legal requirements for a compliant-by-design ICO KYC system.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design objective DO1: Verified identity from German authorities](../design-knowledge/kyc-ico-requirements-do1.md) - Within the KYC-system, the initial recording of identity data must base on information that originates from a person's identity card that is demonstrably verified by German authorities (e.g., through German eID).
* [Design objective DO2: eIDAS-compliant identity verification scheme](../design-knowledge/kyc-ico-requirements-do2.md) - To ensure that all necessary identity data are collected, the KYC-system must be linked to an eIDAS compliant identity verification scheme to provide a rigorous data collection and verification process.
* [Design objective DO3: Source-of-funds field for high-value transactions](../design-knowledge/kyc-ico-requirements-do3.md) - An investor who transfers more than a pre-defined limit needs to fill in an additional data field during the KYC-process stating information on the source of funds.
* [Design objective DO4: Five-year storage of transaction data](../design-knowledge/kyc-ico-requirements-do4.md) - Data on business relationships and transactions must be stored at least five years on the local database of one of the contracting parties or on the blockchain, which allows for shared access.
* [Design objective DO5: Correction of inaccurate data](../design-knowledge/kyc-ico-requirements-do5.md) - An ICO investor must have the opportunity to ask for the correction of inaccurate data. To this end, data captured during the blockchain-based KYC-process need to be stored in a way that allows for revocation.
* [Design objective DO6: Erasure of personal data after storage obligation](../design-knowledge/kyc-ico-requirements-do6.md) - An ICO investor must have the opportunity to ask the KYC-provider and emitter to delete any records of investment progress once the five-year storage obligation is over.
* [Design objective DO7: Prevent transaction flow analysis](../design-knowledge/kyc-ico-requirements-do7.md) - The KYC-system must prevent transaction flow analysis through proper technical and non-technical solutions.
* [Design objective DO8: KYC-process status updates](../design-knowledge/kyc-ico-requirements-do8.md) - The KYC-system must provide status updates of the KYC-process available for the investor.
* [Design objective DO9: Web-interface key management](../design-knowledge/kyc-ico-requirements-do9.md) - The KYC-system should allow key management facilitated via a web interface; proper incentives for investors need to be set.
* [Design objective DO10: Decentralized public blockchain for fast KYC access](../design-knowledge/kyc-ico-requirements-do10.md) - The KYC-process should run on a decentralized, public blockchain solution, which allows parties involved in the ICO to access the results of the KYC-process as fast as possible through the elimination of third parties.

# Citations
[1] Nadine Kathrin Ostern, Johannes Riedel. Know-Your-Customer (KYC) Requirements for Initial Coin Offerings: Toward Designing a Compliant-by-Design KYC-System Based on Blockchain Technology. Business & Information Systems Engineering 63(5), 2021, 551-567. https://doi.org/10.1007/s12599-020-00677-6
[2] Source document: Know-Your-Customer (KYC) Requirements for Initial Coin Offerings.pdf
