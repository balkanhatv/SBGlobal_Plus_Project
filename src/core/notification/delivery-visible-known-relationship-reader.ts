import type { RequestContext } from "../context/contracts.js";
import type {
  OutboxEventReadPort,
} from "../integration/outbox-event.js";
import type {
  TenantIntegrationReadPort,
} from "../integration/tenant-integration.js";
import type {
  NotificationTemplateReadPort,
} from "./template.js";
import type {
  NotificationDeliveryReadPort,
} from "./delivery.js";
import {
  loadNotificationDeliveryKnownRelationshipEvidence,
  type NotificationDeliveryKnownRelationshipEvidence,
} from "./delivery-known-relationship-reader.js";

export interface VisibleNotificationDeliveryKnownRelationshipReadInput {
  readonly requestContext: RequestContext;
  readonly notificationDeliveryId: string;
}

/**
 * DD-303…DD-307: parent-first RequestContext-scoped NotificationDelivery
 * visibility composition followed by the already-governed DD-302 known
 * relationship reader.
 *
 * - load the exact parent first through DD-098;
 * - stop on hidden/absent parent;
 * - propagate reader dependency errors unchanged;
 * - after a visible parent, delegate the exact RequestContext and exact parent
 *   reference into DD-302 with the supplied relationship ports unchanged.
 *
 * This boundary adds no recipient-currentness, lifecycle/finality, rendering,
 * provider/credential, retry, dispatch, scheduling, send or mutation authority.
 */
export async function loadVisibleNotificationDeliveryKnownRelationshipEvidence(
  input: VisibleNotificationDeliveryKnownRelationshipReadInput,
  deliveryReader: NotificationDeliveryReadPort,
  integrationReader: TenantIntegrationReadPort,
  eventReader: OutboxEventReadPort,
  templateReader: NotificationTemplateReadPort,
): Promise<NotificationDeliveryKnownRelationshipEvidence | null> {
  const requestContext = input.requestContext;
  const notificationDeliveryId = input.notificationDeliveryId;

  const delivery = await deliveryReader.loadForContext({
    requestContext,
    notificationDeliveryId,
  });
  if (delivery === null) return null;

  return loadNotificationDeliveryKnownRelationshipEvidence(
    {requestContext, delivery},
    integrationReader,
    eventReader,
    templateReader,
  );
}
