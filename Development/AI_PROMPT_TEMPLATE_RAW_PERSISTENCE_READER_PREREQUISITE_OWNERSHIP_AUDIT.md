# AI PromptTemplate raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-PROMPT-SET-MEMBER-READ-001`  
**Baseline branch head:** `eda0ffe2b8d16f901a6ef98bb35a3be799fd9242`  
**Scope:** next independent governed continuation after DD-114.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0011_ai_catalog_config.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `database/migrations/0032_platform_definition_write_boundary.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-112 PromptSet and DD-114 PromptSetMember read evidence.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.prompt_template` row.

Migration 0011 owns:

- `id uuid PRIMARY KEY`;
- `owner_scope` constrained by `core_config.owner_scope`;
- optional `tenant_id` and `industry_context_id` with exact PLATFORM/TENANT/INDUSTRY ownership shape;
- raw non-null `code`;
- positive `version`;
- raw non-null `system_template`;
- non-null `variable_schema_json jsonb`;
- non-null `grounding_required boolean`;
- non-null `allowed_override_fields text[]`;
- lifecycle `status` enum `DRAFT | REVIEW | PUBLISHED | ACTIVE | RETIRED`;
- non-null `created_by` and optional `approved_by` principal references;
- `created_at` and `updated_at`;
- unique scoped code/version and at most one ACTIVE row per scoped code.

PromptTemplate is FORCE-RLS and later migration 0031 preserves SELECT visibility through `core_config.row_visible_to_current_context(...)` while writes use `core_ai.definition_write_allowed(...)`.

Migration 0014 grants `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on PromptTemplate persistence. Migration 0032 independently protects PLATFORM definition writes behind `sbg_control_plane_rw`. DD-115 therefore must not describe the database role as read-only; only the new read port is read-only.

Migration 0031 validates at PromptTemplate insert/update that creator and optional approver are active for the definition scope at the persisted event timestamps. A raw reader does not re-evaluate that history as current approval or runtime authorization.

DD-09 defines PromptTemplate content/schema/grounding/override fields and the publication lifecycle. It states only ACTIVE versions execute and governed prompts may require approval. Those publication-selection, override, rendering, variable validation and execution semantics are separate from reading one persisted row.

## Authorized implementation boundary

DD-115 may implement only an exact-by-id immutable PromptTemplate persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- constrained raw `ownerScope`;
- optional `tenantId`;
- optional `industryContextId`;
- raw `code`;
- positive `version`;
- raw `systemTemplate`;
- normalized immutable `variableSchema` JSON;
- raw `groundingRequired`;
- immutable ordered `allowedOverrideFields` string array exactly as persisted;
- constrained raw `status`;
- `createdBy`;
- optional `approvedBy`;
- `createdAt`;
- `updatedAt`.

Validation remains schema-aligned only:

- UUID validation for identifiers;
- exact owner-scope and ownership-shape validation;
- positive safe integer version;
- raw text stays text without invented non-empty requirements;
- JSON is normalized/frozen but not interpreted as an executable schema;
- override-field order, duplicates and empty strings are preserved because the database imposes no set/uniqueness/non-empty constraint;
- strict boolean grounding flag;
- exact lifecycle enum validation;
- timestamps must be valid persisted values;
- no approval/lifecycle/current/executable meaning is inferred.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- ACTIVE/current/latest PromptTemplate selection;
- publication or rollback behavior;
- approval satisfaction or high-risk approval policy;
- PromptTemplate rendering;
- variable-schema validation/execution;
- allowed-override authorization or precedence;
- grounding-source enforcement;
- PromptSet effective-member resolution;
- `IndustryAIConfig.domain_prompt_set_id` resolution;
- Assistant prompt selection;
- runtime prompt composition or prompt-policy precedence;
- provider/model/routing selection;
- credentials, inference, RAG, media generation or agent/tool execution;
- mutation APIs through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

## Acceptance expectations

1. exact Industry PromptTemplate returns complete immutable raw metadata;
2. sibling Industry row is hidden while exact sibling context may read it;
3. Tenant PromptTemplate is same-Tenant visible from Tenant Core and Tenant Industry contexts and preserves schema-valid empty/duplicate raw values;
4. PLATFORM PromptTemplate is not Tenant fallback and requires trusted PLATFORM_GLOBAL;
5. foreign-Tenant PromptTemplate is hidden;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. raw status/approval/schema/override/grounding evidence does not become selected/approved/renderable/executable authority; the port exposes no mutation/select/render/validate/execute methods and PLATFORM mutation remains protected.

Acceptance IDs: `AIPROMPTTPL-PG-001` through `AIPROMPTTPL-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-115 traceability or state promotion.
