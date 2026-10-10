import type { JsonObject } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";
import type { EventCatalogReadPort } from "./event-catalog.js";
import {
  matchesPersistedOutboxEventEnvelopeEvidenceFloors,
} from "./outbox-event-envelope-floors.js";
import type { OutboxEventReadPort } from "./outbox-event.js";
import {
  loadWebhookDeliveryCurrentEvidence,
  type WebhookDeliveryCurrentEvidence,
} from "./webhook-delivery-current-evidence-reader.js";
import type { WebhookDeliveryReadPort } from "./webhook-delivery.js";
import type { WebhookSubscriptionReadPort } from "./webhook-subscription.js";

export interface WebhookDeliveryEventEnvelopeCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly deliveryId: string;
}

export interface WebhookDeliveryEventEnvelopeCurrentEvidence {
  readonly parent: WebhookDeliveryCurrentEvidence;
  readonly envelopeJson: JsonObject;
}

/**
 * DD-513…DD-517: reuse exact DD-512 WebhookDelivery evidence and add only
 * locally re-evaluable persisted Outbox envelope/catalog coherence.
 *
 * No additional reads occur after DD-512. Current residency, payload-schema
 * execution, event-filter/endpoint/signing/retry/dispatch/network authority and
 * mutation remain separately governed.
 */
export async function loadWebhookDeliveryEventEnvelopeCurrentEvidence(
  input: WebhookDeliveryEventEnvelopeCurrentEvidenceReadInput,
  deliveryReader: WebhookDeliveryReadPort,
  subscriptionReader: WebhookSubscriptionReadPort,
  eventReader: OutboxEventReadPort,
  catalogReader: EventCatalogReadPort,
): Promise<WebhookDeliveryEventEnvelopeCurrentEvidence | null> {
  const parent = await loadWebhookDeliveryCurrentEvidence(
    input,
    deliveryReader,
    subscriptionReader,
    eventReader,
    catalogReader,
  );
  if (parent === null) return null;

  if (!matchesPersistedOutboxEventEnvelopeEvidenceFloors(
    parent.event,
    parent.catalog,
  )) {
    return null;
  }

  return Object.freeze({
    parent,
    envelopeJson: parent.event.envelopeJson,
  });
}
