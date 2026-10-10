import type { RequestContext } from "../context/contracts.js";
import type {
  CredentialReferenceMetadataReadPort,
} from "./credential-reference-metadata.js";
import type {
  IntegrationCapabilityReadPort,
  PersistedIntegrationCapability,
} from "./integration-capability.js";
import type { IntegrationDefinitionReadPort } from "./integration-definition.js";
import {
  loadSyncCursorCurrentBindingEvidence,
  type SyncCursorCurrentBindingEvidence,
} from "./sync-cursor-current-binding-evidence-reader.js";
import type { SyncCursorReadPort } from "./sync-cursor.js";
import {
  matchesCurrentTenantIntegrationIntegrityFloors,
} from "./tenant-integration-integrity-floors.js";
import type {
  TenantIntegrationCurrentIntegrityEvidence,
} from "./tenant-integration-current-integrity-evidence-reader.js";
import type { TenantIntegrationReadPort } from "./tenant-integration.js";

export interface SyncCursorCurrentIntegrityEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly tenantIntegrationId: string;
  readonly capabilityCode: string;
  readonly industryContextId?: string;
  readonly evaluatedAt: string;
}

export interface SyncCursorCurrentIntegrityEvidence {
  readonly parent: SyncCursorCurrentBindingEvidence;
  readonly integrationCurrentIntegrity: TenantIntegrationCurrentIntegrityEvidence;
}

/**
 * DD-503…DD-507: extend exact DD-502 SyncCursor current-binding evidence with
 * only the exact DD-167 current-integrity evidence required by the already-
 * loaded parent TenantIntegration.
 *
 * The exact DD-502 cursor capability object is reused in the persisted enabled-
 * capability sequence; it is not read a second time. Cursor payload/freshness,
 * provider/secret selection and synchronization/network execution semantics
 * remain outside this evidence boundary.
 */
export async function loadSyncCursorCurrentIntegrityEvidence(
  input: SyncCursorCurrentIntegrityEvidenceReadInput,
  cursorReader: SyncCursorReadPort,
  integrationReader: TenantIntegrationReadPort,
  capabilityReader: IntegrationCapabilityReadPort,
  credentialReader: CredentialReferenceMetadataReadPort,
  definitionReader: IntegrationDefinitionReadPort,
): Promise<SyncCursorCurrentIntegrityEvidence | null> {
  const parent = await loadSyncCursorCurrentBindingEvidence(
    {
      requestContext: input.requestContext,
      tenantIntegrationId: input.tenantIntegrationId,
      capabilityCode: input.capabilityCode,
      industryContextId: input.industryContextId,
    },
    cursorReader,
    integrationReader,
    capabilityReader,
  );
  if (parent === null) return null;

  const credential = await credentialReader.loadForContext({
    requestContext: input.requestContext,
    credentialReferenceId: parent.integration.credentialReferenceId,
  });
  if (credential === null) return null;

  const definition = await definitionReader.loadById(
    parent.integration.integrationDefinitionId,
  );
  if (definition === null) return null;

  const capabilities: PersistedIntegrationCapability[] = [];
  for (const capabilityCode of parent.integration.enabledCapabilities) {
    if (capabilityCode === parent.cursor.capabilityCode) {
      capabilities.push(parent.capability);
      continue;
    }

    const capability = await capabilityReader.loadExact({
      integrationDefinitionId: parent.integration.integrationDefinitionId,
      capabilityCode,
    });
    if (capability === null) return null;
    capabilities.push(capability);
  }
  const immutableCapabilities = Object.freeze(capabilities);

  if (!matchesCurrentTenantIntegrationIntegrityFloors(
    parent.integration,
    credential,
    input.evaluatedAt,
    definition,
    immutableCapabilities,
  )) {
    return null;
  }

  const integrationCurrentIntegrity: TenantIntegrationCurrentIntegrityEvidence =
    Object.freeze({
      integration: parent.integration,
      credential,
      definition,
      capabilities: immutableCapabilities,
      evaluatedAt: input.evaluatedAt,
    });

  return Object.freeze({
    parent,
    integrationCurrentIntegrity,
  });
}
