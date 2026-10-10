# WebhookDelivery source-event payload-validation evidence batch prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-WEBHOOK-DELIVERY-EVENT-PRE-PAYLOAD-STRUCTURE-EVIDENCE-001`  
**Verified entry HEAD:** `ba6f01836947996e0bc69f383772a2a162ef22cf`  
**Verified entry tree:** `ac95af078a3a31973decdc2a277324076c3d4c5f`  
**Governed batch:** DD-528 through DD-532

## Entry gate

DD-523…DD-527 canonical promotion and state closure are exact-head verified:
- Core Service Verify `37283323557` / job `111676263336`: **1395/1395 PASS**, zero failed/skipped.
- PostgreSQL same run / job `111676263496`: **536/536 PASS**, zero failed/skipped; full database bootstrap PASS.
- Database Verify `37283323509` / job `111676263013`: PASS with **48 migrations / 42 SQL verification files**.
- Web Boundary Verify `37283323513` / job `111676263238`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of A-06 event architecture, DD-07/DD-081 `EventEnvelopeCatalogValidator`, DD-163 Webhook necessary floors, DD-508…DD-527 WebhookDelivery source-event evidence, and the already-implemented Notification DD-343…DD-347 payload-validation pattern yields one independently source-complete next boundary.

DD-527 already proves, for the exact bound persisted Webhook source event:
- exact Delivery → Subscription → OutboxEvent → EventCatalog relationships;
- DD-163 ACTIVE/verified ordinary single-context Webhook necessary floors;
- exact persisted event/catalog tuple and envelope identity/catalog metadata/local-scope coherence;
- exact current authoritative Tenant residency equality;
- strict occurredAt calendar/date-time validity;
- recursively JSON-compatible persisted payload structure;
- recursively JSON-compatible EventCatalog payloadSchema structure.

`matchesWebhookDeliveryNecessaryFloors(...)` restricts the Webhook source event to `TENANT_CORE` or `TENANT_INDUSTRY`. Therefore DD-081 payload validation for this batch requires no `EXPLICIT_CROSS_CONTEXT` authority port.

DD-081 already owns:
- exact envelope/catalog/persistence-binding validation order;
- the injected `EventPayloadValidatorPort` abstraction rather than a concrete schema engine;
- invocation of the payload validator only after authoritative envelope/catalog/scope/residency validation;
- safe failure normalization to `EventEnvelopeValidationError("The event payload does not satisfy its catalog schema.")`;
- preservation of an already-thrown `EventEnvelopeValidationError`.

The historical Webhook remaining-boundary audit still blocks event-filter interpretation, endpoint verification/SSRF mechanics, signing, retry/DLQ/replay, EXPLICIT_CROSS_CONTEXT dispatch and network execution. EventCatalog ACTIVE/RETIRED delivery policy also remains separately governed.

## Determination

**SOURCE-COMPLETE for injected DD-081 payload-schema validation over exact DD-527 WebhookDelivery source-event evidence only.**

Success means only that the existing `EventEnvelopeCatalogValidator` accepted the exact persisted envelope/catalog/current-residency binding and the supplied payload validator completed successfully.

It is **not** EventCatalog lifecycle authorization, filter matching, endpoint authorization, signing authorization, delivery readiness, retry/finality, cross-context dispatch or network-delivery authority.

## Locked DD-528…DD-532 contracts

### DD-528 — Re-establish exact DD-527 pre-payload evidence first

Add an async composition over exact `WebhookDeliveryEventPrePayloadStructureEvidence`.

Before any payload-validator call:
- require a structurally valid DD-527 evidence envelope;
- rebuild it only through `buildWebhookDeliveryEventPrePayloadStructureEvidence(parent)`;
- require the rebuilt envelope reference to equal the supplied `envelopeJson` reference.

Malformed/incomplete/substituted DD-527 evidence returns `null` and the payload validator is not invoked.

### DD-529 — Exact DD-081 persistence-binding projection

Project only DD-081 binding facts already proven by DD-527:
- exact event id/type/version/scope;
- exact Tenant id;
- exact Industry Context id only for `TENANT_INDUSTRY`;
- exact current Tenant residency region from DD-522 current-residency evidence.

Only `TENANT_CORE` and `TENANT_INDUSTRY` are permitted by the existing Webhook necessary floor. Do not synthesize platform-global or cross-context bindings and do not reconstruct historical residency.

### DD-530 — Delegate exact DD-527 evidence to existing DD-081 validator

Instantiate `EventEnvelopeCatalogValidator` with the supplied `EventPayloadValidatorPort` and validate:
- exact persisted `envelopeJson`;
- exact preserved EventCatalog entry;
- DD-529 exact persistence binding.

Do not duplicate or select a JSON Schema/Zod/AJV engine. Do not call the payload port directly before DD-081 validation.

### DD-531 — Preserve DD-081 payload-validation failure semantics

Payload rejection must preserve DD-081 behavior:
- an existing `EventEnvelopeValidationError` is re-thrown unchanged;
- any other payload-validator error is normalized to the DD-081 safe `EventEnvelopeValidationError`;
- no success evidence is returned after rejection.

No provider/schema-engine implementation detail may escape.

### DD-532 — Immutable exact-reference payload-validated evidence

On success return immutable evidence containing:
- exact supplied DD-527 pre-payload evidence reference;
- exact persisted envelope reference.

Do not expose new lifecycle/filter/endpoint/signing/readiness/retry/cross-context/dispatch/network/mutation booleans.

## Fixed acceptance before implementation

- **WH-EVTPAY-BASE-001** malformed/incomplete/substituted DD-527 evidence returns null before payload-validator invocation.
- **WH-EVTPAY-BIND-001** TENANT_CORE validation projects exact event identity/Tenant/current-residency binding with no Industry Context.
- **WH-EVTPAY-BIND-002** TENANT_INDUSTRY validation projects exact event identity/Tenant/Industry/current-residency binding.
- **WH-EVTPAY-PORT-001** injected DD-081 payload port runs exactly once after parent validation with exact event type/version/schema id plus normalized catalog schema/payload.
- **WH-EVTPAY-FAIL-001** ordinary payload-validator error is normalized to the DD-081 safe EventEnvelopeValidationError.
- **WH-EVTPAY-FAIL-002** an existing EventEnvelopeValidationError is preserved unchanged.
- **WH-EVTPAY-EVID-001** success preserves exact DD-527/envelope identities in immutable evidence and leaves all input evidence unchanged.
- **WH-EVTPAY-BOUND-001** RETIRED catalog and raw delivery/outbox/subscription evidence may remain uninterpreted; output exposes no catalog-active, filter-matched, endpoint-authorized, signed, ready/retryable, cross-context, dispatched/network or mutation authority.

Expected executable delta: Core **1395 → 1403**. PostgreSQL remains **536/536**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, worker/scheduler, provider SDK, secret-store or RawSource change.

This batch does **not** implement:
- a concrete JSON Schema / Zod / AJV event payload engine;
- EventCatalog ACTIVE/RETIRED delivery policy;
- `eventFilterJson` grammar/evaluation;
- endpoint challenge, DNS/IP/redirect or SSRF policy;
- signing/HMAC/secret retrieval/rotation;
- Outbox readiness/claim/lease/ordering;
- delivery retry/backoff/finality/DLQ/replay;
- EXPLICIT_CROSS_CONTEXT Webhook authorization;
- dispatcher/network/provider execution;
- Delivery/Subscription/Event mutation or event emission;
- historical write-time residency reconstruction.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-528…DD-532 and the fixed acceptances above.
