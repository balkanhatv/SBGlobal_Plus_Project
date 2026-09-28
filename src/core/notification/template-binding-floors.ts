import type { PersistedNotificationDelivery } from "./delivery.js";
import type { PersistedNotificationTemplate } from "./template.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isPositiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

/**
 * Re-evaluates only migration-0031's optional NotificationDelivery ->
 * NotificationTemplate id/version/status/channel/scope relationship.
 *
 * A true result is not template selection/rendering, locale fallback,
 * provider selection, send, retry, secret or network authorization.
 */
export function matchesNotificationDeliveryTemplateBindingFloors(
  delivery: PersistedNotificationDelivery,
  template?: PersistedNotificationTemplate,
): boolean {
  if (!isUuid(delivery.id) || !isUuid(delivery.tenantId)) return false;

  if (delivery.scopeClass === "TENANT_CORE") {
    if (delivery.industryContextId !== undefined) return false;
  } else if (delivery.scopeClass === "TENANT_INDUSTRY") {
    if (!isUuid(delivery.industryContextId)) return false;
  } else {
    return false;
  }

  if (delivery.templateId === undefined) {
    return delivery.templateVersion === undefined && template === undefined;
  }

  if (
    !isUuid(delivery.templateId)
    || !isPositiveSafeInteger(delivery.templateVersion)
    || template === undefined
    || !isUuid(template.id)
    || template.id !== delivery.templateId
    || template.version !== delivery.templateVersion
    || template.status !== "ACTIVE"
    || template.channel !== delivery.channel
  ) {
    return false;
  }

  if (template.ownerScope === "PLATFORM") {
    return template.tenantId === undefined
      && template.industryContextId === undefined;
  }

  if (template.ownerScope === "TENANT") {
    return isUuid(template.tenantId)
      && template.tenantId === delivery.tenantId
      && template.industryContextId === undefined;
  }

  if (template.ownerScope === "INDUSTRY") {
    return isUuid(template.tenantId)
      && template.tenantId === delivery.tenantId
      && isUuid(template.industryContextId)
      && delivery.scopeClass === "TENANT_INDUSTRY"
      && template.industryContextId === delivery.industryContextId;
  }

  return false;
}
