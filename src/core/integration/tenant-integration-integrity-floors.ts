import type { CredentialReferenceMetadata } from "./credential-reference-metadata.js";
import type { PersistedIntegrationCapability } from "./integration-capability.js";
import type { PersistedIntegrationDefinition } from "./integration-definition.js";
import {
  matchesCurrentTenantIntegrationCredentialFloors,
} from "./tenant-integration-credential-floors.js";
import {
  matchesCurrentTenantIntegrationDefinitionCapabilityFloors,
} from "./tenant-integration-definition-capability-floors.js";
import type { PersistedTenantIntegration } from "./tenant-integration.js";

/**
 * Composes only the two migration-0030 TenantIntegration current-integrity floors
 * already owned by DD-165 and DD-166.
 *
 * A true result is not Integration execution, provider, secret, callback, sync,
 * OperationContract, event or network authorization.
 */
export function matchesCurrentTenantIntegrationIntegrityFloors(
  integration: PersistedTenantIntegration,
  credential: CredentialReferenceMetadata,
  evaluatedAt: string,
  definition: PersistedIntegrationDefinition,
  capabilities: readonly PersistedIntegrationCapability[],
): boolean {
  return matchesCurrentTenantIntegrationCredentialFloors(
    integration,
    credential,
    evaluatedAt,
  ) && matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
    integration,
    definition,
    capabilities,
  );
}
