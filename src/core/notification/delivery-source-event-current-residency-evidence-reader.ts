import type { RequestContext } from "../context/contracts.js";
import type {
  CredentialReferenceMetadataReadPort,
} from "../integration/credential-reference-metadata.js";
import type {
  EventCatalogReadPort,
} from "../integration/event-catalog.js";
import type {
  IntegrationCapabilityReadPort,
} from "../integration/integration-capability.js";
import type {
  IntegrationDefinitionReadPort,
} from "../integration/integration-definition.js";
import type {
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
  buildNotificationDeliverySourceEventEnvelopeEvidence,
  matchesNotificationDeliverySourceEventEnvelopeEvidenceFloors,
  type NotificationDeliverySourceEventEnvelopeComposedEvidence,
  type NotificationDeliverySourceEventEnvelopeEvidence,
} from "./delivery-source-event-envelope-evidence.js";
import {
  loadNotificationDeliverySourceEventCatalogEvidence,
} from "./delivery-source-event-catalog-evidence-reader.js";
import type { NotificationTemplateReadPort } from "./template.js";

export interface NotificationTenantResidencyEvidence {
  readonly tenantId: string;
  readonly residencyRegionCode: string;
}

export interface NotificationTenantResidencyReadPort {
  loadCurrentForContext(input: {
    readonly requestContext: RequestContext;
    readonly tenantId: string;
  }): Promise<NotificationTenantResidencyEvidence | null>;
}

export interface NotificationDeliverySourceEventCurrentResidencyReadInput {
  readonly requestContext: RequestContext;
  readonly notificationDeliveryId: string;
  readonly evaluatedAt: string;
}

export interface NotificationDeliverySourceEventCurrentResidencyComposedEvidence {
  readonly envelopeEvidence:
    NotificationDeliverySourceEventEnvelopeComposedEvidence;
  readonly currentResidency?: NotificationTenantResidencyEvidence;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * DD-330: re-evaluate only current authoritative Tenant residency for the exact
 * already-DD-326-valid NotificationDelivery source-event envelope evidence.
 *
 * NotificationDelivery source-event binding is limited by DD-169 to the same
 * TENANT_CORE/TENANT_INDUSTRY scope as the Delivery, so cross-context ownership
 * is deliberately outside this path.
 */
export function matchesNotificationDeliverySourceEventCurrentResidencyFloors(
  sourceEventEnvelope: NotificationDeliverySourceEventEnvelopeEvidence,
  residency: NotificationTenantResidencyEvidence,
): boolean {
  if (!sourceEventEnvelope || typeof sourceEventEnvelope !== "object"
    || !residency || typeof residency !== "object"
    || !matchesNotificationDeliverySourceEventEnvelopeEvidenceFloors({
      event: sourceEventEnvelope.event,
      catalog: sourceEventEnvelope.catalog,
    })) {
    return false;
  }

  const event = sourceEventEnvelope.event;
  const envelope = sourceEventEnvelope.envelopeJson as Record<string, unknown>;

  return (event.scopeClass === "TENANT_CORE"
      || event.scopeClass === "TENANT_INDUSTRY")
    && isUuid(event.tenantId)
    && isUuid(residency.tenantId)
    && isNonEmptyString(residency.residencyRegionCode)
    && residency.tenantId === event.tenantId
    && envelope.tenantId === event.tenantId
    && envelope.residencyRegion === residency.residencyRegionCode;
}

/**
 * DD-328…DD-332: establish DD-322, build DD-327 local persisted-envelope
 * evidence, and only for a bound source event load/re-evaluate current Tenant
 * residency through the governed Notification read port.
 *
 * This is a current-residency evidence boundary only. It does not reconstruct
 * historical write-time residency or execute payload/catalog/delivery policy.
 */
export async function loadNotificationDeliverySourceEventCurrentResidencyEvidence(
  input: NotificationDeliverySourceEventCurrentResidencyReadInput,
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
): Promise<NotificationDeliverySourceEventCurrentResidencyComposedEvidence | null> {
  const catalogEvidence =
    await loadNotificationDeliverySourceEventCatalogEvidence(
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
    );
  if (catalogEvidence === null) return null;

  const envelopeEvidence =
    buildNotificationDeliverySourceEventEnvelopeEvidence(catalogEvidence);
  if (envelopeEvidence === null) return null;

  const sourceEventEnvelope = envelopeEvidence.sourceEventEnvelope;
  if (sourceEventEnvelope === undefined) {
    return Object.freeze({envelopeEvidence});
  }

  const tenantId = sourceEventEnvelope.event.tenantId;
  if (!isUuid(tenantId)) return null;

  const currentResidency = await residencyReader.loadCurrentForContext({
    requestContext: input.requestContext,
    tenantId,
  });
  if (currentResidency === null) return null;

  if (!matchesNotificationDeliverySourceEventCurrentResidencyFloors(
    sourceEventEnvelope,
    currentResidency,
  )) {
    return null;
  }

  return Object.freeze({
    envelopeEvidence,
    currentResidency,
  });
}
