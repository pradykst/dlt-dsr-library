# OKF Source View Validation Report

This report separates machine-checkable structural validity from human semantic verification. A structurally valid source view is not automatically semantically validated and does not claim exact visual reproduction.

## Summary

- Runtime bundles: 9
- TEMPLATE checked: yes
- Source views checked: 9
- Structurally valid source views: 9
- Source-view projections executed: 9
- Deterministic repeated projections: 9
- Structural errors: 0
- Projection errors: 0
- Semantic statuses: unreviewed: 9

## Bundle results

| Bundle | Paper ID | Runtime | Source views | Structurally valid | Projected | Deterministic | Semantic status |
|---|---|---|---:|---:|---:|---:|---|
| blockchain-iot-sdps-2019 | BLOCKCHAIN_IOT_SDPS_2019 | yes | 1 | 1 | 1 | 1 | unreviewed: 1 |
| hie-consent-self-management-blockchain-2023 | HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023 | yes | 1 | 1 | 1 | 1 | unreviewed: 1 |
| integrated-blockchain-isdm-framework-2024 | INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024 | yes | 0 | 0 | 0 | 0 | none |
| newsvendor-forecasting-smart-contract-2021 | NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021 | yes | 0 | 0 | 0 | 0 | none |
| nil-nft-marketplace-2026 | NIL_NFT_MARKETPLACE_2026 | yes | 1 | 1 | 1 | 1 | unreviewed: 1 |
| peer-review-token-incentives-2025 | PEER_REVIEW_TOKEN_INCENTIVES_2025 | yes | 1 | 1 | 1 | 1 | unreviewed: 1 |
| short-end-stick-2025 | SHORT_END_STICK_2025 | yes | 2 | 2 | 2 | 2 | unreviewed: 2 |
| ssi-kyc-framework-2022 | SSI_KYC_FRAMEWORK_2022 | yes | 0 | 0 | 0 | 0 | none |
| trust-capacity-exchange-blockchain-2024 | TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024 | yes | 2 | 2 | 2 | 2 | unreviewed: 2 |
| TEMPLATE | TEMPLATE_PAPER | no | 1 | 1 | 1 | 1 | unreviewed: 1 |

## Structural issues

No structural source-view errors were found.

## Projection issues

Every structurally valid source view was projected twice, both outputs were identical, and each projected flow passed the runtime projection validator.

## Guarantees checked

- Owning paper identity and fully scoped node/relation IDs.
- Complete source reference and strict unknown-key rejection.
- Canonical node and relation existence.
- Edge endpoint inclusion.
- Exact layer membership and complete stored ordering.
- No duplicate nodes, edges, or source-view IDs.
- No inferred or query-generated Source Figure edge.
- Explicit or explicit-in-artifact relation provenance only.
- Review metadata for elevated validation states.
- Manual visual-parity claims require reviewer metadata.
- Runtime availability matches the strict structural validator.
- Each eligible view is projected twice; node order, edge membership, projection validity, and deterministic output are checked.

## Semantic interpretation

- `unreviewed`: structurally represented but not semantically verified by a recorded reviewer.
- `internally_validated`: reviewer and timestamp are recorded.
- `author_verified`: reviewer, timestamp, and author-verification record are present.
- `automatic_approximation`: layout approximates the source and is not a pixel-identical reproduction.
