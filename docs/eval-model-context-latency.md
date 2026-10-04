# Local evaluation model/context upgrade

Review date: 4 October 2026 (Asia/Calcutta). All work is local. No production access, deployment, production service restart, database access, or push was performed.

## Baseline and configuration

Working branch: `fix/eval-model-context-latency`. Base: `deploy/native-okf-canary` at `4f7e7198c1e2217dd9b81f214c327a986f725ea0`. The baseline tree was clean, and the user designated this commit as the local implementation baseline. Its actual production deployment remains independently unverified.

| Setting | Discovered baseline | Evaluation target |
|---|---|---|
| Model mechanism | Required server-side `OPENAI_MODEL`; no application model default | Same mechanism |
| Local configured model | `gpt-5.6-terra` in ignored `.env.local` | Benchmark process override: `gpt-6.1-sol` |
| Checked-in example model | `gpt-5.6-terra` | `gpt-6.1-sol` |
| Local reasoning | `low` | `low` |
| Example / missing-variable fallback reasoning | `medium` / `medium` | `low` / `low` |
| Text / diagram output tokens | 1,800 / 4,096 | Unchanged |
| Permitted configured output range | 128–16,384; diagram floor 4,096 | Unchanged |
| SDK | Official OpenAI SDK 6.48.x; Responses API | Unchanged; already compatible |
| API processing | Tier not explicitly selected | Explicit `service_tier: "default"` (Standard) |
| Moderation | Configurable; enabled in local configuration | Preserved and enabled during benchmark |
| Storage / tools | `store: false`, empty tools, tool choice none | Unchanged |
| Timeout / retries | 45,000 ms SDK timeout, maximum two SDK retries | Unchanged; retries can extend total turn duration |

The ignored `.env.local` and its credentials were not edited. Operators must explicitly supply the target model/effort in the future deployment environment; changing `.env.example` alone does not override an existing environment.

GPT-6.1 Sol supports low reasoning and Responses. Its documented Standard rates are $2/M input and $10/M output; reasoning is included in output usage. [Official model documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol).

## Evidence and request limits

| Limit | Before | After |
|---|---:|---:|
| Default serialized grounded context | 76,000 characters | 140,000 characters |
| Hard serialized grounded context | 80,000 characters | 150,000 characters |
| Default lexical seeds / hard ceiling | 8 / 20 | 16 / 20 |
| Lexical candidate multiplier | 5 | 5 |
| Effective default lexical candidate pool | 40 | 50 (existing search ceiling) |
| Default first-hop / hard ceiling | 12 / 40 | 24 / 40 |
| Default second-hop / hard ceiling | 6 / 20 | 12 / 20 |
| Default concept count / hard ceiling | 28 / 50 | 56 / 100 |
| Graph depth / incoming / outgoing | 2 / enabled / enabled | Unchanged |
| Search default / maximum | 8 / 50 | Unchanged |
| Ordinary per-concept Markdown | 2,400 characters | Unchanged |
| Headings | 24 × 300 characters | Unchanged |
| Metadata scalars / array values | 16 × 1,000 / 20 × 300 characters | Unchanged |
| Structured-analysis compact concept Markdown | 1,200 characters | Unchanged |
| Selected papers | 1–5 | Unchanged |
| Complete-paper packing | All selected canonical records, no top-k count truncation; 80K serialized bound | Same complete packing; 150K serialized bound |
| Conversation history | Last 8 messages, 2,000 characters each | Unchanged |
| Question / browser request | 2,000 characters / 96,000 bytes | Unchanged |
| Serialized model request, including instructions/history/repair/schema | No separate final payload byte guard | 290,000 UTF-8 bytes, checked before every generation call |

The final packer now independently enforces the hard character ceiling, even if an internal caller supplies an inflated retrieval budget. The additional byte guard covers text, diagrams, synthesis, refinements, quality reviews, and repair calls through the per-turn client wrapper. It rejects oversized requests instead of silently trimming complete paper records. It is a byte bound, not a tokenizer-based 100K-token guarantee for pathological inputs; every ordinary benchmark input was below 28K tokens.

