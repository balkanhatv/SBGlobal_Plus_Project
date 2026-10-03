import {
  matchesNotificationDeliverySourceEventCurrentResidencyFloors,
  type NotificationDeliverySourceEventCurrentResidencyComposedEvidence,
  type NotificationTenantResidencyEvidence,
} from "./delivery-source-event-current-residency-evidence-reader.js";
import type {
  NotificationDeliverySourceEventEnvelopeEvidence,
} from "./delivery-source-event-envelope-evidence.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function optionalUuidIsValid(value: unknown): boolean {
  return value === undefined || value === null
    || (typeof value === "string" && UUID_PATTERN.test(value));
}

function optionalAggregateVersionIsValid(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "number") return Number.isSafeInteger(value);
  return typeof value === "string" && /^-?\d+$/.test(value);
}

export interface NotificationDeliverySourceEventConsumerMetadataComposedEvidence {
  readonly currentResidencyEvidence:
    NotificationDeliverySourceEventCurrentResidencyComposedEvidence;
  readonly sourceEventEnvelope?: NotificationDeliverySourceEventEnvelopeEvidence;
}

/**
 * DD-333…DD-336: re-evaluate only the remaining DD-081 optional structural
 * metadata on an already locally-valid NotificationDelivery source event.
 *
 * This deliberately stops before EventPayloadValidatorPort execution, catalog
 * lifecycle/consumer policy, Outbox readiness and Notification delivery policy.
 */
export function matchesNotificationDeliverySourceEventConsumerMetadataFloors(
  sourceEventEnvelope: NotificationDeliverySourceEventEnvelopeEvidence,
  residency: NotificationTenantResidencyEvidence,
): boolean {
  if (!matchesNotificationDeliverySourceEventCurrentResidencyFloors(
    sourceEventEnvelope,
    residency,
  )) {
    return false;
  }

  if (sourceEventEnvelope.envelopeJson !== sourceEventEnvelope.event.envelopeJson) {
    return false;
  }

  const envelope = sourceEventEnvelope.envelopeJson as Record<string, unknown>;
  return optionalUuidIsValid(envelope.actorPrincipalId)
    && optionalUuidIsValid(envelope.causationId)
    && optionalAggregateVersionIsValid(envelope.aggregateVersion);
}

/**
 * DD-337: compose exact DD-332 evidence with the DD-333…DD-336 structural
 * consumer-metadata floor without any additional read or mutation.
 */
export function buildNotificationDeliverySourceEventConsumerMetadataEvidence(
  currentResidencyEvidence:
    NotificationDeliverySourceEventCurrentResidencyComposedEvidence,
): NotificationDeliverySourceEventConsumerMetadataComposedEvidence | null {
  if (!currentResidencyEvidence
    || typeof currentResidencyEvidence !== "object"
    || !currentResidencyEvidence.envelopeEvidence
    || typeof currentResidencyEvidence.envelopeEvidence !== "object") {
    return null;
  }

  const sourceEventEnvelope =
    currentResidencyEvidence.envelopeEvidence.sourceEventEnvelope;

  if (sourceEventEnvelope === undefined) {
    if (currentResidencyEvidence.currentResidency !== undefined) return null;
    return Object.freeze({currentResidencyEvidence});
  }

  const residency = currentResidencyEvidence.currentResidency;
  if (residency === undefined
    || !matchesNotificationDeliverySourceEventConsumerMetadataFloors(
      sourceEventEnvelope,
      residency,
    )) {
    return null;
  }

  return Object.freeze({
    currentResidencyEvidence,
    sourceEventEnvelope,
  });
}
