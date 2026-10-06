# Document derivative-parent current evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-06  
**Baseline checkpoint:** `DEV-DOCUMENT-ACCESS-SOURCE-RESOURCE-IDENTITY-EVIDENCE-READER-001`  
**Verified entry HEAD:** `caf999337a7642d1a64fb3363a0185967fe9cb1a`  
**Verified entry tree:** `76489cb02adf88e9d15ab38dbe6f9e74c0c15169`  
**Governed batch:** DD-578 through DD-582

## Entry gate

DD-573…DD-577 corrected canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37425483724`: Core job `112144047422` **1475/1475 PASS**, PostgreSQL job `112144047672` **536/536 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37425483722` / job `112144047759` PASS with unchanged **48 migrations / 42 SQL verification files**. Web run `37425483788` / job `112144047869` PASS.

This closes DD-573…DD-577 at its bounded evidence scope. PR #2 remains open/draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled source ownership

- DD-08 §8 states that a derivative references a parent supplied together with the derivative id; the parent must be ACTIVE/CLEAN and parent/derivative must remain in the exact Tenant/context/residency boundary.
- DD-08 §8 also states that a derivative cannot lower sensitivity and cannot widen ACL.
- Migration 0006 already persists `document_meta.parent_document_id` and `derivative_type` beside Tenant, Industry Context, scope class, sensitivity, residency, status and virus-scan state.
- Migration 0006 already places `document_meta` behind FORCE RLS. Migration 0028 grants the existing NOBYPASSRLS `sbg_document_service_rw` role access to Document metadata; `PostgresDocumentDatabase` fixes that role and `RequestScopedSql` supplies the resolved RequestContext.
- DD-083 intentionally projects only DD-082 pre-sign candidate fields and does **not** expose `parent_document_id` or `derivative_type`; widening DD-082 would conflate generic access-candidate ownership with derivative-specific relationship evidence.
- The current source enumerates sensitivity labels but does **not** define a canonical total ordering/rank among `PUBLIC | INTERNAL | CONFIDENTIAL | SENSITIVE_PERSONAL | REGULATED`. Therefore Development must not invent a rank merely to implement “cannot lower sensitivity”.
- The current source also does not define derivative ACL-inheritance/reduction mechanics sufficient to compare parent/child ACL sets here.

**SOURCE-COMPLETE:** add one dedicated, same-RequestContext derivative-parent read/evidence boundary that proves exact persisted derivative→parent identity, same Tenant/scope/Industry/residency continuity and parent ACTIVE+CLEAN currentness while preserving derivative/parent sensitivity, derivative type/status/virus facts as raw evidence. Sensitivity monotonicity and ACL non-widening remain explicit unresolved policy seams.

## Frozen decisions

**DD-578 — exact supplied derivative/parent pair under one resolved RequestContext.** Add a dedicated `DocumentDerivativeParentCurrentEvidenceReadPort` and `loadDocumentDerivativeParentCurrentEvidence(...)`. Input carries exact RequestContext, derivativeDocumentId and parentDocumentId. Perform exactly one relationship read; null remains null and dependency errors propagate unchanged. No alternate-parent search, source-resource fallback or generic DD-082 reread.

**DD-579 — exact persisted derivative relationship only.** The persisted evidence must identify the exact supplied derivative id and exact supplied parent id, and must contain a non-empty persisted derivativeType. Any mismatch, malformed id/type or unexpected relationship fails closed. Do not infer derivative type from media type, filename, source resource or caller metadata.

**DD-580 — exact parent safety + Tenant/context/residency continuity floor.** Require derivative and parent to share exact tenantId, scopeClass, nullable industryContextId and residencyRegion. TENANT_INDUSTRY evidence must equal the resolved RequestContext Industry Context; TENANT_CORE evidence remains same-Tenant Core evidence under the existing visibility model. Parent must be exactly status ACTIVE and virusScanStatus CLEAN. Do not require derivative ACTIVE/CLEAN here because DD-08 §8 places the explicit current-safety predicate on the referenced parent.

