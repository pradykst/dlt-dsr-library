---
type: design-feature
title: "DF4 - Storage service"
description: "A storage service that writes encrypted raw data into raw-data storage and propagates the signed hash transaction to the blockchain and verification storage."
resource: "https://doi.org/10.17705/1jais.00567"
source_paper: "Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data"
label: "DF4"
tags:
  - blockchain-iot-sensor-data
  - design-feature
  - iot
  - privacy
  - data-certification
  - design-theory
timestamp: '2026-07-16T00:00:00+00:00'
---

# Design feature DF4: Storage service

A storage service that writes encrypted raw data into raw-data storage and propagates the signed hash transaction to the blockchain and verification storage.

## Source paper

This design feature is a technology-specific realization proposed by [Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data](../papers/blockchain-iot-sensor-data.md) (Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann, 2019).

## Implements

* [Design principle DP4: Linearly scalable architecture](./blockchain-iot-sensor-data-dp4.md)

# Citations
[1] Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann. Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data. Journal of the Association for Information Systems 20(9), 2019, 1271-1307. https://doi.org/10.17705/1jais.00567
[2] Source document: Blockchain for the IoT.pdf
[3] Source evidence: Section 4.3, "a storage service (DF4) that writes into the raw data storage (DF5) and also into an independent verification storage system (DF6). In practice, the storage service saves the encrypted raw data in the cloud and propagates the signed transaction with the hash to the blockchain network," article p. 1283; labeled "DF4. Storage Service: Data Storage Coordination" in Figure 3, article p. 1283, and shown as component "4 Storage Service" in Figure 4, article p. 1284.
