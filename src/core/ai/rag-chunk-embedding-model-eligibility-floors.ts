import type { AIModelCatalogMetadata } from "./model-catalog-metadata.js";
import type { PersistedAIRAGChunkMetadata } from "./rag-chunk-metadata.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SENSITIVITY_RANK = new Map<string, number>([
  ["PUBLIC", 1],
  ["INTERNAL", 2],
  ["CONFIDENTIAL", 3],
  ["SENSITIVE_PERSONAL", 4],
  ["REGULATED", 5],
]);

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function validChunkShape(chunk: PersistedAIRAGChunkMetadata): boolean {
  return Boolean(
    chunk
    && typeof chunk === "object"
    && validUuid(chunk.id)
    && validUuid(chunk.embeddingModelId)
    && SENSITIVITY_RANK.has(chunk.sensitivityClass),
  );
}

function validModelShape(model: AIModelCatalogMetadata): boolean {
  return Boolean(
    model
    && typeof model === "object"
    && validUuid(model.id)
    && typeof model.status === "string"
    && SENSITIVITY_RANK.has(model.sensitivityCeiling),
  );
}

/**
 * Re-evaluates only migration-0031's RAGChunk -> embedding AIModel
 * exact-id/ACTIVE/sensitivity-ceiling eligibility predicate.
 *
 * A true result is not Provider currentness, routing, capability/modality/
 * residency compatibility, retrieval/grounding or AI execution authority.
 */
export function matchesAIRAGChunkEmbeddingModelEligibilityFloors(
  chunk: PersistedAIRAGChunkMetadata,
  model?: AIModelCatalogMetadata,
): boolean {
  if (!validChunkShape(chunk)) return false;
  if (!model || !validModelShape(model)) return false;
  if (model.id !== chunk.embeddingModelId) return false;
  if (model.status !== "ACTIVE") return false;

  const modelRank = SENSITIVITY_RANK.get(model.sensitivityCeiling);
  const chunkRank = SENSITIVITY_RANK.get(chunk.sensitivityClass);
  return modelRank !== undefined
    && chunkRank !== undefined
    && modelRank >= chunkRank;
}
