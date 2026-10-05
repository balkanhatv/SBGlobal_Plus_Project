import type { RequestContext } from "../context/contracts.js";
import type {
  EventCatalogReadPort,
  PersistedEventCatalogEntry,
} from "./event-catalog.js";
import type {
  OutboxEventEvidence,
  OutboxEventReadPort,
} from "./outbox-event.js";
import {
  matchesWebhookDeliveryNecessaryFloors,
} from "./webhook-delivery-floors.js";
import type {
  WebhookDeliveryEvidence,
  WebhookDeliveryReadPort,
} from "./webhook-delivery.js";
import type {
  WebhookSubscription,
  WebhookSubscriptionReadPort,
} from "./webhook-subscription.js";

export interface WebhookDeliveryCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly deliveryId: string;
}

export interface WebhookDeliveryCurrentEvidence {
  readonly delivery: WebhookDeliveryEvidence;
  readonly subscription: WebhookSubscription;
  readonly event: OutboxEventEvidence;
  readonly catalog: PersistedEventCatalogEntry;
}

/**
 * DD-508…DD-512: read one visible WebhookDelivery and re-evaluate only its
 * ordinary single-context persisted Subscription/Event/Catalog prerequisites
 * through the existing DD-163 necessary floor.
 *
 * This is evidence-only. Event filters, endpoint safety, signing secrets,
 * retry/DLQ/replay, EXPLICIT_CROSS_CONTEXT dispatch and network delivery remain
 * separately governed and are not authorized here.
 */
export async function loadWebhookDeliveryCurrentEvidence(
  input: WebhookDeliveryCurrentEvidenceReadInput,
  deliveryReader: WebhookDeliveryReadPort,
  subscriptionReader: WebhookSubscriptionReadPort,
  eventReader: OutboxEventReadPort,
  catalogReader: EventCatalogReadPort,
): Promise<WebhookDeliveryCurrentEvidence | null> {
  const delivery = await deliveryReader.loadForContext({
    requestContext: input.requestContext,
    deliveryId: input.deliveryId,
  });
  if (delivery === null) return null;

  const subscription = await subscriptionReader.loadForContext({
    requestContext: input.requestContext,
    subscriptionId: delivery.subscriptionId,
  });
  if (subscription === null || subscription.id !== delivery.subscriptionId) {
    return null;
  }

  const event = await eventReader.loadForContext({
    requestContext: input.requestContext,
    eventId: delivery.eventId,
  });
  if (event === null || event.id !== delivery.eventId) {
    return null;
  }

  const catalog = await catalogReader.loadExact({
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    scopeClass: event.scopeClass,
  });
  if (catalog === null) return null;

  if (!matchesWebhookDeliveryNecessaryFloors(subscription, event, catalog)) {
    return null;
  }

  return Object.freeze({
    delivery,
    subscription,
    event,
    catalog,
  });
}
