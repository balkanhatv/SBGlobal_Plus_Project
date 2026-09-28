# IndustryContext activation raw persistence reader prerequisite ownership audit

**Date:** 2026-09-28
**Baseline checkpoint:** `DEV-AI-PROVISIONING-SNAPSHOT-TENANT-CORE-INDUSTRY-VERSION-FLOOR-001`
**Verified entry HEAD:** `1b363923366d516476660ca600cb90f165265bcb`
**Verified entry tree:** `825c0492f9964900511eca66ac3199a78aa9408d`
**Governed candidate:** DD-214

## Entry gate

DD-213 canonical promotion and state closure are exact-head verified.

At the entry HEAD above:
- Core Service Verify run `36407526930`, Core job `108879726623`: **781/781 PASS**, zero failed/skipped.
- PostgreSQL job `108879726308`: **512/512 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify run `36407528220`, job `108879729750`: PASS.
- Web Boundary Verify run `36407526808`, job `108879725206`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. `main` is unmerged. RawSource is unchanged.

## Source ownership reconciled

Freshly reconciled:
- migration 0001 `core_tenancy.industry_context`;
- migration 0041 pre-context Tenant directory bootstrap role and RLS policy;
- migration 0031 ProvisioningSnapshot Industry activation-version equality branch;
- DD-02 Tenant/Industry Context design;
- existing `PostgresContextBootstrapDatabase` and `PostgresTenantContextAdapter`.

Migration 0001 owns `core_tenancy.industry_context` with:
- `id uuid PRIMARY KEY`;
- `tenant_id uuid NOT NULL`;
- lifecycle `status`;
- `activation_version bigint NOT NULL DEFAULT 1`;
- uniqueness of `(tenant_id,id)`.

Migration 0041 already grants fixed role `sbg_context_bootstrap_ro` SELECT on `core_tenancy.industry_context`, with `NOBYPASSRLS`, no login and no write privilege. Its existing pre-context RLS policy intentionally permits directory resolution. Therefore an activation-version evidence reader must enforce its own exact Tenant+Industry tuple and must never expose an unscoped by-id/list API.

The existing DD-057 `IndustryContextRecord` deliberately omits `activation_version`, so migration 0031's Industry-scoped ProvisioningSnapshot equality branch is not yet source-complete in application evidence.

## Determination and locked DD-214 implementation boundary

**SOURCE-COMPLETE for a minimal raw exact-tuple IndustryContext activation evidence reader.**

Add Core contract:
- `PersistedIndustryContextActivationEvidence`;
- `IndustryContextActivationReadPort.loadExact({tenantId, industryContextId})`.

Returned immutable evidence is limited to:
- `id`;
- `tenantId`;
- raw constrained `status`;
- exact PostgreSQL bigint `activationVersion` as canonical decimal text.

Concrete PostgreSQL reader:
- uses existing `PostgresContextBootstrapDatabase`;
- validates both ids as UUIDs before SQL;
- queries `WHERE tenant_id=$1::uuid AND id=$2::uuid`;
- returns null for no matching well-formed exact tuple;
- fails if a supposedly exact query is ambiguous;
- preserves status without interpreting authorization;
- preserves bigint as exact text without JS-number conversion;
- freezes returned evidence.

No list/current/primary/activate/deactivate/update/delete method is authorized.

## Fixed acceptance before implementation

- **INDCTX-ACT-PG-001**: exact owning Tenant+Industry tuple returns frozen id/Tenant/status/exact bigint activationVersion.
- **INDCTX-ACT-PG-002**: same IndustryContext id with foreign Tenant tuple returns null.
- **INDCTX-ACT-PG-003**: ACTIVE/PENDING/SUSPENDED/DISABLED statuses and max/zero/negative activation versions remain raw wherever physical schema permits.
- **INDCTX-ACT-PG-004**: missing well-formed tuple returns null; malformed Tenant or Industry id fails closed before SQL.
- **INDCTX-ACT-PG-005**: reader executes under exact `sbg_context_bootstrap_ro` with NOBYPASSRLS and no INSERT/UPDATE/DELETE privilege.
- **INDCTX-ACT-PG-006**: port exposes no list/current/primary/state-transition/mutation authority.

Expected executable delta after this source-audit commit independently passes exact-head verification:
- Core remains **781**;
- PostgreSQL **512 → 518**;
- Database inventory remains **48 migrations / 42 verification files**;
- Web remains unchanged.

## Critical semantic boundary

A successful DD-214 read proves only persisted raw evidence for one exact Tenant+Industry tuple.

It does **not** prove:
- that ACTIVE means authorized/effective for a requested operation;
- that an AIProvisioningSnapshot activation version matches;
- current/primary Industry selection;
- subscription/license/entitlement authority;
- effective Tenant+Industry AI configuration;
- provisioning compilation/currentness;
- Provider/model/API suitability;
- routing or AI execution.

## Explicit exclusions / continuation

DD-214 changes no schema, migration, RLS, role, grant, route, public API or product policy.

Only after DD-214 implementation and exact-head Core/PostgreSQL/Database/Web verification may the separate ProvisioningSnapshot Industry-scoped activation-version equality predicate be source-audited.
