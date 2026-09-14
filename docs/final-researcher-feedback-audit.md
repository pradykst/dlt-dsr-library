# Final internal-feedback release audit

Release branch: `fix/final-researcher-feedback`.

Baseline: `5cb0ee90fc4de4bf99b443101dc8685bef830af4` (`fix: finalize researcher release polish`). The checkout was clean before implementation, and the fetched deployment branch matched this baseline. The release uses the existing chat endpoint, conversation engine, picker, canonical map builders, and citation validators.

## Previous implementation and defects

The independent single-paper audit traced request parsing, canonical catalog lookup, complete-paper assembly, source allowlists, conversation resets, browser persistence, paper drawer, and full-chat handoff. Canonical paper slugs were already the correct identity; titles remain search/display metadata. The existing drawer and handoff correctly supplied the canonical paper ID.

Three pre-existing defects needed correction before extending scope:

- Unknown or deleted selected papers could fall back to corpus. Every selected ID now resolves server-side or the request fails closed, including map, synthesis, and guardrail turns. Invalid paper deep links return not-found.
- The browser changed persisted scope before the server could recognize a transition. It now resets active references on selection changes, marks messages with their evidence scope, and sends only history from that ordered scope. The server independently resets stale references and drops history on a scope mismatch.
- The previous complete-paper builder capped Markdown and could omit records at its limits. All 34 papers suffered Markdown truncation. The largest old serialized one-paper prompt was 64,963 characters. Complete selected-paper assembly now retains all canonical records, full descriptions, and canonical relationships, then measures the compact final prompt before any provider request.

The original kind detector primarily prioritized matching records; other kinds survived ranking, expansion, and structured context assembly. Explicit kinds now constrain corpus candidate search and graph expansion, then deterministically filter assembled evidence and returned sources. A final boundary check also covers diagram support IDs.

Browser acceptance found and fixed three additional presentation/routing gaps: featured homepage cards still used count-last labels; New chat was disabled with selected papers but no messages; and a typed multi-paper map request reached a generic connected-map fallback that could discard isolated principles. It now uses the canonical comparative map builder, with a regression for 13 principles and zero invented edges.

## Researcher-facing changes

- Workflow subtitle: “Inspect, compare, and reuse design knowledge from the library, then trace results back to the source publications.”
- Card 03: “Build evidence-grounded design proposals.” Its description distinguishes cited library knowledge from newly proposed concepts.
- Shared count labels use canonical kind names and pluralization, including `1 Design Principle`, `3 Design Principles`, `10 Design Requirements`, and other represented kinds. The redundant card total was removed; ordering remains deterministic.
- Paper/concept views hide internal citation/provenance sections and technical metadata, while showing a clean clickable DOI where available. Raw canonical records, extraction provenance, and chat S1/S2 citations remain available internally.
- The dangling punctuation came from flattening the entire Markdown record, including bibliographic sections, into a bounded summary. The drawer now reads the concept narrative separately and presents DOI separately. No corpus punctuation was stripped or edited.
- The shared stored-map body uses a flex column and a vertically centered, wrapping title. Concept IDs, handles, colors, variable heights, and topology remain intact. Rendered text-center differences were about 0.525 pixels across the three checked nodes, with no text overflow.
- Checkbox: “Include a relevant diagram in the response.” Its tooltip explains stored maps and problem-specific DSR diagrams.
- Starter helper: “Selecting a card fills the composer with an editable example. Nothing is sent until you press Send.”

## Scope and evidence behavior

One canonical scope represents corpus or an ordered set of one to five paper IDs. Legacy `{type: "paper", paperId}` input normalizes into `{type: "papers", paperIds: [paperId]}`. Empty selection means corpus. IDs are unique in stable selection order; malformed sets and a sixth unique paper are rejected server-side.

