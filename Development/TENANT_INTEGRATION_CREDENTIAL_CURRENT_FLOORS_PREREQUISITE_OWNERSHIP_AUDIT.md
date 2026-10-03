# TenantIntegration CredentialReference current-binding floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-SYNC-CURSOR-CURRENT-BINDING-FLOORS-001`  
**Verified synchronized basis:** `aa301006db980de9aca43fd4f6914c93badd4c60`  
**Scope:** next independent source-complete Integration prerequisite after DD-164.

## Source reconciliation

DD-06 §§15–18, DD-095 TenantIntegration raw reader, DD-096 CredentialReference metadata-only reader, migration 0025 Integration registry/RLS and migration 0030 `validate_tenant_integration_scope()` were reconciled.

The current repository already owns these exact deterministic predicates for the TenantIntegration→CredentialReference relationship:

- TenantIntegration is Tenant-owned and has exact `TENANT_CORE | TENANT_INDUSTRY` ownership shape;
- its `credential_reference_id` names one CredentialReference;
- migration 0030 requires the referenced credential Tenant to equal the TenantIntegration Tenant;
- a Tenant-wide credential (null credential Industry Context) may bind to either Tenant-Core or Tenant-Industry integration;
- when the credential has an Industry Context, it must equal the TenantIntegration Industry Context; therefore an Industry credential cannot bind Tenant-Core or a sibling Industry;
- the referenced credential status must be raw text exactly `ACTIVE`;
- when `expires_at` exists, it must be strictly later than the database evaluation instant; equality is expired;
- DD-096 exposes exactly the non-secret metadata needed to re-evaluate those facts and deliberately excludes `secret_reference`.

These write-time relationship/currentness facts can become stale after a TenantIntegration row was stored because CredentialReference status or expiry can later change.

## Determination

One pure server-internal **TenantIntegration CredentialReference current-binding necessary floor** is source-complete:

> Given already-loaded DD-095 TenantIntegration evidence, DD-096 CredentialReference metadata and a server-owned evaluation instant, determine only whether the exact migration-0030 credential relationship/currentness predicates still match.

A true result is **not Integration execution authorization, provider authorization or secret access authority**.

## Authorized DD-165 boundary

Implement:

`matchesCurrentTenantIntegrationCredentialFloors(integration, credential, evaluatedAt)`.

It must:

1. require a valid server-owned `evaluatedAt` timestamp;
2. require valid required UUID identity on TenantIntegration id/Tenant/credential reference and CredentialReference id/Tenant;
3. require valid TenantIntegration ownership shape:
   - TENANT_CORE => no Industry Context;
   - TENANT_INDUSTRY => one valid Industry Context;
4. require exact `credential.id === integration.credentialReferenceId`;
5. require exact `credential.tenantId === integration.tenantId`;
6. permit a Tenant-wide credential with no Industry Context, but when credential Industry Context is present require a valid UUID and exact equality to the integration Industry Context;
7. require `credential.status === 'ACTIVE'`;
8. when `credential.expiresAt` exists, require a valid timestamp and `expiresAt > evaluatedAt`;
9. leave all inputs unchanged.

## Acceptance target

- **INT-CRED-CUR-001** — exact ACTIVE non-expiring Tenant-Core credential binding matches.
- **INT-CRED-CUR-002** — Tenant-wide ACTIVE credential may bind an exact Tenant-Industry integration.
- **INT-CRED-CUR-003** — exact Industry credential may bind only its exact Tenant-Industry integration; sibling/Industry-to-Core fails.
- **INT-CRED-CUR-004** — foreign Tenant or wrong credential id fails.
- **INT-CRED-CUR-005** — non-ACTIVE credential status fails.
- **INT-CRED-CUR-006** — future expiry matches; expiry exactly at/before evaluation fails; malformed times fail closed.
- **INT-CRED-CUR-007** — TenantIntegration lifecycle/definition/capabilities/config/health/profile and CredentialReference provider/type/key-version/rotation metadata remain uninterpreted; no input mutation.

Expected Core delta: +7 tests, from 402 to 409. PostgreSQL/database schema remains unchanged.

## Explicitly unclaimed

DD-165 does **not**:

- decide whether TenantIntegration itself is ACTIVE/executable/healthy;
- validate IntegrationDefinition or enabled IntegrationCapabilities;
- decrypt or semantically validate integration config;
- resolve `permissionProfileId`;
- read, return or dereference `secret_reference`;
- retrieve secret material or choose a secret-store/provider;
- interpret credential type, key version, `rotatedAt` or rotation-overlap policy;
- select ProviderAdapter, direction, OperationContract or events;
- apply rate/idempotency/retry/circuit/residency/fallback policy;
- authorize callback/sync/provider/network execution;
- mutate credential/integration state or usage/audit evidence;
- change SQL/RLS/roles/grants/routes;
- widen DD-162 machine-auth, DD-163 Webhook or DD-164 SyncCursor boundaries.

## Next dependency boundary

After DD-165, exact current credential binding can be composed with other separately source-owned Integration prerequisites. Provider selection, secret runtime access, permission-profile semantics, health/fallback policy, callback authenticity and network execution remain independently governed.
