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

function hasValidSnapshotShape(
  snapshot: PersistedAIProvisioningSnapshot,
): boolean {
  return Boolean(
    snapshot
    && typeof snapshot === "object"
    && isUuid(snapshot.id)
    && isUuid(snapshot.tenantId)
    && typeof snapshot.tenantAiConfigVersion === "string"
    && POSITIVE_INTEGER_TEXT.test(snapshot.tenantAiConfigVersion)
    && isDenseUuidSet(snapshot.allowedProviderIds),
  );
}

function hasValidTenantConfigShape(config: PersistedAITenantConfig): boolean {
  return Boolean(
    config
    && typeof config === "object"
    && isUuid(config.id)
    && isUuid(config.tenantId)
    && typeof config.enabled === "boolean"
    && Number.isSafeInteger(config.version)
    && config.version > 0
    && isDenseUuidSet(config.allowedProviderIds),
  );
}

function isSubset(candidate: readonly string[], allowed: readonly string[]): boolean {
  const allowedSet = new Set(allowed);
  for (const value of candidate) {
    if (!allowedSet.has(value)) return false;
  }
  return true;
}

/**
 * Re-evaluates only migration-0031's AIProvisioningSnapshot -> exact supplied
 * TenantAIConfig same-Tenant/version/enabled/provider-subset relationship.
 *
 * A true result does not select current/latest configuration, validate snapshot
 * capability ids, establish commercial/Industry currentness, compile effective
 * provisioning, route providers/models, or authorize AI execution.
 */
export function matchesAIProvisioningSnapshotTenantConfigFloors(
  snapshot: PersistedAIProvisioningSnapshot,
  tenantConfig: PersistedAITenantConfig,
): boolean {
  if (!hasValidSnapshotShape(snapshot) || !hasValidTenantConfigShape(tenantConfig)) {
    return false;
  }

  if (snapshot.tenantId !== tenantConfig.tenantId) return false;
  if (snapshot.tenantAiConfigVersion !== String(tenantConfig.version)) return false;
  if (!tenantConfig.enabled) return false;

  return isSubset(snapshot.allowedProviderIds, tenantConfig.allowedProviderIds);
}
