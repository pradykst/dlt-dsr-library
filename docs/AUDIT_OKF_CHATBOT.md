# OKF Chatbot Audit

Audit date: 2026-07-13  
Scope: current working tree, including the uncommitted Gemini/provider changes already present before this audit  
Constraint observed: no runtime fix, refactor, UI change, OKF data change, or commit was made

## Executive summary

The retrieval and deterministic routing layers are mostly finding the right material. The failure is at the boundary between the deterministic plan, the LLM prompt, the accepted provider response, and the graph projection.

The highest-severity defect is that the active Gemini path accepts any nonempty Markdown as a successful answer. It does not inspect Gemini's `finishReason`, validate required sections, detect prompt/context commentary, reject quote-only answers, or ground the returned prose against the selected papers and moves. A live reproduction of the reported query returned HTTP 200 with `finishReason: MAX_TOKENS`; the visible answer ended mid-paper-title, but the server still reported `Gemini 200 · synthesis used` and sent the fragment to the UI as the final answer.

The live failure was caused by an input that is called "compact" but is not compact: 91,547 characters / 23,138 prompt tokens. The nested AnswerPlan alone contributes about 68k characters and includes all 95 evidence records. Gemini used 2,397 hidden reasoning tokens from a 2,500 output-token budget, leaving only 99 visible tokens. The adapter ignores `MAX_TOKENS` and treats the incomplete 552-character fragment as success.

The reported prompt-leak form is equally explainable. Its opening sentence is an actual Short End DesignPrinciple copied into the prompt four times. The phrase `the prompt context has` does not occur in runtime code or OKF data; it is model-generated meta-commentary. The current scrubber passes that phrase unchanged, and the Answer tab deliberately prefers the unvalidated `llm_synthesis.answer_markdown` field.

The Flow tab is large because it is built from 96 retrieved concepts and their stored relation union, not from the six selected design moves. A final layer-ordered `slice(0, 56)` leaves 19 requirements, 18 principles, and 18 features while dropping every Artifact node. The UI then renders 55 visible nodes without confidence, match-strength, or selected-move filtering.

The deterministic reuse path also needs consolidation. It produces three different structures: six hard-coded thematic moves for the answer, eight independently ranked flow rows, and a 96-concept graph. Those structures are not guaranteed to describe the same design. Evidence mapping is weak: 30 evidence references across the six moves collapse to six unique IDs, one move has no evidence, and several moves cite evidence from papers not listed as supporting that move.

In short: Gemini is connected, but the system gives it an oversized, internally contradictory prompt and then discards the safety of the deterministic layer by accepting any nonempty output. The graph has the same architectural problem: it projects raw retrieval rather than the validated decision-support plan.

## Current request pipeline

The current target-query path is:

```text
POST query
  -> deterministic intent router
  -> deterministic QueryPlan (LLM planner skipped for this high-confidence query)
  -> OkfQueryPlan
  -> initial AnswerPlan
  -> deterministic source/concept/evidence selection
  -> a second, independent reuse selection pass
  -> flow rows + thematic design moves + raw FlowGraph
  -> warning-only pre-LLM validation
  -> oversized Markdown synthesis context
  -> Gemini generateContent
  -> nonempty-text check + regex scrub
  -> unvalidated answer_markdown
  -> API JSON
  -> Answer tab prefers answer_markdown; Flow tab renders the raw graph
```

### 1. API boundary

- Input: JSON body expected to contain `{ query: string }`.
- Output: `OkfChatResponse` serialized by `NextResponse.json`.
- Owner: `app/api/okf/chat/route.ts:6-13`, `POST`.
- Responsibility: deterministic request parsing and KB loading; final call to optional LLM synthesis.
- Failure modes:
  - invalid JSON becomes `{}` and returns 400 only when the query is empty;
  - Supabase can fail and silently fall back to local OKF data, changing the effective corpus;
  - the route does not perform final response validation after synthesis.

### 2. Query normalization and deterministic routing

- Input: raw user query plus `OkfKnowledgeBase`.
- Output: `OkfChatIntent`.
- Owners:
  - `lib/okf/chat.ts:27-29`, `routeOkfQuery`;
  - `lib/okf/query-interpreter.ts:21-46`, `detectDeterministicIntent`;
  - `lib/okf/policy.ts:161-168`, `normalizeText`.
- Responsibility: deterministic.
- Target result: `DESIGN_REUSE_FLOW_QUERY`, because the query requests a flow and a new application/problem (`query-interpreter.ts:35`).
- Failure modes:
  - broad substring/regex rules can conflate discovery, evidence, and design reuse;
  - normalization is used for matching, while the unnormalized query continues downstream;
  - domain vocabulary is embedded in code and can overfit known evaluation queries.

### 3. Deterministic QueryPlan

- Input: raw query, deterministic intent, KB.
- Output shape: `QueryPlan` from `lib/okf/query-planner.ts:21-34`.
- Owner: `buildDeterministicQueryPlan`, `query-planner.ts:60-78`.
- Responsibility: deterministic.
- Target result:
  - intent `DESIGN_REUSE_FLOW_QUERY`;
  - confidence `high`;
  - output `flow_graph`;
  - element types Requirement, Principle, Feature, Artifact;
  - themes `identity_credentials`, `integrity`, `governance_dispute`;
  - cross-paper, graph, and synthesis flags all true.
- Failure modes:
  - criteria include generic optional terms such as `build`, `application`, `data`, and `across`;
  - `requires_llm_synthesis` is recorded but is not the field used by provider dispatch.

### 4. Optional LLM query planner

- Input: raw query, deterministic base plan, known paper/type lists.
- Output: partial `QueryPlan` JSON, merged and validated against allowed values.
- Owners:
  - dispatch: `query-planner.ts:53-57`;
  - eligibility: `query-planner.ts:110-118`;
  - Gemini request: `lib/llm/gemini.ts:86-109`;
  - merge/validation: `query-planner.ts:179-204`.
- Responsibility: LLM classification only; it should not choose facts or sources.
- Target behavior: skipped because deterministic confidence is high (`query-planner.ts:111`). The capture contains one Gemini network call, for synthesis only.
- Failure modes:
  - medium/low-confidence plans can add broad themes and criteria;
  - Gemini planner is disabled in tests unless explicitly enabled, but the Groq planner lacks the same test-run guard;
  - later reuse construction reruns selection from the raw query and does not reliably consume planner refinements.

### 5. OkfQueryPlan analysis

