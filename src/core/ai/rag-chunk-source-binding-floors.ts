import type { PersistedAIRAGChunkMetadata } from "./rag-chunk-metadata.js";
import type { PersistedAIRAGSource } from "./rag-source.js";

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

function validOptionalUuid(value: unknown): value is string | undefined {
  return value === undefined || validUuid(value);
}

function validScopeOwnership(
  scopeClass: unknown,
  industryContextId: unknown,
): boolean {
  if (scopeClass === "TENANT_CORE") {
    return industryContextId === undefined;
  }
  if (scopeClass === "TENANT_INDUSTRY") {
    return validUuid(industryContextId);
  }
  return false;
}

function validExactText(value: unknown): value is string {
  return typeof value === "string";
}

function validChunkShape(chunk: PersistedAIRAGChunkMetadata): boolean {
  return Boolean(
    chunk
    && typeof chunk === "object"
    && validUuid(chunk.id)
    && validUuid(chunk.sourceId)
    && validUuid(chunk.tenantId)
    && validOptionalUuid(chunk.industryContextId)
    && validScopeOwnership(chunk.scopeClass, chunk.industryContextId)
    && validExactText(chunk.residencyRegion)
    && validExactText(chunk.retentionClass)
    && SENSITIVITY_RANK.has(chunk.sensitivityClass),
  );
}

function validSourceShape(source: PersistedAIRAGSource): boolean {
  return Boolean(
    source
    && typeof source === "object"
    && validUuid(source.id)
    && validUuid(source.tenantId)
    && validOptionalUuid(source.industryContextId)
    && validScopeOwnership(source.scopeClass, source.industryContextId)
    && validExactText(source.residencyRegion)
    && validExactText(source.retentionClass)
    && SENSITIVITY_RANK.has(source.sensitivityClass),
  );
}

/**
 * Re-evaluates only migration-0031's RAGChunk -> parent RAGSource
 * id/scope/residency/retention/sensitivity-continuity relationship.
 *
 * A true result is not source currentness, Document/ACL authorization,
 * embedding-model eligibility, retrieval/grounding or AI execution.
 */
export function matchesAIRAGChunkSourceBindingFloors(
  chunk: PersistedAIRAGChunkMetadata,
  source?: PersistedAIRAGSource,
): boolean {
  if (!validChunkShape(chunk)) return false;
  if (!source || !validSourceShape(source)) return false;

  if (source.id !== chunk.sourceId) return false;
  if (source.tenantId !== chunk.tenantId) return false;
  if (source.industryContextId !== chunk.industryContextId) return false;
  if (source.scopeClass !== chunk.scopeClass) return false;
  if (source.residencyRegion !== chunk.residencyRegion) return false;
  if (source.retentionClass !== chunk.retentionClass) return false;

  const chunkRank = SENSITIVITY_RANK.get(chunk.sensitivityClass);
  const sourceRank = SENSITIVITY_RANK.get(source.sensitivityClass);
  return chunkRank !== undefined
    && sourceRank !== undefined
    && chunkRank >= sourceRank;
}
