# CORE SERVICE CHECKPOINT — DEV-AI-RAG-CHUNK-READ-001
**Updated:** 2026-09-23 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `f713a05d7f03e29938198dac96663dc0222a26b6` / tree `d6420945deba39281963d374cccde327e422e57a`: **311/311 Core**, **336/336 PostgreSQL**, **47 migrations / 41 SQL verification files**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests.

Promotion invariant gate `d79c4fdca4645d4b95d6442a621eb4cf3678f065` / tree `6ff1b8fddbb3e2b6c18419dca7cebbc84ae86667`: Core run `35846762899` (Core job `107134668672`, PostgreSQL job `107134669061`), Database run `35846763723` (job `107134671660`), Web run `35846763020` (job `107134669327`) — SUCCESS; invariants **9 Industries / 41 canonical MS / 181 registered Industry tables / 2,962 preserved requirements / 128 unique DD definitions**.

## Implemented boundary

DD-128 adds an exact-by-id scoped `core_ai.rag_chunk` raw metadata reader through the existing `PostgresAIGatewayDatabase` + `RequestScopedSql` boundary. The persisted vector payload is intentionally excluded. FORCE-RLS remains authoritative; raw ACL/model/chunk evidence does not authorize retrieval, prove current source/model/document state, or perform vector search, ranking, grounding or inference.

`AIRAGCHUNK-PG-001`…`AIRAGCHUNK-PG-007` prove exact immutable non-vector metadata read, sibling-Industry/foreign-Tenant/PLATFORM isolation, same-scope non-principal-private visibility, safe missing/malformed/route-mismatch handling, immutable JSON evidence, and no vector-load/ACL-evaluate/retrieve/search/rerank/ground/execute surface.

## Remaining scope

Vector/FTS retrieval, current RAGSource/DocumentMeta/ACL/scan/sensitivity/residency revalidation, acting-principal ACL evaluation, embedding-model currentness/eligibility, chunk currentness/dedup/reindex, chunking-policy execution, retrieval/ranking/reranking/filtering/grounding/citation, text decryption/dereference, prompt composition/injection defense, provider/model routing, inference/RAG and Workflow/Automation runtime remain unimplemented unless separately source-owned.

Next: Fresh source-audit the next independent source-complete persistence slice without opening effective RAG retrieval/ACL evaluation or execution semantics.

Evidence: `Registers/DEVELOPMENT_DD128_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs unchanged; `main` remains outside this branch continuation; PR #2 remains review-only/draft until explicitly authorized.
