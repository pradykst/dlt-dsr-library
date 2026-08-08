---
type: design-principle
title: "DP2 - Cross-validation certification"
description: "Sensor data are certified on the basis of cross-validation."
resource: "https://doi.org/10.17705/1jais.00567"
source_paper: "Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data"
label: "DP2"
tags:
  - blockchain-iot-sensor-data
  - design-principle
  - iot
  - privacy
  - data-certification
  - design-theory
timestamp: '2026-07-16T00:00:00+00:00'
---

# Design principle DP2: Cross-validation certification

Sensor data are certified on the basis of cross-validation. Cross-validation and plausibility checks are common auditing means that reduce the risk that manipulation of the sensor or its environment goes undetected.

## Source paper

This design principle is proposed by [Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data](../papers/blockchain-iot-sensor-data.md) (Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann, 2019).

## Addresses

* [Design requirement DR1: Tamper-resistant data handling](./blockchain-iot-sensor-data-dr1.md)

## Implemented by

* [Design feature DF2: Validation sensor](./blockchain-iot-sensor-data-df2.md)
* [Design feature DF8: Certification and verification mechanism](./blockchain-iot-sensor-data-df8.md)

# Citations
[1] Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann. Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data. Journal of the Association for Information Systems 20(9), 2019, 1271-1307. https://doi.org/10.17705/1jais.00567
[2] Source document: Blockchain for the IoT.pdf
[3] Source evidence: Section 4.2 ("Deriving Design Principles"), "DP2: Sensor data is certified on the basis of cross-validation" (source's own subject-verb wording normalized here to "are" for consistency with DP1/DP3/DP4), article p. 1282. Addresses DR1 per the same section (DP2 derived as a supplement to DP1 to address remaining manipulation risk under DR1, "tamper-resistant data generation, processing, and exchange"), article pp. 1281-1282, and Figure 3, article p. 1283. Implemented-by mapping per Section 4.3: "The second design principle of cross-validation-based certification calls for two additional design features—namely, the collection of appropriate validation data (DF2) and a certification mechanism that performs the cross-validation (DF8)," article p. 1283, and Figure 3, article p. 1283.
