import {
  buildNotificationDeliverySourceEventConsumerMetadataEvidence,
  matchesNotificationDeliverySourceEventConsumerMetadataFloors,
  type NotificationDeliverySourceEventConsumerMetadataComposedEvidence,
} from "./delivery-source-event-consumer-metadata-evidence.js";
import type {
  NotificationTenantResidencyEvidence,
} from "./delivery-source-event-current-residency-evidence-reader.js";
import type {
  NotificationDeliverySourceEventEnvelopeEvidence,
} from "./delivery-source-event-envelope-evidence.js";

function hasValidCalendarDatePrefix(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?=T|\s|$)/.exec(value);
  if (!match) return true;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function isStrictEventDateTime(value: unknown): boolean {
  return typeof value === "string"
    && value.trim().length > 0
    && hasValidCalendarDatePrefix(value)
    && Number.isFinite(Date.parse(value));
}

function isJsonCompatible(
  value: unknown,
  seen: WeakSet<object> = new WeakSet<object>(),
): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object") return false;

  const objectValue = value as object;
  if (seen.has(objectValue)) return false;
  seen.add(objectValue);

  try {
    if (Array.isArray(value)) {
      return value.every((entry) => isJsonCompatible(entry, seen));
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return false;

    for (const key of Object.keys(value as Record<string, unknown>)) {
      const entry = (value as Record<string, unknown>)[key];
      if (entry === undefined || !isJsonCompatible(entry, seen)) return false;
    }
    return true;
  } finally {
    seen.delete(objectValue);
  }
}

export interface NotificationDeliverySourceEventPrePayloadStructureComposedEvidence {
  readonly consumerMetadataEvidence:
    NotificationDeliverySourceEventConsumerMetadataComposedEvidence;
  readonly sourceEventEnvelope?: NotificationDeliverySourceEventEnvelopeEvidence;
}

/**
 * DD-338…DD-341: finish the locally re-evaluable DD-081 pre-payload
 * structural checks for an already DD-337-valid NotificationDelivery source
 * event. EventPayloadValidatorPort execution remains explicitly out of scope.
 */
export function matchesNotificationDeliverySourceEventPrePayloadStructureFloors(
  sourceEventEnvelope: NotificationDeliverySourceEventEnvelopeEvidence,
  residency: NotificationTenantResidencyEvidence,
): boolean {
  if (!matchesNotificationDeliverySourceEventConsumerMetadataFloors(
    sourceEventEnvelope,
    residency,
  )) {
    return false;
  }

  const envelope = sourceEventEnvelope.envelopeJson as Record<string, unknown>;
  return isStrictEventDateTime(envelope.occurredAt)
    && isJsonCompatible(envelope.payload)
    && isJsonCompatible(sourceEventEnvelope.catalog.payloadSchema);
}

/**
 * DD-342: preserve exact DD-337/source-event evidence identities after only
 * the DD-338…DD-341 local pre-payload structural floor. No reads, schema
 * execution, catalog lifecycle decision or mutation occur here.
 */
export function buildNotificationDeliverySourceEventPrePayloadStructureEvidence(
  consumerMetadataEvidence:
    NotificationDeliverySourceEventConsumerMetadataComposedEvidence,
): NotificationDeliverySourceEventPrePayloadStructureComposedEvidence | null {
  if (!consumerMetadataEvidence
    || typeof consumerMetadataEvidence !== "object"
    || !consumerMetadataEvidence.currentResidencyEvidence
    || typeof consumerMetadataEvidence.currentResidencyEvidence !== "object") {
    return null;
  }

  const rebuilt = buildNotificationDeliverySourceEventConsumerMetadataEvidence(
    consumerMetadataEvidence.currentResidencyEvidence,
  );
  if (!rebuilt
    || rebuilt.sourceEventEnvelope !== consumerMetadataEvidence.sourceEventEnvelope) {
    return null;
  }

  const sourceEventEnvelope = consumerMetadataEvidence.sourceEventEnvelope;
  if (sourceEventEnvelope === undefined) {
    return Object.freeze({consumerMetadataEvidence});
  }

  const residency =
    consumerMetadataEvidence.currentResidencyEvidence.currentResidency;
  if (residency === undefined
    || !matchesNotificationDeliverySourceEventPrePayloadStructureFloors(
      sourceEventEnvelope,
      residency,
    )) {
    return null;
  }

  return Object.freeze({
    consumerMetadataEvidence,
    sourceEventEnvelope,
  });
}
