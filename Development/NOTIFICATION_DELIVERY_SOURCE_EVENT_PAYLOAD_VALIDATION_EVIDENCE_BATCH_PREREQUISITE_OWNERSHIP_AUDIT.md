# NotificationDelivery source-event payload-validation evidence batch prerequisite ownership audit

**Date:** 2026-10-01  
**Baseline checkpoint:** `DEV-NOTIFICATION-DELIVERY-SOURCE-EVENT-PRE-PAYLOAD-STRUCTURE-EVIDENCE-001`  
**Verified entry HEAD:** `b0e9cb5b4222649734dfff209a5aa3d3da19bb1e`  
**Verified entry tree:** `9d6e106c24119a50b208a22fad58043f378da49b`  
**Governed batch:** DD-343 through DD-347

## Entry gate

The corrected DD-338…DD-342 state closure and PostgreSQL test-harness correction are exact-head verified:
- push Core Service Verify `36895510011` / `110481364479`: **1085/1085 PASS**, zero failed/skipped;
- push PostgreSQL `36895510011` / `110481364051`: **529/529 PASS**, zero failed/skipped;
- Database Verify `36895515191`: PASS;
- Web Boundary Verify `36895510107`: PASS.

The shared disposable PostgreSQL suite retains all 529 tests and now runs test files deterministically with concurrency 1, eliminating cross-file fixture lock-order races without reducing coverage.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of A-06 event architecture, DD-07 §4 consumer ordering, DD-081 `EventEnvelopeCatalogValidator`, DD-091 EventCatalog exact-reader semantics, DD-169 NotificationDelivery→Outbox source-event scope binding and DD-318…DD-342 NotificationDelivery source-event evidence yields one independently source-complete next boundary:

- DD-342 proves the exact bound NotificationDelivery source event satisfies all locally re-evaluable DD-081 prerequisites that occur before payload-schema interpretation;
- DD-081 already owns the authoritative execution order: envelope/catalog/scope/residency validation must succeed before an injected `EventPayloadValidatorPort` may interpret payload;
- DD-081 already owns failure normalization: ordinary payload-validator failure becomes `EventEnvelopeValidationError("The event payload does not satisfy its catalog schema.")`, while an existing `EventEnvelopeValidationError` is preserved;
- DD-081 deliberately makes the schema engine an injected port instead of selecting or inventing a JSON Schema implementation;
- DD-091 deliberately returns RETIRED catalog status as evidence and does not decide production/consumption eligibility;
- DD-169 limits NotificationDelivery source-event relationships to TENANT_CORE or TENANT_INDUSTRY, so this batch does not require EXPLICIT_CROSS_CONTEXT ownership execution.

Therefore the source-complete action is to reuse the existing DD-081 validator on exact DD-342 evidence and preserve successful validation as evidence. It is not source-complete to choose a schema engine, interpret EventCatalog lifecycle, select consumer classes or authorize dispatch.

## Determination

**SOURCE-COMPLETE for injected DD-081 payload-schema validation over exact DD-342 NotificationDelivery source-event evidence only.**

A successful result means only that the existing `EventEnvelopeCatalogValidator` accepted the exact persisted envelope/catalog/current-residency binding and its injected payload validator completed successfully.

It is **not** catalog lifecycle authorization, consumer selection, webhook authorization, Outbox readiness or Notification send authority.

## Locked DD-343…DD-347 contracts

### DD-343 — Establish exact DD-342 parent evidence first

Add an async composition that first rebuilds/checks `buildNotificationDeliverySourceEventPrePayloadStructureEvidence(...)` from the supplied DD-342 parent.

If the parent is malformed, incomplete or substitutes a different source-event reference:
- return `null`;
- do not invoke the payload validator.

If no source event is bound:
- return immutable success preserving the exact DD-342 reference;
- do not invoke the payload validator;
- synthesize no source-event member.

### DD-344 — Exact DD-081 persistence binding projection

