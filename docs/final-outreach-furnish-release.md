# Final outreach furnishing release audit

Audit date: 15 September 2026 (Asia/Calcutta). Local production acceptance used `http://127.0.0.1:3100`. This report covers the feature-branch release; it does not represent a production deployment.

## Release findings

| # | Requested report item | Result |
| --- | --- | --- |
| 1 | Baseline and branch | Initial tree was clean. After fetch, `origin/fix/final-researcher-feedback` equalled `f60130386233cea97abd1227cddca651bc9e5747`. `fix/final-outreach-furnish` was created from that exact commit. |
| 2 | Independent baseline audit | Inspected metadata, publication/DOI rendering, count labels, source links, node sizing, concept presentation, selected context, concept-kind filtering, source boundaries, comparison and diagram routing. |
| 3 | Genericity defects | No paper-specific production workaround was found. The defects were generic: DOI-only presentation lacked a publication fallback and record link; map layout underestimated title chrome; multi-paper diagrams enabled a stored-map union. Source-authored metadata was not changed. |
| 4 | Selected research universe | Existing complete-paper retrieval and canonical ownership checks remain. Context is re-filtered after structured analysis. Final serialization rejects unselected source cards, node/edge supports and node source paths. Selection is never silently broadened. |
| 5 | Merged-map root cause | The router classified multi-paper diagram requests as comparative, and `buildComparativePaperDesignMap` concatenated stored maps into one diagram. Paper group labels did not prevent a misleading shared DSR hierarchy. |
| 6 | Comparison routing | Comparisons resolve to `STORED_COMPARISON`, retain ordered selected context and produce prose/table. The comparative graph builder and response branch were removed. |
| 7 | Comparison with mapping enabled | The checkbox cannot enable a graph for ordinary comparison. `includeDiagram` is false and the final response boundary independently rejects any comparison diagram. Both live checkbox cases returned tables. |
| 8 | One selected paper | Generic show-map requests resolve to that paper's canonical stored map. They do not become synthesis. |
| 9 | Multiple selected papers | An explicit selected title or paper ordinal resolves one map subject. Stored-map structured context and topology are limited to that subject. Other selected papers remain available for later turns. |
| 10 | Ambiguous or plural maps | A request without one resolvable selected subject asks which selected paper to open first. No stored-map union is available. Unselected named papers and out-of-range ordinals fail closed to clarification. |
| 11 | Selected-paper synthesis | Solve/design/create-proposal requests resolve to synthesis using the selected set automatically. New proposed nodes form proposal topology; stored concepts remain supporting evidence. |
| 12 | Synthesis boundary proof | Retrieval, diagram grounding and final serialization all check canonical selected-paper ownership. The live proposal had 28 evidence concepts from precisely the three selected papers, with a separate user problem and 15 proposed concepts. |
| 13 | Leakage tests | Tests inject a stronger fourth-paper retrieval result, an unselected source card, an invalid citation ID and a stored graph masquerading as synthesis. The fourth paper is removed or the response rejected. A union of two selected stored maps is also rejected. |
| 14 | Selection plus concept kinds | Both constraints apply. Three-paper DP comparison is DP-only and graph-free. The live trust query returned 13 Design Principle sources from the three selected papers only. |
| 15 | Em-dash cleanup | Removed the remaining product-owned fallback-message em dash, strengthened generation style instructions, and scanned UI string literals. Exact publication titles, source text, citations and canonical knowledge were preserved. |
| 16 | Diagram action | The shared composer reads `Generate mapping diagram`. Its helper explicitly says comparisons use prose and tables. This also appears in the paper drawer. |
| 17 | Method removal | Removed the obsolete public page/component, canonical rewrite, sitemap exposure and navigation entry. Methodological validators remain. `/method` returns 404; the internal compatibility route ends at controlled 404. |
| 18 | Privacy-note removal | Replaced the old footer labels with Imprint and Privacy. No separate Privacy note control remains. |
| 19 | Imprint | Includes the supplied institution, representation, supervisory authority, faculty responsibility, VAT number and project contact. Links to the official Faculty legal notice. Accessible from the shared footer. |
| 20 | Privacy | Describes actual bounded per-tab storage, separate paper-drawer sessions, no application chat-history/database writes, transmitted conversation/proposal context, OpenAI generation and configurable moderation, `store: false`, operational logs, infrastructure processing, cookies/analytics and contacts. It does not claim zero provider retention. |
| 21 | Generic metadata | Every paper uses `WorkbenchView` and `resolvePaperPublication`: Authors, Year, Venue, Methodology, DOI/Publication and Design knowledge. No per-paper JSX or URL mapping table. |
| 22 | DOI | DOI metadata resolves to `https://doi.org/<doi>`. Resolution considers bibliographic metadata and the paper preamble, without borrowing a DOI from the references section. |
| 23 | No-DOI fallback | A legitimate canonical external publication URL is used. Missing or unsafe links have an explicit unavailable state. No DOI is invented and no empty DOI-only cell remains. |
| 24 | GitHub records | Links derive from each canonical paper ID and actual record path. They use immutable baseline `f601303`, where all unchanged records exist. Anonymous GitHub API/tree verification returned 200 and confirmed all 34 paths. |
| 25 | Corpus audit | All 34 canonical page models and destinations were checked programmatically. The full per-paper table appears below. |
| 26 | Redundant resource button | Removed `Open source resource` from the hero; publication metadata and the publication destination remain. |
| 27 | Centering root cause and fix | The prior flex layout combined an ID row, outer padding and title padding while the height estimator reserved less chrome. Titles were offset about 7.5 CSS pixels in measured baseline examples. A shared centered grid now positions the title independently of the absolute top-right ID; sizing reserves the actual 32-pixel padding plus 4-pixel border and correct content width. |
| 28 | Browser geometry | BEMI's 34 nodes covered one-, two- and three-line titles with 92/96-pixel variable heights. Maximum midpoint deviation in production was 0.00043 CSS pixels, handle deviation zero, with no clipping. True embedded-browser fullscreen measured 0.00035 CSS pixels maximum deviation and no overflow. IoT's 17 nodes also passed normal-layout checks. |
| 29 | Comparison tests | Six generic comparison phrasings are tested with automatic and requested diagrams, alongside existing named-title, author and corpus-pair routing suites. Live comparison tables retained paper-specific citations. |
| 30 | Diagram semantics tests | Explicit one-paper map, selected ordinals/titles, ambiguous/plural maps, forbidden unions, synthesis routing, selected grounding, invalid sources and DP-only comparisons have deterministic regression coverage. |
| 31 | Multi-paper non-regression | Existing suites cover one-to-five selection, order, duplicates, invalid IDs, legacy normalization, stale-source cleanup, complete context and the 80,000-character guard. Browser checks exercised @, /paper, ordered chips, the drawer, Open full chat and New Chat. |
| 32 | Concept-kind non-regression | Existing hard-kind and relationship tests passed. DP, DR and combined-kind behavior remains covered; synthesis retains its full multi-layer grammar. |
| 33 | Synthesis non-regression | Grammar and Problem/Artifact suites passed, including variable cardinality and many-to-many relationships. Live output contained Problem, Requirement, Principle, Feature, Artifact, Evaluation and Outcome; proposed elements were clearly marked. Horizontal and vertical generated-map controls remained functional. |
| 34 | Deterministic gate | All required pre-commit commands passed on the final code tree. Counts: core 21, chat 407, retrieval 20, UI 73, UI-copy 14. TypeScript, build, OKF validation and release readiness passed. Additional release-shell/readiness tests passed 12/12. The same required gate is repeated after the single commit; its result accompanies delivery. |
| 35 | Bounded live acceptance | Both comparisons, second-paper map, three-paper synthesis and DP-only trust query passed. One synthesis was repeated because the usage interruption cleared the review tab after server completion. Six total chat submissions completed with HTTP 200. |
| 36 | Exact provider calls | 23 upstream requests: 10 Responses API calls and 13 moderation calls. All returned 200. This includes generation/repair calls and the four calls used by the repeated synthesis. No additional provider calls were used for layout or legal-route checks. |
| 37 | Browser acceptance | Reviewed home, DOI and non-DOI paper pages, legal pages, selected chat, source lists, mapping, drawer and full-chat handoff. Desktop, 1024-pixel laptop and 390-pixel mobile checks found no document-level horizontal overflow or blank publication cells. |
| 38 | Console and network | No hydration or React warnings appeared in the fresh production browser. Chrome extension warnings came from installed MetaMask/Grammarly extensions. Automated Chrome fullscreen was denied (`not granted`); true fullscreen passed in the embedded browser with a clean console. Exactly six success outcome records matched the six deliberate chat submissions, with no duplicate chat POST outcome. Expected removed-route 404s and external publisher restrictions are distinguished from application failures. |
| 39 | Legal routes | `/imprint` 200; `/privacy` 200; `/method` 404; `/native-okf/method` redirects to `/route-unavailable`, which returns 404. Public checks returned no Set-Cookie header. |
| 40 | Canonical zero diff | `knowledge/okf` has no changes. Parser validation found 462 concepts, 34 papers, 1,325 internal links, zero broken links and zero fatal errors. |
| 41 | Changed-file audit | Every changed product diff, deleted page, new legal/resolver/test file and modified regression test was inspected. Screenshots, logs, provider counters, environment files and temporary audit scripts are excluded. The 17 explicit audit questions are answered below. |
| 42 | Committed file count | The intended release comprises 31 files, including this report and two removed obsolete files. The actual committed count is verified at delivery. |
| 43 | Final commit | One commit with message `fix: furnish final researcher outreach release`. Its exact hash is reported with delivery rather than embedded recursively in its own tree. |
| 44 | Remote branch | Normal push to `fix/final-outreach-furnish` only. Remote equality with local HEAD is checked after push and reported with delivery. |
| 45 | Final Git status | Clean tree is required before the post-commit gate and again after push. Final status is reported with delivery. |
| 46 | Non-blocking limitations | Publisher HEAD checks returned 30 HTTP 200 responses, three publisher anti-bot 403 responses and one transient institutional 503. Links retain the canonical source destination. Hosting/provider retention arrangements remain deployment-operator facts; the Privacy page directs questions to the project instead of inventing them. The stored-map live answer used its existing deterministic summary and validated source cards after citation repair did not cover every required source. |
| 47 | Unresolved defects | No unresolved release-code defect was identified in the required scope. External publication availability and Chrome automation fullscreen permission are the recorded environmental limitations. |
| 48 | Researcher readiness | The implementation and local acceptance support review and manual deployment, subject to the required post-commit gate and remote verification. Production, `main`, `deploy/native-okf-canary` and existing PRs are outside this release operation and remain unchanged. |