- Input: query, validated `QueryPlan`, KB.
- Output: `OkfQueryPlan` with target paper, requested types, criteria, task type, and answer shape.
- Owner: `lib/okf/chat.ts:30-47`, `analyzeOkfQuery`.
- Responsibility: deterministic.
- Failure modes:
  - extracted criteria and planner criteria are unioned, so broad terms accumulate;
  - no relevance thresholds are attached to requested themes.

### 6. Initial AnswerPlan

- Input: query, `OkfQueryPlan`, KB.
- Output shape: `OkfAnswerPlan` at `lib/okf/chat.ts:17`.
- Owner: `buildAnswerPlan`, `chat.ts:76-104`.
- Responsibility: deterministic.
- Contents: selected papers, paper matches, extraction items, evidence pack, constraints, things-to-avoid, and synthesis policy. Design moves and flow rows are initially empty.
- Failure modes:
  - the initial plan can already contain dozens of concepts/evidence items;
  - source selection and concept selection are repeated later rather than making this plan authoritative.

### 7. Source-paper ranking

- Input: query, criteria, KB.
- Output: ranked `OkfPaperSupport[]` with paper ID, title, static reason, and numeric score.
- Owner: `lib/okf/policy.ts:39-76`, `selectPolicySourcePapers`.
- Responsibility: deterministic.
- Score components: full-paper text hits, theme hits/profile boosts, requested type coverage, relation connectivity, forced-paper boost, and policy adjustment.
- Failure modes:
  - the entire paper, all concepts, and all evidence are one haystack, so a weak mention can activate a paper;
  - broad product-reuse logic forces five paper IDs with boosts from 300 down to 280 (`policy.ts:175-180`);
  - the human-facing reason is static profile text, not a score explanation;
  - `strong`/`partial` classification is computed separately and does not gate reuse retrieval.

### 8. Concept selection

- Input: raw query, selected paper IDs, KB.
- Output: up to 96 `OkfConcept` objects.
- Owner: `lib/okf/reuse.ts:127-149`, `retrieveConcepts`.
- Responsibility: deterministic.
- Current behavior:
  - per paper, select up to three Requirements, Principles, and Features and two of several other types;
  - add global top 24;
  - expand one stored relation hop up to 96;
  - return type-ordered concepts.
- Failure modes:
  - requested flow shape does not constrain retrieval;
  - partial papers receive roughly the same per-type quota as primary papers;
  - generic matches and relation expansion dominate semantic fit;
  - a hard cap of 96 is treated as a target in this query.

### 9. Evidence selection

- Input: all selected concepts.
- Output: every linked evidence item as `OkfEvidenceRef`.
- Owner: `lib/okf/reuse.ts:346-350`, `evidenceForConcepts`.
- Responsibility: deterministic.
- Failure modes:
  - no per-move mapping at this stage;
  - no response-level relevance or size cap;
  - the target query returns 95 evidence items.

### 10. Flow-row construction

- Input: query, ranked papers, 96 concepts, 95 evidence items, KB relations.
- Output: eight `OkfReuseFlowRow` objects.
- Owners: `lib/okf/reuse.ts:151-230`.
- Responsibility: deterministic, with query-generated/mixed adaptations.
- Sources:
  - stored relation rows;
  - one best-per-type row per paper;
  - adjacent-paper synthetic rows.
- Failure modes:
  - row ranking is based mainly on paper rank, evidence count, and adaptation bonus, not row/query semantic similarity (`reuse.ts:204-230`);
  - mixed/query-generated rows receive a positive ranking bonus;
  - a paper row is called `stored` when it contains at least three concepts, even if no stored R→P→F chain connects them (`reuse.ts:179-185`);
  - relation rows do not filter predicate/scope (`reuse.ts:158-176`);
  - cross-paper connectivity means any one relation among the selected concepts, not a complete path (`reuse.ts:187-200`, `360-363`).

### 11. Design-move construction and deterministic answer

- Input: query, eight rows, source papers, evidence.
- Output: structured `DecisionSupportAnswer` and server-rendered Markdown.
- Owners:
  - `lib/okf/reuse.ts:65-87`, `buildFallbackAnswer`;
  - `reuse.ts:90-113`, `renderDecisionSupportMarkdown`;
  - `reuse.ts:254-290`, thematic moves/architecture.
- Responsibility: deterministic.
- Failure modes:
  - when five or more themes are detected, row-derived moves are replaced by product/domain templates;
  - the same text is used for `reused_requirement` and `reused_principle`, and the same target text for `candidate_feature` and `artifact_pattern`;
  - evidence is selected by paper-ID substring from whole rows, not by the concept/move relation;
  - `paperIdsFor` also uses substring matching, so `ssi` can match `PERMISSIONED` and attach HIE to an SSI move;
  - the answer moves, rows, and graph cease to be the same plan.

### 12. FlowGraph generation

- Input: query, all 96 selected concepts, eight rows, KB.
- Output: `OkfFlow` / `FlowGraph`.
- Owners:
  - call: `lib/okf/reuse.ts:37-38`;
  - builder: `lib/okf/flow.ts:30-98`.
- Responsibility: deterministic plus explicitly marked query-generated/mixed projection.
- Current behavior:
  - include all candidate stored relations among selected concepts;
  - include every primary flow type even when disconnected (`flow.ts:45`);
  - add row-derived paths and separate keyword-generated nodes;
  - link generated nodes to the stored node with the most evidence, not the best semantic match (`flow.ts:228-240`);
  - sort by layer/provenance and cap at 56 nodes (`flow.ts:80-82`, `271-273`).
- Failure modes: raw graph union, orphan generated nodes, incomplete paths after truncation, dropped Artifact layer, and no alignment with selected design moves.

### 13. Pre-LLM validation

- Input: deterministic `OkfChatResponse` and KB.
- Output: warning strings appended to the response.
- Owners:
  - `lib/okf/validator.ts:4-29`, `validateChatResponse`;
  - `lib/okf/chat.ts:426-441`, `validateAnswerPlanResponse`.
- Responsibility: deterministic.
- Failure modes:
  - checks are warning-only and do not block synthesis;
  - design-reuse plans have no completeness, evidence-consistency, graph-size, or source-strength validation;
  - validation happens before the LLM and is not rerun on the generated answer;
  - the prompt calls the plan "validated" even when only warnings were produced.

### 14. LLM provider dispatch