MiniSearch weights, scoring, type semantics, relationship projection, ordering algorithms, duplicate suppression, no-match logic, and complete-paper compaction were not changed. The lexical and graph capacity increases provide more candidates to the existing selection rules. Per-record truncation limits were retained because the audited examples already doubled source count without exhausting the new context budget.

| Deterministic example | Sources before → after | Serialized characters before → after |
|---|---|---|
| Tokenization | 20 → 40 | 65,873 → 106,390 |
| Trust/privacy/interoperability | 20 → 40 | 48,916 → 76,097 |
| Fragmented product identities | 20 → 40 | 61,698 → 103,396 |

All 34 canonical paper contexts build without losing records, descriptions, or canonical relationships. The largest individual compact paper context in the completeness audit is 22,006 characters (SSI KYC). Maximum allowed history plus a maximum-length question fits the final provider-request guard for every paper. The five largest papers also now fit together without truncation. All 34 stored maps retain every canonical node and relationship.

## Final whole-request byte acceptance

The proposed 200,000-byte guard rejected legitimate near-cap requests. The offline audit uses unchanged canonical records from real retrieval, up to the existing 100-concept hard ceiling, and the real packer with required evidence bindings. It produces 149,969 serialized context characters without expanding or inventing source text. Text requests include all eight 2,000-character history messages and a 2,000-character question, including three-byte Unicode text. The browser transport validates below its unchanged 96,000-byte limit.

Structured calls are captured from the real generation functions, including their instruction strings and strict schemas. Synthesis and refinement deliberately forward compact evidence bindings rather than the whole XML context or history; the audit preserves that behavior. Refinement includes a validated 48-node, 96-edge prior proposal and a valid complete conversation-state transport with maximum ASCII history. The audit also captures synthesis quality review, bounded 32K rejected-plan repair material, stored-diagram repair, and a conservative 14,400-character text draft for answer repair/alignment. The ordinary text envelope is checked against a captured real chat request. All provider clients are in-memory mocks, with no paid calls.

The exported `nativeOkfModelRequestBytes` function is shared by production and the audit. It measures `Buffer.byteLength(JSON.stringify({...body, service_tier: "default"}), "utf8")`; acceptance is additionally tested through the actual guarded client. The following are maximum measurements within each exercised path, not token counts or a mathematical bound for arbitrary future corpus content.

| Path | Packed context chars | Whole request bytes | % of original 200 KB | Original guard | Final 290 KB guard |
|---|---:|---:|---:|---|---|
| A Ordinary corpus text QA | 149,969 | 211,580 | 105.790% | FAIL | PASS |
| B Broad cross-paper comparison | 149,969 | 211,829 | 105.915% | FAIL | PASS |
| C Design synthesis | 149,969 (compact bindings forwarded) | 41,538 | 20.769% | PASS | PASS |
| D Generated structured stored diagram | 149,969 | 240,812 | 120.406% | FAIL | PASS |
| E Diagram refinement, including repair | 149,969 (compact bindings forwarded) | 99,402 | 49.701% | PASS | PASS |
| F Text citation/answer repair | 149,969 | 178,632 | 89.316% | PASS | PASS |
| F Synthesis plan repair | 149,969 (compact bindings forwarded) | 74,547 | 37.273% | PASS | PASS |
| F Synthesis quality review | 149,969 (compact bindings forwarded) | 83,744 | 41.872% | PASS | PASS |

The measured maximum is 240,812 bytes. Multiplying by 1.2 gives 288,974.4 bytes; the guard is rounded to 290,000 bytes, providing 20.43% engineering headroom over that request. Context, evidence, history and output budgets are unchanged. No additional truncation was introduced. The focused regression checks every constructed request passes with 20% headroom, and deliberately oversized Unicode input still fails before invoking the provider. The reproducible audit is `node --conditions=react-server --experimental-strip-types scripts/audit-native-okf-request-sizes.ts`; detailed initial/repair measurements are in the ignored `request-sizes.json` artifact.

