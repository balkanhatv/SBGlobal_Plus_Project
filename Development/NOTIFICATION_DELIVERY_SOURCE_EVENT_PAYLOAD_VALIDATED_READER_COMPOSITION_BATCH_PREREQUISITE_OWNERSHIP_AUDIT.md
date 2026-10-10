# NotificationDelivery source-event payload-validated reader composition batch prerequisite ownership audit

**Date:** 2026-10-01  
**Baseline checkpoint:** `DEV-NOTIFICATION-DELIVERY-SOURCE-EVENT-PAYLOAD-VALIDATION-EVIDENCE-001`  
**Verified entry HEAD:** `9a5e51a59889833ac87c67c86b00bb4b98dd103e`  
**Verified entry tree:** `f016cb24993eb9ece4920235b6f4e2d1e0f92156`  
**Governed batch:** DD-348 through DD-352

## Entry gate

The DD-343…DD-347 state closure is exact-head verified:
- Core Service Verify `36897980289` / `110489708332`: **1093/1093 PASS**, zero failed/skipped.
- PostgreSQL `36897980289` / `110489708066`: **529/529 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36897980304` / `110489707534`: PASS.
- Web Boundary Verify `36897980184` / `110489707765`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of DD-298…DD-317 NotificationDelivery visible/composed/Integration-currentness evidence, DD-318…DD-332 source-event EventCatalog/envelope/current-residency evidence, DD-333…DD-342 local DD-081 pre-payload evidence, and DD-343…DD-347 injected DD-081 payload validation yields one independently source-complete orchestration boundary:

- `loadNotificationDeliverySourceEventCurrentResidencyEvidence(...)` already owns every read required before payload interpretation: visible Delivery, exact known relationships, raw attempt history, conditional TenantIntegration current integrity, exact EventCatalog tuple and current Tenant residency;
- `buildNotificationDeliverySourceEventConsumerMetadataEvidence(...)` is a pure DD-337 composition over exact DD-332 evidence;
- `buildNotificationDeliverySourceEventPrePayloadStructureEvidence(...)` is a pure DD-342 composition over exact DD-337 evidence;
- `validateNotificationDeliverySourceEventPayloadEvidence(...)` is the DD-347 payload-validation composition that delegates only to the existing DD-081 EventEnvelopeCatalogValidator and supplied EventPayloadValidatorPort;
- none of these boundaries owns EventCatalog lifecycle authorization, consumer selection, event-consumer idempotency state, Outbox readiness/claim/retry, provider selection, rendering, send or mutation.

No additional persistence source or policy is required to compose these already-governed steps parent-first.

## Determination

**SOURCE-COMPLETE for one parent-first NotificationDelivery reader composition that returns exact DD-347 payload-validated source-event evidence.**

The composition adds no primitive semantics. It only sequences already-governed DD-332 → DD-337 → DD-342 → DD-347 boundaries and preserves their null/error/unbound behavior.

A successful result is **not** a consumable/dispatchable/sendable decision.

## Locked DD-348…DD-352 contracts

### DD-348 — Establish DD-332 current-residency reader evidence first

Add `loadNotificationDeliverySourceEventPayloadValidatedEvidence(...)`.

Its first action is to invoke `loadNotificationDeliverySourceEventCurrentResidencyEvidence(...)` using the exact supplied:
- RequestContext;
- NotificationDelivery id;
- evaluatedAt;
- Delivery/Integration/Outbox/Template/Attempt/Credential/Definition/Capability/EventCatalog/Tenant-residency ports.

If DD-332 returns null, return null and do not invoke the payload validator. Parent dependency errors propagate unchanged.

### DD-349 — Build exact DD-337 consumer-metadata evidence

From the exact DD-332 result, invoke only `buildNotificationDeliverySourceEventConsumerMetadataEvidence(...)`.

If it returns null, return null and do not invoke the payload validator.

Do not read or substitute any evidence.

### DD-350 — Build exact DD-342 pre-payload evidence

From the exact DD-337 result, invoke only `buildNotificationDeliverySourceEventPrePayloadStructureEvidence(...)`.

If it returns null, return null and do not invoke the payload validator.

This is where strict occurredAt/calendar and JSON structural evidence remains fail-closed.

### DD-351 — Delegate exact DD-342 evidence to DD-347

Invoke `validateNotificationDeliverySourceEventPayloadEvidence(prePayloadEvidence, payloadValidator)`.

Preserve DD-081/DD-347 payload error semantics unchanged.

Do not call the supplied payload port directly.

### DD-352 — Return exact DD-347 evidence without new authority

Return the exact DD-347 result.

For an unbound source event:
- preserve successful nested parent evidence;
- perform no EventCatalog/Tenant-residency/payload-validator call beyond what the existing parent chain already omits;
- synthesize no source-event member.

For a bound source event:
- preserve exact nested Delivery/Event/Catalog/residency/evidence identities;
- do not synthesize catalog-active, consumer-selected, idempotent, ready/retryable, provider, rendered, send-authorized or mutation state.

## Fixed acceptance before implementation

- **NOTIF-EVTPAYREAD-BASE-001** DD-332 reader chain executes before the payload port; the exact supplied parent inputs/readers are used.
- **NOTIF-EVTPAYREAD-BASE-002** parent null/error returns null/propagates and the payload port is not invoked.
- **NOTIF-EVTPAYREAD-UNBOUND-001** source-event-unbound Delivery succeeds with exact nested evidence and no EventCatalog/residency/payload-port invocation.
- **NOTIF-EVTPAYREAD-PRE-001** calendar-invalid-but-parseable occurredAt fails in DD-342 before payload-port invocation.
- **NOTIF-EVTPAYREAD-PRE-002** structurally non-JSON payload evidence fails in DD-342 before payload-port invocation.
- **NOTIF-EVTPAYREAD-PAY-001** bound valid evidence invokes the supplied DD-081 payload port exactly once and returns exact DD-347 evidence.
- **NOTIF-EVTPAYREAD-FAIL-001** DD-347 payload-validation failure semantics propagate unchanged.
- **NOTIF-EVTPAYREAD-EVID-001** success preserves exact nested source identities, immutable evidence and no lifecycle/idempotency/readiness/provider/render/send/mutation authority.

Expected executable delta: Core **1093 → 1101**. PostgreSQL remains **529/529**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, concrete schema engine, provider SDK, secret access, frontend or product-policy change.

This batch does **not** implement:
- EventCatalog ACTIVE/RETIRED production/consumption policy;
- consumerClassesJson selection/authorization;
- event-consumer idempotency ledger/state;
- webhook filter/endpoint/signature authorization;
- Outbox readiness/claim/lease/ordering/retry/DLQ/replay;
- recipient-principal currentness;
- Notification template rendering/sanitization/fallback;
- Integration health/fallback or ProviderAdapter selection;
- CredentialReference secret material access;
- Notification dispatch/send/callback reconciliation;
- Delivery/Attempt/Event mutation;
- historical write-time residency reconstruction;
- EXPLICIT_CROSS_CONTEXT execution.

After DD-348…DD-352 implementation and targeted Core regression, run the governed Core/PostgreSQL/Database/Web batch-boundary verification before canonical promotion.
