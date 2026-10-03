import type { AICapabilityCatalogMetadata } from "./capability-catalog-metadata.js";
import type { PersistedAIProvisioningSnapshot } from "./provisioning-snapshot.js";
import type { PersistedAITenantConfig } from "./tenant-config.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POSITIVE_INTEGER_TEXT = /^[1-9][0-9]*$/;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isDenseUuidSet(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && Array.from(value).every((entry) => isUuid(entry))
    && new Set(value).size === value.length;
}

function isDenseStringSet(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && Array.from(value).every((entry) => typeof entry === "string")
    && new Set(value).size === value.length;
}

function validSnapshotShape(snapshot: PersistedAIProvisioningSnapshot): boolean {
  return Boolean(
    snapshot
    && typeof snapshot === "object"
    && isUuid(snapshot.id)
    && isUuid(snapshot.tenantId)
    && typeof snapshot.tenantAiConfigVersion === "string"
    && POSITIVE_INTEGER_TEXT.test(snapshot.tenantAiConfigVersion)
    && isDenseUuidSet(snapshot.allowedCapabilityIds),
  );
}

function validTenantConfigShape(config: PersistedAITenantConfig): boolean {
  return Boolean(
    config
    && typeof config === "object"
    && isUuid(config.id)
    && isUuid(config.tenantId)
    && Number.isSafeInteger(config.version)
    && config.version > 0
    && isDenseStringSet(config.allowedCapabilities),
  );
}

function validCapabilityShape(capability: AICapabilityCatalogMetadata): boolean {
  return Boolean(
    capability
    && typeof capability === "object"
    && isUuid(capability.id)
    && typeof capability.code === "string"
    && typeof capability.status === "string",
  );
}

/**
 * Re-evaluates only migration-0031's ProvisioningSnapshot allowedCapabilityIds
 * -> exact ACTIVE AICapability id + exact code-in-referenced-TenantAIConfig
 * relationship.
 *
 * DD-211 separately owns referenced TenantAIConfig enabled/provider floors.
 * A true result here is not entitlement, policy, provisioning-currentness,
 * routing, or AI execution authority.
 */
export function matchesAIProvisioningSnapshotCapabilityFloors(
  snapshot: PersistedAIProvisioningSnapshot,
  tenantConfig: PersistedAITenantConfig,
  capabilities: readonly AICapabilityCatalogMetadata[],
): boolean {
  if (
    !validSnapshotShape(snapshot)
    || !validTenantConfigShape(tenantConfig)
    || !Array.isArray(capabilities)
  ) {
    return false;
  }

  if (snapshot.tenantId !== tenantConfig.tenantId) return false;
  if (snapshot.tenantAiConfigVersion !== String(tenantConfig.version)) return false;
  if (capabilities.length !== snapshot.allowedCapabilityIds.length) return false;

  const allowedIds = new Set(snapshot.allowedCapabilityIds);
  const allowedCodes = new Set(tenantConfig.allowedCapabilities);
  const evidenceIds = new Set<string>();

  for (const capability of capabilities) {
    if (!validCapabilityShape(capability)) return false;
    if (evidenceIds.has(capability.id)) return false;
    if (!allowedIds.has(capability.id)) return false;
    if (capability.status !== "ACTIVE") return false;
    if (!allowedCodes.has(capability.code)) return false;
    evidenceIds.add(capability.id);
  }

  return evidenceIds.size === allowedIds.size
    && snapshot.allowedCapabilityIds.every((id) => evidenceIds.has(id));
}