The visible selector, `@`, and `/paper` reuse the same picker/resolver and append operation. Selected papers appear as removable, numbered title chips. Duplicates are disabled. At five, the picker says “You can select up to 5 papers.” Removing the final paper or choosing All papers returns to corpus. Enter, Escape, search, and focus restoration were exercised in the rendered browser.

The paper drawer remains locked to its one paper. New chat clears that drawer's conversation while retaining its paper. Open full chat preserves the canonical paper parameter, after which the researcher can add more papers. Main-chat New chat clears history/state and returns to All papers, including when no message has yet been sent. Reloading an explicit paper deep link intentionally reapplies that paper; a cleared ordinary `/chat` reload remains in corpus.

The selected set is the authoritative evidence boundary. Mentioning an unselected title does not replace or broaden it. Broaden through All papers or `/all`. On a changed ordered selection, prior concept/source IDs, comparison and structured-result references, pending clarification, proposal/problem state, and diagram references reset. Even an addition resets active references because paper ordinals and comparative/proposal referents may become ambiguous. Visible older messages remain readable but are excluded from the new scope's model history.

The context manifest maps paper ordinals 1–5 to canonical IDs, titles, and current source IDs. Comparisons use this selection order, including first-versus-second questions. Stored relationships stay within their papers; no cross-paper edges are inferred.

Explicit DP, DR, DF, MR, DO, DP+DF, and DR+DF queries intersect the selected-paper boundary with the requested kinds. Relationship questions can use both requested connected kinds. Generic design-knowledge queries, complete canonical maps, and ordinary synthesis retain their required layers. Corpus inventories retain paper-level evidence for truthful category-absence reporting. If the requested kind has no evidence, the response contains no sources and makes no provider call.

Synthesis continues to distinguish stored evidence from proposed topology, Problem from Artifact, and PRIMARY from SECONDARY relationships. Variable cardinality, many-to-many mappings, the strict DSR grammar, one bounded repair, and clarification fallback remain unchanged. The existing synthesis planner uses its established compact evidence snippets; full raw Markdown is retained by selected-paper retrieval, not newly sent in full to that planner.

## Context and performance measurements

Complete assembly includes every selected paper and associated concept, deduplicated by canonical ID, and all projected canonical relationships. Packing removes repeated bibliographic sections and pure link inventories only because identities, publication metadata, memberships, and canonical relationships are serialized separately. Unique link annotations remain; annotations are omitted only when they exactly repeat a retained description. Selected context is never shortened by dropping concepts or slicing Markdown.

The established 80,000-character context ceiling is unchanged. The guard evaluates the final escaped prompt, including question, selected-paper manifest, structured comparison information, and any active proposal block. An oversized selection returns an explicit remove/narrow error before moderation or generation. Five selected papers are supported, but five complete papers do not fit universally.

The following top-by-individual-size combinations use “Compare these selected papers.” (30 characters). The long-question column uses 2,000 characters. These are character measurements, not token counts.

| Largest papers selected | Context characters | Margin to 80,000 | With long question | Result |
| --- | ---: | ---: | ---: | --- |
| 1 | 22,005 | 57,995 | 23,975 | Fits |
| 2 | 41,133 | 38,867 | 43,103 | Fits |
| 3 | 57,098 | 22,902 | 59,068 | Fits |
| 4 | 71,752 | 8,248 | 73,722 | Fits |
| 5 | 86,302 | -6,302 | 88,272 | Rejected before provider calls |

The largest five are KYC, capacity exchange, bond-market tokenization, trust/loyalty, and marketplace interfaces. Their union has 144 records and 137 canonical relationships. A representative five replacing bond-market tokenization with blockchain/IoT fits at 79,073 characters (927 remaining); with a 2,000-character question it reaches 81,043 and is rejected. Different questions, escaping, and proposal state can change the size, so the actual request is always checked.

