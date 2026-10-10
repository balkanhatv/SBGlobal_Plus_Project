import type { AIProviderCatalogMetadata } from "./provider-catalog-metadata.js";
import type { PersistedAITokenUsage } from "./token-usage.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function validOptionalUuid(value: unknown): value is string | undefined {
  return value === undefined || validUuid(value);
}

function validUsageShape(usage: PersistedAITokenUsage): boolean {
  return Boolean(
    usage
    && typeof usage === "object"
    && validUuid(usage.id)
    && validUuid(usage.tenantId)
    && validOptionalUuid(usage.industryContextId)
    && validUuid(usage.providerId),
  );
}

function validProviderShape(provider: AIProviderCatalogMetadata): boolean {
  return Boolean(
    provider
    && typeof provider === "object"
    && validUuid(provider.id),
  );
}

/**
 * Re-evaluates only migration-0012's direct
 * TokenUsage.provider_id -> AIProvider.id foreign-key continuity.
 *
 * A true result is not Provider currentness, health, eligibility,
 * credential access, routing, billing or AI execution authority.
 */
export function matchesAITokenUsageProviderBindingFloors(
  usage: PersistedAITokenUsage,
  provider?: AIProviderCatalogMetadata,
): boolean {
  if (!validUsageShape(usage)) return false;
  if (!provider || !validProviderShape(provider)) return false;
  return provider.id === usage.providerId;
}
