import type { RequestContext } from "../context/contracts.js";
import type { EventCatalogReadPort } from "./event-catalog.js";
import type { EventPayloadValidatorPort } from "./event-envelope.js";
import type {
  IntegrationTenantResidencyReadPort,
} from "./tenant-residency.js";
import type { OutboxEventReadPort } from "./outbox-event.js";
import {
  loadWebhookDeliveryEventCurrentResidencyEvidence,
} from "./webhook-delivery-event-current-residency-evidence-reader.js";
import {
  validateWebhookDeliveryEventPayloadEvidence,
  type WebhookDeliveryEventPayloadValidatedEvidence,
} from "./webhook-delivery-event-payload-validation-evidence.js";
import {
  buildWebhookDeliveryEventPrePayloadStructureEvidence,
} from "./webhook-delivery-event-pre-payload-structure-evidence.js";
import type { WebhookDeliveryReadPort } from "./webhook-delivery.js";
import type { WebhookSubscriptionReadPort } from "./webhook-subscription.js";

export interface WebhookDeliveryEventPayloadValidatedReadInput {
  readonly requestContext: RequestContext;
  readonly deliveryId: string;
}

/**
 * DD-533…DD-537: compose only the already-governed WebhookDelivery source-event
 * evidence boundaries in their canonical parent-first order:
 *
 * DD-522 current-residency reader
 *   -> DD-527 pre-payload structure
 *   -> DD-532 injected DD-081 payload validation.
 *
 * No EventCatalog lifecycle, filter, endpoint/SSRF, signing, readiness/retry,
 * cross-context, network/dispatch or mutation authority is created.
 */
export async function loadWebhookDeliveryEventPayloadValidatedEvidence(
  input: WebhookDeliveryEventPayloadValidatedReadInput,
  deliveryReader: WebhookDeliveryReadPort,
  subscriptionReader: WebhookSubscriptionReadPort,
  eventReader: OutboxEventReadPort,
  catalogReader: EventCatalogReadPort,
  residencyReader: IntegrationTenantResidencyReadPort,
  payloadValidator: EventPayloadValidatorPort,
): Promise<WebhookDeliveryEventPayloadValidatedEvidence | null> {
  const currentResidencyEvidence =
    await loadWebhookDeliveryEventCurrentResidencyEvidence(
      input,
      deliveryReader,
      subscriptionReader,
      eventReader,
      catalogReader,
      residencyReader,
    );
  if (currentResidencyEvidence === null) return null;

  const prePayloadEvidence =
    buildWebhookDeliveryEventPrePayloadStructureEvidence(
      currentResidencyEvidence,
    );
  if (prePayloadEvidence === null) return null;

  return validateWebhookDeliveryEventPayloadEvidence(
    prePayloadEvidence,
    payloadValidator,
  );
}
