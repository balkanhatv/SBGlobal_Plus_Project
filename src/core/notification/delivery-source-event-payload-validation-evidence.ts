import {
  EventEnvelopeCatalogValidator,
  type EventPayloadValidatorPort,
  type EventPersistenceBinding,
} from "../integration/event-envelope.js";
import {
  buildNotificationDeliverySourceEventPrePayloadStructureEvidence,
  matchesNotificationDeliverySourceEventPrePayloadStructureFloors,
  type NotificationDeliverySourceEventPrePayloadStructureComposedEvidence,
} from "./delivery-source-event-pre-payload-structure-evidence.js";
import type {
  NotificationTenantResidencyEvidence,
} from "./delivery-source-event-current-residency-evidence-reader.js";
import type {
  NotificationDeliverySourceEventEnvelopeEvidence,
} from "./delivery-source-event-envelope-evidence.js";

export interface NotificationDeliverySourceEventPayloadValidatedEvidence {
  readonly prePayloadEvidence:
    NotificationDeliverySourceEventPrePayloadStructureComposedEvidence;
  readonly sourceEventEnvelope?: NotificationDeliverySourceEventEnvelopeEvidence;
}

/**
 * DD-344: project only the DD-081 persistence-binding facts already proven by
 * the NotificationDelivery source-event evidence chain.
 */
export function projectNotificationDeliverySourceEventPayloadValidationBinding(
  sourceEventEnvelope: NotificationDeliverySourceEventEnvelopeEvidence,
  residency: NotificationTenantResidencyEvidence,
): EventPersistenceBinding | null {
  if (!matchesNotificationDeliverySourceEventPrePayloadStructureFloors(
    sourceEventEnvelope,
    residency,
  )) {
    return null;
  }

  const event = sourceEventEnvelope.event;
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
 * DD-343/DD-345…DD-347: re-establish exact DD-342 evidence first, then reuse
 * the existing DD-081 EventEnvelopeCatalogValidator with an injected payload
 * validator. No concrete schema engine, catalog lifecycle decision, read,
 * dispatch or mutation authority is introduced.
 */
export async function validateNotificationDeliverySourceEventPayloadEvidence(
  prePayloadEvidence:
    NotificationDeliverySourceEventPrePayloadStructureComposedEvidence,
  payloadValidator: EventPayloadValidatorPort,
): Promise<NotificationDeliverySourceEventPayloadValidatedEvidence | null> {
  if (!prePayloadEvidence
    || typeof prePayloadEvidence !== "object"
    || !prePayloadEvidence.consumerMetadataEvidence
    || typeof prePayloadEvidence.consumerMetadataEvidence !== "object") {
    return null;
  }

  const rebuilt =
    buildNotificationDeliverySourceEventPrePayloadStructureEvidence(
      prePayloadEvidence.consumerMetadataEvidence,
    );

  if (!rebuilt
    || rebuilt.sourceEventEnvelope !== prePayloadEvidence.sourceEventEnvelope) {
    return null;
  }

  const sourceEventEnvelope = prePayloadEvidence.sourceEventEnvelope;
  if (sourceEventEnvelope === undefined) {
    return Object.freeze({prePayloadEvidence});
  }

  const residency =
    prePayloadEvidence.consumerMetadataEvidence
      .currentResidencyEvidence.currentResidency;
  if (residency === undefined) return null;

  const binding =
    projectNotificationDeliverySourceEventPayloadValidationBinding(
      sourceEventEnvelope,
      residency,
    );
  if (binding === null) return null;

  const validator = new EventEnvelopeCatalogValidator(payloadValidator);
  await validator.validate({
    envelope: sourceEventEnvelope.envelopeJson,
    catalog: sourceEventEnvelope.catalog,
    binding,
  });

  return Object.freeze({
    prePayloadEvidence,
    sourceEventEnvelope,
  });
}
