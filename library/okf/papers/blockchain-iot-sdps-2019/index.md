---
type: Paper
paper_id: BLOCKCHAIN_IOT_SDPS_2019
paper_slug: blockchain-iot-sdps-2019
title: "Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data"
authors:
  - Mathieu Chanson
  - Andreas Bogner
  - Dominik Bilgeri
  - Elgar Fleisch
  - Felix Wortmann
year: 2019
venue: "Journal of the Association for Information Systems"
doi: "10.17705/1jais.00567"
source_pdf: "Blockchain for the IoT.pdf"
paper_category: case_paper
primary_domain: "IoT sensor data protection"
artifact_name: "Sensor Data Protection System (SDPS) / CertifiCar"
review_status: reviewed
confidence: high
---

# Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data

## One-line role in the library

This paper contributes a design theory for blockchain-based sensor data protection systems (SDPSs), with explicit design requirements, design principles, design features, an instantiated prototype called CertifiCar, and iterative plus ex-post evaluation.

## Why this paper matters for the OKF chatbot

This is one of the cleanest papers in the library for Requirement → Design Principle → Design Feature graph construction. The paper explicitly defines:

- four design requirements: tamper resistance, privacy preservation, large data volume throughput, and economic feasibility;
- four design principles: source-to-sink certification, cross-validation certification, data-owner-controlled disclosure, and linearly scalable architecture;
- nine design features grouped into capture data, store data, and provide data capabilities;
- an artifact architecture combining IoT sensors, off-chain/cloud storage, access management, certification, retrieval, and blockchain-based hash storage;
- an evaluated instantiation, CertifiCar, for odometer-fraud prevention.

## Recommended retrieval use

Use this paper when the user asks about:

- IoT sensor-data integrity
- tamper-resistant data pipelines
- privacy-preserving DLT/blockchain systems
- hybrid on-chain/off-chain architectures
- hash anchoring
- data certification
- cross-validation
- scalable blockchain system design
- data owner access control
- DSR design theory structure
- Requirement → Principle → Feature mapping
