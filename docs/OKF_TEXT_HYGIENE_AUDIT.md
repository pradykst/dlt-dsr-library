# OKF Text Hygiene Audit

## Scope and policy

This deterministic audit inspected 9 runtime paper bundles and 1 canonical TEMPLATE bundle (50 human-text-bearing files and 2590 fields).

The validator checks canonical paper metadata, presentation text, concept titles/descriptions, non-verbatim evidence summaries, source locations, graph display labels, captions, and validation notes. It preserves verbatim evidence quotations byte-for-byte and excludes them from typography normalization. Runtime paper-specific replacement rules are prohibited.

Display precedence is: cleaned canonical normalized text, canonical description, canonical title, then raw source text in advanced provenance only.

## Reviewed allowlist

The lower-case join detector uses a conservative token dictionary and a reviewed technical-compound allowlist. Current allowed compounds include blockchain, database, dataset, healthcare, lifecycle, marketplace, metadata, microgrid, newsvendor, offchain, onchain, smartphone, stakeholder, timestamp, throughput, and workflow. The allowlist is generic and contains no paper identity or query-specific text.

## Audit result

- Remaining findings: 0
- Verbatim evidence quotations preserved and skipped: 0
- Semantic review implication: text-hygiene success confirms presentation cleanliness only; it does not imply semantic paper review.

## Before/after corrections

No remaining canonical text-hygiene corrections are required. The validator is clean after the reviewed metadata, contextual-label, and source-location normalization recorded below.

### Applied normalization

Three categories of clearly malformed, non-verbatim canonical display text were mechanically normalized. No identifiers, semantic claims, relation predicates in `relations.yaml`, evidence supports, or quotation text changed.

| Paper | File | Fields | Prior form | Corrected form | Reason | Raw quote? | Method |
|---|---|---:|---|---|---|---|---|
| `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024` | `library/okf/papers/trust-capacity-exchange-blockchain-2024/evidence.md` | 40 `source_location` fields | `<source>.pdf#page=N` / `<source>.pdf ? page N` | `<source>.pdf · page N` | Normalize PDF page separator for Workbench/chatbot display. | No | Automatic normalization; manually inspected |
| `TEMPLATE` | `library/okf/TEMPLATE/evidence.md` | 1 `source_location` example | `source.pdf ? page 1` | `source.pdf · page 1` | Keep the canonical example aligned with runtime source-location syntax. | No | Automatic normalization; manually inspected |
| `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023` | `library/okf/papers/hie-consent-self-management-blockchain-2023/index.md` | `methodology` | `design_science_research` | `Design science research` | Replace a machine token in human-facing metadata. | No | Automatic normalization; manually inspected |
| `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021` | `library/okf/papers/newsvendor-forecasting-smart-contract-2021/index.md` | `methodology` | `design_science_research` | `Design science research` | Replace a machine token in human-facing metadata. | No | Automatic normalization; manually inspected |
| `SHORT_END_STICK_2025` | `library/okf/papers/short-end-stick-2025/index.md` | `methodology` | `design_science_research` | `Design science research` | Replace a machine token in human-facing metadata. | No | Automatic normalization; manually inspected |

The preserved contextual-relation inventory remains noncanonical context rather than graph data, but its human-readable bold predicate labels were normalized from snake_case to words. Backticked IDs and the underlying canonical relations were not changed.

| Paper | File | Labels | Prior labels | Corrected labels | Reason | Raw quote? | Method |
|---|---|---:|---|---|---|---|---|
| `BLOCKCHAIN_IOT_SDPS_2019` | `library/okf/papers/blockchain-iot-sdps-2019/index.md` | 5 | `contributes_to`, `derived_from` | `contributes to`, `derived from` | Human-readable contextual predicate labels. | No | Automatic normalization; manually inspected |
| `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023` | `library/okf/papers/hie-consent-self-management-blockchain-2023/index.md` | 7 | `contrasts_with`, `derived_from` | `contrasts with`, `derived from` | Human-readable contextual predicate labels. | No | Automatic normalization; manually inspected |
| `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024` | `library/okf/papers/integrated-blockchain-isdm-framework-2024/index.md` | 24 | `derived_from`, `supported_by` | `derived from`, `supported by` | Human-readable contextual predicate labels. | No | Automatic normalization; manually inspected |
| `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021` | `library/okf/papers/newsvendor-forecasting-smart-contract-2021/index.md` | 7 | `contributes_to`, `derived_from` | `contributes to`, `derived from` | Human-readable contextual predicate labels. | No | Automatic normalization; manually inspected |
| `NIL_NFT_MARKETPLACE_2026` | `library/okf/papers/nil-nft-marketplace-2026/index.md` | 14 | `contrasts_with`, `derived_from` | `contrasts with`, `derived from` | Human-readable contextual predicate labels. | No | Automatic normalization; manually inspected |
| `PEER_REVIEW_TOKEN_INCENTIVES_2025` | `library/okf/papers/peer-review-token-incentives-2025/index.md` | 11 | `addressed_by`, `contrasts_with`, `derived_from` | `addressed by`, `contrasts with`, `derived from` | Human-readable contextual predicate labels. | No | Automatic normalization; manually inspected |
| `SHORT_END_STICK_2025` | `library/okf/papers/short-end-stick-2025/index.md` | 2 | `derived_from` | `derived from` | Human-readable contextual predicate labels. | No | Automatic normalization; manually inspected |
| `SSI_KYC_FRAMEWORK_2022` | `library/okf/papers/ssi-kyc-framework-2022/index.md` | 24 | `derived_from`, `supported_by` | `derived from`, `supported by` | Human-readable contextual predicate labels. | No | Automatic normalization; manually inspected |
| `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024` | `library/okf/papers/trust-capacity-exchange-blockchain-2024/index.md` | 10 | `derived_from`, `supported_by` | `derived from`, `supported by` | Human-readable contextual predicate labels. | No | Automatic normalization; manually inspected |

## Regression coverage

Neutral fixtures cover missing sentence and separator spacing, `page`/number joins, concatenated canonical labels, placeholders, visible snake_case, suspicious lower-case joins, malformed PDF page fragments, and mojibake. Tests also prove that raw quotations are not inspected or rewritten, source-location normalization is deterministic, normalized text wins display precedence, and the validator contains no paper-specific runtime mapping.

## Commands

```text
npm run okf:validate:text
npm run test:text-hygiene
```