## Final changed-file questions

| Question | Audit answer |
| --- | --- |
| Can comparison merge stored maps? | No. The route is prose/table and final serialization rejects a diagram. |
| Can several stored maps appear as one canonical graph? | No. The builder was removed and selected stored diagrams must equal one canonical paper projection. |
| Can synthesis use an unselected paper? | No. Selection constrains retrieval, grounding and serialized support/source ownership. |
| Can stored-map routing use an unselected paper? | No. Named/ordinal subjects resolve within the ordered selection; unselected names clarify. |
| Can an unselected source serialize? | No. The final canonical ownership check rejects it. |
| Do selection and concept-kind filters compose? | Yes. Both are applied, including after structured analysis. |
| Is publication logic paper-specific? | No. One metadata resolver and template serve every paper. |
| Do no-DOI papers get publication links? | Yes, all current records have a usable canonical destination. Missing metadata has a graceful state. |
| Do GitHub links resolve generically? | Yes. All 34 exact baseline record paths were verified against the public GitHub tree. |
| Is provenance preserved internally? | Yes. Canonical IDs, evidence and topology remain; on-disk filenames/extraction metadata are not used as publication labels. Existing inspectable concept identifiers remain unchanged. |
| Is title text actually centered? | Yes. Computed rectangles, three line counts, handles, variable heights and fullscreen were checked. |
| Did punctuation cleanup mutate sources? | No. Native knowledge and source-authored publication content are unchanged. |
| Did Method removal affect validation? | No. Only public presentation and route exposure were removed. Validation passed. |
| Is Privacy accurate? | Yes for the audited application behavior. Deployment-controlled retention is explicitly not guessed. |
| Is Imprint accessible? | Yes. Shared footer navigation, working contact links and mobile/desktop rendering were checked. |
| Did single-paper behavior regress? | No. Canonical map and scope tests passed; the paper drawer and full-chat handoff preserve one paper. |
| Did synthesis grammar regress? | No. Existing grammar tests and a live full proposal passed the strict serialization boundary. |

