# SyncCursor PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline checkpoint:** `DEV-CREDENTIAL-METADATA-READ-001`  
**Verified executable basis:** `5586ebbed06671a70d241f6bd2726aba55364529`  
**Scope:** next independent Integration persistence slice after DD-096.

## Source reconciliation

DD-06 §15 SyncCursor contract, migration 0025 `sync_cursor` schema/parent FORCE-RLS,
migration 0028 exact uniqueness hardening and Integration-service privileges, and
migration 0030 SyncCursor capability/scope integrity were reconciled.

The persisted tuple is exact:

- TenantIntegration id;
- capability code;
- optional Industry Context id;
- opaque/encrypted cursor string;
- optional watermark timestamp;
- optional source version;
- updated timestamp.

Migration 0028 makes `tenantIntegrationId + capabilityCode + COALESCE(industryContextId)`
unique. Migration 0030 allows writes only when the parent TenantIntegration is ACTIVE,
the capability is ACTIVE under the same IntegrationDefinition, the capability is in
the integration's enabled set, and the cursor Industry Context exactly matches the
parent integration scope.

RLS visibility is inherited through the parent TenantIntegration.

## Determination

A concrete **exact raw SyncCursor reader** is source-complete.

The cursor value is intentionally opaque/encrypted persistence evidence. Reading it
does not authorize sync execution, imply cursor validity/currentness, decrypt it, or
decide resume/replay semantics.

## Authorized implementation boundary

Implement:

1. immutable typed `PersistedSyncCursor`;
2. `SyncCursorReadPort.loadExact(requestContext,tenantIntegrationId,
   capabilityCode,industryContextId?)`;
3. `PostgresSyncCursorStore` through fixed Integration service role +
   `RequestScopedSql`;
4. one parameterized exact tuple read using `IS NOT DISTINCT FROM` for nullable
   Industry Context;
5. UUID/non-empty-text/timestamp validation;
6. null for absent/mismatched/RLS-hidden tuple;
7. PostgreSQL acceptance proving:
   - exact Industry tuple fidelity;
   - sibling/foreign parent isolation;
   - Tenant Core tuple visibility from same-Tenant Industry and Tenant Core contexts;
   - no capability/context fallback;
   - malformed input / route mismatch fail closed.

The reader may return `cursorEncryptedOrOpaque` internally exactly as persisted.
It must not decrypt/interpret it, mutate cursor state, execute synchronization,
select provider runtime, read secrets, or expose the cursor through a public route.

No migration, role, grant, secret-store call, provider SDK, sync execution or product
policy change is authorized.

Acceptance: INT-CURSOR-PG-001…005.
