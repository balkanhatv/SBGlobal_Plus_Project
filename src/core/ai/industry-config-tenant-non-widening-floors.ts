import type { PersistedAIIndustryConfig } from "./industry-config.js";
import type { PersistedAITenantConfig } from "./tenant-config.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isDenseStringSet(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && Array.from(value).every((entry) => typeof entry === "string")
    && new Set(value).size === value.length;
}

function isDenseUuidSet(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && Array.from(value).every((entry) => isUuid(entry))
    && new Set(value).size === value.length;
}

function hasValidIndustryConfigShape(
  config: PersistedAIIndustryConfig,
): boolean {
  return Boolean(
    config
    && typeof config === "object"
    && isUuid(config.id)
    && isUuid(config.tenantId)
    && isUuid(config.industryContextId)
    && typeof config.enabled === "boolean"
    && isDenseStringSet(config.allowedCapabilities)
    && isDenseUuidSet(config.allowedProviderIds)
    && isDenseUuidSet(config.allowedModelIds),
  );
}

function hasValidTenantConfigShape(config: PersistedAITenantConfig): boolean {
  return Boolean(
    config
    && typeof config === "object"
    && isUuid(config.id)
    && isUuid(config.tenantId)
    && typeof config.enabled === "boolean"
    && isDenseStringSet(config.allowedCapabilities)
    && isDenseUuidSet(config.allowedProviderIds)
    && isDenseUuidSet(config.allowedModelIds),
  );
}

function isSubset<T>(candidate: readonly T[], allowed: readonly T[]): boolean {
  const allowedSet = new Set(allowed);
  for (const value of candidate) {
    if (!allowedSet.has(value)) return false;
  }
  return true;
}

/**
 * Re-evaluates only migration-0031's IndustryAIConfig -> supplied
 * TenantAIConfig same-Tenant enabled/capability/provider/model non-widening
 * relationship.
 *
 * A true result does not select current/latest configuration, reconstruct the
 * historical write-time TenantAIConfig, compose effective configuration,
 * authorize provisioning/routing, or grant AI execution authority.
 */
export function matchesAIIndustryConfigTenantNonWideningFloors(
  industryConfig: PersistedAIIndustryConfig,
  tenantConfig: PersistedAITenantConfig,
): boolean {
  if (
    !hasValidIndustryConfigShape(industryConfig)
    || !hasValidTenantConfigShape(tenantConfig)
  ) {
    return false;
  }

  if (industryConfig.tenantId !== tenantConfig.tenantId) {
    return false;
  }

  if (industryConfig.enabled && !tenantConfig.enabled) {
    return false;
  }

  return isSubset(
    industryConfig.allowedCapabilities,
    tenantConfig.allowedCapabilities,
  )
    && isSubset(
      industryConfig.allowedProviderIds,
      tenantConfig.allowedProviderIds,
    )
    && isSubset(
      industryConfig.allowedModelIds,
      tenantConfig.allowedModelIds,
    );
}
