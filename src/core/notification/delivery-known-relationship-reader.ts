import type { RequestContext } from "../context/contracts.js";
import type {
  OutboxEventEvidence,
  OutboxEventReadPort,
} from "../integration/outbox-event.js";
import type {
  PersistedTenantIntegration,
  TenantIntegrationReadPort,
} from "../integration/tenant-integration.js";
import type {
  NotificationTemplateReadPort,
  PersistedNotificationTemplate,
} from "./template.js";
import type { PersistedNotificationDelivery } from "./delivery.js";
import {
  matchesKnownNotificationDeliveryRelationshipFloors,
} from "./known-relationship-floors.js";

export interface NotificationDeliveryKnownRelationshipReadInput {
  readonly requestContext: RequestContext;
  readonly delivery: PersistedNotificationDelivery;
}

export interface NotificationDeliveryKnownRelationshipEvidence {
  readonly delivery: PersistedNotificationDelivery;
  readonly integration?: PersistedTenantIntegration;
  readonly event?: OutboxEventEvidence;
  readonly template?: PersistedNotificationTemplate;
}

/**
 * DD-298…DD-302: conditionally load only the exact relationships already named
 * by an already-visible NotificationDelivery, under the exact supplied
 * RequestContext, then re-apply DD-172 known-relationship floors.
 *
 * No parent re-read, fallback/latest lookup, recipient-currentness check,
 * rendering, provider selection, credential access, retry or send authority is
 * introduced here.
 */
export async function loadNotificationDeliveryKnownRelationshipEvidence(
  input: NotificationDeliveryKnownRelationshipReadInput,
  integrationReader: TenantIntegrationReadPort,
  eventReader: OutboxEventReadPort,
  templateReader: NotificationTemplateReadPort,
): Promise<NotificationDeliveryKnownRelationshipEvidence | null> {
  const requestContext = input.requestContext;
  const delivery = input.delivery;

  const integration = delivery.tenantIntegrationId === undefined
    ? undefined
    : await integrationReader.loadForContext({
        requestContext,
        tenantIntegrationId: delivery.tenantIntegrationId,
      });

  const event = delivery.sourceEventId === undefined
    ? undefined
    : await eventReader.loadForContext({
        requestContext,
        eventId: delivery.sourceEventId,
      });

  const template = delivery.templateId === undefined
    ? undefined
    : await templateReader.loadForContext({
        requestContext,
        notificationTemplateId: delivery.templateId,
      });

  if (!matchesKnownNotificationDeliveryRelationshipFloors(
    delivery,
    integration ?? undefined,
    event ?? undefined,
    template ?? undefined,
  )) {
    return null;
  }

  return Object.freeze({
    delivery,
    ...(integration === undefined || integration === null
      ? {}
      : {integration}),
    ...(event === undefined || event === null
      ? {}
      : {event}),
    ...(template === undefined || template === null
      ? {}
      : {template}),
  });
}