- Input: deterministic response and environment provider state.
- Output: deterministic response, mock response, Gemini response, or Groq response.
- Owner: `lib/okf/llm.ts:12-20`, `synthesizeWithOptionalLlm`.
- Responsibility: deterministic strategy selection, followed by optional LLM.
- Correct behavior: deterministic answer types skip live synthesis based on `answer_plan.synthesis_policy`.
- Failure modes:
  - `QueryPlan.requires_llm_synthesis` is not consulted;
  - the AnswerPlan is not validated before design-reuse synthesis;
  - provider success is allowed to replace a better deterministic answer.

### 15. LLM context construction

- Input: complete deterministic `OkfChatResponse`.
- Output: a JSON-like object later stringified into the user prompt.
- Owner: `lib/llm/groq.ts:79-142`, `buildMarkdownSynthesisContext`.
- Responsibility: deterministic data shaping.
- Failure modes:
  - embeds almost the full AnswerPlan, including all 95 `evidence_pack` records (`groq.ts:128-129`);
  - duplicates selected papers, evidence, concepts, rows, and moves in several top-level summaries;
  - ranks "top" concepts by graph membership, evidence presence, and extraction confidence rather than query/move relevance (`groq.ts:82-93`);
  - the huge raw graph makes weak concepts appear relation-relevant;
  - rewrites stored labels/evidence using `adaptSourceDomainLabel`, producing conflicting original and transformed text (`groq.ts:220-236`).

### 16. Gemini prompt and call

- Input: system instruction, free-form user instructions, stringified context.
- Output: Gemini `generateContent` JSON.
- Owners:
  - system prompt: `lib/llm/groq.ts:145`;
  - user prompt: `groq.ts:147-154`;
  - intent prompt: `groq.ts:163`;
  - network call: `lib/llm/gemini.ts:13-54`.
- Responsibility: LLM-driven synthesis.
- Failure modes:
  - no response MIME type/schema for synthesis;
  - free-form task/rules are mixed with an enormous internal JSON object;
  - the prompt tells the model to copy exact labels while the context contains rewritten versions;
  - `maxOutputTokens` includes hidden reasoning, but prompt size and finish state are not managed.

### 17. Response parsing and validation

- Input: Gemini response.
- Output: `answerMarkdown`.
- Owners:
  - `geminiText`, `lib/llm/gemini.ts:155-157`;
  - `scrubDefaultAnswerMarkdown`, `lib/llm/groq.ts:263-297`.
- Responsibility: deterministic parsing/sanitization.
- Actual contract: join text parts, require only pre-scrub nonempty text, run regex replacements.
- Failure modes:
  - ignores `finishReason` even though it is present in the local type;
  - no JSON/schema parse;
  - no required sections, grounding, leak phrase, quote-only, or source-logic validation;
  - scrub can turn an answer empty after the nonempty check;
  - naked-title removal requires at least two exact bare titles; one, annotated, bulleted/truncated, or mid-answer titles remain.

### 18. Final API response and UI rendering

- Input: synthesized `OkfChatResponse`.
- Output: rendered Answer/Flow/Evidence/Debug tabs.
- Owners:
  - Gemini assignment: `lib/llm/gemini.ts:56-76`;
  - Answer selection: `components/okf-chat/OkfChatWorkspace.tsx:195-199`;
  - Markdown renderer: `OkfChatWorkspace.tsx:202-212`;
  - Flow renderer: `OkfChatWorkspace.tsx:248-315`.
- Responsibility: deterministic UI rendering.
- Failure modes:
  - Answer tab prefers `llm_synthesis.answer_markdown` over the canonical `response.answer`;
  - all remaining lines are rendered as assistant prose;
  - Flow tab renders every visible R/P/F/Artifact node without server- or client-side relevance filtering;
  - backend provider metadata is split across fields, producing inconsistent badges.

## Redacted reproduction artifact

Local-only files were written under `.okf-cache/debug/` and were not committed:

- `.okf-cache/debug/repro-okf-audit.ts`
- `.okf-cache/debug/fragmented-product-data-repro.json`

The JSON artifact contains:

- QueryPlan;
- AnswerPlan;
- selected papers, concepts, and evidence;
- FlowGraph nodes and edges;
- compact context;
- exact system and user prompts;
- redacted Gemini request URL;
- raw Gemini response;
- parsed synthesis object;
- final frontend response JSON.

No environment values or API keys are recorded. The `key` query parameter is replaced with `[REDACTED]`.

### Reproduction environment

- Effective KB: local OKF fallback.
- Load reason: Supabase returned `PGRST303` / JWT issued in the future; the artifact stores the normalized clock-skew message, not credentials.
- Corpus: 9 papers, 443 concepts, 758 relations, 304 evidence items.
- Provider: Gemini.
- Model version returned: `gemini-3.5-flash`.
- Network calls: one synthesis call; the high-confidence optional query planner was skipped.

### Target-query capture

| Artifact | Captured value |
|---|---:|
| Selected papers | 6 |
| Retrieved concepts | 96 |
| Selected evidence | 95 |
| Flow rows | 8 |
| Deterministic design moves | 6 |
| FlowGraph nodes | 56 |
| FlowGraph edges | 41 |
| Compact-context JSON | about 90.5k characters |
| Exact Gemini user prompt | 91,547 characters |
| Prompt tokens | 23,138 |
| Hidden reasoning tokens | 2,397 |
| Visible completion tokens | 99 |
| Configured output-token cap | 2,500 |
| HTTP status | 200 |
| Finish reason | `MAX_TOKENS` |
| Raw/final visible answer | 552 characters, ending mid-title |

The raw response began with a plausible recommendation and a paper list, then ended at `* *Designing`. `gemini.ts` marked it successful because the text was nonempty. The final `answer` was byte-for-byte the raw fragment after trimming.

A separate local mocked-200 check passed the reported failure shape through the active adapter:

```text
Store sensitive data only with the information provider and create a proof of integrity for the recipient
(Note: the prompt context has conflicting labels.)
```

It was accepted verbatim as `provider=gemini`, `synthesis_mode=gemini`, with no validation warning. This proves the observed leakage does not need a transport or parsing bug; the current success path explicitly allows it.

## Root causes

Ranked by impact:

1. **No post-LLM AnswerGuard.** Any nonempty Gemini/Groq text becomes the final answer. `MAX_TOKENS`, missing sections, prompt commentary, quote-only text, unsupported claims, and raw internal language are not rejected.
2. **The "compact" context is a full internal dump.** A 23k-token prompt exhausts output budget, repeats concepts/evidence, and makes the LLM spend most of its work recovering the intended task.
3. **AnswerPlan is not authoritative.** Source selection/retrieval is rerun, and the answer, flow rows, and graph are built from different structures.
4. **FlowGraph projects raw retrieval, not selected design moves.** All primary-layer concepts enter the graph; a late layer-sorted cap creates a large and semantically incomplete graph.
5. **Stored data and target-domain adaptation are mixed and mutated.** The context rewrites labels/evidence while also including originals and instructing exact copying.
6. **Paper strength and move/evidence grounding do not constrain downstream data.** Forced boosts dominate ranking, partial papers receive equal expansion, and evidence/paper invariants are absent.
7. **The renderer and provider metadata amplify the defect.** UI prefers the unvalidated synthesis field; success status lives in a different field from header status; `none` defaults to a Gemini label.

