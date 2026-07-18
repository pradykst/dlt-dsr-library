# Native OKF evaluation access, security, and cost controls

Date: 2026-07-18

## Status and scope

This document specifies the implemented access-control, usage-accounting, cost-control, and operational boundaries for a limited native OKF evaluation deployment. It does not authorize promotion to canonical routes, legacy cleanup, migration, commit, or merge work.

The Phase 6A controls described here are application-owned and enforced server-side. They default to disabled. Activation requires valid application secrets, token prices, a public origin, and a supported persistent single-instance deployment; it does not require OpenAI Platform dashboard or project-administration access.

The native library and Workbench may remain readable while paid chat is disabled. A disabled chat must not invoke moderation or OpenAI.

## Security and cost objectives

The evaluation deployment must:

- default to no paid access;
- admit only an internal tester or individually invited researchers;
- enforce daily, lifetime, rate, cooldown, concurrency, and monetary limits before an external request starts;
- keep authorization decisions and provider credentials on the server;
- make invitations revocable and expiring;
- keep administrative functions private;
- store only the minimum operational data;
- fail closed when enforcement state is unavailable or invalid;
- provide immediate application shutdown procedures and document the collaborating provider-key owner's optional out-of-band revocation path;
- preserve the native retrieval, grounding, citation, and diagram-validation boundaries.

These controls limit accidental spend and casual abuse without depending on provider project limits or billing alerts. Provider-side controls, when available to the collaborating key owner, are optional defense in depth; host security and incident response remain necessary.

## Provider-account boundary

The native application can account only for requests that pass through its own server and ledger. Usage of the same provider key by another application, script, developer, leaked credential, or provider console is invisible to this application. Conversely, the application cannot reliably reconstruct provider invoices from its ledger when provider pricing, rounding, credits, or omitted usage metadata differ.

A dedicated application key for the native OKF evaluator is strongly recommended because it narrows the application's blind spot for usage outside this deployment. That administrative improvement does not block implementation, deployment acceptance, or enforcement of the application-owned controls. Provider projects, billing dashboards, budget alerts, and project limits are optional out-of-band controls and are not prerequisites.

The collaborating platform owner remains responsible for the provider key, optional provider-side controls, emergency revocation, and key rotation. Researchers and invite administrators must never receive or view the key.

## Fail-closed access modes

NATIVE_OKF_CHAT_ENABLED is the dominant kill switch. Its default is false. When false, all paid chat and diagram endpoints must refuse before moderation or model invocation, regardless of access mode.

NATIVE_OKF_ACCESS_MODE accepts exactly three values:

| Mode | Intended use | Admission | Accounting |
| --- | --- | --- | --- |
| disabled | Initial deployment, maintenance, incident response | Nobody can invoke paid chat | No external request |
| test | Private internal acceptance | One server-side test code and a signed researcher session | Test quotas and test dollar caps |
| invite | Limited researcher evaluation | Per-invitation code, expiry, revocation, quotas, and signed session | Per-invite quotas plus global caps |

A missing, empty, misspelled, or unsupported mode must behave as disabled. Production must also fail closed when required secrets, pricing, persistent accounting, or the configured public origin are unavailable.

Changing from invite to test must not make invite sessions valid in test mode. Changing to disabled must invalidate paid access immediately even if a browser retains a session cookie.

## Researcher workflows

### Private test mode

1. The platform owner enables chat and selects test mode only after enforcement checks pass.
2. The internal tester submits NATIVE_OKF_TEST_ACCESS_CODE over TLS.
3. The server compares the supplied value in constant time and never logs it.
4. A bounded, signed, HttpOnly researcher session is issued.
5. Every request passes origin, session, cooldown, rate, concurrency, quota, and budget checks.
6. The session expires after NATIVE_OKF_RESEARCHER_SESSION_HOURS.
7. Disabling chat, changing mode, or rotating NATIVE_OKF_SESSION_SECRET invalidates further paid use.

The test code is a temporary evaluation credential, not a user account. It must be random, stored in an approved secret manager, and rotated after sharing or suspected disclosure.

### Invitation mode

1. An authenticated administrator creates an invitation with an expiry and quota limits.
2. The server generates at least 192 bits of cryptographically secure randomness.
3. The raw invitation code is displayed exactly once and shared out of band.
4. The database stores only an HMAC digest produced with NATIVE_OKF_INVITE_HASH_SECRET, never the raw code.
5. Redemption checks the digest in constant time and verifies enabled state, expiry, revocation, and remaining quotas.
6. The server issues a signed, HttpOnly researcher session scoped to that invitation.
7. Each paid request atomically reserves per-invite quota, global capacity, and estimated cost before invoking an external service.
8. The administrator can revoke the invitation; subsequent requests fail even when an old session cookie remains.
9. Expiry and total quotas remain authoritative after session issuance.

