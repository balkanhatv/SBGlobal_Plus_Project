# AI Policy raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-PROMPT-TEMPLATE-READ-001`  
**Baseline branch head:** `d70a705ce655c9a4c1e28d6ed3104f07988a6516`  
**Scope:** next independent governed continuation after DD-115.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0011_ai_catalog_config.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `database/migrations/0032_platform_definition_write_boundary.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-115 PromptTemplate reader evidence.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.ai_policy` row.

Migration 0011 owns:

- `id uuid PRIMARY KEY`;
- `owner_scope` constrained by `core_config.owner_scope`;
- optional `tenant_id` and `industry_context_id` with exact PLATFORM/TENANT/INDUSTRY ownership shape;
- raw non-null `code`;
- raw integer `priority` with default 100 and no range constraint;
- `effect` enum exactly `ALLOW | DENY | RESTRICT`;
- non-null `condition_ast_json jsonb`;
- non-null `constraint_json jsonb`;
- positive `version`;
- raw non-null `status text` with no database enum/check constraint;
- `created_at` and `updated_at`;
- unique scoped code/version.

AI Policy is FORCE-RLS. Migration 0031 preserves reads through `core_config.row_visible_to_current_context(...)` and moves writes behind `core_ai.definition_write_allowed(...)`.

Migration 0014 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on AI Policy persistence. Migration 0032 separately protects PLATFORM definition writes behind `sbg_control_plane_rw`. DD-116 must not relabel that existing database role as read-only; only the new read port is read-only.

DD-09 defines the persisted AIPolicy fields but does not make a raw policy row an evaluated runtime decision. Reading `effect='ALLOW'`, `DENY`, or `RESTRICT` plus condition/constraint JSON is evidence only unless a separately source-owned policy evaluator determines applicability and semantics.

## Authorized implementation boundary

DD-116 may implement only an exact-by-id immutable AI Policy persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- constrained raw `ownerScope`;
- optional `tenantId`;
- optional `industryContextId`;
- raw `code`;
- raw safe-integer `priority`;
- constrained raw `effect`;
- normalized immutable `conditionAst` JSON;
- normalized immutable `constraint` JSON;
- positive `version`;
- raw `status`;
- `createdAt`;
- `updatedAt`.

Validation remains schema-aligned only:

- UUID validation for identifiers;
- exact owner-scope and ownership-shape validation;
- priority must be a safe integer only; no positive/min/max rule is invented;
- effect validation only against ALLOW/DENY/RESTRICT;
- JSON values are normalized/frozen but never interpreted or executed;
- version must be a positive safe integer;
- code/status remain raw text, including schema-valid empty values;
- timestamps must be valid persisted values;
- no current/applicable/evaluated decision semantics are inferred.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- policy discovery/listing or priority ordering;
- policy applicability evaluation;
- condition-AST parsing/evaluation;
- constraint interpretation;
- ALLOW/DENY/RESTRICT precedence or deny-wins behavior;
- effective Tenant/Industry policy inheritance;
- policy publication/current/latest selection;
- AI capability eligibility or entitlement evaluation;
- provider/model/prompt/tool/agent routing or selection;
- prompt override or grounding enforcement;
- credentials, inference, RAG, media generation or tool/agent execution;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

## Acceptance expectations

1. exact Industry AI Policy returns complete immutable raw evidence;
2. sibling Industry policy is hidden while exact sibling context may read it;
3. Tenant policy is same-Tenant visible from Tenant Core and Tenant Industry contexts and preserves schema-valid negative priority/empty text/raw JSON;
4. PLATFORM policy is not Tenant fallback and requires trusted PLATFORM_GLOBAL;
5. foreign-Tenant policy is hidden;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. raw effect/priority/condition/constraint/status evidence does not become an evaluated decision; the port exposes no mutation/list/sort/evaluate/execute method and PLATFORM mutation remains protected.

Acceptance IDs: `AIPOLICY-PG-001` through `AIPOLICY-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-116 traceability or state promotion.
