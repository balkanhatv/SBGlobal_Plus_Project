# NotificationDelivery source-event current Tenant residency evidence batch ownership audit

**Date:** 2026-09-30  
**Baseline checkpoint:** `DEV-NOTIFICATION-DELIVERY-SOURCE-EVENT-ENVELOPE-EVIDENCE-001`  
**Verified entry HEAD:** `568459498f7c14dc6397512cf2f8312ec6a9ecd1`  
**Verified entry tree:** `d7d03ec5fccf430e937423fa8d031915ed71891e`  
**Governed batch:** DD-328 through DD-332

## Entry gate

The DD-323…DD-327 state closure is exact-head verified:
- Core Service Verify `36749367224` / `110003708454`: **1061/1061 PASS**, zero failed/skipped.
- PostgreSQL `36749367224` / `110003708071`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36749367243` / `110003708482`: PASS.
- Web Boundary Verify `36749367258` / `110003708649`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Source ownership reconciled

Fresh reconciliation of A-06 Event Catalog / transactional-outbox architecture, DD-07 §§1/4/16, DD-081 EventEnvelopeCatalogValidator, DD-090 raw OutboxEvent evidence, DD-169 NotificationDelivery→OutboxEvent exact-scope binding, DD-318…DD-327 source-event evidence, migration 0027 Notification-worker privileges, migration 0029 Tenant FORCE-RLS, and migration 0030 `validate_outbox_envelope_scope()` yields one independently source-complete **current Tenant residency evidence** boundary:

- DD-327 already proves the directly re-evaluable persisted envelope identity/catalog/local-scope evidence for the exact DD-322 source event.
- NotificationDelivery scope is only `TENANT_CORE | TENANT_INDUSTRY`; DD-169 requires the bound source OutboxEvent to have the exact same scope. Therefore a NotificationDelivery-bound source event cannot be PLATFORM_GLOBAL or EXPLICIT_CROSS_CONTEXT.
- migration 0030 requires every Tenant-scoped Outbox envelope `residencyRegion` to equal `core_tenancy.tenant.residency_region_code`.
- DD-07 consumer contract requires residency/data-home routing validation before payload interpretation.
- migration 0027 already grants `sbg_notification_worker_rw` SELECT on `core_tenancy.tenant`; migration 0029 FORCE-RLS restricts the Tenant row to the current Tenant.
- existing `RequestScopedSql` + `PostgresNotificationDatabase` already provide the fixed NOBYPASSRLS notification-worker transaction boundary.
- the current Tenant residency region can therefore be read exactly under the same resolved RequestContext without schema, grant, route or provider changes.
- no concrete EventPayloadValidatorPort implementation exists in the current source, so payload-schema execution remains outside this batch.

This batch re-evaluates **current residency equality**, not the historical residency value that existed when the Outbox row was first written.

## Determination

**SOURCE-COMPLETE for exact current Tenant residency evidence on an already DD-327-validated NotificationDelivery source event.**

A successful result means only that the source event's persisted envelope residency still equals the current authoritative Tenant residency region visible through the Notification-worker RLS boundary. It does **not** certify payload schema, catalog lifecycle, Outbox readiness/retry, recipient currentness, provider selection, rendering or dispatchability.

## Locked DD-328…DD-332 contracts

### DD-328 — Notification Tenant residency evidence/read port
Add immutable `NotificationTenantResidencyEvidence`:
- `tenantId`
- `residencyRegionCode`

Add `NotificationTenantResidencyReadPort.loadCurrentForContext({requestContext, tenantId})`.

The port is a current authoritative read only. It does not claim historical write-time residency.

### DD-329 — PostgreSQL current Tenant residency reader
Add `PostgresNotificationTenantResidencyStore` using existing `RequestScopedSql` / `PostgresNotificationDatabase`.

Require:
- resolved `TENANT_CORE | TENANT_INDUSTRY` RequestContext;
- valid RequestContext Tenant id;
- exact input `tenantId === requestContext.tenantId`;
- one parameterized read of `core_tenancy.tenant(id,residency_region_code)`;
- exact Tenant id match;
- non-empty residency region;
- immutable result;
- null for an RLS-hidden/absent Tenant row;
- fail closed for malformed/mismatched context/id or database failure.

No new role/grant/RLS policy is authorized.

### DD-330 — Source-event current residency floor
Add `matchesNotificationDeliverySourceEventCurrentResidencyFloors(sourceEventEnvelope, residency)`.

Require:
- DD-326 source-event envelope evidence remains valid;
- event scope is exactly `TENANT_CORE | TENANT_INDUSTRY`;
- valid event Tenant id;
- exact `residency.tenantId === event.tenantId`;
- exact envelope `tenantId === event.tenantId`;
- exact envelope `residencyRegion === residency.residencyRegionCode`.

Do not interpret EventCatalog status, payload schema, event readiness or Delivery lifecycle.

### DD-331 — Parent-first current-residency reader composition
Add `loadNotificationDeliverySourceEventCurrentResidencyEvidence(...)`.

Behavior:
1. establish DD-322 through the existing source-event catalog reader;
2. build DD-327 persisted-envelope evidence;
3. if parent evidence is null, return null and do not read residency;
4. if no source event is bound, return immutable DD-327 evidence without residency read/evidence;
5. if bound, call the residency read port exactly once using the exact supplied RequestContext and exact preserved event Tenant id;
6. null residency returns null; reader errors propagate unchanged;
7. require DD-330 before success.

No fallback Tenant lookup or alternate region source is allowed.

### DD-332 — Immutable DD-327 + current-residency evidence envelope
On bound success return immutable evidence preserving:
- the exact DD-327 evidence reference;
- the exact current Tenant residency evidence reference.

On unbound success preserve DD-327 evidence and expose no synthesized residency member.

Inputs remain unchanged. Output exposes no historical residency claim, payload-schema/catalog-lifecycle/readiness/retry/provider/render/send/mutation authority.

## Fixed acceptance before implementation

Core:
- **NOTIF-EVTRES-FLOOR-001** exact TENANT_CORE/TENANT_INDUSTRY current Tenant + envelope residency equality passes.
- **NOTIF-EVTRES-FLOOR-002** wrong Tenant, wrong/blank region, invalid scope or invalid parent envelope evidence fails closed.
- **NOTIF-EVTRES-BASE-001** DD-327 parent evidence is established before any residency read.
- **NOTIF-EVTRES-BASE-002** parent null/error returns null/propagates unchanged and residency is not read.
- **NOTIF-EVTRES-UNBOUND-001** unbound source event succeeds with exact DD-327 evidence and no residency read/evidence.
- **NOTIF-EVTRES-READ-001** bound source event forwards exact RequestContext + event Tenant id exactly once.
- **NOTIF-EVTRES-READ-002** null residency returns null; residency-reader error propagates unchanged.
- **NOTIF-EVTRES-EVID-001** success preserves exact DD-327/residency identities, immutable evidence, unchanged inputs, and no forbidden authority.

PostgreSQL:
- **NOTIF-EVTRES-PG-001** exact Industry-scoped current Tenant residency read preserves current region and immutable identity.
- **NOTIF-EVTRES-PG-002** Tenant-Core and sibling-Industry contexts of the same Tenant read the same Tenant residency evidence.
- **NOTIF-EVTRES-PG-003** foreign-Tenant input/context cannot read another Tenant's residency evidence.
- **NOTIF-EVTRES-PG-004** malformed/mismatched context/id or database-route mismatch fails closed.

Expected executable delta: Core **1061 → 1069**. PostgreSQL **525 → 529**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, provider SDK, secret access, frontend or product-policy change.

This batch does **not** implement:
- historical write-time Tenant residency reconstruction;
- PLATFORM_GLOBAL or EXPLICIT_CROSS_CONTEXT NotificationDelivery source-event handling (unreachable under DD-169 exact-scope binding);
- cross-context endpoint ownership;
- EventPayloadValidatorPort or payload-schema execution;
- complete DD-081 EventEnvelopeCatalogValidator execution;
- EventCatalog ACTIVE/RETIRED execution interpretation;
- webhook eligibility or consumer selection;
- Outbox PENDING/DISPATCHING/DISPATCHED/DEAD readiness;
- availableAt/lock/attempt/retry/DLQ/replay policy;
- recipient-principal currentness;
- channel→IntegrationCapability mapping beyond already-preserved evidence;
- Integration health/fallback, ProviderAdapter selection or credential material access;
- template rendering/sanitization;
- Notification dispatch/send/callback reconciliation;
- Delivery/Attempt/Event mutation or audit/metric append.

After DD-328…DD-332 implementation and targeted regression, run the governed Core/PostgreSQL/Database/Web batch-boundary verification before canonical promotion.
