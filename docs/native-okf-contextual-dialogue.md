# Native OKF contextual dialogue

Phase 6C1 extends the existing `/api/native-okf/chat` path with bounded,
session-local conversation context. It does not add a second chat API, permanent
chat storage, or synthesized knowledge.

## Bounded history

The request accepts only `user` and `assistant` history messages. The server
removes control characters, keeps at most the eight most recent messages, and
limits each message to 2,000 characters. System, developer, tool, function, and
context roles are rejected, as are client-provided prompts, retrieval context,
and tools.

History helps interpret the current question but is never evidence. Every
substantive turn performs fresh native OKF retrieval and graph expansion. The
retrieval query does not contain previous assistant prose, and the answer model
may cite only the current turn's retrieved allowlist.

## Conversation-state contract

`NativeOkfConversationState` is a closed, versioned contract:

- `version` is `1`.
- `activePaperSlugs` contains at most three repository-validated paper slugs.
- `activeConceptIds` contains at most eight repository-validated concept IDs.
- `activeSourceIds` contains at most twelve repository-validated source IDs.
- `lastIntent` is one of `answer`, `comparison`, `stored-diagram`, or
  `clarification`.
- `lastDiagramRequested` is a boolean.
- `pendingClarification` is null or a defined clarification kind with an
  original question of at most 500 characters.

Unknown properties, arbitrary instructions, source text, retrieval context, and
tool descriptions are not accepted as state.

## Server validation and contextual retrieval

Client state is untrusted. Before it affects retrieval, the server checks paper
slugs, concept IDs, and source IDs against the native repository and discards
unknown identifiers. A pending original question is usable only when it also
appears in the bounded user history.

Deterministic resolution uses explicit current-turn paper and concept matches,
validated active focus, limited anaphora, ordered comparison context, and the
current diagram preference. It adds only validated identifiers and repository
titles to a contextualized query; it never appends previous answers or
client-supplied source material.

An explicitly named current paper replaces unrelated stale paper and concept
focus. Ordered comparison focus is retained so phrases such as ?the second
paper? resolve deterministically. Each resolved follow-up still starts a fresh
retrieval and graph-expansion pass.

## Clarification dialogue

Genuinely ambiguous requests return one short, focused clarification question.
The server preserves the bounded original question in pending state, then
combines the next user response with it for deterministic contextual retrieval.
Well-formed paper or concept questions proceed without clarification.

Deterministic clarification occurs before retrieval or model setup.
It makes no OpenAI request. Clearing the conversation removes the pending
question, so a later ambiguous reference cannot reuse old focus.

## Browser session boundary

The current tab stores its visible user and assistant messages, validated
conversation state, diagram-toggle preference, and a nonpersonal local
conversation ID under `native-okf-chat-session:v1` in `sessionStorage`.
The serialized payload is bounded to 100,000 characters and old messages are
compacted first. Corrupt, unavailable, oversized, or schema-invalid storage is
ignored safely.

The browser does not use `localStorage` for chat. It does not store cookies,
secrets, API keys, administrator information, full retrieved source bodies, or
retrieval diagnostics.
Conversation data survives refresh in the same tab but is isolated from other
tabs and browser sessions.

No server-side chat table or prompt/answer write was added.

## New chat

The restrained **New chat** control clears visible messages, the session payload,
active paper/concept/source focus, pending clarification, and diagram intent. It
restores the existing safe diagram default and creates a fresh local
conversation ID. It does not contact the model or require a server request.

## Concise grounded answers

Normal answers target approximately 100?220 words, answer directly, use no more
than five short bullets when useful, and include at most one short qualification
paragraph. Comparisons target approximately 180?300 words and include only
material similarities and differences. Explicit requests for detailed,
exhaustive, step-by-step, literature-review, or methodological treatment may be
longer.

Hard presentation limits are 350 words for normal answers, 450 for comparisons,
and 900 for explicitly detailed answers. The prompt also prohibits generic
background, long introductions, repeated source-card descriptions, and
repetitive conclusions. Stored knowledge must be distinguished from inference or
synthesis.

## Text-diagram prohibition and repair

User-visible answers may not contain ASCII or box-drawing diagrams, Mermaid,
Graphviz, DOT, PlantUML, code-block flowcharts, diagram-like pseudo-tables,
arrow-heavy multiline flows, textual node-edge representations, HTML/SVG
payloads, or embedded JSON diagram data. Visual output remains available only
through the existing validated structured diagram pipeline.

A generic validator checks both diagram-like output and answer-length bounds.
One existing-style model repair is allowed for citation or presentation
violations. The repair receives the validation errors and must return concise,
grounded prose while preserving material valid citations. The tracked client
includes repair tokens and cost in the original reservation's actual-usage
