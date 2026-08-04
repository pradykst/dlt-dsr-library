---
type: paper
title: "Designing the future of bond markets: Reducing transaction costs through tokenization"
description: "Using a transaction-cost-theory lens, the paper identifies seven meta-requirements and derives five design objectives for an Ethereum-based bond prototype, from which it formulates five design principles for blockchain-based bond markets: apply modular design, exploit multi-token standards, automate on-chain payouts, restrict forced-transfer functions to regulators, and implement smart-contract-based crypto securities registers."
resource: "https://doi.org/10.1007/s12525-025-00753-3"
authors: "David Cisar, Benjamin Schellinger, Jens-Christian Stoetzer, Vincent Gramlich, Tobias Guggenberger, Nils Urbach, Florian Lennart Weiss"
year: 2025
venue: "Electronic Markets 35:9 (2025)"
methodology: "Design science research; transaction-cost-theory lens; Ethereum prototype; derivation of meta-requirements, design objectives and principles."
dsr_grid: true
dsr_solution_space: "Instantiation (prototype) plus a design theory (meta-requirements, design objectives, design principles)."
tags:
  - bond-markets-tokenization-tac
  - finance-bonds
  - tokenization
  - transaction-costs
  - securities
  - design-science-research
  - blockchain
timestamp: '2026-08-05T00:00:00+00:00'
---

# Designing the future of bond markets: Reducing transaction costs through tokenization

**Authors:** David Cisar, Benjamin Schellinger, Jens-Christian Stoetzer, Vincent Gramlich, Tobias Guggenberger, Nils Urbach, Florian Lennart Weiss  
**Venue:** Electronic Markets 35:9 (2025)  
**Link:** https://doi.org/10.1007/s12525-025-00753-3

## Summary

Using a transaction-cost-theory lens, the paper identifies seven meta-requirements and derives five design objectives for an Ethereum-based bond prototype, from which it formulates five design principles for blockchain-based bond markets: apply modular design, exploit multi-token standards, automate on-chain payouts, restrict forced-transfer functions to regulators, and implement smart-contract-based crypto securities registers.

## Artifact

An Ethereum-based bond prototype (security token offering) reducing transaction costs.

## Methodology

