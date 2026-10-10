import type { AICapabilityCatalogMetadata } from "./capability-catalog-metadata.js";
import type { PersistedAITenantConfig } from "./tenant-config.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function hasValidConfigShape(config: PersistedAITenantConfig): boolean {
  return Boolean(
    config
    && typeof config === "object"
    && isUuid(config.id)
    && isUuid(config.tenantId)
    && Array.isArray(config.allowedCapabilities)
    && config.allowedCapabilities.every((code) => typeof code === "string")
    && new Set(config.allowedCapabilities).size === config.allowedCapabilities.length,
  );
}

function hasValidCapabilityShape(
  capability: AICapabilityCatalogMetadata,
): boolean {
  return Boolean(
    capability
    && typeof capability === "object"
    && isUuid(capability.id)
    && typeof capability.code === "string"
    && typeof capability.status === "string",
  );
}

/**
 * Re-evaluates only migration-0031's TenantAIConfig allowed-capability
 * duplicate-free exact-code/raw-ACTIVE relationship.
 *
 * A true result is not current/latest config selection, runtime enablement,
 * entitlement/policy satisfaction, Provider/Model validity, routing or AI
 * execution authority.
 */
export function matchesAITenantConfigCapabilityAllowlistFloors(
  config: PersistedAITenantConfig,
  capabilities: readonly AICapabilityCatalogMetadata[],
): boolean {
  if (!hasValidConfigShape(config) || !Array.isArray(capabilities)) {
    return false;
  }

  if (capabilities.length !== config.allowedCapabilities.length) {
    return false;
  }

  const allowed = new Set(config.allowedCapabilities);
  const evidenceCodes = new Set<string>();

  for (const capability of capabilities) {
    if (!hasValidCapabilityShape(capability)) return false;
    if (evidenceCodes.has(capability.code)) return false;
    if (!allowed.has(capability.code)) return false;
    if (capability.status !== "ACTIVE") return false;
    evidenceCodes.add(capability.code);
  }

  return evidenceCodes.size === allowed.size
    && config.allowedCapabilities.every((code) => evidenceCodes.has(code));
}
