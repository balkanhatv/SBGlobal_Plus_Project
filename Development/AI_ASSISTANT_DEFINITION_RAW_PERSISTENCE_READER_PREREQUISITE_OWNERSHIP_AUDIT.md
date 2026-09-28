# AI AssistantDefinition raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-POLICY-READ-001`  
**Baseline branch head:** `a59e27cf70d10adf15b76cc5475344fc3cb6b89f`  
**Scope:** next independent governed continuation after DD-116.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0012_ai_rag_memory_usage.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `database/migrations/0032_platform_definition_write_boundary.sql`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- existing `PostgresAIGatewayDatabase` + `RequestScopedSql`;
- DD-109/110/111/115/116 catalog/ToolSet/PromptTemplate/Policy reader evidence.

## Candidate determination

The next independently source-complete persistence slice is one exact `core_ai.assistant_definition` row.

Migration 0012 physically owns:

- `id uuid PRIMARY KEY`;
- `owner_scope` constrained by `core_config.owner_scope`;
- nullable `tenant_id` and `industry_context_id` with exact PLATFORM/TENANT/INDUSTRY ownership shape;
- non-null raw `code` text;
- `allowed_capabilities text[] NOT NULL DEFAULT '{}'`;
- `rag_scope_rules jsonb NOT NULL DEFAULT '{}'`;
- non-null `prompt_template_id`;
- nullable `tool_set_id`;
- nullable `model_policy_id`;
- non-null `retention_policy_id`;
- positive non-null `version`;
- non-null raw `status` text;
- non-null `created_at` / `updated_at`;
- unique scoped code/version.

Migration 0031 adds the ToolSet foreign key and one-ACTIVE-version-per-scoped-code index.

At AssistantDefinition insert/update time, migration 0031 additionally requires:

- `allowed_capabilities` to be a duplicate-free, null-free text set;
- every referenced capability code to exist and be ACTIVE;
- `prompt_template_id` to reference an ACTIVE PromptTemplate at the same or broader applicable scope;
- nullable `tool_set_id`, when present, to reference an ACTIVE ToolSet at the same or broader applicable scope.

Those are write-time integrity facts. A persisted AssistantDefinition row does not itself prove that referenced capability, PromptTemplate or ToolSet rows remain ACTIVE later, that the AssistantDefinition is currently selected, or that a request is authorized to execute it.

`model_policy_id` and `retention_policy_id` are persisted UUID references in the physical row but migration 0012/0031 does not define runtime resolution semantics for them in this reader slice. DD-117 must preserve them only as raw identifiers.

Migration 0014 gives `sbg_ai_gateway_rw` SELECT/INSERT/UPDATE/DELETE on AssistantDefinition persistence for governed Tenant/Industry authoring. Migration 0032 protects PLATFORM definition mutation behind `sbg_control_plane_rw`.

DD-09 defines AssistantDefinition fields but keeps routing, prompt execution, RAG/tool permissions, entitlement, approval and current RequestContext enforcement in separate runtime behavior.

## Authorized implementation boundary

DD-117 may implement only an exact-by-id immutable AssistantDefinition persistence reader through `PostgresAIGatewayDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- constrained raw `ownerScope`;
- optional `tenantId`;
- optional `industryContextId`;
- raw `code`;
- immutable `allowedCapabilities` string set evidence;
- immutable normalized JSON `ragScopeRules`;
- `promptTemplateId`;
- optional `toolSetId`;
- optional `modelPolicyId`;
- `retentionPolicyId`;
- positive `version`;
- raw `status`;
- `createdAt`;
- `updatedAt`.

Validation remains schema/integrity aligned only:

- UUID validation for persisted identifiers;
- owner scope exactly PLATFORM/TENANT/INDUSTRY with exact ownership-shape validation;
- allowed capabilities must be a duplicate-free/null-free array of strings, preserving order and raw string values;
- RAG scope rules remain normalized/frozen JSON without semantic interpretation;
- version is a positive safe integer;
- code/status remain raw text without invented non-empty/enumeration constraints;
- timestamps must be valid persisted values;
- no current activity/applicability/selectability meaning is inferred.

## Explicitly unclaimed semantics

DD-117 does **not** implement or authorize:

- ACTIVE/current/latest AssistantDefinition selection;
- code/version fallback or inheritance;
- revalidation of current capability, PromptTemplate or ToolSet activity/applicability;
- capability eligibility or entitlement evaluation;
- PromptTemplate loading/rendering or prompt composition;
- ToolSet member/effective-tool resolution;
- `rag_scope_rules` interpretation, RAG source selection or retrieval;
- `model_policy_id` or `retention_policy_id` resolution;
- provider/model/policy/routing selection;
- conversation creation or Assistant binding;
- RequestContext permission checks, approval, tool execution or agent execution;
- credentials, provider SDK calls, inference, embeddings or RAG execution;
- AssistantDefinition mutation through the new read port;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing Tenant/Industry AssistantDefinition DML remains schema-owned; PLATFORM writes remain protected by migration 0032.

## Acceptance expectations

1. exact Industry AssistantDefinition returns complete immutable raw evidence;
2. sibling Industry AssistantDefinition is hidden while exact sibling context may read it;
3. Tenant AssistantDefinition is same-Tenant visible from Tenant Core and Tenant Industry contexts, preserving schema-valid raw code/status and optional references;
4. PLATFORM AssistantDefinition is not Tenant fallback and requires trusted PLATFORM_GLOBAL;
5. foreign-Tenant AssistantDefinition is hidden;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. raw AssistantDefinition evidence does not become selection/eligibility/render/RAG/tool/execution authority, the port exposes no mutation/select/render/execute method, and PLATFORM mutation remains protected.

Acceptance IDs: `AIASSIST-PG-001` through `AIASSIST-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-117 traceability or state promotion.
