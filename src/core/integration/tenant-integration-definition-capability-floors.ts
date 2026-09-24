import type { PersistedIntegrationCapability } from "./integration-capability.js";
import type { PersistedIntegrationDefinition } from "./integration-definition.js";
import type { PersistedTenantIntegration } from "./tenant-integration.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isJsonObject(value: unknown): boolean {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasValidEnabledCapabilities(values: readonly string[]): boolean {
  if (!Array.isArray(values) || !values.every(isNonEmptyText)) return false;
  return new Set(values).size === values.length;
}

/**
 * Re-evaluates only the IntegrationDefinition/config/enabled-capability predicates
 * owned by migration 0030 for an already-persisted TenantIntegration.
 *
 * A true result is a necessary current-set floor only. It does not authorize the
 * TenantIntegration, select a provider, resolve credentials, or execute an
 * OperationContract/event/network path.
 */
export function matchesCurrentTenantIntegrationDefinitionCapabilityFloors(
  integration: PersistedTenantIntegration,
  definition: PersistedIntegrationDefinition,
  capabilities: readonly PersistedIntegrationCapability[],
): boolean {
  if (
    !isUuid(integration.id)
    || !isUuid(integration.integrationDefinitionId)
    || !isUuid(definition.id)
    || definition.id !== integration.integrationDefinitionId
    || definition.status !== "ACTIVE"
  ) {
    return false;
  }

  if (!isJsonObject(integration.config)) return false;

  if (
    !hasValidEnabledCapabilities(integration.enabledCapabilities)
    || !Array.isArray(definition.capabilityCodes)
    || !definition.capabilityCodes.every(isNonEmptyText)
    || !Array.isArray(capabilities)
  ) {
    return false;
  }

  for (const enabledCode of integration.enabledCapabilities) {
    if (!definition.capabilityCodes.includes(enabledCode)) return false;

    const matches = capabilities.filter(
      (capability) =>
        capability.integrationDefinitionId === definition.id
        && capability.capabilityCode === enabledCode,
    );

    if (matches.length !== 1 || matches[0]?.status !== "ACTIVE") {
      return false;
    }
  }

  return true;
}
