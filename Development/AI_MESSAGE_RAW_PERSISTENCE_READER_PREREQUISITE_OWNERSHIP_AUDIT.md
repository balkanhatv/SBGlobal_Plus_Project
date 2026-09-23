# AI Message raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-MEDIA-REQUEST-READ-001`  
**Baseline branch head:** `269a7f8bca48e8a69a5064a53aff4d720c86ec59`  
**Scope:** next independent governed continuation after DD-125.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0012_ai_rag_memory_usage.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-120 AIConversation raw-read evidence.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.ai_message` row.

Migration 0012 physically owns:

- `id uuid PRIMARY KEY`;
- `conversation_id uuid NOT NULL` referencing `core_ai.ai_conversation(id)`;
- raw non-null `role` text;
- raw non-null `content_ref_or_encrypted_content` text;
- nullable `source_refs_json jsonb`;
- nullable raw `model_route_id uuid`;
- non-null `created_at`;
- nullable `deleted_at`.

The child table is FORCE-RLS. SELECT visibility is inherited from its parent Conversation: the row is visible only when the parent Conversation itself is visible to the current RequestContext. Conversation RLS is Tenant + optional exact Industry + exact owner principal. Therefore a message is principal-private through its parent; sibling Industry, another principal, foreign Tenant and PLATFORM_GLOBAL contexts cannot bypass that parent policy.

Migration 0014 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on AIMessage persistence. DD-126 must preserve that database-owned authority while exposing only a read port.

No later migration adds a separate AIMessage trigger that turns role/content/source/model-route/deleted evidence into runtime meaning. DD-09 states that persistence follows policy and not every AI interaction must be retained. Reading one stored row therefore does not authorize message-history enumeration, decryption, source authorization, model routing, retention/deletion processing or inference.

## Authorized implementation boundary

DD-126 may implement only an exact-by-id immutable AIMessage persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `conversationId`;
- raw `role`;
- raw `contentRefOrEncryptedContent`;
- optional normalized immutable JSON `sourceRefs`;
- optional raw `modelRouteId`;
- `createdAt`;
- optional `deletedAt`.

Validation remains schema-aligned only:

- UUID validation for identifiers;
- role/content remain raw text without invented non-empty/vocabulary semantics;
- source JSON remains normalized/frozen JSON evidence without source authorization interpretation;
- timestamps must be valid persisted values;
- no ordering rule between created/deleted timestamps is invented because the schema declares none.

## Explicitly unclaimed semantics

DD-126 does **not** implement or authorize:

- conversation history listing or ordering;
- message-role semantics;
- decrypting or dereferencing `content_ref_or_encrypted_content`;
- resolving or authorizing source references;
- model-route lookup/current selection or provider/model routing;
- treating `deleted_at` as proof that retention/deletion workflow completed;
- retention/legal-hold/erasure policy evaluation;
- prompt reconstruction, inference, RAG or response generation;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing AIMessage DML authority remains schema-owned and separately governed; the DD-126 application port is read-only.

## Acceptance expectations

1. exact visible Industry message returns complete immutable raw evidence with frozen source JSON;
2. sibling Industry context cannot read a message whose parent Conversation is in another Industry;
3. Tenant-Core parent message is visible to its owner from Tenant Core and same-Tenant Industry contexts;
4. same-Tenant different principal cannot read another owner's message;
5. foreign Tenant and PLATFORM_GLOBAL contexts cannot read the message;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. raw role/content/source/model-route/deleted evidence does not become history/decryption/source-auth/routing/retention/inference authority, and the read port exposes no mutation/list/decrypt/resolve/route/retain/execute methods.

Acceptance IDs: `AIMSG-PG-001` through `AIMSG-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-126 traceability or state promotion.
