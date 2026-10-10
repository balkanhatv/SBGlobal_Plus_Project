# FormFieldDefinition raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-FORM-DEFINITION-READ-001`  
**Baseline branch head:** `e4970713ddfdb64088b4bbbe42ed6bba93e35eea`  
**Scope:** next independent governed continuation after DD-135.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0001_core_bootstrap.sql`;
- `database/migrations/0002_form_field_parent_rls.sql`;
- `database/migrations/0007_database_governance.sql`;
- `database/migrations/0009_database_roles.sql`;
- migrations 0029–0031 for absence of a later FormFieldDefinition lifecycle/effective/runtime rule;
- migration 0032 PLATFORM-parent child write floor;
- `Architecture/A-01_CORE_PLATFORM_ARCHITECTURE.md`;
- DD-030 shared-definition/form safety boundary;
- existing `PostgresDatabase` + `RequestScopedSql` application boundary;
- DD-135 promoted FormDefinition state.

## Candidate determination

The next independently source-complete uncovered Core slice is one exact `core_config.form_field_definition` row.

Migration 0001 owns:

- `id uuid PRIMARY KEY`;
- `form_definition_id uuid NOT NULL` referencing `core_config.form_definition(id)` with `ON DELETE RESTRICT`;
- raw `field_key text NOT NULL`;
- `field_type` constrained to `TEXT | NUMBER | DECIMAL | DATE | DATETIME | BOOLEAN | SELECT | MULTISELECT | REFERENCE | FILE | JSON_STRUCTURED`;
- raw `label_key text NOT NULL`;
- `required boolean NOT NULL DEFAULT false`;
- `read_only boolean NOT NULL DEFAULT false`;
- nullable raw `visibility_rule_ref text`;
- raw `validation_schema_json jsonb NOT NULL DEFAULT '{}'`;
- nullable raw `reference_catalog_ref text`;
- unconstrained signed `sort_order integer NOT NULL DEFAULT 0`;
- raw `sensitivity_class text NOT NULL`;
- `created_at timestamptz NOT NULL`;
- uniqueness of `(form_definition_id, field_key)`.

Migration 0002 applies FORCE-RLS to the child through an `EXISTS` lookup of its parent FormDefinition and `core_config.row_visible_to_current_context(parent.owner_scope,parent.tenant_id,parent.industry_context_id)`. The policy does not require the parent to be ACTIVE/current/effective. Therefore child visibility is scope-derived evidence only: Tenant-parent fields are same-Tenant visible, Industry-parent fields require exact Industry Context, and PLATFORM-parent fields require PLATFORM_GLOBAL context.

Migration 0032 adds restrictive INSERT/UPDATE/DELETE floors so a child under a PLATFORM FormDefinition cannot be mutated except by `sbg_control_plane_rw`. Migration 0009 still gives `sbg_app_rw` table-level DML on existing `core_config` tables. DD-136 must preserve that distinction: database privileges/write floors remain schema-owned while the new application port is exact-read only.

A-01 owns Form/Dynamic Fields as reusable form/field definitions plus validation composition and lifecycle. DD-030 keeps shared definition behavior declarative and governed. Reading one child row therefore does not expand the parent form, evaluate visibility/validation rules, resolve catalogs, enforce sensitivity, sort a field set, render UI or submit data.

## Authorized implementation boundary

DD-136 may implement only an exact-by-id immutable FormFieldDefinition persistence reader through existing `PostgresDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `formDefinitionId`;
- raw `fieldKey`;
- constrained raw `fieldType`;
- raw `labelKey`;
- raw persisted `required` boolean;
- raw persisted `readOnly` boolean;
- optional raw `visibilityRuleRef`;
- normalized immutable `validationSchema` JSON;
- optional raw `referenceCatalogRef`;
- signed safe-integer `sortOrder`;
- raw `sensitivityClass`;
- `createdAt`.

Validation remains schema-aligned only:

- UUID validation for child and parent identifiers;
- exact physical field-type enum validation;
- exact boolean validation;
- raw text remains raw, including schema-valid empty strings;
- nullable raw references remain nullable and empty strings are not upgraded to absence;
- `validation_schema_json` is normalized/frozen without executing JSON Schema or validation semantics;
- `sort_order` accepts any PostgreSQL integer representable as a JavaScript safe integer, including negative values;
- `created_at` must be a valid persisted timestamp;
- no sibling ordering, uniqueness beyond the database key, parent lifecycle check, field usability or effective/current rule is invented.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- FormDefinition current/effective/ACTIVE selection;
- FormFieldDefinition list expansion or sibling ordering;
- field required/read-only enforcement;
- field-type parsing/coercion/rendering;
- label/localization resolution;
- visibility-rule lookup, RuleDefinition selection/evaluation or conditional visibility;
- validation-schema execution or validation-chain composition;
- reference-catalog lookup or referential business validation;
- sensitivity classification policy, masking/redaction or access decisions;
- layout composition/rendering;
- submit OperationContract binding/invocation;
- permission/entitlement evaluation;
- form/field mutation;
- cache/search/projection compilation;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing database DML authority and migration 0032 PLATFORM-parent child write floor remain schema-owned and are not surfaced through the DD-136 read port.

## Acceptance expectations

1. exact Industry-parent FormFieldDefinition returns complete immutable raw child evidence;
2. sibling Industry parent scope hides the child while exact sibling Industry Context may read it;
3. Tenant-parent child is same-Tenant visible from Tenant Core and Tenant Industry contexts while schema-valid empty text, negative sort order, nullable references and raw JSON are preserved even when parent lifecycle evidence is non-ACTIVE;
4. PLATFORM-parent child is not Tenant fallback and requires trusted PLATFORM_GLOBAL context;
5. foreign-Tenant parent child is hidden;
6. missing well-formed id returns null; malformed id and route/context mismatch fail closed;
7. raw required/read-only/type/visibility/validation/reference/sensitivity/sort evidence does not become field enforcement/render/validation/catalog/access/submit authority, the port exposes no mutation/list/sort/render/validate/evaluate/submit method, and existing database privileges plus PLATFORM-parent write floor remain unchanged.

Acceptance IDs: `FORMFIELD-PG-001` through `FORMFIELD-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-136 traceability or state promotion.