## Validation commands

The pre-commit and post-commit gates use the same commands:

```text
npm run okf:validate
npm run native-okf:release:check
npm run test:native-okf
npm run test:native-okf:chat
npm run test:native-okf:retrieval
npm run test:native-okf:ui
npm run test:native-okf:ui-copy
npx tsc --noEmit
npm run build
git diff --check
git diff --name-only -- knowledge/okf
```

The affected outreach semantic and presentation suites were also run directly, and `npm run test:native-okf:release` passed. No tests depend on a live provider. The local provider-count preload captured endpoint, time and HTTP status only; it did not log API credentials or message content and is excluded from the commit.

## Live-call ledger

Selection order: Blockchain for the IoT; consent self-management in HIEs; cross-organizational identity management using SSI. Comparisons and the stored-map turn used the first two papers. Synthesis and the trust query used all three.

| Submission | Responses API | Moderation | Result |
| --- | ---: | ---: | --- |
| Compare these papers, mapping off | 1 | 2 | Comparison table; selected citations; no diagram |
| Compare these papers, mapping on | 1 | 2 | Comparison table; selected citations; no diagram |
| Show the map of the second paper | 2 | 3 | Exactly 15 HIE nodes and 16 canonical relationships; 16 validated source cards from HIE only |
| Selected-paper synthesis, interrupted browser review | 2 | 2 | Server HTTP 200; browser tab was cleared before output inspection |
| Same synthesis, completed browser review | 2 | 2 | Separate user problem; 3 requirements, 4 principles, 5 features, 1 artifact, 1 evaluation, 1 outcome; 28 selected evidence concepts |
| Find design principles relevant to trust | 2 | 2 | 13 DP-only sources from the selected set; no new diagram |
| **Total** | **10** | **13** | **23 provider calls; all HTTP 200** |

