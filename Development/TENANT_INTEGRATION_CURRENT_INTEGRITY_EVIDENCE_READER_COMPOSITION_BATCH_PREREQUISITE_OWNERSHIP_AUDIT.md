# TenantIntegration current-integrity evidence reader composition prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-WORKFLOW-TRANSITION-VISIBLE-INSTANCE-DEFINITION-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `705a9046e679e2907337e97e62b4f5081858257c`  
**Verified entry tree:** `9c01ac7e00ba9a798bde7d3142f87738ff7555f9`  
**Governed batch:** DD-493 through DD-497

## Entry gate

DD-488…DD-492 is fully closed at its bounded evidence scope. The closure-record HEAD `705a9046e679e2907337e97e62b4f5081858257c` passed exact-head push gates:
- Core Service Verify run `37261689653` / job `111610064818`: **1335/1335 PASS**, fail/skip 0.
- PostgreSQL same run / job `111610064547`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database Verify run `37261689780` / job `111610064896`: PASS, **48 migrations / 42 SQL verification files**.
- Web Boundary Verify run `37261689632` / job `111610064340`: PASS.
- Pull-request Core/Database/Web workflows on the same closure-record HEAD also passed.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Reconciled source owners

- DD-095 owns the exact RequestContext-scoped raw TenantIntegration read by id. Its status, health, config, enabledCapabilities and permissionProfileId remain raw evidence.
- DD-096 owns exact RequestContext-scoped CredentialReference metadata-only reads and deliberately excludes secret material/secret_reference.
- DD-092 owns exact IntegrationDefinition catalog reads by id.
- DD-093 owns exact IntegrationCapability reads by `integrationDefinitionId + capabilityCode`.
- DD-165 owns the exact TenantIntegration→CredentialReference current binding/currentness floor, including same Tenant/scope compatibility, raw ACTIVE credential status and expiry relative to a supplied server-owned evaluation instant.
- DD-166 owns the exact IntegrationDefinition/config/enabled-capability current-set floor, including exact Definition identity/raw ACTIVE status, JSON-object config, duplicate-free enabled codes and exactly one ACTIVE matching capability evidence row per enabled code.
- DD-167 owns the pure conjunction `matchesCurrentTenantIntegrationIntegrityFloors(...)` and explicitly adds no lifecycle/provider/secret/network/execution authority.
- `CredentialReferenceMetadataReadPort.loadForContext`, `IntegrationDefinitionReadPort.loadById`, and `IntegrationCapabilityReadPort.loadExact` are the existing source-owned read boundaries required to materialize DD-167 evidence.
- Existing Notification DD-313…DD-317 proves this exact underlying evidence shape can be loaded safely for an already-related TenantIntegration, but no generic Integration-owned by-id current-integrity evidence reader exists.
- TenantIntegration raw `status`, `healthState`, `permissionProfileId`; CredentialReference provider/type/key-version/rotation metadata; Definition provider/data-transfer/adapter metadata; Capability direction/OperationContract/event/data/idempotency/rate metadata remain uninterpreted.

**SOURCE-COMPLETE:** add one generic Integration-owned current-integrity evidence reader by TenantIntegration id. Read the visible TenantIntegration first, then the exact referenced CredentialReference in the same RequestContext, the exact referenced IntegrationDefinition, and exactly the persisted enabled capability codes through their existing exact read port. Apply only DD-167 with the exact supplied evaluation instant. No provider/secret/profile/health/OperationContract/event/network or execution semantics are required.

## Frozen decisions

### DD-493 — exact visible TenantIntegration first

Add `loadTenantIntegrationCurrentIntegrityEvidence(...)`. Invoke `TenantIntegrationReadPort.loadForContext` exactly once with the exact supplied RequestContext object and TenantIntegration id. Null returns null before all dependent reads; dependency errors propagate unchanged.

### DD-494 — exact same-context CredentialReference metadata read

After DD-493 succeeds, call `CredentialReferenceMetadataReadPort.loadForContext` exactly once with:
- the identical supplied RequestContext object;
- `credentialReferenceId === integration.credentialReferenceId`.

