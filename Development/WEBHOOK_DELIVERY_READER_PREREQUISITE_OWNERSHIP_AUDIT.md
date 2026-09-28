# Webhook Delivery PostgreSQL reader prerequisite ownership audit

**Date:** 2026-09-21  
**Baseline:** `d423ab9486cb966cec50c58751794b47911c3806`  
**Scope:** next independent source-complete Integration slice after DD-088.

## Source reconciliation

DD-07 §§5/10–12, DD-17 Events/Webhooks acceptance, migration 0008
`webhook_delivery` schema/FORCE-RLS, migration 0030 delivery-scope integrity and
migration 0028 Integration-service privileges were reconciled with the current
DD-088 dedicated Integration PostgreSQL role boundary.

The persistence contract is exact:

- delivery identity is immutable by `id + created_at + subscription_id + event_id + attempt_no`;
- one subscription/event/attempt number is unique;
- persisted evidence includes endpoint snapshot, payload digest, raw status,
  optional HTTP status, started/completed timestamps, optional next-attempt time,
  optional error class, correlation id and createdAt;
- completedAt cannot precede startedAt;
- delivery scope integrity requires an existing same-Tenant subscription and
  webhook-eligible outbox event;
- TENANT_INDUSTRY events must be in the subscription allowed Industry Context list;
- EXPLICIT_CROSS_CONTEXT events require both endpoints in the subscription list;
- FORCE-RLS exposes a delivery only when both its parent subscription and parent
  outbox event are visible in the current RequestContext;
- migration 0028 already grants the dedicated `sbg_integration_service_rw`
  role read/write access to delivery identity/detail.

## Determination

A concrete **raw Webhook Delivery reader** is source-complete.

It may return persisted attempt evidence to server-side Integration code after the
existing parent-RLS boundary. It must not interpret the raw status/error/http fields
as retryable, permanent, DLQ, successful, authorized or deliverable.

The source does not define one executable runtime vocabulary for delivery `status`
or `error_class` in the persistence schema, nor exact retry timing/exhaustion
values. Those semantics must not be invented at this boundary.

## Authorized implementation boundary

Implement:

1. Core typed `WebhookDeliveryEvidence` / `WebhookDeliveryReadPort`;
2. `PostgresWebhookDeliveryStore` through existing
   `PostgresIntegrationDatabase` + `RequestScopedSql`;
3. one parameterized read by delivery id;
4. exact UUID/attempt/timestamp/text/integer validation and immutable result;
5. null for parent-RLS-hidden / absent deliveries;
6. real PostgreSQL acceptance proving exact Industry-event visibility, sibling
   Industry isolation, Tenant-Core event same-Tenant visibility, raw retry/error
   evidence preservation and malformed/route-context fail-closed behavior.

The reader preserves `status`, `httpStatus`, `nextAttemptAt` and
`errorClass` exactly as persistence evidence. It does not classify them.

No endpoint connection, DNS/IP/redirect resolution, challenge, signature, secret
handling, event-filter evaluator, retry scheduler, DLQ transition, replay,
public route, migration, role, grant or RLS policy is authorized.

Acceptance: WH-DEL-PG-001…005.
