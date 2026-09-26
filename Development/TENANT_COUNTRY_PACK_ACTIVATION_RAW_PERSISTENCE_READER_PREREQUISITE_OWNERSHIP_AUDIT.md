# TenantCountryPackActivation raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-COUNTRY-PACK-READ-001`  
**Baseline branch head:** `a5ea04f005fea7e9023bc748b7e58b234b8ba1c8`  
**Scope:** next independent governed continuation after DD-137.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0001_core_bootstrap.sql`;
- `database/migrations/0007_database_governance.sql`;
- `database/migrations/0009_database_roles.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0029_scope_privilege_identity_hardening.sql`;
- migration 0031's AI write-time reference to ACTIVE Tenant CountryPack activation;
- later DD-137 CountryPack global catalog boundary;
- `Foundation/F-04_DATA_FOUNDATION.md`;
- `Architecture/A-05_DATA_ARCHITECTURE.md`;
- `DetailedDesign/DD-05_DATA_MODEL_AND_DATABASE_DESIGN.md`;
- DD-031 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md`;
- existing `PostgresDatabase` + `RequestScopedSql` application boundary.

## Candidate determination

The next independently source-complete uncovered Core persistence slice is one exact `core_config.tenant_country_pack_activation` row.

Migration 0001 owns:

- `id uuid PRIMARY KEY`;
- `tenant_id uuid NOT NULL` referencing Tenant;
- `country_pack_id uuid NOT NULL` referencing the global CountryPack catalog;
- lifecycle `status` in `PENDING | ACTIVE | DISABLED`;
- raw `config_override_json jsonb NOT NULL DEFAULT '{}'`;
- nullable `activated_at timestamptz`;
- nullable `disabled_at timestamptz`;
- `row_version bigint NOT NULL DEFAULT 1`;
- uniqueness of `(tenant_id,country_pack_id)`.

Migration 0001 applies FORCE-RLS with a Tenant-only policy: `tenant_id = core_tenancy.current_tenant_id()`. Industry Context is not part of this policy. Therefore an owning Tenant row is visible from both Tenant Core and Tenant Industry contexts for that same Tenant, while foreign Tenant and PLATFORM_GLOBAL contexts do not gain visibility.

Migration 0007 registers the table as `TENANT_CORE / RLS-TENANT-READ/WRITE` owned by Localization.

Migration 0009 grants ordinary `sbg_app_rw` SELECT/INSERT/UPDATE/DELETE over existing `core_config` tables. Migration 0029 removes future blanket grants but does not revoke this table's existing DML. The migration-0029 generic immutable-scope trigger applies because the table carries `tenant_id`, so Tenant ownership cannot change after insert. It does not make `country_pack_id`, status, overrides, timestamps or row_version immutable.

Migration 0014 grants AI Gateway SELECT over Tenant CountryPack activation. Migration 0031 uses an ACTIVE activation only as a write-time prerequisite for IndustryAIConfig country-pack allowlists. That consumer-side check does not turn an exact raw activation read into current/effective localization materialization or AI runtime authorization.

DD-031 states that Country Packs are reference/default bundles only and Tenant activation is explicit and audited. DD-05 identifies activation as its own mutable aggregate with row-version concurrency guidance, but the physical `row_version` column has no positive-value CHECK. A raw reader must therefore preserve exact bigint text rather than invent a positive/safe-integer rule.

## Authorized implementation boundary

DD-138 may implement only an exact-by-id immutable projection of one persisted TenantCountryPackActivation through existing `PostgresDatabase` + `RequestScopedSql`.

Authorized returned evidence:

- `id`;
- `tenantId`;
- `countryPackId`;
- constrained raw `status`;
- normalized immutable `configOverride` JSON;
- optional `activatedAt`;
- optional `disabledAt`;
- exact PostgreSQL bigint `rowVersion` as decimal text.

Validation remains schema-aligned only:

- UUID validation for activation, Tenant and CountryPack identifiers;
- exact activation-status vocabulary;
- normalized/frozen JSON without applying override semantics;
- timestamps must be valid persisted values when present;
- `row_version` must be canonical PostgreSQL bigint text, preserving zero/negative values if persisted because the physical table does not prohibit them;
- no timestamp ordering, status/timestamp consistency, current-pack selection, CountryPack lifecycle revalidation, override merge or default application is invented.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- current/effective/primary Tenant CountryPack selection;
- ACTIVE status as proof that defaults have been materialized/applied;
- CountryPack ACTIVE/effective revalidation;
- activation/deactivation state transitions;
- row-version compare-and-swap writes;
- override merge/validation/materialization;
- locale/currency/timezone/date/number/language/address/phone default application;
- reference-bundle loading;
- tax/business-rule semantics;
- AI Industry config eligibility revalidation;
- permission/entitlement/Industry activation authority;
- Tenant CountryPack mutation;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing application-role DML and immutable Tenant ownership remain schema-owned; the new application port is read-only.

## Acceptance expectations

1. exact TenantCountryPackActivation returns complete immutable raw evidence, including exact bigint row-version text and frozen override JSON;
2. same-Tenant Core and Industry contexts see the same Tenant-owned activation because RLS is Tenant-only;
3. foreign-Tenant activation is hidden while owning Tenant may read it;
4. PLATFORM_GLOBAL does not bypass Tenant RLS;
5. PENDING/DISABLED, nullable or unordered timestamps, raw override JSON and non-positive row-version evidence remain raw rather than becoming current/effective/applied authority;
6. missing well-formed id returns `null`; malformed id and route/context mismatch fail closed;
7. database DML remains schema-owned subject to RLS/immutable Tenant ownership, while the port exposes no mutation/current-selection/override-merge/materialization/default-application/AI-eligibility method.

Acceptance IDs: `TENANTPACK-PG-001` through `TENANTPACK-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-138 traceability or state promotion.
