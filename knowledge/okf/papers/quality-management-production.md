---
type: paper
title: "Digging for Quality Management in Production Systems: A Solution Space for Blockchain Collaborations"
description: "The paper derives six meta-design requirements (MDR1-MDR6) and six corresponding design principles (DP1-DP6) for future quality-management IS artifacts based on a hybrid, token-based traceability system - standardized traceability objects, extended quality control, import/export of identifiers, standardized token events, easy integration, and confidentiality of available information."
resource: "https://aisel.aisnet.org/icis2022/blockchain/blockchain/15"
authors: "Norman Pytel, Benedikt Putz, Fabian Boehm, Axel Winkelmann"
year: 2022
venue: "ICIS 2022 Proceedings"
methodology: "Design science research; case study; meta-requirements transformed into design principles; expert discussion."
dsr_grid: true
dsr_solution_space: "A hybrid token-based traceability solution space with design principles (nascent) guiding future design features."
tags:
  - quality-management-production
  - quality-management
  - supply-chain
  - traceability
  - enterprise-systems
  - design-science-research
  - blockchain
timestamp: '2026-08-08T00:00:00+00:00'
---

# Digging for Quality Management in Production Systems: A Solution Space for Blockchain Collaborations

**Authors:** Norman Pytel, Benedikt Putz, Fabian Boehm, Axel Winkelmann  
**Venue:** ICIS 2022 Proceedings  
**Link:** https://aisel.aisnet.org/icis2022/blockchain/blockchain/15

## Summary

The paper derives six meta-design requirements (MDR1-MDR6) and six corresponding design principles (DP1-DP6) for future quality-management IS artifacts based on a hybrid, token-based traceability system - standardized traceability objects, extended quality control, import/export of identifiers, standardized token events, easy integration, and confidentiality of available information.

## Artifact

A hybrid, token-based traceability system for quality management in production networks.

## Methodology

Design science research; case study; meta-requirements transformed into design principles; expert discussion.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Cross-organizational quality management in production networks needs standardized, trustworthy traceability that integrates with existing enterprise systems.
* **Input knowledge.** Supply-chain traceability concepts and dimensions; enterprise-system (ERP/event) standards; token standards; a case study of production environments.
* **Research process.** Design science research: a case study, derivation of meta-design requirements transformed into design principles, and expert discussion.
* **Key concepts.** Quality management, blockchain, supply-chain traceability, enterprise systems, case study.
* **Solution description.** A hybrid, token-based traceability system providing a solution space for blockchain collaborations in quality management. Solution-space representation: A hybrid token-based traceability solution space with design principles (nascent) guiding future design features.
* **Output knowledge.** Six meta-design requirements (MDR1-MDR6) and six design principles (DP1-DP6) for future quality-management IS artifacts. Figure 5 visually pairs them, but its connector-line geometry does not resolve to an unambiguous row-i-to-row-i mapping (see Citations), so no canonical MDR-to-DP relationship is recorded here.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Meta-requirement MDR1: Minimal necessary traceability objects](../design-knowledge/quality-management-production-mdr1.md) - The system should integrate as much as necessary and as little as possible traceability objects.
* [Meta-requirement MDR2: Efficient communication of affected PS, Quality, and System objects](../design-knowledge/quality-management-production-mdr2.md) - The system should increase efficiency of communication in channels for affected PS, Quality, and System objects.
* [Meta-requirement MDR3: UTIDs for harmonized object identification](../design-knowledge/quality-management-production-mdr3.md) - The system should provide UTIDs to increase object identification for a harmonized traceability understanding.
* [Meta-requirement MDR4: Integration of object types and events](../design-knowledge/quality-management-production-mdr4.md) - The system should allow the integration of object types and events.
* [Meta-requirement MDR5: Simple architecture for horizontal network-partner scalability](../design-knowledge/quality-management-production-mdr5.md) - The system should provide a simple architecture for horizontal network partner's scalability (participation and exit).
* [Meta-requirement MDR6: Security mechanisms for confidentiality](../design-knowledge/quality-management-production-mdr6.md) - The system should provide security mechanisms to address confidentiality concerns.
* [Design principle DP1: Standardized representation of traceability objects](../design-knowledge/quality-management-production-dp1.md) - The system contains a consistent understanding among organizations of traceability terminologies and valuable objects.
* [Design principle DP2: Extended quality control over communication and objects](../design-knowledge/quality-management-production-dp2.md) - The system provides hybrid tokens to map direct and indirect objects of different object types.
* [Design principle DP3: Import objects from traditional information systems](../design-knowledge/quality-management-production-dp3.md) - The system provides import of objects from traditional IS (e.g., ERP, MES, QMS) and export of UTIDs.
* [Design principle DP4: Standardized token events](../design-knowledge/quality-management-production-dp4.md) - The system provides functions to ensure standardized events for tokens.
* [Design principle DP5: Easy integration without enterprise-system modification](../design-knowledge/quality-management-production-dp5.md) - The system provides USID (e.g., system IDs, license) integration through the BC system or token configuration.
* [Design principle DP6: Confidentiality of available information](../design-knowledge/quality-management-production-dp6.md) - The system provides confidentiality by design mechanisms.

# Citations
[1] Norman Pytel, Benedikt Putz, Fabian Boehm, Axel Winkelmann. Digging for Quality Management in Production Systems: A Solution Space for Blockchain Collaborations. ICIS 2022 Proceedings. https://aisel.aisnet.org/icis2022/blockchain/blockchain/15
[2] Source document: Digging for Quality Management in Production Systems.pdf
[3] Source evidence: Figure 5, "Mapping of meta-design requirements and corresponding design principles" (p. 13/14 of the PDF); Section "Meta-Requirements - Object Traceability System" (pp. 8-9) for MDR derivation via the 5S method; Section "Design Principles - Deriving Knowledge for Future Artifact Design" (pp. 12-13) for DP formulation and elaboration. Figure-5 mapping ambiguity: the figure's connector lines were directly inspected at the PDF vector level (page 14 of the PDF; article p. 13). The MDR and DP columns are drawn with mismatched row heights (each row's label sits ~3pt below its row's top boundary, at y ~82.4/103.2/124.0/144.8/165.6/186.3pt for rows 1-6 respectively on both columns), and the extracted line segments include one running from the row-1 y-level on the MDR side to the row-2 y-level on the DP side, which is inconsistent with a clean, monotonic row-i-to-row-i diagonal. Because the connector geometry does not resolve unambiguously and no sentence in the prose explicitly states an MDR-to-DP correspondence (the paragraph following Figure 5 discusses DP1-DP6 in order without citing "(MDRx)"), no canonical MDR-to-DP relationship is recorded between the 6 meta-requirement and 6 design-principle concepts, per this corpus's rule that ambiguous figure mappings default to zero speculative edges.
