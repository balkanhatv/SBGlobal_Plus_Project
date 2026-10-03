# AI PromptSetMember raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-TOOL-SET-MEMBER-READ-001`  
**Baseline branch head:** `81336dcfec4b3f51aeae9b1d2385afae706288c1`  
**Scope:** next independent governed continuation after DD-113.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0011_ai_catalog_config.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `database/migrations/0032_platform_definition_write_boundary.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-112 PromptSet parent-reader and DD-113 ToolSetMember child-reader evidence.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.ai_prompt_set_member` row.

Migration 0031 physically owns:

- `id uuid PRIMARY KEY`;
- `prompt_set_id uuid NOT NULL` referencing `core_ai.ai_prompt_set(id)`;
- `prompt_template_id uuid NOT NULL` referencing `core_ai.prompt_template(id)`;
- `priority integer NOT NULL DEFAULT 100`;
- `enabled boolean NOT NULL DEFAULT true`;
- `created_at timestamptz NOT NULL`;
- uniqueness of `(prompt_set_id,prompt_template_id)`.

The child table is FORCE-RLS. SELECT visibility is parent-derived: a member is visible only when its parent PromptSet is visible in the current PLATFORM/TENANT/INDUSTRY context.

Migration 0011 owns PromptTemplate scope, version, template/schema fields and status enum `DRAFT | REVIEW | PUBLISHED | ACTIVE | RETIRED`.

Migration 0031 write-integrity requires, at member insert/update time:

- the parent PromptSet to be ACTIVE;
- the referenced PromptTemplate to be ACTIVE;
- the referenced PromptTemplate scope to be the same as or broader than the parent PromptSet scope.

This persisted child row does not itself prove that either referenced definition remains ACTIVE later, that the PromptSet is current, that this member is enabled in an effective resolved set, or that the PromptTemplate may execute for a request.

Migration 0031 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on PromptSet-member persistence and narrows writes through `definition_member_write_allowed('PROMPT_SET', ...)`. Migration 0032 additionally blocks child mutation under PLATFORM parents unless current_user is `sbg_control_plane_rw`.

DD-09 separately states that PromptSet membership accepts ACTIVE same/broader PromptTemplates, `IndustryAIConfig.domain_prompt_set_id` references an ACTIVE applicable set, and only ACTIVE prompt versions execute. Those selection/resolution/rendering/execution semantics are outside a raw member reader.

## Authorized implementation boundary

DD-114 may implement only an exact-by-id immutable PromptSetMember persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `promptSetId`;
- `promptTemplateId`;
- raw integer `priority`;
- raw `enabled`;
- `createdAt`.

Validation remains schema-aligned only:

- UUID validation for identifiers;
- `priority` must be a safe integer, with no invented positive/min/max constraint because the database declares only integer NOT NULL;
- strict boolean validation for `enabled`;
- timestamp must be a valid persisted value;
- no ACTIVE/current/effective/renderable/executable meaning is inferred.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- listing all PromptSet members;
- sorting/selecting members by priority;
- filtering an effective set by `enabled`;
- ACTIVE/current/latest PromptSet selection;
- revalidating current PromptSet/PromptTemplate activity for execution;
- PromptTemplate loading, rendering, variable-schema evaluation, override evaluation or grounding behavior;
- `IndustryAIConfig.domain_prompt_set_id` resolution;
- Assistant prompt selection;
- runtime prompt composition or prompt-policy precedence;
- provider/model/policy/routing selection;
- tool/agent execution;
- credentials, inference, RAG or media generation;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing database DML authority remains schema-owned and separately governed; the DD-114 port is read-only.

## Acceptance expectations

1. exact visible member returns complete immutable raw evidence;
2. sibling-Industry parent hides its member while exact sibling context can read it;
3. Tenant-parent member is same-Tenant visible from Tenant Core and Tenant Industry contexts, preserving raw priority/enabled values;
4. PLATFORM-parent member is not Tenant fallback and requires trusted PLATFORM_GLOBAL;
5. foreign-Tenant parent hides its member;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. raw priority/enabled evidence does not become effective/renderable/executable authority, the port exposes no mutation/list/effective/render/execute method, and PLATFORM-parent mutation remains protected.

Acceptance IDs: `AIPROMPTMEM-PG-001` through `AIPROMPTMEM-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-114 traceability or state promotion.
