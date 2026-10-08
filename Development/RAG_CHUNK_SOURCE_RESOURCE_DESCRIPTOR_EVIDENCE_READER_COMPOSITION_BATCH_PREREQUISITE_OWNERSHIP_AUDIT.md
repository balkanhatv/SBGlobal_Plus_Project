# RAGChunk source-resource descriptor evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-08  
**Baseline checkpoint:** `DEV-AI-RAG-CHUNK-BOUND-DOCUMENT-ACL-ACCESS-PATH-EVIDENCE-READER-001`  
**Verified entry HEAD:** `c4e4f3b4c0ddc9519a900f4598e0c8b3298f5183`  
**Verified entry tree:** `a54550667bb88475b8dff61c2c45558814f43f96`  
**Governed batch:** DD-658 through DD-662

## Entry gate

DD-653…DD-657 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37720565477`: Core job `113127006419` **1614/1614 PASS**, PostgreSQL job `113127006251` **540/540 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37720565517` / job `113127006390` PASS with **48 migrations / 42 SQL verification files**. Web run `37720565468` / job `113127006308` PASS.

This closes DD-653…DD-657 at its bounded evidence scope. PR #2 remains open/draft/unmerged. RawSource remains unchanged. `main` remains unmerged.

## Reconciled source ownership

- DD-09 §8 requires RAG retrieval to resolve source/resource ACL against the acting principal before entitlement/security/sensitivity/residency filtering and retrieval.
- DD-657 owns exact DD-652 evidence plus the canonical ACL access-path classification. Only `SOURCE_RESOURCE_AUTHORIZATION_REQUIRED` identifies the still-unexecuted source-resource authorization path. `EXPLICIT_ACL_DENY` blocks that fallback at the ACL layer and `EXPLICIT_ACL_ALLOW` is explicit-ACL-path evidence only.
- DD-647 preserves the exact persisted parent `RAGSource` reference inside the DD-657 parent chain.
- DD-127 raw RAGSource evidence source-owns exact persisted `tenantId`, optional `industryContextId`, `resourceType`, `resourceId`, `sensitivityClass`, `sourceModule`, `managementSystemId?`, `residencyRegion`, raw status/version/ACL fields and other registration metadata. It explicitly does not dereference the resource or authorize retrieval.
- DD-03 owns the generic `ResourceDescriptor{resourceType,resourceId,tenantId,industryContextId?,orgUnitId?,ownerPrincipalId?,state?,sensitivityClass?,residencyClass?}` input contract.
- The persisted RAGSource directly source-owns the DD-03 mandatory identity fields plus `sensitivityClass`. No source-owned mapping exists from RAGSource `residencyRegion` to DD-03 `residencyClass`; they are distinct names/semantics and must not be equated.
- No source-owned RAG retrieval OperationContract is currently established in this bounded chain, and no source-resource resolver/current-resource reader is present here. Therefore this batch must stop before AuthorizationDecisionService/GuardPipeline.
- RAGSource raw `status`, `sourceVersion`, `sourceModule`, `managementSystemId`, `aclPolicyRef`, `residencyRegion`, `retentionClass` and other metadata remain preserved raw and must not be synthesized into optional ResourceDescriptor fields without an explicit owner.
- Empty/raw `resourceType/resourceId` text is schema-valid raw evidence at DD-127; this batch must preserve it exactly rather than invent non-empty validation. The result is descriptor evidence, not proof that the source resource exists or is resolvable.

**SOURCE-COMPLETE:** extend exact DD-657 evidence with a pure, zero-read DD-03 ResourceDescriptor projection only when `accessPathEvidence === "SOURCE_RESOURCE_AUTHORIZATION_REQUIRED"`. Preserve all other branches parent-only. The projection uses only exact persisted source `resourceType`, `resourceId`, `tenantId`, optional `industryContextId` and `sensitivityClass`. It performs no resource resolution or authorization.

## Frozen decisions

**DD-658 — exact DD-657 parent evidence first.** Add `loadAIRAGChunkSourceResourceDescriptorEvidence(...)`. Invoke DD-657 exactly once with the exact supplied RequestContext, RAGChunk id, explicit DocumentAclPermission, trusted currentTimeIso and unchanged dependencies. Parent null returns null; parent dependency/governed errors propagate unchanged. Perform zero persistence reads after parent success.