A diagram request consumes one question allowance and one diagram allowance because it includes the text answer plus the diagram call. Requests stopped by deterministic no-match logic consume rate-limit capacity but no paid question, diagram, or dollar quota because no external request occurs.

Administrative labels are operational identifiers, not researcher identities. Use a neutral cohort or case label containing only letters, digits, spaces, periods, underscores, and hyphens. Email addresses, URLs, raw IP addresses, and other identifying labels are rejected, but an administrator could still type a person's name using otherwise allowed characters; administrators remain responsible for using non-identifying labels.

### Invitation and operations CLI

Run administrative commands only on the trusted server with access to the configured durable store:

- `npm run native-okf:invite:create -- --label "Cohort A"`
- `npm run native-okf:invite:list`
- `npm run native-okf:invite:update -- --id <invitation-id> ...`
- `npm run native-okf:invite:revoke -- --id <invitation-id>`
- `npm run native-okf:usage:report`
- `npm run native-okf:pause`
- `npm run native-okf:resume`
- `npm run native-okf:cleanup`

Invitation creation prints the newly generated plaintext code exactly once so it can be shared out of band. List, update, revoke, usage, pause, resume, and cleanup output only safe administrative metadata; they never reveal an invitation code, code hash, IP subject, prompt, answer, retrieved context, cookie, or credential.

### Session and cookie requirements

- Sign researcher sessions with NATIVE_OKF_SESSION_SECRET.
- Sign administrator sessions independently with NATIVE_OKF_ADMIN_SESSION_SECRET.
- Use HttpOnly cookies, Secure in production, SameSite=Lax for researcher access and SameSite=Strict for administrator access, bounded expiry, Path=/ so one signed session covers both native pages and API routes, and no Domain attribute.
- Do not put raw access codes, raw invitation codes, provider keys, prompts, or answers in cookies.
- Validate the configured public origin on state-changing requests.
- Protect administrator mutations with same-origin checks and a CSRF token or equivalent framework protection.
- Rotate session secrets to revoke all sessions during an incident.
- Use separate secrets for session signing, invitation hashing, and administrator sessions.

## Quotas, rate limits, and concurrency

### Test-mode defaults

| Limit | Environment variable | Default |
| --- | --- | ---: |
| Questions per day | NATIVE_OKF_TEST_DAILY_QUESTIONS | 20 |
| Diagrams per day | NATIVE_OKF_TEST_DAILY_DIAGRAMS | 5 |
| Questions for the evaluation | NATIVE_OKF_TEST_TOTAL_QUESTIONS | 100 |
| Diagrams for the evaluation | NATIVE_OKF_TEST_TOTAL_DIAGRAMS | 25 |
| Daily cost | NATIVE_OKF_TEST_HARD_DAILY_USD | USD 2.00 |
| Monthly cost | NATIVE_OKF_TEST_HARD_MONTHLY_USD | USD 8.00 |

### Invitation defaults

| Limit | Environment variable | Default |
| --- | --- | ---: |
| Validity | NATIVE_OKF_INVITE_DEFAULT_VALID_DAYS | 14 days |
| Questions per day | NATIVE_OKF_INVITE_DAILY_QUESTIONS | 12 |
| Diagrams per day | NATIVE_OKF_INVITE_DAILY_DIAGRAMS | 3 |
| Total questions | NATIVE_OKF_INVITE_TOTAL_QUESTIONS | 25 |
| Total diagrams | NATIVE_OKF_INVITE_TOTAL_DIAGRAMS | 8 |
| Requests per minute per invitation | NATIVE_OKF_PER_INVITE_RPM | 4 |
| Concurrent requests per invitation | NATIVE_OKF_MAX_CONCURRENT_PER_INVITE | 1 |

An administrator may issue a stricter invitation. Increasing an invitation above deployment defaults should require an explicit privileged action and remain bounded by the global caps.

### Global defaults

