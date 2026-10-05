import type { RequestContext } from "../context/contracts.js";
import type { EventCatalogReadPort } from "./event-catalog.js";
import type { OutboxEventReadPort } from "./outbox-event.js";
import {
  type IntegrationTenantResidencyEvidence,
  type IntegrationTenantResidencyReadPort,
  matchesPersistedOutboxEventCurrentTenantResidencyFloors,
} from "./tenant-residency.js";
import {
  loadWebhookDeliveryEventEnvelopeCurrentEvidence,
  type WebhookDeliveryEventEnvelopeCurrentEvidence,
} from "./webhook-delivery-event-envelope-current-evidence-reader.js";
import type { WebhookDeliveryReadPort } from "./webhook-delivery.js";
import type { WebhookSubscriptionReadPort } from "./webhook-subscription.js";

export interface WebhookDeliveryEventCurrentResidencyEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly deliveryId: string;
}

export interface WebhookDeliveryEventCurrentResidencyEvidence {
  readonly parent: WebhookDeliveryEventEnvelopeCurrentEvidence;
  readonly currentResidency: IntegrationTenantResidencyEvidence;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * DD-518…DD-522: reuse exact DD-517 Webhook event-envelope evidence and add
 * only current authoritative Tenant residency equality through the Integration
 * service read boundary.
 *
 * This is current-residency evidence only. It is not historical residency,
 * payload validation, filter/endpoint/signing/retry/cross-context/network or
 * delivery authority.
 */
export async function loadWebhookDeliveryEventCurrentResidencyEvidence(
  input: WebhookDeliveryEventCurrentResidencyEvidenceReadInput,
  deliveryReader: WebhookDeliveryReadPort,
  subscriptionReader: WebhookSubscriptionReadPort,
  eventReader: OutboxEventReadPort,
  catalogReader: EventCatalogReadPort,
  residencyReader: IntegrationTenantResidencyReadPort,
): Promise<WebhookDeliveryEventCurrentResidencyEvidence | null> {
  const parent = await loadWebhookDeliveryEventEnvelopeCurrentEvidence(
    input,
    deliveryReader,
    subscriptionReader,
    eventReader,
    catalogReader,
  );
  if (parent === null) return null;

  const tenantId = parent.parent.event.tenantId;
  if (typeof tenantId !== "string" || !UUID_PATTERN.test(tenantId)) return null;

  const currentResidency = await residencyReader.loadCurrentForContext({
    requestContext: input.requestContext,
    tenantId,
  });
  if (currentResidency === null) return null;

  if (!matchesPersistedOutboxEventCurrentTenantResidencyFloors(
    parent.parent.event,
    parent.parent.catalog,
    currentResidency,
  )) {
    return null;
  }

  return Object.freeze({
    parent,
    currentResidency,
  });
}