Null returns null; dependency errors propagate unchanged. Do not retrieve secret_reference/material or switch context.

### DD-495 — exact Definition and persisted enabled Capability evidence

Read `IntegrationDefinitionReadPort.loadById(integration.integrationDefinitionId)` exactly once. Null returns null; errors propagate unchanged.

Then iterate the persisted `integration.enabledCapabilities` in its original order. For each persisted entry, call `IntegrationCapabilityReadPort.loadExact` with exactly:
- `integrationDefinitionId === integration.integrationDefinitionId`;
- `capabilityCode === persisted entry`.

An empty enabled set performs zero capability reads. Do not trim, lowercase, deduplicate, sort, alias, substitute or fall back. Null returns null; dependency errors propagate unchanged. Duplicate persisted codes therefore remain duplicated raw input and DD-166 decides fail-closed semantics.

### DD-496 — exact DD-167 integrity floor and immutable evidence

Freeze the collected capability array, then call `matchesCurrentTenantIntegrationIntegrityFloors(integration, credential, evaluatedAt, definition, capabilities)` exactly once. False returns null.

Success returns frozen `{ integration, credential, definition, capabilities, evaluatedAt }`, preserving the exact reader-returned object references and exact supplied evaluation string. No clone, normalization or mutation.

### DD-497 — current integrity evidence is not Integration execution authority

A success proves only that the exact currently visible TenantIntegration still satisfies the migration-0030 CredentialReference + Definition/config/enabled-Capability necessary integrity floors at the supplied evaluation instant.

Do not:
- decide whether TenantIntegration raw status is executable or healthState is healthy;
- resolve permissionProfileId;
- dereference secret_reference or fetch/decrypt secret material;
- select ProviderAdapter/provider/fallback;
- interpret credential type/key version/rotation beyond DD-165;
- authorize SyncCursor resume or synchronization;
- interpret Capability direction/OperationContract/event/data/rate/idempotency metadata;
- evaluate CommercialGuard/GuardPipeline;
- perform callback/network/provider execution;
- mutate Integration/Credential/Capability state or emit events.

## Fixed acceptance before implementation

- **INT-EVID-BASE-001** exact RequestContext/id reaches TenantIntegration read first; null/error short-circuits before all dependent reads.
- **INT-EVID-CRED-001** exactly one CredentialReference metadata read receives the identical RequestContext and exact persisted credentialReferenceId; null/error fails closed unchanged.
- **INT-EVID-DEF-001** exactly one IntegrationDefinition read uses the exact persisted integrationDefinitionId; null/error fails closed unchanged.
- **INT-EVID-CAP-001** enabled capabilities are read in persisted order with exact Definition id/code; empty set performs zero reads; no normalization/dedup/fallback; null/error fails closed.
- **INT-EVID-FLOOR-001** exact DD-165 + DD-166 conjunction through DD-167 passes for matching current evidence and exact supplied evaluation instant.
- **INT-EVID-FLOOR-002** credential expiry/status/scope mismatch or Definition/config/capability mismatch fails closed.
- **INT-EVID-EVID-001** success preserves exact Integration/Credential/Definition/Capability references plus exact evaluatedAt in a frozen envelope; inputs remain unchanged.
- **INT-EVID-BOUND-001** output exposes no executable-status/health/profile/secret/provider/OperationContract/event/sync/network/callback/GuardPipeline/mutation authority.

Expected executable delta: Core **1335 → 1343**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 SQL verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, provider SDK, secret-store call, scheduler/worker or RawSource change.

This batch does **not**:
- reinterpret TenantIntegration status/health;
- define permission-profile semantics;
- access secret references/material;
- choose ProviderAdapter/provider;
- authorize capabilities as executable;
- bind or execute OperationContracts/events;
- resume SyncCursor or execute synchronization;
- perform callback/network traffic;
- evaluate rate/retry/circuit/residency/fallback policy;
- mutate state or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-493…DD-497 and the eight fixed acceptances.
