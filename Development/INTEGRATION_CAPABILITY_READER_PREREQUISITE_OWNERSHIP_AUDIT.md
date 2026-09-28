# IntegrationCapability PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline:** `23324e04541aa505228db72da641ee79d753bfef`  
**Scope:** next independent source-complete Integration registry slice after DD-092.

## Source reconciliation

DD-06 §§15–16, DD-17 Integration acceptance, migration 0025
`integration_capability` schema and unique tuple, migration 0025
`integration_direction` enum, migration 0028 Integration-service read privileges,
DD-092 IntegrationDefinition registry ownership and the fixed-role
`PostgresIntegrationDatabase` were reconciled.

The persisted capability contract is exact:

- primary key `id`;
- exact unique tuple `integration_definition_id + capability_code`;
- direction enum is INBOUND / OUTBOUND / BIDIRECTIONAL;
- optional OperationContract id;
- event-types text array;
- persisted data/idempotency/rate/status classification text;
- definition FK keeps the capability attached to one IntegrationDefinition;
- Integration service role has SELECT-only access to this registry table.

No executable source currently makes raw status/rate/idempotency/data-class strings an
execution or enablement decision at this read boundary.

## Determination

A concrete **exact IntegrationCapability reader by definition+capability tuple** is
source-complete.

## Authorized implementation boundary

Implement:

1. immutable typed `PersistedIntegrationCapability`;
2. `IntegrationCapabilityReadPort.loadExact(definitionId, capabilityCode)`;
3. `PostgresIntegrationCapabilityStore` through the fixed Integration database;
4. one parameterized exact tuple read;
5. UUID/direction/text/array validation with immutable arrays;
6. null for an absent/mismatched tuple;
7. PostgreSQL acceptance proving exact tuple fidelity, raw status/direction evidence,
   no fallback and malformed-input fail-closed behavior.

The reader does not:

- decide whether a capability is enabled for a TenantIntegration;
- resolve or execute OperationContract/event handling;
- select a ProviderAdapter;
- apply rate/idempotency/data-class policy;
- access credentials or secrets;
- mutate registry state.

No migration, role, grant, route, provider SDK or policy decision is authorized.

Acceptance: INT-CAP-PG-001…004.
