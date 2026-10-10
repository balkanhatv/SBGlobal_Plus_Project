# WebhookDelivery source-event current Tenant residency evidence reader composition prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-WEBHOOK-DELIVERY-EVENT-ENVELOPE-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `23cb4d98b9fe203ad4181c5bae92750b5e1767a1`  
**Verified entry tree:** `cdb3d62b07935d5d2eeed68eb608827bdbd0ca7d`  
**Governed batch:** DD-518 through DD-522

## Entry gate

DD-513…DD-517 is fully closed at its bounded persisted event-envelope evidence scope. State-closure HEAD `23cb4d98b9fe203ad4181c5bae92750b5e1767a1` / tree `cdb3d62b07935d5d2eeed68eb608827bdbd0ca7d` passed exact-head push gates:
- Core Service Verify run `37273563695` / job `111645561255`: **1379/1379 PASS**, fail/skip 0.
- PostgreSQL same run / job `111645561503`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database Verify run `37273563700` / job `111645561354`: PASS, database inventory remains **48 migrations / 42 SQL verification files**.
- Web Boundary Verify run `37273563726` / job `111645561549`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource remains unchanged; `main` remains unmerged.

## Reconciled source owners

Fresh reconciliation of DD-07 event/outbox/webhook rules, DD-081 envelope validator ownership, DD-163 ordinary single-context Webhook necessary floors, DD-328…DD-332 historical Notification current-Tenant-residency evidence, migration 0028 Integration service grants, migration 0029 Tenant FORCE-RLS, migration 0030 persisted envelope residency checks, `PostgresIntegrationDatabase`, `RequestScopedSql`, and DD-513…DD-517 yields one new independently source-complete boundary:

- DD-517 already preserves the exact DD-512 Webhook parent plus exact persisted Outbox envelope reference and proves local Tenant scope shape for ordinary TENANT_CORE/TENANT_INDUSTRY delivery evidence.
- migration 0030 requires Tenant-scoped persisted envelope `residencyRegion` to equal the Tenant residency region at write-time validation.
- DD-328…DD-332 already prove the reusable current-residency equality semantics: current authoritative Tenant row, exact Tenant id equality, persisted envelope Tenant equality and exact residency-region equality. Those semantics are not Notification-specific.
- migration 0028 grants `sbg_integration_service_rw` SELECT on `core_tenancy.tenant`; migration 0029 FORCE-RLS constrains the row to the resolved Tenant.
- `PostgresIntegrationDatabase` fixes the runtime role to the existing NOBYPASSRLS `sbg_integration_service_rw` boundary, so Webhook current-residency evidence can be read without borrowing Notification-worker privileges.
- DD-163/DD-517 already reject PLATFORM_GLOBAL and EXPLICIT_CROSS_CONTEXT for the ordinary Webhook path; this batch remains limited to TENANT_CORE/TENANT_INDUSTRY.
- This proves **current** authoritative residency equality only. It does not reconstruct historical write-time residency and does not make a delivery authorization decision.
- Event payload-schema execution, EventCatalog lifecycle authorization, event-filter matching, endpoint/SSRF verification, signing/secret access, retry/DLQ/replay, explicit cross-context endpoint ownership and network dispatch remain source-incomplete or separately governed.

## Determination

**SOURCE-COMPLETE for exact DD-517 Webhook evidence + current authoritative Tenant residency equality only.**

A successful result means that the exact already-DD-517-valid persisted source-event envelope still names the same current Tenant and current residency region visible through the Integration service FORCE-RLS boundary.

It is not a historical residency claim, full EventEnvelopeCatalogValidator result, Webhook authorization or delivery authority.

## Frozen decisions

### DD-518 — establish exact DD-517 parent evidence first

Add `loadWebhookDeliveryEventCurrentResidencyEvidence(...)`.

Invoke `loadWebhookDeliveryEventEnvelopeCurrentEvidence(...)` first with exact supplied RequestContext, delivery id and existing reader dependencies unchanged.

Parent null returns null. Parent dependency errors propagate unchanged. No residency read occurs before DD-517 success.

### DD-519 — Integration-owned current Tenant residency evidence/read boundary

Add immutable `IntegrationTenantResidencyEvidence`:
- `tenantId`
- `residencyRegionCode`

Add `IntegrationTenantResidencyReadPort.loadCurrentForContext({requestContext, tenantId})`.

Add `PostgresIntegrationTenantResidencyStore` using existing `RequestScopedSql` under `PostgresIntegrationDatabase` / `sbg_integration_service_rw`.

