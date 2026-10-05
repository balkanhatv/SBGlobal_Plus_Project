import type { RequestContext } from "../context/contracts.js";
import type {
  IntegrationCapabilityReadPort,
  PersistedIntegrationCapability,
} from "./integration-capability.js";
import {
  matchesCurrentSyncCursorBindingFloors,
} from "./sync-cursor-binding-floors.js";
import type {
  PersistedSyncCursor,
  SyncCursorReadPort,
} from "./sync-cursor.js";
import type {
  PersistedTenantIntegration,
  TenantIntegrationReadPort,
} from "./tenant-integration.js";

export interface SyncCursorCurrentBindingEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly tenantIntegrationId: string;
  readonly capabilityCode: string;
  readonly industryContextId?: string;
}

export interface SyncCursorCurrentBindingEvidence {
  readonly cursor: PersistedSyncCursor;
  readonly integration: PersistedTenantIntegration;
  readonly capability: PersistedIntegrationCapability;
}

/**
 * DD-498…DD-502: materialize only the exact current parent/capability evidence
 * required by DD-164 for one exact persisted SyncCursor tuple.
 *
 * Cursor payload/freshness, TenantIntegration current-integrity, provider,
 * credential/secret, routing and synchronization execution semantics remain
 * outside this evidence boundary.
 */
export async function loadSyncCursorCurrentBindingEvidence(
  input: SyncCursorCurrentBindingEvidenceReadInput,
  cursorReader: SyncCursorReadPort,
  integrationReader: TenantIntegrationReadPort,
  capabilityReader: IntegrationCapabilityReadPort,
): Promise<SyncCursorCurrentBindingEvidence | null> {
  const cursor = await cursorReader.loadExact({
    requestContext: input.requestContext,
    tenantIntegrationId: input.tenantIntegrationId,
    capabilityCode: input.capabilityCode,
    industryContextId: input.industryContextId,
  });
  if (cursor === null) return null;

  const integration = await integrationReader.loadForContext({
    requestContext: input.requestContext,
    tenantIntegrationId: cursor.tenantIntegrationId,
  });
  if (integration === null) return null;

  const capability = await capabilityReader.loadExact({
    integrationDefinitionId: integration.integrationDefinitionId,
    capabilityCode: cursor.capabilityCode,
  });
  if (capability === null) return null;

  if (!matchesCurrentSyncCursorBindingFloors(cursor, integration, capability)) {
    return null;
  }

  return Object.freeze({
    cursor,
    integration,
    capability,
  });
}