**DD-659 — preserve non-source-resource branches without descriptor synthesis.** If DD-657 has no `accessPathEvidence`, or its value is `EXPLICIT_ACL_DENY` or `EXPLICIT_ACL_ALLOW`, return frozen `{ parent }` only. Do not create a source ResourceDescriptor and do not reinterpret these branches.

**DD-660 — exact persisted source identity projection for SOURCE_RESOURCE_AUTHORIZATION_REQUIRED only.** For that exact branch, obtain the already-preserved exact DD-647 RAGSource reference from the DD-657 parent chain and create a frozen ResourceDescriptor with only:
- `resourceType === source.resourceType`;
- `resourceId === source.resourceId`;
- `tenantId === source.tenantId`;
- optional `industryContextId === source.industryContextId` when present;
- `sensitivityClass === source.sensitivityClass`.
Do not normalize/trim/substitute raw resource strings. Do not map `residencyRegion` to `residencyClass`; do not synthesize orgUnitId, ownerPrincipalId or state.

**DD-661 — immutable exact layered evidence.** Descriptor-branch success returns frozen `{ parent, resourceDescriptor }`, preserving the exact DD-657 parent and all nested source/Document/ACL/model/provider evidence references unchanged. Parent-only branches return frozen `{ parent }`.

**DD-662 — descriptor evidence is not source resolution or authorization authority.** The descriptor does not prove source-resource existence/currentness, choose an OperationContract/permission, call AuthorizationDecisionService/GuardPipeline, evaluate RBAC/ABAC/entitlement/commercial/sensitivity/residency/step-up, override explicit ACL DENY, make explicit ACL ALLOW final, perform retrieval/filter/rank/rerank/ground/citation, enforce prompt-injection policy, route Provider/Model, invoke inference, mutate or emit events.

## Fixed acceptance before implementation

- **RAGCHUNK-SRCDESC-BASE-001** exact DD-657 parent executes first with exact inputs/dependencies and zero post-parent reads.
- **RAGCHUNK-SRCDESC-BASE-002** DD-657 null/error short-circuits or propagates unchanged before descriptor projection.
- **RAGCHUNK-SRCDESC-BRANCH-001** unbound/no-classification, EXPLICIT_ACL_DENY and EXPLICIT_ACL_ALLOW branches return frozen exact parent-only evidence with no ResourceDescriptor.
- **RAGCHUNK-SRCDESC-DESC-001** SOURCE_RESOURCE_AUTHORIZATION_REQUIRED projects exact source resourceType/resourceId/Tenant/null-safe Industry/sensitivity into a frozen ResourceDescriptor.
- **RAGCHUNK-SRCDESC-DESC-002** raw resource strings remain exact; residencyRegion is not mapped to residencyClass and orgUnitId/ownerPrincipalId/state are not synthesized.
- **RAGCHUNK-SRCDESC-EVID-001** success preserves exact DD-657 parent and all nested raw source/Document/ACL/model/provider references unchanged.
- **RAGCHUNK-SRCDESC-BOUND-001** output exposes no source resolver/current-resource evidence, OperationContract/permission mapping, AuthorizationDecision/GuardResult, entitlement/security filter, retrieval/grounding/citation, provider/model routing, inference, mutation/event or AI execution authority.
- **RAGCHUNK-SRCDESC-BOUND-002** descriptor evidence never bypasses explicit ACL DENY, never upgrades explicit ACL ALLOW to final authorization, and never treats absent/unbound evidence as access.

Expected executable delta: Core **1614 → 1622**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, worker, scheduler, provider SDK or RawSource change.

This batch does **not**:
- add or choose a RAG retrieval OperationContract;
- map RAG retrieval to a Document ACL permission;
- resolve `sourceModule/resourceType/resourceId` to a live domain resource;
- infer non-empty resource strings beyond persisted schema;
- map residencyRegion to ResourceDescriptor.residencyClass;
- synthesize orgUnitId, ownerPrincipalId or resource state;
- call AuthorizationDecisionService/GuardPipeline;
- evaluate permission/RBAC/ABAC/entitlement/commercial/sensitivity/residency/step-up policy;
- perform retrieval/ranking/reranking/grounding/citation or prompt-injection execution;
- route providers/models or invoke AI execution;
- mutate state or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-658…DD-662 and the eight fixed acceptances.
