import type { PersistedIntegrationCapability } from "./integration-capability.js";
import type { PersistedSyncCursor } from "./sync-cursor.js";
import type { PersistedTenantIntegration } from "./tenant-integration.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasValidEnabledCapabilities(
  values: readonly string[],
): boolean {
  if (!Array.isArray(values)) return false;
  if (!values.every(isNonEmptyText)) return false;
  return new Set(values).size === values.length;
}

/**
 * Re-evaluates only the exact current parent/capability binding predicates already
 * owned by migration 0030 for persisted SyncCursor state.
 *
 * A true result is a necessary current-binding floor only. It does not interpret
 * cursor contents, authorize synchronization, select a provider, read secrets, or
 * execute a network/OperationContract path.
 */
export function matchesCurrentSyncCursorBindingFloors(
  cursor: PersistedSyncCursor,
  tenantIntegration: PersistedTenantIntegration,
  capability: PersistedIntegrationCapability,
): boolean {
  if (
    !isUuid(cursor.id)
    || !isUuid(cursor.tenantIntegrationId)
    || !isUuid(tenantIntegration.id)
    || !isUuid(tenantIntegration.tenantId)
    || !isUuid(tenantIntegration.integrationDefinitionId)
    || !isUuid(tenantIntegration.credentialReferenceId)
    || !isUuid(capability.id)
    || !isUuid(capability.integrationDefinitionId)
  ) {
    return false;
  }

  if (
    cursor.tenantIntegrationId !== tenantIntegration.id
    || tenantIntegration.status !== "ACTIVE"
    || capability.integrationDefinitionId
      !== tenantIntegration.integrationDefinitionId
    || capability.status !== "ACTIVE"
  ) {
    return false;
  }

  if (
    !isNonEmptyText(cursor.capabilityCode)
    || !isNonEmptyText(capability.capabilityCode)
    || cursor.capabilityCode !== capability.capabilityCode
    || !hasValidEnabledCapabilities(tenantIntegration.enabledCapabilities)
    || !tenantIntegration.enabledCapabilities.includes(cursor.capabilityCode)
  ) {
    return false;
  }

  if (tenantIntegration.scopeClass === "TENANT_CORE") {
    return tenantIntegration.industryContextId === undefined
      && cursor.industryContextId === undefined;
  }

  if (tenantIntegration.scopeClass === "TENANT_INDUSTRY") {
    return isUuid(tenantIntegration.industryContextId)
      && cursor.industryContextId === tenantIntegration.industryContextId;
  }

  return false;
}
