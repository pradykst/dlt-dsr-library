---
type: design-feature
title: "DF8 - Certification and verification mechanism"
description: "A certification mechanism performs cross-validation and verifies integrity (e.g., that mileage never decreased over time)."
resource: "https://doi.org/10.17705/1jais.00567"
source_paper: "Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data"
label: "DF8"
tags:
  - blockchain-iot-sensor-data
  - design-feature
  - iot
  - privacy
  - data-certification
  - design-theory
timestamp: '2026-07-16T00:00:00+00:00'
---

# Design feature DF8: Certification and verification mechanism

A certification mechanism performs cross-validation and verifies integrity (e.g., that mileage never decreased over time).

## Source paper

This design feature is a technology-specific realization proposed by [Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data](../papers/blockchain-iot-sensor-data.md) (Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann, 2019).

## Implements

* [Design principle DP2: Cross-validation certification](./blockchain-iot-sensor-data-dp2.md)

# Citations
[1] Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann. Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data. Journal of the Association for Information Systems 20(9), 2019, 1271-1307. https://doi.org/10.17705/1jais.00567
[2] Source document: Blockchain for the IoT.pdf
[3] Source evidence: Section 4.3, "a certification mechanism that performs the cross-validation (DF8)," article p. 1283, detailed further in Section 4.3's discussion of the certification process (e.g., verifying "increase of mileage since last trip") and Figure 5 ("A Detailed View of the Certification Process"), article p. 1284; labeled "DF8. Certification Service: Sensor Data Certification" in Figure 3, article p. 1283, and shown as component "8 Certification Service" in Figure 4, article p. 1284.
