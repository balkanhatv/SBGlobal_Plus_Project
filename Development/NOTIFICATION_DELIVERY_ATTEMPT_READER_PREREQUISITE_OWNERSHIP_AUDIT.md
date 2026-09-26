# NotificationDeliveryAttempt PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-22  
**Baseline:** `767cf302ca0038a6945b32657ad029abac25fa06`  
**Scope:** next independent source-complete Notification persistence slice after DD-098.

## Source reconciliation

A-06 notification/provider boundaries, DD-06 provider normalization rules, DD-15
operational evidence, DD-17 current acceptance, migration 0026
`notification_delivery_attempt` schema/FORCE-RLS parent policy and migration 0027
Notification worker privileges were reconciled with DD-098's dedicated
`sbg_notification_worker_rw` PostgreSQL boundary.

The persistence contract is exact:

- each attempt belongs to one NotificationDelivery;
- `attempt_no` is a positive integer and unique per delivery;
- provider message reference is optional raw evidence;
- normalized status is required raw text;
- normalized error code is optional raw text;
- `started_at` is required;
- `completed_at` is optional and cannot precede `started_at`;
- attempt rows are parent-scoped by FORCE-RLS through the visible
  NotificationDelivery;
- runtime roles may SELECT/INSERT attempts but may not UPDATE/DELETE them.

## Determination

A concrete **raw NotificationDeliveryAttempt reader** is source-complete.

A retry/finality evaluator is not source-complete in this slice. A-06/DD-06 require
normalized provider state and retry-class behavior, but the repository does not yet
bind the exact Notification provider retry policy, terminality mapping, backoff
schedule or provider SDK behavior to these raw rows. Those semantics must not be
invented.

## Authorized implementation boundary

Implement:

1. a Core typed `NotificationDeliveryAttempt` /
   `NotificationDeliveryAttemptReadPort` contract;
2. `PostgresNotificationDeliveryAttemptStore` using the existing DD-098
   `PostgresNotificationDatabase` + `RequestScopedSql`;
3. an exact read by delivery id ordered by `attempt_no`;
4. UUID / positive-integer / text / timestamp validation and immutable results;
5. empty result for RLS-hidden / absent parent delivery;
6. real PostgreSQL acceptance proving exact Industry visibility, sibling isolation,
   Tenant Core visibility, foreign-Tenant isolation and raw evidence fidelity.

The reader preserves provider reference, normalized status/error and timestamps
exactly. It does not decide retryability, finality, next attempt, backoff, provider
selection, credential use, send permission or worker scheduling.

No migration, role, grant, RLS policy, provider runtime, secret access, route or
product-policy change is authorized.

Acceptance: NOTIF-ATT-PG-001…006.
