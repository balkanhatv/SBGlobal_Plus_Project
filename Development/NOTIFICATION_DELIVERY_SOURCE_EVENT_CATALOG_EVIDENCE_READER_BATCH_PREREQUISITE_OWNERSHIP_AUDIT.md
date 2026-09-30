# NotificationDelivery source-event EventCatalog evidence reader batch ownership audit

**Date:** 2026-09-30  
**Baseline checkpoint:** `DEV-NOTIFICATION-DELIVERY-INTEGRATION-CURRENT-INTEGRITY-EVIDENCE-READER-001`  
**Verified entry HEAD:** `643ac8401d9bd05f783985e8e37ea8c987fae87e`  
**Verified entry tree:** `67e6becab5c8ce7a9da9f41ad9c413189b0f9c6c`  
**Governed batch:** DD-318 through DD-322

## Entry gate

The DD-313…DD-317 state closure is exact-head verified:
- Core Service Verify `36729969759` / `109936659428`: **1038/1038 PASS**, zero failed/skipped.
- PostgreSQL `36729969759` / `109936659897`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36729969824` / `109936660096`: PASS.
- Web Boundary Verify `36729969867` / `109936659692`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of F-01 Notification/Communication + Integration ownership, A-06 Event Catalog / transactional-outbox architecture, DD-090 raw RequestContext-scoped OutboxEvent evidence, DD-091 exact EventCatalog tuple reader, DD-169 NotificationDelivery→source-event exact-scope relationship, DD-298…DD-317 visible/composed/Integration-currentness Delivery evidence, and migrations 0008/0030 yields one independently source-complete evidence boundary:

- DD-317 already establishes one RequestContext-visible NotificationDelivery, valid known relationships, coherent raw attempt history, and conditional current TenantIntegration integrity before any deeper source-event catalog evidence is considered;
- when a Delivery has no sourceEventId, DD-169/DD-299 already establish that no source-event relationship evidence is required;
- when bound, DD-317 preserves the exact DD-302/DD-307 OutboxEvent reference that satisfied exact id/Tenant/scope/Industry relationship integrity;
- migration 0008 binds every OutboxEvent event_type/event_version to EventCatalog;
- migration 0030 strengthens that relation to exact `(event_type,event_version,scope_class)` and validates persisted envelope identity against the same tuple;
- DD-091 provides `EventCatalogReadPort.loadExact({eventType,eventVersion,scopeClass})` and deliberately returns ACTIVE or RETIRED as evidence without turning lifecycle into execution authority;
- no current source owns Notification dispatch readiness from Outbox status, EventCatalog lifecycle, payload-schema execution, webhook eligibility, consumer selection, retry/DLQ/replay, or send authorization.

## Determination

**SOURCE-COMPLETE for parent-first NotificationDelivery evidence + conditional exact source-event EventCatalog tuple evidence only.**

A successful result means only:
1. DD-317 succeeded for the supplied RequestContext and Delivery id;
2. if a source OutboxEvent is bound, an exact current EventCatalog row exists for the preserved event type/version/scope tuple;
3. the loaded catalog row still reports that exact tuple.

It does **not** mean the source event is dispatchable, ready, retryable, catalog-ACTIVE, payload-valid for current execution, webhook-eligible, consumable, or authorized to send a Notification.

## Locked DD-318…DD-322 contracts

### DD-318 — Establish DD-317 before EventCatalog access
Add a bounded composition that first invokes `loadNotificationDeliveryIntegrationCurrentIntegrityEvidence(...)` using the exact supplied RequestContext/id/evaluatedAt and all supplied Delivery/relationship/attempt/Integration-currentness ports.

If DD-317 returns null, return null and do not access EventCatalog.

Any DD-317 dependency/persistence error propagates unchanged and EventCatalog is not accessed.

### DD-319 — Conditional source-event branch
Inspect only `integrationEvidence.composed.relationships.event`.

If absent:
- return successful immutable DD-317 evidence with no `sourceEventCatalog` member;
- do not call EventCatalogReadPort.

If present:
- preserve that exact OutboxEvent object as the sole source-event identity authority;
- do not re-read or substitute another OutboxEvent.

### DD-320 — Exact EventCatalog tuple read
For a bound source event, call `EventCatalogReadPort.loadExact` exactly once with:
- exact `event.eventType`;
- exact `event.eventVersion`;
- exact `event.scopeClass`.

A null catalog result returns null. Reader errors propagate unchanged. No alternate version/scope/type lookup is allowed.

### DD-321 — Re-evaluate only the persisted exact tuple relation
Add pure helper `matchesOutboxEventCatalogTupleFloors(event, catalog)`.

Return true only when:
- event eventType is a non-empty string;
- event eventVersion is a positive safe integer;
- event scopeClass is one of PLATFORM_GLOBAL/TENANT_CORE/TENANT_INDUSTRY/EXPLICIT_CROSS_CONTEXT;
- catalog eventType/eventVersion/scopeClass exactly equal the preserved event tuple.

Do **not** interpret catalog status, producer, sensitivity, payloadSchema, webhookEligible, consumer classes, compatibility, retention or ordering metadata.

### DD-322 — Immutable Delivery + optional source-event catalog evidence envelope
On success return immutable:
- exact DD-317 `integrationEvidence` reference;
- optional `sourceEventCatalog` only for source-event-bound Delivery, containing:
  - exact preserved OutboxEvent reference;
  - exact loaded EventCatalog reference.

Inputs remain unchanged. No combined ready/dispatchable/sendable flag is synthesized.

## Fixed acceptance before implementation

- **NOTIF-EVTCAT-BASE-001** DD-317 executes first with exact supplied parent inputs before EventCatalog access.
- **NOTIF-EVTCAT-BASE-002** DD-317 null returns null and EventCatalog is not read.
- **NOTIF-EVTCAT-BASE-003** DD-317 error propagates unchanged and EventCatalog is not read.
- **NOTIF-EVTCAT-UNBOUND-001** no source event succeeds with exact DD-317 evidence and no EventCatalog read/evidence.
- **NOTIF-EVTCAT-READ-001** bound source event forwards exact type/version/scope tuple exactly once.
- **NOTIF-EVTCAT-READ-002** null catalog evidence returns null; reader error propagates unchanged.
- **NOTIF-EVTCAT-TUPLE-001** exact tuple match passes regardless of ACTIVE/RETIRED catalog status.
- **NOTIF-EVTCAT-TUPLE-002** type/version/scope mismatch or malformed event tuple fails closed.
- **NOTIF-EVTCAT-EVID-001** success preserves exact DD-317/Event/Catalog identities in immutable evidence.
- **NOTIF-EVTCAT-BOUND-001** inputs remain unchanged and output exposes no catalog-lifecycle/readiness/payload/webhook/dispatch/retry/provider/secret/send/mutation authority.
- **NOTIF-EVTCAT-BOUND-002** no fallback/alternate catalog lookup occurs after null or mismatch.

Expected executable delta: Core **1038 → 1049**. PostgreSQL remains **525**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, secret access, frontend or product-policy change.

This batch does **not** implement:
- recipient-principal currentness;
- complete NotificationDelivery validity;
- OutboxEvent PENDING/DISPATCHING/DISPATCHED/DEAD readiness interpretation;
- availableAt/lockedAt/lockedBy/attemptCount/error retry semantics;
- EventCatalog ACTIVE/RETIRED execution interpretation;
- payload-schema execution/validation or current envelope replay validation;
- producer/sensitivity policy interpretation;
- consumer selection or webhook eligibility/filtering;
- claim/lease/dispatch/retry/DLQ/replay;
- Notification channel→IntegrationCapability mapping;
- Integration health/fallback or ProviderAdapter selection;
- CredentialReference secret material access;
- template rendering/sanitization/fallback;
- send/retry/callback reconciliation;
- Delivery/Attempt/Event mutation or audit/metric append.

After DD-318…DD-322 implementation and targeted regression, run the governed Core/PostgreSQL/Database/Web batch-boundary verification before canonical promotion.
