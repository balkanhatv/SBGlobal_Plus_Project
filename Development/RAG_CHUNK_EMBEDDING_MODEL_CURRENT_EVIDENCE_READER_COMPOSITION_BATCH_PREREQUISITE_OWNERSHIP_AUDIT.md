# RAGChunk current embedding AIModel evidence reader composition prerequisite ownership audit

**Date:** 2026-10-07  
**Baseline checkpoint:** `DEV-AI-RAG-CHUNK-SOURCE-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `7452bc1bcabeb96aff48c45bf428ff09cbdc010b`  
**Verified entry tree:** `a4ef65f1523c08b58fb6136981122c10ebed2675`  
**Governed batch:** DD-633 through DD-637

## Entry gate

DD-628…DD-632 state closure is exact-head verified. Core Service Verify push run `37637128448`: Core job `112846181498` **1570/1570 PASS**, PostgreSQL job `112846181022` **540/540 PASS**, fail/skip 0 and full database bootstrap PASS. Database Verify run `37637128428` / job `112846180310` passed. Web Boundary Verify run `37637128453` / job `112846181288` passed. RawSource remains unchanged; `main` remains unmerged; PR #2 remains draft/unmerged.

## Reconciled source owners

- DD-128 owns exact-by-id immutable RAGChunk metadata through `AIRAGChunkMetadataReadPort.loadForContext({ requestContext, ragChunkId })`, including the persisted `embeddingModelId` and constrained chunk `sensitivityClass`. The read boundary is RequestContext/RLS scoped and intentionally omits the persisted vector payload.
- DD-108 owns global immutable AIModel catalog metadata through `AIModelCatalogMetadataReadPort.loadById(id)`, including exact model id, raw status and constrained `sensitivityCeiling`.
- DD-195 owns the pure `matchesAIRAGChunkEmbeddingModelEligibilityFloors(chunk, model?)` predicate derived from migration 0031: exact model id, raw `status === "ACTIVE"`, and model sensitivity-ceiling rank >= chunk sensitivity rank.
- Migration 0031 defines the RAGChunk→embedding-model predicate separately from the RAGChunk→RAGSource DD-194 relationship. Therefore DD-632 source-binding evidence is not a prerequisite for this independent current-model evidence reader.
- AIProvider currentness/health/credentials, Provider↔Model continuity, capability/modality/residency compatibility, model selection/routing, embedding-version compatibility, cost/latency/version policy, chunk/source/document ACL/access, vectors, retrieval/ranking/grounding and AI execution remain separate contracts.

No new persistence adapter, schema, migration, SQL verification, RLS, role or grant is required.

## Determination

**SOURCE-COMPLETE for exact RAGChunk → current embedding AIModel eligibility evidence only.**

“Current” means a fresh read of the requested persisted chunk under its supplied RequestContext plus a fresh global AIModel row read by the persisted `chunk.embeddingModelId`, followed by DD-195 revalidation. It does not mean Provider currentness, routing eligibility, retrieval eligibility or execution authority.

## Frozen decisions

### DD-633 — exact RAGChunk evidence first

Add `loadAIRAGChunkEmbeddingModelCurrentEvidence(...)`. Read the exact requested RAGChunk first with the exact supplied RequestContext and ragChunkId. Missing chunk returns null. Chunk dependency/validation errors propagate unchanged. No AIModel access occurs before successful chunk evidence.

### DD-634 — one exact global AIModel read by persisted embeddingModelId

After chunk evidence exists, call `AIModelCatalogMetadataReadPort.loadById` exactly once with `id === chunk.embeddingModelId`.

Missing model returns null. Model dependency errors propagate unchanged. No model-code search, default selection, Provider lookup, alternate id, retry or fallback is allowed.

### DD-635 — apply only DD-195 current embedding-model eligibility floor

Apply `matchesAIRAGChunkEmbeddingModelEligibilityFloors(chunk, model)` once. Require exact model id equality, raw `ACTIVE` status and sensitivity ceiling >= chunk sensitivity. Missing/malformed/mismatched evidence fails closed.

Do not interpret Provider id/currentness, capabilities, modalities, residency regions, cost/latency class, model version/metadata, chunk source binding, ACL projection, embeddingVersion, retention, text/hash/token/metadata or timestamps.

### DD-636 — immutable exact-reference evidence

Success returns frozen `{ chunk, model }` preserving the exact DD-128 chunk and DD-108 model object references without cloning, normalization or mutation.

### DD-637 — model eligibility evidence grants no retrieval/routing/execution authority

A success is not:
- RAGChunk→RAGSource DD-194 validity or RAGSource ACTIVE/latest state;
- RAGSource→Document validity or Document/source ACL/access/storage authority;
- chunk ACL projection authorization;
- AIProvider currentness, health, credentials or Provider↔Model continuity;
- capability/modality/residency/embedding-version compatibility;
- model routing/selection, cost/budget/quota authority;
- embedding/vector/FTS search, ranking/reranking, grounding/citation selection;
- decrypt/dereference authority for chunk text;
- prompt composition, provider/model invocation or AI execution;
- mutation/event authority.

## Fixed acceptance before implementation

- **RAGCHUNK-MODELREAD-BASE-001** exact supplied RequestContext/id reaches the RAGChunk reader first and success preserves the exact chunk reference.
- **RAGCHUNK-MODELREAD-BASE-002** chunk null short-circuits before model access and chunk reader errors propagate unchanged.
- **RAGCHUNK-MODELREAD-READ-001** exactly one global model read uses exact persisted `chunk.embeddingModelId`.
- **RAGCHUNK-MODELREAD-READ-002** missing model returns null; model dependency errors propagate unchanged with no search/default/provider/fallback read.
- **RAGCHUNK-MODELREAD-FLOOR-001** exact ACTIVE model id with sufficient sensitivity ceiling passes and preserves exact model evidence.
- **RAGCHUNK-MODELREAD-FLOOR-002** wrong model id, non-exact ACTIVE status, insufficient/unknown sensitivity or malformed relevant evidence fails closed.
- **RAGCHUNK-MODELREAD-EVID-001** success is frozen, preserves exact chunk/model references, leaves unrelated raw metadata unchanged and performs exactly two reads in order.
- **RAGCHUNK-MODELREAD-BOUND-001** output exposes no source/document/ACL/provider/compatibility/retrieval/grounding/routing/execution/mutation authority.

Expected executable delta: Core **1570 → 1578**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions

No schema/migration/SQL-verification/RLS/role/grant/API/route/frontend/worker/provider-SDK/RawSource change. No RAGSource, Document or AIProvider read. No vector materialization. No ACL/authorization/entitlement/commercial/budget evaluation.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-633…DD-637 and the eight fixed acceptances above.
