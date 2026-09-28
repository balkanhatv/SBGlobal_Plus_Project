# AI MemoryRecord raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-RAG-CHUNK-READ-001`  
**Baseline branch head:** `5520ff0ba28e75a88edf82af4db72b7c1bb779d7`  
**Scope:** next independent governed continuation after DD-128.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0012_ai_rag_memory_usage.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-117 AssistantDefinition and DD-121 Conversation evidence where relevant.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.ai_memory_record` row.

Migration 0012 physically owns:

- `id uuid PRIMARY KEY`;
- `tenant_id uuid NOT NULL`;
- optional `industry_context_id`;
- optional `principal_id`;
- optional `assistant_definition_id`;
- constrained `memory_class`: `SESSION | USER_PREFERENCE | TENANT_KNOWLEDGE | INDUSTRY_KNOWLEDGE | WORKING_CONTEXT`;
- raw `content_ref_or_encrypted_content`;
- optional raw `source_ref`;
- constrained sensitivity class;
- raw `retention_class`;
- optional raw `acl_policy_ref`;
- constrained `status`: `ACTIVE | SUPERSEDED | ERASED | EXPIRED`;
- `created_at`;
- optional `expires_at` with `expires_at > created_at` when present;
- optional `supersedes_id` self-reference;
- `INDUSTRY_KNOWLEDGE` requires a non-null Industry Context.

The table is FORCE-RLS. Visibility requires the same Tenant, exact Industry Context when the row is Industry-scoped, and exact principal when `principal_id` is non-null. A row with `principal_id IS NULL` is scope-shared under the database policy. A Tenant-Core row with no Industry Context is visible inside same-Tenant Industry RequestContexts because the RLS predicate is `industry_context_id IS NULL OR industry_context_id=current_industry_context_id()`; this raw row visibility must not be turned into automatic cross-context history carry.

Migration 0014 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on MemoryRecord persistence.

Migration 0031 adds write-time integrity:

- non-null principal must be active for the Tenant at `created_at`;
- optional AssistantDefinition must be ACTIVE and applicable to the memory Tenant/Industry scope at write time;
- `supersedes_id` cannot self-reference;
- supersession must stay in the exact Tenant, Industry, principal and memory class.

Those historical write-time facts do not prove that the principal/Assistant remains current, that a row is currently retrievable, that ACL/retention permits disclosure, or that a supersession chain has been resolved.

DD-09 states that memory lookup requires matching scope + ACL and that conversation/history is not automatically carried across Industry Context switches. Therefore exact raw row visibility is persistence evidence only, not governed lookup or cross-context carry authority.

## Authorized implementation boundary

DD-129 may implement only an exact-by-id immutable MemoryRecord persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `tenantId`;
- optional `industryContextId`;
- optional `principalId`;
- optional `assistantDefinitionId`;
- constrained raw `memoryClass`;
- raw `contentRefOrEncryptedContent`;
- optional raw `sourceRef`;
- constrained `sensitivityClass`;
- raw `retentionClass`;
- optional raw `aclPolicyRef`;
- constrained raw `status`;
- `createdAt`;
- optional `expiresAt`;
- optional `supersedesId`.

Validation remains schema-aligned only:

- UUID validation for identifiers;
- exact enum validation for memory/sensitivity/status classes;
- raw text remains raw text without invented non-empty constraints;
- timestamps must be valid persisted values;
- no wall-clock expiry evaluation, supersession-chain resolution, ACL interpretation, decryption or retention execution is invented.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- memory search/listing/history assembly;
- “current/latest” memory selection;
- supersession-chain resolution;
- expiry evaluation against current time;
- retention/legal-hold/erasure execution;
- ACL-policy evaluation or acting-principal authorization beyond existing RLS;
- automatic Tenant-Core memory carry into another Industry experience;
- decryption or dereference of content/source references;
- current principal or AssistantDefinition revalidation for execution;
- Assistant selection;
- prompt composition;
- provider/model routing;
- tool/agent execution;
- inference/RAG;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

The existing AI Gateway MemoryRecord DML authority remains schema-owned; the DD-129 application port itself is read-only.

## Acceptance expectations

1. exact principal-owned Industry memory returns complete immutable raw evidence;
2. sibling Industry context cannot expose Industry memory;
3. another principal cannot read principal-owned memory, while `principal_id IS NULL` shared memory is visible within the same governed scope;
4. Tenant-Core memory remains same-Tenant visible from Core and Industry contexts, but raw visibility does not become automatic cross-context history carry;
5. foreign Tenant and PLATFORM_GLOBAL contexts cannot expose Tenant memory;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. raw ACTIVE/SUPERSEDED/ERASED/EXPIRED, expiry/supersedes/ACL/retention/content evidence does not become current-memory/retrieval/retention/execution authority, and the port exposes no mutation/list/current/ACL/decrypt/retention/execute method.

Acceptance IDs: `AIMEM-PG-001` through `AIMEM-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-129 traceability or state promotion.