Design science research; transaction-cost-theory lens; Ethereum prototype; derivation of meta-requirements, design objectives and principles.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Bond markets face many inefficiencies and high transaction costs, and academic literature lacks generic design knowledge - under a transaction-cost lens - for designing blockchain-based bonds.
* **Input knowledge.** Transaction cost theory (TAC) as the kernel theory; tokenization and securities literature; Ethereum token standards (ERC-1155); regulation such as MiCAR and eWpG.
* **Research process.** Design science research: an Ethereum bond prototype, with meta-requirements, design objectives and principles derived under a TAC lens.
* **Key concepts.** Bonds, design science research, transaction cost theory, blockchain, tokenization.
* **Solution description.** An Ethereum-based tokenized bond (security token offering) prototype that reduces transaction costs. Solution-space representation: Instantiation (prototype) plus a design theory (meta-requirements, design objectives, design principles).
* **Output knowledge.** Seven meta-requirements (structured along the TAC dimensions of frequency, asset specificity, and uncertainty), five design objectives, and five design principles: modular design, multi-token standards, automated on-chain payouts, restricting forced transfers to regulators, and smart-contract-based crypto securities registers.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Meta-requirement MR-1: Reduce time-intensity](../design-knowledge/bond-markets-tokenization-tac-mr1.md) - Settlement and clearing time still vary across some markets and take two business days; the prototype shall minimize process times.
* [Meta-requirement MR-2: Reduce stakeholder complexity](../design-knowledge/bond-markets-tokenization-tac-mr2.md) - Numerous intermediaries cause significant complexity in a securities transaction; the artifact shall reduce this source of complexity.
* [Meta-requirement MR-3: Avoid manual and analog processes](../design-knowledge/bond-markets-tokenization-tac-mr3.md) - The issuance of securities involves many manual processes and an administrative burden from physical certificates; the prototype shall avoid manual processes to a maximum extent.
* [Meta-requirement MR-4: Reduce dependency on CSDs](../design-knowledge/bond-markets-tokenization-tac-mr4.md) - Every securities transaction has to use Central Securities Depositories or delegated depository banks, creating a centralized bottleneck; the prototype shall avoid such central intermediaries.
* [Meta-requirement MR-5: Reduce market barriers](../design-knowledge/bond-markets-tokenization-tac-mr5.md) - Bond denomination and business-day trade restrictions exclude some investors; the prototype shall reduce market barriers for all participants.
* [Meta-requirement MR-6: Provision of secondary markets](../design-knowledge/bond-markets-tokenization-tac-mr6.md) - Secondary markets for trading bonds remain insufficient; the prototype shall provide sufficient secondary markets.
* [Meta-requirement MR-7: Reduce room for opportunistic behavior](../design-knowledge/bond-markets-tokenization-tac-mr7.md) - Information asymmetries, counterparty risks, and non-transparent processes create room for opportunism; the prototype shall reduce information asymmetries as much as possible.
* [Design objective DO-1: Minimize latency of settlement processes](../design-knowledge/bond-markets-tokenization-tac-do1.md) - The prototype should enable nearly instantaneous settlement of trades, reducing the delay between trade initiation and settlement to a minimum.
* [Design objective DO-2: Reduce complexity (standardized interfaces and consolidated roles as well as responsibilities)](../design-knowledge/bond-markets-tokenization-tac-do2.md) - The number of separated entities and manual processes should be reduced to a minimum, with the issuance process as standardized as possible.
* [Design objective DO-3: Reduce access barriers (flexible issuance sizes and secondary market support)](../design-knowledge/bond-markets-tokenization-tac-do3.md) - The prototype should allow issuances of all sizes and support secondary-market trading not restricted by business hours or geography.
* [Design objective DO-4: Optimized information sharing](../design-knowledge/bond-markets-tokenization-tac-do4.md) - The prototype should reduce information asymmetries and create transparency across permitted stakeholders while ensuring investor privacy.
* [Design objective DO-5: Ensure regulatory compliance (with MiCAR and eWpG)](../design-knowledge/bond-markets-tokenization-tac-do5.md) - The prototype must fully comply with the German legal framework, including KYC/AML checks, judicially enforceable forced transfer, and a crypto securities registry.
* [Design principle DP1: Apply modular design of distinctive system components](../design-knowledge/bond-markets-tokenization-tac-dp1.md) - Modularly structure complex bond-market systems into distinct, interconnected contracts to work within Ethereum's contract-size limits, using modifiers and specific sender functions to protect components from unauthorized access.
* [Design principle DP2: Exploit multi-token standards](../design-knowledge/bond-markets-tokenization-tac-dp2.md) - Use multi-token standards (e.g., ERC-1155) when issuing multiple security tokens sharing comparable characteristics, to conserve blockchain storage and simplify architecture.
* [Design principle DP3: Automated on-chain payout mechanisms for investors](../design-knowledge/bond-markets-tokenization-tac-dp3.md) - Integrate on-chain settlement using claim capabilities in disbursement, empowering investors to control the timing and method of interest payments and removing reliance on issuer/platform trustworthiness.
* [Design principle DP4: Restrict forced-transfer functions to regulators](../design-knowledge/bond-markets-tokenization-tac-dp4.md) - Restrict particularly critical functions such as forced transfers to regulators only, to prevent abuse of power while complying with regulatory requirements.
* [Design principle DP5: Implement smart-contract-based crypto securities registers](../design-knowledge/bond-markets-tokenization-tac-dp5.md) - Implement a crypto securities register (CSR) within a smart contract for digitally tokenized bearer bonds, disrupting the traditional custodian chain and accelerating settlement.

# Citations
[1] David Cisar, Benjamin Schellinger, Jens-Christian Stoetzer, Vincent Gramlich, Tobias Guggenberger, Nils Urbach, Florian Lennart Weiss. Designing the future of bond markets: Reducing transaction costs through tokenization. Electronic Markets 35:9 (2025). https://doi.org/10.1007/s12525-025-00753-3
[2] Source document: Designing the future of bond markets - Reducing transaction costs.pdf
[3] Source evidence: Table 2 (meta-requirements) and Table 3 (design objectives), article p. 8-9; Section "Design principles" for DP1-DP5, article p. 16-18; Fig. 6 for the full MR->DO->DP relationship chain, article p. 17.