## Evidence from code

### Active output contract is inconsistent

The repository currently contains three contracts:

| Path | Prompt asks for | Parser | Canonical payload behavior |
|---|---|---|---|
| Gemini success | Markdown | nonempty string + regex scrub | overwrites `answer`; leaves deterministic `answer_payload` unchanged |
| Groq success | Markdown | nonempty string + regex scrub | same as Gemini |
| Gemini/Groq fallback | structured deterministic answer rendered to Markdown | deterministic | updates `answer_payload` to fallback mode |
| Legacy Featherless | strict JSON | JSON + Zod | structured answer rendered server-side |
| Mock | deterministic Markdown with a header | none | wraps deterministic answer |

The strict schema exists at `lib/llm/prompts/dsrReuseSynthesis.ts:36-55`, and the JSON-only prompt at lines 51 and 113-118, but the active Gemini path imports the Markdown prompt/context from `lib/llm/groq.ts` (`lib/llm/gemini.ts:4`). The only active strict-JSON consumer is the now-unregistered Featherless adapter.

`fallback_validation_error` exists in `lib/okf/schema.ts:243-245`, provider fallback routing, and UI labels, but no active provider produces it.

On live success, `llm_synthesis.synthesis_mode` is `gemini` while `answer_payload.synthesis_mode` remains `structured_okf_answer`. The response therefore contains two contradictory answer representations.

### Existing validation does not protect the final answer

`validateChatResponse` verifies known IDs and basic graph/card references (`lib/okf/validator.ts:4-29`). `validateAnswerPlanResponse` checks selected IDs, named-paper isolation for extraction, stored support for `DSR_FLOW_QUERY`, and raw IDs in the deterministic answer (`lib/okf/chat.ts:426-441`). Both only append warnings.

No current final-answer validation enforces:

| Required check | Current state |
|---|---|
| final answer nonempty after scrub | absent |
| acceptable provider finish reason | absent |
| not only one quoted concept | absent |
| no `prompt context`, `system prompt`, `I will use`, or internal-note commentary | absent |
| required intent sections | absent |
| 5-7 grounded design moves for design reuse | absent |
| relevant source-paper logic | absent |
| no raw evidence/concept/paper IDs | regex substitution only; no rejection |
| no naked title tail | partial regex/UI heuristic only |
| evidence and paper references belong to AnswerPlan | absent |
| answer/graph/move consistency | absent |

### Instructions and data are mixed

The Gemini API correctly places `markdownSystemPrompt` in `systemInstruction` and the rest in a user message. The problem is inside that user message. `markdownUserPrompt` concatenates:

1. an intent-specific command;
2. AnswerPlan rules;
3. domain-adaptation rules;
4. the label `Validated AnswerPlan and compact OKF context:`;
5. one enormous stringified internal object.

That object contains user data, selected evidence, UI/debug-like internal fields, constraints, `things_to_avoid`, `synthesis_policy`, `adaptation_text`, `query_generated_notes`, source IDs, evidence IDs, and duplicate summaries. These are not separated into a small task schema with explicit trust boundaries.

The recommended shape is:

```json
{
  "task": "synthesize_design_reuse_flow",
  "user_question": "...",
  "retrieved_context": {
    "selected_moves": ["5-7 validated move objects"],
    "source_roles": ["only sources used by those moves"],
    "evidence_by_move": ["small, exact, immutable snippets"]
  },
  "answer_requirements": {
    "required_sections": ["..."],
    "forbidden_content": ["raw IDs", "prompt commentary"]
  }
}
```

No free-floating comments should be stored beside evidence. Stored labels and excerpts must remain unchanged; target-domain adaptation should be a separate field.

### Context selection is not query/move relevant

`buildMarkdownSynthesisContext` scores a concept using graph membership, evidence presence, and extraction confidence (`lib/llm/groq.ts:82-93`). Because the graph contains most selected concepts and most have evidence, scores tie and fall back to paper/title order.

For the target query, the global context therefore prioritizes:

- requirements: two Blockchain IoT and one HIE;
- principles: three Blockchain IoT;
- features: one Blockchain IoT and two HIE;
- relation paths: the first three Blockchain IoT edges.

This is not aligned with the top-ranked Short End and SSI roles or the six design moves.

`adaptSourceDomainLabel` (`lib/llm/groq.ts:220-236`) makes the conflict worse by replacing:

- `sensor` with `source`;
- `patient` with `authorized user`;
- `provider` with `authorized organization`;
- `HIE` with `authorized network`;
- `consent` with `permission`;
- `tender` with `transaction`;
- `KYC` with `credential`.

The generic Short End phrase `information provider` becomes the malformed `information authorized organization`. The prompt contains both versions while telling Gemini to copy labels exactly.

## Why Gemini output leaked prompt/context

The first line in the observed output is not a leaked system instruction. It is a stored Short End DesignPrinciple:

- `library/okf/papers/short-end-stick-2025/dsr.md:77`.

It is repeatedly injected through:

- `retrieveConcepts` (`lib/okf/reuse.ts:127-149`);
- row construction (`reuse.ts:151-201`);
- AnswerPlan attachment (`lib/okf/chat.ts:443-447`);
- full AnswerPlan context (`lib/llm/groq.ts:128-129`);
- compact move candidates (`groq.ts:141`).

The exact concept title appears four times in the captured compact JSON. A generation can therefore begin by copying it instead of writing a recommendation.

The parenthetical `the prompt context has ...` phrase is not present in the repository. It is Gemini meta-commentary encouraged by:

- explicit references to "AnswerPlan" and "compact OKF context" in the prompt;
- raw internal field names such as `design_moves`, `flow_rows`, `things_to_avoid`, and `evidence_pack`;
- duplicate original, adapted, and clipped labels;
- contradictory instructions to copy exact text and adapt source-domain labels;
- a prompt so large that the model can lose the requested output structure;
- no guard preventing meta-commentary from becoming the final answer.

