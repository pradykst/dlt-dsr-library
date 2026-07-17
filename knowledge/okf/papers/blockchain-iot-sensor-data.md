---
type: paper
title: "Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data"
description: "The paper proposes a design theory (requirements, principles, and features) for a blockchain-based sensor data protection system that certifies IoT data, ensuring tamper-resistant, privacy-preserving, scalable and efficient data gathering, processing and exchange, demonstrated with the CertifiCar instantiation."
resource: "https://doi.org/10.17705/1jais.00567"
authors: "Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann"
year: 2019
venue: "Journal of the Association for Information Systems 20(9), 2019, 1271-1307"
methodology: "Design science research; three iterative build cycles; ex post evaluation across mileage, pharma supply chain and energy microgrid use cases."
dsr_grid: true
dsr_solution_space: "Design theory (requirements, principles and features) plus an instantiation (CertifiCar)."
tags:
  - blockchain-iot-sensor-data
  - iot
  - privacy
  - data-certification
  - design-theory
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data

**Authors:** Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann  
**Venue:** Journal of the Association for Information Systems 20(9), 2019, 1271-1307  
**Link:** https://doi.org/10.17705/1jais.00567

## Summary

The paper proposes a design theory (requirements, principles, and features) for a blockchain-based sensor data protection system that certifies IoT data, ensuring tamper-resistant, privacy-preserving, scalable and efficient data gathering, processing and exchange, demonstrated with the CertifiCar instantiation.

## Artifact

A blockchain-based sensor data protection system (SDPS) leveraging data certification; instantiated as CertifiCar (mileage fraud prevention).

## Methodology

Design science research; three iterative build cycles; ex post evaluation across mileage, pharma supply chain and energy microgrid use cases.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Adoption of smart, connected products depends on ensuring adequate IoT sensor-data integrity while guaranteeing sufficient user privacy - a combination existing solutions do not achieve.
* **Input knowledge.** Gregor & Hevner on theory and design knowledge; information asymmetry theory and Westin's theory of privacy as kernel/justificatory knowledge; data certification; blockchain.
* **Research process.** Design science research with three iterative build-and-demonstrate cycles (the CertifiCar instantiation) and an ex post evaluation across car-mileage, pharmaceutical supply-chain and energy-microgrid use cases.
* **Key concepts.** Internet of Things, big data, privacy, security, blockchain, design science research, design theory.
* **Solution description.** A blockchain-based sensor data protection system (SDPS) leveraging data certification, spanning data collection, near-sensor hashing, storage, and verification services. Solution-space representation: Design theory (requirements, principles and features) plus an instantiation (CertifiCar).
* **Output knowledge.** A design theory comprising four design requirements, four design principles and nine design features.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design requirement DR1: Tamper-resistant data handling](../design-knowledge/blockchain-iot-sensor-data-dr1.md) - Enable tamper-resistant generation, processing, and exchange of IoT sensor data.
* [Design requirement DR2: Privacy-preserving data handling](../design-knowledge/blockchain-iot-sensor-data-dr2.md) - Enable privacy-preserving generation, processing, and exchange of IoT sensor data.
* [Design requirement DR3: Large data-volume throughput](../design-knowledge/blockchain-iot-sensor-data-dr3.md) - Enable large data-volume throughput in the generation, processing and exchange of IoT sensor data.
* [Design requirement DR4: Economic feasibility](../design-knowledge/blockchain-iot-sensor-data-dr4.md) - Ensure economic feasibility of the sensor-data generation, processing and exchange system.
* [Design principle DP1: Source-to-sink certification](../design-knowledge/blockchain-iot-sensor-data-dp1.md) - Certify sensor data on the basis of source-to-sink protection so that data producers are accountable for the data they provide.
* [Design principle DP2: Cross-validation certification](../design-knowledge/blockchain-iot-sensor-data-dp2.md) - Certify sensor data on the basis of cross-validation and plausibility checks to reduce the risk of manipulation.
* [Design principle DP3: Owner-controlled disclosure](../design-knowledge/blockchain-iot-sensor-data-dp3.md) - Let data owners determine when and to what extent their certified data is communicated to others.
* [Design principle DP4: Linearly scalable architecture](../design-knowledge/blockchain-iot-sensor-data-dp4.md) - Certify data on the basis of a linearly scalable system architecture.

## Design features

Concrete, technology-specific realizations of the design principles in this artifact:

* [Design feature DF1: Data collection unit](../design-knowledge/blockchain-iot-sensor-data-df1.md) - The sensing/data-collection component that collects the raw sensor data at the source.
* [Design feature DF2: Validation sensor](../design-knowledge/blockchain-iot-sensor-data-df2.md) - An independent validation sensor that provides additional data (e.g., GPS alongside odometer values) for cross-validation.
* [Design feature DF3: Near-sensor preprocessing and hashing](../design-knowledge/blockchain-iot-sensor-data-df3.md) - Preprocess the data and record the blockchain transaction as a hash as close as possible to the sensing unit, preventing manipulation from that point on.
* [Design feature DF4: Storage service](../design-knowledge/blockchain-iot-sensor-data-df4.md) - A storage service that writes encrypted raw data into raw-data storage and propagates the signed hash transaction to the blockchain and verification storage.
* [Design feature DF5: Raw data storage](../design-knowledge/blockchain-iot-sensor-data-df5.md) - Encrypted raw sensor data is stored in a (centralized) mass-storage or cloud system.
* [Design feature DF6: Verification storage system](../design-knowledge/blockchain-iot-sensor-data-df6.md) - An independent verification storage system holds the hashes used to verify data integrity on the blockchain.
* [Design feature DF7: Access management service](../design-knowledge/blockchain-iot-sensor-data-df7.md) - An access-management service ensures the encrypted raw data can be accessed only when the data owner grants access.
* [Design feature DF8: Certification and verification mechanism](../design-knowledge/blockchain-iot-sensor-data-df8.md) - A certification mechanism performs cross-validation and verifies integrity (e.g., that mileage never decreased over time).
* [Design feature DF9: Data retrieval service](../design-knowledge/blockchain-iot-sensor-data-df9.md) - A data-retrieval service delivers decrypted raw data to authorized consumers after access is granted.

# Citations
[1] Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann. Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data. Journal of the Association for Information Systems 20(9), 2019, 1271-1307. https://doi.org/10.17705/1jais.00567
[2] Source document: Blockchain for the IoT.pdf
