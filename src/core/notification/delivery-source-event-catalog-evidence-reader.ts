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

const EVENT_SCOPE_CLASSES = new Set([
  "PLATFORM_GLOBAL",
  "TENANT_CORE",
  "TENANT_INDUSTRY",
  "EXPLICIT_CROSS_CONTEXT",
] as const);

/**
 * DD-321: re-evaluate only the exact persisted OutboxEvent -> EventCatalog
 * tuple relationship. Catalog lifecycle and all non-tuple metadata are
 * deliberately uninterpreted.
 */
export function matchesOutboxEventCatalogTupleFloors(
  event: OutboxEventEvidence,
  catalog: PersistedEventCatalogEntry,
): boolean {
  return typeof event.eventType === "string"
    && event.eventType.trim().length > 0
    && Number.isSafeInteger(event.eventVersion)
    && event.eventVersion > 0
    && EVENT_SCOPE_CLASSES.has(event.scopeClass)
    && catalog.eventType === event.eventType
    && catalog.eventVersion === event.eventVersion
    && catalog.scopeClass === event.scopeClass;
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