The backend scrubber does not check `prompt context`, `Note:`, `I will use`, `design moves/flow rows`, or similar language. The UI then renders the result faithfully. The UI does not directly read Debug context into the Answer tab; the leak is model output accepted by the backend.

## Source-paper ranking audit

### Captured ranking

| Paper/role | Score | Forced boost | Match strength | Audit judgment |
|---|---:|---:|---|---|
| Short End / commercial-data privacy | 450 | 300 | partial | highly relevant; should be primary for integrity, manipulation resistance, provider-held sensitive data, and joint governance |
| SSI/KYC / identity credentials | 432 | 295 | strong | highly relevant; should be primary for issuer-holder-verifier, proof, and revocation/status |
| Trust Capacity / trust-reputation | 412 | 290 | partial | relevant for screening, reputation, authority/fairness; should support selected governance/trust moves |
| Blockchain IoT / tamper-resistant evidence | 380 | 285, then -25 adjustment | partial | relevant for hybrid raw/off-chain data and hash/certification architecture |
| Integrated ISDM / implementation lifecycle | 364 | 280 | partial | conditional; useful when build/process/lifecycle guidance is explicitly part of the answer, not automatically for every product query |
| HIE Consent / permissioned status sharing | 126 | 0 | partial | weak/conditional here; should enter only when permission, audit, status history, or consent/interoperability is a selected move |

NIL/NFT, Peer Review token incentives, and Newsvendor do not dominate; policy penalties drive them below zero for this query. That part is working.

### Ranking defects

- Product-reuse forcing (`lib/okf/policy.ts:179-180`) dominates the numeric score and makes the ranking appear more empirical than it is.
- Static reason strings (`policy.ts:25-35`) do not explain actual score components.
- Only SSI is `strong`; all other selected papers are `partial`, but all six receive large concept/evidence quotas.
- `buildReuseFlowResponse` reruns source selection without consuming the first AnswerPlan and its match-strength classification (`lib/okf/reuse.ts:32-40`).
- `sourceRoles` drops `match_strength` (`reuse.ts:331-337`).
- `answerPlanPrimaryPaper` does not fully align with the theme profiles (`lib/okf/chat.ts:591-602`), so expected primaries can still be labeled partial.
- Whole-paper haystack scoring means HIE matches generic `fragmented` and identity text even though its domain is not requested.

The ranking order is broadly sensible. The architectural failure is that rank/strength is not used to limit concepts, evidence, context, or graph nodes.

## Why the flow graph is too large

The graph is not a design-support projection. It is the union of six paper subgraphs plus row-derived and keyword-generated links.

For the target query:

- selected concepts by paper: 15-17 each;
- candidate base graph before additions: about 93 nodes and 91 stored relations;
- final cap: 56 nodes / 41 surviving edges;
- final layers: Problem 1, Requirement 19, Principle 18, Feature 18;
- node provenance: 53 stored, 3 query-generated;
- edge provenance: 38 stored, 2 mixed, 1 query-generated;
- visible UI nodes: 55, because the UI hides only the Problem layer.

The direct causes are:

1. `retrieveConcepts` fills a 96-concept set using per-paper quotas and relation expansion (`lib/okf/reuse.ts:127-149`).
2. `buildOkfFlow` includes every primary flow type even when not connected (`lib/okf/flow.ts:45`).
3. It adds all stored candidate relations among those nodes (`flow.ts:32-42`, `66-69`).
4. It adds eight row-derived paths (`flow.ts:71`, `131-177`).
5. It independently adds keyword-generated product nodes (`flow.ts:72`, `179-225`).
6. It connects generated nodes by evidence-count heuristic (`flow.ts:228-240`).
7. Only after all additions does it sort by layer and take the first 56 (`flow.ts:80-82`, `271-273`).

Because Requirements, Principles, and Features sort before Artifacts, every Artifact/Evaluation/Output node is lost. Five query-specific specs are created, but only two query-generated Requirements survive; their source nodes/edges are truncated, so they appear orphaned.

The UI correctly distinguishes stored solid edges, mixed dotted edges, and query-generated dashed edges (`OkfChatWorkspace.tsx:284-305`, `341-350`). It does not cause the bloat, but it renders the entire server graph without a relevance filter.

## Stored paper flows versus query-generated flows

### What works

Paper-specific `DSR_FLOW_QUERY` uses `mode: stored_paper_flow`, `storedOnly: true`, and stored OKF relations (`lib/okf/chat.ts:348-364`). Existing tests confirm:

- all edges have stored provenance and relation IDs;
- no generated Requirement→Requirement chain appears;
- Blockchain IoT recommended nodes are present.

That deterministic relation integrity should be preserved.

### What does not match Workbench

The chatbot does not share Workbench's Main Flow selection semantics.

- Workbench filters `diagram_include === true`, `diagram_view === "Main"`, and Requirement/Design Principle/Design Feature endpoints (`components/workbench/WorkbenchFlow.tsx:66-84`).
- The OKF chatbot parser reads markdown and `relations.yaml`; it does not load per-paper `graph.json` as a display contract (`lib/okf/parser.ts:53-57`, `160-191`).
- Chatbot flow schema/retrieval does not carry Workbench diagram metadata (`lib/okf/schema.ts:80-89`, `lib/okf/retrieval.ts:40`, `51`).

For the Blockchain IoT example, the chatbot returns 30 nodes and 40 stored edges, while local `graph.json` has 20 nodes and a five-node `recommended_main_flow`. Current tests validate the generic stored relation union, not exact Workbench Main Flow parity.

Recommended boundary:

- stored paper flow: a shared, approved stored-flow adapter compatible with Workbench display metadata;
- query/mixed reuse flow: a separate projection from 5-7 validated design moves;
- full relation union: Debug only.

## Deterministic versus LLM responsibilities

### Boundaries that work

- Stats, overview, coverage, exact extraction, paper discovery, stored flow, evidence, lifecycle, negative/existence, and clarification normally carry `synthesis_policy: deterministic` and skip live synthesis (`lib/okf/llm.ts:55-60`).
- Reuse-specific provider failure builds a type-specific structured fallback (`lib/llm/gemini.ts:112-134`, `lib/llm/groq.ts:177-199`).
- Mock provider synthesis is offline and tests prove it does not fetch.
- Gemini planner is suppressed during tests unless `GEMINI_LIVE_TEST=true` (`lib/okf/query-planner.ts:110-135`).

### Boundaries that are blurred

