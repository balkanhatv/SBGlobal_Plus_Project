# AI PromptSet raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-TOOL-SET-READ-001`  
**Baseline branch head:** `7c99553cfe2c4de3381b505eb5d34b7cc94d53cb`  
**Scope:** next independent governed continuation after DD-111.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `database/migrations/0032_platform_definition_write_boundary.sql`;
- `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` and `RequestScopedSql`;
- DD-111 ToolSet reader evidence.

## Candidate determination

The next independently source-complete persistence slice is the parent `core_ai.ai_prompt_set` row.

Migration 0031 owns:

- `id uuid PRIMARY KEY`;
- `owner_scope` constrained by `core_config.owner_scope`;
- nullable `tenant_id` and `industry_context_id` with exact PLATFORM/TENANT/INDUSTRY ownership-shape checks;
- non-null raw `code` text;
- positive non-null `version`;
- non-null `status` constrained to `DRAFT | REVIEW | PUBLISHED | ACTIVE | RETIRED`;
- non-null `created_at` and `updated_at`;
- unique scoped code/version and at most one ACTIVE row per scoped code.

The table is FORCE-RLS through `core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id)`.

DD-09 §2A defines AIPromptSet/AIPromptSetMember with the same parent/member fields. It separately states that membership accepts only ACTIVE PromptTemplates at same/broader applicable scope, that `IndustryAIConfig.domain_prompt_set_id` references an ACTIVE set applicable to the exact Industry Context, and that only ACTIVE prompt versions execute. Those are selection/member/execution semantics and are not implied by reading a parent PromptSet row.

Migration 0031 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on PromptSet persistence for governed Tenant/Industry authoring. Migration 0032 protects PLATFORM definition writes behind `sbg_control_plane_rw`. DD-112 must preserve that distinction rather than relabel the role read-only.

## Authorized implementation boundary

DD-112 may implement only an exact-by-id immutable parent PromptSet reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- constrained raw `ownerScope`;
- optional `tenantId`;
- optional `industryContextId`;
- raw `code`;
- positive `version`;
- constrained raw `status`;
- `createdAt`;
- `updatedAt`.

Validation remains schema-aligned only:

- UUID identifiers;
- owner scope exactly PLATFORM/TENANT/INDUSTRY;
- exact ownership-shape validation;
- lifecycle status exactly DRAFT/REVIEW/PUBLISHED/ACTIVE/RETIRED;
- code stays raw text, including schema-valid empty string;
- version must be a positive safe integer;
- timestamps must be valid persisted values;
- no created/updated ordering is invented.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- ACTIVE/current/latest PromptSet selection;
- code/version fallback or inheritance;
- PromptSet member loading;
- member priority ordering, enabled filtering or effective-set calculation;
- PromptTemplate selection, approval, publication, override or rendering;
- `IndustryAIConfig.domain_prompt_set_id` resolution;
- Assistant prompt selection;
- AI request prompt composition/governance evaluation;
- provider/model/policy/routing selection;
- tool/agent execution;
- credentials, inference, RAG or media generation;
- PromptSet mutation through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing Tenant/Industry PromptSet DML authority remains schema-owned; PLATFORM writes remain protected by migration 0032.

## Acceptance expectations

1. exact Industry PromptSet returns complete immutable raw metadata;
2. sibling Industry PromptSet is hidden, while exact sibling context may read it;
3. Tenant PromptSet is same-Tenant visible from Tenant Core and Tenant Industry contexts, preserving schema-valid raw values;
4. PLATFORM PromptSet is not Tenant fallback and requires trusted PLATFORM_GLOBAL;
5. foreign-Tenant PromptSet is hidden;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. read port exposes no mutation/member/active-selection/render/execute methods; existing database DML privilege remains unchanged and PLATFORM writes remain blocked to the AI Gateway role.

Acceptance IDs: `AIPROMPTSET-PG-001` through `AIPROMPTSET-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-112 traceability or state promotion.
