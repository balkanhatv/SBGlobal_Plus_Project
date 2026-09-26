# MetadataDefinition raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-AI-AGENT-APPROVAL-READ-001`  
**Baseline branch head:** `33a67d7d62e0693f3cdd9e58944c1c5005fc212d`  
**Scope:** next independent governed continuation after DD-132.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0001_core_bootstrap.sql`;
- `database/migrations/0009_database_roles.sql`;
- later Core scope/RLS hardening through migration 0031 where applicable;
- `Architecture/A-01_CORE_PLATFORM_ARCHITECTURE.md`;
- existing `PostgresDatabase` + `RequestScopedSql` application boundary;
- DD-132 promoted state.

## Candidate determination

The AI physical persistence inventory is already covered through DD-132. The next independently source-complete uncovered Core slice is one exact `core_config.metadata_definition` row.

Migration 0001 owns:

- `id uuid PRIMARY KEY`;
- `owner_scope` in `PLATFORM | TENANT | INDUSTRY`;
- nullable `tenant_id` / `industry_context_id` with exact ownership-shape check;
- raw `code` and `kind` text;
- positive `version`;
- lifecycle `status` in `DRAFT | REVIEW | PUBLISHED | ACTIVE | RETIRED`;
- raw `schema_json jsonb`;
- positive `schema_version`;
- raw `created_by` and nullable `approved_by` UUID evidence;
- nullable `effective_from` / `effective_to`;
- `created_at` / `updated_at`;
- scoped unique code/version and at most one ACTIVE row per scoped code.

The table is FORCE-RLS through `core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id)`. Tenant rows are same-Tenant visible, Industry rows require exact Industry Context, and PLATFORM rows require PLATFORM_GLOBAL context. There is no implicit Tenant fallback to a PLATFORM row.

A-01 owns Metadata as reusable metadata definitions, field/catalog descriptors and schema-independent configuration metadata. A-01 also requires metadata/config definitions to be versioned with explicit draft/publish/activate/rollback semantics. Reading a row does not itself implement those lifecycle transitions or select an effective/current definition.

Migration 0009 grants `sbg_app_rw` SELECT/INSERT/UPDATE/DELETE on `core_config` tables. DD-133 therefore must not mischaracterize the application database role as read-only. The new port itself may remain read-only and must not expose mutation.

## Authorized implementation boundary

DD-133 may implement only an exact-by-id immutable MetadataDefinition persistence reader through existing `PostgresDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- constrained `ownerScope`;
- optional `tenantId`;
- optional `industryContextId`;
- raw `code`;
- raw `kind`;
- positive `version`;
- constrained raw lifecycle `status`;
- normalized immutable `schema` JSON evidence;
- positive `schemaVersion`;
- raw `createdBy`;
- optional raw `approvedBy`;
- optional `effectiveFrom`;
- optional `effectiveTo`;
- `createdAt`;
- `updatedAt`.

Validation remains schema-aligned only:

- UUID validation for identifiers;
- exact owner-scope validation;
- exact ownership-shape validation;
- positive safe integers for version/schemaVersion;
- exact lifecycle status values;
- raw text remains raw, including schema-valid empty strings;
- JSON is normalized/frozen without executing or interpreting metadata semantics;
- timestamps must be valid persisted values;
- no effective-from/to ordering is invented unless the schema owns such a constraint.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- ACTIVE/current/latest MetadataDefinition selection;
- code/version fallback, inheritance or override precedence;
- publish/activate/retire/rollback mutation;
- JSON Schema validation or runtime data validation;
- dynamic-field compilation;
- FormDefinition or RuleDefinition binding;
- metadata merge/effective-definition resolution;
- cache invalidation, search indexing or projection compilation;
- permission/entitlement evaluation;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing `sbg_app_rw` DML authority remains schema-owned and is not surfaced through the DD-133 read port.

## Acceptance expectations

1. exact Industry MetadataDefinition returns complete immutable raw evidence;
2. sibling Industry definition is hidden while exact sibling context may read it;
3. Tenant definition is same-Tenant visible from Tenant Core and Tenant Industry contexts while raw empty text/JSON/effective evidence is preserved;
4. PLATFORM definition is not implicit Tenant fallback and requires trusted PLATFORM_GLOBAL context;
5. foreign-Tenant definition is hidden;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. raw ACTIVE/schema/effective evidence does not become selected/validated/effective authority, the port exposes no mutation/select/compile/validate method, and existing application-role DML privilege remains unchanged.

Acceptance IDs: `METADATADEF-PG-001` through `METADATADEF-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-133 traceability or state promotion.