**DD-581 — immutable raw sensitivity/lifecycle evidence without invented ranking.** Success returns frozen exact-reference evidence preserving derivativeType plus derivative/parent sensitivityClass, status, virusScanStatus, residency and ownership fields unchanged. Do **not** compare sensitivity classes in this batch because no canonical ordering contract is source-owned. Record the sensitivity-monotonicity requirement as unresolved, not satisfied.

**DD-582 — no ACL, final authorization, signing/storage or derivative mutation authority.** Do not compare/merge parent-child ACLs; do not claim “ACL cannot widen” is enforced; do not map permissions/entitlements or call AuthorizationDecisionService/GuardPipeline; do not select/decrypt provider, sign access, expose download/share/delete, dispatch StoragePort, purge/rebuild derivatives, mutate DocumentMeta or emit events.

## Fixed acceptance before implementation

- **DOC-DERIV-BASE-001** exact RequestContext + derivativeDocumentId + parentDocumentId cause exactly one derivative-parent read.
- **DOC-DERIV-BASE-002** null remains null and dependency/persistence errors propagate unchanged with no retry or alternate-parent search.
- **DOC-DERIV-REL-001** exact persisted derivative id + parent id + non-empty derivativeType relationship passes.
- **DOC-DERIV-REL-002** derivative/parent id mismatch, malformed relationship or sibling/cross-scope relationship fails closed.
- **DOC-DERIV-SAFE-001** exact Tenant/scope/Industry/residency continuity plus parent ACTIVE+CLEAN passes.
- **DOC-DERIV-SAFE-002** parent non-ACTIVE/non-CLEAN or parent/derivative residency/context mismatch fails closed.
- **DOC-DERIV-EVID-001** success preserves exact raw derivativeType, derivative/parent sensitivity, status, virus, residency and ownership evidence without ranking or mutation.
- **DOC-DERIV-BOUND-001** output exposes no sensitivity-rank decision, ACL-widening decision, final authorization/policy result, provider/signing/grant/download/share/delete/StoragePort dispatch, derivative purge/rebuild/mutation or event authority.

Planned PostgreSQL acceptance:
- **DOC-DERIV-PG-001** exact in-scope persisted derivative→parent relation is readable under the existing Document role/RLS boundary.
- **DOC-DERIV-PG-002** wrong supplied parent id returns null with no alternate-parent lookup.
- **DOC-DERIV-PG-003** sibling-Industry derivative/parent evidence remains RLS-hidden.
- **DOC-DERIV-PG-004** Tenant Core derivative/parent relation remains same-Tenant visible under the existing Tenant-Core visibility model.

Expected executable delta: Core **1475 → 1483**. PostgreSQL **536 → 540**. Database inventory remains **48 migrations / 42 SQL verification files**. Web remains unchanged.

## Explicit exclusions / unresolved source requirements

No schema, migration, SQL verification, role, grant, RLS policy, route, signer, provider SDK, frontend, worker, scheduler or RawSource change.

This batch does **not**:
- invent a sensitivity ordering or claim DD-08 sensitivity monotonicity is fully enforced;
- compare, inherit or reduce parent/derivative ACLs or claim the ACL non-widening requirement is fully enforced;
- alter DD-082 generic access-candidate shape;
- resolve source-resource authorization or construct a DD-03 ResourceDescriptor;
- map Document operations to permissions/entitlements;
- evaluate RBAC/ABAC/commercial/sensitivity/residency exception/step-up policy;
- decrypt/select providers or issue signed access;
- grant download/share/delete authority;
- dispatch StoragePort operations, purge/rebuild derivatives, mutate DocumentMeta/StorageObject/ACL state or emit events.

A later batch may implement sensitivity monotonicity only after a canonical source-owned classification ordering is introduced and independently governed. ACL non-widening likewise requires its own source-complete parent/derivative ACL composition contract.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-578…DD-582 and the fixed acceptances above.