The configured runtime model is `gpt-5.6-terra`, with a published 1,050,000-token context window. The application's existing output setting remains 16,384 tokens. No runtime limit was increased. Ordinary text instructions total 4,276 characters and history remains bounded to eight messages of 2,000 characters each. Thus the capped text-context/history/instruction content totals at most 100,276 characters before the request envelope; characters must not be interpreted as tokens or subtracted from a token window to claim a token margin. Actual token usage was not captured.

For the rejected largest-five short-question sample, the serialized scope is 175 bytes, internal retrieval is 480,866 bytes, all 144 source cards total 73,165 bytes, and warm assembly measured 112.5 ms. The hypothetical JSON model-message payload with maximum history is 105,718 characters (107,688 with the long question); neither oversized case was sent. Repeated paper metadata and verbose relationship structures were compacted rather than repeated per source. The synthesis audit measured 44,717 input characters, 4,518 schema characters, and 3,743 instruction characters separately, without counting the transport envelope.

Browser session storage measured 30,278 characters after the typed-map and comparison turns, below its existing 100,000-character cap. Request size remains 96,000 bytes, question length 2,000 characters, model history eight bounded messages, and browser history 32 messages. Concurrency, kill switch, anonymous access, same-origin enforcement, and environment files are unchanged.

### All 34 individual paper contexts

Measured with “Explain the complete design knowledge.” These include full selected-paper narrative and canonical relationships. Source counts include the paper record. All fit the unchanged ceiling without dropped records or truncated Markdown.

| Canonical paper slug | Characters | Sources | Relationships |
| --- | ---: | ---: | ---: |
| `kyc-framework-ssi` | 22,015 | 26 | 16 |
| `trust-enabling-capacity-exchange` | 18,845 | 40 | 67 |
| `bond-markets-tokenization-tac` | 16,214 | 18 | 14 |
| `ambivalence-trust-loyalty` | 14,874 | 25 | 14 |
| `bemi-marketplace-interfaces` | 14,690 | 35 | 26 |
| `wifi-sharing-payment-channels` | 12,513 | 25 | 38 |
| `forgetting-blockchain-gdpr` | 11,550 | 8 | 6 |
| `unchaining-social-crowdlending` | 11,192 | 18 | 0 |
| `matchmaking-additive-manufacturing` | 11,090 | 25 | 12 |
| `cross-org-identity-ssi` | 10,195 | 13 | 0 |
| `procurement-is-trilemma` | 9,952 | 8 | 5 |
| `dissonance-dialogue-recall` | 9,816 | 20 | 28 |
| `msp-sustainability-circular` | 9,763 | 7 | 0 |
| `blockchain-iot-sensor-data` | 8,985 | 18 | 14 |
| `decentralized-procurement-logistics` | 8,638 | 12 | 6 |
| `consent-self-management-hie` | 8,634 | 16 | 16 |
| `nil-marketplace-fair-inclusive` | 7,141 | 11 | 8 |
| `trading-green-bonds-dlt` | 7,115 | 15 | 0 |
| `striking-balance-coopetition` | 6,931 | 12 | 12 |
| `kyc-ico-requirements` | 6,930 | 11 | 0 |
| `quality-management-production` | 6,927 | 13 | 10 |
| `drm-music-industry` | 6,901 | 11 | 13 |
| `gdpr-workflow-asylum` | 6,458 | 3 | 0 |
| `green-bond-reporting-dp` | 5,999 | 7 | 0 |
| `delivery-invoice-transparency` | 5,609 | 7 | 5 |
| `cross-org-workflow-objectives` | 5,517 | 11 | 0 |
| `gdpr-credential-verification` | 5,493 | 8 | 5 |
| `peer-review-token-incentives` | 5,459 | 7 | 4 |
| `short-end-opportunism-sharing` | 5,320 | 6 | 6 |
| `aligning-newsvendors-scoring-rules` | 5,197 | 4 | 0 |
| `certified-data-chats-used-cars` | 4,964 | 7 | 3 |
| `rule-the-waves-shipping` | 4,480 | 5 | 0 |
| `yes-i-do-gdpr` | 4,088 | 5 | 0 |
| `containers-shipping-sustainable` | 3,958 | 3 | 0 |

