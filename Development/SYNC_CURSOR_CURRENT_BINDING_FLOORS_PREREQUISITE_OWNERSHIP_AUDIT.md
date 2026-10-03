# SyncCursor current-binding necessary floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-WEBHOOK-DELIVERY-NECESSARY-FLOORS-001`  
**Verified synchronized basis:** `e953646468f77eaa47fdb5a64bb397f23157ee6f`  
**Scope:** next independent source-complete Integration prerequisite after the post-DD-163 Webhook boundary lock.

## Source reconciliation

DD-06 §15 defines `TenantIntegration`, `IntegrationCapability` and `SyncCursor`.  
DD-093 owns exact IntegrationCapability evidence.  
DD-095 owns exact RLS-visible TenantIntegration evidence.  
DD-097 owns exact raw SyncCursor evidence.

Migration 0030's `validate_sync_cursor_scope()` is deterministic and exact: a SyncCursor write is valid only when:

- its parent TenantIntegration exists and is `ACTIVE`;
- the exact IntegrationCapability belongs to the same IntegrationDefinition and is `ACTIVE`;
- the capability code is explicitly in `TenantIntegration.enabled_capabilities`;
- the cursor Industry Context is exactly the parent TenantIntegration Industry Context, including null-for-Tenant-Core.

Migration 0028 makes the cursor tuple unique by TenantIntegration + capability + nullable Industry Context. DD-097 explicitly preserves the cursor value as opaque evidence and forbids sync execution semantics.

Because parent/capability lifecycle can change after a cursor row was written, one pure current-evidence composition can safely re-evaluate only these already-owned binding predicates without interpreting the cursor or authorizing synchronization.

## Determination

One deterministic server-internal **current SyncCursor binding necessary floor** is source-complete.

It answers only whether already-loaded DD-097 cursor evidence still satisfies the exact DD-095/DD-093 parent/capability binding predicates owned by migration 0030.

A true result is **not sync authorization, cursor validity, resume authority or provider execution authority**.

## Authorized DD-164 boundary

Implement:

`matchesCurrentSyncCursorBindingFloors(cursor, tenantIntegration, capability)`.

It must:

1. require valid immutable identity shape and exact `cursor.tenantIntegrationId === tenantIntegration.id`;
2. require `tenantIntegration.status === 'ACTIVE'`;
3. require exact `capability.integrationDefinitionId === tenantIntegration.integrationDefinitionId`;
4. require exact non-empty capability code equality across cursor/capability and membership in `tenantIntegration.enabledCapabilities`;
5. require `capability.status === 'ACTIVE'`;
6. require exact Industry shape:
   - TENANT_CORE => both parent and cursor Industry Context absent;
   - TENANT_INDUSTRY => one valid exact parent Industry Context and exact cursor equality;
7. fail closed on malformed IDs, duplicate enabled-capability evidence or structurally invalid scope shape;
8. leave all inputs unchanged.

## Explicitly uninterpreted

DD-164 must not:

- decrypt, parse or compare cursor payload semantics;
- decide freshness from watermark/sourceVersion/updatedAt;
- choose INBOUND/OUTBOUND/BIDIRECTIONAL behavior;
- execute an OperationContract or event;
- select ProviderAdapter;
- read CredentialReference or secret material;
- interpret TenantIntegration health/config/permission-profile;
- mutate cursor/integration/capability state;
- call a provider/network;
- authorize resume/replay/synchronization;
- change SQL/RLS/roles/grants/routes.

## Acceptance target

- `SYNC-BIND-001` exact active Tenant-Industry parent/capability/cursor matches;
- `SYNC-BIND-002` exact active Tenant-Core null-Industry binding matches;
- `SYNC-BIND-003` non-ACTIVE TenantIntegration fails;
- `SYNC-BIND-004` definition/capability mismatch, disabled capability or non-ACTIVE capability fails;
- `SYNC-BIND-005` sibling/missing/unexpected Industry Context fails;
- `SYNC-BIND-006` malformed identity / duplicate enabled-capability evidence fails closed;
- `SYNC-BIND-007` cursor content, watermark, source version, health/config/direction and other unowned semantics do not create acceptance and inputs remain unchanged.

Expected Core delta: +7 tests. PostgreSQL/database schema remains unchanged.
