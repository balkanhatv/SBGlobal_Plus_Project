# Document ACL current-effect + physical StorageObject binding evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-06  
**Baseline checkpoint:** `DEV-DOCUMENT-ACCESS-ACL-CURRENT-EFFECT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `6c0bed30054c6afa4d58c9e109aec015f191d46f`  
**Verified entry tree:** `6c0bed30054c6afa4d58c9e109aec015f191d46f`  
**Governed batch:** DD-563 through DD-567

## Entry gate

DD-558…DD-562 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37352360093`: Core job `111906090482` **1453/1453 PASS**, PostgreSQL job `111906090297` **536/536 PASS**, fail/skip 0; full database bootstrap PASS. Database push run `37352360272` / job `111906090943` PASS. Web push run `37352360052` / job `111906089881` PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource remains unchanged; `main` remains unmerged.

## Reconciled source owners

- DD-562 owns exact DD-542 parent evidence plus one explicit trusted current instant, deterministic current/expired ACL partitioning and DD-08 §6 explicit-DENY-wins ACL-layer effect evidence.
- DD-562 explicitly stops before source-resource fallback, final authorization, sensitivity/residency/step-up, physical StorageObject loading, signing/grants and download/share/delete/mutation authority.
- DD-086 owns the exact physical StorageObject binding read through the already-preserved candidate `documentId + storageObjectId`, current RequestContext Data Home, RLS-visible DocumentMeta linkage, ACTIVE/CLEAN DocumentMeta, ACTIVE StorageObject and exact persisted size/checksum parity.
- DD-548…DD-552 already proved that DD-542 ACL-subject evidence and DD-086 binding can be composed with zero duplicate candidate/ACL read.
- DD-08 §5 still requires ACTIVE state, ACL, permission, entitlement, sensitivity, residency and optional step-up before any signed grant. DD-562 ACL-layer effect and DD-086 physical binding are necessary evidence only and do not satisfy those other owners.
- DD-08 §6 still leaves source-resource inheritance versus explicit ACL selection outside this bounded seam. This batch must not infer that an ACL `NONE` means deny or fallback.
- DD-08 §17 forbids treating private object locator evidence as authorization or signing authority.

**SOURCE-COMPLETE:** the next independent bounded seam may establish exact DD-562 current-effect evidence first, then perform exactly one DD-086 physical binding read using only the candidate linkage preserved inside DD-562. No new authorization rule, permission mapping, provider policy, signer/TTL policy or storage execution rule is required.

## Frozen decisions

**DD-563 — exact DD-562 current-effect parent first.** Add `loadDocumentAccessAclCurrentEffectStorageBindingEvidence(...)`. Invoke DD-562 once using the exact supplied RequestContext, document id, explicit ACL permission, explicit trusted currentTimeIso and unchanged metadata/ACL/matcher dependencies. Parent errors propagate unchanged. Do not invoke the binding reader after parent failure.

**DD-564 — exact DD-086 binding read from preserved candidate linkage.** After DD-562 succeeds, invoke the physical binding reader exactly once with the exact supplied RequestContext and `documentId/storageObjectId` taken only from `parent.parent.candidate`. Do not accept or substitute any caller-supplied StorageObject id, sourceResourceId, provider reference, object key or alternate locator. Do not rerun DD-082/DD-542.

**DD-565 — binding null/errors fail closed without fallback.** If DD-086 returns null, return null. Do not retry/search by object id/key, choose another Data Home/provider, use source-resource fallback, reinterpret ACL `NONE`, or synthesize authorization/storage evidence. Binding dependency errors propagate unchanged.

**DD-566 — immutable exact-reference combined evidence.** Success returns frozen `{ parent, binding }`, preserving the exact DD-562 parent and exact DD-086 binding references. Current/expired ACL arrays, effectEvidence and private locator/integrity facts remain unchanged and uninterpreted beyond their existing owners.

**DD-567 — boundary: no final authorization, source-resource choice, provider selection or signing.** Do not map OperationContract to ACL permission; do not choose source-resource inheritance; do not evaluate RBAC/ABAC/entitlement/commercial/sensitivity/residency/step-up; do not decrypt providerRefEncrypted or choose provider/bucket; do not create signed URL/token/grant/TTL; do not expose download/share/delete authority; do not dispatch StoragePort or mutate DocumentMeta/StorageObject/ACL state.

## Fixed acceptance before implementation

- **DOC-ACLEFFSTO-BASE-001** exact DD-562 parent executes first with exact RequestContext/document/permission/currentTimeIso and exact dependencies.
- **DOC-ACLEFFSTO-BASE-002** DD-562 error propagates unchanged and physical binding reader is not invoked.
- **DOC-ACLEFFSTO-READ-001** parent success causes exactly one DD-086 binding read using exact RequestContext + preserved candidate documentId/storageObjectId with zero duplicate candidate/ACL read.
- **DOC-ACLEFFSTO-READ-002** binding dependency error propagates unchanged with no retry/search/fallback.
- **DOC-ACLEFFSTO-NULL-001** DD-086 null returns null without source-resource fallback, authorization synthesis or alternate locator/provider/Data Home search.
- **DOC-ACLEFFSTO-EVID-001** success returns frozen evidence preserving exact DD-562 parent and exact DD-086 binding references.
- **DOC-ACLEFFSTO-EVID-002** current/expired/effect ACL evidence and raw private storage locator/integrity fields remain exact and unchanged.
- **DOC-ACLEFFSTO-BOUND-001** output exposes no final authorization, source-resource decision, permission/entitlement/sensitivity/residency/step-up result, provider selection/decryption, signing/grant/download/share/delete/dispatch/mutation authority.

Expected executable delta: Core **1453 → 1461**. PostgreSQL remains **536/536**. Database inventory remains **48 migrations / 42 SQL verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, public route, signer, provider SDK, secret, frontend, worker, scheduler or RawSource change.

This batch does **not**:
- choose explicit ACL versus source-resource inheritance;
- treat ACL `NONE` as deny or fallback;
- infer operation→ACL permission mapping;
- evaluate permission/entitlement/RBAC/ABAC/commercial/sensitivity/residency/step-up policy;
- decrypt provider metadata or select provider/bucket;
- issue signed access, TTL, grant, download/share/delete authority;
- dispatch StoragePort operations;
- mutate DocumentMeta/StorageObject/ACL state.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-563…DD-567 and the fixed acceptances above.
