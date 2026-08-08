---
type: design-principle
title: "DP4 - Linearly scalable architecture"
description: "Data are certified on the basis of a linearly scalable system architecture."
resource: "https://doi.org/10.17705/1jais.00567"
source_paper: "Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data"
label: "DP4"
tags:
  - blockchain-iot-sensor-data
  - design-principle
  - iot
  - privacy
  - data-certification
  - design-theory
timestamp: '2026-07-16T00:00:00+00:00'
---

# Design principle DP4: Linearly scalable architecture

Data are certified on the basis of a linearly scalable system architecture.

## Source paper

This design principle is proposed by [Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data](../papers/blockchain-iot-sensor-data.md) (Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann, 2019).

## Addresses

* [Design requirement DR3: Large data-volume throughput](./blockchain-iot-sensor-data-dr3.md)
* [Design requirement DR4: Economic feasibility](./blockchain-iot-sensor-data-dr4.md)

## Implemented by

* [Design feature DF4: Storage service](./blockchain-iot-sensor-data-df4.md)
* [Design feature DF5: Raw data storage](./blockchain-iot-sensor-data-df5.md)
* [Design feature DF6: Verification storage system](./blockchain-iot-sensor-data-df6.md)

# Citations
[1] Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann. Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data. Journal of the Association for Information Systems 20(9), 2019, 1271-1307. https://doi.org/10.17705/1jais.00567
[2] Source document: Blockchain for the IoT.pdf
[3] Source evidence: Section 4.2 ("Deriving Design Principles"), "DP4: Data are certified on the basis of a linearly scalable system architecture," article p. 1282, derived to address DR3 and DR4 per the same section ("DR3 (large data volume throughput) and DR4 (economic feasibility) further qualify how the system should operate (scalable and thereby also cost efficient)..."), article p. 1282; also Figure 3, article p. 1283. Implemented-by mapping per Section 4.3: "The fourth design principle, requiring a linearly scalable system architecture, needs three more design features—namely, a storage service (DF4) that writes into the raw data storage (DF5) and also into an independent verification storage system (DF6)," article p. 1283, and Figure 3, article p. 1283.
