import type { PersistedTenantIntegration } from "../integration/tenant-integration.js";
import type { OutboxEventEvidence } from "../integration/outbox-event.js";
import type { PersistedNotificationDelivery } from "./delivery.js";
import type { PersistedNotificationTemplate } from "./template.js";
import {
  matchesNotificationDeliveryIntegrationBindingFloors,
} from "./integration-binding-floors.js";
import {
  matchesNotificationDeliverySourceEventBindingFloors,
} from "./source-event-binding-floors.js";
import {
  matchesNotificationDeliveryTemplateBindingFloors,
} from "./template-binding-floors.js";

/**
 * Composes only the already-governed DD-168, DD-169 and DD-171 persisted
 * NotificationDelivery relationship floors.
 *
 * Recipient-principal currentness is intentionally not included because its
 * later re-evaluation is source-incomplete. A true result is therefore only a
 * known-relationship necessary floor, not complete delivery validity.
 */
export function matchesKnownNotificationDeliveryRelationshipFloors(
  delivery: PersistedNotificationDelivery,
  integration?: PersistedTenantIntegration,
  event?: OutboxEventEvidence,
  template?: PersistedNotificationTemplate,
): boolean {
  return matchesNotificationDeliveryIntegrationBindingFloors(
    delivery,
    integration,
  )
    && matchesNotificationDeliverySourceEventBindingFloors(delivery, event)
    && matchesNotificationDeliveryTemplateBindingFloors(delivery, template);
}