| Limit | Environment variable | Default |
| --- | --- | ---: |
| Requests per minute | NATIVE_OKF_GLOBAL_RPM | 12 |
| Requests per IP per hour | NATIVE_OKF_IP_REQUESTS_PER_HOUR | 60 |
| Cooldown between requests | NATIVE_OKF_REQUEST_COOLDOWN_SECONDS | 5 seconds |
| Global concurrent requests | NATIVE_OKF_MAX_GLOBAL_CONCURRENT | 3 |
| Daily cost | NATIVE_OKF_HARD_DAILY_USD | USD 3.00 |
| Monthly cost | NATIVE_OKF_HARD_MONTHLY_USD | USD 20.00 |
| Text-request reservation | NATIVE_OKF_TEXT_REQUEST_RESERVE_USD | USD 0.08 |
| Diagram-request reservation | NATIVE_OKF_DIAGRAM_REQUEST_RESERVE_USD | USD 0.18 |

All checks must occur server-side. Client-side disabled buttons are usability aids, not controls. Rate limits apply to rejected and no-match attempts so a caller cannot use local retrieval as an unbounded endpoint. Quota and cost reservation must use one atomic transaction to prevent concurrent overspend.

## Cost accounting

### Integer microdollars

Store cost as integer microdollars, where USD 1 equals 1,000,000 microdollars. Never use binary floating-point values as ledger balances or cap comparisons.

Pricing inputs are USD per one million tokens:

- OPENAI_INPUT_USD_PER_MILLION
- OPENAI_CACHED_INPUT_USD_PER_MILLION
- OPENAI_OUTPUT_USD_PER_MILLION

For inputTokens, cachedInputTokens, and outputTokens:

costUsd =
((inputTokens - cachedInputTokens) * inputRate
 + cachedInputTokens * cachedInputRate
 + outputTokens * outputRate)
 / 1,000,000

costMicroUsd = ceil(costUsd * 1,000,000)

Clamp cachedInputTokens to the inclusive range from zero to inputTokens. If cached usage is unavailable but total input usage exists, conservatively treat all input as uncached.

Pricing values must be strictly positive finite decimal strings while paid chat is active. Blank, zero, or invalid pricing means reliable dollar enforcement is unavailable, so test and invite modes fail closed before paid generation.

### Reservations and reconciliation

Before external execution:

1. Determine whether the request is text-only or includes a diagram.
2. Select the configured text or diagram base reservation.
3. Atomically verify per-invite quota, global daily and monthly caps, rate limits, and concurrency.
4. Record a pending reservation with an expiry.
5. Load the centralized model client only after that transaction commits.

Immediately before every Responses API dispatch, the application strengthens the base reservation with a cumulative call envelope. It serializes the exact request body only in memory, never logs or stores it, bounds input at twice the UTF-8 byte count plus 4,096 framing tokens, uses the greater of the configured input and cached-input prices, includes the request's `max_output_tokens`, and covers three attempts (one request plus the configured two SDK retries). The store atomically increases the active reservation before dispatch. If the increase cannot fit within the current UTC daily and monthly caps, that Responses call is not made. A later diagram-call denial can still return the already-grounded text while releasing unused diagram quota.

The byte envelope is a deliberately conservative application safety contract for the current Responses request shape and retry policy. It is not an unconditional provider-billing proof for every arbitrary future model or tokenizer. The provider exposes authoritative token usage only after dispatch and may not expose the cost of every failed transport attempt. A dedicated application key and conservative price/envelope review remain important operational defenses.

After a response:

- Use the provider's returned token usage when present.
- Compute the actual integer-microdollar charge.
- Commit the actual charge and release unused reservation.
- Aggregate text, citation-repair, diagram, and diagram-repair calls.
- Never reduce a committed charge below zero or allow a late response to bypass an expired reservation.

When any paid call omits usage metadata, mark the event `usage-unreconciled` and charge the greater of the complete expanded reservation or the cost calculated from usage returned by the other calls. Do not record zero cost or discard known usage above the reservation. For a timeout or lost connection after dispatch, assume the request may have been billed and retain the conservative charge. Release a reservation only when the application can prove no Responses request was sent.

If returned usage ever costs more than the declared cumulative envelope, the application charges the observed amount, marks the event unreconciled, records the safe `usage-envelope-exceeded` category, and persistently activates the operational pause before another paid request can start.

NATIVE_OKF_RESERVATION_TTL_SECONDS defaults to 1800. Expired reservations require conservative reconciliation; they never simply disappear from budget calculations.

### What the ledger records

The usage ledger may record:

- opaque request ID;
- invitation digest identifier or test-mode marker;
- mode;
- request and completion timestamps;
- whether a diagram was requested;
- success, refusal, moderation, timeout, validation, or other bounded outcome code;
- input, cached-input, and output token counts when supplied;
- reservation and committed microdollars;
- whether the event is `usage-unreconciled`;
- latency and a safe outcome or error category;
- invitation, daily, and monthly counter deltas.

It must not record prompt text, answer text, conversation history, retrieved context, source excerpts, citation prose, diagram content, raw invitation codes, access codes, session cookies, provider keys, or complete IP addresses.

## SQLite deployment boundary

NATIVE_OKF_USAGE_DB_PATH defaults to runtime/native-okf-usage.sqlite. The runtime directory is local operational state and is ignored by Git.

Application runtime exposes only the durable SQLite adapter. That adapter reuses the bounded in-memory state machine internally to apply validated transitions before persisting them transactionally; the standalone in-memory adapter remains test-only. A process-global registry keyed with `Symbol.for` ensures separately evaluated Next.js chat, access, and admin route bundles reuse the same initialized adapter within the supported Node.js process.

SQLite is acceptable only for one persistent Node.js application instance with one durable filesystem. A Docker deployment must mount the runtime directory as a persistent volume with restrictive filesystem permissions. Backups, restore testing, disk capacity, and database-journal files belong to the deployment owner.

Use transactions for invitation redemption, quota reservation, concurrency acquisition, cost reservation, completion, revocation, and administrative mutations. Production invite mode must fail closed when the database cannot be opened, migrated, locked within a short bounded timeout, or persisted.

Operators must not deploy this SQLite adapter on ephemeral serverless filesystems or across multiple application instances. The application cannot automatically prove deployment topology; independent instances would have divergent invitations, counters, reservations, and concurrency state. A serverless or horizontally scaled deployment requires replacing the adapter with a shared transactional store with equivalent atomic semantics before invite mode is enabled.

## IP and proxy handling

NATIVE_OKF_TRUST_PROXY defaults to false. In that state, forwarded IP headers are untrusted and must not determine security decisions.

Only set proxy trust after documenting the exact reverse proxy and hop topology. NATIVE_OKF_TRUSTED_PROXY_HEADER defaults to x-forwarded-for and NATIVE_OKF_TRUSTED_PROXY_HOPS defaults to 1, but these values are inactive while trust is false. Reject malformed chains and select the address using the configured trusted hop count.

For hourly abuse controls, prefer a short-lived keyed hash of the normalized client address and time bucket. Do not persist raw IP addresses in the usage ledger. NATIVE_OKF_PUBLIC_ORIGIN must match the deployed HTTPS origin and is required for production state-changing requests.

## Moderation and grounding

OPENAI_ENABLE_MODERATION defaults to true for this evaluation deployment. Moderation is an additional safety layer, not an access or grounding control.

- Run moderation only after access, local rate, quota, and budget preflight permits the request.
- A moderation rejection must not trigger answer or diagram generation.
- Do not expose raw safety scores to researchers.
- Store only a bounded moderation outcome code, not the submitted text.
- Define a fail-closed policy for moderation outages before invite mode is enabled.
- Preserve deterministic no-match handling, source allowlists, citation validation, prompt-injection boundaries, diagram source-path validation, and the external-tool prohibition.

## Private administration dashboard

The administrative surface must be separate from the researcher chat and inaccessible without NATIVE_OKF_ADMIN_ACCESS_CODE plus a signed administrator session. Its default session lifetime is NATIVE_OKF_ADMIN_SESSION_MINUTES, which defaults to 30.

The dashboard shows only approved operational aggregates:

- environment-enabled state, operational pause state, and access mode;
- the configured safe model label when present, never a credential;
- estimated spend and remaining application allowance for the current UTC day and month;
- questions, diagrams, model calls, active reservations, and unreconciled events;
- bounded safe error categories from the trailing seven-day window;
- invitation status, expiry, daily and total usage/remaining quotas, attributed estimated cost, and last-use time;
- daily question, diagram, input-token, cached-input-token, output-token, model-call, and estimated-cost rows.

The browser dashboard may pause or resume the operational switch, revoke an invitation, extend expiry, and apply validated quota or neutral-label adjustments. The environment kill switch and access mode remain deployment configuration and cannot be changed in the browser. Invitation creation and one-time plaintext-code output are CLI-only; there is no public invitation-generation API.

Never display prompts, answers, retrieved context, raw existing invitation codes, access codes, cookie values, provider credentials, or secret values. Limit administrator mutations to NATIVE_OKF_ADMIN_MUTATIONS_PER_MINUTE, which defaults to 10, and record content-free audit events.

