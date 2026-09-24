# NotificationDelivery known relationship floors composition prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-NOTIFICATION-TEMPLATE-CURRENT-BINDING-FLOORS-001`  
**Verified synchronized basis:** `ac421f21acb7bf08cc47bf96bed99ed8949868d4`

## Source reconciliation

Migration 0031 owns independent optional relationships already re-evaluable through:
- DD-168: NotificationDelivery→TenantIntegration id/Tenant/ACTIVE/Industry binding;
- DD-169: NotificationDelivery→OutboxEvent id/Tenant/exact-scope binding;
- DD-171: NotificationDelivery→NotificationTemplate id/version/ACTIVE/channel/scope binding.

The recipient-principal predicate is separately source-incomplete for general later re-evaluation and is locked by `Development/NOTIFICATION_DELIVERY_RECIPIENT_PRINCIPAL_REMAINING_BOUNDARY_AUDIT.md`.

## Determination

One no-new-semantics pure composition is source-complete:

`matchesKnownNotificationDeliveryRelationshipFloors(delivery, integration, event, template)`

It returns true iff DD-168, DD-169 and DD-171 all return true.

This is a **necessary known-relationship floor**, not complete NotificationDelivery integrity and not delivery execution authorization.

## Authorized DD-172 boundary

Implement only the boolean conjunction of the three existing helpers.

Acceptance target:
- **NOTIF-REL-CUR-001** all three floors true -> true;
- **NOTIF-REL-CUR-002** integration floor false -> false;
- **NOTIF-REL-CUR-003** source-event floor false -> false;
- **NOTIF-REL-CUR-004** template floor false -> false;
- **NOTIF-REL-CUR-005** multiple floor failures have no fallback;
- **NOTIF-REL-CUR-006** optional-unbound relationships preserve each underlying helper's rules;
- **NOTIF-REL-CUR-007** recipient/lifecycle/render/provider/send/retry evidence remains uninterpreted and inputs unchanged.

Expected Core delta: +7 tests, 444→451. PostgreSQL remains 497; database inventory remains 48/42.

## Explicitly unclaimed

DD-172 does not:
- validate recipient-principal currentness;
- claim complete NotificationDelivery validity;
- interpret delivery lifecycle/finality;
- render/select/fallback templates;
- choose providers/integrations beyond DD-168's relationship check;
- access secrets;
- dispatch/retry Outbox events;
- send/retry notifications;
- perform network calls;
- change SQL/RLS/roles/grants/routes.
