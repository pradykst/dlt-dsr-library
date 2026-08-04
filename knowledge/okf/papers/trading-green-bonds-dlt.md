---
type: paper
title: "Trading Green Bonds Using Distributed Ledger Technology"
description: "The paper elicits and evaluates the functional artefact requirements of a novel DLT-based trading and settlement system for green bonds, distinguishing core technical requirements from contextual requirements and objectives for regulated, tradeable carbon-credit securities."
resource: "https://aisel.aisnet.org/ecis2023_rp/340"
authors: "Henrik Axelsen, Ulrik Rasmussen, Johannes Rude Jensen, Omri Ross, Fritz Henglein"
year: 2023
venue: "ECIS 2023 Research Papers"
methodology: "Design science research; multi-cycle stakeholder engagement (industrial and governmental); technical evaluation against settlement-system requirements."
dsr_grid: true
dsr_solution_space: "Instantiation (artefact) driven by functional artefact requirements (model)."
tags:
  - trading-green-bonds-dlt
  - finance-bonds
  - green-bonds
  - dlt
  - securities-settlement
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# Trading Green Bonds Using Distributed Ledger Technology

**Authors:** Henrik Axelsen, Ulrik Rasmussen, Johannes Rude Jensen, Omri Ross, Fritz Henglein  
**Venue:** ECIS 2023 Research Papers  
**Link:** https://aisel.aisnet.org/ecis2023_rp/340

## Summary

The paper elicits and evaluates the functional artefact requirements of a novel DLT-based trading and settlement system for green bonds, distinguishing core technical requirements from contextual requirements and objectives for regulated, tradeable carbon-credit securities.

## Artifact

A DLT-based trading and settlement system (DLT TSS) for green bonds / voluntary carbon credits (Smart Financial Instrument platform).

## Methodology

Design science research; multi-cycle stakeholder engagement (industrial and governmental); technical evaluation against settlement-system requirements.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Trading and settling green bonds (voluntary carbon credits) on distributed ledgers requires satisfying the technical and regulatory requirements of securities settlement systems.
* **Input knowledge.** Capital-market-infrastructure and securities-settlement requirements (e.g., T2S); DLT pilot-regime regulation; the Smart Financial Instrument (SFI) platform.
* **Research process.** Design science research with multi-cycle stakeholder engagement (industrial and governmental) and a technical evaluation against settlement-system requirements.
* **Key concepts.** DLT pilot regime, trading, settlement, liquidity, green bonds, net-zero, funding.
* **Solution description.** A DLT-based trading and settlement system (SFI platform) for regulated, tradeable carbon-credit securities. Solution-space representation: Instantiation (artefact) driven by functional artefact requirements (model).
* **Output knowledge.** A set of functional artefact requirements (five core technical and nine contextual requirements and objectives).

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design requirement REQ1: Manage states of contracts](../design-knowledge/trading-green-bonds-dlt-req1.md) - Manage states of contracts across the securities' lifecycle.
* [Design requirement REQ2: Identify and verify users](../design-knowledge/trading-green-bonds-dlt-req2.md) - Identify and verify that users are authorized for their roles.
* [Design requirement REQ3: Maintain ownership](../design-knowledge/trading-green-bonds-dlt-req3.md) - Maintain ownership of securities.
* [Design requirement REQ4: Guarantee ACID transaction execution](../design-knowledge/trading-green-bonds-dlt-req4.md) - Guarantee atomic, consistent, isolated, and durable (ACID) execution of compound transactions, specifically delivery versus payment.
* [Design requirement REQ5: Enforce correct attribution and non-repudiability](../design-knowledge/trading-green-bonds-dlt-req5.md) - Enforce correct attribution and non-repudiability of actions (using digital signatures and cryptographic commitments).
* [Design requirement REQ6: Interoperability with external systems](../design-knowledge/trading-green-bonds-dlt-req6.md) - Interoperability with external systems.
* [Design requirement REQ7: Settlement finality](../design-knowledge/trading-green-bonds-dlt-req7.md) - Settlement finality: the determination of a definite time after which the transfer of legal title (ownership) is irrevocable.
* [Design requirement REQ8: Support high-frequency-data instruments](../design-knowledge/trading-green-bonds-dlt-req8.md) - Support for new financial instruments with high-frequency data dependencies (e.g., carbon emission monitoring data).
* [Design requirement REQ9: DLTR compliance with reasoned exemptions](../design-knowledge/trading-green-bonds-dlt-req9.md) - DLTR compliance with well-reasoned exemptions from existing regulations written for traditional centralized systems.
* [Design requirement REQ10: Interoperability with legacy and DLT settlement systems](../design-knowledge/trading-green-bonds-dlt-req10.md) - Interoperability with legacy private and central banking as well as private, permissioned, and permissionless DLT/blockchain and other clearing and settlement systems.
* [Design requirement REQ11: Full regulator access for automated supervision](../design-knowledge/trading-green-bonds-dlt-req11.md) - Support for full access by the financial supervisor/regulator to maximize automated supervision.
* [Design requirement REQ12: Full transparency and traceability of verification data](../design-knowledge/trading-green-bonds-dlt-req12.md) - Full transparency and traceability of underlying verification data throughout carbon credit and advanced instruments' lifecycle.
* [Design requirement REQ13: Efficient high-volume trading with real-time monitoring](../design-knowledge/trading-green-bonds-dlt-req13.md) - Efficient high-volume trading processing, instantaneous settlement (execution) of trades, real-time monitoring, and advanced market abuse detection.
* [Design requirement REQ14: Catalyze structured finance via a domain-specific language](../design-knowledge/trading-green-bonds-dlt-req14.md) - Ability to catalyze structured finance by domain-specific language for specifying new instruments and immediately issuing them.

# Citations
[1] Henrik Axelsen, Ulrik Rasmussen, Johannes Rude Jensen, Omri Ross, Fritz Henglein. Trading Green Bonds Using Distributed Ledger Technology. ECIS 2023 Research Papers. https://aisel.aisnet.org/ecis2023_rp/340
[2] Source document: TRADING GREEN BONDS USING DISTRIBUTED LEDGER.pdf