## Verification and final review

The full implementation gate passed: canonical validation, release readiness, base tests (21), chat tests (381), retrieval tests (20), UI tests (68), UI-copy tests (14), type checking, production build, and whitespace checks. Total: 524 passing tests, no failures or skips. The 20 new final-feedback cases are included in the chat gate and were also run directly. Existing affected scope, context, comparison, synthesis grammar/problem/artifact, citation/source-map coherence, natural ordering, and UI suites remain covered by the gate.

New behavioral assertions inspect parsed scopes, full canonical record content, relationships, candidate/result kinds, source ownership, serialized responses, missing-kind behavior, changed-scope history, and provider call counters. Updated older expectations reflect canonical multi-paper normalization and strict kind filtering; invalid-scope fallback expectations were replaced with fail-closed assertions.

Live acceptance passed:

| Case | Observed result |
| --- | --- |
| A: single-paper principles | Four blockchain/IoT principles, all from that paper |
| B: three-paper principle comparison | 13 principles across blockchain/IoT, KYC, and capacity exchange (4 + 3 + 6), selected evidence only |
| C: first versus second | Correct ordered interpretation of blockchain/IoT versus KYC |
| D: selected-paper synthesis | Validated 15-node, 20-edge draft spanning Problem, Requirement, Principle, Feature, Artifact, Evaluation, Outcome; 26 selected stored sources |

Case D used automatic diagram preference and returned a validated proposal draft; a visible diagram was not required by that preference. The harness checked that draft without repeating the provider call.

Exact provider requests across the entire acceptance effort: **28**, comprising **11 generation/response requests and 17 moderation requests**. Cases A–D used 13 (5 + 8). Browser-driven live requests used 15 (6 + 9), including investigation of the typed-map fallback and its successful correction. The final production browser run reused the three captured, verified live answers and made no additional provider calls. Development diagnostics were removed from replay bodies to match production response shape.

Real rendered Chromium acceptance passed home copy, all featured count badges, paper DOI/provenance, concept narrative, centered wrapped nodes, fit/zoom/fullscreen, paper-drawer QA, canonical handoff, adding a second paper, typed 13-principle maps in both orientations, and a cited three-paper table. Every Send caused exactly one chat POST. Picker checks passed at 1440×1000, 768×900, and 390×844: five visible title chips, individual removal, both command entry points, duplicate prevention, visibly blocked sixth paper, All papers, final removal, Enter/Escape/focus restoration, and viewport-safe placement without horizontal overflow. Screenshots were inspected and remain temporary.

The final production run had zero console errors, React warnings, hydration warnings, HTTP errors, or actionable failed requests. Thirty navigation-prefetch requests were cancelled with `net::ERR_ABORTED` during navigation; these are recorded separately from failures. Earlier development-only graph warnings did not recur in production. Local acceptance used a process-only localhost public-origin override; the same-origin guard and environment files remain unchanged.

The complete changed-file review covered every product function and caller, client/server scope schema, failure paths, state migration, final source boundaries, compact packing, comparative map filters, responsive controls, and changed test expectations. No release blocker remains. `knowledge/okf` has zero diff, canonical IDs and data are untouched, and no deployment/configuration files, temporary artifacts, extra backend, attribution, or new dependencies are included.

The release comprises 40 files including this audit. The single commit, committed-tree gate results, verified remote hash, and final clean status are reported in the delivery message after those operations complete. Only the feature branch is to be pushed; production deployment and outreach remain manual.

Remaining limitations are explicit: some five-paper combinations exceed the preserved context ceiling; changes of selection reset active proposal/referent state; semantic answers still require researcher assessment, particularly claims of absence, which concern curated records rather than the full source publications. No unresolved implementation defect was identified by the completed audit and acceptance checks. The release is suitable for review before manual deployment and external researcher outreach.
