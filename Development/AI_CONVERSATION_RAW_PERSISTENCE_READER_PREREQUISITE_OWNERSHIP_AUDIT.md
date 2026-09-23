# AI Conversation raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-INDUSTRY-CONFIG-READ-001`  
**Baseline branch head:** `39fa19a9171f247fad58551b9cbfa524ac0be715`  
**Scope:** next independent governed continuation after DD-120.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0012_ai_rag_memory_usage.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-117 AssistantDefinition raw-reader evidence.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.ai_conversation` row.

Migration 0012 owns:

- `id uuid PRIMARY KEY`;
- `tenant_id uuid NOT NULL`;
- nullable `industry_context_id uuid`;
- `scope_class` constrained to `TENANT_CORE | TENANT_INDUSTRY`;
- `owner_principal_id uuid NOT NULL`;
- nullable `assistant_definition_id uuid`;
- `sensitivity_class` constrained to `PUBLIC | INTERNAL | CONFIDENTIAL | SENSITIVE_PERSONAL | REGULATED`;
- raw `retention_class text NOT NULL`;
- raw `status text NOT NULL`;
- `created_at timestamptz NOT NULL`;
- `last_activity_at timestamptz NOT NULL`;
- exact scope-shape check: TENANT_CORE requires null Industry Context; TENANT_INDUSTRY requires non-null Industry Context.

No database constraint orders `last_activity_at` relative to `created_at`.

The table is FORCE-RLS and requires all of:

- same current Tenant;
- exact current owner principal;
- either Tenant-Core row (`industry_context_id IS NULL`) or exact current Industry Context.

Therefore a Tenant-Core conversation remains visible to its owner from the same Tenant's Tenant-Core or Tenant-Industry request contexts, while an Industry conversation is exact-Industry only. Sibling Industry, foreign Tenant and same-Tenant different-principal contexts do not gain visibility.

Migration 0014 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on conversation persistence. DD-121 must preserve that database authority distinction; the new application port itself is read-only.

Migration 0031 validates at insert/update time that the owner principal is active for the Tenant at `created_at`. If `assistant_definition_id` is present, the referenced AssistantDefinition must then be ACTIVE and applicable to the conversation scope. Those are write-time integrity facts only; a raw persisted conversation read does not reselect/revalidate a current Assistant or execute an AI request.

DD-09 states that conversation storage follows Tenant/Industry/principal ownership, retention/sensitivity and erasure, and that cross-Industry history is not automatically carried. This raw reader does not perform history aggregation, retention enforcement or message loading.

## Authorized implementation boundary

DD-121 may implement only an exact-by-id immutable AIConversation persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `tenantId`;
- optional `industryContextId`;
- constrained raw `scopeClass`;
- `ownerPrincipalId`;
- optional `assistantDefinitionId`;
- constrained raw `sensitivityClass`;
- raw `retentionClass`;
- raw `status`;
- `createdAt`;
- `lastActivityAt`.

Validation remains schema-aligned only:

- UUID validation for identifiers;
- scope class only `TENANT_CORE | TENANT_INDUSTRY`;
- exact scope/Industry shape validation;
- sensitivity only exact database-owned vocabulary;
- retention/status remain raw text, including schema-valid empty text;
- valid timestamps only;
- no timestamp ordering is invented.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- conversation listing/search/history aggregation;
- cross-Industry history carry-over;
- AIMessage loading or content access;
- retention/erasure execution;
- sensitivity-policy evaluation;
- current AssistantDefinition selection/revalidation;
- prompt/PromptSet resolution or rendering;
- effective Tenant/Industry AI configuration or provisioning;
- provider/model routing/fallback;
- entitlement/permission/budget/residency evaluation;
- tool/agent execution;
- credentials, provider SDK calls, inference, embeddings or RAG;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing conversation DML authority remains schema-owned and separately governed; DD-121 exposes read only.

## Acceptance expectations

1. exact owner + exact Industry context returns complete immutable raw conversation evidence;
2. sibling Industry context cannot read an Industry conversation;
3. Tenant-Core conversation is visible to the same owner from Tenant-Core and same-Tenant Industry contexts without performing history merge;
4. same-Tenant different principal cannot read another principal's conversation;
5. foreign-Tenant and PLATFORM_GLOBAL contexts cannot bypass conversation RLS;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed; schema-valid empty raw text/timestamp ordering is preserved;
7. database DML privilege remains schema-owned while the port exposes no mutation/list/messages/history/assistant-select/retention/execute method.

Acceptance IDs: `AICONV-PG-001` through `AICONV-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-121 traceability or state promotion.
