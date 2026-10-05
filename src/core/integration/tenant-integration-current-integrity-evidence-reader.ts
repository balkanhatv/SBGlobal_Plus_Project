import type { RequestContext } from "../context/contracts.js";
import type {
  CredentialReferenceMetadata,
  CredentialReferenceMetadataReadPort,
} from "./credential-reference-metadata.js";
import type {
  IntegrationCapabilityReadPort,
  PersistedIntegrationCapability,
} from "./integration-capability.js";
import type {
  IntegrationDefinitionReadPort,
  PersistedIntegrationDefinition,
} from "./integration-definition.js";
import {
  matchesCurrentTenantIntegrationIntegrityFloors,
} from "./tenant-integration-integrity-floors.js";
import type {
  PersistedTenantIntegration,
  TenantIntegrationReadPort,
} from "./tenant-integration.js";

export interface TenantIntegrationCurrentIntegrityEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly tenantIntegrationId: string;
  readonly evaluatedAt: string;
}

export interface TenantIntegrationCurrentIntegrityEvidence {
  readonly integration: PersistedTenantIntegration;
  readonly credential: CredentialReferenceMetadata;
  readonly definition: PersistedIntegrationDefinition;
  readonly capabilities: readonly PersistedIntegrationCapability[];
  readonly evaluatedAt: string;
}

/**
 * DD-493…DD-497: load one visible TenantIntegration and only the exact
 * CredentialReference / IntegrationDefinition / enabled IntegrationCapability
 * evidence required by the existing DD-167 current-integrity necessary floor.
 *
 * This does not interpret Integration lifecycle/health/profile, access secrets,
 * select providers, authorize capabilities, resume sync, dispatch operations or
 * perform network/provider execution.
 */
export async function loadTenantIntegrationCurrentIntegrityEvidence(
  input: TenantIntegrationCurrentIntegrityEvidenceReadInput,
  integrationReader: TenantIntegrationReadPort,
  credentialReader: CredentialReferenceMetadataReadPort,
  definitionReader: IntegrationDefinitionReadPort,
  capabilityReader: IntegrationCapabilityReadPort,
): Promise<TenantIntegrationCurrentIntegrityEvidence | null> {
  const integration = await integrationReader.loadForContext({
    requestContext: input.requestContext,
    tenantIntegrationId: input.tenantIntegrationId,
  });
  if (integration === null) return null;

  const credential = await credentialReader.loadForContext({
    requestContext: input.requestContext,
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

  return Object.freeze({
    integration,
    credential,
    definition,
    capabilities: immutableCapabilities,
    evaluatedAt: input.evaluatedAt,
  });
}
