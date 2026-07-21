# Native OKF grounded synthesis flows

Phase 6C2 adds ephemeral, problem-specific synthesis flows to the existing
native OKF chat and structured-diagram path. It does not change the native OKF
corpus, retrieval ranking, access controls, quotas, citations, semantic paper
maps, or permanent-storage boundary.

## Two diagram modes

The existing `/api/native-okf/chat` endpoint resolves one of two modes.

- **Stored source map** is used to inspect knowledge represented in retrieved
  papers. Nodes are exact retrieved native concepts and edges are exact resolved
  native relationships. It creates no proposed design knowledge.
- **Grounded synthesis flow** is used for a new problem, theory, framework,
  artifact direction, or design solution. It begins with fresh native retrieval,
  reuses exact stored concepts where applicable, and adds adaptations only when
  they are supported by current-turn retrieved concepts.

The response identifies `diagramMode` as `stored`, `synthesized`, or
`null`. Both modes use the same strict structured-output generator, validator,
React Flow renderer, and deterministic stored-source fallback.

## Intent inference

Synthesis intent is inferred deterministically from generic combinations of an
action such as design, propose, create, construct, develop, formulate, build, or
combine and an output/problem cue such as framework, solution, flow, theory,
artifact, new problem, or new use case. A diagram request alone is not synthesis.

Language that asks to show a paper, stored relations, or a source map resolves
to stored mode. Explicit current-turn language overrides stale conversation
intent. A bounded refinement instruction resolves to synthesis only when a
validated prior synthesis draft exists.

The accepted diagram toggle remains authoritative. Explicit visual language may
enable it through the existing client behavior. A deliberate uncheck produces a
concise grounded design outline, not a hidden structured diagram or a textual
diagram substitute, and consumes no diagram quota.

## Clarification

A synthesis request normally needs a concrete problem or objective, an
application context, and an identifiable output. Deterministic checks use the
existing Phase 6C1 clarification envelope to ask exactly one short question
when one of those is critically missing.

Clarification makes no model request, reservation, or paid quota change. The
bounded original question is retained in pending state and combined with the
next user response. Specific requests, including a cross-marketplace identity
flow, proceed directly.

## Provenance contract

Every validated diagram node contains:

- `id`, `label`, short `description`, `category`, normalized `stage`,
  `order`, and optional grouping;
- `provenance`: `user-provided`, `stored`, or `synthesized`;
- bounded `sourcePaths` and `supportConceptIds`;
- nullable `synthesisRationale`, limited to 240 characters;
- the retained renderer compatibility flag `synthesis`, which must agree with
  provenance.

Every edge contains `source`, `target`, a short label, provenance
(`stored` or `synthesized`), and bounded supporting concept IDs.

User-provided nodes represent only the stated problem, goal, objective, or
constraint. They have no native sources and are limited to two. Stored nodes
identify exactly one allowlisted retrieved native concept with a faithful label
and normalized type stage. Synthesized nodes use one to three allowlisted
supporting stored concepts. The rationale is a short public grounding
explanation, never hidden reasoning.

Stored edges must reproduce an exact resolved native relationship between two
stored nodes. Synthesized edges are visibly and semantically proposals and have
one to three allowlisted supporting concepts.

## Grounding and validation

Every substantive synthesis turn performs the normal fresh lexical retrieval
and graph expansion. Conversation and prior drafts interpret the question but
are never source evidence. The current retrieved allowlist is authoritative.

A synthesis flow requires at least two displayed stored native concepts.
Every synthesized semantic stage must reference a displayed stored support
concept. The validator also enforces:

- the 14-node and 20-edge hard limits;
- the closed normalized stage and provenance enums;
- unique IDs and normalized semantic labels;
- exact stored concept IDs, source paths, stages, and relationship existence;
- agreement between source paths and support concept IDs;
- no user node claiming a paper source;
- no synthesized duplicate masquerading as stored knowledge;
- one connected graph with no orphan, self-loop, duplicate edge, or cycle;
- no more than three major parallel branches;
- a complete problem-to-requirement-to-principle-to-feature path when an RPF
  design solution is requested.

The preferred shape remains seven to twelve nodes with dynamic columns.
Columns come only from validated stages that actually occur; empty columns are
never rendered. Global retrieval weights, graph depth, and context bounds are
unchanged.

## Explicit paper restrictions

Bounded phrases such as "only the second paper," "use only this paper," and
"exclude the named paper" are resolved from explicit mentions and validated
ordered conversation focus. Unknown client paper IDs are discarded.