## Streaming and operational metrics

Streaming was absent and is intentionally deferred under the request's safety exception. The existing route returns one complete JSON answer after citation allowlisting, answer-policy validation, optional whole-answer replacement, output moderation, and final scope validation. Safe incremental release would require changing those whole-answer boundaries and the browser protocol; this patch preserves their semantics. First-token latency is therefore unavailable, not zero.

The existing structured server log now emits one `native-okf-model-turn` entry for each model-bearing turn. It includes model/effort, actual input/cached/output/reasoning/total usage when supplied, every generation-call duration/status, total turn/completion duration, mode, corpus/paper scope, evidence size/count, context/output budgets, build commit and build timestamp. Repairs and quality-review calls are included in aggregate spend; reasoning tokens are not added twice. Missing usage remains null. Failed turns can retain reported upstream usage without becoming successful answers. Logging/observer failures cannot alter response semantics.

The logs contain no prompts, answer text, retrieved evidence, API keys, credentials, provider response IDs, or private session identifiers. No analytics database or SQLite access was added. Existing same-origin access, anonymous public-chat behavior, four-request concurrency ceiling, emergency enable flag, moderation, and any unchanged quota/access modules remain intact. The privacy notice now describes these non-content metrics.

Only non-sensitive commit/time values are embedded by `next.config.ts`; runtime model and API-key configuration remain server-side. Build identity for the benchmark refers to the base commit plus this uncommitted patch, so it must not be mistaken for a new committed release. The review patch accompanies this report. A future reviewed build should use the final reviewed commit.

## Validation

| Command | Final result |
|---|---|
| `git diff --check` | Pass |
| `npm run okf:validate` | Pass |
| `npm run native-okf:release:check` | Pass |
| `npm run test:native-okf` | 21/21 pass |
| `npm run test:native-okf:ui` | 74/74 pass |
| `npm run test:native-okf:retrieval` | 20/20 pass |
| `npm run test:native-okf:chat` | 407/407 pass |
| `npm run test:native-okf:release` | 12/12 pass |
| `npm run test:native-okf:onboarding` | 14/14 pass |
| `npm run test:native-okf:ui-copy` | 14/14 pass |
| `npm run test:native-okf:eval-upgrade` | 9/9 pass |
| `npx tsc --noEmit` | Pass |
| ESLint on all affected TS/TSX files | Pass |
| `npm run build` | Pass |
| `git diff --name-only -- knowledge/okf` | Empty |

The nine focused tests cover environment-driven configuration, expanded ranked evidence and strong anchors, deterministic ordering and duplicate suppression, immutable hard caps, all-paper request bounds and full map topology, near-hard-cap requests through all model paths, citation allowlisting, Standard tier, byte guards, missing/incomplete usage, aggregate repairs, secret/content exclusion, and unchanged canonical responses when an observer fails. Existing tests cover history/UI alignment, scope leakage, moderation, failures, and release behavior. The full matrix was rerun after adjusting the byte guard: 571 tests passed, with zero failures.

Initial failures were repaired: old-capacity tests assumed fewer than 34 concepts and rejection of five large papers; they now verify actual bounds and inject a deliberately tight budget to test rejection. Baseline-stale release/onboarding assertions referred to old legal text, a removed Method page, and case-sensitive warning text. Only their tests were aligned to the current baseline behavior. A pre-existing packer `let` was made `const` to satisfy ESLint. No corpus or UI behavior was changed for these fixes.

## Ten-query live benchmark

Ten sequential questions, ten generation calls, zero generation repairs, all HTTP 200. Ran through the real public route on a dedicated loopback server, with moderation enabled and no production access. All final citations validate against supplied source cards; both scoped turns remain paper-only. The initial harness incorrectly treated `sourcePaper` titles as canonical IDs for the scoped check; ownership was rechecked using canonical concept IDs without repeating paid requests.

