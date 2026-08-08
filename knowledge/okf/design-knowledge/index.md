# Design knowledge

Atomic design-knowledge concepts extracted from the 34 papers. Each item is a design principle, requirement, meta-requirement, objective, goal, or design feature, and links back to its source paper (design features additionally link to the principles they implement). Grouped by source paper.

## Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules

Source: [aligning-newsvendors-scoring-rules](../papers/aligning-newsvendors-scoring-rules.md)

* [Design principle DP1: Decentralized, party-independent control of the escrow/payment](aligning-newsvendors-scoring-rules-dp1.md) - Payments should be handled by escrow accounts controlled by no individual entity.
* [Design principle DP2: Enforceable and immutable algorithmic contracts](aligning-newsvendors-scoring-rules-dp2.md) - Contracts between the newsvendor and the expert should be defined as enforceable and immutable algorithms.
* [Design principle DP3: Unambiguous source of the realized outcome](aligning-newsvendors-scoring-rules-dp3.md) - The source of the realized outcome must be unambiguous.

## An Architecture Using Payment Channel Networks for Blockchain-based Wi-Fi Sharing

Source: [wifi-sharing-payment-channels](../papers/wifi-sharing-payment-channels.md)

* [Design requirement S#IA: Infrastructure attacks](wifi-sharing-payment-channels-dr-s-ia.md) - A Wi-Fi sharing network must prevent network infrastructure attacks conducted by users against the host's network.
* [Design requirement S#RE: Resource exhaustion](wifi-sharing-payment-channels-dr-s-re.md) - A Wi-Fi sharing network must discourage users from conducting malicious actions using resource exhaustion against the host's shared bandwidth.
* [Design requirement S#B: Blacklisting](wifi-sharing-payment-channels-dr-s-b.md) - A Wi-Fi sharing network must prevent hosts' access points from becoming blacklisted by external service providers as a result of malicious user behavior.
* [Design requirement S#FA: Fraudulent access points](wifi-sharing-payment-channels-dr-s-fa.md) - A Wi-Fi sharing network must account for the risks imposed by fraudulent access points emulating a fake Service Set Identifier (SSID), which can be used to intercept connections between users and access points.
* [Design requirement S#UPT: User profiling and traceability](wifi-sharing-payment-channels-dr-s-upt.md) - A Wi-Fi sharing network's data processing must comply with data protection laws that prohibit techniques for user profiling and activity tracing.
* [Design requirement AU#AC: Application confinement](wifi-sharing-payment-channels-dr-au-ac.md) - A Wi-Fi sharing network must limit functionalities, rules, and restrictions that point to application confinement and potentially hamper user adoption.
* [Design requirement AU#AS: Accessibility of subscribed services](wifi-sharing-payment-channels-dr-au-as.md) - A Wi-Fi sharing network must regulate the accessibility of subscribed services that are made available unintentionally through the Internet Protocol of the access point.
* [Design requirement AU#LT: Legal risks and tarnished reputation](wifi-sharing-payment-channels-dr-au-lt.md) - A Wi-Fi sharing network must address the risks imposed by illegal actions of network users, which can yield losses in reputation or legal implications for hosts.
* [Design requirement AR#RO: Risk of overcharging](wifi-sharing-payment-channels-dr-ar-ro.md) - A Wi-Fi sharing network must prevent the risk of overcharging users through failure of service invoicing.
* [Design requirement AR#RR: Risk of repudiation](wifi-sharing-payment-channels-dr-ar-rr.md) - A Wi-Fi sharing network must prevent the risk of user repudiation emerging from service downtimes.
* [Design principle DP1: Host bandwidth management module](wifi-sharing-payment-channels-dp1.md) - Provide the system with a module for hosts to manage and organize the provided bandwidth in order for the system to provide access to the Internet.
* [Design principle DP2: Private-network module without shared secret keys](wifi-sharing-payment-channels-dp2.md) - Provide the system with a module for users to initiate and maintain a private network without sharing secret keys in order to prevent decoding of the connection.
* [Design principle DP3: Route users to their private network](wifi-sharing-payment-channels-dp3.md) - Provide the system with a module that provides only bandwidth to the user while users are routed to their private network even if their identity is known, in order to prevent users from conducting fraudulent actions.
* [Design principle DP4: Restrict user access to the host's infrastructure](wifi-sharing-payment-channels-dp4.md) - Provide the system with a module to restrict user access to the host's private network infrastructure even if the user's identity is known, in order to prevent fraudulent actions.
* [Design principle DP5: Clear access-point identification](wifi-sharing-payment-channels-dp5.md) - Provide the system with a module to identify access points clearly in order to prevent security-related threats such as eavesdropping or DNS-server phishing.
* [Design principle DP6: Tamper-proof transaction history via trusted intermediary](wifi-sharing-payment-channels-dp6.md) - Provide the system with a mutually trusted intermediary requiring a transaction history that records a user's data traffic, resource consumption and incurred costs, in order to ensure that connection data cannot be manipulated or corrupted.
* [Design principle DP7: Minimize transaction costs](wifi-sharing-payment-channels-dp7.md) - Provide the system with a module to keep transaction costs to a minimum in order to prevent large numbers of micro-payments.
* [Design principle DP8: Fee-free instant payments](wifi-sharing-payment-channels-dp8.md) - Provide the system with a module to forgo transaction costs for the execution of instant payments in order to regulate the duration of the connection.
* [Design principle DP9: Mutually agreed usage cost](wifi-sharing-payment-channels-dp9.md) - Provide the system with a module to set up the transaction in order to enable host and user to mutually agree on the usage cost.
* [Design principle DP10: Pre-payment mechanism](wifi-sharing-payment-channels-dp10.md) - Provide the system with a module for pre-payment in order to increase quality of service and prevent risks of overcharging and repudiation.
* [Design principle DP11: Dynamic trust-score accounting](wifi-sharing-payment-channels-dp11.md) - Provide the system with accounting mechanisms using a dynamic trust-score in order to facilitate cooperative host behavior and ensure high service levels by rewarding hosts for cooperation or high availability.
* [Design principle DP12: Platform-independent protocol](wifi-sharing-payment-channels-dp12.md) - Provide the system with a protocol that is platform-independent in order to avoid lock-in effects and facilitate user adoption and scalability.
* [Design principle DP13: Incremental bandwidth with instant payment](wifi-sharing-payment-channels-dp13.md) - Provide the system with a protocol that incrementally increases provided bandwidth together with instant payment functionalities that transfer outstanding payments immediately to unlock further resources, in order to prevent fraudulent behavior.
* [Design principle DP14: Multiple simultaneous connections and billing](wifi-sharing-payment-channels-dp14.md) - Provide the system with a protocol for users to initiate any number of connections and for hosts to simultaneously bill users with multiple connections, in order to ensure connections without the risk of overcharging or repudiation.

## And No One Gets the Short End of the Stick: A Blockchain-Based Approach to Solving the Two-Sided Opportunism Problem in Interorganizational Information Sharing

Source: [short-end-opportunism-sharing](../papers/short-end-opportunism-sharing.md)

* [Design requirement DR1: Prevent information manipulation](short-end-opportunism-sharing-dr1.md) - The system must prevent the information provider from manipulating the sensitive information it contributes.
* [Design requirement DR2: Prevent information poaching](short-end-opportunism-sharing-dr2.md) - The system must prevent the information recipient from poaching (misappropriating) the provider's sensitive data.
* [Design principle DP1: Confidential storage with proof of integrity](short-end-opportunism-sharing-dp1.md) - Store the sensitive data in a manipulation-resistant storage exclusively with the information provider and instantly create a manipulation-resistant proof of integrity for the information recipient...
* [Design principle DP2: Nonreversible shared computation](short-end-opportunism-sharing-dp2.md) - Utilize nonreversible functions that are reliably and independently executed to compute the shared information from the confidentially stored sensitive data, allowing predefinition of what informat...
* [Design principle DP3: Joint approval of computation changes](short-end-opportunism-sharing-dp3.md) - Require joint approval for any changes to the computation mechanisms, so that no single party controls the key data.

## Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data

Source: [blockchain-iot-sensor-data](../papers/blockchain-iot-sensor-data.md)

* [Design requirement DR1: Tamper-resistant data handling](blockchain-iot-sensor-data-dr1.md) - Enable tamper-resistant generation, processing, and exchange of IoT sensor data.
* [Design requirement DR2: Privacy-preserving data handling](blockchain-iot-sensor-data-dr2.md) - Enable privacy-preserving generation, processing, and exchange of IoT sensor data.
* [Design requirement DR3: Large data-volume throughput](blockchain-iot-sensor-data-dr3.md) - Enable large data-volume throughput in the generation, processing and exchange of IoT sensor data.
* [Design requirement DR4: Economic feasibility](blockchain-iot-sensor-data-dr4.md) - Ensure economic feasibility of the sensor-data generation, processing and exchange system.
* [Design principle DP1: Source-to-sink certification](blockchain-iot-sensor-data-dp1.md) - Certify sensor data on the basis of source-to-sink protection so that data producers are accountable for the data they provide.
* [Design principle DP2: Cross-validation certification](blockchain-iot-sensor-data-dp2.md) - Certify sensor data on the basis of cross-validation and plausibility checks to reduce the risk of manipulation.
* [Design principle DP3: Owner-controlled disclosure](blockchain-iot-sensor-data-dp3.md) - Let data owners determine when and to what extent their certified data is communicated to others.
* [Design principle DP4: Linearly scalable architecture](blockchain-iot-sensor-data-dp4.md) - Certify data on the basis of a linearly scalable system architecture.
* [Design feature DF1: Data collection unit](blockchain-iot-sensor-data-df1.md) - The sensing/data-collection component that collects the raw sensor data at the source.
* [Design feature DF2: Validation sensor](blockchain-iot-sensor-data-df2.md) - An independent validation sensor that provides additional data (e.g., GPS alongside odometer values) for cross-validation.
* [Design feature DF3: Near-sensor preprocessing and hashing](blockchain-iot-sensor-data-df3.md) - Preprocess the data and record the blockchain transaction as a hash as close as possible to the sensing unit, preventing manipulation from that point on.
* [Design feature DF4: Storage service](blockchain-iot-sensor-data-df4.md) - A storage service that writes encrypted raw data into raw-data storage and propagates the signed hash transaction to the blockchain and verification storage.
* [Design feature DF5: Raw data storage](blockchain-iot-sensor-data-df5.md) - Encrypted raw sensor data is stored in a (centralized) mass-storage or cloud system.
* [Design feature DF6: Verification storage system](blockchain-iot-sensor-data-df6.md) - An independent verification storage system holds the hashes used to verify data integrity on the blockchain.
* [Design feature DF7: Access management service](blockchain-iot-sensor-data-df7.md) - An access-management service ensures the encrypted raw data can be accessed only when the data owner grants access.
* [Design feature DF8: Certification and verification mechanism](blockchain-iot-sensor-data-df8.md) - A certification mechanism performs cross-validation and verifies integrity (e.g., that mileage never decreased over time).
* [Design feature DF9: Data retrieval service](blockchain-iot-sensor-data-df9.md) - A data-retrieval service delivers decrypted raw data to authorized consumers after access is granted.

## Blockchain innovation for consent self-management in health information exchanges

Source: [consent-self-management-hie](../papers/consent-self-management-hie.md)

* [Design requirement DR1: Privacy](consent-self-management-hie-dr1.md) - Patient consent self-management must support patients' privacy preferences, since the exposure of protected health information to unauthorized entities can be detrimental to patients and healthcare organizations are federally mandated to secure PHI privacy under HIPAA.
* [Design requirement DR2: Self-management](consent-self-management-hie-dr2.md) - The solution must support patients' self-management of their own consent data, reflecting patients' rights to notice, access, and consent over the collection, use and disclosure of their personal data.
* [Design requirement DR3: Trust](consent-self-management-hie-dr3.md) - The solution must build and maintain patient trust in health information exchange by giving patients control over and visibility into their consent relationships, since patient trust is critical to the rights patients have to control the sharing of their protected health information.
* [Design requirement DR4: Compliance](consent-self-management-hie-dr4.md) - The solution must have the flexibility to comply with the variable body of federal and state regulatory rules governing patient consent for PHI sharing, since healthcare providers must comply with these regulations for the patient data they manage.
* [Design requirement DR5: Interoperability](consent-self-management-hie-dr5.md) - The solution must be interoperable across the currently fragmented health information exchange infrastructure to enable full self-management of consent, since the range of HIE organizational forms is each designed to support connectivity for only a limited set of entities.
* [Design principle DP1: Authorization-restricted consent visibility](consent-self-management-hie-dp1.md) - Only HIEs and providers with authorization can view a patient's consent status, maintaining confidentiality.
* [Design principle DP2: Patient-only consent changes](consent-self-management-hie-dp2.md) - Only the patient can change their consent status, supporting self-management and engendering patient trust.
* [Design principle DP3: Auditable consent history](consent-self-management-hie-dp3.md) - The history of consent transactions between patients and the HIE must be auditable so that compliance with consent laws can be verified for all transactions.
* [Design principle DP4: Cross-HIE consent communication without central authority](consent-self-management-hie-dp4.md) - HIEs should be able to communicate consent status across HIEs without a central authority, supporting interoperability.
* [Design principle DP5: Patient-driven cross-HIE consent updates](consent-self-management-hie-dp5.md) - Enable patients to share changes in their consent status across HIEs.
* [Design feature DF1: Encryption](consent-self-management-hie-df1.md) - Blockchain wallets store and seamlessly use private keys to digitally sign blockchain transactions, providing encryption for consent transactions.
* [Design feature DF2: Key management](consent-self-management-hie-df2.md) - Blockchain wallets manage the cryptographic keys that authenticate users and facilitate the creation of blockchain transactions.
* [Design feature DF3: Immutability](consent-self-management-hie-df3.md) - Consent transactions are never erased; a previous transaction remains, and any change is added as a new transaction to the append-only blockchain data structure.
* [Design feature DF4: Decentralization](consent-self-management-hie-df4.md) - A user can connect and submit a consent transaction to a single HIE without the need for a central, trusted entity to mediate the exchange.
* [Design feature DF5: Distribution](consent-self-management-hie-df5.md) - A consent transaction submitted to a single HIE is shared with all blockchain network nodes (HIEs), eventually becoming available to all HIEs.

## Blockchain to Rule the Waves - Nascent Design Principles for Reducing Risk and Uncertainty in Decentralized Environments

Source: [rule-the-waves-shipping](../papers/rule-the-waves-shipping.md)

* [Design principle DP1: Digitization](rule-the-waves-shipping-dp1.md) - All data is stored and exchanged digitally.
* [Design principle DP2: Tamper-proof storage](rule-the-waves-shipping-dp2.md) - All changes made to the data that are stored in the system can be retraced.
* [Design principle DP3: Accessibility](rule-the-waves-shipping-dp3.md) - The system can be accessed easily even by technically non-sophisticated stakeholders.
* [Design principle DP4: User authentication](rule-the-waves-shipping-dp4.md) - All activities in the system can be traced back to certain users.

## Blockchain-based digital rights management systems: Design principles for the music industry

Source: [drm-music-industry](../papers/drm-music-industry.md)

* [Design requirement DR1: Transparent music licensing structures](drm-music-industry-dr1.md) - A decentralized DRM system for the music industry must provide transparent music licensing structures, replacing pre-Internet structures with many intermediaries.
* [Design requirement DR2: Consistent and complete rights metadata](drm-music-industry-dr2.md) - A decentralized DRM system for the music industry must ensure consistent and complete music rights metadata, currently dispersed across many intermediaries in inconsistent and incomplete formats.
* [Design requirement DR3: Efficient and transparent royalty payout](drm-music-industry-dr3.md) - A decentralized DRM system for the music industry must enable efficient and transparent royalty payout, addressing massive delays and unallocated royalties.
* [Design principle DP1: Public-ledger metadata storage](drm-music-industry-dp1.md) - The system should store music rights metadata on a distributed ledger using a public blockchain to make licensing structures transparently visible to everyone, so that rights owners can claim royal...
* [Design principle DP2: Consensus-validated metadata on a permissioned chain](drm-music-industry-dp2.md) - The system should validate music metadata with a consensus mechanism on a permissioned blockchain and assign a unique identifier to rights owners, so that labels and publishers can ensure consisten...
* [Design principle DP3: Smart-contract stablecoin royalty enforcement](drm-music-industry-dp3.md) - The system should algorithmically enforce royalty payout via stablecoin through a smart contract, enabling efficient and transparent payouts.
* [Design feature DF1: Public-permissioned blockchain](drm-music-industry-df1.md) - A decentralized DRM system can be implemented with a public-permissioned blockchain.
* [Design feature DF2: pBFT consensus](drm-music-industry-df2.md) - A decentralized DRM system can validate metadata with a practical Byzantine fault tolerant consensus mechanism.
* [Design feature DF3: Fiat-pegged stablecoin payout](drm-music-industry-df3.md) - A decentralized DRM system can pay out royalties with a fiat-pegged collateralized stablecoin.
* [Design feature DF4: Collectively designed smart contract](drm-music-industry-df4.md) - A decentralized DRM system can pay out royalties with a collectively designed, evidence-based smart contract.

## Blockchain-based token system for incentivizing peer review: A design science approach

Source: [peer-review-token-incentives](../papers/peer-review-token-incentives.md)

* [Design principle DP1: Motivation-appropriate incentives](peer-review-token-incentives-dp1.md) - Provide incentives to reviewers that appeal to their specific motivations, since understanding and leveraging different types of motivation ensures the system effectively encourages participation.
* [Design principle DP2: Flexibility](peer-review-token-incentives-dp2.md) - Support functionality that is customizable to the needs of stakeholders, so that different outlets can motivate reviewers with different reward types (e.g., recognition vs.
* [Design principle DP3: Trust](peer-review-token-incentives-dp3.md) - Ensure the integrity, security, fairness and impartiality of the review system so that reviewers trust that their rewards and identities are protected;
* [Design feature DF1: Tokenization](peer-review-token-incentives-df1.md) - Tokenization creates unique digital representations of incentives, with non-fungible and fungible tokens enabling different types of extrinsic incentive.
* [Design feature DF2: Immutability](peer-review-token-incentives-df2.md) - Blockchain immutability ensures that recorded incentive and reward data cannot be altered or deleted, guaranteeing integrity.
* [Design feature DF3: Decentralization](peer-review-token-incentives-df3.md) - Decentralized storage across a distributed network removes central authorities and single points of failure and avoids vendor lock-in.

## Certified data chats for future used car markets

Source: [certified-data-chats-used-cars](../papers/certified-data-chats-used-cars.md)

* [Design goal DG1: Useful integration of certified data assets](certified-data-chats-used-cars-dg1.md) - Implement a useful integration of certified data assets into the chat.
* [Design goal DG2: Simple and seamless interaction](certified-data-chats-used-cars-dg2.md) - Enable simple and seamless interaction using the certified data assets.
* [Design goal DG3: Transparent and manageable disclosure](certified-data-chats-used-cars-dg3.md) - Enable transparent and manageable disclosure using the certified data assets.
* [Design principle DP1: Certified data provision](certified-data-chats-used-cars-dp1.md) - Provide certified data to negotiating sellers and buyers in a certified data area, so that both parties can consider the car data credible and trustworthy, increasing market transparency.
* [Design principle DP2: Selective information disclosure](certified-data-chats-used-cars-dp2.md) - Allow negotiating sellers to selectively disclose information to the buyers by moving certified data to the conversation area (e.g., via drag-and-drop), enabling context-individual disclosure manag...
* [Design principle DP3: Data presentation as overview and within conversation](certified-data-chats-used-cars-dp3.md) - Present certified data in used-car negotiations both as an overview and within the conversation, marking certified messages so they are recognized as certified and tamper-proof.

## Cross-Organizational Workflow Management Using Blockchain Technology - Towards Applicability, Auditability, and Automation

Source: [cross-org-workflow-objectives](../papers/cross-org-workflow-objectives.md)

* [Design objective DO1a: Digitize paper-based process steps, e.g. document sending](cross-org-workflow-objectives-do1a.md) - The BDW maps a fully digitized process, i.e. no paper-based documents are necessary.
* [Design objective DO1b: Avoid multiple originals and signatures](cross-org-workflow-objectives-do1b.md) - By the use of digital documents multiple versions and signatures of one document are not required anymore.
* [Design objective DO2: Automate manual document checking](cross-org-workflow-objectives-do2.md) - For the banks, the manual document check is avoided by the use of smart contracts.
* [Design objective DO3: Allow for concurrent document processing](cross-org-workflow-objectives-do3.md) - As process participants do not need to wait for paper-based documents to arrive, a concurrent document check is possible for the advising and issuing bank.
* [Design objective DO4: Impose an overall tracking system](cross-org-workflow-objectives-do4.md) - A real time process tracking is implemented.
* [Design objective DO5: Provide process history](cross-org-workflow-objectives-do5.md) - Any process can be traced end to end anytime.
* [Design objective DO6: Make process participants (persons) transparent](cross-org-workflow-objectives-do6.md) - Each participant must identify before conducting an action.
* [Design objective DO7: Shorten overall process time](cross-org-workflow-objectives-do7.md) - The overall process time is heavily shortened.
* [Design objective DO8: Keep high flexibility](cross-org-workflow-objectives-do8.md) - The DBW is applicable in various situations, e.g. for companies from different countries, various document requirements etc.
* [Design objective DO9: Lower Costs](cross-org-workflow-objectives-do9.md) - Overall, the BDW safes costs.

## Decentralized Procurement Mechanisms for Efficient Logistics Services Mapping - a Design Science Research Approach

Source: [decentralized-procurement-logistics](../papers/decentralized-procurement-logistics.md)

* [Design requirement R1: Allocation flexibility](decentralized-procurement-logistics-dr1.md) - A solution must provide allocation flexibility to shippers and carriers.
* [Design requirement R2: Autonomous allocation process](decentralized-procurement-logistics-dr2.md) - A solution must provide an autonomous allocation process.
* [Design requirement R3: Real-time payment](decentralized-procurement-logistics-dr3.md) - A solution must enact real-time payment to help carriers optimize their commercial processes and operating costs.
* [Design requirement R4: CMR regulations compliance](decentralized-procurement-logistics-dr4.md) - A solution must comply with CMR regulations.
* [Design requirement R5: Delivery history integrity and traceability](decentralized-procurement-logistics-dr5.md) - A solution must provide delivery history integrity and traceability.
* [Design objective P1: Platform operating costs reduction](decentralized-procurement-logistics-do1.md) - Platform operating costs reduction of the FTSP system should be considered to enhance the transportation process.
* [Design objective P2: Contractual flexibility](decentralized-procurement-logistics-do2.md) - The platform should offer contractual flexibility.
* [Design objective P3: Allocation integrity](decentralized-procurement-logistics-do3.md) - Allocation integrity should be considered, be it for the allocation process, the record of service rates, and the management of CMR.
* [Design principle DP1: Understandability](decentralized-procurement-logistics-dp1.md) - The smart contract shipper-carrier allocation protocol must be displayed to the shipper.
* [Design principle DP2: Automation](decentralized-procurement-logistics-dp2.md) - The FTSP process must be carried on in an end-to-end fashion by the smart contract.
* [Design principle DP3: Metrics privacy](decentralized-procurement-logistics-dp3.md) - The allocation mechanism must keep sensitive data off-chain in competitive markets.

## Design Principles for Blockchain-based Applications in Green Bond Reporting

Source: [green-bond-reporting-dp](../papers/green-bond-reporting-dp.md)

* [Design principle DP1: Consortium blockchain](green-bond-reporting-dp-dp1.md) - Use a consortium blockchain.
* [Design principle DP2: Proof-of-authority consensus](green-bond-reporting-dp-dp2.md) - The proof-of-authority consensus mechanism is suitable due to some level of trust already existing.
* [Design principle DP3: Smart-contract document validation](green-bond-reporting-dp-dp3.md) - Smart contracts can validate that an authorized party uploaded and signed the file.
* [Design principle DP4: Reputation-based incentives](green-bond-reporting-dp-dp4.md) - Design for reputation rather than monetary incentives.
* [Design principle DP5: Off-chain decision-making](green-bond-reporting-dp-dp5.md) - Off-chain decisions different stakeholders take remain in their current format. On-chain decisions are facilitated through smart contracts.
* [Design principle DP6: Role-based privileges](green-bond-reporting-dp-dp6.md) - The issuer, second opinion provider, and investor are identified as different roles with different privilege rights, such as access and editing rights and building and approving blocks.

## Designing a blockchain-based information system for procurement processes - Balancing decentralization, scalability, and security while maintaining privacy

Source: [procurement-is-trilemma](../papers/procurement-is-trilemma.md)

* [Design objective DO1: Publicly accessible, interoperable blockchain infrastructure](procurement-is-trilemma-do1.md) - The artifact should leverage standardization efforts to enable enterprises to seamlessly integrate their ERP systems with publicly accessible, interoperable blockchain infrastructure.
* [Design objective DO2: Stable, regulation-compliant payment processing](procurement-is-trilemma-do2.md) - The artifact should embed stable and regulation-compliant payment processing into blockchain-based procurement workflows.
* [Design objective DO3: Strengthen dispute-resolution trust via permissionless blockchain](procurement-is-trilemma-do3.md) - The artifact should strengthen trust in procurement's dispute resolution processes without undermining trust in the underlying infrastructure by leveraging permissionless blockchain.
* [Design objective DO4: Infrastructure that scales with volume and users](procurement-is-trilemma-do4.md) - The artifact should be built on an infrastructure capable of scaling with growing transaction volumes and users.
* [Design objective DO5: Privacy-enabled while maintaining auditability](procurement-is-trilemma-do5.md) - The artifact should be privacy-enabled while maintaining the inherent auditability of blockchain records.
* [Design principle DP1: Balance decentralization, scalability and security](procurement-is-trilemma-dp1.md) - Principle of balancing the blockchain trilemma with a public Layer 1 as a trust anchor, a Layer 2 for scalability, and decentralized communication between layers.
* [Design principle DP2: Maintain the balance under privacy requirements](procurement-is-trilemma-dp2.md) - Principle of ensuring privacy while maintaining a balanced blockchain trilemma through efficient and resilient cryptography and minimized control mechanism.

## Designing a cross-organizational identity management system: Utilizing SSI for the certification of retailer attributes

Source: [cross-org-identity-ssi](../papers/cross-org-identity-ssi.md)

* [Design objective DO1: Issuance](cross-org-identity-ssi-do1.md) - The system should allow the issuance of a certificate to prove the retailer's identity and a certificate to prove correct tax registration.
* [Design objective DO2: Verification](cross-org-identity-ssi-do2.md) - The system should facilitate the tax authority and the marketplace to verify certificates' validity, signature, and integrity.
* [Design objective DO3: Revocation](cross-org-identity-ssi-do3.md) - The system must allow the issuing party to mark an outdated certificate as invalid and ensure the verifier knows it is no longer valid.
* [Design objective DO4: Audit](cross-org-identity-ssi-do4.md) - The tax authority should be able to audit the marketplace's verification process to confirm legal compliance.
* [Design objective DO5: Decentralization](cross-org-identity-ssi-do5.md) - No central authority should oversee all documents and attributes, requiring a decentralized and interoperable IdM approach.
* [Design objective DO6: Data confidentiality](cross-org-identity-ssi-do6.md) - Data about individual parties must only be accessible to them and the parties directly involved in the process.
* [Design objective DO7: Data availability](cross-org-identity-ssi-do7.md) - The system should ensure constant availability of the service.
* [Design objective DO8: Usability](cross-org-identity-ssi-do8.md) - The application and handling of a certificate should be designed as intuitively as possible.
* [Design principle DP1: Use the multiplicity of roles of actors for scaling the identity ecosystem](cross-org-identity-ssi-dp1.md) - Such systems should be designed so that one party can take on each of the issuer, holder or verifier role at any time, using the multiplicity of roles of actors for scaling the identity ecosystem.
* [Design principle DP2: Consider credentials for multiple applications to facilitate additional use cases](cross-org-identity-ssi-dp2.md) - Issue verifiable credentials in a context-independent, general-purpose manner so that the same credential can facilitate additional use cases and reduce friction.
* [Design principle DP3: Recognize the identity holder as the primary controller to ensure seamless processes](cross-org-identity-ssi-dp3.md) - Design applications so that the identity holder is an active participant in almost all processes, since all processes start with or require approval from the holder.
* [Design principle DP4: Use public DIDs only for credential issuers to minimize privacy issues](cross-org-identity-ssi-dp4.md) - Publish public DIDs only for credential issuers and exchange DIDs bilaterally for all other parties, minimizing on-chain transactions and privacy risks.

## Designing a fair and inclusive digital asset-based name-image-likeness marketplace

Source: [nil-marketplace-fair-inclusive](../papers/nil-marketplace-fair-inclusive.md)

* [Design requirement DR1: Inclusiveness](nil-marketplace-fair-inclusive-dr1.md) - NIL projects should provide all student-athletes with access to opportunities and resources.
* [Design requirement DR2: Meritocratic Allocation](nil-marketplace-fair-inclusive-dr2.md) - Relevant differences among student-athletes should be a driving factor when allocating NIL financial resources.
* [Design requirement DR3: Market Thickness](nil-marketplace-fair-inclusive-dr3.md) - Participants in market-based NIL projects should be able to find trading partners quickly.
* [Design requirement DR4: No Congestion](nil-marketplace-fair-inclusive-dr4.md) - Market-based NIL projects must overcome congestion by having fast transactions.
* [Design requirement DR5: Market Safety](nil-marketplace-fair-inclusive-dr5.md) - Market-based NIL initiatives must be safe for the student-athletes.
* [Design principle DP1: Plausible events (randomized collectible sales)](nil-marketplace-fair-inclusive-dp1.md) - Enable market-based randomized sales of royalty-paying collectibles so that every student-athlete has a non-zero chance of profiting from their NIL, satisfying the inclusiveness requirement via the possibility effect.
* [Design principle DP2: Market royalties (meritocratic allocation)](nil-marketplace-fair-inclusive-dp2.md) - Allow ex-post, market-driven adjustments to the initial allocation through royalties from secondary-market sales of collectibles, so that student-athletes are rewarded in proportion to relevant differences, satisfying meritocratic fairness.
* [Design principle DP3: Blockchain-based marketplace infrastructure](nil-marketplace-fair-inclusive-dp3.md) - Use blockchain technology as the foundational infrastructure - with transparent public ledgers and smart contracts - to create a well-functioning NIL collectibles marketplace that satisfies requirements for successful markets.
* [Design feature DF1: Primary Markets](nil-marketplace-fair-inclusive-df1.md) - Purchasing collectibles mints NFTs, and on monetary compensation a predetermined, hardcoded portion of the value is distributed as royalties among the associated student-athletes (randomized primary-market sales).
* [Design feature DF2: Market Exchanges](nil-marketplace-fair-inclusive-df2.md) - Minted NFTs that pay royalties to student-athletes can be traded in secondary markets; deterministic secondary-market sales implement the meritocratic-allocation principle.

## Designing a Framework for Digital KYC Processes Built on Blockchain-Based Self-Sovereign Identity

Source: [kyc-framework-ssi](../papers/kyc-framework-ssi.md)

* [Design objective Objective 1: Efficiency](kyc-framework-ssi-do1.md) - Three requirements had to be satisfied: end-to-end digital processing of relevant documents, automation of manual processes, and standardized exchange of eKYC documents.
* [Design objective Objective 2: Regulatory compliance](kyc-framework-ssi-do2.md) - The Money Laundering Act (MLA), GDPR, and eIDAS are particularly relevant regulations for a digital KYC process.
* [Design objective Objective 3: Decentralization](kyc-framework-ssi-do3.md) - A viable solution must avoid central storage of customer data and prevent lock-in effects that could result in the aggregation of market power.
* [Design objective Objective 4: Trust](kyc-framework-ssi-do4.md) - Requires acceptance of KYC documents attested by other banks, validity checks, and authenticity checks.
* [Design objective Objective 5: Privacy](kyc-framework-ssi-do5.md) - Requires compliance with the need to know principle and data minimization.
* [Design objective Objective 6: User experience](kyc-framework-ssi-do6.md) - Requires low complexity, availability of different user interfaces, and backup, recovery, and support.
* [Design requirement R1.1: End-to-end digital processing of relevant documents](kyc-framework-ssi-r1-1.md) - A prerequisite for automating process steps and reducing friction.
* [Design requirement R1.2: Automation of manual processes](kyc-framework-ssi-r1-2.md) - Many current validation steps are conducted manually and should be automated.
* [Design requirement R1.3: Standardized exchange of eKYC documents](kyc-framework-ssi-r1-3.md) - Crucial for efficient integration of eKYC checks conducted at other institutions.
* [Design requirement R2.1: Money Laundering Act (MLA)](kyc-framework-ssi-r2-1.md) - Requirements regarding customer identification, record storage, and risk documentation.
* [Design requirement R2.2: GDPR](kyc-framework-ssi-r2-2.md) - Requirements including privacy by design, right to erasure, purpose limitation, and data minimization.
* [Design requirement R2.3: eIDAS](kyc-framework-ssi-r2-3.md) - Requirements on electronic means of identification, security levels, and cross-border interoperability.
* [Design requirement R3.1: Avoid central storage of customer data](kyc-framework-ssi-r3-1.md) - A viable eKYC solution must avoid central storage of customer data to prevent data breaches.
* [Design requirement R3.2: Prevent lock-in effects](kyc-framework-ssi-r3-2.md) - The system must be constructed to prevent lock-in effects that aggregate market power.
* [Design requirement R4.1: Acceptance of KYC documents attested by other banks](kyc-framework-ssi-r4-1.md) - Required to make eKYC documents reusable across banks.
* [Design requirement R4.2: Validity checks](kyc-framework-ssi-r4-2.md) - Documents must be tamper-proof, so validity checks must be feasible.
* [Design requirement R4.3: Authenticity checks](kyc-framework-ssi-r4-3.md) - The customer's identity and connection to the documents must have a high level of assurance.
* [Design requirement R5.1: Need to know principle](kyc-framework-ssi-r5-1.md) - Only customers and entities relevant to the KYC process must have access to personal data.
* [Design requirement R5.2: Data minimization](kyc-framework-ssi-r5-2.md) - Parties and data exchanged should be restricted to what is necessary.
* [Design requirement R6.1: Low complexity](kyc-framework-ssi-r6-1.md) - The eKYC process must be fast and simple for the customer.
* [Design requirement R6.2: Availability of different user interfaces](kyc-framework-ssi-r6-2.md) - The variety of devices customers use must be respected.
* [Design requirement R6.3: Backup, recovery, and support](kyc-framework-ssi-r6-3.md) - Exception handling is needed if a device storing customer data is lost or stolen.
* [Design principle DP1: Utilize blockchain only for public data](kyc-framework-ssi-dp1.md) - Use blockchain in SSI processes only for public data: organizations should repeatedly request and verify attributes through bilateral communication channels and read from, rather than write to, the ledger.
* [Design principle DP2: Anticipate an ecosystem of various ledgers](kyc-framework-ssi-dp2.md) - Do not assume a single shared ledger; anticipate an ecosystem of various distributed ledgers.
* [Design principle DP3: Enable decentralization at the edge](kyc-framework-ssi-dp3.md) - Ensure that users can store their verifiable credentials on an infrastructure of their choice, supporting user autonomy and decentralization at the edge of the SSI architecture.

## Designing GDPR Compliant Credential Verification Using Blockchain: A Design Science Research Approach

Source: [gdpr-credential-verification](../papers/gdpr-credential-verification.md)

* [Meta-requirement MR1: Verify with original documents](gdpr-credential-verification-mr1.md) - The verification system should only use the candidate's original documents to verify the credentials.
* [Meta-requirement MR2: Automated verification](gdpr-credential-verification-mr2.md) - The verification system should be automated to ensure quick turnaround time and reduce manual work.
* [Meta-requirement MR3: Easy-to-use, easily integrated interface](gdpr-credential-verification-mr3.md) - The verification system should have an easy-to-use interface for all kinds of users and be integrable into existing systems with minimal effort.
* [Meta-requirement MR4: Data-protection conformance](gdpr-credential-verification-mr4.md) - The verification system should conform to available data-protection and privacy regulations so that data ownership and access control are ensured.
* [Design principle DP1: Blockchain for trustworthy multi-party verification](gdpr-credential-verification-dp1.md) - Use blockchain to enable trustworthy and transparent user-credential verification with legitimate documents among multiple parties, since immutable entries and multi-party participation ensure only...
* [Design principle DP2: Smart contracts to automate verification](gdpr-credential-verification-dp2.md) - Use smart contracts to automate the whole process, remove manual intervention of third parties and ensure quick turnaround time.
* [Design principle DP3: GDPR conformance via off-chain storage and ZKPs](gdpr-credential-verification-dp3.md) - Conform to GDPR by storing actual documents off-chain (only hashes on-chain) and using zero-knowledge proofs and user-held identity so that data ownership and access control are ensured.

## Designing the future of bond markets: Reducing transaction costs through tokenization

Source: [bond-markets-tokenization-tac](../papers/bond-markets-tokenization-tac.md)

* [Meta-requirement MR-1: Reduce time-intensity](bond-markets-tokenization-tac-mr1.md) - Settlement and clearing time still vary across some markets and take two business days; the prototype shall minimize process times.
* [Meta-requirement MR-2: Reduce stakeholder complexity](bond-markets-tokenization-tac-mr2.md) - Numerous intermediaries cause significant complexity in a securities transaction; the artifact shall reduce this source of complexity.
* [Meta-requirement MR-3: Avoid manual and analog processes](bond-markets-tokenization-tac-mr3.md) - The issuance of securities involves many manual processes and an administrative burden from physical certificates; the prototype shall avoid manual processes to a maximum extent.
* [Meta-requirement MR-4: Reduce dependency on CSDs](bond-markets-tokenization-tac-mr4.md) - Every securities transaction has to use Central Securities Depositories or delegated depository banks, creating a centralized bottleneck; the prototype shall avoid such central intermediaries.
* [Meta-requirement MR-5: Reduce market barriers](bond-markets-tokenization-tac-mr5.md) - Bond denomination and business-day trade restrictions exclude some investors; the prototype shall reduce market barriers for all participants.
* [Meta-requirement MR-6: Provision of secondary markets](bond-markets-tokenization-tac-mr6.md) - Secondary markets for trading bonds remain insufficient; the prototype shall provide sufficient secondary markets.
* [Meta-requirement MR-7: Reduce room for opportunistic behavior](bond-markets-tokenization-tac-mr7.md) - Information asymmetries, counterparty risks, and non-transparent processes create room for opportunism; the prototype shall reduce information asymmetries as much as possible.
* [Design objective DO-1: Minimize latency of settlement processes](bond-markets-tokenization-tac-do1.md) - The prototype should enable nearly instantaneous settlement of trades, reducing the delay between trade initiation and settlement to a minimum.
* [Design objective DO-2: Reduce complexity (standardized interfaces and consolidated roles as well as responsibilities)](bond-markets-tokenization-tac-do2.md) - The number of separated entities and manual processes should be reduced to a minimum, with the issuance process as standardized as possible.
* [Design objective DO-3: Reduce access barriers (flexible issuance sizes and secondary market support)](bond-markets-tokenization-tac-do3.md) - The prototype should allow issuances of all sizes and support secondary-market trading not restricted by business hours or geography.
* [Design objective DO-4: Optimized information sharing](bond-markets-tokenization-tac-do4.md) - The prototype should reduce information asymmetries and create transparency across permitted stakeholders while ensuring investor privacy.
* [Design objective DO-5: Ensure regulatory compliance (with MiCAR and eWpG)](bond-markets-tokenization-tac-do5.md) - The prototype must fully comply with the German legal framework, including KYC/AML checks, judicially enforceable forced transfer, and a crypto securities registry.
* [Design principle DP1: Apply modular design of distinctive system components](bond-markets-tokenization-tac-dp1.md) - Modularly structure complex bond-market systems into distinct, interconnected contracts to work within Ethereum's contract-size limits, using modifiers and specific sender functions to protect components from unauthorized access.
* [Design principle DP2: Exploit multi-token standards](bond-markets-tokenization-tac-dp2.md) - Use multi-token standards (e.g., ERC-1155) when issuing multiple security tokens sharing comparable characteristics, to conserve blockchain storage and simplify architecture.
* [Design principle DP3: Automated on-chain payout mechanisms for investors](bond-markets-tokenization-tac-dp3.md) - Integrate on-chain settlement using claim capabilities in disbursement, empowering investors to control the timing and method of interest payments and removing reliance on issuer/platform trustworthiness.
* [Design principle DP4: Restrict forced-transfer functions to regulators](bond-markets-tokenization-tac-dp4.md) - Restrict particularly critical functions such as forced transfers to regulators only, to prevent abuse of power while complying with regulatory requirements.
* [Design principle DP5: Implement smart-contract-based crypto securities registers](bond-markets-tokenization-tac-dp5.md) - Implement a crypto securities register (CSR) within a smart contract for digitally tokenized bearer bonds, disrupting the traditional custodian chain and accelerating settlement.

## Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity

Source: [trust-enabling-capacity-exchange](../papers/trust-enabling-capacity-exchange.md)

* [MR-S1: Creation and management of tender](trust-enabling-capacity-exchange-mr-s1.md) - Specification dimension.
* [MR-S2: Cross-domain management](trust-enabling-capacity-exchange-mr-s2.md) - Specification dimension.
* [MR-I1: Search functions](trust-enabling-capacity-exchange-mr-i1.md) - Information dimension.
* [MR-I2: Identity management and verification](trust-enabling-capacity-exchange-mr-i2.md) - Information dimension.
* [MR-I3: Services to support the initiation process](trust-enabling-capacity-exchange-mr-i3.md) - Information dimension.
* [MR-N1: Possibility for intermediate connection](trust-enabling-capacity-exchange-mr-n1.md) - Negotiation dimension.
* [MR-N2: Heterogeneity of contracts](trust-enabling-capacity-exchange-mr-n2.md) - Negotiation dimension.
* [MR-N3: Function for final award of the contract](trust-enabling-capacity-exchange-mr-n3.md) - Negotiation dimension.
* [MR-F1: Conditions for fulfilling the payment](trust-enabling-capacity-exchange-mr-f1.md) - Fulfilment dimension.
* [MR-F2: Compliance with legal framework conditions](trust-enabling-capacity-exchange-mr-f2.md) - Fulfilment dimension.
* [MR-A1: Serious rating](trust-enabling-capacity-exchange-mr-a1.md) - After-Sales dimension.
* [MR-A2: Provision of decision relevant KPIs](trust-enabling-capacity-exchange-mr-a2.md) - After-Sales dimension.
* [MR-O1: Transparency and completeness of collected data relevant to transaction](trust-enabling-capacity-exchange-mr-o1.md) - Overlapping category.
* [MR-O2: Decentralization and Simultaneity](trust-enabling-capacity-exchange-mr-o2.md) - Overlapping category.
* [MR-O3: Communication services](trust-enabling-capacity-exchange-mr-o3.md) - Overlapping category.
* [MR-O4: Equality of participants](trust-enabling-capacity-exchange-mr-o4.md) - Overlapping category.
* [MR-O5: Interface compatibility and standards](trust-enabling-capacity-exchange-mr-o5.md) - Overlapping category.
* [MR-O6: Depictability of human interaction and role models](trust-enabling-capacity-exchange-mr-o6.md) - Overlapping category.
* [MR-O7: Encryption concepts](trust-enabling-capacity-exchange-mr-o7.md) - Overlapping category.
* [Design principle DP1: Signaling of tender-relevant information](trust-enabling-capacity-exchange-dp1.md) - Provide functions for customized creation of tenders and their linkage to a verified identity, revealing them simultaneously and in a distributed manner, to reduce uncertainty from vague specifications and missing identity assignments.
* [Design principle DP2: Signaling of identity-relevant information](trust-enabling-capacity-exchange-dp2.md) - Provide functions for decentralized storage, configuration and verification of identities to establish trust in each participant's identity, ensuring transparency and correctness of identity.
* [Design principle DP3: Authority and fairness](trust-enabling-capacity-exchange-dp3.md) - Provide functions for creating and decentrally storing contracts and their order-relevant contents, and for monitoring compliance and enforcing sanctions/rewards, providing a transparent data basis and traceable enforcement of countermeasures.
* [Design principle DP4: Incentive mechanisms](trust-enabling-capacity-exchange-dp4.md) - Make the value-adding benefits of cooperation and the imminent losses from violations transparent and observable to all participants, motivating them and deterring opportunistic behavior.
* [Design principle DP5: Screening functionality](trust-enabling-capacity-exchange-dp5.md) - Provide functions for depositing information, distributed and verified access, validity checking and searching/contacting participants, so that information obtained during retrieval is valid and trustworthy.
* [Design principle DP6: Reputation mechanism](trust-enabling-capacity-exchange-dp6.md) - Provide a reputation mechanism that, after the fulfillment stage, allows serious rating of each identity with decentralized collection and transparent processing/distribution of rating data, so participants can trust the reputation data.
* [DF1.1: Creating a tender](trust-enabling-capacity-exchange-df1-1.md) - Implements DP1.
* [DF1.2: Distributing information relevant to tender](trust-enabling-capacity-exchange-df1-2.md) - Implements DP1.
* [DF2.1: Creating an identity](trust-enabling-capacity-exchange-df2-1.md) - Implements DP2.
* [DF2.2: Distributing information relevant to identity](trust-enabling-capacity-exchange-df2-2.md) - Implements DP2.
* [DF3.1: Ensuring authorized access](trust-enabling-capacity-exchange-df3-1.md) - Implements DP3.
* [DF3.2: Configuring permissions](trust-enabling-capacity-exchange-df3-2.md) - Implements DP3.
* [DF3.3: Prevention of fraud](trust-enabling-capacity-exchange-df3-3.md) - Implements DP3.
* [DF4.1: Enforcing rewards and incentive](trust-enabling-capacity-exchange-df4-1.md) - Implements DP4.
* [DF4.2: Ensuring traceability of enforced rewards and incentives](trust-enabling-capacity-exchange-df4-2.md) - Implements DP4.
* [DF5.1: Permitted access to information relevant to tender](trust-enabling-capacity-exchange-df5-1.md) - Implements DP5.
* [DF5.2: Permitted access to information relevant to identity](trust-enabling-capacity-exchange-df5-2.md) - Implements DP5.
* [DF5.3: Permitted access to information relevant to reputation](trust-enabling-capacity-exchange-df5-3.md) - Implements DP5.
* [DF6.1: Creating an individual assessment](trust-enabling-capacity-exchange-df6-1.md) - Implements DP6.
* [DF6.2: Distributing information relevant to the assessment](trust-enabling-capacity-exchange-df6-2.md) - Implements DP6.

## Developing Blockchain-enabled Marketplace Interfaces: A Design Science Research Study

Source: [bemi-marketplace-interfaces](../papers/bemi-marketplace-interfaces.md)

* [Meta-requirement MR1: Balance simplicity and trustworthiness](bemi-marketplace-interfaces-mr1.md) - BEMI interfaces must balance simplicity and trustworthiness, ensuring usability for both tech-savvy and non-tech-savvy individuals despite the interface's overall technical complexity.
* [Meta-requirement MR2: Provide audience-specific documentation](bemi-marketplace-interfaces-mr2.md) - BEMIs should support users' learning by providing concise and audience-specific explanations of complex concepts.
* [Meta-requirement MR3: Ensure user-centric identity management](bemi-marketplace-interfaces-mr3.md) - Identities in a BEMI should be designed for interoperability, and be easily accessible and manageable by users across different platforms.
* [Meta-requirement MR4: Fit transparent and interoperable reputation](bemi-marketplace-interfaces-mr4.md) - A fair, transparent and interoperable reputation system should be implemented, differentiating between actor-specific trust and trust in marketplace processes.
* [Meta-requirement MR5: Set up adjustable visualizations](bemi-marketplace-interfaces-mr5.md) - Complex and multidimensional concepts should be operationally divided into smaller parts with adjustable visualizations, allowing users to start with one particular perspective and successively take additional perspectives into account.
* [Meta-requirement MR6: Offer product and status representation](bemi-marketplace-interfaces-mr6.md) - BEMIs should allow for consistent graphical representation of service operations (i.e., orders) and available hardware resources (i.e., 3D printers).
* [Meta-requirement MR7: Implement input validation](bemi-marketplace-interfaces-mr7.md) - Functions should be implemented that instantly validate inputs and alert users to any errors.
* [Meta-requirement MR8: Foster selective data transmission](bemi-marketplace-interfaces-mr8.md) - BEMIs must incorporate functionalities that allow for selective data transmission to provide a secure and trustworthy environment while safeguarding the privacy and confidentiality of sensitive information.
* [Meta-requirement MR9: Enable customized dashboards](bemi-marketplace-interfaces-mr9.md) - BEMIs must provide tabular overviews of all user-specific information in dashboards that must be specialized to supply-side and demand-side market participants.
* [Meta-requirement MR10: Allow for domain-specific information](bemi-marketplace-interfaces-mr10.md) - BEMIs should implement two domain-specific functions: a direct communication channel between buyers and sellers, and the ability for demanders to reserve suppliers' manufacturing capacities.
* [Design principle DP1: Prioritize simplicity while balancing trustworthiness](bemi-marketplace-interfaces-dp1.md) - Design BEMIs that prioritize simplicity and intuitiveness while balancing trustworthiness and usability to ensure a user experience that resembles traditional marketplaces.
* [Design principle DP2: Support learning and engagement via documentation](bemi-marketplace-interfaces-dp2.md) - Design BEMIs that support users' learning and engagement by providing comprehensive documentation to foster trust by transparency and stimulate innovation in decentralized communities.
* [Design principle DP3: Interoperable identity and reputation infrastructure](bemi-marketplace-interfaces-dp3.md) - Design BEMIs with an interoperable identity management and reputation infrastructure to increase trust between transaction partners and enable user empowerment with sovereign authentication methods.
* [Design principle DP4: Domain-specific graphical representations](bemi-marketplace-interfaces-dp4.md) - Design BEMIs with graphical representations and functions for CAM-specific perspectives so that users can seamlessly navigate multidimensionality and incorporate stakeholders' points of view.
* [Design principle DP5: Real-time plausibility checks and time-limited corrections](bemi-marketplace-interfaces-dp5.md) - Design BEMIs with real-time input plausibility checks to reduce the risk of errors and allow for time-limited corrections, given the irreversibility of finalized transactions.
* [Design principle DP6: External storage connectivity for privacy and scalability](bemi-marketplace-interfaces-dp6.md) - Design BEMIs with external storage connectivity to mitigate blockchain scalability issues and enable privacy-preserving data storage.
* [Design principle DP7: User-specific dashboards for customized KPI reporting](bemi-marketplace-interfaces-dp7.md) - Design BEMIs with user-specific dashboards that enable customized information and reports on essential KPIs across variable levels of granularity.
* [Design principle DP8: Industry-specific processes for actionable decision-making](bemi-marketplace-interfaces-dp8.md) - Design BEMIs that reflect industry-specific processes to guide users with actionable insights that facilitate decision making.
* [Design feature DF1: Landing page](bemi-marketplace-interfaces-df1.md) - A landing page that serves as the artifact's central point of contact, presenting system values, terms of use and a help center.
* [Design feature DF2: Clickable icons for interface customization](bemi-marketplace-interfaces-df2.md) - Clickable icons that allow interface customization such as language selection and settings.
* [Design feature DF3: Technical documentation and whitepapers](bemi-marketplace-interfaces-df3.md) - Access to technical documentation and whitepapers to promote transparency and support user learning.
* [Design feature DF4: Community engagement (DAO / SDK)](bemi-marketplace-interfaces-df4.md) - Community-engagement mechanisms letting users participate in governance via a DAO, build their own marketplace via an SDK, or join a Discord community.
* [Design feature DF5: Connect Wallet / SSI identity](bemi-marketplace-interfaces-df5.md) - A 'Connect Wallet' function integrating interoperable identity management through Self-Sovereign Identity wallets.
* [Design feature DF6: Reputation mechanisms](bemi-marketplace-interfaces-df6.md) - Reputation mechanisms integrated to build trust between participants in the decentralized marketplace.
* [Design feature DF7: Role-specific dashboards](bemi-marketplace-interfaces-df7.md) - Customizable supplier and demand dashboards connecting the marketplace backend and blockchain ecosystem to provide customized information.
* [Design feature DF8: Interactive dashboard features](bemi-marketplace-interfaces-df8.md) - Interactive dashboard features such as drilldown and filters.
* [Design feature DF9: Visual dashboard features](bemi-marketplace-interfaces-df9.md) - Visual dashboard features such as diagrams and images.
* [Design feature DF10: Error notification](bemi-marketplace-interfaces-df10.md) - An error-notification feature that informs users of possible errors in their interactions (e.g., null filter entities or invalid input values).
* [Design feature DF11: Process execution validation](bemi-marketplace-interfaces-df11.md) - A process-execution validation/confirmation feature (pop-up) ensuring users confirm actions, given the irreversibility of blockchain transactions.
* [Design feature DF12: Peer-to-peer database linking (IPFS)](bemi-marketplace-interfaces-df12.md) - Peer-to-peer database linking (e.g., IPFS) to integrate large data externally without compromising the security and scalability of the system.
* [Design feature DF13: Customized and trusted view](bemi-marketplace-interfaces-df13.md) - A customized and trusted dashboard view giving users a tailored, trustworthy overview of the marketplace.
* [Design feature DF14: Transaction history](bemi-marketplace-interfaces-df14.md) - Transaction-history information within dashboards (e.g., saved searches, recent transactions and reviews, and order-progress indicators).
* [Design feature DF15: Direct communication ('Contact')](bemi-marketplace-interfaces-df15.md) - A direct-communication feature (the 'Contact' button) enabling an off-chain communication channel between transaction partners.
* [Design feature DF16: Reserve capacity](bemi-marketplace-interfaces-df16.md) - A 'Reserve' button letting users reserve available capacity in the marketplace.

## Digging for Quality Management in Production Systems: A Solution Space for Blockchain Collaborations

Source: [quality-management-production](../papers/quality-management-production.md)

* [Design principle DP1: Standardized representation of traceability objects](quality-management-production-dp1.md) - Provide a standardized representation of traceability objects through a hybrid, token-based traceability system, with organizations collaboratively determining necessary dimensions before developin...
* [Design principle DP2: Extended quality control over communication and objects](quality-management-production-dp2.md) - Provide information about direct and indirect objects to give extended quality control over communication processes, affected objects, and involved quality trading partners.
* [Design principle DP3: Import objects from traditional information systems](quality-management-production-dp3.md) - Enable the system to import objects from traditional information systems (and export unique token identifiers) to fully utilize blockchain as a leading information system for identifiers in supply...
* [Design principle DP4: Standardized token events](quality-management-production-dp4.md) - Allow the definition of standardized events to achieve a syntactic and semantic standard for token events.
* [Design principle DP5: Easy integration without enterprise-system modification](quality-management-production-dp5.md) - Provide a unique-system-identifier application that can be integrated with a network or token standard easily, without having to modify one's enterprise system at great expense.
* [Design principle DP6: Confidentiality of available information](quality-management-production-dp6.md) - Ensure that available information addresses confidentiality concerns to protect identity recognition against external parties.

## From ambivalence to trust: Using blockchain in customer loyalty programs

Source: [ambivalence-trust-loyalty](../papers/ambivalence-trust-loyalty.md)

* [Design objective DO1: Accountability](ambivalence-trust-loyalty-do1.md) - Provide tamper-proof and easily accessible storage of data in the blockchain network, displayed in a readily accessible and verifiable way, together with tamper-proof and automated data processing.
* [Design objective DO2: Customizability](ambivalence-trust-loyalty-do2.md) - Let customers set rules for their smart appliances based on generation and consumption data so that electricity consumption aligns with their sustainability preferences.
* [Design objective DO3: Simplicity](ambivalence-trust-loyalty-do3.md) - Provide an intuitive user interface so customers, who vary in digital literacy, do not have to deal with the technical details of blockchain technology.
* [Design objective DO4: Efficiency](ambivalence-trust-loyalty-do4.md) - Enable seamless, reliable and scalable information exchange between electricity supplier and customer, minimizing blockchain data processing to retain high uptime and availability.
* [Design objective DO5: Maintainability](ambivalence-trust-loyalty-do5.md) - Enable the architecture to connect to different legacy systems, with connection uptime easy to monitor by IT administrator staff, and make Nexo Energy easy to order.
* [Design objective DO6: Affordability](ambivalence-trust-loyalty-do6.md) - Keep participation in the blockchain-based loyalty program affordable for customers, keeping additional-service and hardware costs (e.g., low-cost local controllers) reasonable.
* [Design requirement DR1: Tamper-proof and easily accessible storage of data in the blockchain network](ambivalence-trust-loyalty-dr1.md) - Tamper-proof and easily accessible storage of data in the blockchain network, displayed in a readily accessible and verifiable way.
* [Design requirement DR2: Tamper-proof and automated data processing](ambivalence-trust-loyalty-dr2.md) - Tamper-proof and automated data processing, for instance via smart contracts.
* [Design requirement DR3: Secure storage of electricity generation data](ambivalence-trust-loyalty-dr3.md) - Secure storage of electricity generation data in the blockchain network.
* [Design requirement DR4: Secure storage of electricity consumption data](ambivalence-trust-loyalty-dr4.md) - Secure storage of electricity consumption data in the blockchain network.
* [Design requirement DR5: Intuitive and comprehensive adjustment of electricity consumption](ambivalence-trust-loyalty-dr5.md) - Intuitive and comprehensive adjustment of electricity consumption, depending on the share of renewable or green electricity in the grid.
* [Design requirement DR6: Deliver all information for setup process](ambivalence-trust-loyalty-dr6.md) - Deliver all information for the setup process, should setup be done without a technician.
* [Design requirement DR7: Automatic smart device detection](ambivalence-trust-loyalty-dr7.md) - Automatic smart device detection, to ease the setup process for customers.
* [Design requirement DR8: Intuitive user interface](ambivalence-trust-loyalty-dr8.md) - An intuitive user interface so users need not deal with the technical details of blockchain technology.
* [Design requirement DR9: Fast data synchronization between software components](ambivalence-trust-loyalty-dr9.md) - Fast data synchronization between software components.
* [Design requirement DR10: High software uptime and availability](ambivalence-trust-loyalty-dr10.md) - High software uptime and availability, minimizing blockchain data processing.
* [Design requirement DR11: Easy to monitor by IT administrator staff](ambivalence-trust-loyalty-dr11.md) - The uptime of the connection to legacy systems should be easy to monitor by IT administrator staff.
* [Design requirement DR12: Easy to order for customers](ambivalence-trust-loyalty-dr12.md) - Nexo Energy should integrate existing GETs and make it easy to order for customers.
* [Design requirement DR13: Affordable for customers](ambivalence-trust-loyalty-dr13.md) - Participation in a blockchain-based customer loyalty program should remain affordable for customers.
* [Design requirement DR14: Reasonable costs for operation](ambivalence-trust-loyalty-dr14.md) - Electricity suppliers should ensure reasonable costs for operation before implementation.
* [Design principle DP1: Give customers agency](ambivalence-trust-loyalty-dp1.md) - Customer loyalty programs should leave room for customers to shape their own portfolio of desired services and functions, giving customers a real sense of choice and agency.
* [Design principle DP2: Provide customers with sufficient and verifiable information](ambivalence-trust-loyalty-dp2.md) - Customer loyalty programs should proactively ensure that customers can access all required information in an easily verifiable manner.
* [Design principle DP3: Consider appropriate levels of usability for customers](ambivalence-trust-loyalty-dp3.md) - Customer loyalty programs should provide different levels of didactical reduction while retaining the basic message, rather than proactively reducing access to granular information.
* [Design principle DP4: Give data access to customers](ambivalence-trust-loyalty-dp4.md) - Customer loyalty programs promise the greatest success if they include an option for customers to be granted access to all relevant and verifiable data.

## From Dissonance to Dialogue: A Token-Based Approach to Bridge the Gap Between Manufacturers and Customers

Source: [dissonance-dialogue-recall](../papers/dissonance-dialogue-recall.md)

* [Design requirement DR1: Straightforward ERP mapping with essential on-chain data](dissonance-dialogue-recall-dr1.md) - The enterprise systems should be mapped straightforwardly, and only essential recall-communication data must be stored in the blockchain.
* [Design requirement DR2: Complete recall traceability path](dissonance-dialogue-recall-dr2.md) - The system should provide an entire recall traceability path to ensure synchronized communications between multiple organizations.
* [Design requirement DR3: Intuitive product- and health-state communication](dissonance-dialogue-recall-dr3.md) - The system should allow intuitive communication of product- and customer-health states.
* [Design requirement DR4: Interoperability with permissionless blockchain](dissonance-dialogue-recall-dr4.md) - The system should allow interoperability between enterprise systems and permissionless blockchain.
* [Design requirement DR5: Co-value creation with private customers](dissonance-dialogue-recall-dr5.md) - The system should allow co-value creation procedures between manufacturers and private customers.
* [Design principle DP1: ERP integration by extending data models](dissonance-dialogue-recall-dp1.md) - Integrate any ERP system by extending existing data models of required blockchain objects and recall tracing, promoting seamless communication between ERP and blockchain systems.
* [Design principle DP2: Multi-enterprise capture and historical owner analysis](dissonance-dialogue-recall-dp2.md) - Capture multiple enterprise systems and analyze historical owners using blockchain-ERP integration and recall tracing, fostering cross-organizational collaboration in recall processes.
* [Design principle DP3: Traceability with customer notifications](dissonance-dialogue-recall-dp3.md) - Enable traceability functions with customer wallet notifications and backward and forward ownership tracing to ensure synchronized communication for all related owners.
* [Design principle DP4: Interoperability across EVM-supported applications](dissonance-dialogue-recall-dp4.md) - Provide interoperability between EVM-supported software applications using recall tracing across organizational borders.
* [Design principle DP5: Customer participation in recall information](dissonance-dialogue-recall-dp5.md) - Implement mechanisms that allow customers to receive recall information and announce product defects, promoting active customer participation.
* [Design principle DP6: Co-value creation between manufacturers and customers](dissonance-dialogue-recall-dp6.md) - Foster co-value creation procedures between manufacturers and customers using inter-organizational data storage, product-defect announcements, recall-state management and ownership tracing.
* [Design feature DF1: Customer wallet notification for recall states](dissonance-dialogue-recall-df1.md) - Customers log in with an Ethereum wallet and receive notifications about recall states of products they own.
* [Design feature DF2: BC-ERP integration through objects](dissonance-dialogue-recall-df2.md) - Integration of enterprise systems with the blockchain through objects (TokenID, contract address, From/To owner, system) recorded in a movement table.
* [Design feature DF3: Recall tracing and product-state extension of the token](dissonance-dialogue-recall-df3.md) - A standard token interface that traces recalls and extends the product state as the token moves between organizations and customers.
* [Design feature DF4: Interorganizational BC-based data storage](dissonance-dialogue-recall-df4.md) - Inter-organizational blockchain-based data storage shared between manufacturers and customers.
* [Design feature DF5: Customer product-defect announcement](dissonance-dialogue-recall-df5.md) - A feature allowing customers to announce product defects and voluntarily report their health state.
* [Design feature DF6: Manufacturer product-defect announcement](dissonance-dialogue-recall-df6.md) - A feature allowing manufacturers to announce a defective product, initiating a forward recall that notifies all customers holding the token.
* [Design feature DF7: Manufacturer recall-state management](dissonance-dialogue-recall-df7.md) - A feature by which manufacturers set and manage recall states (e.g., 'Checked NOT OK') for affected products.
* [Design feature DF8: Backward and forward ownership tracing](dissonance-dialogue-recall-df8.md) - Smart-contract token-ownership tracing history enabling backward and forward tracing of previous manufacturers and owners for the recall process.

## How to Develop a GDPR-Compliant Blockchain Solution for Cross-Organizational Workflow Management: Evidence from the German Asylum Procedure

Source: [gdpr-workflow-asylum](../papers/gdpr-workflow-asylum.md)

* [Design principle DP1: Do not store personal data on a blockchain](gdpr-workflow-asylum-dp1.md) - Blockchain's paradigm of tamper-resistant storage jars profoundly with the right to rectification and erasure, so blockchain solution architects should keep personal data off-chain.
* [Design principle DP2: Use a highly secure off-chain mapping architecture for attribution](gdpr-workflow-asylum-dp2.md) - If a use case requires that data on the blockchain be attributable to a natural person, use a highly secure off-chain mapping architecture.

## Know-Your-Customer (KYC) Requirements for Initial Coin Offerings: Toward Designing a Compliant-by-Design KYC-System Based on Blockchain Technology

Source: [kyc-ico-requirements](../papers/kyc-ico-requirements.md)

* [Design objective DO1: Verified identity from German authorities](kyc-ico-requirements-do1.md) - Within the KYC-system, the initial recording of identity data must base on information that originates from a person's identity card that is demonstrably verified by German authorities.
* [Design objective DO2: eIDAS-compliant identity verification scheme](kyc-ico-requirements-do2.md) - To ensure that all necessary identity data are collected, the KYC-system must be linked to an eIDAS compliant identity verification scheme.
* [Design objective DO3: Source-of-funds field for high-value transactions](kyc-ico-requirements-do3.md) - An investor who transfers more than a pre-defined limit needs to fill in an additional data field during the KYC-process stating information on the source of funds.
* [Design objective DO4: Five-year storage of transaction data](kyc-ico-requirements-do4.md) - Data on business relationships and transactions must be stored at least five years on the local database of one of the contracting parties or on the blockchain.
* [Design objective DO5: Correction of inaccurate data](kyc-ico-requirements-do5.md) - An ICO investor must have the opportunity to ask for the correction of inaccurate data.
* [Design objective DO6: Erasure of personal data after storage obligation](kyc-ico-requirements-do6.md) - An ICO investor must have the opportunity to ask the KYC-provider and emitter to delete any records of investment progress once the five-year storage obligation is over.
* [Design objective DO7: Prevent transaction flow analysis](kyc-ico-requirements-do7.md) - The KYC-system must prevent transaction flow analysis through proper technical and non-technical solutions.
* [Design objective DO8: KYC-process status updates](kyc-ico-requirements-do8.md) - The KYC-system must provide status updates of the KYC-process available for the investor.
* [Design objective DO9: Web-interface key management](kyc-ico-requirements-do9.md) - The KYC-system should allow key management facilitated via a web interface; proper incentives for investors need to be set.
* [Design objective DO10: Decentralized public blockchain for fast KYC access](kyc-ico-requirements-do10.md) - The KYC-process should run on a decentralized, public blockchain solution, which allows parties involved in the ICO to access the results of the KYC-process as fast as possible.

## Meta-requirements for the Design of a Blockchain-enabled Multi-sided Platform for Sustainability and Circular Economy

Source: [msp-sustainability-circular](../papers/msp-sustainability-circular.md)

* [Meta-requirement MR1: Provenance and traceability](msp-sustainability-circular-mr1.md) - The platform should enable provenance and traceability, allowing stakeholders to track and verify product origins and a product's sustainable attributes.
* [Meta-requirement MR2: Smart contracts](msp-sustainability-circular-mr2.md) - The platform should use smart contracts to automate processes and enforce sustainability requirements (e.g., rewarding actors who adhere to emission agreements).
* [Meta-requirement MR3: Tokenization](msp-sustainability-circular-mr3.md) - The platform should support tokenization (e.g., certifications and carbon-credit-style tokens) that can be shared in a tamper-proof fashion, bolstering confidence and avoiding greenwashing.
* [Meta-requirement MR4: Data integrity, transparency, and immutability](msp-sustainability-circular-mr4.md) - The platform should ensure data integrity, transparency and immutability so that only authorized actors can record data, enhancing the integrity of information for all.
* [Meta-requirement MR5: Data and information sharing](msp-sustainability-circular-mr5.md) - The platform's decentralized design should enable data and information sharing in a transparent fashion across sectors, fostering collaboration and trust.
* [Meta-requirement MR6: Resource efficiency](msp-sustainability-circular-mr6.md) - The platform should promote resource efficiency, e.g., through smart contracts and tokenization that streamline transactions and require fewer intermediaries and resources to monitor sustainable be...

## Overcoming the Data Transparency Trade-Off: Designing a Blockchain-Based Delivery Invoice System for the Construction Industry

Source: [delivery-invoice-transparency](../papers/delivery-invoice-transparency.md)

* [Design objective DO1: Secure data exchange](delivery-invoice-transparency-do1.md) - Ensure fundamentally secure data exchange within a decentralized infrastructure, focusing on the data-protection goals of confidentiality, integrity, availability and authenticity for delivery invoices.
* [Design objective DO2: Collaboration](delivery-invoice-transparency-do2.md) - Support the collaboration aspect of coopetition, using network effects (e.g., Hyperledger Fabric) to enhance the overall construction planning process between participants.
* [Design objective DO3: Competition](delivery-invoice-transparency-do3.md) - Account for the competition aspect of coopetition, using decentralized networks and access controls so that security, trust and transparency are strengthened without exposing competitively sensitive information.
* [Design principle DP1: Implement a decentralized solution when network effects outweigh complexity](delivery-invoice-transparency-dp1.md) - Implement a decentralized solution when the advantages of network effects in a coopetitive market outweigh the challenges of implementing such a complex solution.
* [Design principle DP2: Implement private data collections and private channels](delivery-invoice-transparency-dp2.md) - Implement private data collections and private channels to safeguard inter-organizational data exchange processes from being disclosed to unauthorized third parties.
* [Design principle DP3: Augment private data collections with additional privacy-preserving technologies](delivery-invoice-transparency-dp3.md) - To ensure complete confidentiality of data, it is necessary to augment private data collections and channels with additional privacy-preserving technologies.

## Requirements and Design Principles for Blockchain-enabled Matchmaking-Marketplaces in Additive Manufacturing

Source: [matchmaking-additive-manufacturing](../papers/matchmaking-additive-manufacturing.md)

* [Meta-requirement MR1: ID Attributes](matchmaking-additive-manufacturing-mr1.md) - BEM agents require digital identities (IDs), including company IDs, 3D printer machine IDs, and product IDs, to interact with each other and be identifiable.
* [Meta-requirement MR2: ID Features](matchmaking-additive-manufacturing-mr2.md) - BEM identities require features to describe actors: the ability to map affiliation and hierarchy constructs, distinctive levels of stakeholder anonymity, and rule-based access for independent third parties to trace relationships.
* [Meta-requirement MR3: Data Security & Integrity](matchmaking-additive-manufacturing-mr3.md) - Data exchange in BEMs requires user sovereignty and tamper-free exchange, storing only the necessary minimum of sensitive business data on-chain as a persistent trust anchor.
* [Meta-requirement MR4: Data Traceability](matchmaking-additive-manufacturing-mr4.md) - BEMs require ex-post transparency: production parameters must be documented persistently and be accessible to authorized actors for quality assurance.
* [Meta-requirement MR5: Supply Side Information](matchmaking-additive-manufacturing-mr5.md) - The supply side must provide information about production and material parameters, certificates, and their capability, capacity and bids.
* [Meta-requirement MR6: Demand Side Information](matchmaking-additive-manufacturing-mr6.md) - The demand side must specify its request via product and production specification and an indication of its willingness to pay.
* [Meta-requirement MR7: User Interface](matchmaking-additive-manufacturing-mr7.md) - BEMs require customizable filtering options and both a machine-to-machine (M2M) and a human-machine (HMI) interface.
* [Meta-requirement MR8: Reputation System](matchmaking-additive-manufacturing-mr8.md) - BEMs require a reputation system covering company metrics, printer ratings, and individual preference prioritization.
* [Meta-requirement MR9: Supply & Demand Matchmaking](matchmaking-additive-manufacturing-mr9.md) - Supply and demand matchmaking must preserve process anonymity, not disclosing sensitive data until the matchmaking process is complete, and be semi-automatic.
* [Meta-requirement MR10: Transaction Agreement](matchmaking-additive-manufacturing-mr10.md) - BEMs require hybrid pricing and negotiation mechanisms to reach a transaction agreement in the matchmaking process.
* [Meta-requirement MR11: Terms & Conditions](matchmaking-additive-manufacturing-mr11.md) - BEMs must ensure automated execution of terms and conditions via smart contracts and support dual incentives and payments, using both cryptographic tokens and fiat currencies.
* [Meta-requirement MR12: Governance](matchmaking-additive-manufacturing-mr12.md) - BEM governance must be shaped openly and transparently, balancing cooperation and competition among stakeholders, and ensuring interoperability with other marketplaces.
* [Design principle DP1: Sovereign, pseudonymous IDs](matchmaking-additive-manufacturing-dp1.md) - Design BEMs that allow each actor to manage their sovereign and pseudonymous IDs.
* [Design principle DP2: Sovereign credential wallets](matchmaking-additive-manufacturing-dp2.md) - Design BEMs that support sovereign wallets that may hold certificates and other ID credentials to qualitatively and quantitatively describe actors.
* [Design principle DP3: Minimal on-chain sensitive data](matchmaking-additive-manufacturing-dp3.md) - Design BEMs to prevent unauthorized access to sensitive business data and store only a necessary minimum as a persistent blockchain trust anchor.
* [Design principle DP4: Persistent manufacturing-data logging](matchmaking-additive-manufacturing-dp4.md) - Design BEMs that require manufacturers to persistently log manufacturing data for ex-post transparency and quality assurance.
* [Design principle DP5: Supplier service-offering information](matchmaking-additive-manufacturing-dp5.md) - Design BEMs that require manufacturers to provide information about their service offerings and specify their individual preferences.
* [Design principle DP6: Consumer service-request specification](matchmaking-additive-manufacturing-dp6.md) - Design BEMs that enable consumers to specify their service requests via customizable functionalities and filter options.
* [Design principle DP7: Ambidextrous interfaces with data screening](matchmaking-additive-manufacturing-dp7.md) - Design BEMs with ambidextrous user interfaces (manual HMI and automated M2M) and functionality to screen marketplace data.
* [Design principle DP8: Preference-filterable reputation system](matchmaking-additive-manufacturing-dp8.md) - Design BEMs with a reputation system where consumers can filter different criteria according to their individual preferences.
* [Design principle DP9: Demand-driven semi-automated matchmaking](matchmaking-additive-manufacturing-dp9.md) - Design BEMs as demand-driven marketplaces with semi-automated matchmaking functions where consumers receive suggestions for matching producers and select the final producer based on their preferences without disclosing sensitive data.
* [Design principle DP10: Hybrid pricing and negotiation](matchmaking-additive-manufacturing-dp10.md) - Design agreements in BEMs as hybrid systems that support individual pricing and negotiation.
* [Design principle DP11: Automated contract execution with hybrid payments](matchmaking-additive-manufacturing-dp11.md) - Design BEMs that allow for automated contract execution with cryptographic token incentives and payment options using fiat currencies.
* [Design principle DP12: Interoperability and consortial standards](matchmaking-additive-manufacturing-dp12.md) - Design BEMs to support interoperability and free market access to those who follow consortially defined standards and rules.

## Striking a balance: Designing a blockchain-based solution to navigate coopetition dynamics in supply chain management

Source: [striking-balance-coopetition](../papers/striking-balance-coopetition.md)

* [Design objective DO1: Data protection](striking-balance-coopetition-do1.md) - Protect data against internal and external attackers; sensitive business data and personal data must be protected from access by unauthorized third parties.
* [Design objective DO2: Accountability](striking-balance-coopetition-do2.md) - Ensure organizations are identifiable in the network to enable accountability.
* [Design objective DO3: Decentralization](striking-balance-coopetition-do3.md) - Provide a decentralized solution to prevent monopolistic market dependencies.
* [Design objective DO4: Performance](striking-balance-coopetition-do4.md) - Enable the system to handle many transactions fast.
* [Design objective DO5: Interoperability](striking-balance-coopetition-do5.md) - Make the solution integrable and interoperable with existing systems to accomplish true cooperation.
* [Design objective DO6: Traceability](striking-balance-coopetition-do6.md) - Provide product information at any time to enforce process automation through traceability.
* [Design objective DO7: Transparency](striking-balance-coopetition-do7.md) - Provide transparency to achieve the benefits of cooperation and information sharing.
* [Design objective DO8: Automation](striking-balance-coopetition-do8.md) - Boost process efficiency by enforcing automation.
* [Design principle DP1: Adopt decentralization when network effects outweigh implementation complexity](striking-balance-coopetition-dp1.md) - Opt for a decentralized solution when the benefits of leveraging network effects in a coopetitive market surpass the complexities and challenges of its implementation.
* [Design principle DP2: Use private data collections and channels for inter-organizational data protection](striking-balance-coopetition-dp2.md) - Utilize private data collections and private channels to protect inter-organizational data exchanges from unauthorized third-party access.
* [Design principle DP3: Layer privacy-enhancing technologies onto private channels for complete confidentiality](striking-balance-coopetition-dp3.md) - Enhance private data collections and channels with additional privacy-preserving technologies to ensure complete data confidentiality.

## Trading Green Bonds Using Distributed Ledger Technology

Source: [trading-green-bonds-dlt](../papers/trading-green-bonds-dlt.md)

* [Design requirement REQ1: Manage states of contracts](trading-green-bonds-dlt-req1.md) - Manage states of contracts across the securities' lifecycle.
* [Design requirement REQ2: Identify and verify users](trading-green-bonds-dlt-req2.md) - Identify and verify that users are authorized for their roles.
* [Design requirement REQ3: Maintain ownership](trading-green-bonds-dlt-req3.md) - Maintain ownership of securities.
* [Design requirement REQ4: Guarantee ACID transaction execution](trading-green-bonds-dlt-req4.md) - Guarantee atomic, consistent, isolated, and durable (ACID) execution of compound transactions, specifically delivery versus payment.
* [Design requirement REQ5: Enforce correct attribution and non-repudiability](trading-green-bonds-dlt-req5.md) - Enforce correct attribution and non-repudiability of actions (using digital signatures and cryptographic commitments).
* [Design requirement REQ6: Interoperability with external systems](trading-green-bonds-dlt-req6.md) - Interoperability with external systems.
* [Design requirement REQ7: Settlement finality](trading-green-bonds-dlt-req7.md) - Settlement finality: the determination of a definite time after which the transfer of legal title (ownership) is irrevocable.
* [Design requirement REQ8: Support high-frequency-data instruments](trading-green-bonds-dlt-req8.md) - Support for new financial instruments with high-frequency data dependencies (e.g., carbon emission monitoring data).
* [Design requirement REQ9: DLTR compliance with reasoned exemptions](trading-green-bonds-dlt-req9.md) - DLTR compliance with well-reasoned exemptions from existing regulations written for traditional centralized systems.
* [Design requirement REQ10: Interoperability with legacy and DLT settlement systems](trading-green-bonds-dlt-req10.md) - Interoperability with legacy private and central banking as well as private, permissioned, and permissionless DLT/blockchain and other clearing and settlement systems.
* [Design requirement REQ11: Full regulator access for automated supervision](trading-green-bonds-dlt-req11.md) - Support for full access by the financial supervisor/regulator to maximize automated supervision.
* [Design requirement REQ12: Full transparency and traceability of verification data](trading-green-bonds-dlt-req12.md) - Full transparency and traceability of underlying verification data throughout carbon credit and advanced instruments' lifecycle.
* [Design requirement REQ13: Efficient high-volume trading with real-time monitoring](trading-green-bonds-dlt-req13.md) - Efficient high-volume trading processing, instantaneous settlement (execution) of trades, real-time monitoring, and advanced market abuse detection.
* [Design requirement REQ14: Catalyze structured finance via a domain-specific language](trading-green-bonds-dlt-req14.md) - Ability to catalyze structured finance by domain-specific language for specifying new instruments and immediately issuing them.

## Unchaining Social Businesses - Blockchain as the Basic Technology of a Crowdlending Platform

Source: [unchaining-social-crowdlending](../papers/unchaining-social-crowdlending.md)

* [Design objective DO1: Financial sustainability](unchaining-social-crowdlending-do1.md) - Since the social business is not based on donations, it must support the recovery of costs (Yunus et al. 2010). Thus, a balanced profit equation between cost and revenue is needed (Boons and Lüdeke-Freund 2013).
* [Design objective DO2: Social purpose](unchaining-social-crowdlending-do2.md) - Social businesses act as a change agent for the world and pursue the creation of social benefits (Yunus et al. 2010).
* [Design objective DO3: Allow small amount investments](unchaining-social-crowdlending-do3.md) - The crowdlending platform needs to allow the investment of small financial amounts (Lins et al. 2016).
* [Design objective DO4: Provide editable information about funding projects](unchaining-social-crowdlending-do4.md) - The crowdlending platform needs to provide details about projects in search for funding, as information is seen as a crucial factor of the funding success (Lins et al. 2016; Overby et al. 2010).
* [Design objective DO5: Provide mechanism to establish and measure user reputation](unchaining-social-crowdlending-do5.md) - To address the market design parameter of user reputation the platform needs to provide a feedback function, enabling that a user can provide insights about their experience with a specific user after a transaction (Cabral; McDonald and Slawson 2002).
* [Design objective DO6: Define and enforce platform rules](unchaining-social-crowdlending-do6.md) - The platform needs to be designed to act according to predefined rules (Agrawal et al. 2014).
* [Design objective DO7: Crowd due diligence](unchaining-social-crowdlending-do7.md) - Research studies on the crowdfunding platform Kickstarter suggest that a greater number of perspectives available to recognize something amiss are a useful tool to detect fraud (Agrawal et al. 2014).
* [Design objective DO8: Provision point mechanism](unchaining-social-crowdlending-do8.md) - The provision point mechanism is a common practice in crowdlending platforms to address the free-rider problem (Agrawal et al. 2014).
* [Design objective DO9: Provide reporting functions](unchaining-social-crowdlending-do9.md) - For regularly reporting and statistics on the social business development, the prototype must provide the functionality to run reports on the transactions of a specific period.
* [Design objective DO10: Transaction time](unchaining-social-crowdlending-do10.md) - As soon as the funding limit is reached, the subsequent transactions should be executed for student projects to start.
* [Design objective DO11: Data persistency](unchaining-social-crowdlending-do11.md) - To ensure transparency, traceability, and archiving requirements, the prototype needs to store data persistently and immutably.
* [Design objective DO12: Transaction volume](unchaining-social-crowdlending-do12.md) - Currently, the volume of funded projects is fairly low; thus, the number of transactions should be manageable without constraints.
* [Design objective DO13: Trust and personal identification](unchaining-social-crowdlending-do13.md) - Trust and personal identification mechanisms should be seamless and should not represent an entry barrier for potential users.
* [Design objective DO14: Reduction of manual activities](unchaining-social-crowdlending-do14.md) - The manual activities involved in the processing of the transactions and the management of project lifecycles should be further automated to reduce costs and the possibilities of fraud.
* [Design objective DO15: Reliable and trustworthy transaction processing](unchaining-social-crowdlending-do15.md) - To avoid malicious changes of funding related data, the prototype must be able to process transactions in a reliable and trusted way.
* [Design objective DO16: Stability of credit currency](unchaining-social-crowdlending-do16.md) - To ensure a stable and calculable payback amount, the credit currencies should not be subject to high fluctuations.
* [Design objective DO17: Avoidance of complex interfaces](unchaining-social-crowdlending-do17.md) - To reduce the implementation efforts and system maintenance, and to increase independence from legacy applications, the prototype must be developed in a way that avoids complex interfaces.

## Using Blockchain to Sustainably Manage Containers in International Shipping

Source: [containers-shipping-sustainable](../papers/containers-shipping-sustainable.md)

* [Design principle DP1: Define incentives explicitly](containers-shipping-sustainable-dp1.md) - Explicitly define a structure of incentives for interorganizational and cross-industrial blockchain applications where stakeholders' interests are not necessarily aligned.
* [Design principle DP2: Address environmental sustainability](containers-shipping-sustainable-dp2.md) - Consider environmental sustainability as a non-functional requirement in the development of a blockchain artefact.

## Yes, I Do: Marrying Blockchain Applications with GDPR

Source: [yes-i-do-gdpr](../papers/yes-i-do-gdpr.md)

* [Design principle DP1: Acknowledge GDPR compliance by design](yes-i-do-gdpr-dp1.md) - Consider the requirements of the GDPR throughout the whole development cycle of the blockchain application.
* [Design principle DP2: Use state-of-the-art cryptography](yes-i-do-gdpr-dp2.md) - Always use the latest but established cryptographic techniques for hiding personal data.
* [Design principle DP3: Differentiate aims of data processing](yes-i-do-gdpr-dp3.md) - Differentiate the aims of data processing, since different anonymization techniques allow proving data integrity or computational integrity.
* [Design principle DP4: Review all relevant laws](yes-i-do-gdpr-dp4.md) - Do not only evaluate reconciliation with the GDPR but also further industry-specific laws.