## Kill switches and emergency shutdown

The primary application kill switch is:

NATIVE_OKF_CHAT_ENABLED=false

The secondary policy switch is:

NATIVE_OKF_ACCESS_MODE=disabled

Both must be independently capable of preventing a paid request before moderation or model invocation. The application should display a concise unavailable message without revealing configuration details.

Emergency sequence:

1. Set chat enabled to false and deploy or restart the single instance.
2. Confirm a paid endpoint refuses before any external call.
3. Set access mode to disabled.
4. Revoke active invitations and rotate session secrets if misuse is suspected.
5. Ask the collaborating platform owner to revoke or disable the provider key if exposure or uncontrolled spend outside the application is possible.
6. Inspect content-free application counters; the collaborating owner may inspect provider-side records out of band when available.
7. Reconcile pending reservations conservatively.
8. Document the incident, impact window, owner, corrective actions, and criteria for re-enabling service.

Application caps remain authoritative for this deployment, but a provider-key incident also requires coordination with the collaborating owner because usage outside this application is invisible to its ledger.

## Key and secret rotation

The collaborating platform owner owns rotation.

For provider-key rotation, which remains the collaborating platform owner's out-of-band responsibility:

1. Create a replacement application key through the owner's provider-controlled process.
2. place it in the deployment secret manager without committing or logging it;
3. restart or roll the single application instance;
4. run a bounded, explicitly approved health check;
5. revoke the old key;
6. verify the application ledger and authorization path; any provider-side usage or alert check is optional and performed by the owner when available.

For application secrets:

- Rotating NATIVE_OKF_SESSION_SECRET invalidates researcher sessions.
- Rotating NATIVE_OKF_ADMIN_SESSION_SECRET invalidates administrator sessions.
- Rotating NATIVE_OKF_INVITE_HASH_SECRET invalidates stored invitation digests unless a deliberate dual-secret migration is implemented; otherwise revoke and reissue invitations.
- Rotating test or administrator access codes requires redistributing them out of band.
- Generate each secret independently with a cryptographically secure source and keep it in the deployment secret manager.

## Deployment checklist

### Before first start

- Keep chat disabled and mode disabled.
- Strongly prefer a dedicated application key owned by the collaborating platform owner; do not block activation solely because provider project administration is unavailable.
- Configure and verify the application-owned daily/monthly caps, request reserves, quotas, concurrency limits, and kill switches. Provider-side alerts or limits are optional defense in depth.
- Generate independent session, invitation-hash, test-code, administrator-code, and administrator-session secrets.
- Configure a persistent runtime volume and restrictive permissions.
- Confirm the deployment is exactly one persistent application instance.
- Configure the public HTTPS origin.
- Leave proxy trust false unless the exact proxy chain is known and tested.
- Set current input, cached-input, and output pricing.
- Review test, invitation, global, reservation, and dollar limits.
- Enable moderation and document its outage policy.
- Confirm logs, error reporting, and analytics exclude request and response content.

### Acceptance while disabled

- Verify local library, paper, and concept pages remain available.
- Verify chat and diagram endpoints make no external call.
- Verify invalid and missing access modes behave as disabled.
- Verify missing database, secrets, rates, or public origin fail closed in production test and invite modes.
- Verify secrets never enter client bundles or responses.

### Test-mode acceptance

- Verify constant-time code comparison and signed-cookie expiry.
- Verify question, diagram, daily, total, dollar, rate, cooldown, and concurrency limits.
- Verify no-match consumes no paid quota and makes no external call.
- Verify omitted usage commits the full reservation as estimated.
- Verify timeout reconciliation is conservative.
- Verify disabling chat immediately blocks an existing session.

### Invitation-mode acceptance

- Verify raw invitation codes are shown once and never stored.
- Verify expiry, revocation, daily quotas, total quotas, and bounded overrides.
- Verify concurrent requests cannot overspend or exceed quotas.
- Verify the administrator dashboard exposes no content or secrets.
- Verify database unavailability fails closed.
- Verify backup and restore of invitations and usage state.
- Verify operationally that the deployment uses one persistent instance and volume; the application cannot automatically detect every ephemeral or multi-instance topology.

### Before inviting researchers

- Review the privacy notice and consent basis for operational metadata.
- Assign an administrator and an incident contact.
- Document key owner and rotation date.
- Record application cap values and token-price assumptions; provider-side caps are not required.
- Perform an emergency shutdown rehearsal.
- Start with the smallest practical invitation cohort.
- Review aggregate usage and estimated-cost events daily during evaluation.

