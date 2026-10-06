# Document ACL current-effect + storage binding + access-path evidence reader prerequisite ownership audit

**Date:** 2026-10-06  
**Baseline checkpoint:** `DEV-DOCUMENT-ACCESS-ACL-CURRENT-EFFECT-STORAGE-BINDING-EVIDENCE-READER-001`  
**Verified entry HEAD:** `b542e12aeb7306d2b84f98e1324d323fb1b818f1`  
**Verified entry tree:** `47fd789fbb67323de7f3944c98bfff26ae5325c1`  
**Governed batch:** DD-568 through DD-572

## Entry gate

DD-563…DD-567 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37405177814`: Core job `112081032216` **1461/1461 PASS**, PostgreSQL job `112081032093` **536/536 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37405177769` / job `112081031766` PASS with the unchanged **48 migrations / 42 SQL verification files** inventory. Web run `37405177788` / job `112081032138` PASS.

This closes DD-563…DD-567 at its bounded evidence scope. PR #2 remains open/draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled source ownership

- DD-567 owns exact DD-562 ACL current-effect evidence plus exact DD-086 physical StorageObject binding evidence. It deliberately stops before source-resource choice, final authorization, provider selection and signing.
- DD-08 §6 states that Document access can inherit source-resource authorization or use explicit ACL entries, and that explicit DENY wins. ACL cannot widen beyond Tenant/Industry/security/compliance boundaries.
- DD-561 already reduces only current matched ACL entries to `DENY | ALLOW | NONE`; expired evidence does not participate.
- Therefore one source-complete next seam exists with **zero new reads**: classify the already-proven ACL-layer effect into the access path that still requires downstream authorization work.
- `DENY` is an explicit ACL-layer deny and must not fall back to source-resource inheritance.
- `ALLOW` is explicit ACL-path positive evidence only; it is not final authorization because permission/entitlement/RBAC/ABAC/sensitivity/residency/step-up and other security/compliance gates remain separately required.
- `NONE` means no current explicit ACL result for the requested ACL permission and therefore the source-resource authorization path is required. It is not an allow or deny decision by itself.
- No canonical document-download OperationContract / operation→ACL permission mapping is currently implemented in the Core operation registry. This batch must not invent one.
- DD-08 signed-download §5 still requires ACTIVE/CLEAN candidate, ACL, permission, entitlement, sensitivity, residency and optional step-up before signing. Provider/bucket selection and grant creation remain later boundaries.

**SOURCE-COMPLETE:** extend exact DD-567 evidence with only a pure, immutable three-way ACL access-path classification. Perform zero additional persistence/authorization/storage reads. Preserve the exact parent and all ACL/storage evidence references.

## Frozen decisions

**DD-568 — exact DD-567 parent evidence first.** Add `loadDocumentAccessAclCurrentEffectStorageAccessPathEvidence(...)`. Invoke DD-567 exactly once with the exact supplied RequestContext, document id, explicit DocumentAclPermission, currentTimeIso and exact metadata/ACL/binding/matcher dependencies. Parent null remains null; governed/dependency errors propagate unchanged. Perform no reads after parent success.

**DD-569 — explicit DENY selects terminal ACL-deny path.** If `parent.parent.effectEvidence === "DENY"`, derive only `accessPathEvidence === "EXPLICIT_ACL_DENY"`. Explicit DENY wins and source-resource inheritance must not be attempted. This is a document ACL-layer deny fact, not a synthesized DD-03 AuthorizationDecision.

**DD-570 — explicit ALLOW selects explicit-ACL path only.** If effectEvidence is `ALLOW`, derive only `accessPathEvidence === "EXPLICIT_ACL_ALLOW"`. This means the requested ACL dimension has positive current evidence; it does not bypass permission, entitlement, RBAC/ABAC, sensitivity, residency, step-up, provider/signing or other security/compliance gates.

**DD-571 — NONE requires source-resource authorization path without executing it.** If effectEvidence is `NONE`, derive only `accessPathEvidence === "SOURCE_RESOURCE_AUTHORIZATION_REQUIRED"`. Do not treat NONE as allow/deny, do not resolve sourceResourceType/sourceResourceId into an authorization resource, do not call AuthorizationDecisionService/GuardPipeline and do not invent an operation→ACL permission mapping.

**DD-572 — immutable evidence / authority boundary.** Success returns frozen `{ parent, accessPathEvidence }`, preserving the exact DD-567 parent reference. Current/expired ACL partitions, raw ACL entries, candidate source-resource identifiers and private StorageObject binding facts remain unchanged. No final authorization, permission/entitlement/commercial/sensitivity/residency/step-up result, provider selection/decryption, signed URL/token/grant/TTL, download/share/delete authority, StoragePort dispatch or mutation/event authority is introduced.

## Fixed acceptance before implementation

- **DOC-ACLPATH-BASE-001** exact DD-567 parent executes first with exact inputs/dependencies and zero additional reads after parent success.
- **DOC-ACLPATH-BASE-002** DD-567 null remains null and parent errors propagate unchanged.
- **DOC-ACLPATH-DENY-001** exact current `DENY` maps only to `EXPLICIT_ACL_DENY` and exposes no source-resource fallback authority.
- **DOC-ACLPATH-ALLOW-001** exact current `ALLOW` maps only to `EXPLICIT_ACL_ALLOW` and does not claim final authorization.
- **DOC-ACLPATH-NONE-001** exact `NONE` maps only to `SOURCE_RESOURCE_AUTHORIZATION_REQUIRED` without executing or synthesizing source-resource authorization.
- **DOC-ACLPATH-EVID-001** success is frozen and preserves the exact DD-567 parent reference plus all nested ACL/candidate/binding references unchanged.
- **DOC-ACLPATH-BOUND-001** output exposes no OperationContract/ACL mapping, AuthorizationDecision/GuardResult, permission/entitlement/RBAC/ABAC/commercial/sensitivity/residency/step-up result, provider/signing/grant/download/share/delete/dispatch/mutation authority.

Expected executable delta: Core **1461 → 1468**. PostgreSQL remains **536/536**. Database inventory remains **48 migrations / 42 SQL verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, public route, canonical document-download OperationContract, signer, provider SDK, secret, frontend, worker, scheduler or RawSource change.

This batch does **not**:
- map an API operation to DocumentAclPermission;
- resolve or authorize sourceModule/sourceResourceType/sourceResourceId;
- treat ACL ALLOW as final access;
- treat ACL NONE as implicit allow or deny;
- bypass explicit ACL DENY through source-resource fallback;
- evaluate permission/entitlement/RBAC/ABAC/commercial/sensitivity/residency/step-up policy;
- decrypt/select provider/bucket;
- issue signed access, TTL or grants;
- expose download/share/delete authority;
- dispatch StoragePort operations or mutate DocumentMeta/StorageObject/ACL state.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-568…DD-572 and the fixed acceptances above.
