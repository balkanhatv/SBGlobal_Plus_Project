# RAGChunk bound-Document ACL access-path evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-07  
**Baseline checkpoint:** `DEV-AI-RAG-CHUNK-BOUND-DOCUMENT-ACL-CURRENT-EFFECT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `d8db01e27986b689ff410546caac74e9d67f14b0`  
**Verified entry tree:** `e41ec6dab52fd33ec8b10199d7c25c9c98112c14`  
**Governed batch:** DD-653 through DD-657

## Entry gate

DD-648…DD-652 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37660665775`: Core job `112927059147` **1606/1606 PASS**, PostgreSQL job `112927059377` **540/540 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37660665711` / job `112927064777` PASS with unchanged **48 migrations / 42 SQL verification files** inventory. Web run `37660665792` / job `112927059594` PASS. Pull-request Core/PostgreSQL/Database/Web workflows on the same state-closure HEAD also passed.

This closes DD-648…DD-652 at its bounded evidence scope. PR #2 remains open/draft/unmerged. RawSource remains unchanged. `main` remains unmerged.

## Reconciled source ownership

- DD-09 §8 requires the RAG retrieval pipeline to resolve source/resource ACL against the acting principal before entitlement/security/sensitivity/residency filtering and retrieval.
- DD-652 owns exact DD-647 lineage plus optional bound-Document DD-562 ACL current-effect evidence. For a bound Document it preserves exact current/expired ACL partitions and `DENY | ALLOW | NONE` effect evidence, but deliberately does not choose source-resource fallback or claim retrieval authorization.
- DD-568…DD-572 already own the source-complete three-way interpretation of DD-562 ACL-layer effect evidence:
  - `DENY → EXPLICIT_ACL_DENY`;
  - `ALLOW → EXPLICIT_ACL_ALLOW`;
  - `NONE → SOURCE_RESOURCE_AUTHORIZATION_REQUIRED`.
- DD-572 currently performs this classification inside a server-layer composition whose parent also includes physical StorageObject binding. The classification itself depends only on the ACL effect and is explicitly zero-read.
- RAG retrieval from an already persisted chunk does not source-own a requirement to re-prove Document StorageObject binding before identifying which ACL authorization path remains. Requiring DD-567/StorageObject for this RAG seam would therefore add an unsupported dependency.
- To avoid semantic drift without importing the unrelated physical-storage prerequisite, the three-way classification should have one pure Core owner reused by both the existing DD-572 server reader and the new RAG composition.
- `EXPLICIT_ACL_DENY` blocks source-resource fallback at the ACL layer.
- `EXPLICIT_ACL_ALLOW` is positive ACL-path evidence only and is not final retrieval authorization.
- `SOURCE_RESOURCE_AUTHORIZATION_REQUIRED` identifies the still-unexecuted source-resource authorization path; it does not resolve or authorize the source resource.
- DD-652 unbound-source evidence has no Document ACL envelope and therefore has nothing to classify. It must remain parent-only without inferring access or absence of source ACL obligations.
- Source still does not define a universal RAG→Document ACL permission mapping; DD-652's explicit caller-supplied `documentAclPermission` remains the only permission input in this chain.
- Raw `RAGSource.status`, `sourceVersion`, `aclPolicyRef` and `RAGChunk.aclProjection` remain uninterpreted.

**SOURCE-COMPLETE:** extract/reuse one pure three-way Document ACL access-path classifier from the already-canonical DD-568…DD-572 semantics and extend exact DD-652 evidence with that classification only when a bound Document ACL envelope exists. Perform zero additional persistence, storage, authorization or retrieval reads.

## Frozen decisions

**DD-653 — exact DD-652 parent evidence first.** Add `loadAIRAGChunkBoundDocumentAclAccessPathEvidence(...)`. Invoke DD-652 exactly once with the exact supplied RequestContext, RAGChunk id, explicit DocumentAclPermission, trusted currentTimeIso and unchanged chunk/model/provider/source/document/ACL dependencies. Parent null returns null; parent dependency/governed errors propagate unchanged.

**DD-654 — preserve the unbound branch with zero new work.** If DD-652 contains no `documentAcl`, return frozen `{ parent }`. Perform no access-path classification and no additional reads. This does not infer access, ACL absence, or that source-resource authorization is unnecessary.

**DD-655 — share one pure DD-568…DD-572 ACL access-path classifier.** Add a Core pure helper that maps only canonical DD-562 effect evidence:
- `DENY → EXPLICIT_ACL_DENY`;
- `ALLOW → EXPLICIT_ACL_ALLOW`;
- `NONE → SOURCE_RESOURCE_AUTHORIZATION_REQUIRED`.
Refactor the existing DD-572 server reader to use the same helper without changing its input/output contract or storage-binding prerequisite. The new RAG reader applies the helper directly to the exact DD-652 `documentAcl.effectEvidence`. No StorageObject read is added to the RAG path.

**DD-656 — preserve immutable exact layered evidence.** Bound success returns frozen `{ parent, accessPathEvidence }`, preserving the exact DD-652 parent and all nested lineage/model/provider/Document/ACL object references unchanged. The classification adds no new persisted facts.

**DD-657 — access-path evidence is not final RAG authorization or execution authority.** `EXPLICIT_ACL_DENY` only blocks source-resource fallback at the ACL layer. `EXPLICIT_ACL_ALLOW` does not bypass permission/entitlement/RBAC/ABAC/commercial/sensitivity/residency/step-up or other retrieval guards. `SOURCE_RESOURCE_AUTHORIZATION_REQUIRED` does not resolve or authorize `sourceModule/sourceResourceType/sourceResourceId`. Do not map RAG retrieval to a Document ACL permission, interpret raw RAG ACL fields, perform retrieval/ranking/reranking/grounding/citation, apply prompt-injection policy, route providers/models, invoke inference, mutate or emit events.

## Fixed acceptance before implementation

- **RAGCHUNK-ACLPATH-BASE-001** exact DD-652 parent executes first with exact inputs/dependencies and no post-parent persistence reads.
- **RAGCHUNK-ACLPATH-BASE-002** DD-652 null/error short-circuits or propagates unchanged before classification.
- **RAGCHUNK-ACLPATH-BRANCH-001** unbound evidence returns frozen exact parent-only evidence with no classification and no inferred access.
- **RAGCHUNK-ACLPATH-DENY-001** exact DD-652 `DENY` maps only to `EXPLICIT_ACL_DENY` and exposes no source-resource fallback authority.
- **RAGCHUNK-ACLPATH-ALLOW-001** exact DD-652 `ALLOW` maps only to `EXPLICIT_ACL_ALLOW` and does not claim final retrieval authorization.
- **RAGCHUNK-ACLPATH-NONE-001** exact DD-652 `NONE` maps only to `SOURCE_RESOURCE_AUTHORIZATION_REQUIRED` without executing or synthesizing source-resource authorization.
- **RAGCHUNK-ACLPATH-EVID-001** success is frozen and preserves the exact DD-652 parent plus all nested raw lineage/ACL references unchanged; existing DD-572 tests remain green after shared-helper refactor.
- **RAGCHUNK-ACLPATH-BOUND-001** output exposes no inferred RAG→Document permission mapping, ResourceDescriptor/source-resource resolver, AuthorizationDecision/GuardResult, entitlement/security filter result, retrieval/rank/rerank/ground/citation, prompt-injection policy, provider/model routing, inference, mutation/event or AI execution authority.

Expected executable delta: Core **1606 → 1614**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, route, frontend, worker, scheduler, provider SDK or RawSource change.

This batch does **not**:
- add StorageObject binding to the RAG retrieval prerequisite chain;
- map RAG retrieval to Document `VIEW` or any other ACL permission;
- infer access for an unbound source;
- bypass explicit ACL DENY through source-resource fallback;
- treat ACL ALLOW as final authorization;
- execute the source-resource authorization path for ACL NONE;
- build a DD-03 ResourceDescriptor or call AuthorizationDecisionService/GuardPipeline;
- evaluate permission/entitlement/RBAC/ABAC/commercial/sensitivity/residency/step-up policy;
- interpret raw RAGSource status/version/aclPolicyRef or RAGChunk aclProjection;
- perform vector/FTS retrieval, filtering, ranking/reranking, grounding/citation or prompt assembly/injection defense;
- select/route Provider/Model, resolve credentials or invoke inference/embedding/AI execution;
- mutate state or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-653…DD-657 and the eight fixed acceptances.
