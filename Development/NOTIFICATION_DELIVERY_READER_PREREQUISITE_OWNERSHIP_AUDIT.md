# NotificationDelivery raw PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline checkpoint:** `DEV-SYNC-CURSOR-READ-001`  
**Current promotion head:** `11cefdc14fa610b21378528b7000e172d6a0ec13`  
**Scope:** next independent source-complete Core slice after DD-097.

## Source reconciliation

F-01 Notification/Communication Engine, A-01 Notification module ownership,
migration 0026 `notification_delivery` schema/FORCE-RLS,
migration 0027 `sbg_notification_worker_rw` privileges and
migration 0031 notification relationship integrity were reconciled.

The persisted delivery contract is exact:

- id;
- tenant id / optional Industry Context id;
- scope class TENANT_CORE or TENANT_INDUSTRY;
- optional template id + template version;
- optional recipient principal id;
- optional recipient reference;
- channel EMAIL/SMS/WHATSAPP/PUSH/IN_APP;
- optional TenantIntegration id;
- correlation id;
- optional source event id;
- raw delivery status;
- queued/sent/delivered timestamps;
- optional normalized last error code;
- positive row version.

Physical visibility is FORCE-RLS by Tenant + optional exact Industry Context.
Migration 0031 already constrains active template version/channel/scope, recipient
principal tenancy, TenantIntegration scope/activity, and source-event scope.

## Determination

A concrete **raw NotificationDelivery reader** is source-complete.

A delivery executor/retry/provider decision is not source-complete here. F-01
requires provider routing, priority/failover, retry/queue/DLQ and delivery tracking,
but current repository contracts do not define one generic provider-selection or
retry-state algorithm for all channels.

## Authorized implementation boundary

Implement:

1. immutable typed `PersistedNotificationDelivery`;
2. `NotificationDeliveryReadPort.loadForContext(requestContext,id)`;
3. dedicated `PostgresNotificationDatabase` fixing the existing
   `sbg_notification_worker_rw` NOBYPASSRLS role;
4. `PostgresNotificationDeliveryStore` using `RequestScopedSql`;
5. one parameterized exact read by delivery id;
6. exact UUID/enum/timestamp/positive-row-version validation;
7. null for RLS-hidden / absent rows;
8. PostgreSQL acceptance proving exact Industry visibility, sibling/foreign
   isolation, Tenant Core visibility and raw status/timestamp/error preservation.

The reader may return recipient reference internally exactly as persisted, but it is
not a transport contract. It does not send, retry, choose a provider, read
CredentialReference, resolve secret material, mutate delivery state, or decide
whether FAILED/SUPPRESSED/CANCELLED is retryable/final.

No migration, role, grant, RLS policy, provider SDK, secret access, worker loop,
route or product-policy change is authorized.

Acceptance: NOTIF-DEL-PG-001…005.
