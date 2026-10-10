import type { AIModelCatalogMetadata } from "./model-catalog-metadata.js";
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
    && validUuid(usage.modelId)
    && validUuid(usage.providerId),
  );
}

function validModelPairShape(model: AIModelCatalogMetadata): boolean {
  return Boolean(
    model
    && typeof model === "object"
    && validUuid(model.id)
    && validUuid(model.providerId),
  );
}

/**
 * Re-evaluates only migration-0031's TokenUsage ->
 * AIModel(id, provider_id) composite foreign-key relationship.
 *
 * A true result is not Model/Provider currentness, eligibility, routing,
 * capability, principal authorization, billing or AI execution authority.
 */
export function matchesAITokenUsageModelProviderBindingFloors(
  usage: PersistedAITokenUsage,
  model?: AIModelCatalogMetadata,
): boolean {
  if (!validUsageShape(usage)) return false;
  if (!model || !validModelPairShape(model)) return false;

  return model.id === usage.modelId
    && model.providerId === usage.providerId;
}
