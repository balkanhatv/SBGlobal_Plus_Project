# RAGChunk parent RAGSource binding prerequisite ownership audit

**Date:** 2026-09-25
**Baseline checkpoint:** `DEV-AI-RAG-SOURCE-DOCUMENT-BINDING-FLOORS-001`
**Verified closure HEAD:** `a88ae470a7b945ec64e8c68802a192dc93e595f8`
**Verified tree:** `8250180b9466883e7aa98ab4af0ea3c8e3d7de72`

## Entry gate

DD-193 state closure is exact-head verified. Core Service Verify run `36149187141` passed Core job `108117843053` at **596/596** and PostgreSQL job `108117843075` at **504/504** plus database bootstrap PASS. Database Verify run `36149187165` / job `108117843097` passed. Web Boundary Verify run `36149191735` / job `108117856997` passed. REPO-007 and REPO-008 pass. All four logs assert the exact HEAD/tree above. RawSource is unchanged; `main` is unmerged; PR #2 remains draft/unmerged.

## Source ownership reconciled

Migration 0031 owns the direct `core_ai.rag_chunk.source_id` parent relationship. For every RAGChunk it loads the referenced RAGSource and rejects when:

- parent RAGSource id does not exist;
- parent Tenant differs from chunk Tenant;
- parent Industry Context differs under null-safe equality;
- parent `scope_class` differs;
- parent residency differs;
- parent retention class differs;
- RAGChunk sensitivity rank is lower than parent RAGSource sensitivity rank.

The source-owned rank order is PUBLIC=1, INTERNAL=2, CONFIDENTIAL=3, SENSITIVE_PERSONAL=4, REGULATED=5.

DD-128 exposes every chunk-side fact required by this predicate: id, sourceId, Tenant/optional Industry, scope, sensitivity, residency and retention. DD-127 exposes every parent RAGSource fact required: id, Tenant/optional Industry, scope, sensitivity, residency and retention. Therefore no new reader, schema, RLS, role or grant is required.

The same migration separately validates the chunk `embedding_model_id` against an ACTIVE model with a sufficient sensitivity ceiling. That model predicate is a separate independent relationship and is explicitly excluded from DD-194.

RAGSource status, source document binding, ACL policy, resource currentness, chunk ACL projection, embedding version, vectors, retrieval and inference are not part of this parent relationship predicate.

## Determination and locked DD-194 detailed contract

**SOURCE-COMPLETE for the direct RAGChunk → parent RAGSource scope/security continuity floor only.**

Authorize pure helper:

`matchesAIRAGChunkSourceBindingFloors(chunk, source?)`

It accepts one already-loaded DD-128 `PersistedAIRAGChunkMetadata` and optional already-loaded DD-127 `PersistedAIRAGSource`, returns boolean and never mutates inputs.

1. Validate relevant chunk id/source id/Tenant/optional Industry/scope/sensitivity/residency/retention shape.
2. Require supplied parent source evidence with valid source id/Tenant/optional Industry/scope/sensitivity/residency/retention shape.
3. Require exact `source.id === chunk.sourceId`.
4. Require exact Tenant equality.
5. Require null-safe exact Industry Context equality.
6. Require exact scope-class equality.
7. Require exact residency string equality with no normalization.
8. Require exact retention-class string equality with no normalization.
9. Require RAGChunk sensitivity rank >= RAGSource sensitivity rank. Unknown sensitivity values fail closed.
10. Unrelated chunk ordinal/text/hash/token/ACL/embedding/version/metadata and source status/document/resource/ACL/source-version/chunking-policy evidence remain uninterpreted.

## Fixed acceptance before implementation

- **RAGCHUNK-SRC-CUR-001**: exact Tenant-Industry and Tenant-Core parent bindings pass.
- **RAGCHUNK-SRC-CUR-002**: missing source evidence or wrong parent id fails closed.
- **RAGCHUNK-SRC-CUR-003**: Tenant, null-safe Industry Context or scope mismatch fails closed.
- **RAGCHUNK-SRC-CUR-004**: residency equality is exact; no normalization is authorized.
- **RAGCHUNK-SRC-CUR-005**: retention-class equality is exact; no normalization is authorized.
- **RAGCHUNK-SRC-CUR-006**: all known sensitivity pairs follow chunk-rank >= source-rank; unknown classes fail closed.
- **RAGCHUNK-SRC-CUR-007**: malformed relevant chunk/source identity/scope/security shape fails closed.
- **RAGCHUNK-SRC-CUR-008**: unrelated chunk/source semantics, including embedding-model evidence and source status/document binding, are uninterpreted and inputs remain unchanged.

Expected executable delta: Core **596 → 604**. PostgreSQL remains **504**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions / continuation

A true result is not RAGSource status/currentness, RAGSource→Document validity, Document ACL, acting-principal authorization, source-resource existence/currentness, ACL projection interpretation, retention execution/legal-hold, chunk currentness/dedup/reindex, embedding-model eligibility, vector/FTS retrieval, ranking/reranking, grounding/citation, prompt-injection defense, provider/model routing or AI execution. It changes no schema/RLS/role/grant/route/product policy.

After DD-194 is implemented and exact-head verified, source-audit the separate RAGChunk → embedding-model current eligibility relationship. Complete RAG retrieval and AI execution remain separately governed.
