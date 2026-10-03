# BrandConfiguration raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-TENANT-COUNTRY-PACK-ACTIVATION-READ-001`  
**Baseline branch head:** `9bc133d7291513ac1c5cd611e9b00274f6c0ac26`  
**Scope:** next independent governed continuation after DD-138.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0001_core_bootstrap.sql`;
- `database/migrations/0007_database_governance.sql`;
- `database/migrations/0009_database_roles.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0029_scope_privilege_identity_hardening.sql`;
- migrations 0030–0031 for absence of later BrandConfiguration-specific reference/lifecycle integrity;
- migration 0032 PLATFORM-definition write floor;
- `Foundation/F-06_EXPERIENCE_LAYER.md`;
- `Architecture/A-01_CORE_PLATFORM_ARCHITECTURE.md`;
- `Architecture/A-08_EXPERIENCE_ARCHITECTURE.md`;
- `DetailedDesign/DD-05_DATA_MODEL_AND_DATABASE_DESIGN.md`;
- DD-034 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md`;
- existing `PostgresDatabase` + `RequestScopedSql` application boundary;
- DD-138 promoted state.

## Candidate determination

The next independently source-complete uncovered Core persistence slice is one exact `core_config.brand_configuration` row.

Migration 0001 owns:

- `id uuid PRIMARY KEY`;
- `owner_scope` in `PLATFORM | TENANT | INDUSTRY`;
- nullable `tenant_id` / `industry_context_id` with exact ownership-shape CHECK;
- raw `code text NOT NULL`;
- positive `version integer`;
- lifecycle `status` in `DRAFT | REVIEW | PUBLISHED | ACTIVE | RETIRED`;
- raw `token_json jsonb NOT NULL`;
- raw `typography_json jsonb NOT NULL`;
- nullable raw UUID-shaped `logo_document_id`;
- nullable raw UUID-shaped `favicon_document_id`;
- `accessibility_validation_status` in `PENDING | PASS | FAIL`;
- raw UUID-shaped `created_by`;
- nullable raw UUID-shaped `approved_by`;
- `created_at` and `updated_at`;
- scoped uniqueness of `(owner_scope,tenant,industry,code,version)`;
- at most one ACTIVE row per scoped code;
- database CHECK requiring `accessibility_validation_status='PASS'` whenever `status='ACTIVE'`.

Migration 0001 applies FORCE-RLS through `core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id)`. Therefore Tenant rows are same-Tenant visible from Tenant Core and Tenant Industry contexts, Industry rows require exact Industry Context, and PLATFORM rows require trusted PLATFORM_GLOBAL context.

Migration 0007 registers this table as MIXED_SCOPED Branding ownership. Migration 0009 gives the ordinary application role table-level DML on the existing `core_config` table. Migration 0029 makes owner/Tenant/Industry scope columns immutable after insert; migration 0032 adds restrictive write floors so PLATFORM-owned rows cannot be inserted/updated/deleted through `sbg_app_rw` even from a PLATFORM_GLOBAL context. Existing AI Gateway visibility is SELECT-only and does not change the application reader boundary.

No later migration adds a foreign key or runtime authorization rule for `logo_document_id`, `favicon_document_id`, `created_by` or `approved_by`; they remain raw persisted UUID evidence in this slice.

F-06/A-08/DD-034 own the brand hierarchy and protected semantic-token behavior: Platform Brand → allowed Industry override → Tenant white-label override → user presentation preference; security/accessibility semantic tokens and Platform product identity cannot be weakened by lower layers. Those are composition/policy semantics, not consequences of loading one raw BrandConfiguration row.

## Authorized implementation boundary

DD-139 may implement only an exact-by-id immutable BrandConfiguration persistence reader through existing `PostgresDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- constrained `ownerScope`;
- optional `tenantId`;
- optional `industryContextId`;
- raw `code`;
- positive `version`;
- constrained raw lifecycle `status`;
- normalized immutable `tokens` JSON;
- normalized immutable `typography` JSON;
- optional raw `logoDocumentId`;
- optional raw `faviconDocumentId`;
- constrained raw `accessibilityValidationStatus`;
- raw `createdBy`;
- optional raw `approvedBy`;
- `createdAt`;
- `updatedAt`.

Validation remains schema-aligned only:

- UUID validation for identifiers/references;
- exact owner/status/accessibility enum values;
- exact owner/Tenant/Industry shape;
- positive safe integer version;
- raw text remains raw, including schema-valid empty code;
- JSON is normalized/frozen but no token dictionary, color, font, protected-semantic-token, product-identity or override policy is interpreted;
- timestamps must be valid persisted timestamps;
- ACTIVE+PASS is preserved as database-valid evidence but is not upgraded into resolved/effective/current brand authority.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- Platform → Industry → Tenant → user brand hierarchy resolution;
- ACTIVE/current/latest BrandConfiguration selection;
- code/version fallback or inheritance;
- protected security/accessibility semantic-token enforcement;
- lower-layer override allowlists;
- Platform product-identity protection;
- accessibility revalidation or WCAG evaluation;
- token/color/font/typography validation;
- theme generation, CSS/native-token compilation or rendering;
- logo/favicon DocumentMeta lookup, ACL/sensitivity checks or binary retrieval;
- publish/activate/retire/rollback mutation;
- entitlement or permission evaluation;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing database DML authority and migration-0032 PLATFORM write floor remain schema-owned; the new application port is read-only.

## Acceptance expectations

1. exact Industry BrandConfiguration returns complete immutable raw row evidence;
2. sibling Industry scope hides the row while exact Industry Context may read it;
3. Tenant-owned configuration is same-Tenant visible from Core and Industry contexts, preserving schema-valid empty/raw JSON and non-ACTIVE accessibility evidence;
4. PLATFORM row is not Tenant fallback and requires trusted PLATFORM_GLOBAL context;
5. foreign-Tenant row is hidden; ACTIVE+PASS remains raw evidence and does not become resolved/current brand authority;
6. missing well-formed id returns `null`; malformed id and route/context mismatch fail closed;
7. raw token/typography/document/accessibility evidence creates no hierarchy/protected-token/render/document-access authority, and existing app DML plus PLATFORM write floor remain schema-owned.

Acceptance IDs: `BRANDCFG-PG-001` through `BRANDCFG-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-139 traceability or state promotion.
