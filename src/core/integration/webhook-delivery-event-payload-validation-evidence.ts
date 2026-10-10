import type { JsonObject } from "../api/schema-registry.js";
import {
  EventEnvelopeCatalogValidator,
  type EventPayloadValidatorPort,
  type EventPersistenceBinding,
} from "./event-envelope.js";
import {
  buildWebhookDeliveryEventPrePayloadStructureEvidence,
  type WebhookDeliveryEventPrePayloadStructureEvidence,
} from "./webhook-delivery-event-pre-payload-structure-evidence.js";

export interface WebhookDeliveryEventPayloadValidatedEvidence {
  readonly prePayloadEvidence: WebhookDeliveryEventPrePayloadStructureEvidence;
  readonly envelopeJson: JsonObject;
}

function rebuildExactWebhookPrePayloadEvidence(
  prePayloadEvidence: WebhookDeliveryEventPrePayloadStructureEvidence,
): WebhookDeliveryEventPrePayloadStructureEvidence | null {
  if (!prePayloadEvidence
    || typeof prePayloadEvidence !== "object"
    || !prePayloadEvidence.parent
    || typeof prePayloadEvidence.parent !== "object") {
    return null;
  }

  const rebuilt =
    buildWebhookDeliveryEventPrePayloadStructureEvidence(
      prePayloadEvidence.parent,
    );
  if (rebuilt === null
    || rebuilt.envelopeJson !== prePayloadEvidence.envelopeJson) {
    return null;
  }

  return rebuilt;
}

function projectExactBinding(
  prePayloadEvidence: WebhookDeliveryEventPrePayloadStructureEvidence,
): EventPersistenceBinding | null {
  const event = prePayloadEvidence.parent.parent.parent.event;
  const residency = prePayloadEvidence.parent.currentResidency;

  if (event.scopeClass !== "TENANT_CORE"
    && event.scopeClass !== "TENANT_INDUSTRY") {
    return null;
  }

  return Object.freeze({
    eventId: event.id,
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    scopeClass: event.scopeClass,
    tenantId: event.tenantId,
    ...(event.scopeClass === "TENANT_INDUSTRY"
      ? {industryContextId: event.industryContextId}
      : {}),
    tenantResidencyRegion: residency.residencyRegionCode,
  });
}

/**
 * DD-529: project only the DD-081 persistence-binding facts already proven by
 * exact DD-527 WebhookDelivery source-event pre-payload evidence.
 */
export function projectWebhookDeliveryEventPayloadValidationBinding(
  prePayloadEvidence: WebhookDeliveryEventPrePayloadStructureEvidence,
): EventPersistenceBinding | null {
  if (rebuildExactWebhookPrePayloadEvidence(prePayloadEvidence) === null) {
    return null;
  }

  return projectExactBinding(prePayloadEvidence);
}

/**
 * DD-528/DD-530…DD-532: re-establish exact DD-527 evidence first, then reuse
 * the existing DD-081 EventEnvelopeCatalogValidator with an injected payload
 * validator.
 *
 * This adds no concrete schema engine, EventCatalog lifecycle policy, filter,
 * endpoint/signing/retry/cross-context/network delivery or mutation authority.
 */
export async function validateWebhookDeliveryEventPayloadEvidence(
  prePayloadEvidence: WebhookDeliveryEventPrePayloadStructureEvidence,
  payloadValidator: EventPayloadValidatorPort,
): Promise<WebhookDeliveryEventPayloadValidatedEvidence | null> {
  if (rebuildExactWebhookPrePayloadEvidence(prePayloadEvidence) === null) {
    return null;
  }

  const binding = projectExactBinding(prePayloadEvidence);
  if (binding === null) return null;

  const catalog = prePayloadEvidence.parent.parent.parent.catalog;
  const validator = new EventEnvelopeCatalogValidator(payloadValidator);
  await validator.validate({
    envelope: prePayloadEvidence.envelopeJson,
    catalog,
    binding,
  });

  return Object.freeze({
    prePayloadEvidence,
    envelopeJson: prePayloadEvidence.envelopeJson,
  });
}
