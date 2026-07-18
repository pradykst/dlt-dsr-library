# Native OKF evaluation

Date: 2026-07-18

This document evaluates the isolated native OKF implementation as a candidate for eventually replacing the quarantined legacy system. It does not authorize route replacement, legacy deletion, migration, commit, or merge work.

## Evaluation method

Four kinds of evidence are deliberately kept separate:

1. Deterministic checks cover parsing, graph construction, retrieval, corpus overview calculations, no-match behavior, source allowlists, citation IDs, diagram structure, and production packaging.
2. Mocked model checks cover transport behavior, source-citation allowlisting, prompt-injection handling, refusal/error handling, repair limits, and structured diagram acceptance or rejection without making a paid request.
3. Existing live evidence comes only from the completed Phase 4.6 production runs for peer-review incentives, product fragmentation, and source-to-sink certification.
4. Researcher judgement covers whether the saved live synthesis is useful design input and whether its assumptions and limitations are adequate for a new DSR project.

Automated passes are not treated as objective answer-quality scores.

The repeatable runner is `scripts/evaluate-native-okf.ts`. It is offline-only for Phase 5 and rejects live flags, so it neither inspects OpenAI configuration nor exports source material. Phase 5 used deterministic retrieval plus mocked OpenAI responses and saved structured diagram fixtures. Results are written under the ignored `artifacts/native-okf-evaluation` directory.

Zero additional OpenAI requests were made during Phase 5 for cost control. The production OpenAI path had already been validated in Phase 4.6 with peer-review, product-fragmentation, and source-to-sink queries.

Live OpenAI calls were skipped for cost control. The production OpenAI path had already been validated in Phase 4.6 using peer-review, product-fragmentation and source-to-sink queries.

Evidence is assigned as follows:

- Cases 1-4, 8, and 11 combine deterministic retrieval or grounding checks with mocked model-response checks.
- Cases 5, 7, and 13 combine deterministic retrieval and validation with existing Phase 4.6 live production evidence.
- Cases 6, 9, 10, and 12 are fully decided by deterministic graph, corpus-overview, or no-match behavior and do not require model generation.
- Researcher judgement is stated separately where answer usefulness, comparison quality, or synthesis quality cannot be proven by structural validation.


## Architecture evaluated

The implemented path is:

Canonical knowledge/okf Markdown bundle
-> native UTF-8 parser and validator
-> in-memory directed graph and repository
-> MiniSearch lexical retrieval
-> bounded incoming/outgoing graph expansion
-> deterministic corpus overview and context limits
-> deterministic S1, S2, ... grounded source mapping
-> OpenAI Responses API without tools
-> citation validation and optional repair
-> Structured Outputs diagram generation
-> strict diagram source and structure validation
-> deterministic ELK layout and React Flow rendering

The stored native graph is separate from the generated decision-support diagram. Stored graph nodes and edges come only from concept files and Markdown links. Generated diagrams remain structured synthesis with explicit source paths and synthesis flags.

## Model and configuration evidence

- The official OpenAI Node SDK is version 6.48.0 and the server integration uses the Responses API with tools disabled and storage disabled where supported.
- The deployed model is selected only through `OPENAI_MODEL`; application modules do not hardcode a model.
- Phase 5 did not inspect the configured model name or any OpenAI credential. Mocked tests use the explicit non-production name `mock-model`.
- The production path had already succeeded in Phase 4.6 with bounded retries, request timeout, reasoning effort, text-token limits, and the 4096-token diagram floor.
- Moderation remains optional and environment-controlled; its enabled, flagged, and error paths are tested with mocks.


## Native bundle validation

- OKF version: 0.1
- Markdown files: 245
- Reserved files: 4
- Concepts: 241
- Papers: 34
- References: 2
- Design principles: 115
- Design features: 42
- Design objectives: 20
- Design requirements: 15
- Meta-requirements: 10
- Design goals: 3
- Internal links: 585
- External links: 0
- Broken-link warnings: 0
- Fatal validation errors: 0

## Deterministic test matrix

### 1. Tokenization

Result: pass.

Confidence was 0.7888. The leading seed was design-knowledge/peer-review-token-incentives-df1. The bond-markets paper ranked as a lexical seed, and papers/peer-review-token-incentives entered through graph expansion. The final context also contained the relevant peer-review principles and genuinely matching token-related records. This keeps tokenization represented as producer-defined knowledge with its native type instead of forcing it into a principle category.

