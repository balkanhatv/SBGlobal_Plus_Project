import type { AIModelCatalogMetadata } from "./model-catalog-metadata.js";
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
    && new Set(config.allowedProviderIds).size === config.allowedProviderIds.length
    && Array.isArray(config.allowedModelIds)
    && config.allowedModelIds.every((modelId) => isUuid(modelId))
    && new Set(config.allowedModelIds).size === config.allowedModelIds.length,
  );
}

function hasValidModelShape(model: AIModelCatalogMetadata): boolean {
  return Boolean(
    model
    && typeof model === "object"
    && isUuid(model.id)
    && isUuid(model.providerId)
    && typeof model.status === "string",
  );
}

/**
 * Re-evaluates only migration-0031's TenantAIConfig allowed-model
 * duplicate-free exact-id/raw-ACTIVE/model-provider-in-config relationship.
 *
 * A true result is not current/latest config selection, runtime enablement,
 * Provider-row validity/suitability, effective configuration, routing or AI
 * execution authority.
 */
export function matchesAITenantConfigModelAllowlistFloors(
  config: PersistedAITenantConfig,
  models: readonly AIModelCatalogMetadata[],
): boolean {
  if (!hasValidConfigShape(config) || !Array.isArray(models)) {
    return false;
  }

  if (models.length !== config.allowedModelIds.length) {
    return false;
  }

  const allowedModels = new Set(config.allowedModelIds);
  const allowedProviders = new Set(config.allowedProviderIds);
  const evidenceIds = new Set<string>();

  for (const model of models) {
    if (!hasValidModelShape(model)) return false;
    if (evidenceIds.has(model.id)) return false;
    if (!allowedModels.has(model.id)) return false;
    if (model.status !== "ACTIVE") return false;
    if (!allowedProviders.has(model.providerId)) return false;
    evidenceIds.add(model.id);
  }

  return evidenceIds.size === allowedModels.size
    && config.allowedModelIds.every((modelId) => evidenceIds.has(modelId));
}