- Design-reuse synthesis runs after warning-only validation; there is no validated-plan gate.
- Gemini is nominally asked to polish/synthesize, but free-form Markdown permits it to choose emphasis, facts, and structure again.
- Successful LLM output replaces the deterministic answer instead of producing a validated presentation of the same plan.
- `QueryPlan.requires_llm_synthesis` is not used by provider dispatch; `answer_plan.synthesis_policy` is a separate control.
- The reuse builder reranks/retrieves after planning, so the optional planner does not control final facts consistently.
- Groq planner does not have the same test-run network guard as Gemini.
- Live provider tests inject already-good output; they do not test malformed nonempty success responses.

The correct responsibility is: deterministic code selects facts, moves, evidence, and graph; the LLM may only transform a validated small plan into readable prose; deterministic validation decides whether that prose may replace the fallback.

## UI and provider-state audit

### Why source-title tails/internal context appear

- Backend tail scrubbing removes a recognized source section or at least two consecutive exact bare paper titles (`lib/llm/groq.ts:263-297`).
- UI repeats a similar at-least-two-title heuristic (`OkfChatWorkspace.tsx:434-445`).
- A single title, an annotated title, a truncated title, or a title embedded in an incomplete bullet remains.
- Answer tab prefers `llm_synthesis.answer_markdown` (`OkfChatWorkspace.tsx:195-199`).
- Debug context itself is confined to Debug (`OkfChatWorkspace.tsx:368-373`); it appears in Answer only when the LLM echoes it.

### Provider metadata inconsistencies

| State | Current behavior | Problem |
|---|---|---|
| Gemini 200 | status 200 stored in `llm_synthesis.provider_metadata`; runtime marks connected/mode but omits status | Answer badge can show `Gemini 200`; header can show only `· synthesis used` |
| Groq 200 | same split | same header defect |
| Gemini 429/503 | fallback mode, connected true, status/error on runtime | `connected` means reachable, not synthesis succeeded; UI must distinguish |
| validation failure | schema/UI mode exists | no producer; malformed 200 is reported as success |
| deterministic answer with configured provider | no request, but `provider_connected` is set equal to configured | claims connection without a connection attempt |
| passive health | configured true, connected false, `ok` true | differs from deterministic chat metadata |
| mock | success status can live only in synthesis metadata | same header-status split |
| provider `none`/unknown | UI `providerLabel` defaults to Gemini | deterministic no-provider answers are mislabeled |

Relevant code:

- health contract: `app/api/health/llm/route.ts:22-49`;
- deterministic runtime marking: `lib/okf/llm.ts:74-81`;
- Gemini success metadata: `lib/llm/gemini.ts:56-75`;
- Groq success metadata: `lib/llm/groq.ts:50-69`;
- header status selection: `OkfChatWorkspace.tsx:126-137`;
- Answer badge status fallback: `OkfChatWorkspace.tsx:223-231`;
- success-label bug: `OkfChatWorkspace.tsx:485-494`;
- provider default: `OkfChatWorkspace.tsx:513-517`.

Provider status should have one canonical server contract: provider, configured, reachable, attempted, HTTP status, outcome, and fallback reason. UI labels should derive from that contract only.

## Hardcoding audit

Searches were run for:

- `cross-marketplace product identity`;
- `fragmented product data`;
- `verified-purchase`;
- `which paper has tokenisation`;
- `How many papers are in the OKF library`;
- long expected-answer fragments.

No full failing query, full product-identity query, tokenisation query, or stats query is special-cased in runtime code. The long query appears in `tests/okf.test.ts:184` and `scripts/smoke-okf-query.ts:1`, which is acceptable.

However, runtime behavior is substantially tailored to the benchmark domain:

- fixed fragmented-product/cross-marketplace/verified-purchase nodes: `lib/okf/flow.ts:205-225`;
- fixed canonical-product, seller-history, review-gate, and hybrid-architecture prose: `lib/okf/reuse.ts:277-290`;
- fixed product-reuse paper force list: `lib/okf/policy.ts:175-180`;
- fixed product adaptation targets: `lib/llm/groq.ts:205-217`.

This is not exact-string hardcoding, but it is semantic overfitting. It explains why deterministic output appears good for known product queries while the generic plan/evidence/graph invariants remain weak.

The anti-hardcoding test at `tests/okf.test.ts:186-207` scans only a subset of runtime files and checks exact strings. It omits `flow.ts`, `policy.ts`, and the query interpreter, so it cannot detect semantic templates or fixed paper bundles.

## Existing test audit

### Useful existing coverage

The current suite covers:

- parser/indexer and validation behavior;
- named-paper exact extraction;
- stored relation flow integrity and recommended-node presence;
- deterministic intent taxonomy;
- paper discovery and strong/partial separation;
- exact library statistics;
- negative/no-match and library overview behavior;
- implementation lifecycle stages;
- provider 429/503/auth fallback;
- offline mock provider;
- some raw-ID and multi-title-tail scrubbing;
- basic graph provenance classes and provider metadata source checks.

All 59 existing tests pass, but those tests encode the current structural defects as acceptable behavior.

### Missing or insufficient coverage

- exact reported `DESIGN_REUSE_FLOW_QUERY` with malformed Gemini 200;
- `finishReason: MAX_TOKENS` rejection;
- prompt/context leak phrases;
- quote-only/concept-title-only responses;
- empty answer after scrub;
- required-section validation;
- source relevance and unsupported-paper rejection;
- one/annotated/truncated source-title tails;
- final API JSON/renderer contract;
- max graph size and max nodes per layer;
- complete-path preservation and no orphan nodes;
- graph membership tied to selected design moves;
- partial/weak paper concepts excluded by default;
- answer/flow-row/graph alignment;
- evidence concept/paper consistency per move;
- exact Workbench Main Flow compatibility;
- provider label rendering for Gemini/Groq/mock/none;
- deterministic provider metadata not claiming a connection;
- a producer/test for `fallback_validation_error`;
- no live Groq planner during ordinary tests;
- semantic hardcoding/rewording beyond literal-string scans.

The smoke script is especially weak. It stringifies the entire response and searches metadata/debug for paper titles and `query_generated` (`scripts/smoke-okf-query.ts:10-23`). It requires minimum counts—at least five papers, six rows, ten evidence refs—but no upper bounds or visible-answer checks. A bloated payload with a broken Answer tab passes.

## Which parts should be preserved

