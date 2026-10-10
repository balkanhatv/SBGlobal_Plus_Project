# SyncCursor current-binding evidence reader composition prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-TENANT-INTEGRATION-CURRENT-INTEGRITY-EVIDENCE-READER-001`  
**Verified entry HEAD:** `8b12130f433f7cd7a255326bacc28bcaae9dfa1b`  
**Verified entry tree:** `2ff78fe110fe4deaa5b3e0cf4f0d40c0cdb21c50`  
**Governed batch:** DD-498 through DD-502

## Entry gate

DD-493…DD-497 is fully closed at its bounded evidence scope. State-closure HEAD `8b12130f433f7cd7a255326bacc28bcaae9dfa1b` / tree `2ff78fe110fe4deaa5b3e0cf4f0d40c0cdb21c50` passed exact-head push gates:
- Core Service Verify run `37264989329` / job `111619784451`: **1343/1343 PASS**, fail/skip 0.
- PostgreSQL same run / job `111619784385`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database Verify run `37264989382` / job `111619783840`: PASS, **48 migrations / 42 SQL verification files**.
- Web Boundary Verify run `37264989347` / job `111619783883`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Reconciled source owners

- DD-097 owns the exact raw SyncCursor tuple and `SyncCursorReadPort.loadExact`; cursor payload is intentionally opaque/encrypted evidence and does not imply resume validity.
- DD-095 owns exact RequestContext-visible TenantIntegration evidence through `TenantIntegrationReadPort.loadForContext`.
- DD-093 owns exact IntegrationCapability evidence through `IntegrationCapabilityReadPort.loadExact`.
- DD-164 owns the deterministic current parent/capability necessary floor mirroring migration 0030: exact cursor→TenantIntegration id, raw ACTIVE parent, exact Definition/capability identity, raw ACTIVE capability, exact enabled-capability membership, duplicate-free enabled set and exact Tenant-Core/Tenant-Industry nullable Industry shape.
- DD-164 explicitly excludes cursor decryption/interpretation, watermark/source-version freshness, provider selection, credential/secret access, health/profile policy, OperationContract/event execution, mutation and sync/resume/replay authority.
- DD-493…DD-497 now owns a generic TenantIntegration current-integrity evidence reader, but DD-164 deliberately does **not** require CredentialReference/Definition-set integrity to re-evaluate the SyncCursor binding predicate. This batch therefore must not strengthen DD-164 by composing DD-497 automatically.
- No current generic server-internal reader composes DD-097 + DD-095 + DD-093 into exact DD-164 current-binding evidence.

**SOURCE-COMPLETE:** add one generic SyncCursor current-binding evidence reader by exact persisted cursor tuple. Read the exact cursor first, then the exact visible parent TenantIntegration in the same RequestContext, then the exact IntegrationCapability under the parent Definition using the cursor capability code, and apply only DD-164. No cursor-content, current-integrity, provider, credential, secret, network or execution semantics are required.

## Frozen decisions

### DD-498 — exact raw SyncCursor tuple first

Add `loadSyncCursorCurrentBindingEvidence(...)`. Invoke `SyncCursorReadPort.loadExact` exactly once with:
- exact supplied RequestContext object;
- exact supplied TenantIntegration id;
- exact supplied capability code;
- exact supplied nullable Industry Context.

Null returns null before all parent/capability reads. Dependency errors propagate unchanged. Do not trim, normalize, alias or fall back to another tuple.

### DD-499 — exact same-context TenantIntegration parent read

After DD-498 succeeds, call `TenantIntegrationReadPort.loadForContext` exactly once with:
- the identical supplied RequestContext object;
- `tenantIntegrationId === cursor.tenantIntegrationId`.

Null returns null; errors propagate unchanged. Do not substitute another parent or call the DD-497 generic current-integrity reader.

### DD-500 — exact capability read under persisted parent Definition

After the parent is loaded, call `IntegrationCapabilityReadPort.loadExact` exactly once with:
- `integrationDefinitionId === integration.integrationDefinitionId`;
- `capabilityCode === cursor.capabilityCode`.

Null returns null; errors propagate unchanged. Do not infer direction/routing semantics or search/fallback to another capability.

### DD-501 — delegate exact evidence to DD-164 and preserve immutable references

Call `matchesCurrentSyncCursorBindingFloors(cursor, integration, capability)` exactly once with the exact reader-returned objects. False returns null.

Success returns frozen `{ cursor, integration, capability }`, preserving exact object references without clone, normalization or mutation.

### DD-502 — current binding evidence is not cursor validity or synchronization authority

Success proves only that the exact currently visible cursor still satisfies migration-0030's parent/capability binding predicates through DD-164.

Do not:
- decrypt/parse/interpret `cursorEncryptedOrOpaque`;
- decide freshness from watermarkTime/sourceVersion/updatedAt;
- authorize resume/replay/synchronization;
- interpret capability direction/OperationContract/event/data/rate/idempotency metadata;
- compose DD-497 CredentialReference/Definition-set integrity automatically;
- read credentials/secrets or select ProviderAdapter/provider;
- evaluate TenantIntegration health/profile/config policy;
- invoke GuardPipeline/Commercial authorization;
- perform network/provider/callback execution;
- mutate cursor/integration/capability state or emit events.

## Fixed acceptance before implementation

- **SYNC-EVID-BASE-001** exact RequestContext + supplied exact tuple reaches SyncCursor read first; null/error short-circuits before dependent reads.
- **SYNC-EVID-INT-001** exactly one TenantIntegration read receives the identical RequestContext and exact persisted cursor TenantIntegration id; null/error fails closed unchanged.
- **SYNC-EVID-CAP-001** exactly one IntegrationCapability read uses exact loaded parent Definition id + exact cursor capability code; null/error fails closed unchanged.
- **SYNC-EVID-FLOOR-001** exact DD-164 floor passes for matching active Tenant-Core and Tenant-Industry evidence.
- **SYNC-EVID-FLOOR-002** inactive/mismatched parent, disabled/non-active capability, definition/code mismatch, duplicate enabled-capability evidence or Industry-shape mismatch fails closed.
- **SYNC-EVID-EVID-001** success preserves exact Cursor/Integration/Capability references in a frozen envelope; inputs remain unchanged.
- **SYNC-EVID-OPAQUE-001** cursor payload, watermark, sourceVersion and updatedAt remain opaque/uninterpreted and do not independently create acceptance.
- **SYNC-EVID-BOUND-001** output exposes no cursor-valid/fresh/resumable, provider/secret, health/profile, OperationContract/event, GuardPipeline/Commercial, sync/network/dispatch/mutation authority.

Expected executable delta: Core **1343 → 1351**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, provider SDK, secret-store call, worker/scheduler or RawSource change.

This batch does **not**:
- compose DD-497 TenantIntegration full persisted-integrity evidence;
- decrypt or validate cursor contents;
- decide cursor freshness or ordering;
- authorize resume/replay/synchronization;
- infer INBOUND/OUTBOUND/BIDIRECTIONAL routing;
- resolve ProviderAdapter, CredentialReference or secret material;
- evaluate health/profile/commercial/permission policy;
- bind/execute OperationContracts/events;
- perform callback/network/provider execution;
- mutate cursor/integration/capability state or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-498…DD-502 and the eight fixed acceptances.
