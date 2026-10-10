# TenantIntegration PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline:** `5e203a9bb4afab4259d3c1547998aefa7fc2f742`  
**Scope:** next independent source-complete Integration persistence slice after DD-094.

## Source reconciliation

DD-06 §§15–18, DD-17 Integration acceptance, migration 0025
`tenant_integration` schema/FORCE-RLS policy, migration 0028 Integration-service
privileges, DD-092 IntegrationDefinition, DD-093 IntegrationCapability, DD-094
ProviderAdapter and the fixed-role `PostgresIntegrationDatabase` were reconciled.

The persisted TenantIntegration contract is exact:

- Tenant + optional Industry Context ownership;
- scope class `TENANT_CORE | TENANT_INDUSTRY`;
- exact IntegrationDefinition id;
- display name;
- raw status `PENDING | ACTIVE | PAUSED | ERROR | REVOKED`;
- CredentialReference id only;
- persisted config JSON (encrypted-or-safe representation);
- enabled-capability code array;
- optional permission-profile id;
- raw health state;
- optional last-health timestamp;
- positive version and timestamps;
- FORCE-RLS visibility by current Tenant + exact Industry Context, while Tenant Core
  rows remain same-Tenant visible.

## Determination

A concrete **raw TenantIntegration reader by id** is source-complete.

This does **not** make the row executable authority. ACTIVE status, enabled
capabilities and health state remain persisted evidence only. Provider selection,
capability authorization, OperationContract dispatch and secret retrieval remain
separate governed work.

## Authorized implementation boundary

Implement:

1. immutable typed `PersistedTenantIntegration`;
2. `TenantIntegrationReadPort.loadForContext(requestContext,id)`;
3. `PostgresTenantIntegrationStore` through
   `PostgresIntegrationDatabase` + `RequestScopedSql`;
4. one parameterized read by id;
5. exact UUID/scope/array/JSON/timestamp/version validation;
6. null for absent or RLS-hidden rows;
7. PostgreSQL acceptance proving exact Industry visibility, sibling isolation,
   Tenant Core visibility, raw status/health/config fidelity and malformed-input
   fail-closed behavior.

The reader may expose `credentialReferenceId` as an identifier only. It must not
join `credential_reference`, read secret-store provider/reference metadata, decrypt
config, decide enabled/executable/healthy state, select ProviderAdapter, or execute
network/OperationContract behavior.

No migration, role, grant, route, secret-store call or provider SDK is authorized.

Acceptance: INT-TENANT-PG-001…005.
