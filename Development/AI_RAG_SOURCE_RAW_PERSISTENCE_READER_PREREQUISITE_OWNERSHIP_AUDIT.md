# AI RAGSource raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-MESSAGE-READ-001`  
**Baseline branch head:** `b8b931ff7672ba7172b2e7cb1f9e339d1c6011e1`  
**Scope:** next independent governed continuation after DD-126.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0012_ai_rag_memory_usage.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-082/DD-083 Document metadata boundaries as current-document runtime owners.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.rag_source` row.

Migration 0012 physically owns:

- `id uuid PRIMARY KEY`;
- `tenant_id uuid NOT NULL`;
- nullable `industry_context_id uuid`;
- `scope_class` constrained to `TENANT_CORE | TENANT_INDUSTRY`;
- raw non-null `source_module`;
- nullable raw `management_system_id`;
- raw non-null `resource_type`;
- raw non-null `resource_id`;
- nullable `document_id`;
- nullable integer `document_version`;
- sensitivity constrained to `PUBLIC | INTERNAL | CONFIDENTIAL | SENSITIVE_PERSONAL | REGULATED`;
- raw non-null `residency_region`;
- raw non-null `retention_class`;
- nullable raw `acl_policy_ref`;
- raw non-null `status`;
- positive bigint `source_version`;
- raw non-null `chunking_policy_version`;
- non-null `created_at` / `updated_at`;
- exact Tenant-Core vs Tenant-Industry ownership-shape check.

`rag_source` is FORCE-RLS. SELECT visibility is same Tenant plus either Tenant-Core or exact Industry Context. Tenant-Core source rows are therefore same-Tenant visible from Tenant Core and Tenant Industry request contexts. The policy is not principal-private.

Migration 0014 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on RAGSource persistence.

Migration 0031 adds write-time DocumentMeta integrity. When `document_id` exists, the persisted `document_version`, Tenant/Industry/scope, residency and sensitivity must match an then-ACTIVE/CLEAN document, with RAGSource sensitivity at least the referenced document sensitivity. If no document id exists, document version must be null.

That trigger is write-time integrity only. Reading a RAGSource row does not prove the referenced document is still ACTIVE/CLEAN/current/authorized, does not re-run ACL, and does not authorize retrieval.

DD-09 requires Tenant/Industry memory/RAG lookup to match scope + ACL, excludes sibling Industry data, treats retrieved content as untrusted data, and keeps tool/authorization policy outside retrieved text. Raw RAGSource persistence is therefore registration evidence rather than retrieval/grounding authority.

## Authorized implementation boundary

DD-127 may implement only an exact-by-id immutable RAGSource persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `tenantId`;
- optional `industryContextId`;
- constrained raw `scopeClass`;
- raw `sourceModule`;
- optional raw `managementSystemId`;
- raw `resourceType`;
- raw `resourceId`;
- optional `documentId`;
- optional raw safe-integer `documentVersion`;
- constrained raw `sensitivityClass`;
- raw `residencyRegion`;
- raw `retentionClass`;
- optional raw `aclPolicyRef`;
- raw `status`;
- exact bigint-text `sourceVersion`;
- raw `chunkingPolicyVersion`;
- `createdAt`;
- `updatedAt`.

Validation remains schema-aligned only:

- UUID validation for identifiers;
- exact scope/sensitivity vocabularies;
- exact scope/Industry ownership shape;
- document id/version null-pair consistency;
- document version only as a safe integer; no invented positivity because the RAGSource column declares none;
- source version as canonical positive bigint text to avoid JavaScript precision loss;
- raw text stays raw text without invented non-empty vocabularies;
- timestamps must parse; no created/updated ordering is invented.

## Explicitly unclaimed semantics

DD-127 does **not** implement or authorize:

- current DocumentMeta reload/revalidation;
- Document ACL evaluation or `acl_policy_ref` interpretation;
- current virus-scan/status/sensitivity/residency authorization;
- RAGSource current/latest/source-version selection;
- source-module/resource dereference;
- chunk listing or chunk-currentness;
- chunking-policy execution;
- embedding/model selection or vector search;
- retrieval ranking/filtering/grounding;
- prompt composition or prompt-injection handling execution;
- provider/model routing or inference;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing RAGSource DML authority remains schema-owned and separately governed; the DD-127 application port is read-only.

## Acceptance expectations

1. exact Industry RAGSource returns complete immutable raw evidence;
2. sibling Industry RAGSource is hidden while exact sibling context may read it;
3. Tenant-Core RAGSource is same-Tenant visible from Tenant Core and Tenant Industry contexts and preserves schema-valid raw/null evidence;
4. same-scope different principal may read because RLS is scope-based, not principal-private;
5. foreign-Tenant and PLATFORM_GLOBAL contexts cannot read the source;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. raw document/ACL/status/version/chunking evidence does not become retrieval/authorization/chunk/embed/search/grounding/inference authority, and the new port exposes no mutation/list-chunks/revalidate-document/retrieve/embed/search/execute methods.

Acceptance IDs: `AIRAGSRC-PG-001` through `AIRAGSRC-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-127 traceability or state promotion.
