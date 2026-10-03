import type { PersistedTenantIntegration } from "../integration/tenant-integration.js";
import type { PersistedNotificationDelivery } from "./delivery.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Re-evaluates only migration-0031's optional NotificationDelivery ->
 * TenantIntegration id/Tenant/status/Industry binding.
 *
 * A true result is not notification send, retry, provider, secret or network
 * authorization and does not compose DD-167 current-integrity automatically.
 */
export function matchesNotificationDeliveryIntegrationBindingFloors(
  delivery: PersistedNotificationDelivery,
  integration?: PersistedTenantIntegration,
): boolean {
  if (!isUuid(delivery.id) || !isUuid(delivery.tenantId)) return false;

  if (delivery.scopeClass === "TENANT_CORE") {
    if (delivery.industryContextId !== undefined) return false;
  } else if (delivery.scopeClass === "TENANT_INDUSTRY") {
    if (!isUuid(delivery.industryContextId)) return false;
  } else {
    return false;
  }

  if (delivery.tenantIntegrationId === undefined) {
    return integration === undefined;
  }

  if (
    !isUuid(delivery.tenantIntegrationId)
    || integration === undefined
    || !isUuid(integration.id)
    || !isUuid(integration.tenantId)
    || integration.id !== delivery.tenantIntegrationId
    || integration.tenantId !== delivery.tenantId
    || integration.status !== "ACTIVE"
  ) {
    return false;
  }

  if (integration.industryContextId === undefined) return true;

  return isUuid(integration.industryContextId)
    && integration.industryContextId === delivery.industryContextId;
}
