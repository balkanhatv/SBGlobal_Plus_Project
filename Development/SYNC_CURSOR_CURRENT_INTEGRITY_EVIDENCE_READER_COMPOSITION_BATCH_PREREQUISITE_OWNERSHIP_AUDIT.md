# SyncCursor current-integrity evidence reader composition prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-SYNC-CURSOR-CURRENT-BINDING-EVIDENCE-READER-001`  
**Verified entry HEAD:** `f4a29d7b33f084083f0e7c539c5ba79da6c678c1`  
**Verified entry tree:** `e5b41db48edc900b9703c9de30bc7e002a69d8a5`  
**Governed batch:** DD-503 through DD-507

## Entry gate

DD-498…DD-502 is fully closed at its bounded current-binding evidence scope. State-closure HEAD `f4a29d7b33f084083f0e7c539c5ba79da6c678c1` / tree `e5b41db48edc900b9703c9de30bc7e002a69d8a5` passed exact-head push gates:
- Core Service Verify run `37266903960` / job `111625538061`: **1351/1351 PASS**, fail/skip 0.
- PostgreSQL same run / job `111625537891`: **532/532 PASS**, fail/skip 0; full database bootstrap PASS.
- Database Verify run `37266903957` / job `111625537978`: PASS, **48 migrations / 42 SQL verification files**.
- Web Boundary Verify run `37266903965` / job `111625537805`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource is unchanged; `main` remains unmerged.

## Reconciled source owners

- DD-502 owns exact current SyncCursor→TenantIntegration→cursor-capability binding evidence via DD-164. Its frozen parent preserves the exact visible TenantIntegration and exact cursor capability object.
- DD-497 owns generic TenantIntegration current-integrity evidence via DD-167: exact CredentialReference metadata, exact IntegrationDefinition, exact enabled IntegrationCapability evidence set and exact server-owned `evaluatedAt`.
- DD-164 already proves the cursor capability belongs to the exact parent Definition, is raw ACTIVE, is present in the parent enabled-capability set, and that the persisted enabled-capability set is duplicate-free.
- DD-166/DD-167 require one matching active capability row for every persisted enabled capability code but do not require a second database read of evidence already loaded with exact identity.
- Therefore the exact DD-502 cursor capability object may be reused at its persisted enabled-capability position; every other enabled code can be loaded exactly once under the same parent Definition id. This prevents duplicate cursor-capability evidence reads without weakening DD-167.
- The exact DD-502 parent TenantIntegration is the sole parent identity authority for this batch; no second TenantIntegration read is required or allowed.
- CredentialReference metadata remains metadata-only and does not expose secret locator/material.
- IntegrationDefinition provider/adapter/data-transfer metadata and IntegrationCapability direction/OperationContract/event/data/rate/idempotency metadata remain raw.
- Cursor payload/watermark/sourceVersion/updatedAt remain opaque and uninterpreted.
- No source owner currently makes the conjunction of DD-502 + DD-167 equivalent to cursor freshness, resume validity, synchronization authorization, provider selection, health approval, commercial authorization, network execution, dispatch or mutation authority.

**SOURCE-COMPLETE:** add one generic SyncCursor current-integrity evidence reader that first reuses exact DD-502 current-binding evidence, then materializes only the remaining exact DD-167 parent-integrity dependencies around the already-loaded parent integration, reusing the exact DD-502 cursor capability object in the full enabled-capability evidence sequence.

## Frozen decisions

### DD-503 — exact DD-502 parent evidence first

Add `loadSyncCursorCurrentIntegrityEvidence(...)`. Invoke `loadSyncCursorCurrentBindingEvidence(...)` first with the exact supplied:
- RequestContext object;
- TenantIntegration id;
- capability code;
- nullable Industry Context;
- cursor/integration/capability readers.

Parent null returns null before CredentialReference/Definition/extra-capability reads. Parent dependency errors propagate unchanged.

Do not re-read or substitute another SyncCursor or TenantIntegration.

### DD-504 — exact CredentialReference metadata and IntegrationDefinition reads

After DD-502 succeeds, read:
1. `CredentialReferenceMetadataReadPort.loadForContext` exactly once using:
   - the identical supplied RequestContext object;
   - `parent.integration.credentialReferenceId`.
2. `IntegrationDefinitionReadPort.loadById` exactly once using:
   - `parent.integration.integrationDefinitionId`.

Required null evidence returns null. Errors propagate unchanged. Do not access secret locator/material, switch context, resolve provider adapter or fall back to another Definition/Credential.

### DD-505 — materialize the exact enabled-capability sequence without re-reading the cursor capability

