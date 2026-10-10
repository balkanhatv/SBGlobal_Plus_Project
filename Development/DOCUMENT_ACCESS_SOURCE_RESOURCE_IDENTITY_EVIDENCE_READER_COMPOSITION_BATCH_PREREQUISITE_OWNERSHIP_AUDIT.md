# Document source-resource identity evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-06  
**Baseline checkpoint:** `DEV-DOCUMENT-ACCESS-ACL-CURRENT-EFFECT-STORAGE-ACCESS-PATH-EVIDENCE-READER-001`  
**Verified entry HEAD:** `97880cf69e8e162477063f6f0766fe415b79067e`  
**Verified entry tree:** `2c9976f8e04ff04555fb341667e950ecb7a09443`  
**Governed batch:** DD-573 through DD-577

## Entry gate

DD-568…DD-572 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37414539330`: Core job `112110125828` **1468/1468 PASS**, PostgreSQL job `112110125944` **536/536 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37414539347` / job `112110126005` PASS with the unchanged **48 migrations / 42 SQL verification files** inventory. Web run `37414539294` / job `112110125558` PASS.

This closes DD-568…DD-572 at its bounded evidence scope. PR #2 remains open/draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled source ownership

- DD-572 owns exact DD-567 ACL/storage evidence plus the pure access-path classification `EXPLICIT_ACL_DENY | EXPLICIT_ACL_ALLOW | SOURCE_RESOURCE_AUTHORIZATION_REQUIRED`.
- DD-571 states that `SOURCE_RESOURCE_AUTHORIZATION_REQUIRED` identifies only a required but still-unexecuted source-resource authorization path.
- DD-082 already preserves exact immutable source-resource identity inside `DocumentAccessCandidate`: `sourceModule`, `sourceResourceType`, `sourceResourceId`, plus exact Tenant/Industry/scope ownership copied from validated ACTIVE/CLEAN DocumentMeta.
- DD-082 validates the source identity strings as non-empty but deliberately preserves their stored values; it does not normalize or map them to an Authorization resource.
- DD-03 `ResourceDescriptor` is generic and requires a canonical runtime resource contract. Current Document DD does not define how arbitrary `sourceModule/sourceResourceType/sourceResourceId` maps to a concrete module resource loader, OperationContract permission, resource owner/state attributes, or supplemental authorization facts.
- DD-08 §5 still requires permission, entitlement, sensitivity, residency and optional step-up before signing; DD-08 §6 says source-resource inheritance is an access path, not an automatic allow.
- Therefore constructing a DD-03 `ResourceDescriptor`, selecting an OperationContract/permission, invoking AuthorizationDecisionService/GuardPipeline or declaring final access would invent source rules.

**SOURCE-COMPLETE:** the next independent bounded seam may expose only an immutable, exact source-resource identity evidence projection from the already-preserved DD-572 candidate when the access path is `SOURCE_RESOURCE_AUTHORIZATION_REQUIRED`. It performs zero new reads and creates no authorization/resource mapping authority.

## Frozen decisions

**DD-573 — exact DD-572 parent evidence first.** Add `loadDocumentAccessSourceResourceIdentityEvidence(...)`. Invoke DD-572 exactly once with the exact RequestContext, document id, explicit DocumentAclPermission, currentTimeIso and unchanged metadata/ACL/binding/matcher dependencies. Parent null remains null; dependency/governed errors propagate unchanged. Perform zero reads after parent success.

**DD-574 — terminal explicit-ACL branches remain parent-only.** If DD-572 yields `EXPLICIT_ACL_DENY` or `EXPLICIT_ACL_ALLOW`, return frozen `{ parent }` only. Do not synthesize source-resource identity use, fallback behavior or final authorization from either branch.

**DD-575 — required source-resource branch exposes exact persisted identity only.** If DD-572 yields `SOURCE_RESOURCE_AUTHORIZATION_REQUIRED`, derive frozen `sourceResourceIdentity` from only the preserved candidate: exact `tenantId`, optional `industryContextId`, `scopeClass`, `sourceModule`, `sourceResourceType`, `sourceResourceId`. Do not trim, normalize, alias, parse or reinterpret source identifiers.

**DD-576 — immutable exact-reference evidence boundary.** Success preserves the exact DD-572 parent reference and all nested ACL/storage/candidate evidence unchanged. Source-resource identity is a read-only projection of already-validated candidate fields; it is not a second source of Tenant/Industry truth.

**DD-577 — no ResourceDescriptor, operation mapping or authorization authority.** Do not construct DD-03 `ResourceDescriptor`; do not resolve/load the source resource; do not select an OperationContract/permission/entitlement; do not call AuthorizationDecisionService/GuardPipeline; do not evaluate RBAC/ABAC/commercial/sensitivity/residency/step-up; do not infer ACL ALLOW as final access; do not sign/decrypt/select provider, create grants, expose download/share/delete authority, dispatch StoragePort or mutate state.

## Fixed acceptance before implementation

- **DOC-SRCID-BASE-001** exact DD-572 parent executes first with exact inputs/dependencies and zero reads after parent success.
- **DOC-SRCID-BASE-002** DD-572 null remains null and parent errors propagate unchanged.
- **DOC-SRCID-PATH-001** exact `EXPLICIT_ACL_DENY` and `EXPLICIT_ACL_ALLOW` return frozen parent-only evidence with no source-resource identity projection or final authorization claim.
- **DOC-SRCID-REQ-001** exact `SOURCE_RESOURCE_AUTHORIZATION_REQUIRED` derives only exact candidate Tenant/Industry/scope + sourceModule/sourceResourceType/sourceResourceId evidence.
- **DOC-SRCID-REQ-002** source identity values are preserved byte-for-byte/no normalization and no DD-03 ResourceDescriptor or operation/permission mapping is created.
- **DOC-SRCID-EVID-001** success preserves the exact DD-572 parent and nested candidate/ACL/storage references unchanged.
- **DOC-SRCID-BOUND-001** output exposes no source-resource resolver result, ResourceDescriptor, OperationContract, AuthorizationDecision/GuardResult, permission/entitlement/RBAC/ABAC/commercial/sensitivity/residency/step-up result, provider/signing/grant/download/share/delete/dispatch/mutation authority.

Expected executable delta: Core **1468 → 1475**. PostgreSQL remains **536/536**. Database inventory remains **48 migrations / 42 SQL verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, source-resource registry/resolver, OperationContract, signer, provider SDK, secret, frontend, worker, scheduler or RawSource change.

This batch does **not**:
- construct a DD-03 ResourceDescriptor from Document source identifiers;
- invent sourceModule/sourceResourceType routing or module/resource resolver semantics;
- map Document ACL permissions or source resources to an OperationContract permission;
- load or authorize the source resource;
- treat ACL ALLOW as final access or ACL NONE as implicit allow/deny;
- evaluate permission/entitlement/RBAC/ABAC/commercial/sensitivity/residency/step-up policy;
- decrypt/select storage provider/bucket;
- issue signed access, TTL or grants;
- expose download/share/delete authority;
- dispatch StoragePort operations or mutate DocumentMeta/StorageObject/ACL state.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-573…DD-577 and the fixed acceptances above.
