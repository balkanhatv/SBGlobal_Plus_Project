# TenantIntegration Definition/Capability current-set floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-TENANT-INTEGRATION-CREDENTIAL-CURRENT-FLOORS-001`  
**Verified synchronized basis:** `3087213efbd452604f3a9748f0e1d4aa5fa63ed0`  
**Scope:** next independent source-complete Integration prerequisite after DD-165.

## Source reconciliation

DD-06 §§15–18, DD-092 IntegrationDefinition reader, DD-093 IntegrationCapability reader, DD-095 TenantIntegration reader, migration 0025 Integration registry constraints and migration 0030 `validate_tenant_integration_scope()` were reconciled.

Migration 0030 owns one exact deterministic write-time Definition/Capability predicate for TenantIntegration:

- the referenced IntegrationDefinition must exist and its raw status must be exactly `ACTIVE`;
- `config_json_encrypted_or_safe` must be a JSON object;
- `enabled_capabilities` must contain no duplicate or NULL entries;
- every enabled code must occur in the referenced IntegrationDefinition `capability_codes` array;
- for every enabled code, an exact IntegrationCapability row under the same IntegrationDefinition must exist with raw status exactly `ACTIVE`.

DD-092/DD-093/DD-095 expose exactly the immutable evidence needed to re-evaluate these predicates. Their generic reader boundaries correctly treat raw status/classification as non-authorizing; migration 0030 supplies the narrower exact `ACTIVE` meaning only for this TenantIntegration integrity floor.

These write-time facts can become stale after a TenantIntegration row was persisted if the IntegrationDefinition or an enabled IntegrationCapability later changes status or registry membership.

## Determination

One pure server-internal **TenantIntegration Definition/Capability current-set necessary floor** is source-complete:

> Given already-loaded TenantIntegration, exact IntegrationDefinition and IntegrationCapability evidence, determine only whether the migration-0030 Definition/config/enabled-capability predicates still match.

A true result is **not Integration execution authorization, capability authorization, provider selection or OperationContract/event authority**.

## Authorized DD-166 boundary

Implement:

`matchesCurrentTenantIntegrationDefinitionCapabilityFloors(integration, definition, capabilities)`.

It must:

1. require valid integration/definition identity and exact `definition.id === integration.integrationDefinitionId`;
2. require `definition.status === 'ACTIVE'`;
3. require `integration.config` to be a JSON object, not null/array/primitive;
4. require `integration.enabledCapabilities` to be an array of non-empty strings with no duplicates;
5. for every enabled code, require membership in `definition.capabilityCodes`;
6. for every enabled code, require exactly one supplied matching capability evidence row with:
   - exact `integrationDefinitionId === definition.id`;
   - exact `capabilityCode === enabled code`;
   - raw `status === 'ACTIVE'`;
7. permit an empty enabled-capability set when definition/config predicates match;
8. ignore extra capability evidence for codes not enabled by the integration;
9. leave all inputs unchanged.

The "exactly one matching evidence row" rule mirrors the migration-0025 unique tuple `integration_definition_id + capability_code`; duplicate supplied matches fail closed rather than inventing ambiguity resolution.

## Acceptance target

- **INT-SET-CUR-001** — exact ACTIVE definition + object config + one enabled exact ACTIVE capability -> true.
- **INT-SET-CUR-002** — empty enabled-capability set with ACTIVE definition/object config -> true.
- **INT-SET-CUR-003** — wrong Definition id or non-ACTIVE Definition -> false.
- **INT-SET-CUR-004** — null/array/primitive config -> false.
- **INT-SET-CUR-005** — duplicate enabled codes or enabled code absent from Definition capability list -> false.
- **INT-SET-CUR-006** — missing, non-ACTIVE, wrong-definition/wrong-code or ambiguous duplicate matching capability evidence -> false.
- **INT-SET-CUR-007** — TenantIntegration status/credential/scope/health/profile and capability direction/OperationContract/event/data/rate/idempotency metadata remain uninterpreted; extra non-enabled capability evidence does not create/fail acceptance; inputs remain unchanged.

Expected Core delta: +7 tests, from 409 to 416. PostgreSQL/database schema remains unchanged.

## Explicitly unclaimed

DD-166 does **not**:

- decide whether TenantIntegration status itself is executable/current;
- re-evaluate CredentialReference binding/currentness (DD-165 already owns that separate floor);
- re-evaluate SyncCursor binding/currentness (DD-164 already owns that separate floor);
- resolve `permissionProfileId` or health/fallback policy;
- decrypt or semantically interpret config beyond JSON-object shape;
- choose ProviderAdapter/provider/direction;
- execute OperationContracts/events/callbacks/sync;
- apply rate/idempotency/retry/circuit/residency/data-transfer policy;
- access credentials/secrets;
- mutate registry/runtime state or audit/use evidence;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth or Webhook execution boundaries.

## Next dependency boundary

After DD-166, the migration-owned TenantIntegration Definition/config/enabled-capability current-set predicates can be composed with DD-165 credential current binding where a later source-owned integration execution prerequisite explicitly requires that composition. Provider/runtime authority remains separately governed.
