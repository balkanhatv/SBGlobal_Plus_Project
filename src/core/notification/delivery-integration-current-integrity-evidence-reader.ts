import type { RequestContext } from "../context/contracts.js";
import type {
  CredentialReferenceMetadata,
  CredentialReferenceMetadataReadPort,
} from "../integration/credential-reference-metadata.js";
import type {
  IntegrationCapabilityReadPort,
  PersistedIntegrationCapability,
} from "../integration/integration-capability.js";
import type {
  IntegrationDefinitionReadPort,
  PersistedIntegrationDefinition,
} from "../integration/integration-definition.js";
import type { OutboxEventReadPort } from "../integration/outbox-event.js";
import {
  matchesCurrentTenantIntegrationIntegrityFloors,
} from "../integration/tenant-integration-integrity-floors.js";
import type {
  PersistedTenantIntegration,
  TenantIntegrationReadPort,
} from "../integration/tenant-integration.js";
import {
  loadNotificationDeliveryComposedEvidence,
  type NotificationDeliveryComposedEvidence,
} from "./delivery-composed-evidence-reader.js";
import type { NotificationDeliveryAttemptReadPort } from "./delivery-attempt.js";
import type { NotificationDeliveryReadPort } from "./delivery.js";
import type { NotificationTemplateReadPort } from "./template.js";

export interface NotificationDeliveryIntegrationCurrentIntegrityReadInput {
  readonly requestContext: RequestContext;
  readonly notificationDeliveryId: string;
  readonly evaluatedAt: string;
}

export interface NotificationDeliveryIntegrationCurrentIntegrityEvidence {
  readonly integration: PersistedTenantIntegration;
  readonly credential: CredentialReferenceMetadata;
  readonly definition: PersistedIntegrationDefinition;
  readonly capabilities: readonly PersistedIntegrationCapability[];
  readonly evaluatedAt: string;
}

export interface NotificationDeliveryIntegrationCurrentIntegrityComposedEvidence {
  readonly composed: NotificationDeliveryComposedEvidence;
  readonly integrationCurrentIntegrity?:
    NotificationDeliveryIntegrationCurrentIntegrityEvidence;
}

/**
 * DD-313…DD-317: extend DD-312 composed NotificationDelivery evidence with the
 * current DD-167 TenantIntegration integrity evidence only when the Delivery is
 * already Integration-bound.
 *
 * This boundary preserves existing parent/relationship/attempt evidence and
 * adds no provider selection, secret access, health/fallback, retry, dispatch,
 * send or mutation authority.
 */
export async function loadNotificationDeliveryIntegrationCurrentIntegrityEvidence(
  input: NotificationDeliveryIntegrationCurrentIntegrityReadInput,
  deliveryReader: NotificationDeliveryReadPort,
  integrationReader: TenantIntegrationReadPort,
  eventReader: OutboxEventReadPort,
  templateReader: NotificationTemplateReadPort,
  attemptReader: NotificationDeliveryAttemptReadPort,
  credentialReader: CredentialReferenceMetadataReadPort,
  definitionReader: IntegrationDefinitionReadPort,
  capabilityReader: IntegrationCapabilityReadPort,
): Promise<NotificationDeliveryIntegrationCurrentIntegrityComposedEvidence | null> {
  const requestContext = input.requestContext;
  const notificationDeliveryId = input.notificationDeliveryId;

  const composed = await loadNotificationDeliveryComposedEvidence(
    {requestContext, notificationDeliveryId},
    deliveryReader,
    integrationReader,
    eventReader,
    templateReader,
    attemptReader,
  );
  if (composed === null) return null;

  const integration = composed.relationships.integration;
  if (integration === undefined) {
    return Object.freeze({composed});
  }

  const credential = await credentialReader.loadForContext({
    requestContext,
    credentialReferenceId: integration.credentialReferenceId,
  });
  if (credential === null) return null;

  const definition = await definitionReader.loadById(
    integration.integrationDefinitionId,
  );
  if (definition === null) return null;

  const capabilities: PersistedIntegrationCapability[] = [];
  for (const capabilityCode of integration.enabledCapabilities) {
    const capability = await capabilityReader.loadExact({
      integrationDefinitionId: integration.integrationDefinitionId,
      capabilityCode,
    });
    if (capability === null) return null;
    capabilities.push(capability);
  }
  const immutableCapabilities = Object.freeze(capabilities);

  if (!matchesCurrentTenantIntegrationIntegrityFloors(
    integration,
    credential,
    input.evaluatedAt,
    definition,
    immutableCapabilities,
  )) {
    return null;
  }

  const integrationCurrentIntegrity = Object.freeze({
    integration,
    credential,
    definition,
    capabilities: immutableCapabilities,
    evaluatedAt: input.evaluatedAt,
  });

  return Object.freeze({
    composed,
    integrationCurrentIntegrity,
  });
}
