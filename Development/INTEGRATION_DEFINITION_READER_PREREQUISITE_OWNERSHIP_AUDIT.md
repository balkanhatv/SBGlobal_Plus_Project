# IntegrationDefinition PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline:** `a04c9baa5373fe2d97d51e34868a3322edbb69d7`  
**Scope:** next independent source-complete Integration persistence slice after DD-091.

## Source reconciliation

DD-06 §§15–18, DD-17 Integration acceptance, migration 0025
`integration_definition`, migration 0001 `core_config.owner_scope`, migration
0028 Integration-service read privileges and the current fixed-role
`PostgresIntegrationDatabase` were reconciled.

The persisted definition contract is exact:

- `id` is the primary key and `code` is unique;
- `owner_scope` is exactly PLATFORM / TENANT / INDUSTRY;
- capability codes are a persisted text array;
- persisted metadata includes name, provider family, adapter-contract version,
  status, data-transfer class, residency metadata JSON and timestamps;
- the Integration service role has SELECT only on `integration_definition`;
- definition metadata is global registry data rather than Tenant-owned runtime state.

The table deliberately stores `status` and several classification values as text.
No executable source currently defines a universal interpretation/filter for those
strings at this persistence boundary.

## Determination

A concrete **exact IntegrationDefinition reader by primary key** is source-complete.

The reader may preserve raw non-empty registry classification/status values but must
not infer that a definition is selectable, enabled for a Tenant, healthy, compatible
with a capability, or authorized for a provider/region.

## Authorized implementation boundary

Implement:

1. typed immutable `PersistedIntegrationDefinition`;
2. `IntegrationDefinitionReadPort.loadById(id)`;
3. `PostgresIntegrationDefinitionStore` using the existing fixed-role Integration
   database;
4. one parameterized primary-key read;
5. UUID/ownerScope/text/array/timestamp/JSON validation with immutable nested data;
6. null for absent ids;
7. PostgreSQL acceptance proving exact row fidelity, ownerScope/raw-status
   preservation, absent-id behavior and malformed-id fail-closed behavior.

The reader does not:

- read CredentialReference or secret references;
- join TenantIntegration/ProviderAdapter/IntegrationCapability;
- choose provider/adapter/capability;
- decide status/health/fallback/residency policy;
- execute callbacks or domain commands;
- mutate the registry.

No migration, role, grant, route, provider SDK or policy decision is authorized.

Acceptance: INT-DEF-PG-001…004.