## Privacy and retention

Publish a concise researcher notice before invitation use. It should explain that the service processes questions, recent chat history, retrieved native OKF context, and generated output transiently to answer requests, and that the configured model provider processes the supplied bounded context.

The application-owned ledger must not retain that content. Retain only the minimum operational metadata listed above. Define and document retention periods for invitations, audit events, aggregated usage, and short-lived address hashes. Expired and revoked invitation records should be removed or irreversibly aggregated when they are no longer required for cost reconciliation or incident response.

Do not add account profiling, conversation persistence, analytics replay, or cross-service identifiers during this evaluation phase.

## Environment reference

Access and persistence:

- NATIVE_OKF_CHAT_ENABLED=false
- NATIVE_OKF_ACCESS_MODE=disabled
- NATIVE_OKF_SESSION_SECRET=
- NATIVE_OKF_INVITE_HASH_SECRET=
- NATIVE_OKF_TEST_ACCESS_CODE=
- NATIVE_OKF_ADMIN_ACCESS_CODE=
- NATIVE_OKF_ADMIN_SESSION_SECRET=
- NATIVE_OKF_USAGE_DB_PATH=runtime/native-okf-usage.sqlite

Test quotas:

- NATIVE_OKF_TEST_DAILY_QUESTIONS=20
- NATIVE_OKF_TEST_DAILY_DIAGRAMS=5
- NATIVE_OKF_TEST_TOTAL_QUESTIONS=100
- NATIVE_OKF_TEST_TOTAL_DIAGRAMS=25
- NATIVE_OKF_TEST_HARD_DAILY_USD=2.00
- NATIVE_OKF_TEST_HARD_MONTHLY_USD=8.00

Invitation defaults:

- NATIVE_OKF_INVITE_DEFAULT_VALID_DAYS=14
- NATIVE_OKF_INVITE_DAILY_QUESTIONS=12
- NATIVE_OKF_INVITE_DAILY_DIAGRAMS=3
- NATIVE_OKF_INVITE_TOTAL_QUESTIONS=25
- NATIVE_OKF_INVITE_TOTAL_DIAGRAMS=8

Rate and concurrency:

- NATIVE_OKF_PER_INVITE_RPM=4
- NATIVE_OKF_GLOBAL_RPM=12
- NATIVE_OKF_IP_REQUESTS_PER_HOUR=60
- NATIVE_OKF_REQUEST_COOLDOWN_SECONDS=5
- NATIVE_OKF_MAX_CONCURRENT_PER_INVITE=1
- NATIVE_OKF_MAX_GLOBAL_CONCURRENT=3

Budgets and pricing:

- NATIVE_OKF_HARD_DAILY_USD=3.00
- NATIVE_OKF_HARD_MONTHLY_USD=20.00
- NATIVE_OKF_TEXT_REQUEST_RESERVE_USD=0.08
- NATIVE_OKF_DIAGRAM_REQUEST_RESERVE_USD=0.18
- OPENAI_INPUT_USD_PER_MILLION=
- OPENAI_CACHED_INPUT_USD_PER_MILLION=
- OPENAI_OUTPUT_USD_PER_MILLION=

Hardening:

- NATIVE_OKF_TRUST_PROXY=false
- NATIVE_OKF_TRUSTED_PROXY_HEADER=x-forwarded-for
- NATIVE_OKF_TRUSTED_PROXY_HOPS=1
- NATIVE_OKF_PUBLIC_ORIGIN=
- NATIVE_OKF_ADMIN_SESSION_MINUTES=30
- NATIVE_OKF_RESEARCHER_SESSION_HOURS=24
- NATIVE_OKF_RESERVATION_TTL_SECONDS=1800
- NATIVE_OKF_ADMIN_MUTATIONS_PER_MINUTE=10
- OPENAI_ENABLE_MODERATION=true

All blank values are intentional placeholders. Never place real secrets in the example file, source control, browser-visible configuration, logs, evaluation artifacts, or administrator responses.

## Promotion decision

Phase 6A application-owned access, quota, accounting, and hard cost controls are implemented and default to disabled. Activation still requires valid secrets, token prices, public-origin configuration, passing tests, and a supported persistent single-instance SQLite deployment. The evaluator remains on isolated native routes; this status does not authorize canonical promotion.

Canonical-route promotion and legacy cleanup require separate explicit approval.

