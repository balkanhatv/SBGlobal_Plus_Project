import type { AIProviderCatalogMetadata } from "./provider-catalog-metadata.js";
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
    && Array.isArray(config.allowedProviderIds)
    && config.allowedProviderIds.every((providerId) => isUuid(providerId))
    && new Set(config.allowedProviderIds).size === config.allowedProviderIds.length,
  );
}

function hasValidProviderShape(provider: AIProviderCatalogMetadata): boolean {
  return Boolean(
    provider
    && typeof provider === "object"
    && isUuid(provider.id)
    && typeof provider.status === "string",
  );
}

/**
 * Re-evaluates only migration-0031's TenantAIConfig allowed-provider
 * duplicate-free exact-id/raw-ACTIVE relationship.
 *
 * A true result is not current/latest config selection, runtime enablement,
 * Provider health/credentials/suitability, Model validity, routing or AI
 * execution authority.
 */
export function matchesAITenantConfigProviderAllowlistFloors(
  config: PersistedAITenantConfig,
  providers: readonly AIProviderCatalogMetadata[],
): boolean {
  if (!hasValidConfigShape(config) || !Array.isArray(providers)) {
    return false;
  }

  if (providers.length !== config.allowedProviderIds.length) {
    return false;
  }

  const allowed = new Set(config.allowedProviderIds);
  const evidenceIds = new Set<string>();

  for (const provider of providers) {
    if (!hasValidProviderShape(provider)) return false;
    if (evidenceIds.has(provider.id)) return false;
    if (!allowed.has(provider.id)) return false;
    if (provider.status !== "ACTIVE") return false;
    evidenceIds.add(provider.id);
  }

  return evidenceIds.size === allowed.size
    && config.allowedProviderIds.every((providerId) => evidenceIds.has(providerId));
}
