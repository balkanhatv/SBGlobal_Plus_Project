# AI Tool Definition Catalog Metadata Reader prerequisite ownership audit

**Date:** 2026-09-22  
**Correction:** 2026-09-23 — reconciled migration `0029_scope_privilege_identity_hardening.sql`, which constrains AI tool-definition `scope_class` to the governed four-value catalog vocabulary.  
**Baseline checkpoint:** `DEV-AI-CAPABILITY-CATALOG-READ-001`  
**Baseline branch head:** `a5f26ca269fc202ccda9c23f8b3442ec57433393`  
**Scope:** next independent governed continuation after DD-109.

## Source reconciliation

The current AI tool catalog schema, dedicated AI Gateway database role, AI architecture, detailed AI design, AI relationship-integrity hardening, DD-109 capability-catalog reader, and current branch state were reconciled before implementation.

Relevant source owners:

- `database/migrations/0013_ai_agents_tools.sql`
- `database/migrations/0014_ai_gateway_role.sql`
- `database/migrations/0029_scope_privilege_identity_hardening.sql`
- `database/migrations/0031_document_workflow_ai_integrity.sql`
- `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md`
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`
- `Development/AI_CAPABILITY_CATALOG_METADATA_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`
- DD-109 AI Capability Catalog Metadata Reader implementation/verification evidence

## Candidate determination

The next independently source-complete persistence slice is the global `core_ai.ai_tool_definition` catalog row.

Migration 0013 and DD-09 own exactly these persisted tool-definition facts:

- `id uuid PRIMARY KEY`;
- unique non-null `tool_id` text;
- non-null `capability_code` text referencing `core_ai.ai_capability(code)`;
- non-null `operation_contract_id` text;
- non-null `scope_class` text constrained by migration 0029 to `PLATFORM_GLOBAL`, `TENANT_CORE`, `TENANT_INDUSTRY`, or `EXPLICIT_CROSS_CONTEXT`;
- non-null `required_permission` text;
- nullable `required_entitlement` text;
- positive non-null `input_schema_version`;
- positive non-null `output_schema_version`;
- non-null `side_effect_class` constrained by enum to `NONE`, `LOW`, `CONTROLLED`, or `HIGH`;
- nullable `approval_policy_id uuid`;
- non-null `idempotency_required boolean`;
- non-null `audit_class` text;
- non-null raw `status` text;
- positive non-null `version`;
- non-null `created_at` and `updated_at` timestamps.

Migration 0014 grants the dedicated `sbg_ai_gateway_rw` role `SELECT` on `core_ai.ai_tool_definition` and does not grant catalog `INSERT`, `UPDATE`, or `DELETE` authority. The table is a global catalog and is not a Tenant/Industry FORCE-RLS table.

Migration 0031 requires an `ACTIVE` tool definition for persisted ToolSet membership and validates TOOL AgentStep bindings against an enabled member in the AgentDefinition's allowed ToolSet. Those predicates constrain persisted relationships. They do not independently define request-time tool eligibility, current user permission, entitlement, approval satisfaction, argument validation, OperationContract execution, idempotency behavior, audit behavior, or agent runtime.

A-07 and DD-09 explicitly require tool execution to rebuild/verify current RequestContext and traverse schema validation, authorization, entitlement, approval, OperationContract execution and audit. A persisted tool-definition row therefore remains catalog evidence rather than standalone execution authority.

## Authorized implementation boundary

DD-110 may implement only a bounded exact-by-id AI Tool Definition catalog metadata reader through the existing dedicated AI database boundary.

Authorized returned evidence:

- `id`;
- `toolId`;
- `capabilityCode`;
- raw `operationContractId`;
- raw constrained `scopeClass`;
- raw `requiredPermission`;
- nullable raw `requiredEntitlement`;
- positive `inputSchemaVersion`;
- positive `outputSchemaVersion`;
- raw constrained `sideEffectClass`;
- nullable `approvalPolicyId`;
- raw `idempotencyRequired` boolean;
- raw `auditClass`;
- raw `status`;
- positive `version`;
- `createdAt` and `updatedAt` timestamps represented without policy interpretation.

Validation must remain schema-aligned only:

- UUID validation for `id` and nullable `approval_policy_id`;
- side-effect validation only against the exact database-owned enum values;
- scope-class validation only against the exact database-owned CHECK values;
- other text values remain text without inventing non-empty constraints absent from the schema;
- nullable `required_entitlement` preserves `NULL` versus text exactly;
- schema versions and `version` are positive safe integers;
- `idempotency_required` remains a boolean fact and does not execute idempotency;
- raw status remains raw text and is not interpreted as runtime eligibility;
- timestamps are accepted only as valid persisted Date/string values and returned as immutable ISO evidence.

No Tenant/Industry `RequestContext` is invented for this global catalog read.

## Explicitly unclaimed semantics

This slice does **not** authorize or implement:

- interpreting `status='ACTIVE'` as request-time tool eligibility or permission;
- capability eligibility or entitlement evaluation;
- validating `required_permission` against an acting principal;
- evaluating `required_entitlement`;
- resolving effective/current Tenant/Industry AI configuration or provisioning;
- selecting ToolSets, Assistants, Agents, providers, models, prompts, policies, or routes;
- enforcing `side_effect_class`, approval policy, or approval satisfaction;
- interpreting `scope_class` into a RequestContext/resource selector;
- resolving or executing `operation_contract_id`;
- input/output DTO validation or schema registry execution;
- performing idempotency despite the persisted `idempotency_required` flag;
- appending audit despite the persisted `audit_class` value;
- tool invocation, agent planning/steps, Workflow/Automation execution, or mutation semantics;
- credential resolution, provider SDK calls, inference, RAG, assistant, or agent execution;
- public/API route creation;
- schema, migration, verification SQL, role, grant, RLS, or product-policy changes.

## Acceptance expectations

The implementation must prove at minimum:

1. exact-by-id read returns the complete authorized persisted tool-definition metadata as an immutable result;
2. missing ID returns `null` and malformed UUID fails closed;
3. nullable and schema-valid empty/raw metadata evidence is preserved rather than strengthened;
4. raw `ACTIVE`, permission/entitlement, side-effect, approval, idempotency, audit, scope and OperationContract references do not become eligibility or execution authority;
5. the dedicated AI role remains SELECT-only for `core_ai.ai_tool_definition` and the bounded reader exposes no mutation or execute methods.

Acceptance IDs: `AITOOLDEF-PG-001` through `AITOOLDEF-PG-005`.

Exact implementation-head Core, PostgreSQL/RLS, Database Verify, and Web Boundary CI must pass before canonical DD/acceptance traceability or state promotion.
