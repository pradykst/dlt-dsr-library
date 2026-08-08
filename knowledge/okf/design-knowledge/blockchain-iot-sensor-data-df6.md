---
type: design-feature
title: "DF6 - Verification storage system"
description: "An independent verification storage system holds the hashes used to verify data integrity on the blockchain."
resource: "https://doi.org/10.17705/1jais.00567"
source_paper: "Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data"
label: "DF6"
tags:
  - blockchain-iot-sensor-data
  - design-feature
  - iot
  - privacy
  - data-certification
  - design-theory
timestamp: '2026-07-16T00:00:00+00:00'
---

# Design feature DF6: Verification storage system

An independent verification storage system holds the hashes used to verify data integrity on the blockchain.

## Source paper

This design feature is a technology-specific realization proposed by [Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data](../papers/blockchain-iot-sensor-data.md) (Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann, 2019).

## Implements

* [Design principle DP4: Linearly scalable architecture](./blockchain-iot-sensor-data-dp4.md)

# Citations
[1] Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann. Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data. Journal of the Association for Information Systems 20(9), 2019, 1271-1307. https://doi.org/10.17705/1jais.00567
[2] Source document: Blockchain for the IoT.pdf
[3] Source evidence: Section 4.3, "the fourth design principle, requiring a linearly scalable system architecture, needs three more design features—namely, a storage service (DF4) that writes into the raw data storage (DF5) and also into an independent verification storage system (DF6)," article p. 1283 (DF6 implements DP4, not DP1 — corrected from a prior mismapping). Labeled "DF6. Blockchain-Based Hash Storage: Independent Verification Storage" in Figure 3, article p. 1283, and shown as component "6 BC-based Hash Storage" in Figure 4, article p. 1284.
