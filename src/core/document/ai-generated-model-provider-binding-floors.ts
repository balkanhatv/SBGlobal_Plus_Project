import type { AIModelCatalogMetadata } from "../ai/model-catalog-metadata.js";
import type {
  PersistedDocumentAIGeneratedProvenance,
} from "./ai-generated-provenance.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function validOptionalUuid(value: unknown): value is string | undefined {
  return value === undefined || validUuid(value);
}

function validDocumentShape(
  document: PersistedDocumentAIGeneratedProvenance,
): boolean {
  if (
    !document
    || typeof document !== "object"
    || !validUuid(document.id)
    || !validUuid(document.tenantId)
    || !validOptionalUuid(document.industryContextId)
    || typeof document.aiGenerated !== "boolean"
  ) {
    return false;
  }

  if (!document.aiGenerated) {
    return document.aiModelId === undefined
      && document.aiProviderId === undefined;
  }

  return validUuid(document.aiModelId)
    && validUuid(document.aiProviderId);
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
 * Re-evaluates only migration-0031's generated Document ->
 * exact AIModel(id, provider_id) composite-foreign-key relationship.
 *
 * A true result is not Model/Provider currentness, eligibility, routing,
 * capability/residency/sensitivity policy, credential access, Document
 * authorization or AI execution authority.
 */
export function matchesDocumentAIGeneratedModelProviderBindingFloors(
  document: PersistedDocumentAIGeneratedProvenance,
  model?: AIModelCatalogMetadata,
): boolean {
  if (!validDocumentShape(document)) return false;

  if (!document.aiGenerated) {
    return model === undefined;
  }

  if (!model || !validModelPairShape(model)) return false;
  return model.id === document.aiModelId
    && model.providerId === document.aiProviderId;
}