Require:
- resolved TENANT_CORE | TENANT_INDUSTRY RequestContext;
- valid context Tenant/principal ids;
- exact input `tenantId === requestContext.tenantId`;
- one parameterized read of `core_tenancy.tenant(id,residency_region_code)`;
- exact id match and non-empty residency region;
- immutable result;
- null for RLS-hidden/absent row;
- fail closed for malformed/mismatched context/id or database failure.

No new role/grant/RLS policy is authorized.

### DD-520 — shared Integration-owned current-residency floor

Add a pure Integration/Event helper requiring:
- already-valid persisted Outbox envelope evidence;
- event scope exactly TENANT_CORE | TENANT_INDUSTRY;
- valid event Tenant id;
- exact `residency.tenantId === event.tenantId`;
- exact envelope `tenantId === event.tenantId`;
- exact envelope `residencyRegion === residency.residencyRegionCode`.

Refactor the historical Notification DD-330 wrapper/type surface to delegate to the shared Integration-owned types/floor without semantic change. Existing Notification tests must remain green unchanged.

Do not interpret payload schema, catalog lifecycle, event readiness or Webhook delivery state.

### DD-521 — exact one-read Webhook current-residency composition

After exact DD-517 success:
1. take exact `parent.parent.event.tenantId`;
2. call the Integration residency port exactly once with the exact supplied RequestContext and exact preserved Tenant id;
3. null returns null; errors propagate unchanged;
4. require DD-520 over exact DD-517 event/envelope and exact returned residency;
5. no fallback Tenant lookup or alternate region source.

### DD-522 — immutable current-residency evidence without delivery authority

Success returns frozen:
- exact DD-517 `parent`;
- exact `currentResidency` reference.

Do not clone/normalize evidence or mutate inputs.

Output exposes no:
- historical residency certification;
- payload-schema validation;
- EventCatalog ACTIVE/RETIRED decision;
- event-filter match;
- endpoint-safe/verified/SSRF result;
- signing/secret authority;
- retry/DLQ/replay/readiness/finality;
- EXPLICIT_CROSS_CONTEXT authorization;
- dispatch/network/send authority;
- GuardPipeline/Commercial authorization;
- mutation/event emission.

## Fixed acceptance before implementation

Core:
- **WH-EVTRES-BASE-001** exact DD-517 parent evidence executes first with identical inputs/dependencies and no residency read before success.
- **WH-EVTRES-BASE-002** DD-517 null/error short-circuits or propagates and residency is not read.
- **WH-EVTRES-READ-001** exact preserved event Tenant id + exact RequestContext are forwarded once to residency read.
- **WH-EVTRES-READ-002** null residency returns null and residency-reader errors propagate unchanged.
- **WH-EVTRES-FLOOR-001** exact TENANT_CORE/TENANT_INDUSTRY current Tenant + persisted envelope residency equality passes.
- **WH-EVTRES-FLOOR-002** wrong Tenant, blank/wrong region, invalid scope or invalid persisted envelope evidence fails closed.
- **WH-EVTRES-EVID-001** success preserves exact DD-517 parent/current-residency identities in an immutable result with inputs unchanged.
- **WH-EVTRES-BOUND-001** output exposes no historical-residency/payload/filter/endpoint/signing/retry/cross-context/dispatch/network/mutation/event authority.

PostgreSQL:
- **WH-EVTRES-PG-001** exact Industry-scoped current Tenant residency read preserves current region and immutable identity.
- **WH-EVTRES-PG-002** Tenant-Core and sibling-Industry contexts of the same Tenant read the same current Tenant residency evidence.
- **WH-EVTRES-PG-003** foreign-Tenant input/context cannot read another Tenant's residency evidence.
- **WH-EVTRES-PG-004** malformed/mismatched context/id or database-route failure fails closed.

Expected executable delta: Core **1379 → 1387**. PostgreSQL **532 → 536**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, RLS, role, grant, public route, frontend, worker/scheduler, provider SDK, secret-store call or RawSource change.

This batch does **not** implement:
- historical write-time residency reconstruction;
- EXPLICIT_CROSS_CONTEXT Webhook endpoint ownership;
- EventPayloadValidatorPort / payload-schema execution;
- EventCatalog ACTIVE/RETIRED execution interpretation;
- Webhook event-filter evaluation;
- endpoint verification / SSRF policy;
- signing or secret access;
- Outbox/Webhook readiness, retry, DLQ or replay;
- network/provider delivery;
- Delivery/Subscription/Event/Catalog mutation or event emission.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-518…DD-522 and the fixed acceptances.