| # / question type | Context chars | Input | Cached | Output | Reasoning* | Total | Latency s | Estimated USD | Citations | Engineering quality sanity check |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| 1 Patient-consent factual QA | 65,640 | 16,292 | 0 | 302 | 0 | 16,594 | 14.611 | 0.035604 | Valid | Grounded control/privacy/auditability, explicit evaluation limits |
| 2 Cross-paper trust comparison | 71,754 | 18,101 | 0 | 425 | 0 | 18,526 | 13.331 | 0.040452 | Valid | Concrete mechanisms; comparative synthesis labeled |
| 3 Broad design knowledge | 76,097 | 18,123 | 0 | 365 | 0 | 18,488 | 10.496 | 0.039896 | Valid | Relevant cross-artifact knowledge; proposed combination labeled |
| 4 Paper-scoped principles/features | 5,042 | 2,037 | 0 | 353 | 0 | 2,390 | 9.483 | 0.007604 | Valid | Four principles and nine features; scaling limitations stated |
| 5 Paper-scoped follow-up | 2,347 | 1,716 | 0 | 225 | 102 | 1,941 | 8.453 | 0.005682 | Valid | Limited: correctly refuses unsupported implementation detail |
| 6 Tokenization classification | 106,390 | 25,411 | 0 | 242 | 0 | 25,653 | 8.793 | 0.053242 | Valid | Supported inventory; explicitly non-exhaustive |
| 7 Privacy comparison | 114,544 | 27,317 | 0 | 445 | 0 | 27,762 | 12.672 | 0.059084 | Valid | Distinct privacy mechanisms; scope caveat |
| 8 Trust comparison | 57,025 | 14,586 | 0 | 405 | 0 | 14,991 | 10.799 | 0.033222 | Valid | Distinguishes disclosure, accountability and institutional trust |
| 9 Product-fragmentation design guidance | 103,396 | 24,315 | 0 | 351 | 0 | 24,666 | 10.835 | 0.052140 | Valid | Grounded components; cross-domain extensions and integration limits explicit |
| 10 Difficult broad synthesis | 75,103 | 18,093 | 0 | 418 | 0 | 18,511 | 11.093 | 0.040366 | Valid | Balanced design guidance with supporting evidence and limitations |

*Reasoning is already included in output. Costs use `(input × $2 + output × $10) / 1M`, excluding separately unreported cache-write charges. Cached input was zero, so no cache discount is assumed. These are estimates, not an invoice or a guarantee for diagram-heavy workloads. Questions, final answers, and metrics are saved locally in the ignored evaluation artifacts.

| Aggregate | Result |
|---|---|
| Mean / median / p95 total latency | 11.057 / 10.817 / 14.611 seconds |
| p95 method | Nearest rank; with only 10 questions this equals the maximum and is unstable |
| First-token latency | Unavailable; streaming deferred |
| Mean input / output / reasoning | 16,599.1 / 353.1 / 10.2 tokens |
| Total input / output / reasoning / cached | 165,991 / 3,531 / 102 / 0 tokens |
| Total tokens | 169,522 |
| Ten-question estimated cost | $0.367292 |
| Mean / projected 100 similar queries | $0.036729 / $3.672920 |
| Largest input / context | 27,317 tokens / 114,544 characters |

Inputs were below the anticipated 35K–50K operating region: relevant evidence was increased without padding prompts to a token target. The unchanged complete-paper and concept-kind rules intentionally produce smaller scoped prompts.

Historical local acceptance measurements exist from 2 September 2026: a different 60-turn mixture had median 6.935 seconds and p95 119.207 seconds, including diagrams, synthesis and deterministic turns. That artifact did not identify the model/effort or record usage, and its workload differs. It is not a controlled baseline for claiming a speedup or cost reduction; no paid historical baseline was recreated.

The follow-up limitation is reproducible without paid calls: prior 80K and new 150K paper budgets both resolve to the same four principle IDs and a 2,347-character prompt, without features. The model accurately reports insufficient implementation evidence. This existing concept-kind routing behavior was preserved as requested; improving it is separate work. Tokenization and broad comparisons also remain retrieved, bounded inventories rather than guaranteed exhaustive answers.