Shared mocked grounding controls: pass. Allowlisted citations resolve and invented IDs are removed; the deterministic records preserve the native distinction between features, principles, and papers. These controls are not a new tokenization-specific prose sample. Researcher judgement: the retrieved mix is sufficient for a grounded natural answer, while Phase 5 makes no new claim about live prose quality.

### 2. Privacy

Result: pass.

Confidence was 0.7935. Retrieval covered the Blockchain for the IoT paper, consent self-management DP3, privacy-preserving external storage, procurement privacy principles, GDPR-related design knowledge, and decentralized-procurement privacy. The selected context supports distinguishing owner or patient control, off-chain/private storage, confidentiality, and GDPR-oriented mechanisms rather than collapsing them into one privacy mechanism.

Shared mocked grounding controls: pass. Allowlisted citations resolve and an invented source ID is rejected; no privacy-specific model response was generated in Phase 5. Researcher judgement: the deterministic source mix supports a useful comparison of owner-controlled disclosure, private or off-chain storage, confidentiality, and GDPR mechanisms without asserting an invented principle.

### 3. Trust comparison

Result: pass.

Confidence was 0.8235. The two exact paper concepts ranked first and second:

- papers/trust-enabling-capacity-exchange
- papers/short-end-opportunism-sharing

Their linked principles and the short-end paper requirements were retained in final context. This is sufficient context for a comparative answer rather than two disconnected summaries.

Shared mocked grounding controls: pass. Citation validation accepts allowlisted paper and concept sources and removes unknown IDs; there is no new trust-specific comparative model sample. Researcher judgement: the deterministic context is adequate for mechanism-by-mechanism comparison, although Phase 5 did not purchase a fresh phrasing sample.

### 4. Interoperability

Result: pass.

Confidence was 0.6262. Retrieval included consent self-management, cross-application recall interoperability, additive-manufacturing matchmaking interfaces, coopetition interoperability, GDPR-related design knowledge, and green-bond reporting. Multiple paper families were present, so the model need not force a single definition.

Shared mocked grounding controls: pass. Saved fixtures prove allowlisted source handling generically; no interoperability-specific model response was generated in Phase 5. Researcher judgement: the retrieved paper families support several distinct interoperability forms and should be described separately rather than treated as one universal definition.

### 5. Principle-to-feature traversal

Result: pass.

Confidence was 0.7990. Final context contained:

- design-knowledge/blockchain-iot-sensor-data-dp1
- design-knowledge/blockchain-iot-sensor-data-df1
- design-knowledge/blockchain-iot-sensor-data-df3
- design-knowledge/blockchain-iot-sensor-data-df6
- design-knowledge/blockchain-iot-sensor-data-dr1
- papers/blockchain-iot-sensor-data

The graph tests independently verify that DP1 links to its paper, DR1, DF1, DF3, and DF6.

Existing live evidence: the Phase 4.6 production answer and six-node, seven-edge flow represented DP1, DR1, DF1, DF3, and DF6 with valid source paths. It stayed compact and did not add empty generic stages merely to reach the preferred node range.

### 6. Paper graph

Result: pass.

The evaluation uses getGraphViewModel for papers/blockchain-iot-sensor-data at one hop, not the generated-diagram path. It produced 19 native concept nodes and 58 directed Markdown-derived edges. There is no synthesis field or generated node model in this graph.

Production rendering also showed 19 React Flow nodes and exposed no absolute filesystem path.

### 7. Peer-review flow

Retrieval result: pass.

Confidence was 0.5130. The paper, three principles, and three features were selected.

Existing live evidence: the Phase 4.6 production run produced a grounded 11-node, 14-edge flow, explicit stored-versus-synthesis styling, valid source paths, no ASCII duplicate, and a fully fitted diagram. Researcher judgement found it concise and usable as a decision-support flow.

### 8. Patient consent

Result: pass.

Confidence was 0.7991. The consent paper and DP1 through DP5 were selected near the top, together with defensible SSI and quality-management context. The native sources support privacy, patient self-management, auditability, and interoperability claims. The grounding prompt prohibits unsupported medical advice and outside facts.

