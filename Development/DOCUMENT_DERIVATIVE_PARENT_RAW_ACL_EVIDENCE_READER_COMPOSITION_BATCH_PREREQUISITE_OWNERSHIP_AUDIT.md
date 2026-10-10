# Document derivative-parent raw ACL evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-06  
**Baseline checkpoint:** `DEV-DOCUMENT-DERIVATIVE-PARENT-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `d0267eab8707d66c09660727cdbc1ea2dbd8dc8c`  
**Verified entry tree:** `f7a6c7c7f0ecfa9c3ca2e28dc89c0c2a5b57a3ac`  
**Governed batch:** DD-583 through DD-587

## Entry gate

DD-578…DD-582 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37431895165`: Core job `112164451471` **1483/1483 PASS**, PostgreSQL job `112164451799` **540/540 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37431895176` / job `112164451838` PASS with unchanged **48 migrations / 42 SQL verification files**. Web run `37431895096` / job `112164451217` PASS.

This closes DD-578…DD-582 at its bounded evidence scope. PR #2 remains open/draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled source ownership

- DD-582 owns one exact visible derivative→parent relationship with persisted derivativeType, same Tenant/scope/nullable-Industry/residency continuity, parent ACTIVE+CLEAN currentness and migration-0031 sensitivity non-lowering evidence.
- DD-08 §8 states that a derivative cannot widen ACL, but the current repository still does **not** define the complete parent-child ACL comparison/inheritance/reduction semantics needed to decide that rule.
- DD-084 owns the raw typed Document ACL persistence boundary. `DocumentAclReadPort.loadForDocument({ requestContext, documentId })` reads one exact document's visible ACL rows under the existing Document FORCE-RLS/service-role boundary.
- `PostgresDocumentAclStore` validates UUID/enum/timestamp row shape, filters SQL by exact `document_id`, orders deterministically and returns an immutable array. The row contract preserves exact `documentId`, subject/effect/permission, optional validUntil and createdAt evidence.
- DD-085/DD-562 own later subject-match/current-effect interpretation for one explicit access permission; those semantics are **not** a parent-child ACL comparison rule and must not be repurposed here.

**SOURCE-COMPLETE:** extend exact DD-582 evidence by loading the derivative raw ACL array and parent raw ACL array exactly once each through DD-084 under the same supplied RequestContext. Preserve exact arrays/entries and require only exact returned-row document-id binding. Do not compare, merge, inherit, reduce, normalize or otherwise interpret the two ACL sets.

## Frozen decisions

**DD-583 — exact DD-582 parent evidence first.** Add `loadDocumentDerivativeParentRawAclEvidence(...)`. Invoke DD-582 once with exact RequestContext, derivativeDocumentId, parentDocumentId and unchanged derivative-parent reader. Parent null remains null; dependency errors propagate unchanged. No ACL read occurs before DD-582 success.

**DD-584 — one exact derivative ACL read.** After DD-582 success, call `DocumentAclReadPort.loadForDocument` exactly once using the exact supplied RequestContext and exact persisted derivative id from `parent.relationship.derivative.id`. Do not substitute caller aliases, source resources, storage ids or alternate document ids.

**DD-585 — one exact parent ACL read and fail-closed row binding.** Then call the same ACL port exactly once using the exact supplied RequestContext and exact persisted parent id from `parent.relationship.parent.id`. Empty arrays are valid raw evidence. Every returned derivative ACL row must carry the derivative id and every returned parent ACL row must carry the parent id; any cross-bound/mismatched row returns null. Dependency errors propagate unchanged; no retry, fallback or alternate ACL source is attempted.

**DD-586 — immutable exact-reference paired ACL evidence.** Success returns frozen `{ parent, derivativeAclEntries, parentAclEntries }`, preserving the exact DD-582 parent object and exact returned ACL array/entry references. Do not sort, clone, normalize subjects, collapse duplicates, filter expiry, match RequestContext subjects or derive ALLOW/DENY effects.

**DD-587 — paired raw ACL evidence is not ACL non-widening or access authority.** Do not compare permission/effect/subject sets, inherit/merge/reduce ACLs, claim "derivative cannot widen ACL" is enforced, interpret validUntil/currentness, apply explicit-DENY precedence, choose source-resource fallback, map OperationContract permissions, call AuthorizationDecisionService/GuardPipeline, evaluate RBAC/ABAC/entitlement/commercial/sensitivity/residency/step-up, sign/grant/download/share/delete, dispatch StoragePort, mutate derivative/parent/ACL state or emit events.

## Fixed acceptance before implementation

- **DOC-DERIVACL-BASE-001** exact DD-582 parent is established first; only after success do ACL reads begin.
- **DOC-DERIVACL-BASE-002** DD-582 null/error short-circuits or propagates before any ACL read.
- **DOC-DERIVACL-READ-001** exactly one derivative ACL read then exactly one parent ACL read use the same exact RequestContext and persisted relationship ids.
- **DOC-DERIVACL-READ-002** derivative/parent ACL dependency errors propagate unchanged with no retry/fallback; derivative failure prevents the parent ACL read.
- **DOC-DERIVACL-BIND-001** empty arrays or arrays whose every row documentId exactly matches its derivative/parent side pass without reinterpretation.
- **DOC-DERIVACL-BIND-002** any derivative/parent ACL row bound to another document fails closed.
- **DOC-DERIVACL-EVID-001** success preserves exact DD-582 parent and exact ACL array/entry references unchanged in a frozen result.
- **DOC-DERIVACL-BOUND-001** output exposes no ACL comparison/non-widening decision, inherited/reduced ACL, current/effect/subject-match decision, final authorization, signing/storage dispatch or mutation authority.

Expected executable delta: Core **1483 → 1491**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 SQL verification files**. Web remains unchanged.

## Explicit exclusions / unresolved source requirements

No schema, migration, SQL verification, role, grant, RLS policy, route, signer, provider SDK, frontend, worker, scheduler or RawSource change.

This batch does **not**:
- define the parent-child ACL non-widening algorithm;
- decide whether child ACL is broader/equal/narrower;
- inherit, copy, merge or reduce ACL rows;
- interpret expiry/currentness or explicit-DENY precedence;
- perform subject matching;
- choose explicit ACL versus source-resource authorization;
- map operations to ACL permissions or permission/entitlement policies;
- establish final access authorization or signed access;
- dispatch StoragePort, mutate DocumentMeta/document_acl or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-583…DD-587 and the fixed acceptances above.
