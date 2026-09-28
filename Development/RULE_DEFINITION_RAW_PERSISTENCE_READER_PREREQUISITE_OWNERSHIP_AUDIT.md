# RuleDefinition raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-METADATA-DEFINITION-READ-001`  
**Baseline branch head:** `cb92b9d0f9e93423459c349a15fc414ef67604b2`  
**Scope:** next independent governed continuation after DD-133.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0001_core_bootstrap.sql`;
- `database/migrations/0009_database_roles.sql`;
- later Core scope/RLS hardening through migration 0032 where applicable;
- `Architecture/A-01_CORE_PLATFORM_ARCHITECTURE.md`;
- existing `PostgresDatabase` + `RequestScopedSql` application boundary;
- DD-133 promoted MetadataDefinition state.

## Candidate determination

The next independently source-complete uncovered Core slice is one exact `core_config.rule_definition` row.

Migration 0001 owns:

- `id uuid PRIMARY KEY`;
- `owner_scope` in `PLATFORM | TENANT | INDUSTRY`;
- nullable `tenant_id` / `industry_context_id` with exact ownership-shape check;
- raw `code`;
- positive `version`;
- lifecycle `status` in `DRAFT | REVIEW | PUBLISHED | ACTIVE | RETIRED`;
- positive `schema_version`;
- raw `input_schema_json`, `condition_ast_json`, and `decision_json`;
- raw integer `priority` with no range constraint;
- `safety_class` in `BUSINESS | CONFIGURATION | VALIDATION`;
- nullable raw `required_permission`;
- raw `created_by` and nullable `approved_by` UUID evidence;
- nullable `effective_from` / `effective_to`;
- `created_at` / `updated_at`;
- scoped unique code/version and at most one ACTIVE row per scoped code.

The table is FORCE-RLS through `core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id)`. Tenant rows are same-Tenant visible, Industry rows require exact Industry Context, and PLATFORM rows require PLATFORM_GLOBAL context. There is no implicit Tenant fallback to a PLATFORM row.

A-01 owns Rules/Policy as business/configuration rule definitions plus safe policy-evaluation bindings, while Authorization policy remains owned by Authorization. A-01 also explicitly prohibits arbitrary tenant-supplied executable code and requires governed declarative/safe expressions. Therefore reading a persisted RuleDefinition must not execute or interpret its condition/decision JSON.

Migration 0009 grants `sbg_app_rw` SELECT/INSERT/UPDATE/DELETE on `core_config` tables. DD-134 must not mischaracterize that database role as read-only. The new application port may remain read-only and must not expose mutation/evaluation.

## Authorized implementation boundary

DD-134 may implement only an exact-by-id immutable RuleDefinition persistence reader through existing `PostgresDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- constrained `ownerScope`;
- optional `tenantId`;
- optional `industryContextId`;
- raw `code`;
- positive `version`;
- constrained raw lifecycle `status`;
- positive `schemaVersion`;
- normalized immutable `inputSchema` JSON;
- normalized immutable `conditionAst` JSON;
- normalized immutable `decision` JSON;
- raw safe-integer `priority`;
- constrained `safetyClass`;
- optional raw `requiredPermission`;
- raw `createdBy`;
- optional raw `approvedBy`;
- optional `effectiveFrom`;
- optional `effectiveTo`;
- `createdAt`;
- `updatedAt`.

Validation remains schema-aligned only:

- UUID validation for identifiers;
- exact owner-scope and ownership-shape validation;
- positive safe integers for version/schemaVersion;
- priority is any safe integer because the database declares no range constraint;
- exact lifecycle and safety-class values;
- raw text remains raw, including schema-valid empty strings;
- JSON is normalized/frozen without executing rule semantics;
- timestamps must be valid persisted values;
- no effective-window or created/updated ordering is invented.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- ACTIVE/current/latest RuleDefinition selection;
- code/version fallback, inheritance or override precedence;
- publish/activate/retire/rollback mutation;
- JSON Schema validation of inputs;
- condition-AST parsing/evaluation;
- decision JSON interpretation/application;
- rule priority ordering or conflict resolution;
- safety-class runtime enforcement;
- required-permission evaluation;
- business/configuration/validation rule execution;
- authorization-policy evaluation or PDP behavior;
- FormDefinition binding or validation-chain composition;
- cache/search/projection compilation;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing `sbg_app_rw` DML authority remains schema-owned and is not surfaced through the DD-134 read port.

## Acceptance expectations

1. exact Industry RuleDefinition returns complete immutable raw evidence;
2. sibling Industry definition is hidden while exact sibling context may read it;
3. Tenant definition is same-Tenant visible from Tenant Core and Tenant Industry contexts while raw empty/negative-priority/JSON/effective evidence is preserved;
4. PLATFORM definition is not implicit Tenant fallback and requires trusted PLATFORM_GLOBAL context;
5. foreign-Tenant definition is hidden;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. ACTIVE/priority/safety/permission/condition/decision evidence does not become selected/evaluated/authorized/applied authority, the port exposes no mutation/select/evaluate/apply method, and existing application-role DML privilege remains unchanged.

Acceptance IDs: `RULEDEF-PG-001` through `RULEDEF-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-134 traceability or state promotion.