Iterate `parent.integration.enabledCapabilities` in exact persisted order.

For each code:
- if it exactly equals `parent.cursor.capabilityCode`, append the exact already-loaded `parent.capability` object and perform **zero** additional capability read for that code;
- otherwise call `IntegrationCapabilityReadPort.loadExact` exactly once with:
  - `integrationDefinitionId === parent.integration.integrationDefinitionId`;
  - exact persisted enabled capability code.

No normalize/sort/dedupe/alias/fallback behavior is permitted. Missing required capability returns null; reader errors propagate unchanged.

DD-164 already guarantees duplicate-free enabled-capability evidence and exact membership of the cursor code; this batch does not add alternate handling for malformed parents.

### DD-506 — delegate exact assembled evidence to DD-167 and preserve immutable references

Freeze the full capability evidence array, preserving exact persisted order and exact object identities, then call `matchesCurrentTenantIntegrationIntegrityFloors(...)` exactly once with:
- exact `parent.integration`;
- exact loaded CredentialReference metadata;
- exact supplied server-owned `evaluatedAt`;
- exact loaded IntegrationDefinition;
- exact frozen capability evidence array.

False returns null.

Success returns frozen:
- exact `parent` DD-502 evidence;
- `integrationCurrentIntegrity` containing exact:
  - `integration === parent.integration`;
  - CredentialReference metadata;
  - IntegrationDefinition;
  - frozen capability evidence array;
  - supplied `evaluatedAt`.

Inputs remain unchanged.

### DD-507 — combined current binding + parent integrity is still evidence-only

Success proves only:
1. the exact SyncCursor currently satisfies DD-164 parent/capability binding; and
2. that exact parent TenantIntegration currently satisfies DD-167 persisted-integrity at the supplied evaluation instant.

Do not:
- decrypt/parse/interpret cursor payload;
- decide cursor freshness, ordering, replay safety or resumability;
- authorize synchronization, polling, callback, provider/network or worker execution;
- inspect secret locator/material;
- select provider/ProviderAdapter;
- interpret TenantIntegration lifecycle/health/profile/permission policy beyond DD-167 inputs;
- interpret capability direction/OperationContract/event/data/rate/idempotency as routing/execution authority;
- invoke GuardPipeline/Commercial authorization;
- mutate SyncCursor/TenantIntegration/Capability state or emit events.

## Fixed acceptance before implementation

- **SYNC-INTCUR-BASE-001** exact DD-502 parent executes first with unchanged input/read ports.
- **SYNC-INTCUR-BASE-002** DD-502 null/error short-circuits or propagates before Credential/Definition/remaining-capability reads.
- **SYNC-INTCUR-CRED-001** exact same-context CredentialReference metadata read uses preserved parent credentialReferenceId; null/error fails closed unchanged.
- **SYNC-INTCUR-DEF-001** exact IntegrationDefinition read uses preserved parent integrationDefinitionId; null/error fails closed unchanged.
- **SYNC-INTCUR-CAP-001** full capability evidence preserves persisted enabled-code order, reuses exact DD-502 cursor capability with zero duplicate read, and exact-reads every remaining enabled code once.
- **SYNC-INTCUR-DEP-001** required missing remaining capability or dependency error fails closed/propagates with no fallback.
- **SYNC-INTCUR-FLOOR-001** exact assembled evidence satisfying DD-167 passes with exact supplied evaluatedAt.
- **SYNC-INTCUR-FLOOR-002** credential/definition/config/enabled-capability integrity mismatch fails closed.
- **SYNC-INTCUR-EVID-001** success returns frozen exact parent/integration/credential/definition/capability references and leaves inputs/evidence unchanged.
- **SYNC-INTCUR-BOUND-001** output exposes no cursor-valid/fresh/resumable, provider/secret/health/profile, GuardPipeline/Commercial, sync/network/dispatch/mutation/event authority.

Expected executable delta: Core **1351 → 1361**. PostgreSQL remains **532**. Database inventory remains **48 migrations / 42 verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, provider SDK, secret-store call, worker/scheduler or RawSource change.

This batch does **not**:
- add a second TenantIntegration read;
- re-read the DD-502 cursor capability;
- decrypt or validate cursor contents;
- decide cursor freshness, ordering, resume or replay safety;
- authorize synchronization or polling;
- resolve ProviderAdapter/provider;
- access CredentialReference secret locator/material;
- interpret health/profile/permission policy;
- authorize OperationContracts/events;
- invoke GuardPipeline/Commercial authorization;
- perform callback/network/provider execution;
- mutate cursor/integration/capability state or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-503…DD-507 and the ten fixed acceptances.
