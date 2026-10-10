# OrgUnitIndustry raw persistence reader prerequisite ownership audit

**Date:** 2026-09-23  
**Baseline checkpoint:** `DEV-SUBSCRIPTION-TRANSITION-READ-001`  
**Baseline branch head:** `c2f633b5525111f78151cec0c69acbe34af4a598`  
**Scope:** next independent governed continuation after DD-141.

## Source reconciliation

Freshly reconciled:

- `database/migrations/0001_core_bootstrap.sql`;
- `database/migrations/0007_database_governance.sql`;
- `database/migrations/0009_database_roles.sql`;
- migration 0029 immutable-scope/runtime privilege hardening;
- migration 0031 consumers that require an ACTIVE OrgUnitIndustry link for document-ACL/workflow-task integrity;
- migrations 0032–0047 for absence of a later OrgUnitIndustry lifecycle/read-visibility rule;
- migration 0041 pre-context bootstrap boundary, which intentionally covers `org_unit` but not `org_unit_industry`;
- `DetailedDesign/DD-05_DATA_MODEL_AND_DATABASE_DESIGN.md`;
- existing `PostgresDatabase` + `RequestScopedSql` application boundary;
- DD-141 promoted/synchronized state.

## Candidate determination

The next independently source-complete uncovered bootstrap-owned persistence slice is one exact `core_tenancy.org_unit_industry` row.

Migration 0001 owns:

- `tenant_id uuid NOT NULL`;
- `org_unit_id uuid NOT NULL`;
- `industry_context_id uuid NOT NULL`;
- `status core_tenancy.org_unit_status NOT NULL` with physical vocabulary `ACTIVE | SUSPENDED | ARCHIVED`;
- raw `config_json jsonb NOT NULL DEFAULT '{}'`;
- composite primary key `(tenant_id, org_unit_id, industry_context_id)`;
- same-Tenant composite foreign key to `core_tenancy.org_unit(tenant_id,id)`;
- same-Tenant composite foreign key to `core_tenancy.industry_context(tenant_id,id)`.

Migration 0001 applies FORCE-RLS with exact Industry visibility:

`tenant_id = current_tenant_id() AND industry_context_id = current_industry_context_id()`.

Therefore:

- exact owning Tenant + Industry Context may read the row;
- a sibling Industry Context in the same Tenant may not;
- a Tenant-Core context with no Industry Context may not;
- foreign Tenant and PLATFORM_GLOBAL contexts may not bypass the row policy.

Migration 0007 registers the table as `TENANT_INDUSTRY / RLS-INDUSTRY-READ/WRITE`, owned by Tenancy.

Migration 0009 grants `sbg_app_rw` SELECT/INSERT/UPDATE/DELETE over pre-existing `core_tenancy` tables. Migration 0029 removes future blanket grants and installs the generic immutable-scope trigger. Because this table carries `tenant_id` and `industry_context_id`, those ownership fields cannot change on UPDATE. The generic trigger does **not** make `org_unit_id`, `status` or `config_json` immutable.

Migration 0031 consumes ACTIVE OrgUnitIndustry links when validating certain document-ACL OrgUnit subjects and workflow-task OrgUnit assignees. Those are write-time integrity checks in those owning modules. An exact raw OrgUnitIndustry read does not become document-access authorization, workflow assignment authorization, OrgUnit hierarchy authorization or Industry activation authority.

Migration 0041 deliberately grants pre-context bootstrap read access to `tenant`, `industry_context` and `org_unit`, but not `org_unit_industry`. This link therefore remains a request-scoped Industry-private relation rather than a pre-context directory surface.

No later migration 0032–0047 adds stronger lifecycle, effective-date, row-version, current-link, config-schema or mutation semantics for this table.

## Authorized implementation boundary

DD-142 may implement only an exact OrgUnitIndustry raw persistence reader through existing `PostgresDatabase` + `RequestScopedSql`.

The request context supplies the Tenant + Industry scope. The lookup key is one `orgUnitId`; under the composite PK plus exact RLS, at most one visible row can match in that context.

Authorized returned evidence:

- `tenantId`;
- `orgUnitId`;
- `industryContextId`;
- constrained raw `status`;
- normalized immutable `config` JSON.

Validation remains schema-aligned only:

- UUID validation for Tenant/OrgUnit/Industry identifiers;
- exact `TENANT_INDUSTRY` request context for reads;
- exact status vocabulary `ACTIVE | SUSPENDED | ARCHIVED`;
- exact returned Tenant/Industry ownership shape;
- JSON normalization/freezing without interpreting keys or values;
- no OrgUnit hierarchy/path, parent, type, Industry activation status, current-link, effective-link, config-schema or permission semantics are invented.

## Explicitly unclaimed semantics

This slice does **not** implement or authorize:

- OrgUnit creation/update/delete;
- OrgUnitIndustry create/update/delete;
- status transitions or activation/deactivation workflow;
- current/effective/primary OrgUnitIndustry selection;
- OrgUnit hierarchy traversal, ancestor/descendant inheritance or path authorization;
- OrgUnit status revalidation;
- IndustryContext status/activation revalidation;
- config JSON schema/merge/default/materialization semantics;
- document ACL authorization;
- workflow assignment authorization;
- RBAC/ABAC/permission/entitlement evaluation;
- cross-Industry or Tenant-Core fallback;
- pre-context bootstrap visibility;
- public/API routes;
- migration/schema/verification SQL/role/grant/RLS/product-policy changes.

Existing application-role DML and migration-0029 immutable Tenant/Industry ownership remain schema-owned; the new application port is exact-read only.

## Acceptance expectations

1. exact OrgUnitIndustry row returns complete immutable raw evidence for the owning Industry Context;
2. sibling Industry Context hides the same OrgUnit link while the owning Industry Context may read it;
3. Tenant-Core, foreign-Tenant and PLATFORM_GLOBAL contexts do not bypass exact Industry RLS;
4. ACTIVE/SUSPENDED/ARCHIVED and arbitrary raw config JSON remain evidence only and do not become effective/current/authorized status;
5. same OrgUnit may have independently visible links in different Industry Contexts, with no cross-Industry fallback;
6. missing well-formed OrgUnit id returns `null`; malformed id and route/context mismatch fail closed;
7. existing database DML and immutable Tenant/Industry ownership remain schema-owned while the port exposes no create/update/delete/list/activate/deactivate/hierarchy/config-resolution/document/workflow authorization method.

Acceptance IDs: `ORGIND-PG-001` through `ORGIND-PG-007`.

Exact implementation-head Core/PostgreSQL/Database/Web CI must pass before canonical DD-142 traceability or state promotion.
