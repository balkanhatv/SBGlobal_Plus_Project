import type { RequestContext } from "../context/contracts.js";
import type {
  CredentialReferenceMetadataReadPort,
} from "../integration/credential-reference-metadata.js";
import type { EventCatalogReadPort } from "../integration/event-catalog.js";
import type { EventPayloadValidatorPort } from "../integration/event-envelope.js";
import type {
  IntegrationCapabilityReadPort,
} from "../integration/integration-capability.js";
import type {
  IntegrationDefinitionReadPort,
} from "../integration/integration-definition.js";
import type { OutboxEventReadPort } from "../integration/outbox-event.js";
import type {
  TenantIntegrationReadPort,
} from "../integration/tenant-integration.js";
import {
  buildNotificationDeliverySourceEventConsumerMetadataEvidence,
} from "./delivery-source-event-consumer-metadata-evidence.js";
import {
  loadNotificationDeliverySourceEventCurrentResidencyEvidence,
  type NotificationTenantResidencyReadPort,
} from "./delivery-source-event-current-residency-evidence-reader.js";
import type {
  NotificationDeliveryAttemptReadPort,
} from "./delivery-attempt.js";
import type { NotificationDeliveryReadPort } from "./delivery.js";
import {
  validateNotificationDeliverySourceEventPayloadEvidence,
  type NotificationDeliverySourceEventPayloadValidatedEvidence,
} from "./delivery-source-event-payload-validation-evidence.js";
import {
  buildNotificationDeliverySourceEventPrePayloadStructureEvidence,
} from "./delivery-source-event-pre-payload-structure-evidence.js";
import type { NotificationTemplateReadPort } from "./template.js";

export interface NotificationDeliverySourceEventPayloadValidatedReadInput {
  readonly requestContext: RequestContext;
  readonly notificationDeliveryId: string;
  readonly evaluatedAt: string;
}

/**
 * DD-348…DD-352: compose only already-governed NotificationDelivery source
 * event evidence boundaries in their canonical order:
 *
 * DD-332 current-residency reader
 *   -> DD-337 consumer metadata
 *   -> DD-342 pre-payload structure
 *   -> DD-347 injected DD-081 payload validation.
 *
 * No lifecycle, consumer-selection, idempotency, readiness, provider, send or
 * mutation authority is created by this reader composition.
 */
export async function loadNotificationDeliverySourceEventPayloadValidatedEvidence(
  input: NotificationDeliverySourceEventPayloadValidatedReadInput,
  deliveryReader: NotificationDeliveryReadPort,
  integrationReader: TenantIntegrationReadPort,
  eventReader: OutboxEventReadPort,
  templateReader: NotificationTemplateReadPort,
  attemptReader: NotificationDeliveryAttemptReadPort,
  credentialReader: CredentialReferenceMetadataReadPort,
  definitionReader: IntegrationDefinitionReadPort,
  capabilityReader: IntegrationCapabilityReadPort,
  eventCatalogReader: EventCatalogReadPort,
  residencyReader: NotificationTenantResidencyReadPort,
  payloadValidator: EventPayloadValidatorPort,
): Promise<NotificationDeliverySourceEventPayloadValidatedEvidence | null> {
  const currentResidencyEvidence =
    await loadNotificationDeliverySourceEventCurrentResidencyEvidence(
      input,
      deliveryReader,
      integrationReader,
      eventReader,
      templateReader,
      attemptReader,
      credentialReader,
      definitionReader,
      capabilityReader,
      eventCatalogReader,
      residencyReader,
    );
  if (currentResidencyEvidence === null) return null;

  const consumerMetadataEvidence =
    buildNotificationDeliverySourceEventConsumerMetadataEvidence(
      currentResidencyEvidence,
    );
  if (consumerMetadataEvidence === null) return null;

  const prePayloadEvidence =
    buildNotificationDeliverySourceEventPrePayloadStructureEvidence(
      consumerMetadataEvidence,
    );
  if (prePayloadEvidence === null) return null;

  return validateNotificationDeliverySourceEventPayloadEvidence(
    prePayloadEvidence,
    payloadValidator,
  );
}
