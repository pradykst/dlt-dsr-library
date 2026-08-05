---
type: paper
title: "Designing a Framework for Digital KYC Processes Built on Blockchain-Based Self-Sovereign Identity"
description: "The paper derives six design objectives (16 sub-requirements) for an SSI-based eKYC framework and demonstrates how blockchain-based self-sovereign identity can solve KYC challenges without violating data-protection regulation, deriving three nascent design principles that theorize blockchain's role for SSI: use blockchain only for public data, anticipate an ecosystem of various ledgers, and enable decentralization at the edge."
resource: "https://doi.org/10.1016/j.im.2021.103553"
authors: "Vincent Schlatt, Johannes Sedlmeir, Simon Feulner, Nils Urbach"
year: 2022
venue: "Information & Management 59 (2022) 103553"
methodology: "Design science research; six solution objectives from literature and regulation; expert interviews (ex ante and ex post evaluation)."
dsr_grid: true
dsr_solution_space: "Instantiation (framework/architecture) plus six design objectives and three nascent design principles."
tags:
  - kyc-framework-ssi
  - identity-ssi
  - kyc
  - banking
  - verifiable-credentials
  - design-science-research
  - blockchain
timestamp: '2026-08-05T00:00:00+00:00'
---

# Designing a Framework for Digital KYC Processes Built on Blockchain-Based Self-Sovereign Identity

**Authors:** Vincent Schlatt, Johannes Sedlmeir, Simon Feulner, Nils Urbach  
**Venue:** Information & Management 59 (2022) 103553  
**Link:** https://doi.org/10.1016/j.im.2021.103553

## Summary

The paper derives six design objectives (16 sub-requirements) for an SSI-based eKYC framework and demonstrates how blockchain-based self-sovereign identity can solve KYC challenges without violating data-protection regulation, deriving three nascent design principles that theorize blockchain's role for SSI: use blockchain only for public data, anticipate an ecosystem of various ledgers, and enable decentralization at the edge.

## Artifact

An SSI-based electronic KYC (eKYC) framework and architecture for banks.

## Methodology

