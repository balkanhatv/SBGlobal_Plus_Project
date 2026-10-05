# WebhookDelivery source-event payload-validated reader composition batch prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-WEBHOOK-DELIVERY-EVENT-PAYLOAD-VALIDATION-EVIDENCE-001`  
**Verified entry HEAD:** `ec73353951450f6a8390aa42ff7657bde2b56b28`  
**Verified entry tree:** `4a396d0b90b9043d5a3b97cbe2fc60b2d0ea1101`  
**Governed batch:** DD-533 through DD-537

## Entry gate

DD-528…DD-532 canonical promotion and state closure are exact-head verified:
- Core Service Verify `37286993952` / job `111688134284`: **1403/1403 PASS**, zero failed/skipped.
- PostgreSQL same run / job `111688134445`: **536/536 PASS**, zero failed/skipped; full database bootstrap PASS.
- Database Verify `37286993962` / job `111688134409`: PASS with **48 migrations / 42 SQL verification files**.
- Web Boundary Verify `37286994032` / job `111688134818`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of DD-508…DD-522 Webhook Delivery/Subscription/Event/Catalog/current-residency evidence, DD-523…DD-527 pure pre-payload structural evidence, DD-528…DD-532 injected DD-081 payload validation, and the already-proven Notification DD-348…DD-352 reader-composition pattern yields one independently source-complete orchestration boundary:

- `loadWebhookDeliveryEventCurrentResidencyEvidence(...)` already owns every persistence read needed before payload validation: exact visible Delivery, exact Subscription/Event/Catalog relationship, DD-163 ordinary Webhook necessary floors, persisted envelope coherence and one exact current Tenant-residency read;
- `buildWebhookDeliveryEventPrePayloadStructureEvidence(...)` is pure DD-527 composition over exact DD-522 evidence;
- `validateWebhookDeliveryEventPayloadEvidence(...)` is exact DD-532 composition that delegates only to the existing DD-081 `EventEnvelopeCatalogValidator` and supplied `EventPayloadValidatorPort`;
- none of these boundaries owns EventCatalog lifecycle policy, event-filter interpretation, endpoint/SSRF authorization, signing, readiness/retry/DLQ/replay, EXPLICIT_CROSS_CONTEXT delivery, network execution or mutation.

No additional persistence source, schema engine or product policy is required to sequence these already-governed steps parent-first.

## Determination

**SOURCE-COMPLETE for one parent-first WebhookDelivery reader composition that returns exact DD-532 payload-validated source-event evidence.**

The composition adds no primitive semantics. It only sequences DD-522 → DD-527 → DD-532 and preserves existing null/error/failure behavior.

A successful result is **not** a deliverable/dispatchable/network-authorized decision.

## Locked DD-533…DD-537 contracts

### DD-533 — Establish exact DD-522 current-residency reader evidence first

Add `loadWebhookDeliveryEventPayloadValidatedEvidence(...)`.

Its first action is to invoke `loadWebhookDeliveryEventCurrentResidencyEvidence(...)` using the exact supplied:
- RequestContext;
- WebhookDelivery id;
- Delivery/Subscription/Outbox/EventCatalog/current-Tenant-residency ports.

If DD-522 returns null, return null and do not invoke the payload validator. Parent dependency errors propagate unchanged.

### DD-534 — Build exact DD-527 pre-payload evidence

From the exact DD-522 result, invoke only `buildWebhookDeliveryEventPrePayloadStructureEvidence(...)`.

If it returns null, return null and do not invoke the payload validator.

This preserves fail-closed strict occurredAt/calendar, payload JSON structure and catalog payloadSchema JSON structure semantics with zero additional reads.

### DD-535 — Delegate exact DD-527 evidence to DD-532

Invoke `validateWebhookDeliveryEventPayloadEvidence(prePayloadEvidence, payloadValidator)`.

Preserve DD-081/DD-532 payload error semantics unchanged. Do not call the supplied payload port directly.

### DD-536 — Preserve ordinary Tenant-Core / Tenant-Industry branches only

The existing DD-163/DD-522 chain already limits successful parent evidence to ordinary `TENANT_CORE` or allowed `TENANT_INDUSTRY`. Preserve both branches unchanged and do not synthesize platform-global or EXPLICIT_CROSS_CONTEXT delivery evidence.

### DD-537 — Return exact DD-532 evidence without new authority

Return the exact DD-532 result and preserve exact nested Delivery/Subscription/Event/Catalog/current-residency/pre-payload/envelope identities.

Do not synthesize catalog-active, filter-matched, endpoint-authorized, signed, ready/retryable/deliverable, cross-context-authorized, dispatched/network-authorized or mutation state.

## Fixed acceptance before implementation

- **WH-EVTPAYREAD-BASE-001** DD-522 reader chain executes before payload validation with exact supplied input/readers.
- **WH-EVTPAYREAD-BASE-002** parent null/error returns null/propagates and payload validation is not invoked.
- **WH-EVTPAYREAD-PRE-001** calendar-invalid-but-runtime-parseable occurredAt fails in DD-527 before payload-port invocation.
- **WH-EVTPAYREAD-PRE-002** structurally non-JSON payload fails in DD-527 before payload-port invocation.
- **WH-EVTPAYREAD-CORE-001** valid TENANT_CORE evidence preserves the ordinary no-Industry branch and invokes the payload port exactly once.
- **WH-EVTPAYREAD-PAY-001** valid TENANT_INDUSTRY evidence invokes the supplied DD-081 payload port exactly once and returns exact DD-532 evidence.
- **WH-EVTPAYREAD-FAIL-001** DD-532 payload-validation failure semantics propagate unchanged.
- **WH-EVTPAYREAD-EVID-001** success preserves exact nested identities/immutability and exposes no lifecycle/filter/endpoint/signing/retry/cross-context/network/mutation authority.

Expected executable delta: Core **1403 → 1411**. PostgreSQL remains **536/536**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, public route, concrete schema engine, worker/scheduler, provider SDK, secret access, frontend or product-policy change.

This batch does **not** implement:
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

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-533…DD-537 and the fixed acceptances above.
