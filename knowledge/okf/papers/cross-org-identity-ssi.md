---
type: paper
title: "Designing a cross-organizational identity management system: Utilizing SSI for the certification of retailer attributes"
description: "Following DSR, the authors derive eight design objectives and design, implement and evaluate an SSI-based identity management system for certifying retailer tax attributes, deriving four nascent design principles for SSI applications concerning role multiplicity, credential reuse, holder-as-controller, and public DIDs for issuers only."
resource: "https://doi.org/10.1007/s12525-023-00620-z"
authors: "Tobias Guggenberger, Daniela Kühne, Vincent Schlatt, Nils Urbach"
year: 2023
venue: "Electronic Markets 33:3 (2023)"
methodology: "Design science research; workshops; prototype implemented by an IT service provider; eight expert interviews."
dsr_grid: true
dsr_solution_space: "Instantiation (prototype) plus eight design objectives and four nascent design principles."
tags:
  - cross-org-identity-ssi
  - identity-ssi
  - public-sector
  - verifiable-credentials
  - eidas
  - design-science-research
  - blockchain
timestamp: '2026-08-05T00:00:00+00:00'
---

# Designing a cross-organizational identity management system: Utilizing SSI for the certification of retailer attributes

**Authors:** Tobias Guggenberger, Daniela Kühne, Vincent Schlatt, Nils Urbach  
**Venue:** Electronic Markets 33:3 (2023)  
**Link:** https://doi.org/10.1007/s12525-023-00620-z

## Summary

Following DSR, the authors derive eight design objectives and design, implement and evaluate an SSI-based identity management system for certifying retailer tax attributes, deriving four nascent design principles for SSI applications concerning role multiplicity, credential reuse, holder-as-controller, and public DIDs for issuers only.

## Artifact

A self-sovereign identity (SSI) system presenting tax attributes of online retailers.

## Methodology

Design science research; workshops; prototype implemented by an IT service provider; eight expert interviews.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Enterprise identity management is fragmented, and although self-sovereign identity (SSI) is promising, real-world organizational applications and design theory are rare.
* **Input knowledge.** The self-sovereign identity concept; eIDAS regulation; decentralized-identity best practices (Rieger et al.); verifiable credentials and DIDs.
* **Research process.** Design science research: workshops, a prototype implemented by an IT service provider, and eight expert interviews for evaluation.
* **Key concepts.** Blockchain, identity management, self-sovereign identity, public sector, eIDAS, digital wallet.
* **Solution description.** An SSI system presenting online-retailer tax attributes, publishing public DIDs only for issuers. Solution-space representation: Instantiation (prototype) plus eight design objectives and four nascent design principles.
* **Output knowledge.** Eight design objectives for the SSI system (issuance, verification, revocation, audit, decentralization, data confidentiality, data availability, usability) and four nascent design principles for SSI applications (role multiplicity, credential reuse, holder as controller, public DIDs for issuers only).

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design objective DO1: Issuance](../design-knowledge/cross-org-identity-ssi-do1.md) - The system should allow the issuance of a certificate to prove the retailer's identity and a certificate to prove correct tax registration.
* [Design objective DO2: Verification](../design-knowledge/cross-org-identity-ssi-do2.md) - The system should facilitate the tax authority and the marketplace to verify certificates' validity, signature, and integrity.
* [Design objective DO3: Revocation](../design-knowledge/cross-org-identity-ssi-do3.md) - The system must allow the issuing party to mark an outdated certificate as invalid and ensure the verifier knows it is no longer valid.
* [Design objective DO4: Audit](../design-knowledge/cross-org-identity-ssi-do4.md) - The tax authority should be able to audit the marketplace's verification process to confirm legal compliance.
* [Design objective DO5: Decentralization](../design-knowledge/cross-org-identity-ssi-do5.md) - No central authority should oversee all documents and attributes, requiring a decentralized and interoperable IdM approach.
* [Design objective DO6: Data confidentiality](../design-knowledge/cross-org-identity-ssi-do6.md) - Data about individual parties must only be accessible to them and the parties directly involved in the process.
* [Design objective DO7: Data availability](../design-knowledge/cross-org-identity-ssi-do7.md) - The system should ensure constant availability of the service.
* [Design objective DO8: Usability](../design-knowledge/cross-org-identity-ssi-do8.md) - The application and handling of a certificate should be designed as intuitively as possible.
* [Design principle DP1: Use the multiplicity of roles of actors for scaling the identity ecosystem](../design-knowledge/cross-org-identity-ssi-dp1.md) - Such systems should be designed so that one party can take on each of the issuer, holder or verifier role at any time, using the multiplicity of roles of actors for scaling the identity ecosystem.
* [Design principle DP2: Consider credentials for multiple applications to facilitate additional use cases](../design-knowledge/cross-org-identity-ssi-dp2.md) - Issue verifiable credentials in a context-independent, general-purpose manner so that the same credential can facilitate additional use cases and reduce friction.
* [Design principle DP3: Recognize the identity holder as the primary controller to ensure seamless processes](../design-knowledge/cross-org-identity-ssi-dp3.md) - Design applications so that the identity holder is an active participant in almost all processes, since all processes start with or require approval from the holder.
* [Design principle DP4: Use public DIDs only for credential issuers to minimize privacy issues](../design-knowledge/cross-org-identity-ssi-dp4.md) - Publish public DIDs only for credential issuers and exchange DIDs bilaterally for all other parties, minimizing on-chain transactions and privacy risks.

# Citations
[1] Tobias Guggenberger, Daniela Kühne, Vincent Schlatt, Nils Urbach. Designing a cross-organizational identity management system: Utilizing SSI for the certification of retailer attributes. Electronic Markets 33:3 (2023). https://doi.org/10.1007/s12525-023-00620-z
[2] Source document: Designing a cross‑organizational identity management system.pdf
[3] Source evidence: Table 4 ("Design objectives for the SSI system"), article p. 10, for the eight design objectives; Section "Derivation of design principles", article pp. 12-14, for the four design principles.