## Two additional live diagram acceptance turns

Exactly two additional model-bearing user turns ran through the dedicated `127.0.0.1:3123` application with GPT-6.1 Sol, low reasoning, Standard tier, enabled moderation and the unchanged 4,096 diagram-token budget. No prompt tuning or production changes were made in response to these questions. The server was stopped afterwards.

| Measurement | Turn 1: generated design proposal | Turn 2: additive governance refinement |
|---|---|---|
| HTTP / routing | 200 / `DESIGN_SYNTHESIS` | 200 / `DESIGN_REFINEMENT` |
| Model / effort | `gpt-6.1-sol` / `low` | `gpt-6.1-sol` / `low` |
| Packed context characters | 105,464 | 94,345 |
| Actual structured request bytes | 19,913 initial; 27,827 quality review | 33,441 |
| Logical generation invocations | 2: initial plan, optional review | 1: refinement patch |
| Repair calls | None | None |
| Completed-call input / cached / output / reasoning | 3,345 / 3,342 / 2,837 / 46 | 6,487 / 0 / 500 / 47 |
| Turn aggregate usage | Unknown: review returned no usage | 6,487 input; 500 output; 47 reasoning; 6,987 total |
| Output cap | 2,837 <= 4,096 for the completed plan | 500 <= 4,096 |
| Total HTTP latency | 229.203 s | 13.386 s |
| Reported-usage cost estimate | $0.0287102; failed-review cost unknown | $0.017974 |
| Diagram nodes / edges | 12 / 15 | 13 / 17 |
| Preservation | Initial problem + 11 proposed design concepts | All 12 prior nodes and all 15 prior edges byte-for-byte preserved; one requirement and two edges added |
| Acceptance | PASS: schema, evidence paths, provenance, citations, layout | PASS: routing, additive preservation, governance evidence, schema, provenance, layout |

The initial plan was valid on its first structured response. Its optional quality review timed out after the existing SDK retry policy; the application correctly retained the deterministically validated initial plan. The failed invocation is logged with null usage, and aggregate turn usage stays unknown. The public synthesis projection does not expose the optional review's technical warning. No new response fields or fallback behavior were introduced.

Both saved responses were checked again offline, without additional paid turns. All source IDs resolve to canonical records. The initial answer has valid inline citations; the refinement's deterministic projection has no inline markers, so its new governance supports are checked against current source cards and preserved diagram supports against prior evidence cards. The complete returned graphs pass the real provenance/grammar validator, including the requirement-principle-feature path. All proposal nodes retain `synthesized` provenance and proposed/adapted rationales. Both horizontal and vertical production layouts consume every node and edge and produce finite positions/routes.

Researcher sanity assessment: the initial proposal coherently separates typed product aliases, revisable verified identity assertions, portable marketplace adapters and stewardship. It uses stored evidence as support rather than pretending the new topology is a published design. The governance refinement adapts transparent stakeholder governance and consortial interoperability standards to the existing proposal, without replacing it. Some descriptions end at the existing 300-character limit, and the existing refinement summary omits inline citations for preserved principles; the node provenance links remain available. These presentation limitations and the slow optional-review timeout are recorded without redesigning the existing application or claiming a latency improvement.

Reported additional usage is 9,832 input, 3,342 cached input, 3,337 output and 93 reasoning tokens (reasoning is included in output), totaling 13,169 tokens across completed calls. Estimates use $2/M uncached input, $0.10/M cached input and $10/M output. The additional reported-usage estimate is **$0.0466842**; including the previous ten questions gives **$0.4139762**. The combined reported usage is 175,823 input, 3,342 cached input, 6,868 output and 195 reasoning tokens, totaling 182,691 tokens. The true total bill is unknown because the timed-out review, possible internal SDK retries and separately unreported cache-write charges are not represented in returned usage. The reported estimate must not be presented as a complete invoice. No extra paid baseline or repeated acceptance question was sent.

