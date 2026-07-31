# Native OKF release convergence (Phase 6C3)

Phase 6C3 stabilizes the existing `/api/native-okf/chat` path for researcher evaluation. It does not add a second chat API, change native knowledge data, or persist conversation content on the server.

## Presentation modes

Every successful response identifies one of five researcher-facing presentation modes:

- `text-primary` for ordinary grounded prose;
- `diagram-primary` for successful diagrams and synthesis attempts;
- `clarification` for one deterministic follow-up question;
- `no-match` for unsupported or out-of-scope requests;
- `safe-error` when content cannot be presented safely.

Diagram responses present a concise summary first, the diagram second, any actionable limitation third, and grounding sources in a collapsed disclosure after the visual. Development retrieval diagnostics remain unavailable in production.

## Deterministic stored paper maps

An explicit request for a paper's stored design map uses the existing repository semantic projection. The server does not call either the prose-answer model or the structured-diagram model. It derives the paper title, represented-stage counts, node count, relationship count, summary, provenance, and source cards from the returned projection.

All nodes and edges retain stored provenance. A repository projection with nodes and no canonical semantic edges remains a valid stored map. Lower-priority retrieval truncation cannot invalidate the deterministic summary.

## Small synthesis plan

Problem-specific synthesis uses a strict content-only `SynthesisPlan`. The model supplies:

- a bounded title and problem summary;
- two to four requirements;
- two to four principles;
- two to five features;
- optional single artifact, evaluation, and outcome elements;
- bounded relationships; and
- one to three allowlisted support concept IDs for every node and relationship.

The plan contains no coordinates, source paths, provenance values, stage fields, ordering, groups, renderer flags, or compatibility booleans. It may request exact stored reuse through `reuseStoredConceptId`.

Hard limits are 14 rendered nodes, 20 relationships, 90 characters per label, 300 characters per description, 120 characters for the title, and 300 characters for the problem summary. Validation requires a connected acyclic graph and at least one complete problem-to-requirement-to-principle-to-feature path.

## Server-derived diagram contract

After plan validation, the server creates the user problem node from the validated problem statement and deterministically assigns internal IDs, stages, order, groups, source paths, provenance, renderer compatibility fields, and support references.

For exact stored reuse, canonical repository label, description, type, stage, and concept ID override model text. Otherwise the node is synthesized and retains one to three current-turn allowlisted support concepts. A stored edge is possible only when both endpoints reuse stored concepts and the exact directed native relationship exists. All other proposed relations are synthesized.

The converted result is validated against the existing internal `GeneratedDiagram` contract and rendered by the existing straight-column React Flow renderer. Synthesis does not require every support concept to be displayed as a separate stored node.

## Deterministic synthesis summary and sources

Successful synthesis does not make a normal answer-model call. The server produces a deterministic 40-to-90-word target summary from the validated graph, including category counts and the distinction between exact stored reuse and synthesized adaptation.

The source section contains at most 12 concepts from the union of support IDs actually used by validated nodes and relationships. Sources are ordered by support frequency and stable concept ID. The node drawer retains the underlying support IDs even when the union exceeds the source-card display bound.

## Repair and failure

One bounded synthesis-plan repair is allowed. Its request contains only the validated problem, bounded refinement and constraints, concise allowlisted concept metadata, the strict response schema, and content-free validation error codes. It does not replay arbitrary invalid output.

If repair also fails, invalid output is withheld. The response remains `diagramMode: "synthesized"` with `diagramStatus: "evidence-fallback"` or `"failed"`. An optional deterministic stored graph is explicitly labelled “Supporting evidence map — not the requested synthesized flow.” It is never stored as a synthesis draft and does not consume diagram feature quota.

## Conversation state and refinement

The same versioned, session-local conversation state separates:

- `lastSynthesisProblem`, containing the bounded problem, confirmed domain, output type, constraints, and validated paper restrictions; and
- `latestValidatedSynthesisDraft`, present only after successful diagram validation.

A refinement after success uses the latest validated draft as design context and performs fresh retrieval. A refinement after failure uses the last synthesis problem and the new bounded constraint, again with fresh retrieval. Neither a prior assistant answer nor a prior synthesized draft is scholarly evidence. If neither state value exists, the server asks one concise clarification.

The deprecated `synthesisDraft` input field is accepted only for same-tab session migration and is returned as `null`. New validated drafts use `latestValidatedSynthesisDraft`.

## Current external data boundary

A deterministic pre-retrieval and pre-reservation gate rejects requests whose central requirement is live external data, including prices, market quotations, weather, news, sports results or schedules, office holders, external statistics, or real-time status. It returns:

> This library does not provide live external market data. It can answer questions about the stored DSR and blockchain design knowledge.

This path performs no retrieval, moderation, answer, diagram, or repair call; creates no paid reservation; consumes no question or diagram quota; and returns no sources or warnings. Stored-library questions about a current paper, latest stored paper, a price mechanism, or market design are not blocked by those words alone.

## Quota and cost semantics

A diagram unit is consumed only when the final response contains a validated diagram with `diagramStatus: "success"`. This includes deterministic stored paper maps, validated stored structured diagrams, and validated synthesized flows.

Clarifications, no-match responses, live-data boundary responses, manual diagram disable, synthesis failure, evidence fallback, safe text-only failure, New chat, and session restoration consume no diagram unit. A failed synthesis still reconciles every actual model and repair token and follows the existing substantive question-quota rule. The final response quota is read after reconciliation from the operational store.

No access cookie, origin, rate, cooldown, concurrency, revocation, operational-pause, pricing, budget, or transaction boundary changes in this phase.

## Browser and privacy boundary

Messages, focus, last synthesis problem, latest validated draft, local conversation ID, and diagram preference remain bounded in `sessionStorage`. New chat clears all of them and resets diagram intent without changing access or quota state. No chat, prompt, answer, source body, or synthesis draft is added to the operational SQLite store.

## Viewport behavior

The existing renderer retains its horizontal and vertical controls, straight semantic columns, provenance styling, source drawer, zoom controls, and fullscreen mode. It now keeps at least 36 pixels of fit padding, refits when the canvas resizes, and clamps a graph-derived responsive height to a practical range.

## Known limitations

- Synthesis is a grounded proposal, not a validated design theory or stored corpus contribution.
- The static native repository cannot answer live external-data questions.
- At most 12 synthesis support cards are shown in the collapsed source section; additional used support IDs remain visible through diagram node details.
- A plan can be repaired once. Further recovery requires a narrower problem, outcome, or source restriction in a new turn.
- Phase 6C3 does not curate missing paper categories or change the 245-file native OKF corpus.