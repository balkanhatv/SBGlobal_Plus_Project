# RAGChunk bound-Document ACL current-effect evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-07  
**Baseline checkpoint:** `DEV-AI-RAG-CHUNK-SOURCE-DOCUMENT-MODEL-PROVIDER-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `d48e5084722ad4754e7fc05afa4727242589430a`  
**Verified entry tree:** `b52e92ca84dd83a1ae84a7ff72951f8f52ffc891`  
**Governed batch:** DD-648 through DD-652

## Entry gate

DD-643…DD-647 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37655581923`: Core job `112910347457` **1596/1596 PASS**, PostgreSQL job `112910348832` **540/540 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37655581907` / job `112910347421` PASS. Web run `37655581946` / job `112910350165` PASS.

PR #2 remains open/draft/unmerged. RawSource remains unchanged. `main` remains unmerged.

## Reconciled source owners

- DD-09 §8 requires RAG retrieval to resolve source/resource ACL against the acting principal before vector/FTS retrieval, but it does not define a universal mapping from RAG retrieval to one `DocumentAclPermission`.
- DD-647 owns immutable RAGChunk→RAGSource→optional current Document lineage plus embedding Model/Provider evidence. It deliberately excludes Document ACL/access/storage/retrieval authority.
- DD-193 ensures a bound RAGSource references the exact current Document id/version/scope with raw ACTIVE+CLEAN, residency and sensitivity continuity. An unbound RAGSource remains valid lineage evidence and may represent a non-Document source.
- DD-558…DD-562 own one explicit Document ACL permission, trusted current instant, subject matching, expiry partitioning and explicit-DENY-wins **inside the ACL layer only**. `loadDocumentAccessAclCurrentEffectEvidence(...)` re-reads the exact Document under the supplied RequestContext and returns ACL-layer `DENY | ALLOW | NONE` evidence without final authorization.
- Document ACL permission vocabulary is exactly `VIEW | DOWNLOAD | SHARE | DELETE_VERSION`. Source does **not** state that RAG retrieval always maps to `VIEW`, so this batch must accept one explicit already-governed `documentAclPermission` input and must not claim that the supplied permission is the complete/correct RAG access policy.
- RAGSource `status` is raw open text in migration 0012; source owns no closed ACTIVE/latest selection semantics here. RAGChunk `acl_projection_json` is raw JSON with no application-level schema. Neither may be interpreted by this batch.

**SOURCE-COMPLETE:** extend exact DD-647 lineage with optional bound-Document DD-562 ACL current-effect evidence only. If DD-647 contains no Document, perform zero ACL-layer reads and preserve parent-only evidence without inferring access. If a Document is bound, invoke DD-562 with the exact RequestContext, preserved Document id, explicit supplied Document ACL permission and explicit trusted current instant; require the re-read candidate to remain the same persisted Document version/scope/security identity as DD-647 evidence. Preserve the ACL effect as evidence only.

## Frozen decisions

**DD-648 — exact DD-647 lineage evidence first.** Add `loadAIRAGChunkBoundDocumentAclCurrentEffectEvidence(...)`. Invoke DD-647 once with the exact RequestContext/RAGChunk id and unchanged chunk/model/provider/source/document dependencies. Parent null returns null; parent dependency/governed errors propagate unchanged. No ACL or second Document read occurs before DD-647 succeeds.

**DD-649 — zero-read unbound branch; exact DD-562 bound branch.** If DD-647 preserves no Document, return frozen `{ parent }` and perform zero ACL reads; this does not mean source/resource ACL is satisfied or unnecessary. If a Document exists, invoke `loadDocumentAccessAclCurrentEffectEvidence(...)` exactly once using the exact same RequestContext object, `documentId === parent.document.id`, the explicit supplied `documentAclPermission`, and exact supplied `currentTimeIso`. Do not substitute or infer a permission such as VIEW.

**DD-650 — re-read Document continuity floor.** Bound success requires the DD-562 candidate to describe the same DD-647 Document identity/version/security scope: exact document id, Tenant, null-safe Industry Context, scope class, version number, sensitivity class and residency region. Any mismatch fails closed. This is freshness/continuity evidence only; storageObject/source-resource/owner fields remain uninterpreted.

**DD-651 — preserve ACL-layer effect evidence without authorization reinterpretation.** Preserve the exact DD-562 envelope, including current/expired matched entries and `DENY | ALLOW | NONE` effect evidence. Do not convert ALLOW to retrieval authorization; DENY remains ACL-layer evidence and no source-resource inheritance/fallback decision is made.

**DD-652 — immutable layered evidence and hard authority boundary.** Unbound success returns frozen `{ parent }`; bound success returns frozen `{ parent, documentAcl }` with exact references. Do not interpret RAGSource.status/sourceVersion/aclPolicyRef or RAGChunk.aclProjection, do not map RAG retrieval to a Document permission, do not evaluate RBAC/ABAC/entitlement/sensitivity/residency/step-up beyond preserved evidence, do not perform vector/FTS retrieval, ranking/reranking, grounding/citation, prompt-injection policy, provider/model routing, inference, mutation or events.

## Fixed acceptance before implementation

- **RAGCHUNK-DOCACL-BASE-001** exact DD-647 parent executes first with exact inputs/dependencies.
- **RAGCHUNK-DOCACL-BASE-002** DD-647 null/error short-circuits or propagates before ACL-layer access.
- **RAGCHUNK-DOCACL-BRANCH-001** unbound source performs zero DD-562 metadata/ACL reads and returns frozen exact parent-only evidence without inferring access.
- **RAGCHUNK-DOCACL-READ-001** bound source invokes DD-562 once with exact same RequestContext, preserved Document id, explicit supplied permission and exact trusted currentTimeIso.
- **RAGCHUNK-DOCACL-READ-002** DD-562 metadata/ACL/time/effect errors propagate unchanged with no permission inference, retry, alternate lookup or fallback.
- **RAGCHUNK-DOCACL-BIND-001** exact id/Tenant/null-safe-Industry/scope/version/sensitivity/residency continuity between DD-647 Document and DD-562 candidate passes.
- **RAGCHUNK-DOCACL-BIND-002** any relevant re-read Document continuity mismatch fails closed.
- **RAGCHUNK-DOCACL-EFFECT-001** DD-562 current/expired entries and DENY/ALLOW/NONE effect evidence are preserved exactly and not reinterpreted as retrieval authorization.
- **RAGCHUNK-DOCACL-EVID-001** success preserves exact DD-647 parent and, when bound, exact DD-562 envelope references; all input/raw lineage/ACL evidence remains unchanged.
- **RAGCHUNK-DOCACL-BOUND-001** output exposes no inferred RAG→Document permission mapping, source-resource fallback, full access decision, retrieval/filter/rank/rerank/ground/citation, prompt-injection policy, provider/model routing, inference, mutation/event or AI execution authority.

Expected executable delta: Core **1596 → 1606**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 verification files**.

## Explicit exclusions

No closed semantics for raw `RAGSource.status`, latest/current `sourceVersion` selection or `aclPolicyRef`.  
No schema or interpretation for `RAGChunk.aclProjection`.  
No inference that RAG retrieval equals Document `VIEW` or any other ACL permission.  
No source-resource inheritance/fallback choice for unbound or bound sources.  
No final authorization, RBAC/ABAC/commercial/entitlement/sensitivity/residency/step-up decision.  
No StorageObject lookup, signed URL/token/grant or public sharing.  
No vector/FTS retrieval, ranking/reranking, grounding/citation, prompt assembly/injection defense, Provider/Model route, inference or execution.  
No schema, migration, role, grant, RLS, route, frontend, worker, scheduler or RawSource change.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-648…DD-652 and the ten fixed acceptances.