Design science research; six solution objectives from literature and regulation; expert interviews (ex ante and ex post evaluation).

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** KYC processes are costly, inefficient and inconvenient; blockchain is proposed as a remedy, but it is unclear how to exploit its advantages without violating data-protection regulation and customer privacy.
* **Input knowledge.** Self-sovereign identity and verifiable credentials; network-effects theory; GDPR/eIDAS regulation; prior DSR in the domain.
* **Research process.** Design science research: six main objectives and 16 associated requirements derived from literature and regulation, with ex ante and ex post expert interviews for evaluation.
* **Key concepts.** Banking, digital certificate, digital wallet, decentralized identity, distributed ledger technology, verifiable credential.
* **Solution description.** An SSI-based electronic KYC (eKYC) framework and architecture that uses the blockchain mainly for public data with bilateral off-chain exchange. Solution-space representation: Instantiation (framework/architecture) plus six design objectives and three nascent design principles.
* **Output knowledge.** Six design objectives (efficiency, regulatory compliance, decentralization, trust, privacy, user experience) with 16 associated requirements, and three nascent design principles theorizing blockchain's role for SSI.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design objective Objective 1: Efficiency](../design-knowledge/kyc-framework-ssi-do1.md) - Three requirements had to be satisfied: end-to-end digital processing of relevant documents, automation of manual processes, and standardized exchange of eKYC documents.
* [Design objective Objective 2: Regulatory compliance](../design-knowledge/kyc-framework-ssi-do2.md) - The Money Laundering Act (MLA), GDPR, and eIDAS are particularly relevant regulations for a digital KYC process.
* [Design objective Objective 3: Decentralization](../design-knowledge/kyc-framework-ssi-do3.md) - A viable solution must avoid central storage of customer data and prevent lock-in effects that could result in the aggregation of market power.
* [Design objective Objective 4: Trust](../design-knowledge/kyc-framework-ssi-do4.md) - Requires acceptance of KYC documents attested by other banks, validity checks, and authenticity checks.
* [Design objective Objective 5: Privacy](../design-knowledge/kyc-framework-ssi-do5.md) - Requires compliance with the need to know principle and data minimization.
* [Design objective Objective 6: User experience](../design-knowledge/kyc-framework-ssi-do6.md) - Requires low complexity, availability of different user interfaces, and backup, recovery, and support.
* [Design requirement R1.1: End-to-end digital processing of relevant documents](../design-knowledge/kyc-framework-ssi-r1-1.md) - A prerequisite for automating process steps and reducing friction.
* [Design requirement R1.2: Automation of manual processes](../design-knowledge/kyc-framework-ssi-r1-2.md) - Many current validation steps are conducted manually and should be automated.
* [Design requirement R1.3: Standardized exchange of eKYC documents](../design-knowledge/kyc-framework-ssi-r1-3.md) - Crucial for efficient integration of eKYC checks conducted at other institutions.
* [Design requirement R2.1: Money Laundering Act (MLA)](../design-knowledge/kyc-framework-ssi-r2-1.md) - Requirements regarding customer identification, record storage, and risk documentation.
* [Design requirement R2.2: GDPR](../design-knowledge/kyc-framework-ssi-r2-2.md) - Requirements including privacy by design, right to erasure, purpose limitation, and data minimization.
* [Design requirement R2.3: eIDAS](../design-knowledge/kyc-framework-ssi-r2-3.md) - Requirements on electronic means of identification, security levels, and cross-border interoperability.
* [Design requirement R3.1: Avoid central storage of customer data](../design-knowledge/kyc-framework-ssi-r3-1.md) - A viable eKYC solution must avoid central storage of customer data to prevent data breaches.
* [Design requirement R3.2: Prevent lock-in effects](../design-knowledge/kyc-framework-ssi-r3-2.md) - The system must be constructed to prevent lock-in effects that aggregate market power.
* [Design requirement R4.1: Acceptance of KYC documents attested by other banks](../design-knowledge/kyc-framework-ssi-r4-1.md) - Required to make eKYC documents reusable across banks.
* [Design requirement R4.2: Validity checks](../design-knowledge/kyc-framework-ssi-r4-2.md) - Documents must be tamper-proof, so validity checks must be feasible.
* [Design requirement R4.3: Authenticity checks](../design-knowledge/kyc-framework-ssi-r4-3.md) - The customer's identity and connection to the documents must have a high level of assurance.
* [Design requirement R5.1: Need to know principle](../design-knowledge/kyc-framework-ssi-r5-1.md) - Only customers and entities relevant to the KYC process must have access to personal data.
* [Design requirement R5.2: Data minimization](../design-knowledge/kyc-framework-ssi-r5-2.md) - Parties and data exchanged should be restricted to what is necessary.
* [Design requirement R6.1: Low complexity](../design-knowledge/kyc-framework-ssi-r6-1.md) - The eKYC process must be fast and simple for the customer.
* [Design requirement R6.2: Availability of different user interfaces](../design-knowledge/kyc-framework-ssi-r6-2.md) - The variety of devices customers use must be respected.
* [Design requirement R6.3: Backup, recovery, and support](../design-knowledge/kyc-framework-ssi-r6-3.md) - Exception handling is needed if a device storing customer data is lost or stolen.
* [Design principle DP1: Utilize blockchain only for public data](../design-knowledge/kyc-framework-ssi-dp1.md) - Use blockchain in SSI processes only for public data: organizations should repeatedly request and verify attributes through bilateral communication channels and read from, rather than write to, the ledger.
* [Design principle DP2: Anticipate an ecosystem of various ledgers](../design-knowledge/kyc-framework-ssi-dp2.md) - Do not assume a single shared ledger; anticipate an ecosystem of various distributed ledgers.
* [Design principle DP3: Enable decentralization at the edge](../design-knowledge/kyc-framework-ssi-dp3.md) - Ensure that users can store their verifiable credentials on an infrastructure of their choice, supporting user autonomy and decentralization at the edge of the SSI architecture.

# Citations
[1] Vincent Schlatt, Johannes Sedlmeir, Simon Feulner, Nils Urbach. Designing a Framework for Digital KYC Processes Built on Blockchain-Based Self-Sovereign Identity. Information & Management 59 (2022) 103553. https://doi.org/10.1016/j.im.2021.103553
[2] Source document: Designing a framework.pdf
[3] Source evidence: Section 4.1 for the six design objectives and 16 requirements (R x.y), article p. 6; Section 7 for the three design principles, article p. 12-13.
