import type { JsonObject } from "../api/schema-registry.js";
import type {
  PersistedEventCatalogEntry,
} from "../integration/event-catalog.js";
import {
  matchesPersistedOutboxEventEnvelopeCatalogMetadataFloors,
  matchesPersistedOutboxEventEnvelopeEvidenceFloors,
  matchesPersistedOutboxEventEnvelopeIdentityFloors,
  matchesPersistedOutboxEventEnvelopeLocalScopeFloors,
} from "../integration/outbox-event-envelope-floors.js";
import type {
  OutboxEventEvidence,
} from "../integration/outbox-event.js";
import type {
  NotificationDeliverySourceEventCatalogComposedEvidence,
  NotificationDeliverySourceEventCatalogEvidence,
} from "./delivery-source-event-catalog-evidence-reader.js";

export interface NotificationDeliverySourceEventEnvelopeEvidence {
  readonly event: OutboxEventEvidence;
  readonly catalog: PersistedEventCatalogEntry;
  readonly envelopeJson: JsonObject;
}

export interface NotificationDeliverySourceEventEnvelopeComposedEvidence {
  readonly catalogEvidence: NotificationDeliverySourceEventCatalogComposedEvidence;
  readonly sourceEventEnvelope?: NotificationDeliverySourceEventEnvelopeEvidence;
}

/**
 * DD-323 historical Notification-facing wrapper over the shared Integration
 * persisted Outbox envelope identity floor.
 */
export function matchesOutboxEventEnvelopeIdentityFloors(
  event: OutboxEventEvidence,
): boolean {
  return matchesPersistedOutboxEventEnvelopeIdentityFloors(event);
}

/**
 * DD-324 historical Notification-facing wrapper over the shared Integration
 * envelope/catalog metadata floor.
 */
export function matchesOutboxEventEnvelopeCatalogMetadataFloors(
  event: OutboxEventEvidence,
  catalog: PersistedEventCatalogEntry,
): boolean {
  return matchesPersistedOutboxEventEnvelopeCatalogMetadataFloors(event, catalog);
}

/**
 * DD-325 historical Notification-facing wrapper over the shared Integration
 * locally re-evaluable envelope scope floor.
 */
export function matchesOutboxEventEnvelopeLocalScopeFloors(
  event: OutboxEventEvidence,
): boolean {
  return matchesPersistedOutboxEventEnvelopeLocalScopeFloors(event);
}

/**
 * DD-326 historical Notification-specific composition over the shared generic
 * persisted Outbox envelope evidence floor.
 */
export function matchesNotificationDeliverySourceEventEnvelopeEvidenceFloors(
  sourceEventCatalog: NotificationDeliverySourceEventCatalogEvidence,
): boolean {
  return matchesPersistedOutboxEventEnvelopeEvidenceFloors(
    sourceEventCatalog.event,
    sourceEventCatalog.catalog,
  );
}

/**
 * DD-327: enrich already-loaded DD-322 evidence with only immutable persisted
 * envelope evidence. No catalog/event reread or external validator is invoked.
 */
export function buildNotificationDeliverySourceEventEnvelopeEvidence(
  catalogEvidence: NotificationDeliverySourceEventCatalogComposedEvidence,
): NotificationDeliverySourceEventEnvelopeComposedEvidence | null {
  if (!catalogEvidence || typeof catalogEvidence !== "object") return null;

  const sourceEventCatalog = catalogEvidence.sourceEventCatalog;
  if (sourceEventCatalog === undefined) {
    return Object.freeze({catalogEvidence});
  }

  if (!matchesNotificationDeliverySourceEventEnvelopeEvidenceFloors(
    sourceEventCatalog,
  )) {
    return null;
  }

  const sourceEventEnvelope = Object.freeze({
    event: sourceEventCatalog.event,
    catalog: sourceEventCatalog.catalog,
    envelopeJson: sourceEventCatalog.event.envelopeJson,
  });

  return Object.freeze({
    catalogEvidence,
    sourceEventEnvelope,
  });
}