For a bound source event, construct only the DD-081 `EventPersistenceBinding` facts from preserved evidence:
- exact event id/type/version/scope;
- exact Tenant id;
- exact Industry Context id when TENANT_INDUSTRY;
- exact current Tenant residency region from the DD-342 parent chain.

No alternate/fallback tuple, historical residency reconstruction or EXPLICIT_CROSS_CONTEXT authority is permitted.

### DD-345 — Delegate to the existing EventEnvelopeCatalogValidator

Instantiate the existing `EventEnvelopeCatalogValidator` with the supplied `EventPayloadValidatorPort` and validate:
- exact persisted envelope JSON;
- exact preserved EventCatalog entry;
- DD-344 exact persistence binding.

Do not duplicate a second schema engine or call the payload port directly ahead of DD-081 validation.

This preserves DD-081 behavior where the injected port receives event type/version, payloadSchema id, normalized catalog payload-schema JSON and normalized payload only after authoritative envelope/catalog/scope checks succeed.

### DD-346 — Preserve DD-081 payload-validation failure semantics

Payload rejection must retain DD-081 semantics:
- an `EventEnvelopeValidationError` remains that error;
- any other payload-validator error is normalized to the DD-081 safe `EventEnvelopeValidationError` message;
- no success evidence is returned after rejection.

No provider/schema-engine implementation detail may escape through the composition.

### DD-347 — Immutable payload-validated evidence envelope

On success return immutable evidence containing:
- exact supplied DD-342 reference;
- exact preserved source-event envelope reference when bound.

Do not expose a new lifecycle/send/readiness boolean. Successful composition itself is the bounded payload-validation evidence.

RETIRED EventCatalog status, consumer classes, webhook eligibility, Outbox status/attempt evidence and Notification delivery/provider state remain uninterpreted.

## Fixed acceptance before implementation

- **NOTIF-EVTPAY-UNBOUND-001** unbound DD-342 evidence succeeds without payload-validator invocation and preserves exact parent identity.
- **NOTIF-EVTPAY-BASE-001** malformed DD-342 evidence or substituted source-event reference returns null before payload-validator invocation.
- **NOTIF-EVTPAY-BIND-001** bound validation projects the exact event identity/scope/current-residency persistence binding.
- **NOTIF-EVTPAY-PORT-001** the injected DD-081 payload port runs exactly once after parent validation with the expected event type/version/schema id plus normalized catalog schema/payload.
- **NOTIF-EVTPAY-FAIL-001** ordinary payload-validator error is normalized to the DD-081 safe EventEnvelopeValidationError.
- **NOTIF-EVTPAY-FAIL-002** an existing EventEnvelopeValidationError is preserved.
- **NOTIF-EVTPAY-EVID-001** success preserves exact DD-342/source-event identities in immutable evidence and leaves input unchanged.
- **NOTIF-EVTPAY-BOUNDARY-001** RETIRED catalog / DEAD Outbox evidence may remain raw; output exposes no catalog-active, consumer-selected, webhook-authorized, ready/retry/provider/render/send/mutation authority.

Expected executable delta: Core **1085 → 1093**. PostgreSQL remains **529/529**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, secret access, frontend or product-policy change.

This batch does **not** implement:
- a concrete JSON Schema / Zod / AJV event payload engine;
- EventCatalog ACTIVE/RETIRED production or consumption policy;
- consumerClassesJson selection/authorization;
- webhook event-filter or endpoint authorization;
- Outbox readiness/claim/lease/ordering/retry/DLQ/replay;
- recipient-principal currentness;
- Notification template selection/rendering/sanitization;
- Integration/provider/credential resolution;
- Notification dispatch/send/callback reconciliation;
- Delivery/Attempt/Event mutation;
- historical write-time residency reconstruction;
- EXPLICIT_CROSS_CONTEXT execution.

After DD-343…DD-347 implementation and targeted Core regression, run the governed Core/PostgreSQL/Database/Web batch-boundary verification before canonical promotion.
