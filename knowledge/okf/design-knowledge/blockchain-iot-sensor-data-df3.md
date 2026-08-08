---
type: design-feature
title: "DF3 - Near-sensor preprocessing and hashing"
description: "Preprocess the data and record the blockchain transaction as a hash as close as possible to the sensing unit, preventing manipulation from that point on."
resource: "https://doi.org/10.17705/1jais.00567"
source_paper: "Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data"
label: "DF3"
tags:
  - blockchain-iot-sensor-data
  - design-feature
  - iot
  - privacy
  - data-certification
  - design-theory
timestamp: '2026-07-16T00:00:00+00:00'
---

# Design feature DF3: Near-sensor preprocessing and hashing

Preprocess the data and record the blockchain transaction as a hash as close as possible to the sensing unit, preventing manipulation from that point on.

## Source paper

This design feature is a technology-specific realization proposed by [Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data](../papers/blockchain-iot-sensor-data.md) (Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann, 2019).

## Implements

* [Design principle DP1: Source-to-sink certification](./blockchain-iot-sensor-data-dp1.md)

# Citations
[1] Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann. Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data. Journal of the Association for Information Systems 20(9), 2019, 1271-1307. https://doi.org/10.17705/1jais.00567
[2] Source document: Blockchain for the IoT.pdf
[3] Source evidence: Section 4.3, "we need to preprocess the data in a way that prevents data manipulation from this point on (DF3)... it is essential to choose the earliest possible point in the data pipeline to create this signature and swiftly add the transaction to a blockchain," article pp. 1282-1283; labeled "DF3. Preprocessing and Transmission: Blockchain Transaction, Data Transmission" in Figure 3, article p. 1283, and shown as component "3 Preprocessing & Transmission" in Figure 4, article p. 1284.
