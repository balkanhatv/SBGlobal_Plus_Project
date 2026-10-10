import type { JsonObject } from "../api/schema-registry.js";
import {
  matchesPersistedOutboxEventCurrentTenantResidencyFloors,
} from "./tenant-residency.js";
import {
  type WebhookDeliveryEventCurrentResidencyEvidence,
} from "./webhook-delivery-event-current-residency-evidence-reader.js";
import {
  matchesWebhookDeliveryNecessaryFloors,
} from "./webhook-delivery-floors.js";

export interface WebhookDeliveryEventPrePayloadStructureEvidence {
  readonly parent: WebhookDeliveryEventCurrentResidencyEvidence;
  readonly envelopeJson: JsonObject;
}

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
      return Array.from(value).every((entry) => isJsonCompatible(entry, seen));
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

/**
 * DD-523…DD-526: re-evaluate only the DD-081 pre-payload structural floors
 * over exact DD-522 Webhook source-event current-residency evidence.
 *
 * This performs no reads and no payload-schema execution. Catalog lifecycle,
 * filters, endpoint security, signing, retry/cross-context/network delivery
 * and mutations remain separately governed.
 */
export function matchesWebhookDeliveryEventPrePayloadStructureFloors(
  evidence: WebhookDeliveryEventCurrentResidencyEvidence,
): boolean {
  if (!evidence
    || typeof evidence !== "object"
    || !evidence.parent
    || typeof evidence.parent !== "object"
    || !evidence.parent.parent
    || typeof evidence.parent.parent !== "object"
    || !evidence.currentResidency
    || typeof evidence.currentResidency !== "object") {
    return false;
  }

  const envelopeEvidence = evidence.parent;
  const current = envelopeEvidence.parent;
  const {delivery, subscription, event, catalog} = current;
  const envelopeJson = envelopeEvidence.envelopeJson;

  if (delivery.subscriptionId !== subscription.id
    || delivery.eventId !== event.id
    || envelopeJson !== event.envelopeJson
    || !matchesWebhookDeliveryNecessaryFloors(subscription, event, catalog)
    || !matchesPersistedOutboxEventCurrentTenantResidencyFloors(
      event,
      catalog,
      envelopeJson,
      evidence.currentResidency,
    )) {
    return false;
  }

  return isStrictEventDateTime(envelopeJson.occurredAt)
    && isJsonCompatible(envelopeJson.payload)
    && isJsonCompatible(catalog.payloadSchema);
}

/**
 * DD-527: immutable exact-reference evidence after DD-523…DD-526 only.
 */
export function buildWebhookDeliveryEventPrePayloadStructureEvidence(
  parent: WebhookDeliveryEventCurrentResidencyEvidence,
): WebhookDeliveryEventPrePayloadStructureEvidence | null {
  if (!matchesWebhookDeliveryEventPrePayloadStructureFloors(parent)) {
    return null;
  }

  return Object.freeze({
    parent,
    envelopeJson: parent.parent.envelopeJson,
  });
}
