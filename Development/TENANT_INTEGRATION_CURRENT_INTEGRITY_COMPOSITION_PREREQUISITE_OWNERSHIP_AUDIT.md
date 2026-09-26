# TenantIntegration current-integrity composition prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-TENANT-INTEGRATION-DEFINITION-CAPABILITY-CURRENT-FLOORS-001`  
**Verified synchronized basis:** `9adf2c39122884f63094b1738f6dd56e9d210c54`  
**Scope:** no-new-semantics composition after DD-165 and DD-166.

## Source reconciliation

Migration 0030 `validate_tenant_integration_scope()` owns one write-time TenantIntegration integrity predicate containing both:
- the CredentialReference relationship/currentness checks now re-evaluable through DD-165; and
- the IntegrationDefinition/config/enabled-capability checks now re-evaluable through DD-166.

The trigger does not require TenantIntegration lifecycle status `ACTIVE` and does not authorize provider/network execution. DD-165 and DD-166 deliberately preserve that boundary.

## Determination

One pure **TenantIntegration current-integrity necessary-floor composition** is source-complete:

> return true only when the DD-165 CredentialReference current-binding floor and the DD-166 Definition/config/enabled-capability current-set floor both return true for the same already-loaded TenantIntegration evidence.

No new primitive predicate is authorized. There is no partial-success fallback or precedence.

## Authorized DD-167 boundary

Implement:

`matchesCurrentTenantIntegrationIntegrityFloors(integration, credential, evaluatedAt, definition, capabilities)`.

It must:
1. delegate exactly to DD-165 and DD-166 bounded helpers;
2. return true iff both helpers return true;
3. add no TenantIntegration status/health/profile/provider/secret/network interpretation;
4. remain deterministic, side-effect free and non-mutating.

## Acceptance target

- **INT-INTEGRITY-001** — both DD-165 and DD-166 floors true -> true.
- **INT-INTEGRITY-002** — DD-165 credential floor false -> false even when DD-166 matches.
- **INT-INTEGRITY-003** — DD-166 Definition/capability floor false -> false even when DD-165 matches.
- **INT-INTEGRITY-004** — both floors false -> false; no fallback.
- **INT-INTEGRITY-005** — Tenant-Core and Tenant-Industry positive paths preserve the exact underlying DD-165/DD-166 rules.
- **INT-INTEGRITY-006** — expiry/currentness evaluation remains supplied only to DD-165; Definition/capability evidence cannot override an expired credential.
- **INT-INTEGRITY-007** — TenantIntegration lifecycle/health/profile plus provider/secret/OperationContract/event/network evidence remain uninterpreted and inputs remain unchanged.

Expected Core delta: +7 tests, from 416 to 423. PostgreSQL/schema inventory remains unchanged.

## Explicitly unclaimed

DD-167 does not:
- make TenantIntegration `ACTIVE`, executable or healthy;
- resolve permission profiles;
- access secret locators/material or rotation policy;
- select ProviderAdapter/provider/direction;
- authorize SyncCursor resume/synchronization;
- execute OperationContracts/events/callbacks/network;
- apply rate/retry/circuit/residency/data-transfer policy;
- widen DD-162 machine-auth or DD-163 Webhook execution;
- change SQL/RLS/roles/grants/routes.

## Next boundary

After DD-167, migration-0030 TenantIntegration write-time integrity is re-evaluable as one bounded current necessary floor. Any step from that floor to executable Integration authority requires separately source-owned lifecycle, profile, provider/secret and execution semantics.
