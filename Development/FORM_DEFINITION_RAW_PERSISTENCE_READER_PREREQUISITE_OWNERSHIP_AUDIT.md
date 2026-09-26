# FormDefinition raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-RULE-DEFINITION-READ-001`  
**Baseline branch head:** `b6a76156dd3049de1214aa46f92d5b44ddb357e7`  
**Scope:** next independent governed continuation after DD-134.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0001_core_bootstrap.sql`;
- `database/migrations/0002_form_field_parent_rls.sql`;
- `database/migrations/0009_database_roles.sql`;
- migration 0029 immutable Tenant/Industry scope ownership hardening;
- migrations 0030/0031 for absence of later FormDefinition-specific integrity;
- migration 0032 PLATFORM-definition and parent-child write floors;
- `Architecture/A-01_CORE_PLATFORM_ARCHITECTURE.md`;
- DD-030 shared-definition lifecycle/safe-expression boundary;
- existing `PostgresDatabase` + `RequestScopedSql` application boundary;
- DD-134 promoted RuleDefinition state.

## Candidate determination

The next independently source-complete uncovered Core slice is one exact `core_config.form_definition` row.

Migration 0001 owns:

- `id uuid PRIMARY KEY`;
- `owner_scope` in `PLATFORM | TENANT | INDUSTRY`;
- nullable `tenant_id` / `industry_context_id` with exact ownership-shape check;
- raw `code`;
- positive `version`;
- lifecycle `status` in `DRAFT | REVIEW | PUBLISHED | ACTIVE | RETIRED`;
- positive `schema_version`;
- raw `purpose_code`;
- nullable raw `submit_operation_id`;
- raw `layout_schema_json`;
- raw non-null `validation_rule_refs text[]`;
- nullable raw `localization_key_prefix`;
- raw non-null `allowed_surface_classes text[]`;
- raw `created_by` and nullable `approved_by` UUID evidence;
- nullable `effective_from` / `effective_to`;
- `created_at` / `updated_at`;
- scoped unique code/version and at most one ACTIVE row per scoped code.

The table is FORCE-RLS through `core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id)`. Tenant rows are same-Tenant visible, Industry rows require exact Industry Context, and PLATFORM rows require PLATFORM_GLOBAL context. There is no implicit Tenant fallback to a PLATFORM row.

Migration 0002 adds parent-derived FORCE-RLS only to `form_field_definition`; it does not widen the parent FormDefinition read or authorize field expansion through DD-135. Migration 0029 makes Tenant/Industry ownership columns immutable on updates. Migration 0032 restricts PLATFORM definition writes to `sbg_control_plane_rw` and separately protects child writes under PLATFORM parents. Those write boundaries remain authoritative and are not exposed by a read port.

A-01 owns Form/Dynamic Fields as form definitions, reusable field definitions, validation composition and publish/version lifecycle. DD-030 requires shared definitions to follow governed lifecycle semantics. Therefore reading one persisted FormDefinition must not list fields, resolve validation rules, validate layouts, select an active version, or invoke its submit operation.

Migration 0009 grants `sbg_app_rw` SELECT/INSERT/UPDATE/DELETE on existing `core_config` tables. DD-135 must not mischaracterize that database role as read-only. The new application port may remain read-only and must not expose mutation/compile/submit behavior.

## Authorized implementation boundary

DD-135 may implement only an exact-by-id immutable FormDefinition persistence reader through existing `PostgresDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- constrained `ownerScope`;
- optional `tenantId`;
- optional `industryContextId`;
- raw `code`;
- positive `version`;
- constrained raw lifecycle `status`;
- positive `schemaVersion`;
- raw `purposeCode`;
- optional raw `submitOperationId`;
- normalized immutable `layoutSchema` JSON;
- immutable raw `validationRuleRefs` array;
- optional raw `localizationKeyPrefix`;
- immutable raw `allowedSurfaceClasses` array;
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
- exact lifecycle values;
- raw text remains raw, including schema-valid empty strings;
- `layout_schema_json` is normalized/frozen without interpreting UI/layout semantics;
- PostgreSQL text arrays are copied/frozen as persisted string-or-null element evidence because the schema has no element-null, duplicate, vocabulary or ordering constraint;
- timestamps must be valid persisted values;
- no effective-window or created/updated ordering is invented.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- ACTIVE/current/latest FormDefinition selection;
- code/version fallback, inheritance or override precedence;
- publish/activate/retire/rollback mutation;
- `form_field_definition` listing/resolution;
- field-type, required/read-only, visibility, reference-catalog or sensitivity interpretation;
- layout-schema validation/rendering/compilation;
- validation-rule resolution, RuleDefinition selection/evaluation or validation-chain execution;
- submit-operation lookup, OperationContract binding or invocation;
- allowed-surface eligibility/current-surface enforcement;
- localization-key resolution;
- metadata/dynamic-field compilation;
- permission/entitlement evaluation;
- cache/search/projection compilation;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing database DML authority and migration 0029/0032 write floors remain schema-owned and are not surfaced through the DD-135 read port.

## Acceptance expectations

1. exact Industry FormDefinition returns complete immutable raw parent evidence;
2. sibling Industry definition is hidden while exact sibling context may read it;
3. Tenant definition is same-Tenant visible from Tenant Core and Tenant Industry contexts while raw empty strings, array duplicates/null elements, JSON and unordered effective timestamps are preserved;
4. PLATFORM definition is not implicit Tenant fallback and requires trusted PLATFORM_GLOBAL context;
5. foreign-Tenant definition is hidden;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. ACTIVE/layout/rule-ref/surface/submit evidence does not become selected/rendered/validated/submitted authority, the port exposes no mutation/select/list-fields/compile/render/validate/submit method, and existing database privileges/write floors remain unchanged.

Acceptance IDs: `FORMDEF-PG-001` through `FORMDEF-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-135 traceability or state promotion.
