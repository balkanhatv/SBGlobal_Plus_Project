import type { RequestContext } from "../context/contracts.js";
import type {
  CredentialReferenceMetadataReadPort,
} from "../integration/credential-reference-metadata.js";
import type {
  EventCatalogReadPort,
  PersistedEventCatalogEntry,
} from "../integration/event-catalog.js";
import type {
  IntegrationCapabilityReadPort,
} from "../integration/integration-capability.js";
import type {
  IntegrationDefinitionReadPort,
} from "../integration/integration-definition.js";
import type {
  OutboxEventEvidence,
  OutboxEventReadPort,
} from "../integration/outbox-event.js";
import { matchesPersistedOutboxEventCatalogTupleFloors } from "../integration/outbox-event-envelope-floors.js";
import type {
  TenantIntegrationReadPort,
} from "../integration/tenant-integration.js";
import type {
  NotificationDeliveryAttemptReadPort,
} from "./delivery-attempt.js";
import type {
  NotificationDeliveryReadPort,
} from "./delivery.js";
import {
  loadNotificationDeliveryIntegrationCurrentIntegrityEvidence,
  type NotificationDeliveryIntegrationCurrentIntegrityComposedEvidence,
} from "./delivery-integration-current-integrity-evidence-reader.js";
import type { NotificationTemplateReadPort } from "./template.js";

export interface NotificationDeliverySourceEventCatalogReadInput {
  readonly requestContext: RequestContext;
  readonly notificationDeliveryId: string;
  readonly evaluatedAt: string;
}

export interface NotificationDeliverySourceEventCatalogEvidence {
  readonly event: OutboxEventEvidence;
  readonly catalog: PersistedEventCatalogEntry;
}

export interface NotificationDeliverySourceEventCatalogComposedEvidence {
  readonly integrationEvidence:
    NotificationDeliveryIntegrationCurrentIntegrityComposedEvidence;
  readonly sourceEventCatalog?: NotificationDeliverySourceEventCatalogEvidence;
}

/**
 * DD-321: preserve the historical Notification-facing wrapper while delegating
 * the generic OutboxEvent/EventCatalog tuple semantics to the Integration owner.
 */
export function matchesOutboxEventCatalogTupleFloors(
  event: OutboxEventEvidence,
  catalog: PersistedEventCatalogEntry,
): boolean {
  return matchesPersistedOutboxEventCatalogTupleFloors(event, catalog);
}

/**
 * DD-318…DD-322: establish DD-317 first, then conditionally read the exact
 * EventCatalog tuple for the already-preserved source OutboxEvent.
 *
 * This boundary does not re-read the source event, interpret catalog lifecycle,
 * validate payload execution, select consumers/webhooks, infer retry/readiness,
 * dispatch, send or mutate anything.
 */
export async function loadNotificationDeliverySourceEventCatalogEvidence(
  input: NotificationDeliverySourceEventCatalogReadInput,
  deliveryReader: NotificationDeliveryReadPort,
  integrationReader: TenantIntegrationReadPort,
  eventReader: OutboxEventReadPort,
  templateReader: NotificationTemplateReadPort,
  attemptReader: NotificationDeliveryAttemptReadPort,
  credentialReader: CredentialReferenceMetadataReadPort,
  definitionReader: IntegrationDefinitionReadPort,
  capabilityReader: IntegrationCapabilityReadPort,
  eventCatalogReader: EventCatalogReadPort,
): Promise<NotificationDeliverySourceEventCatalogComposedEvidence | null> {
  const integrationEvidence =
    await loadNotificationDeliveryIntegrationCurrentIntegrityEvidence(
      {
        requestContext: input.requestContext,
        notificationDeliveryId: input.notificationDeliveryId,
        evaluatedAt: input.evaluatedAt,
      },
      deliveryReader,
      integrationReader,
      eventReader,
      templateReader,
      attemptReader,
      credentialReader,
      definitionReader,
      capabilityReader,
    );

  if (integrationEvidence === null) return null;

  const event = integrationEvidence.composed.relationships.event;
  if (event === undefined) {
    return Object.freeze({integrationEvidence});
  }

  const catalog = await eventCatalogReader.loadExact({
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    scopeClass: event.scopeClass,
  });
  if (catalog === null) return null;

  if (!matchesOutboxEventCatalogTupleFloors(event, catalog)) {
    return null;
  }

  const sourceEventCatalog = Object.freeze({event, catalog});
  return Object.freeze({
    integrationEvidence,
    sourceEventCatalog,
  });
}