The regular retrieval and graph-expansion operation still runs for every
substantive turn. The validated restriction then limits the current evidence
set and model context. It does not mutate global ranking or persist a permanent
filter. If fewer than two eligible stored concepts remain for synthesis, the
existing free no-match path is used.

## Synthesis draft and refinement

Conversation state continues at version 1 and adds a nested
`SynthesisDraftState` version 1. It stores only the latest bounded draft:

- problem statement: at most 800 characters;
- domain: at most 120 characters;
- objective: at most 300 characters;
- up to six constraints of 200 characters;
- at most 14 nodes and 20 edges;
- bounded labels, descriptions, source IDs, supports, and rationales.

All returned draft data is held only inside the existing same-tab
`sessionStorage` payload. Incoming draft state is untrusted. Shape,
provenance, stages, identifiers, and native concept IDs are revalidated; unknown
or malformed elements are discarded. A refinement performs fresh retrieval and
re-grounds the replacement output. Prior synthesized nodes are design context,
not scholarly evidence.

Explicit removals are applied to the bounded design-context draft before model
generation. A paper restriction removes unsupported draft context for that
turn. New chat clears the transcript, active focus, pending clarification,
diagram intent, problem context, and draft without changing access or quota
state.

## Text answer behavior

Synthesis text targets approximately 80 to 180 words. It states the problem,
distinguishes stored knowledge from problem-specific proposal, and gives at
most one important limitation or assumption. It does not enumerate every node
or repeat every source title. Grounding is not represented as validation of a
design theory.

The Phase 6C1 answer-length, citation, and text-diagram validators remain in
force. User-visible prose cannot contain ASCII or box-drawing diagrams,
Mermaid, Graphviz, DOT, PlantUML, JSON node-edge payloads, arrow chains, or
pseudo-flow tables. Structured diagram JSON is accepted only inside the
separate validated structured-output path.

## Repair and fallback

Invalid structured output receives at most one repair call. The synthesis
repair contains the validated user problem, current allowlisted source context,
strict schema supplied by the Responses API, and bounded validation errors. It
does not replay the arbitrary invalid output or treat a prior draft as
evidence.

If repair also fails, the invalid diagram is withheld. The existing
deterministic **Grounded source map** is returned when the allowlisted stored
concepts contain a connected native subgraph. It contains only stored nodes and
stored edges. Otherwise the safe grounded text answer remains without a
diagram.

## Presentation

Only the generated-diagram area changes. React Flow, straight direct edges,
dynamic semantic columns, fit/zoom/fullscreen controls, the selected-node
drawer, canonical source links, responsive behavior, and source cards remain.

The provenance legend and accessible node badges distinguish:

- user-provided nodes with a double border and no source claim;
- stored knowledge with a solid border and solid exact-relation edges;
- synthesized proposals with a dashed border and dashed proposal edges.

Color is not the only provenance cue. Semantic type families remain visible:
requirements/goals use lavender, principles green, features tan/gold, artifacts
blue, and evaluation/outcome neutral. The detail drawer shows exact stored
paths, synthesized support concepts, and bounded public rationales.

## Quota, cost, and storage

One substantive synthesis or refinement turn uses the normal question quota.
A requested structured diagram uses one diagram quota. Manual diagram disable,
deterministic clarification, session restoration, New chat, and free no-match
consume no diagram quota; clarification and no-match retain their existing
question-quota behavior.

The initial answer, structured generation, and single repair calls are all
tracked by the existing Responses client wrapper and reconciled against the
same atomic reservation. Repair never consumes a second question or diagram
quota. Daily, total, monthly, monetary, RPM, IP, cooldown, concurrency,
revocation, pause, and kill-switch limits are unchanged.

Chats and drafts are never persisted on the server. No chat table or
account-history product is added. The quota store continues to retain only
operational usage data, not prompts, answers, source bodies, or drafts.

## Limitations and Phase 6C3 boundary

A grounded synthesis is a traceable research proposal, not a claim extracted
from a paper and not a validated design theory. Automated validation establishes
structural integrity, native-source fidelity, and support traceability; it
cannot establish novelty, utility, causal validity, or empirical effectiveness.
Researchers must review the proposed adaptations and evaluate them in the
target domain.

Phase 6C3 may add mocked/live evaluation protocols, researcher assessment,
export integration, and empirical quality measures around these validated
ephemeral flows. It must not silently promote synthesis into the native corpus.
Paper-by-paper curation and any permanent publication workflow remain outside
Phase 6C2.
