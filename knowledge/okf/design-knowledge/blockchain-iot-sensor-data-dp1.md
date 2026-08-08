---
type: design-principle
title: "DP1 - Source-to-sink certification"
description: "Sensor data are certified on the basis of source-to-sink protection."
resource: "https://doi.org/10.17705/1jais.00567"
source_paper: "Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data"
label: "DP1"
tags:
  - blockchain-iot-sensor-data
  - design-principle
  - iot
  - privacy
  - data-certification
  - design-theory
timestamp: '2026-07-16T00:00:00+00:00'
---

# Design principle DP1: Source-to-sink certification

Sensor data are certified on the basis of source-to-sink protection.

## Source paper

This design principle is proposed by [Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data](../papers/blockchain-iot-sensor-data.md) (Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann, 2019).

## Addresses

* [Design requirement DR1: Tamper-resistant data handling](./blockchain-iot-sensor-data-dr1.md)

## Implemented by

* [Design feature DF1: Data collection unit](./blockchain-iot-sensor-data-df1.md)
* [Design feature DF3: Near-sensor preprocessing and hashing](./blockchain-iot-sensor-data-df3.md)

# Citations
[1] Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann. Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data. Journal of the Association for Information Systems 20(9), 2019, 1271-1307. https://doi.org/10.17705/1jais.00567
[2] Source document: Blockchain for the IoT.pdf
[3] Source evidence: Section 4.2 ("Deriving Design Principles"), "DP1: Sensor data are certified on the basis of source-to-sink protection," article p. 1281. Addresses DR1 per the same section's framing ("With respect to DR1 (tamper-resistant data generation, processing, and exchange), theory of information asymmetry provides a fruitful basis to derive design principles..."), article p. 1281, and Figure 3 ("Design Requirements, Principles, and Features"), article p. 1283. Implemented-by mapping per Section 4.3 ("Mapping Design Principles to Design Features"): "To implement the first design principle... two features are needed. First, we have to collect the data (DF1) and, second, we need to preprocess the data in a way that prevents data manipulation from this point on (DF3)," article pp. 1282-1283, and Figure 3, article p. 1283.