- OKF markdown/YAML parser, indexer, ID validation, and source provenance.
- Query intent taxonomy and deterministic high-confidence routing.
- Deterministic exact extraction, stats, coverage, overview, discovery, negative/no-match, and lifecycle answer types.
- Paper role profiles and theme taxonomy as transparent priors, after removing dominating force behavior.
- Evidence IDs and stored relation IDs as internal grounding keys.
- Stored-relation provenance rules and solid/mixed/query-generated visual distinction.
- Existing deterministic structured fallback renderer.
- UI shell: Answer/Flow/Evidence/Retrieved Knowledge/Debug tabs, evidence filtering, and correction reporting.
- Provider fallback architecture and redacted/safe base-URL reporting.
- Mock-provider test path and live-test opt-in principle.

## What must change

### Priority 0: stop malformed synthesis from reaching users

1. Choose one active output contract, preferably structured JSON validated with Zod and rendered server-side.
2. Build a genuinely small synthesis context from selected moves only; do not embed the whole AnswerPlan/evidence pack.
3. Reject non-`STOP`/complete Gemini results, including `MAX_TOKENS`.
4. Add an `AnswerGuard` for required sections, leak phrases, quote-only answers, raw/internal fields, source logic, allowed references, and naked title tails.
5. On guard failure, preserve the deterministic answer and mark `fallback_validation_error`.
6. Make the server's canonical `answer` the only default render field. `llm_synthesis` should be diagnostics, not an alternate untrusted answer.

### Priority 1: make AnswerPlan authoritative

1. Select papers/concepts/evidence once.
2. Validate 5-7 design moves with explicit Requirement, Principle, Feature, optional Artifact, paper roles, and evidence mapping.
3. Enforce that evidence belongs to the move concept and that its paper is listed as supporting the move.
4. Do not mutate stored labels or quotes. Store target-domain adaptation separately.
5. Filter weak/partial sources unless they support a selected move. Keep additional retrieval in Debug.
6. Replace substring paper-ID matching with exact IDs/tokens/aliases.

### Priority 2: project a compressed graph

1. Build query/mixed graphs from validated design moves, not all retrieved concepts.
2. Cap before graph assembly and preserve 5-7 complete design paths, with at most 5-7 nodes per visible layer.
3. Include a node only when it participates in a selected move/path.
4. Use stored solid edges only for exact stored relations; use mixed/query-generated provenance for adaptations and bridges.
5. Remove evidence-count-only generated linking and orphan nodes.
6. Keep the raw relation union in Debug.
7. Use a shared stored-flow display adapter so paper-specific chatbot flows can match Workbench Main Flow/recommended flow semantics.

### Priority 3: normalize provider/UI state and tests

1. Return one provider-status object from API/health/chat.
2. Distinguish configured, reachable, attempted, succeeded, rate-limited, invalid, and skipped.
3. Add adversarial output, graph, grounding, provider-label, and route-level tests.
4. Make all live provider/planner calls opt-in during tests.
5. Change the smoke check to inspect `payload.answer`, required sections, guard outcome, and graph upper bounds.

## Proposed final architecture

```text
QueryInterpreter
  input: raw query + KB metadata
  output: validated QueryPlan
        |
        v
AnswerStrategy
  decides deterministic answer type, source policy, graph policy, and whether LLM polish is allowed
        |
        v
AnswerPlan
  one canonical plan: selected papers -> 5-7 grounded moves -> evidence -> graph projection
  validates source strength, IDs, complete move paths, evidence/paper invariants, and size limits
        |                         \
        |                          -> FlowGraphBuilder (stored or compressed mixed projection)
        v
ContextBuilder
  small immutable context: task + user question + selected moves + evidence by move + output schema
        |
        v
LLM Synthesis
  structured response only; no fact/source selection
        |
        v
AnswerGuard
  schema + finish reason + grounding + leak + section + completeness checks
        |
        +-- invalid -> deterministic structured fallback (`fallback_validation_error`)
        |
        v
Renderer
  server renders one canonical Markdown answer; UI displays it and separately renders the validated graph
```

### Suggested AnswerPlan invariants

- exactly one selected-paper list, ordered by actual role/relevance;
- 5-7 moves for design-reuse answers;
- each move has separate stored/adapted Requirement, Principle, Feature, and optional Artifact fields;
- each stored element references an existing concept ID;
- every non-query-generated claim has evidence;
- every evidence paper is in the move's supporting-paper set;
- no duplicate evidence IDs in a move;
- partial paper material is included only if a selected move uses it;
- the default graph is a direct projection of these moves;
- no generated node is orphaned;
- no stored label or excerpt is rewritten.

### Suggested LLM contract

Use a provider-neutral schema such as:

```json
{
  "opening_recommendation": "string",
  "move_explanations": [
    {
      "move_id": "one of the supplied move IDs",
      "what_to_build": "string",
      "reuse_logic": "string",
      "adaptation_boundary": "string"
    }
  ],
  "architecture_direction": ["string"],
  "limitations": ["string"]
}
```

The LLM should not return paper/evidence/concept IDs it was not asked to reference, should not construct a graph, and should not select sources. The server joins validated prose with canonical paper titles/evidence and renders Markdown.

## Minimal repair plan

### Phase 1: prompt, context, and output guard

- Make a small `ContextBuilder` based on the six validated moves, not full response JSON.
- Remove stored-label/evidence rewriting.
- Restore a single structured provider contract for Gemini and Groq.
- Check Gemini/Groq completion state before accepting text.
- Implement `AnswerGuard` and the currently unused `fallback_validation_error` path.
- Make `response.answer` canonical and retain raw provider output only in redacted Debug diagnostics.
- Acceptance: the exact leak-shaped mock and a `MAX_TOKENS` 200 both fall back to the clean deterministic answer.

### Phase 2: compressed query-generated FlowGraph

- Make the validated design moves the graph input.
- Select 5-7 complete design paths; cap by path/move before node construction.
- Drop weak/partial nodes unless used by a selected move.
- Preserve exact stored edges and provenance styling.
- Put the full raw graph only in Debug.
- Add a shared stored-flow adapter or recommended-main-flow projection for Workbench parity.
- Acceptance: target query has complete Requirement→Principle→Feature paths, no orphan nodes, no missing Artifact due truncation, and no more than 5-7 nodes per visible layer.

### Phase 3: tests

- Add table-driven AnswerGuard tests for prompt leakage, missing sections, quote-only output, raw IDs, unsupported papers, single/annotated title tails, and incomplete finishes.
- Add move/evidence and answer/graph invariant tests.
- Add graph compression and Workbench-parity tests.
- Add provider-state/badge contract tests.
- Update smoke test to inspect the visible answer and maximum sizes.
- Disable every live provider/planner path under `npm test` unless explicitly opted in.

### Phase 4: manual evaluation

Run a fixed matrix with deterministic, Gemini success, Gemini rate limit, Gemini malformed 200, Groq success/fallback, and mock modes across:

- the exact fragmented-product-data flow query;
- a semantic rewording of it;
- paper-specific stored IoT flow;
- paper discovery;
- exact extraction;
- library stats;
- negative/no-match;
- lifecycle guidance.

Inspect Answer, Flow, Evidence, Retrieved Knowledge, Debug, and provider labels. Record answer completeness, move grounding, paper precision, graph size, provenance, fallback mode, and latency/token usage.

## Risks

- **Provider rate limits and reasoning budgets:** prompt reduction and finish-state validation are mandatory; raising output tokens alone will not fix bloat.
- **Model/version drift:** free-form provider behavior can change. A provider-neutral schema and guard are safer than model-specific prompting.
- **Semantic overfitting:** product-specific code currently makes benchmark queries look better than generic ones. Repairs must use plan invariants rather than more exact phrases.
- **Data quality:** reviewed, draft, inferred, partial, and weak concepts need explicit eligibility rules. A high extraction confidence is not the same as query relevance.
- **Stored versus adapted semantics:** cross-paper bridges must never be labeled as stored paths merely because individual concepts are stored.
- **Workbench divergence:** the chatbot and Workbench currently use different display contracts. Consolidation must not silently change approved paper flows.
- **9 versus 34 papers:** this reproduction used the 9-paper local fallback. A deployment or Workbench database may expose a larger corpus (for example 34 papers). Counts, thresholds, token budgets, source roles, and tests must bind to the actual loaded KB version and `db_loaded_from`, not assume one corpus size.
- **Supabase fallback:** clock skew/configuration can switch the system from DB data to local files. The UI/debug metadata should make the effective corpus explicit.
- **Response compatibility:** changing from hybrid Markdown/JSON to one contract can affect tests and clients; keep the public `OkfChatResponse` migration explicit.

## Exact Codex implementation prompt for next step

```text
You are implementing the repair described in AUDIT_OKF_CHATBOT.md in the OKF DSR chatbot repository.

Important constraints:
- Preserve all existing user changes in the dirty worktree.
- Do not change OKF source data.
- Do not change the visual design or layout of the UI.
- Do not hardcode the exact fragmented-product-data query or final answer.
- Do not commit unless explicitly asked.

Implement the repair in this order:

1. Make one validated AnswerPlan authoritative for DESIGN_REUSE_QUERY and DESIGN_REUSE_FLOW_QUERY. Do not rerun independent source/concept selection inside the reuse response builder. Represent 5-7 design moves with separate Requirement, Principle, Feature, optional Artifact, supporting-paper, evidence, adaptation-status, and confidence fields. Enforce that every evidence item belongs to the move and its paper is in supporting_papers.

2. Replace the active free-form Gemini/Groq Markdown success contract with one provider-neutral structured JSON contract validated with Zod. Reuse or supersede lib/llm/prompts/dsrReuseSynthesis.ts deliberately; remove the current hybrid where live success leaves a stale deterministic answer_payload. The LLM may explain only supplied moves. It must not select papers, evidence, facts, or graph nodes.

3. Build a genuinely compact context with explicit fields: task, user_question, retrieved_context, and answer_requirements. Include only selected moves, their paper roles, and a small evidence set mapped by move. Do not include the whole AnswerPlan, full evidence_pack, raw graph, debug notes, constraints as free-floating prose, or duplicate summaries. Preserve stored labels/excerpts exactly; put target-domain adaptation in a separate field. Add a token/size assertion.

4. Add an AnswerGuard after every live provider response. Reject non-STOP/incomplete Gemini results including MAX_TOKENS; empty-after-scrub output; quote/concept-only output; missing required sections/moves; prompt/context/meta phrases; raw internal field names or IDs; unsupported paper/source logic; and naked source-title tails. On rejection, keep the deterministic structured answer and set synthesis_mode/runtime to fallback_validation_error with a concise debug reason.

5. Make response.answer the only canonical default answer. Keep llm_synthesis for provider metadata/debug, not as an independently trusted render field. Preserve the current UI appearance.

6. Rebuild query-generated/mixed FlowGraph from the validated selected moves, not all retrieved concepts. Select 5-7 complete paths and cap before node creation, with at most 5-7 visible nodes per layer. Include only nodes supporting a selected move. Preserve exact stored relations as solid; mark mixed/query-generated bridges with existing provenance styles. Prevent orphan nodes and layer-truncation. Keep the full raw relation graph in Debug only.

7. Preserve paper-specific stored-flow behavior, but add a shared adapter/projection compatible with Workbench diagram_include/diagram_view or recommended_main_flow semantics where available. Never invent alternate stored semantics.

8. Normalize provider metadata across /api/health/llm, /api/okf/chat, and badges: provider, configured, reachable, attempted, HTTP status, outcome, error type, and fallback reason. Do not claim connected when synthesis was skipped; do not label provider=none as Gemini.

9. Add tests before declaring success:
- exact reported query + mocked Gemini leak text -> fallback_validation_error and clean deterministic answer;
- Gemini 200 + finishReason MAX_TOKENS -> validation fallback;
- quote-only, missing sections, raw IDs, prompt commentary, unsupported paper, single/annotated source-title tail;
- context size/allowed fields;
- 5-7 grounded moves and evidence-paper consistency;
- compressed graph max/per-layer bounds, complete paths, no orphan nodes, selected-move membership, correct provenance;
- stored-flow/Workbench projection parity;
- deterministic, Gemini 200/429/validation, Groq, mock, and provider=none metadata/labels;
- no live provider or planner calls in npm test unless explicitly enabled;
- semantic-rewording tests that do not depend on exact-query templates.

Update scripts/smoke-okf-query.ts to validate payload.answer directly, required sections, provider outcome, graph upper bounds, and absence of leak phrases. Do not reward minimum paper/concept/evidence counts.

Run:
npm run okf:validate
npm test
npm run lint
npm run build

Report changed files, key invariants, tests, and any remaining risks. Do not commit.
```

## Verification results

All requested checks passed on the audited working tree:

- `npm run okf:validate` — pass; 9 papers, 443 concepts, 758 relations, 304 evidence items, 0 warnings.
- `npm test` — pass; 59 tests, 59 passed, 0 failed.
- `npm run lint` — pass; ESLint exited 0.
- `npm run build` — pass; Next.js 16.2.6 production build and TypeScript checks completed successfully.

Passing checks do not invalidate the audit findings: the current suite does not test malformed nonempty LLM output or graph compression, and the live reproduction produced a broken Gemini 200 answer while all repository checks passed.

No commit was made.
