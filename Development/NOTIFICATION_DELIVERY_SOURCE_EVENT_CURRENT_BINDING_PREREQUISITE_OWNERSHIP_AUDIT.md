# NotificationDelivery OutboxEvent current-binding floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-NOTIFICATION-INTEGRATION-CURRENT-BINDING-FLOORS-001`  
**Verified synchronized basis:** `7884133b656975685e23f75c3a9abd273fa6626d`  
**Scope:** next independent source-complete notification prerequisite after DD-168.

## Source reconciliation

DD-098 raw NotificationDelivery reader, DD-090 raw OutboxEvent reader, migration 0026 notification persistence and migration 0031 `validate_notification_relationships()` were reconciled.

Migration 0031 owns one exact deterministic relationship predicate when a NotificationDelivery carries `source_event_id`:

- the referenced OutboxEvent must exist;
- its Tenant id must exactly equal the NotificationDelivery Tenant id;
- its scope class must exactly equal the NotificationDelivery scope class;
- its nullable Industry Context must be exactly equal to the NotificationDelivery Industry Context using SQL `IS DISTINCT FROM` semantics.

When `source_event_id` is absent, migration 0031 does not require an OutboxEvent relationship.

DD-098 and DD-090 expose the immutable raw evidence needed to re-evaluate this relationship. DD-090 deliberately preserves dispatcher status/attempt/availability/lock/error evidence without turning those facts into dispatch or retry authority.

## Determination

One pure **NotificationDelivery→OutboxEvent current-binding necessary floor** is source-complete:

> Given one already-loaded NotificationDelivery and optional already-loaded OutboxEvent evidence, determine only whether migration-0031's optional source-event id/Tenant/exact-scope relationship still matches.

A true result is **not event readiness, dispatch, retry, delivery, payload-schema or Webhook authority**.

## Authorized DD-169 boundary

Implement:

`matchesNotificationDeliverySourceEventBindingFloors(delivery, event)`.

It must:

1. require valid NotificationDelivery id/Tenant identity and valid TENANT_CORE/TENANT_INDUSTRY ownership shape;
2. when `delivery.sourceEventId` is absent:
   - require `event === undefined`;
   - return true after delivery ownership-shape validation;
3. when `delivery.sourceEventId` is present:
   - require valid OutboxEvent id/Tenant identity;
   - require exact `event.id === delivery.sourceEventId`;
   - require exact `event.tenantId === delivery.tenantId`;
   - require exact `event.scopeClass === delivery.scopeClass`;
   - require exact nullable Industry Context equality:
     - TENANT_CORE => both Industry Contexts absent;
     - TENANT_INDUSTRY => both valid UUIDs and exact equality;
4. fail closed if extra event evidence is supplied when the delivery has no source event id;
5. leave all inputs unchanged.

This helper mirrors only migration 0031. It must not interpret OutboxEvent status, `availableAt`, lock/attempt state, EventCatalog eligibility, payload/envelope content or retry/finality.

## Acceptance target

- **NOTIF-EVT-CUR-001** — delivery without source event id and no event evidence -> true.
- **NOTIF-EVT-CUR-002** — exact same-Tenant TENANT_CORE event binding -> true.
- **NOTIF-EVT-CUR-003** — exact same-Tenant TENANT_INDUSTRY event binding -> true; sibling Industry fails.
- **NOTIF-EVT-CUR-004** — wrong event id, foreign Tenant or scope-class mismatch -> false.
- **NOTIF-EVT-CUR-005** — PLATFORM_GLOBAL or EXPLICIT_CROSS_CONTEXT event evidence cannot satisfy a NotificationDelivery binding.
- **NOTIF-EVT-CUR-006** — malformed delivery/event ownership or unexpected event evidence for unbound delivery -> false.
- **NOTIF-EVT-CUR-007** — event type/version/aggregate/envelope/status/attempt/availability/lock/error plus delivery channel/template/recipient/status/timestamps remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 430 to 437. PostgreSQL/schema inventory remains unchanged.

## Explicitly unclaimed

DD-169 does **not**:

- decide whether an OutboxEvent is dispatch-ready;
- claim/lease/lock/increment/retry/dead-letter/replay an event;
- interpret event payload/envelope schemas;
- validate EventCatalog status or webhook eligibility;
- send/retry a notification;
- choose notification provider/adapter;
- access CredentialReference or secret material;
- validate template/recipient/TenantIntegration current integrity;
- execute callbacks/OperationContracts/events/network calls;
- mutate NotificationDelivery/OutboxEvent state;
- change SQL/RLS/roles/grants/routes;
- widen machine-auth, Webhook or SyncCursor execution boundaries.

## Next dependency boundary

After DD-169, migration-0031 notification source-event exact-scope relationship currentness is re-evaluable. Template and recipient relationship predicates remain independent; delivery execution remains blocked unless separately source-owned.
