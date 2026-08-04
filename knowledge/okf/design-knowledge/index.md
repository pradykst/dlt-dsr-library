# Design knowledge

Atomic design-knowledge concepts extracted from the 34 papers. Each item is a design principle, requirement, meta-requirement, objective, goal, or design feature, and links back to its source paper (design features additionally link to the principles they implement). Grouped by source paper.

## Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules

Source: [aligning-newsvendors-scoring-rules](../papers/aligning-newsvendors-scoring-rules.md)

* [Design principle DP1: Decentralized, party-independent control of the escrow/payment](aligning-newsvendors-scoring-rules-dp1.md) - The contract and its escrow/payment mechanism should be governed in a decentralized manner so that it is controlled by neither the newsvendor nor the expert;
* [Design principle DP2: Enforceable and immutable algorithmic contracts](aligning-newsvendors-scoring-rules-dp2.md) - Contracts between the newsvendor and the expert should be defined as enforceable and immutable algorithms;

## An Architecture Using Payment Channel Networks for Blockchain-based Wi-Fi Sharing

Source: [wifi-sharing-payment-channels](../papers/wifi-sharing-payment-channels.md)

* [Design principle DP1: Host bandwidth management module](wifi-sharing-payment-channels-dp1.md) - Provide the system with a module for hosts to manage and organize the provided bandwidth in order for the system to provide access to the Internet.
* [Design principle DP2: Private-network module without shared secret keys](wifi-sharing-payment-channels-dp2.md) - Provide the system with a module for users to initiate and maintain a private network without sharing secret keys in order to prevent decoding of the connection.
* [Design principle DP3: Route users to their private network](wifi-sharing-payment-channels-dp3.md) - Provide the system with a module that provides only bandwidth to the user while users are routed to their private network even if their identity is known, in order to prevent users from conducting...
* [Design principle DP4: Restrict user access to the host's infrastructure](wifi-sharing-payment-channels-dp4.md) - Provide the system with a module to restrict user access to the host's private network infrastructure even if the user's identity is known, in order to prevent fraudulent actions.
* [Design principle DP5: Clear access-point identification](wifi-sharing-payment-channels-dp5.md) - Provide the system with a module to identify access points clearly in order to prevent security-related threats such as eavesdropping or DNS-server phishing.
* [Design principle DP6: Tamper-proof transaction history via trusted intermediary](wifi-sharing-payment-channels-dp6.md) - Provide the system with a mutually trusted intermediary requiring a transaction history that records a user's data traffic, resource consumption and incurred costs, in order to ensure that connecti...
* [Design principle DP7: Minimize transaction costs](wifi-sharing-payment-channels-dp7.md) - Provide the system with a module to keep transaction costs to a minimum in order to prevent large numbers of micro-payments.
* [Design principle DP8: Fee-free instant payments](wifi-sharing-payment-channels-dp8.md) - Provide the system with a module to forgo transaction costs for the execution of instant payments in order to regulate the duration of the connection.
* [Design principle DP9: Mutually agreed usage cost](wifi-sharing-payment-channels-dp9.md) - Provide the system with a module to set up the transaction in order to enable host and user to mutually agree on the usage cost.
* [Design principle DP10: Pre-payment mechanism](wifi-sharing-payment-channels-dp10.md) - Provide the system with a module for pre-payment in order to increase quality of service and prevent risks of overcharging and repudiation.
* [Design principle DP11: Dynamic trust-score accounting](wifi-sharing-payment-channels-dp11.md) - Provide the system with accounting mechanisms using a dynamic trust-score in order to facilitate cooperative host behavior and ensure high service levels by rewarding hosts for cooperation or high...
* [Design principle DP12: Platform-independent protocol](wifi-sharing-payment-channels-dp12.md) - Provide the system with a protocol that is platform-independent in order to avoid lock-in effects and facilitate user adoption and scalability.
* [Design principle DP13: Incremental bandwidth with instant payment](wifi-sharing-payment-channels-dp13.md) - Provide the system with a protocol that incrementally increases provided bandwidth together with instant payment functionalities that transfer outstanding payments immediately to unlock further res...
* [Design principle DP14: Multiple simultaneous connections and billing](wifi-sharing-payment-channels-dp14.md) - Provide the system with a protocol for users to initiate any number of connections and for hosts to simultaneously bill users with multiple connections, in order to ensure connections without the r...

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

* [Design principle DP1: Authorization-restricted consent visibility](consent-self-management-hie-dp1.md) - Only HIEs and providers with authorization can view a patient's consent status, maintaining confidentiality.
* [Design principle DP2: Patient-only consent changes](consent-self-management-hie-dp2.md) - Only the patient can change their consent status, supporting self-management and engendering patient trust.
* [Design principle DP3: Auditable consent history](consent-self-management-hie-dp3.md) - The history of consent transactions between patients and the HIE must be auditable so that compliance with consent laws can be verified for all transactions.
* [Design principle DP4: Cross-HIE consent communication without central authority](consent-self-management-hie-dp4.md) - HIEs should be able to communicate consent status across HIEs without a central authority, supporting interoperability.
* [Design principle DP5: Patient-driven cross-HIE consent updates](consent-self-management-hie-dp5.md) - Enable patients to share changes in their consent status across HIEs.

## Blockchain to Rule the Waves - Nascent Design Principles for Reducing Risk and Uncertainty in Decentralized Environments

Source: [rule-the-waves-shipping](../papers/rule-the-waves-shipping.md)

* [Design principle DP1: Digitization](rule-the-waves-shipping-dp1.md) - All data is stored and exchanged digitally, reducing the likelihood of data loss and enabling faster, more cost-effective information exchange as well as the use of blockchain technology.
* [Design principle DP2: Tamper-proof storage](rule-the-waves-shipping-dp2.md) - All changes made to the data stored in the system can be retraced, so that information cannot be lost and (together with user authentication) all changes can be traced to identifiable users.
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

* [Design principle DP1: Understandability](decentralized-procurement-logistics-dp1.md) - Adequately explain the smart-contract decision-making process (e.g., allocation computation outputs) to non-technical users in order to counter the black-box issue and encourage adoption.
* [Design principle DP2: Automation](decentralized-procurement-logistics-dp2.md) - Carry out the freight-transport procurement process in an end-to-end automated fashion, digitizing paper-based processes and delegating allocation to the blockchain.
* [Design principle DP3: Metrics privacy](decentralized-procurement-logistics-dp3.md) - Keep sensitive allocation metrics off-chain in competitive markets so that private data is not exposed while public allocation results remain verifiable.

## Design of a forgetting blockchain: A possible way to accomplish GDPR compatibility

Source: [forgetting-blockchain-gdpr](../papers/forgetting-blockchain-gdpr.md)

* [Design principle DP: Principles for designing data-protection-compliant (forgetting) blockchains](forgetting-blockchain-gdpr-dp.md) - The derived guidance for data-protection-compliant blockchains includes:

## Design Principles for Blockchain-based Applications in Green Bond Reporting

Source: [green-bond-reporting-dp](../papers/green-bond-reporting-dp.md)

* [Design principle DP1: Consortium blockchain](green-bond-reporting-dp-dp1.md) - Use a consortium blockchain, since a set of known, semi-trusted green-bond participants suits a permissioned setting.
* [Design principle DP2: Proof-of-authority consensus](green-bond-reporting-dp-dp2.md) - Use a proof-of-authority consensus mechanism, which is suitable because some level of trust already exists among participants.
* [Design principle DP3: Smart-contract document validation](green-bond-reporting-dp-dp3.md) - Use smart contracts to validate that an authorized party uploaded and signed the (reporting) file.
* [Design principle DP4: Reputation-based incentives](green-bond-reporting-dp-dp4.md) - Design for reputation rather than monetary incentives, given the conservative nature of the financial sector.
* [Design principle DP5: Off-chain decision-making](green-bond-reporting-dp-dp5.md) - Keep off-chain decisions taken by different stakeholders in their current format, while on-chain decisions are facilitated through smart contracts.
* [Design principle DP6: Role-based privileges](green-bond-reporting-dp-dp6.md) - Identify the issuer, second-opinion provider and investor as different roles with different privilege rights, such as access and editing rights.

## Designing a blockchain-based information system for procurement processes - Balancing decentralization, scalability, and security while maintaining privacy

Source: [procurement-is-trilemma](../papers/procurement-is-trilemma.md)

* [Design principle DP1: Balance decentralization, scalability and security](procurement-is-trilemma-dp1.md) - Balance decentralization, scalability and security by using a public chain as a trust anchor, a Layer-2 for scaling, and decentralized communication between layers, rather than defaulting to permis...
* [Design principle DP2: Maintain the balance under privacy requirements](procurement-is-trilemma-dp2.md) - Maintain the decentralization-scalability-security balance when privacy is required by integrating efficient, resilient cryptography (e.g., zero-knowledge proofs) and minimizing control points.

## Designing a cross-organizational identity management system: Utilizing SSI for the certification of retailer attributes

Source: [cross-org-identity-ssi](../papers/cross-org-identity-ssi.md)

* [Design principle DP1: Use the multiplicity of actor roles for scaling](cross-org-identity-ssi-dp1.md) - Design SSI systems so that any party can take on the issuer, holder or verifier role at any time, using the multiplicity of roles to scale the identity ecosystem.
* [Design principle DP2: Consider credentials for multiple applications](cross-org-identity-ssi-dp2.md) - Issue verifiable credentials in a context-independent, general-purpose manner so that the same credential can facilitate additional use cases and reduce friction.
* [Design principle DP3: Recognize the identity holder as primary controller](cross-org-identity-ssi-dp3.md) - Design applications so that the identity holder is an active participant in almost all processes, since all processes start with or require approval from the holder.
* [Design principle DP4: Use public DIDs only for credential issuers](cross-org-identity-ssi-dp4.md) - Publish public DIDs only for credential issuers and exchange DIDs bilaterally for all other parties, minimizing on-chain transactions and privacy risks.

## Designing a fair and inclusive digital asset-based name-image-likeness marketplace

Source: [nil-marketplace-fair-inclusive](../papers/nil-marketplace-fair-inclusive.md)

* [Design principle DP1: Plausible events (randomized collectible sales)](nil-marketplace-fair-inclusive-dp1.md) - Enable market-based randomized sales of royalty-paying collectibles so that every student-athlete has a non-zero chance of profiting from their NIL, satisfying the inclusiveness requirement via the...
* [Design principle DP2: Market royalties (meritocratic allocation)](nil-marketplace-fair-inclusive-dp2.md) - Allow ex-post, market-driven adjustments to the initial allocation through royalties from secondary-market sales of collectibles, so that student-athletes are rewarded in proportion to relevant dif...
* [Design principle DP3: Blockchain-based marketplace infrastructure](nil-marketplace-fair-inclusive-dp3.md) - Use blockchain technology as the foundational infrastructure - with transparent public ledgers and smart contracts - to create a well-functioning NIL collectibles marketplace that satisfies require...
* [Design feature DF1: Primary Markets](nil-marketplace-fair-inclusive-df1.md) - Purchasing collectibles mints NFTs, and on monetary compensation a predetermined, hardcoded portion of the value is distributed as royalties among the associated student-athletes (randomized primar...
* [Design feature DF2: Market Exchanges](nil-marketplace-fair-inclusive-df2.md) - Minted NFTs that pay royalties to student-athletes can be traded in secondary markets;

## Designing a Framework for Digital KYC Processes Built on Blockchain-Based Self-Sovereign Identity

Source: [kyc-framework-ssi](../papers/kyc-framework-ssi.md)

* [Design principle DP1: Utilize blockchain only for public data](kyc-framework-ssi-dp1.md) - Use blockchain in SSI processes only for public data:
* [Design principle DP2: Anticipate an ecosystem of various ledgers](kyc-framework-ssi-dp2.md) - Do not assume a single shared ledger;
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

* [Design principle DP1: Apply modular design of distinctive system components](bond-markets-tokenization-tac-dp1.md) - Modularly structure complex bond-market systems into distinct, interconnected contracts to work within Ethereum's contract-size limits, using modifiers and specific sender functions to protect comp...
* [Design principle DP2: Exploit multi-token standards](bond-markets-tokenization-tac-dp2.md) - Use multi-token standards (e.g., ERC-1155) when issuing multiple security tokens sharing comparable characteristics, to conserve blockchain storage and simplify architecture.
* [Design principle DP3: Automated on-chain payout mechanisms for investors](bond-markets-tokenization-tac-dp3.md) - Integrate on-chain settlement using claim capabilities in disbursement, empowering investors to control the timing and method of interest payments and removing reliance on issuer/platform trustwort...
* [Design principle DP4: Restrict forced-transfer functions to regulators](bond-markets-tokenization-tac-dp4.md) - Restrict particularly critical functions such as forced transfers to regulators only, to prevent abuse of power while complying with regulatory requirements.
* [Design principle DP5: Implement smart-contract-based crypto securities registers](bond-markets-tokenization-tac-dp5.md) - Implement a crypto securities register (CSR) within a smart contract for digitally tokenized bearer bonds, disrupting the traditional custodian chain and accelerating settlement.

## Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity

Source: [trust-enabling-capacity-exchange](../papers/trust-enabling-capacity-exchange.md)

* [Design principle DP1: Signaling of tender-relevant information](trust-enabling-capacity-exchange-dp1.md) - Provide functions for customized creation of tenders and their linkage to a verified identity, revealing them simultaneously and in a distributed manner, to reduce uncertainty from vague specificat...
* [Design principle DP2: Signaling of identity-relevant information](trust-enabling-capacity-exchange-dp2.md) - Provide functions for decentralized storage, configuration and verification of identities to establish trust in each participant's identity, ensuring transparency and correctness of identity.
* [Design principle DP3: Authority and fairness](trust-enabling-capacity-exchange-dp3.md) - Provide functions for creating and decentrally storing contracts and their order-relevant contents, and for monitoring compliance and enforcing sanctions/rewards, providing a transparent data basis...
* [Design principle DP4: Incentive mechanisms](trust-enabling-capacity-exchange-dp4.md) - Make the value-adding benefits of cooperation and the imminent losses from violations transparent and observable to all participants, motivating them and deterring opportunistic behavior.
* [Design principle DP5: Screening functionality](trust-enabling-capacity-exchange-dp5.md) - Provide functions for depositing information, distributed and verified access, validity checking and searching/contacting participants, so that information obtained during retrieval is valid and tr...
* [Design principle DP6: Reputation mechanism](trust-enabling-capacity-exchange-dp6.md) - Provide a reputation mechanism that, after the fulfillment stage, allows serious rating of each identity with decentralized collection and transparent processing/distribution of rating data, so par...

## Developing Blockchain-enabled Marketplace Interfaces: A Design Science Research Study

Source: [bemi-marketplace-interfaces](../papers/bemi-marketplace-interfaces.md)

* [Design principle DP1: Prioritize simplicity while balancing trustworthiness](bemi-marketplace-interfaces-dp1.md) - Design BEMIs that prioritize simplicity and intuitiveness while balancing trustworthiness and usability to ensure a user experience that resembles traditional marketplaces.
* [Design principle DP2: Support learning and engagement via documentation](bemi-marketplace-interfaces-dp2.md) - Design BEMIs that support users' learning and engagement by providing comprehensive documentation to foster trust by transparency and stimulate innovation in decentralized communities.
* [Design principle DP3: Interoperable identity and reputation infrastructure](bemi-marketplace-interfaces-dp3.md) - Design BEMIs with an interoperable identity management and reputation infrastructure to increase trust between transaction partners and enable user empowerment with sovereign authentication methods.
* [Design principle DP4: Domain-specific graphical representations](bemi-marketplace-interfaces-dp4.md) - Design BEMIs with graphical representations and functions for CAM-specific perspectives so that users can seamlessly navigate multidimensionality and incorporate stakeholders' points of view.
* [Design principle DP5: Real-time plausibility checks and time-limited corrections](bemi-marketplace-interfaces-dp5.md) - Design BEMIs with real-time input plausibility checks to reduce the risk of errors and allow for time-limited corrections, given the irreversibility of finalized transactions.
* [Design principle DP6: External storage connectivity for privacy and scalability](bemi-marketplace-interfaces-dp6.md) - Design BEMIs with external storage connectivity to mitigate blockchain scalability issues and enable privacy-preserving data storage.
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

* [Design objective DO1: Authenticity](ambivalence-trust-loyalty-do1.md) - Provide loyalty tokens and data from authentic sources - e.g., using local IoT controllers for consumption data and a green/renewable energy index for generation - so customers can trust the sustai...
* [Design objective DO2: Customizability](ambivalence-trust-loyalty-do2.md) - Let customers set rules for their smart appliances based on generation and consumption data so that electricity consumption aligns with their sustainability preferences.
* [Design objective DO3: Transparency](ambivalence-trust-loyalty-do3.md) - Assess and communicate the sustainability of generation (e.g., via a renewable energy index) so customers can transparently monitor their green electricity.
* [Design objective DO4: Efficiency](ambivalence-trust-loyalty-do4.md) - Enable seamless, reliable and scalable information exchange between electricity supplier and customer, minimizing blockchain data processing to retain high uptime and availability.
* [Design objective DO5: Usability](ambivalence-trust-loyalty-do5.md) - Provide an intuitive user interface (with a cloud controller for data storage/display) so users need not deal with the technical details of blockchain.
* [Design objective DO6: Affordability](ambivalence-trust-loyalty-do6.md) - Keep participation in the blockchain-based loyalty program affordable for customers, keeping additional-service and hardware costs (e.g., low-cost local controllers) reasonable.

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

* [Design principle DP1: Do not store personal data on a blockchain](gdpr-workflow-asylum-dp1.md) - Keep personal data off-chain, since blockchain's tamper-resistant storage conflicts with the rights to rectification and erasure;
* [Design principle DP2: Use a highly secure off-chain mapping architecture for attribution](gdpr-workflow-asylum-dp2.md) - If a use case requires that data on the blockchain be attributable to a natural person, employ pseudonymization:

## Know-Your-Customer (KYC) Requirements for Initial Coin Offerings: Toward Designing a Compliant-by-Design KYC-System Based on Blockchain Technology

Source: [kyc-ico-requirements](../papers/kyc-ico-requirements.md)

* [Design objective DO: Design objectives for a compliant-by-design ICO KYC system](kyc-ico-requirements-do.md) - The KYC system's design objectives are derived from KYC and legal requirements and include, among others:

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

* [Design objective DO1: Secure data exchange](delivery-invoice-transparency-do1.md) - Ensure fundamentally secure data exchange within a decentralized infrastructure, focusing on the data-protection goals of confidentiality, integrity, availability and authenticity for delivery invo...
* [Design objective DO2: Collaboration](delivery-invoice-transparency-do2.md) - Support the collaboration aspect of coopetition, using network effects (e.g., Hyperledger Fabric) to enhance the overall construction planning process between participants.
* [Design objective DO3: Competition](delivery-invoice-transparency-do3.md) - Account for the competition aspect of coopetition, using decentralized networks and access controls so that security, trust and transparency are strengthened without exposing competitively sensitiv...

## Requirements and Design Principles for Blockchain-enabled Matchmaking-Marketplaces in Additive Manufacturing

Source: [matchmaking-additive-manufacturing](../papers/matchmaking-additive-manufacturing.md)

* [Design principle DP1: Sovereign, pseudonymous IDs](matchmaking-additive-manufacturing-dp1.md) - Design BEMs that allow each actor to manage their sovereign and pseudonymous IDs.
* [Design principle DP2: Sovereign credential wallets](matchmaking-additive-manufacturing-dp2.md) - Design BEMs that support sovereign wallets that may hold certificates and other ID credentials to qualitatively and quantitatively describe actors.
* [Design principle DP3: Minimal on-chain sensitive data](matchmaking-additive-manufacturing-dp3.md) - Design BEMs to prevent unauthorized access to sensitive business data and store only a necessary minimum as a persistent blockchain trust anchor.
* [Design principle DP4: Persistent manufacturing-data logging](matchmaking-additive-manufacturing-dp4.md) - Design BEMs that require manufacturers to persistently log manufacturing data for ex-post transparency and quality assurance.
* [Design principle DP5: Supplier service-offering information](matchmaking-additive-manufacturing-dp5.md) - Design BEMs that require manufacturers to provide information about their service offerings and specify their individual preferences.
* [Design principle DP6: Consumer service-request specification](matchmaking-additive-manufacturing-dp6.md) - Design BEMs that enable consumers to specify their service requests via customizable functionalities and filter options.
* [Design principle DP7: Ambidextrous interfaces with data screening](matchmaking-additive-manufacturing-dp7.md) - Design BEMs with ambidextrous user interfaces (manual HMI and automated M2M) and functionality to screen marketplace data.
* [Design principle DP8: Preference-filterable reputation system](matchmaking-additive-manufacturing-dp8.md) - Design BEMs with a reputation system where consumers can filter different criteria according to their individual preferences.
* [Design principle DP9: Demand-driven semi-automated matchmaking](matchmaking-additive-manufacturing-dp9.md) - Design BEMs as demand-driven marketplaces with semi-automated matchmaking functions where consumers receive suggestions for matching producers and select the final producer based on their preferenc...
* [Design principle DP10: Hybrid pricing and negotiation](matchmaking-additive-manufacturing-dp10.md) - Design agreements in BEMs as hybrid systems that support individual pricing and negotiation.
* [Design principle DP11: Automated contract execution with hybrid payments](matchmaking-additive-manufacturing-dp11.md) - Design BEMs that allow for automated contract execution with cryptographic token incentives and payment options using fiat currencies.
* [Design principle DP12: Interoperability and consortial standards](matchmaking-additive-manufacturing-dp12.md) - Design BEMs to support interoperability and free market access to those who follow consortially defined standards and rules.

## Striking a balance: Designing a blockchain-based solution to navigate coopetition dynamics in supply chain management

Source: [striking-balance-coopetition](../papers/striking-balance-coopetition.md)

* [Design objective DO1: Data protection](striking-balance-coopetition-do1.md) - Protect data against internal and external attackers;
* [Design objective DO2: Accountability](striking-balance-coopetition-do2.md) - Ensure organizations are identifiable in the network to enable accountability, so participants know with whom they conduct business and actions can be attributed.
* [Design objective DO3: Decentralization](striking-balance-coopetition-do3.md) - Provide a decentralized solution to prevent monopolistic market dependencies and enable democratic decision-making and balanced power structures.
* [Design objective DO4: Performance](striking-balance-coopetition-do4.md) - Enable the system to handle many transactions fast, with scalability, low latency and throughput sufficient for large construction supply networks.
* [Design objective DO5: Interoperability](striking-balance-coopetition-do5.md) - Make the solution integrable and interoperable with existing systems (e.g., ERP, BIM) to accomplish true cooperation and lower market-entry barriers.
* [Design objective DO6: Traceability](striking-balance-coopetition-do6.md) - Provide traceability of products and goods at any time to enforce process automation while protecting confidentiality in a coopetitive environment.
* [Design objective DO7: Transparency](striking-balance-coopetition-do7.md) - Provide transparency to achieve the benefits of cooperation and information sharing, with transparency levels adjustable to protect sensitive data.
* [Design objective DO8: Automation](striking-balance-coopetition-do8.md) - Enforce automation (e.g., smart contracts executing payments on predefined conditions) to boost process efficiency and reduce human error.

## Trading Green Bonds Using Distributed Ledger Technology

Source: [trading-green-bonds-dlt](../papers/trading-green-bonds-dlt.md)

* [Design requirement REQ: Functional artefact requirements for a DLT trading and settlement system](trading-green-bonds-dlt-req.md) - Core technical requirements:

## Unchaining Social Businesses - Blockchain as the Basic Technology of a Crowdlending Platform

Source: [unchaining-social-crowdlending](../papers/unchaining-social-crowdlending.md)

* [Design objective DO: Objectives of the blockchain crowdlending prototype](unchaining-social-crowdlending-do.md) - The 17 objectives guiding design and evaluation are:

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
