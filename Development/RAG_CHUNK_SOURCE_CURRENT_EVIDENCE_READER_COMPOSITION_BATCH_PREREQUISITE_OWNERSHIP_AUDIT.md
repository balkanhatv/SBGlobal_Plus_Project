# RAGChunk parent RAGSource current-evidence reader composition prerequisite ownership audit

**Date:** 2026-10-07  
**Baseline checkpoint:** `DEV-AI-RAG-SOURCE-DOCUMENT-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `d1a22f7a25d7b1f5ff931c0272a6c868f36a98e8`  
**Verified entry tree:** `c95e61b3b94d201611e34569365426358e80f888`  
**Governed batch:** DD-628 through DD-632

## Entry gate

DD-623…DD-627 state closure is exact-head verified. Core Service Verify push run `37614254798`: Core job `112768670782` **1562/1562 PASS**, PostgreSQL job `112768671164` **540/540 PASS**, fail/skip 0 and full database bootstrap PASS. Database Verify run `37614254767` / job `112768670161` passed. Web Boundary Verify run `37614254775` / job `112768670203` passed. RawSource remains unchanged; `main` remains unmerged; PR #2 remains draft/unmerged.

## Reconciled source owners

- DD-128 owns exact-by-id immutable RAGChunk metadata through `AIRAGChunkMetadataReadPort.loadForContext({ requestContext, ragChunkId })`. The PostgreSQL reader validates resolved context, exact UUID id, FORCE-RLS visibility, immutable persisted metadata and does not expose the embedding vector payload.
- DD-127 owns exact-by-id immutable RAGSource evidence through `AIRAGSourceReadPort.loadForContext({ requestContext, ragSourceId })`. The reader uses RequestScopedSql/RLS under the supplied RequestContext and returns null when the referenced source is not visible/currently readable through that persistence boundary.
- DD-194 owns the pure `matchesAIRAGChunkSourceBindingFloors(chunk, source?)` relationship predicate derived from migration 0031: exact source id, Tenant, null-safe Industry, scope, residency, retention and chunk-sensitivity-rank >= source-sensitivity-rank.
- Migration 0031 separately owns embedding-model eligibility. DD-195 exposes that as another pure floor. It is not part of this batch.
- RAGSource→Document DD-193/DD-627, source status/current-version selection, source-resource/ACL authorization, RAGChunk ACL projection, embedding model currentness, vectors, retrieval/ranking/grounding and AI execution are separate contracts.

The direct RAGChunk parent relationship is source-complete without a new persistence adapter, schema, RLS, role or grant.

## Determination

**SOURCE-COMPLETE for RAGChunk → exact currently readable parent RAGSource relationship evidence only.**

The word “current” here means a fresh read through the existing RequestContext-scoped persistence boundary followed by DD-194 relationship revalidation. It does **not** mean source.status ACTIVE, latest sourceVersion, valid Document binding, retrievability or authorization.

## Frozen decisions

### DD-628 — exact RAGChunk evidence first

Add `loadAIRAGChunkSourceCurrentEvidence(...)`. Read the exact requested RAGChunk first with the exact supplied RequestContext and ragChunkId. Missing chunk returns null. Chunk dependency/validation errors propagate unchanged. No parent source access occurs before successful chunk evidence.

### DD-629 — one exact same-context parent RAGSource read

After chunk evidence exists, call `AIRAGSourceReadPort.loadForContext` exactly once with:
- the exact same RequestContext object supplied to DD-628; and
- `ragSourceId === chunk.sourceId`.

Missing/hidden source returns null. Source dependency/validation errors propagate unchanged. No retry, search, alternate context, source-module/resource lookup or fallback is allowed.

### DD-630 — apply only DD-194 relationship/currentness floor

Apply `matchesAIRAGChunkSourceBindingFloors(chunk, source)` once. Require exact id/Tenant/null-safe Industry/scope/residency/retention continuity and chunk sensitivity rank >= source rank. Any malformed relevant evidence or mismatch returns null.

Do not interpret source.status, sourceVersion, chunkingPolicyVersion, document binding, aclPolicyRef, chunk ACL projection, embeddingModelId/version, text/hash/token/metadata or timestamps.

### DD-631 — immutable exact-reference evidence

Success returns frozen `{ chunk, source }` preserving the exact already-loaded DD-128 chunk and DD-127 source object references without cloning, normalization or mutation.

### DD-632 — relationship evidence grants no retrieval/access/model/execution authority

A success is not:
- RAGSource ACTIVE/latest/current-version selection;
- RAGSource→Document validity or Document ACL/access/storage authority;
- source-resource existence/currentness or aclPolicyRef authorization;
- RAGChunk ACL projection authorization;
- embedding-model current eligibility, Provider currentness or routing;
- embedding/vector/FTS search, ranking/reranking, grounding/citation selection;
- decrypt/dereference authority for chunk text;
- prompt composition, provider/model invocation or AI execution;
- mutation/event authority.

## Fixed acceptance before implementation

- **RAGCHUNK-SRCREAD-BASE-001** exact supplied RequestContext/id reaches the RAGChunk reader first; successful parent chain preserves the exact chunk evidence.
- **RAGCHUNK-SRCREAD-BASE-002** chunk null short-circuits before source access and chunk reader errors propagate unchanged.
- **RAGCHUNK-SRCREAD-READ-001** exactly one source read uses the same RequestContext object and exact persisted chunk.sourceId.
- **RAGCHUNK-SRCREAD-READ-002** hidden/missing source returns null; source dependency errors propagate unchanged with no retry/search/fallback.
- **RAGCHUNK-SRCREAD-FLOOR-001** exact Tenant-Industry and Tenant-Core DD-194 relationships pass and preserve exact source evidence.
- **RAGCHUNK-SRCREAD-FLOOR-002** wrong parent, Tenant/Industry/scope/residency/retention/sensitivity continuity failure or malformed relevant relationship evidence fails closed.
- **RAGCHUNK-SRCREAD-EVID-001** success is frozen, preserves exact chunk/source references, leaves unrelated raw metadata unchanged and performs exactly two persistence reads in order.
- **RAGCHUNK-SRCREAD-BOUND-001** output exposes no source-status/document/ACL/model/retrieval/grounding/routing/execution/mutation authority.

Expected executable delta: Core **1562 → 1570**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions

No schema/migration/SQL-verification/RLS/role/grant/API/route/frontend/worker/provider-SDK/RawSource change. No new Document read. No AIModel/AIProvider read. No vector materialization. No authorization/entitlement/commercial/budget evaluation.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-628…DD-632 and the eight fixed acceptances above.