The loopback-only harness supports offline `--replay` for the two saved responses. During acceptance, overly strict harness assertions were corrected to recognize the existing optional-review fallback and the refinement's diagram-first citation projection. The saved first response was reused before sending the single remaining refinement turn; both final responses were then replayed offline. This did not tune application prompts or add model turns.

## Changed files and Git state

| Files | Change |
|---|---|
| `.env.example`, `src/native-okf/server/openai/env.ts` | Target configuration, low fallback, supported max effort value |
| `src/native-okf/server/retrieval-config.ts` | Bounded evidence capacity |
| `src/native-okf/server/openai/context.ts` | Independent hard ceiling; const lint correction |
| `src/native-okf/server/openai/chat.ts`, new `src/native-okf/server/openai/telemetry.ts`, `src/native-okf/server/request-log.ts` | Per-turn guarded client and safe operational metrics |
| `next.config.ts` | Build commit/time |
| `app/privacy/page.tsx` | Accurate non-content logging disclosure |
| `package.json`, new `src/native-okf/tests/eval-upgrade.test.ts` | Focused regression command and tests |
| `src/native-okf/tests/retrieval.test.ts`, `final-feedback.test.ts`, `final-human-review-stabilization.test.ts` | Expanded-bound assertions and complete packing checks |
| `src/native-okf/tests/release-shell.test.ts`, `evaluation-onboarding.test.ts` | Baseline-stale assertions aligned to current release |
| New `scripts/benchmark-native-okf-upgrade.ts` | Opt-in ten-query loopback-only public-route benchmark |
| New `scripts/audit-native-okf-request-sizes.ts` | Offline real-builder request-size audit and shared-guard regression fixture |
| New `scripts/benchmark-native-okf-diagram-upgrade.ts` | Exactly two live diagram turns, saved-response resume and offline replay |
| New `docs/eval-model-context-latency.md` | This engineering report |

The reviewed change contains the following exact 20 files. One local commit is authorized only after all acceptance and regression checks pass; its hash and final clean status are reported separately because a commit cannot contain its own hash. `knowledge/okf` diff is empty. Evaluation logs, answers, benchmark JSON/summary, and the review patch are in ignored `artifacts/native-okf-evaluation/eval-upgrade/`.

```text
.env.example
app/privacy/page.tsx
docs/eval-model-context-latency.md
next.config.ts
package.json
scripts/audit-native-okf-request-sizes.ts
scripts/benchmark-native-okf-diagram-upgrade.ts
scripts/benchmark-native-okf-upgrade.ts
src/native-okf/server/openai/chat.ts
src/native-okf/server/openai/context.ts
src/native-okf/server/openai/env.ts
src/native-okf/server/openai/telemetry.ts
src/native-okf/server/request-log.ts
src/native-okf/server/retrieval-config.ts
src/native-okf/tests/eval-upgrade.test.ts
src/native-okf/tests/evaluation-onboarding.test.ts
src/native-okf/tests/final-feedback.test.ts
src/native-okf/tests/final-human-review-stabilization.test.ts
src/native-okf/tests/release-shell.test.ts
src/native-okf/tests/retrieval.test.ts
```

## Proposed deployment steps — not executed

1. Review the local commit, benchmark answers, remaining quality limitations, unknown timeout charges and deferred streaming decision. No push or deployment is included in this task.
2. Independently verify the actual deployed commit and running checkout. Resolve any difference from this local baseline before release.
3. Build the reviewed commit with a reproducible commit/time identity. Set `OPENAI_MODEL=gpt-6.1-sol` and `OPENAI_REASONING_EFFORT=low` in the operator-managed environment; preserve moderation, output, origin, access/quota settings, and credentials.
4. After separate deployment approval, use the existing release process. Check a bounded QA, a paper follow-up, citations, and a complete stored map; confirm the new model/config/usage log fields.
5. Keep the prior reviewed build/config available for rollback. Review measured live token/latency distributions before increasing limits or changing reasoning. Treat streaming as a separate citation/policy/moderation-safe protocol change.

STOP for review. No production actions are authorized or performed by this patch.
