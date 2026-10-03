# NotificationDelivery TenantIntegration current-binding floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-TENANT-INTEGRATION-CURRENT-INTEGRITY-FLOORS-001`  
**Verified synchronized basis:** `a83c0013a56c565171d8b9674f924ab8863b9730`  
**Scope:** next independent source-complete notification prerequisite after DD-167.

## Source reconciliation

F-01/A-01 Notification ownership, DD-098 raw NotificationDelivery reader, DD-095 raw TenantIntegration reader, migration 0026 notification persistence and migration 0031 `validate_notification_relationships()` were reconciled.

Migration 0031 owns one exact deterministic relationship predicate when a NotificationDelivery carries `tenant_integration_id`:

- the referenced TenantIntegration must exist;
- its Tenant id must exactly equal the NotificationDelivery Tenant id;
- its raw status must be exactly `ACTIVE`;
- a Tenant-wide integration (null Industry Context) may serve same-Tenant Core or Industry delivery;
- an Industry-scoped integration may serve only the exact same NotificationDelivery Industry Context.

When `tenant_integration_id` is absent, migration 0031 does not require an integration binding.

DD-098 and DD-095 expose exactly the immutable raw evidence needed to re-evaluate this relationship. The existing Notification audit explicitly states that provider routing, retry, queue/DLQ and delivery execution are not source-complete at the raw-reader boundary.

## Determination

One pure **NotificationDelivery→TenantIntegration current-binding necessary floor** is source-complete:

> Given one already-loaded NotificationDelivery and optional already-loaded TenantIntegration evidence, determine only whether migration-0031's optional integration id/Tenant/status/Industry binding still matches.

A true result is **not notification send authorization, provider selection or retry authority**.

## Authorized DD-168 boundary

Implement:

`matchesNotificationDeliveryIntegrationBindingFloors(delivery, integration)`.

It must:

1. require valid NotificationDelivery id/Tenant identity and valid TENANT_CORE/TENANT_INDUSTRY ownership shape;
2. when `delivery.tenantIntegrationId` is absent:
   - require `integration === undefined`;
   - return true after delivery ownership-shape validation;
3. when `delivery.tenantIntegrationId` is present:
   - require valid integration id/Tenant identity;
   - require exact `integration.id === delivery.tenantIntegrationId`;
   - require exact `integration.tenantId === delivery.tenantId`;
   - require raw `integration.status === 'ACTIVE'`;
   - if integration Industry Context is absent, allow same-Tenant Tenant-Core or Tenant-Industry delivery;
   - if integration Industry Context is present, require valid UUID and exact equality to delivery Industry Context;
4. fail closed if extra integration evidence is supplied when the delivery has no integration id;
5. leave all inputs unchanged.

This helper mirrors only migration 0031. It must not automatically compose DD-167 current-integrity evidence because migration 0031 does not re-evaluate CredentialReference/Definition/capability integrity for notification relationship writes.

## Acceptance target

- **NOTIF-INT-CUR-001** — delivery without TenantIntegration id and no integration evidence -> true.
- **NOTIF-INT-CUR-002** — same-Tenant ACTIVE Tenant-wide integration may bind Tenant-Core and Tenant-Industry delivery -> true.
- **NOTIF-INT-CUR-003** — same-Tenant ACTIVE Industry integration binds only exact Industry delivery -> true; sibling/Core mismatch -> false.
- **NOTIF-INT-CUR-004** — wrong integration id or foreign Tenant -> false.
- **NOTIF-INT-CUR-005** — PENDING/PAUSED/ERROR/REVOKED integration -> false.
- **NOTIF-INT-CUR-006** — malformed delivery/integration ownership or unexpected integration evidence for unbound delivery -> false.
- **NOTIF-INT-CUR-007** — delivery channel/template/recipient/status/timestamps/error plus integration definition/credential/config/capabilities/health/profile remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 423 to 430. PostgreSQL/schema inventory remains unchanged.

## Explicitly unclaimed

DD-168 does **not**:

- send or retry a notification;
- choose channel provider, ProviderAdapter or CredentialReference;
- access secret locators/material;
- interpret notification delivery lifecycle/retry/finality;
- validate template/recipient/source-event relationships;
- compose DD-167 Integration current-integrity automatically;
- resolve permission profiles or health/fallback policy;
- execute callbacks/OperationContracts/events/network calls;
- mutate NotificationDelivery/TenantIntegration state;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook or SyncCursor execution boundaries.

## Next dependency boundary

After DD-168, notification integration relationship currentness is re-evaluable without inventing provider execution. Template, recipient and source-event relationship predicates remain independently source-owned by migration 0031 and may be audited separately if their current evidence sources are complete.
