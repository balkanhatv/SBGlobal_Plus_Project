import type { OutboxEventEvidence } from "../integration/outbox-event.js";
import type { PersistedNotificationDelivery } from "./delivery.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Re-evaluates only migration-0031's optional NotificationDelivery ->
 * OutboxEvent source-event id/Tenant/exact-scope relationship.
 *
 * A true result is not event readiness, dispatch, retry, notification delivery,
 * payload interpretation or Webhook authorization.
 */
export function matchesNotificationDeliverySourceEventBindingFloors(
  delivery: PersistedNotificationDelivery,
  event?: OutboxEventEvidence,
): boolean {
  if (!isUuid(delivery.id) || !isUuid(delivery.tenantId)) return false;

  if (delivery.scopeClass === "TENANT_CORE") {
    if (delivery.industryContextId !== undefined) return false;
  } else if (delivery.scopeClass === "TENANT_INDUSTRY") {
    if (!isUuid(delivery.industryContextId)) return false;
  } else {
    return false;
  }

  if (delivery.sourceEventId === undefined) {
    return event === undefined;
  }

  if (
    !isUuid(delivery.sourceEventId)
    || event === undefined
    || !isUuid(event.id)
    || !isUuid(event.tenantId)
    || event.id !== delivery.sourceEventId
    || event.tenantId !== delivery.tenantId
    || event.scopeClass !== delivery.scopeClass
  ) {
    return false;
  }

  if (delivery.scopeClass === "TENANT_CORE") {
    return event.industryContextId === undefined;
  }

  return isUuid(event.industryContextId)
    && event.industryContextId === delivery.industryContextId;
}
