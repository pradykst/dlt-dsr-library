---
type: paper
title: "Designing the future of bond markets: Reducing transaction costs through tokenization"
description: "Using a transaction-cost-theory lens, the paper designs an Ethereum-based bond prototype and derives five design principles for blockchain-based bond markets: apply modular design, exploit multi-token standards, automate on-chain payouts, restrict forced-transfer functions to regulators, and implement smart-contract-based crypto securities registers."
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
timestamp: '2026-07-16T00:00:00+00:00'
---

# Designing the future of bond markets: Reducing transaction costs through tokenization

**Authors:** David Cisar, Benjamin Schellinger, Jens-Christian Stoetzer, Vincent Gramlich, Tobias Guggenberger, Nils Urbach, Florian Lennart Weiss  
**Venue:** Electronic Markets 35:9 (2025)  
**Link:** https://doi.org/10.1007/s12525-025-00753-3

## Summary

Using a transaction-cost-theory lens, the paper designs an Ethereum-based bond prototype and derives five design principles for blockchain-based bond markets: apply modular design, exploit multi-token standards, automate on-chain payouts, restrict forced-transfer functions to regulators, and implement smart-contract-based crypto securities registers.

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
* **Output knowledge.** Five design principles: modular design, multi-token standards, automated on-chain payouts, restricting forced transfers to regulators, and smart-contract-based crypto securities registers.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design principle DP1: Apply modular design of distinctive system components](../design-knowledge/bond-markets-tokenization-tac-dp1.md) - Modularly structure complex bond-market systems into distinct, interconnected contracts to work within Ethereum's contract-size limits, using modifiers and specific sender functions to protect comp...
* [Design principle DP2: Exploit multi-token standards](../design-knowledge/bond-markets-tokenization-tac-dp2.md) - Use multi-token standards (e.g., ERC-1155) when issuing multiple security tokens sharing comparable characteristics, to conserve blockchain storage and simplify architecture.
* [Design principle DP3: Automated on-chain payout mechanisms for investors](../design-knowledge/bond-markets-tokenization-tac-dp3.md) - Integrate on-chain settlement using claim capabilities in disbursement, empowering investors to control the timing and method of interest payments and removing reliance on issuer/platform trustwort...
* [Design principle DP4: Restrict forced-transfer functions to regulators](../design-knowledge/bond-markets-tokenization-tac-dp4.md) - Restrict particularly critical functions such as forced transfers to regulators only, to prevent abuse of power while complying with regulatory requirements.
* [Design principle DP5: Implement smart-contract-based crypto securities registers](../design-knowledge/bond-markets-tokenization-tac-dp5.md) - Implement a crypto securities register (CSR) within a smart contract for digitally tokenized bearer bonds, disrupting the traditional custodian chain and accelerating settlement.

# Citations
[1] David Cisar, Benjamin Schellinger, Jens-Christian Stoetzer, Vincent Gramlich, Tobias Guggenberger, Nils Urbach, Florian Lennart Weiss. Designing the future of bond markets: Reducing transaction costs through tokenization. Electronic Markets 35:9 (2025). https://doi.org/10.1007/s12525-025-00753-3
[2] Source document: Designing the future of bond markets - Reducing transaction costs.pdf
