# CountryPack raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-FORM-FIELD-DEFINITION-READ-001`  
**Baseline branch head:** `c27486968a956d723faf4ec2517e52837ed21bf4`  
**Scope:** next independent governed continuation after DD-136.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0001_core_bootstrap.sql`;
- `database/migrations/0009_database_roles.sql`;
- `database/migrations/0014_ai_gateway_role.sql`;
- `database/migrations/0029_scope_privilege_identity_hardening.sql`;
- later migrations for absence of a CountryPack RLS/current-selection/effective-resolution rule;
- `Foundation/F-04_DATA_FOUNDATION.md`;
- `Architecture/A-05_DATA_ARCHITECTURE.md`;
- `DetailedDesign/DD-05_DATA_MODEL_AND_DATABASE_DESIGN.md`;
- DD-031 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md`;
- existing `PostgresDatabase` application-role boundary;
- DD-136 promoted state.

## Candidate determination

The next independently source-complete uncovered Core persistence slice is one exact `core_config.country_pack` row.

Migration 0001 owns:

- `id uuid PRIMARY KEY`;
- `country_code char(2) NOT NULL`;
- raw `code text NOT NULL`;
- positive `version integer`;
- lifecycle `status` in `DRAFT | REVIEW | PUBLISHED | ACTIVE | RETIRED`;
- raw `locale_codes text[] NOT NULL`;
- nullable `default_currency_code char(3)`;
- nullable raw `default_timezone text`;
- nullable raw `default_date_format text`;
- nullable raw `address_schema_json jsonb`;
- nullable raw `phone_schema_json jsonb`;
- nullable raw `reference_bundle_ref text`;
- raw `metadata_json jsonb NOT NULL DEFAULT '{}'`;
- `created_at timestamptz NOT NULL`;
- nullable raw `approved_by uuid`;
- nullable `effective_from timestamptz`;
- uniqueness of `(country_code,code,version)`;
- at most one ACTIVE row per `(country_code,code)`.

Unlike Tenant-owned configuration tables, `country_pack` has no RLS policy. That matches F-04's platform-master **global-read** boundary and A-05's versioned global/reference pack catalog. Migration 0029 explicitly makes the catalog SELECT-only for `sbg_app_rw` and moves INSERT/UPDATE/DELETE authority to `sbg_control_plane_rw`. Migration 0014 also grants AI Gateway SELECT only; no reader may reinterpret that as activation or mutation authority.

DD-031 states that Country Packs are reference/default bundles only. They may carry locale/currency/timezone/date-number/language/address/phone/reference defaults, but may not grant permissions, entitlements, live Industry activation or arbitrary business-rule authority. Tenant activation is separately persisted in `core_config.tenant_country_pack_activation` and remains outside this exact-row catalog read.

## Authorized implementation boundary

DD-137 may implement only an exact-by-id immutable CountryPack persistence reader through the existing `PostgresDatabase` / `SqlDatabase` application-role boundary.

Because the table is intentionally global-read and has no Tenant/Industry RLS, the port must not invent a `RequestContext` requirement or Tenant/Industry visibility filter.

Authorized returned evidence:

- `id`;
- raw `countryCode`;
- raw `code`;
- positive `version`;
- constrained raw lifecycle `status`;
- immutable raw `localeCodes` array;
- optional raw `defaultCurrencyCode`;
- optional raw `defaultTimezone`;
- optional raw `defaultDateFormat`;
- optional normalized immutable `addressSchema` JSON;
- optional normalized immutable `phoneSchema` JSON;
- optional raw `referenceBundleRef`;
- normalized immutable `metadata` JSON;
- `createdAt`;
- optional raw `approvedBy`;
- optional `effectiveFrom`.

Validation remains schema-aligned only:

- UUID validation for identifiers;
- exact lifecycle status values;
- positive safe integer for `version`;
- raw text remains raw, including schema-valid empty strings;
- `locale_codes` preserves persisted order, duplicates and nullable elements because the physical array column does not prohibit them;
- JSON is normalized/frozen without interpreting schema/default semantics;
- nullable persisted values remain absent rather than acquiring defaults;
- timestamps must be valid persisted values;
- no country/locale/currency/timezone vocabulary validation, ACTIVE/current selection, wall-clock effective evaluation or fallback is invented.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- current/latest/ACTIVE CountryPack selection;
- `effective_from` wall-clock evaluation;
- country-code fallback or locale negotiation;
- Tenant CountryPack activation/deactivation;
- Tenant override merge/materialization;
- locale/currency/timezone/date/number/language/address/phone default application;
- reference-bundle loading;
- tax/business-rule semantics;
- permission, entitlement or Industry activation authority;
- seed installation or master-data mutation;
- Control Plane publication/mutation;
- AI provisioning revalidation;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

## Acceptance expectations

1. exact CountryPack id returns complete immutable raw catalog evidence;
2. global catalog read works through the ordinary application role without Tenant/Industry RequestContext or RLS-derived visibility;
3. DRAFT/RETIRED/future-effective evidence remains readable raw and does not become current/effective/activated authority;
4. raw locale-array, nullable/default fields and JSON evidence are preserved without vocabulary/default interpretation;
5. missing well-formed id returns `null`; malformed id fails closed before SQL;
6. ordinary application role has SELECT but no INSERT/UPDATE/DELETE on `core_config.country_pack`;
7. the port exposes no select-current, activation, override, materialization, permission/entitlement or mutation method.

Acceptance IDs: `COUNTRYPACK-PG-001` through `COUNTRYPACK-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-137 traceability or state promotion.
