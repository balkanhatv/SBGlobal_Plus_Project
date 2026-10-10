# RAGChunk citation-identity evidence composition — source and prerequisite ownership audit

**Date:** 2026-10-08  
**Baseline checkpoint:** `DEV-AI-RAG-CHUNK-SOURCE-RESOURCE-DESCRIPTOR-EVIDENCE-READER-001`  
**Verified entry HEAD/tree:** `2cf762db1f32a0c28696e1da9b20898915ba96e2` / `42af7a9f3e76171037c52058845724bad77ba43a`  
**Governed batch:** DD-663…DD-667  
**Status:** bounded source-audit frozen; implementation requires this audit HEAD to pass Core/PostgreSQL/Database/Web

## Exact-head entry

DD-658…DD-662 canonical state closure `2cf762db1f32a0c28696e1da9b20898915ba96e2` is green at the same HEAD on push and PR Core/Database/Web workflows. Push Core run `37741058405`, Core job `113191628823`: **1622/1622**, fail/skip 0; PostgreSQL job `113191628393`: **540/540**, fail/skip 0 plus full database bootstrap PASS. Database run `37741058381` job `113191628596` PASS (48 migrations / 42 SQL verification files); Web run `37741058356` job `113191628188` PASS. PR #2 remains draft/unmerged. RawSource and `main` are unchanged.

## Source ownership

- DD-09 §9 explicitly names `GroundingCitation{sourceResourceType,sourceResourceId,documentId?,chunkId,sourceVersion,safeLabel,relevanceClass}`. Citation material exposed to a client must itself be authorized. A partial internal identity is **not** a `GroundingCitation` and must not be emitted to clients.
- DD-09 §8 explicitly orders source ACL and entitlement/security/sensitivity/residency filters before retrieval/reranking/grounding/citation. Neither DD-662 nor this batch performs any of those remaining authorization or retrieval steps.
- DD-647 preserves the exact persisted `RAGSource` reference (including `resourceType`, `resourceId`, optional `documentId`, `sourceVersion`) and exact `RAGChunk` reference (including `id`) within the DD-662 ancestry; the DD-194 chunk/source binding has already passed.
- DD-657 owns the ACL access-path classification: explicit DENY blocks fallback; explicit ALLOW is only ACL-path evidence; `SOURCE_RESOURCE_AUTHORIZATION_REQUIRED` is a still-unperformed authorization branch.
- DD-662 projects a DD-03 ResourceDescriptor only for the `SOURCE_RESOURCE_AUTHORIZATION_REQUIRED` branch; unbound/explicit-DENY/explicit-ALLOW remain frozen parent-only. This source-audit narrows itself to **exactly that descriptor-present branch** to avoid introducing citation-like evidence into any other branch.
- DD-127/ DD-194 preserve raw `sourceVersion`, `resourceType`, `resourceId` and optional `documentId` as they are; they do not establish source freshness, citation disclosure policy, safe label, relevance score/class or client visibility.
- No source-owned mapping from `RAGSource.residencyRegion` to DD-03 `residencyClass`, RAG retrieval OperationContract/permission, source-resource resolver or current authorization gate is established. Therefore none is invented.

**SOURCE-COMPLETE ONLY FOR:** a zero-read, frozen, strictly internal **citation-identity evidence** projection over exact DD-662 success where `resourceDescriptor` is present. Project only `sourceResourceType === source.resourceType`, `sourceResourceId === source.resourceId`, optional `documentId === source.documentId`, `chunkId === chunk.id`, `sourceVersion === source.sourceVersion`. Preserve all raw strings exactly. This cannot establish a full citation, final authorization or retrieval admission.

## Frozen decisions

**DD-663 — exact DD-662 parent first and error propagation.** Add `loadAIRAGChunkCitationIdentityEvidence(...)`. Invoke DD-662 once with exact original `RequestContext`, chunk id, caller-supplied governed DocumentAclPermission, trusted currentTimeIso and six existing dependencies. Parent null returns null. Parent errors propagate unchanged; no added persistence calls.

**DD-664 — branch-preserving citation-identity absence.** For unbound, EXPLICIT_ACL_DENY and EXPLICIT_ACL_ALLOW, return frozen `{ parent }` with no citation identity. Do not upgrade ALLOW, bypass DENY or infer that unbound evidence is accessible.

**DD-665 — exact internal identity projection, no invented fields.** For `resourceDescriptor` present only, obtain the already-preserved exact DD-647 RAGSource and RAGChunk reference; create frozen `citationIdentity` holding only the five raw fields named above, with optional `documentId` only if persisted. Do not generate `safeLabel`, `relevanceClass`, `citationAuthorized`, `sourceCurrent`, `contentRef`, or anything client-facing. Do not trim or reinterpret raw source strings; do not map sourceVersion to embeddingVersion.

**DD-666 — immutable exact evidence.** Freeze only new envelopes/identity, preserving exact DD-662 parent, source, chunk, Document, ACL/model/provider objects and arrays unchanged. No clone, normalization or mutation of persisted inputs.

**DD-667 — no citation authorization, grounding or inference authority.** This internal identity is not a complete `GroundingCitation`, must not be returned to a client, and does not grant source resolution, permissions, ABAC, entitlement, sensitivity/residency filters, retrieval, ranking, grounding, citation assembly, prompt-injection safety, provider/model routing, inference, mutation or event authority. Final citation disclosure requires separately source-owned authorization.

## Fixed acceptance before implementation

- **RAGCHUNK-CITID-BASE-001** exact DD-662 parent called first with unchanged inputs/dependencies and zero extra reads.
- **RAGCHUNK-CITID-BASE-002** DD-662 null and dependency errors propagate/short-circuit unchanged before projection.
- **RAGCHUNK-CITID-BRANCH-001** unbound/explicit DENY/explicit ALLOW are frozen parent-only without citation identity.
- **RAGCHUNK-CITID-ID-001** only descriptor-present branch projects exact `sourceResourceType/sourceResourceId/documentId?/chunkId/sourceVersion` from preserved parent records.
- **RAGCHUNK-CITID-ID-002** no safeLabel/relevanceClass, sourceVersion inference, residency mapping, alternate identity or additional output fields.
- **RAGCHUNK-CITID-EVID-001** exact parent and nested raw reference/contents remain unchanged; new envelope and identity frozen.
- **RAGCHUNK-CITID-BOUND-001** no final GroundingCitation, client exposure, authorization, retrieval/ranking/grounding/citation or inference/execution result.
- **RAGCHUNK-CITID-BOUND-002** explicit DENY never bypassed; explicit ALLOW never treated as final; descriptor-present branch remains authorization-required.

Expected Core acceptance delta **1622 → 1630**. PostgreSQL remains **540**. Database remains **48 migrations / 42 verification files**.

## Exclusions

No schema, SQL/RLS/role/grant, route, frontend, RawSource, worker, provider adapter, vector search or operational runtime changes. No new RAG retrieval OperationContract, source resolver, DD-03 AuthorizationDecision, ABAC/commercial policy, direct client-facing `GroundingCitation`, citation labels or relevance-class mapping.

Implement only after this exact HEAD passes Core/PostgreSQL/Database/Web.
