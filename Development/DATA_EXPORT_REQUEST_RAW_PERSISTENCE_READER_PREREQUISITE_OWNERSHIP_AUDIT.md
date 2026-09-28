# DataExportRequest raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-BRAND-CONFIGURATION-READ-001`  
**Baseline branch head:** `c1a8cd255b68daa1aa42923a266522300c1b0e97`  
**Scope:** next independent governed continuation after DD-139.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0001_core_bootstrap.sql`;
- `database/migrations/0007_database_governance.sql`;
- `database/migrations/0009_database_roles.sql`;
- migration 0029 immutable scope ownership / runtime privilege hardening;
- migration 0030 exact export scope, sensitivity vocabulary, requester/subject/document FKs and final FORCE-RLS policy;
- migration 0031 export relationship-integrity trigger;
- migrations 0032–0047 for absence of a later DataExportRequest lifecycle/read-visibility rule;
- `DetailedDesign/DD-05_DATA_MODEL_AND_DATABASE_DESIGN.md`;
- existing `PostgresDatabase` + `RequestScopedSql` application boundary;
- DD-139 promoted state.

## Candidate determination

The next independently source-complete uncovered Core persistence slice is one exact `core_config.data_export_request` row.

Migration 0001 owns:

- `id uuid PRIMARY KEY`;
- `tenant_id uuid NOT NULL`;
- nullable `industry_context_id uuid`;
- `requester_principal_id uuid NOT NULL`;
- nullable `subject_principal_id uuid`;
- raw `scope_class text NOT NULL`;
- `export_type` in `DATA_ACCESS | PORTABILITY | TENANT_EXPORT | ADMIN_EXPORT`;
- raw `requested_resource_classes text[] NOT NULL`;
- raw `residency_policy_version text NOT NULL`;
- raw `sensitivity_ceiling text NOT NULL`;
- `status` in `REQUESTED | VALIDATING | APPROVAL_REQUIRED | APPROVED | GENERATING | READY | DOWNLOADED | EXPIRED | REJECTED | CANCELLED`;
- nullable raw `approval_ref text`;
- nullable `document_id uuid`;
- nullable `expires_at timestamptz`;
- `created_at` and `updated_at`.

Migration 0030 narrows the physical contract:

- requester/subject reference `core_identity.platform_principal`;
- optional result document references `core_document.document_meta`;
- `scope_class` is exactly `TENANT_CORE` with null Industry Context or `TENANT_INDUSTRY` with non-null Industry Context;
- `sensitivity_ceiling` is exactly `PUBLIC | INTERNAL | CONFIDENTIAL | SENSITIVE_PERSONAL | REGULATED`;
- final FORCE-RLS is exact Tenant plus row scope: Tenant-Core rows are visible to the same Tenant regardless of whether the current private context is Tenant Core or one of that Tenant's Industry contexts, while Tenant-Industry rows require exact current Industry Context. Foreign Tenant and PLATFORM_GLOBAL contexts do not bypass this policy.

Migration 0031 adds write-time relationship integrity:

- requester must be active for the Tenant at the row's `created_at`;
- optional subject must be active for the Tenant at `created_at`;
- optional result DocumentMeta must match Tenant + Industry Context + scope class, be ACTIVE/CLEAN, and not exceed the persisted sensitivity ceiling at export-row insert/update time.

Those are write-time integrity facts. A raw reader does not re-authorize requester/subject, revalidate current Document state, or authorize generation/download merely because persisted references/status exist. In particular, the physical trigger does not turn `residency_policy_version` into a resolved residency policy or perform export execution.

Migration 0029 applies immutable ownership/scope protection to `tenant_id`, `industry_context_id` and `scope_class`. Existing `sbg_app_rw` DML on this pre-existing `core_config` table otherwise remains schema-owned.

The physical `requested_resource_classes` array has no database constraint prohibiting empty strings, duplicates or null elements. `residency_policy_version`, `approval_ref` and timestamps also have no reader-level interpretation contract. These must remain raw persisted evidence.

## Authorized implementation boundary

DD-140 may implement only an exact-by-id immutable DataExportRequest persistence reader through existing `PostgresDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `tenantId`;
- optional `industryContextId`;
- `requesterPrincipalId`;
- optional `subjectPrincipalId`;
- constrained `scopeClass`;
- constrained raw `exportType`;
- immutable raw `requestedResourceClasses` array;
- raw `residencyPolicyVersion`;
- constrained raw `sensitivityCeiling`;
- constrained raw lifecycle `status`;
- optional raw `approvalRef`;
- optional raw `documentId`;
- optional `expiresAt`;
- `createdAt`;
- `updatedAt`.

Validation remains schema-aligned only:

- UUID validation for identifiers/references;
- exact TENANT_CORE/TENANT_INDUSTRY shape;
- exact export/status/sensitivity vocabularies;
- raw text remains raw, including schema-valid empty strings;
- raw text-array order/duplicates/null elements are preserved;
- timestamps must be valid persisted timestamps when present;
- no expiry evaluation, requester/subject current-membership revalidation, document current-state/ACL/sensitivity revalidation, residency-policy resolution, approval satisfaction or generation readiness is invented.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- export request creation, validation, approval, generation, cancellation or download;
- current requester/subject authorization or membership validation;
- current DocumentMeta status/virus/sensitivity/ACL/residency revalidation;
- document binary access or signed URL issuance;
- requested-resource-class interpretation or query construction;
- residency-policy lookup/application;
- approval reference resolution or approval satisfaction;
- `expires_at` wall-clock enforcement;
- lifecycle transition validation or state machine;
- cross-context export;
- permission/entitlement/step-up evaluation;
- mutation;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing application-role DML, immutable scope columns and write-time relationship integrity remain schema-owned; the new application port is exact-read only.

## Acceptance expectations

1. exact Tenant-Industry DataExportRequest returns complete immutable raw row evidence;
2. sibling Industry context hides a Tenant-Industry row while its exact Industry Context may read it;
3. Tenant-Core row is same-Tenant visible from Tenant Core and Tenant Industry contexts, and visibility is not requester-principal-private;
4. foreign Tenant and PLATFORM_GLOBAL contexts cannot read the row;
5. raw lifecycle/expiry/approval/document/resource-class/residency evidence remains non-authorizing/non-generating/non-downloading, including schema-valid duplicate/null array elements and unordered/past timestamps;
6. missing well-formed id returns `null`; malformed id and route/context mismatch fail closed;
7. database DML/write-time integrity/immutable scope remain schema-owned while the port exposes no create/update/delete/list/approve/generate/download/authorize/revalidate-document/resolve-residency method.

Acceptance IDs: `DATAEXPORT-PG-001` through `DATAEXPORT-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-140 traceability or state promotion.
