# AI RAGChunk raw metadata persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-RAG-SOURCE-READ-001`  
**Baseline branch head:** `954ac049a5c9c564807ce03a76653d6f3df23baa`  
**Scope:** next independent governed continuation after DD-127.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0012_ai_rag_memory_usage.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- DD-127 RAGSource read evidence;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`.

## Candidate determination

The next independently source-complete slice is exact-by-id **RAGChunk metadata** from `core_ai.rag_chunk`, explicitly excluding the persisted vector payload.

Migration 0012 physically owns:

- `id uuid PRIMARY KEY`;
- `source_id uuid NOT NULL`;
- `tenant_id uuid NOT NULL`;
- nullable `industry_context_id`;
- `scope_class` constrained to `TENANT_CORE | TENANT_INDUSTRY`;
- non-negative `chunk_ordinal`;
- raw non-null `text_ref_or_encrypted_text`;
- raw non-null `content_hash`;
- `token_count` constrained to 0..1200;
- non-null `acl_projection_json`;
- constrained sensitivity class;
- raw residency and retention;
- `embedding_model_id uuid NOT NULL`;
- raw non-null `embedding_version`;
- non-null `embedding vector`;
- non-null `metadata_json`;
- `created_at`;
- exact Tenant-Core vs Tenant-Industry ownership-shape check;
- uniqueness of source/ordinal/model/version.

RAGChunk FORCE-RLS SELECT visibility is same Tenant plus either Tenant-Core or exact Industry Context. It is not principal-private.

Migration 0014 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on RAGChunk persistence.

Migration 0031 adds write-time integrity requiring:
- source identity, Tenant/Industry/scope, residency and retention to match the parent RAGSource;
- chunk sensitivity not to be lower than source sensitivity;
- embedding model to be ACTIVE at write time and have sensitivity ceiling high enough for the chunk.

Those are write-time facts. Reading a persisted chunk later does not prove the source remains current/retrievable, the embedding model remains ACTIVE/eligible, the ACL projection authorizes the acting principal, or that the chunk should participate in retrieval.

DD-09 defines RAG ingestion as source → classification/access → extraction → chunking → metadata → embedding → vector row/index, and separately defines retrieval as RequestContext + Tenant/Industry + current source/resource ACL + security/sensitivity/residency filtering before vector/FTS retrieval and reranking. Raw chunk metadata therefore is not retrieval authority.

## Authorized implementation boundary

DD-128 may implement only an exact-by-id immutable **RAGChunk metadata** reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `sourceId`;
- `tenantId`;
- optional `industryContextId`;
- constrained raw `scopeClass`;
- non-negative `chunkOrdinal`;
- raw `textRefOrEncryptedText`;
- raw `contentHash`;
- bounded `tokenCount`;
- normalized immutable `aclProjection` JSON;
- constrained raw `sensitivityClass`;
- raw `residencyRegion`;
- raw `retentionClass`;
- `embeddingModelId`;
- raw `embeddingVersion`;
- normalized immutable `metadata` JSON;
- `createdAt`.

The persisted `embedding` vector payload is intentionally **not returned** by DD-128. Vector materialization/search remains outside this slice.

Validation remains schema-aligned only:
- UUID validation;
- exact scope/sensitivity vocabularies and ownership shape;
- chunk ordinal >=0 safe integer;
- token count safe integer within 0..1200;
- JSON normalization/freeze without ACL/metadata interpretation;
- raw text remains raw;
- timestamp must parse.

## Explicitly unclaimed semantics

DD-128 does **not** implement or authorize:

- reading/materializing the embedding vector payload;
- vector similarity or FTS search;
- source/current-version selection;
- current RAGSource or DocumentMeta revalidation;
- ACL projection interpretation or acting-principal authorization;
- sensitivity/residency/retention policy evaluation;
- embedding-model current activity/eligibility selection;
- chunk currentness/deduplication/reindex decisions;
- chunking-policy execution;
- retrieval/ranking/reranking/grounding/citation selection;
- decrypting/dereferencing chunk text;
- prompt composition or inference;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing RAGChunk DML authority remains schema-owned and separately governed; DD-128 exposes only a metadata read port.

## Acceptance expectations

1. exact Industry chunk metadata returns immutable raw non-vector evidence;
2. sibling Industry chunk is hidden while exact sibling context may read it;
3. Tenant-Core chunk is same-Tenant visible from Tenant Core and Tenant Industry contexts and preserves raw/JSON evidence;
4. same-scope different principal may read because RLS is scope-based, not principal-private;
5. foreign-Tenant and PLATFORM_GLOBAL contexts cannot read the chunk;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. raw ACL/model/text/hash/metadata evidence does not become authorization/vector-search/retrieval/grounding/inference authority; current model activity is not inferred; the port exposes no mutation/vector/retrieve/search/rerank/ground/execute methods.

Acceptance IDs: `AIRAGCHUNK-PG-001` through `AIRAGCHUNK-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-128 traceability or state promotion.