## Corpus-wide publication audit

The record paths below are relative to `knowledge/okf`. The record is also the entry point to that paper's linked native design knowledge. Every row uses the same resolver and template. GitHub destinations are pinned to the unchanged baseline, so this feature branch does not need to move `main` to make them work.

| Paper title | DOI exists? | Canonical publication URL exists? | Rendered publication destination | Canonical record | GitHub design knowledge |
| --- | --- | --- | --- | --- | --- |
| Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules | Yes | Yes | [Publication](https://doi.org/10.1016/j.dss.2021.113626) | `papers/aligning-newsvendors-scoring-rules.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/aligning-newsvendors-scoring-rules.md) |
| From ambivalence to trust: Using blockchain in customer loyalty programs | Yes | Yes | [Publication](https://doi.org/10.1016/j.ijinfomgt.2022.102496) | `papers/ambivalence-trust-loyalty.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/ambivalence-trust-loyalty.md) |
| Developing Blockchain-enabled Marketplace Interfaces: A Design Science Research Study | No | Yes | [Publication](https://aisel.aisnet.org/icis2023/blockchain/blockchain/1) | `papers/bemi-marketplace-interfaces.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/bemi-marketplace-interfaces.md) |
| Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data | Yes | Yes | [Publication](https://doi.org/10.17705/1jais.00567) | `papers/blockchain-iot-sensor-data.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/blockchain-iot-sensor-data.md) |
| Designing the future of bond markets: Reducing transaction costs through tokenization | Yes | Yes | [Publication](https://doi.org/10.1007/s12525-025-00753-3) | `papers/bond-markets-tokenization-tac.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/bond-markets-tokenization-tac.md) |
| Certified data chats for future used car markets | Yes | Yes | [Publication](https://doi.org/10.1007/s12525-024-00725-z) | `papers/certified-data-chats-used-cars.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/certified-data-chats-used-cars.md) |
| Blockchain innovation for consent self-management in health information exchanges | Yes | Yes | [Publication](https://doi.org/10.1016/j.dss.2023.114021) | `papers/consent-self-management-hie.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/consent-self-management-hie.md) |
| Using Blockchain to Sustainably Manage Containers in International Shipping | No | Yes | [Publication](https://aisel.aisnet.org/icis2020/blockchain_fintech/blockchain_fintech/5) | `papers/containers-shipping-sustainable.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/containers-shipping-sustainable.md) |
| Designing a cross-organizational identity management system: Utilizing SSI for the certification of retailer attributes | Yes | Yes | [Publication](https://doi.org/10.1007/s12525-023-00620-z) | `papers/cross-org-identity-ssi.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/cross-org-identity-ssi.md) |
| Cross-Organizational Workflow Management Using Blockchain Technology - Towards Applicability, Auditability, and Automation | No | Yes | [Publication](https://hdl.handle.net/10125/50503) | `papers/cross-org-workflow-objectives.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/cross-org-workflow-objectives.md) |
| Decentralized Procurement Mechanisms for Efficient Logistics Services Mapping - a Design Science Research Approach | No | Yes | [Publication](https://hdl.handle.net/10125/79952) | `papers/decentralized-procurement-logistics.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/decentralized-procurement-logistics.md) |
| Overcoming the Data Transparency Trade-Off: Designing a Blockchain-Based Delivery Invoice System for the Construction Industry | No | Yes | [Publication](https://aisel.aisnet.org/wi2023/78) | `papers/delivery-invoice-transparency.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/delivery-invoice-transparency.md) |
| From Dissonance to Dialogue: A Token-Based Approach to Bridge the Gap Between Manufacturers and Customers | Yes | Yes | [Publication](https://doi.org/10.1145/3639058) | `papers/dissonance-dialogue-recall.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/dissonance-dialogue-recall.md) |
| Blockchain-based digital rights management systems: Design principles for the music industry | Yes | Yes | [Publication](https://doi.org/10.1007/s12525-023-00628-5) | `papers/drm-music-industry.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/drm-music-industry.md) |
| Design of a forgetting blockchain: A possible way to accomplish GDPR compatibility | No | Yes | [Publication](https://hdl.handle.net/10125/60145) | `papers/forgetting-blockchain-gdpr.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/forgetting-blockchain-gdpr.md) |
| Designing GDPR Compliant Credential Verification Using Blockchain: A Design Science Research Approach | No | Yes | [Publication](https://aisel.aisnet.org/ecis2024/track16_fintech/track16_fintech/5) | `papers/gdpr-credential-verification.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/gdpr-credential-verification.md) |
| How to Develop a GDPR-Compliant Blockchain Solution for Cross-Organizational Workflow Management: Evidence from the German Asylum Procedure | No | Yes | [Publication](https://hdl.handle.net/10125/64234) | `papers/gdpr-workflow-asylum.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/gdpr-workflow-asylum.md) |
| Design Principles for Blockchain-based Applications in Green Bond Reporting | No | Yes | [Publication](https://hdl.handle.net/10125/103268) | `papers/green-bond-reporting-dp.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/green-bond-reporting-dp.md) |
| Designing a Framework for Digital KYC Processes Built on Blockchain-Based Self-Sovereign Identity | Yes | Yes | [Publication](https://doi.org/10.1016/j.im.2021.103553) | `papers/kyc-framework-ssi.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/kyc-framework-ssi.md) |
| Know-Your-Customer (KYC) Requirements for Initial Coin Offerings: Toward Designing a Compliant-by-Design KYC-System Based on Blockchain Technology | Yes | Yes | [Publication](https://doi.org/10.1007/s12599-020-00677-6) | `papers/kyc-ico-requirements.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/kyc-ico-requirements.md) |
| Requirements and Design Principles for Blockchain-enabled Matchmaking-Marketplaces in Additive Manufacturing | No | Yes | [Publication](https://hdl.handle.net/10125/103293) | `papers/matchmaking-additive-manufacturing.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/matchmaking-additive-manufacturing.md) |
| Meta-requirements for the Design of a Blockchain-enabled Multi-sided Platform for Sustainability and Circular Economy | No | Yes | [Publication](https://hdl.handle.net/10125/106903) | `papers/msp-sustainability-circular.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/msp-sustainability-circular.md) |
| Designing a fair and inclusive digital asset-based name-image-likeness marketplace | Yes | Yes | [Publication](https://doi.org/10.1016/j.dss.2025.114580) | `papers/nil-marketplace-fair-inclusive.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/nil-marketplace-fair-inclusive.md) |
| Blockchain-based token system for incentivizing peer review: A design science approach | Yes | Yes | [Publication](https://doi.org/10.1016/j.dss.2025.114514) | `papers/peer-review-token-incentives.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/peer-review-token-incentives.md) |
| Designing a blockchain-based information system for procurement processes - Balancing decentralization, scalability, and security while maintaining privacy | Yes | Yes | [Publication](https://doi.org/10.1016/j.is.2026.102723) | `papers/procurement-is-trilemma.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/procurement-is-trilemma.md) |
| Digging for Quality Management in Production Systems: A Solution Space for Blockchain Collaborations | No | Yes | [Publication](https://aisel.aisnet.org/icis2022/blockchain/blockchain/15) | `papers/quality-management-production.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/quality-management-production.md) |
| Blockchain to Rule the Waves - Nascent Design Principles for Reducing Risk and Uncertainty in Decentralized Environments | No | Yes | [Publication](https://aisel.aisnet.org/icis2017/HCI/Presentations/12) | `papers/rule-the-waves-shipping.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/rule-the-waves-shipping.md) |
| And No One Gets the Short End of the Stick: A Blockchain-Based Approach to Solving the Two-Sided Opportunism Problem in Interorganizational Information Sharing | Yes | Yes | [Publication](https://doi.org/10.1287/isre.2022.0065) | `papers/short-end-opportunism-sharing.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/short-end-opportunism-sharing.md) |
| Striking a balance: Designing a blockchain-based solution to navigate coopetition dynamics in supply chain management | Yes | Yes | [Publication](https://doi.org/10.1007/s12525-025-00809-4) | `papers/striking-balance-coopetition.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/striking-balance-coopetition.md) |
| Trading Green Bonds Using Distributed Ledger Technology | No | Yes | [Publication](https://aisel.aisnet.org/ecis2023_rp/340) | `papers/trading-green-bonds-dlt.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/trading-green-bonds-dlt.md) |
| Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity | Yes | Yes | [Publication](https://doi.org/10.1016/j.dss.2024.114182) | `papers/trust-enabling-capacity-exchange.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/trust-enabling-capacity-exchange.md) |
| Unchaining Social Businesses - Blockchain as the Basic Technology of a Crowdlending Platform | No | Yes | [Publication](https://aisel.aisnet.org/icis2017/TransformingSociety/Presentations/8) | `papers/unchaining-social-crowdlending.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/unchaining-social-crowdlending.md) |
| An Architecture Using Payment Channel Networks for Blockchain-based Wi-Fi Sharing | Yes | Yes | [Publication](https://doi.org/10.1145/3529097) | `papers/wifi-sharing-payment-channels.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/wifi-sharing-payment-channels.md) |
| Yes, I Do: Marrying Blockchain Applications with GDPR | No | Yes | [Publication](https://hdl.handle.net/10125/79900) | `papers/yes-i-do-gdpr.md` | [View record](https://github.com/pradykst/dlt-dsr-library/blob/f60130386233cea97abd1227cddca651bc9e5747/knowledge/okf/papers/yes-i-do-gdpr.md) |
