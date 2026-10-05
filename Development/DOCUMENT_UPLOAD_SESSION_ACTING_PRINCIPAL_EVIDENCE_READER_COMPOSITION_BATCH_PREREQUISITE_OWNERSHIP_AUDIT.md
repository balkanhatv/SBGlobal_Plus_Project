# Document upload-session acting-principal ownership evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-DOCUMENT-ACCESS-ACL-STORAGE-BINDING-EVIDENCE-READER-001`  
**Verified entry HEAD:** `f69750583dcea79c246b8e08cd74529dd0c86f7a`  
**Verified entry tree:** `099d0c85d1d6916f3f4be02d9bd2a62b81932814`  
**Governed batch:** DD-553 through DD-557

## Entry gate

DD-548…DD-552 canonical promotion and state closure are exact-head verified:
- Core Service Verify push run `37344856385` / job `111880754473`: **1436/1436 PASS**, zero failed/skipped.
- PostgreSQL same run / job `111880754770`: **536/536 PASS**, zero failed/skipped; full database bootstrap PASS.
- Database Verify push run `37344856345` / job `111880754983`: PASS with **48 migrations / 42 SQL verification files**.
- Web Boundary Verify push run `37344856381` / job `111880754966`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource remains unchanged; `main` remains unmerged.

## Source reconciliation

DD-087 already owns the raw typed `DocumentUploadSessionReadPort` and concrete PostgreSQL reader. The persisted session preserves Tenant/optional Industry scope, `scopeClass`, `principalId`, media/size/expiry/status/temp-object/checksum facts and timestamps exactly.

Migration 0006 owns the physical FORCE-RLS policy:
- read visibility requires exact current Tenant plus TENANT_CORE/null-Industry or TENANT_INDUSTRY/exact current Industry Context;
- write `WITH CHECK` repeats that scope floor and additionally requires `principal_id = core_tenancy.current_principal_id()`.

Migration 0031 additionally requires the persisted upload-session principal to be active for the Tenant at the evidence creation timestamp. That is creation-time integrity only; it is not a current-principal activity check.

DD-087 intentionally leaves current upload usability unresolved: expiry boundary handling, status progression, `maxSizeClass`, media policy, checksum/temp-object satisfaction and mutation eligibility are not executable product rules here.

## Determination

**SOURCE-COMPLETE for one bounded current acting-principal ownership evidence composition only.**

The new reader may re-apply only the exact scope/principal facts already owned by migration 0006 to one raw DD-087 session. It must not interpret session usability or authorize an upload mutation.

## Locked DD-553…DD-557 contracts

### DD-553 — Establish exact DD-087 raw session first

Add `loadDocumentUploadSessionActingPrincipalEvidence(...)`.

Its first governed action invokes the supplied `DocumentUploadSessionReadPort.loadForContext` exactly once with:
- exact supplied RequestContext;
- exact supplied upload-session id.

Null remains null. Dependency/current-state errors propagate unchanged. No alternate session lookup or retry is allowed.

### DD-554 — Re-apply exact protected Tenant scope continuity only

For returned session evidence require:
- exact `session.tenantId === requestContext.tenantId`;
- exact `session.scopeClass === requestContext.scopeClass`;
- TENANT_CORE requires both session and RequestContext Industry Context absent;
- TENANT_INDUSTRY requires exact non-null `session.industryContextId === requestContext.industryContextId`.

Any mismatch fails closed. Do not synthesize another context or fall back across Tenant Core/Industry scopes.

### DD-555 — Re-apply exact current acting-principal ownership floor

Require exact `session.principalId === requestContext.principalId`.

This mirrors only migration-0006 write ownership evidence. It does not prove the principal is currently ACTIVE and it does not authorize any state transition, StoragePort call or upload completion.

### DD-556 — Preserve immutable exact-reference evidence

Success returns frozen `{ session }`, preserving the exact DD-087 session object reference without cloning, normalization or reinterpretation.

All expiry/status/media/size/temp-object/checksum/createdAt facts remain raw.

### DD-557 — Stop before upload usability or mutation authority

Do not:
- interpret `expiresAt`;
- decide allowed status/state transitions;
- interpret `maxSizeClass` or allowed media types;
- validate checksum/temp-object policy;
- claim current principal activity/membership beyond the supplied RequestContext;
- evaluate permission/entitlement/RBAC/ABAC;
- choose/sign/dispatch StoragePort operations;
- create/finalize/cancel/activate an upload session;
- mutate Document/Storage/session state or emit events.

## Fixed acceptance before implementation

- **DOC-UPOWN-BASE-001** exact DD-087 read executes once with exact RequestContext/session id.
- **DOC-UPOWN-BASE-002** DD-087 null returns null and dependency errors propagate unchanged with no retry/fallback.
- **DOC-UPOWN-SCOPE-001** exact Tenant-Core and Tenant-Industry session/context scope continuity passes.
- **DOC-UPOWN-SCOPE-002** Tenant, scopeClass, null-vs-present Industry or sibling-Industry mismatch fails closed.
- **DOC-UPOWN-PRINCIPAL-001** exact persisted session.principalId === RequestContext.principalId passes.
- **DOC-UPOWN-PRINCIPAL-002** acting-principal mismatch fails closed without alternate-owner/currentness lookup.
- **DOC-UPOWN-EVID-001** success returns frozen exact session-reference evidence and leaves all raw upload facts unchanged.
- **DOC-UPOWN-BOUND-001** output exposes no usable/expired/transition/media-size/checksum/storage-dispatch/upload-mutation/finalization authority.

Expected executable delta: Core **1436 → 1444**. PostgreSQL remains **536/536**. Database inventory remains **48 migrations / 42 SQL verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, public route, signer, provider SDK, StoragePort implementation, frontend or product-policy change.

This batch does **not** define upload expiry semantics, status transition rules, media/size classes, checksum policy, temporary-object validity, current principal activity, authorization, upload completion/finalization, storage dispatch or mutation.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-553…DD-557 and the fixed acceptances above.
