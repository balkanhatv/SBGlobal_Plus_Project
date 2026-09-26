# ProviderAdapter PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline:** `0bda1bee3b5788e74b154735a624d6e27aead27b`  
**Scope:** next independent source-complete Integration registry slice after DD-093.

## Source reconciliation

DD-06 §§15–17, DD-17 Integration acceptance, migration 0025
`provider_adapter` schema/unique tuple, migration 0028 Integration-service read
privileges, DD-092 IntegrationDefinition ownership, DD-093 capability registry
boundary and the fixed-role `PostgresIntegrationDatabase` were reconciled.

The persisted ProviderAdapter contract is exact:

- primary key `id`;
- exact unique tuple `definition_id + adapter_code + contract_version`;
- persisted auth method, timeout class, retry class, circuit class, health-probe
  class, normalized-error-map version and status;
- definition FK binds the adapter metadata to one IntegrationDefinition;
- Integration service role has SELECT-only access.

Those classification strings are registry declarations, not executable provider
behavior at this persistence boundary.

## Determination

A concrete **exact ProviderAdapter reader by definition+adapter+contract-version
tuple** is source-complete.

## Authorized implementation boundary

Implement:

1. immutable typed `PersistedProviderAdapter`;
2. `ProviderAdapterReadPort.loadExact(definitionId,adapterCode,contractVersion)`;
3. `PostgresProviderAdapterStore` through the fixed Integration database;
4. one parameterized exact tuple read;
5. UUID/non-empty-text validation;
6. null for absent/mismatched tuple;
7. PostgreSQL acceptance proving exact metadata fidelity, raw-status preservation,
   no fallback and malformed-input fail-closed behavior.

The reader does not:

- instantiate or select provider SDK/runtime code;
- access CredentialReference or secret material;
- decide auth/timeout/retry/circuit/health policy;
- resolve TenantIntegration enablement;
- execute health probes, callbacks, OperationContracts or events;
- mutate adapter registry state.

No migration, role, grant, route, network call or provider SDK is authorized.

Acceptance: INT-ADAPTER-PG-001…004.
