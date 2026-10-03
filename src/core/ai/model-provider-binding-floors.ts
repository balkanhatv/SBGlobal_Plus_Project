import type { AIModelCatalogMetadata } from "./model-catalog-metadata.js";
import type { AIProviderCatalogMetadata } from "./provider-catalog-metadata.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function validModelShape(model: AIModelCatalogMetadata): boolean {
  return Boolean(
    model
    && typeof model === "object"
    && validUuid(model.id)
    && validUuid(model.providerId),
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
 * Re-evaluates only migration-0011's direct
 * AIModel.provider_id -> AIProvider.id foreign-key continuity.
 *
 * A true result is not Provider/Model currentness, health, eligibility,
 * routing, credential access or AI execution authority.
 */
export function matchesAIModelProviderBindingFloors(
  model: AIModelCatalogMetadata,
  provider?: AIProviderCatalogMetadata,
): boolean {
  if (!validModelShape(model)) return false;
  if (!provider || !validProviderShape(provider)) return false;
  return provider.id === model.providerId;
}