Shared mocked grounding controls: pass. Grounded source IDs remain allowlisted and the central prompt forbids outside facts; no patient-consent-specific model response was generated in Phase 5. Researcher judgement: the selected native concepts support a library summary of self-management, privacy, auditability, and interoperability, but not clinical or personal medical advice.

### 9. Corpus-wide absence query

Result: pass.

The deterministic overview contains all 34 papers. Twenty-nine papers have zero linked concepts whose native type is design-requirement; five have at least one. This calculation uses dynamic native type counts and does not assume every paper follows a fixed DSR schema. Full paper bodies are not needed for the corpus-wide calculation.

The exact 29-paper set is recorded in artifacts/native-okf-evaluation/latest.json.

### 10. No-match

Result: pass.

Confidence was 0.24, final detailed context was empty, insufficientContext was true, and the no-match tripwire recorded zero model calls. The production POST route returned zero sources, no diagram, and the warning No model request was made.

### 11. Prompt injection

Deterministic grounding controls: pass.

The lexical query is not a no-match because common library terms retrieve native context. This correctly exercises the system-level injection defense rather than relying on no-match detection. The central prompt treats all OKF source blocks as untrusted reference data, disallows outside knowledge and invented papers, and allows only supplied source IDs. Invented citation IDs are removed by deterministic validation.

Mocked adversarial check: pass. The saved response follows the grounding boundary, invents neither papers nor source IDs, and unknown citations are rejected. This verifies the deterministic and mocked defense path; researcher judgement still treats model obedience as probabilistic rather than a proof for every future model output.

### 12. External current information

Result: pass.

Confidence was 0.24, final detailed context was empty, insufficientContext was true, and the tripwire recorded zero model calls. No web tool exists in the OpenAI request configuration.

### 13. Main benchmark

Retrieval result: pass.

Confidence was 0.5124. Lexical seeds included:

- design-knowledge/dissonance-dialogue-recall-dp4
- papers/quality-management-production
- papers/bemi-marketplace-interfaces
- papers/cross-org-identity-ssi
- design-knowledge/dissonance-dialogue-recall-df3
- papers/matchmaking-additive-manufacturing
- papers/aligning-newsvendors-scoring-rules
- papers/nil-marketplace-fair-inclusive

Graph expansion retained reusable knowledge for interoperability, standardized traceability and identifiers, confidentiality, SSI identity and reputation, reusable credentials, external storage, interface transparency, interorganizational storage, and recall interactions.

A prior production acceptance run generated a 12-node, 14-edge diagram that passed source-path, citation, and diagram validation. Every stored node used an allowlisted native path; synthesis nodes were explicit; all edge endpoints existed. The answer described a coherent cross-paper artifact direction, explicitly stated that it was new synthesis rather than an artifact already evaluated in the library, and included limitations and unresolved governance or evaluation assumptions. The diagram fitted completely at a readable 0.459 zoom.

Existing live evidence: the Phase 4.6 product-fragmentation production run is the model-output sample for this case. No additional source context was sent during Phase 5.

Researcher judgement: the saved output is useful as initial design input for a new DSR project because it explains why multiple source families contribute, separates retrieved knowledge from synthesis, and leaves validation, governance ownership, incentive compatibility, and deployment assumptions open for empirical work.

## Static hardcoding audit

The initial audit found one acceptance defect: ChatWorkbench contained four topic-specific starter questions. They referenced privacy, named trust papers, source-to-sink certification, and product identities across marketplaces. They were replaced with topic-neutral interaction patterns.

The re-audit found:

- Production topic or named-paper matches: zero.
- question.includes or query.includes branches: zero.
- Switches or conditionals on query text: zero.
- Named paper IDs in production modules: zero.
- Benchmark text only in retrieval tests, the evaluation fixture, and this evaluation documentation.
- Forbidden native runtime imports: zero.
- No hardcoded production source paths for named concepts or papers.

The evaluation fixtures intentionally contain benchmark questions and known concept IDs so retrieval behavior can be checked. They do not influence production retrieval or prompts.

## Source and diagram validation

Deterministic source validation provides:

- Stable S1, S2, ... mapping from selected native concepts.
- Citation-token parsing.
- Removal of unknown source IDs.
- Source cards only for valid cited IDs.
- One bounded citation repair attempt when required.
- No page-level evidence claims.

Diagram validation provides:

- Retrieved concept allowlist enforcement for every source path.
- Unique node IDs.
- Existing edge endpoints.
- Explicit synthesis flags.
- Required description, stage, order, category, and nullable group.
- Maximum 14 nodes and 20 edges.
- Connected compact structure.
- Duplicate-edge removal.
- One bounded repair attempt.

These checks prove allowlisting and structural integrity. They do not prove semantic entailment or research usefulness; researcher inspection remains necessary.

## Production verification

- Next.js 16.2.6 production build passed.
- The native library route rendered 34 papers, 205 design-knowledge concepts, and eight native types.
- The Blockchain for the IoT paper route rendered its native Workbench and 19-node stored relationship graph.
- The native chat route rendered one bounded question input, a diagram toggle, and only generic starter prompts.
- A production POST no-match request returned insufficient context, zero sources, no diagram, and No model request was made.
- The chat API output-file trace contains all 245 knowledge/okf Markdown documents.
- No absolute filesystem paths were exposed in the inspected pages.
- Phase 5 made no live OpenAI request; production-path evidence comes from the three completed Phase 4.6 cases and the Phase 5 production no-match tripwire.

## Automated verification

- Offline 13-case evaluator: zero deterministic failures, zero saved-fixture validation failures, and zero external model requests.
- Parser, graph, validation, and repository suite: 21 passed.
- Native Workbench and presentation suite: 14 passed.
- Search and retrieval suite: 20 passed.
- Mocked chat, citation, moderation, diagram, layout, viewport, isolation, and Phase 5 fixture suite: 67 passed.
- Native scoped TypeScript: passed.
- ESLint for native source, native routes, evaluator, and required Next.js configuration: passed.
- `git diff --check`: passed; only Windows line-ending conversion notices were emitted.
- Production build: passed; 38 application pages generated or registered.

## Repairs made during evaluation

- Removed benchmark- and paper-specific starter questions from production chat UI.
- Added knowledge/okf output-file tracing for /api/native-okf routes.
- Added diagram-viewport.test.ts to the aggregate native chat test command.
- Corrected the native example diagram output budget to the enforced 4096-token floor.
- Added the repeatable evaluation runner and ignored artifact directory.
- Included the evaluation runner in native scoped TypeScript checking.
- Hardened the Phase 5 runner to reject live flags without inspecting OpenAI configuration.
- Added saved citation and structured-diagram fixtures plus mocked Phase 5 acceptance tests to the aggregate native chat suite.

No parser, MiniSearch boost, retrieval ranking, graph expansion, no-match logic, source mapping, citation validation, moderation, or semantic diagram validation was changed.

## Known limitations

- The public chat API has no authentication, deployment quota, or rate-limit policy. This is an operational promotion decision because live calls incur cost.
- Moderation defaults to disabled and requires an explicit deployment decision.
- Citation validation proves source-ID allowlisting, not complete semantic entailment of every sentence.
- Diagram validation proves source and structural validity, not design quality.
- Model output remains nondeterministic; future model upgrades and deployment changes require sampled researcher review.
- The process cache expects immutable production bundle data or a server restart after changes.
- A model incapable of Responses Structured Outputs fails safely at request time rather than being capability-probed at startup.

## Recommendation

Current recommendation: **requires targeted fixes before canonical promotion**. The native implementation is functionally ready; the outstanding concerns are operational promotion controls rather than a known parser, retrieval, grounding, citation, diagram, or route defect.

The isolated implementation passes all deterministic parser, graph, retrieval, no-match, citation, diagram, viewport, TypeScript, lint, build, tracing, and production-route checks. Mocked model checks pass for citation allowlisting, prompt-injection boundaries, malformed and refused responses, moderation, timeout behavior, repair limits, and diagram source-path rejection. Existing Phase 4.6 production evidence covers all three diagram-heavy acceptance cases. The remaining work before moving canonical routes is narrow:

1. Add or choose production authentication, rate limiting, and quota enforcement appropriate to the deployment and its paid API budget.
2. Decide whether moderation is enabled in the target deployment.
3. Plan a controlled canary and researcher review whenever the configured model or prompt materially changes.
4. Obtain explicit approval before moving canonical routes or cleaning up any quarantined legacy code.

The native implementation should remain under `/native-okf` until those operational decisions and route-promotion approval are complete. No additional live matrix is required merely to complete this Phase 5 cost-controlled evaluation.
