# Synthesized-diagram latency investigation

Branch: `fix/researcher-diagram-feedback`, based on `ed8d75b`.
Production baseline inspected: `f6ffdd765fbbcf5573523e9de0074be09c1fc5cc`.

## Demonstrated cause and limits of the evidence

The production baseline and researcher-feedback branch have identical OpenAI SDK
configuration and new-proposal generation code: a 45,000 ms timeout, two automatic
SDK retries, initial structured generation, one possible validation repair, and an
optional full-plan quality review. The browser has no automatic 45-second cutoff.
The observed message is the application's `openai_timeout` error, rather than a
Vercel function-invocation timeout page. This identifies the application/provider
timeout path; it does not establish the exact failing production phase.

A real SDK with a fully mocked fetch transport demonstrates that the old policy
makes three attempts and spends at least 135 seconds on a single timed-out
generation. A useful response that takes longer than 45 seconds to begin returning
is repeatedly aborted instead of being allowed to complete. Review uses the same
policy, so it can add another approximately 135 seconds. With an initial invalid
response and a repair, the sequence has no shared deadline and can exceed a
300-second function budget. These defects predate the researcher-feedback fixes.

Local cold-path measurements (one offline synthetic benchmark, no provider calls):

| Stage / size | Measurement |
| --- | ---: |
| Retrieval | 6,656 ms |
| Context construction | 17 ms |
| Diagram grounding | 2 ms |
| Retrieved concepts | 40 |
| Packed text context | 103,747 characters |
| Compact synthesis input | 11,824 UTF-8 bytes |
| Packed XML forwarded to synthesis | No |

These measurements rule out full packed-XML duplication in this synthesis request.
They are local measurements, not production timings. There is no evidence that
reasoning effort or the output-token budget needs changing, so neither was changed.
The new telemetry distinguishes `max_output_tokens` incompletion from transport
timeout and records configured reasoning effort and actual usage when available.

Production project inspection returned 403 through the Vercel connector. The CLI
had no credentials. No production model request was sent and no production setting
was changed. Without runtime logs, live phase timings, deployed Fluid Compute
status, and the effective function duration remain unverified. Actual provider
latency and live success rates are not established by mocked tests.

## Changes

| Files | Purpose |
| --- | --- |
| `src/native-okf/server/openai/request-budget.ts` | Per-turn request budget, per-stage policies, whole-response deadlines, physical cancellation, and output-moderation reserve. |
| `src/native-okf/server/openai/client.ts` | Permit SDK request options and fixed local operational stage labels. Default text SDK configuration is unchanged. |
| `src/native-okf/server/openai/synthesis-plan.ts` | Generation/repair get 120 seconds with zero transport retries; optional review gets 15 seconds with zero retries. Existing validation and fallback to a valid original plan remain intact. |
| `src/native-okf/server/openai/synthesis-refinement.ts` | Bound patch/review calls; a transport failure stops the edit without another paid patch generation. Mandatory review remains required to accept a patch. |
| `src/native-okf/server/openai/diagram.ts` | Label stored-diagram model calls without changing their graph behavior. |
| `src/native-okf/server/openai/moderation.ts` | Bound required safety calls and label them for operational timing. |
| `src/native-okf/server/openai/chat.ts` | Share the deadline from the original turn start, measure retrieval/context/grounding/generation/final validation, preserve prior diagrams on failed refinement, and remove potentially content-bearing validation reasons from operational logging. |
| `src/native-okf/server/openai/telemetry.ts` | Fixed stage labels, start/completion events, duration, retry policy, normalized error codes, timeout origin, usage, and bounded incompletion reasons. |
| `src/native-okf/server/request-log.ts` | Best-effort safe stage logger. |
| `src/native-okf/server/public-chat.ts` | Correlate metadata with the server-created request ID and propagate client cancellation. |
| `app/api/native-okf/chat/route.ts` | Declare supported Next.js App Router `maxDuration = 300`. |
| `src/native-okf/tests/synthesis-latency.test.ts`, `package.json` | Mocked SDK latency/retry/privacy/recovery regressions included in the chatbot test command. |

The shared model-call budget starts before intent classification and is 250 seconds,
with 10 seconds reserved for returning the response. Required output moderation gets
an additional 20-second reserve when enabled. A model deadline cancels its abort
signal and bounds reading the complete response body, rather than relying only on
the SDK's timeout until response headers. No later model call starts when its budget
is exhausted. A timed-out optional review returns the validated proposal. A timed-out
mandatory refinement review rejects the patch and preserves the validated baseline.
New synthesis never falls back to a stored source map.

Normal text requests retain their existing 45-second SDK timeout and two retries,
subject to the shared turn deadline. Model selection, reasoning effort, output-token
budgets, evidence allowlists, citations, graph grammar, and conservative editing are
unchanged. No provider migration, database change, or UI change was introduced.

## Verification

- `npm run test:native-okf:chat`: 456 passed in the main run, including the
  researcher-feedback preservation regressions and the first 11 latency tests.
- Focused `synthesis-latency.test.ts`: all 12 passed after adding the output-budget
  telemetry regression.
- `npm run test:native-okf:eval-upgrade`: 9 passed.
- `npx tsc --noEmit`: passed.
- Changed-file ESLint: passed, with one pre-existing unused-import warning in
  `synthesis-plan.ts`.
- `npm run build`: passed locally; existing Google Fonts required network access.
- No live OpenAI calls or costs were incurred. No commit was made before validation.

The real mocked SDK regression completes a 65-second generation in one attempt and
returns its unchanged validated proposal after a 15-second review timeout (80
simulated seconds total). Another regression repairs a structurally invalid first
response and returns the repaired valid proposal after 240 simulated seconds when
review reaches the shared deadline. Other regressions cover physical abort, no new
request after exhaustion, malformed/failed review, mandatory-review rejection,
client cancellation, preserved text settings, output-moderation headroom, and log
privacy.

## Vercel settings and remaining verification

Before an eventual authorized deployment, verify that Fluid Compute is enabled for
this project. In the Vercel dashboard, open the project, **Settings → Functions**;
verify Fluid Compute and the function duration. The route's `maxDuration = 300`
sets its duration in code; it needs no environment secret or model-parameter change.
If Fluid Compute is disabled, enabling it manually may be required for a 300-second
budget, particularly on Hobby. The currently deployed configuration was inaccessible
and must not be assumed to match the documented defaults.

Vercel documents a 300-second default/maximum on Hobby with Fluid Compute, and the
Next.js App Router `maxDuration` export:
https://vercel.com/docs/functions/configuring-functions/duration

For the outstanding live diagnosis, open **Project → Logs**, select **Production**,
filter the route `/api/native-okf/chat` and the approximate time of a failed request,
then expand its invocation. Copy only metadata from `native-okf-chat` and
`native-okf-model-turn`: error code, total duration, model, reasoning effort, request
bytes, call durations/statuses, and usage counts. A model call near 135 seconds with
`openai_timeout` would confirm the old three-attempt cutoff. A
`FUNCTION_INVOCATION_TIMEOUT` indicates the separate platform limit. New stage logs
are available only after an eventual authorized deployment of this branch and
identify synthesis, repair, optional review, and mandatory refinement review
explicitly. Never copy questions, answers, raw provider errors, keys, or conversation
content into diagnostic reports.

Live-model success and proposal usefulness should be checked in an approved smoke
test before production release. Responses taking more than 120 seconds for a single
generation still time out safely; the fix does not promise unlimited provider time.
