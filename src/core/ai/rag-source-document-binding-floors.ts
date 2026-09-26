import type { DocumentAccessMetadata } from "../document/access-candidate.js";
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

function validPositiveSafeInteger(value: unknown): value is number {
  return typeof value === "number"
    && Number.isSafeInteger(value)
    && value > 0;
}

function validSourceShape(source: PersistedAIRAGSource): boolean {
  if (
    !source
    || typeof source !== "object"
    || !validUuid(source.id)
    || !validUuid(source.tenantId)
    || !validOptionalUuid(source.industryContextId)
    || !validScopeOwnership(source.scopeClass, source.industryContextId)
    || typeof source.residencyRegion !== "string"
    || !SENSITIVITY_RANK.has(source.sensitivityClass)
  ) {
    return false;
  }

  if (source.documentId === undefined) {
    return source.documentVersion === undefined;
  }

  return validUuid(source.documentId)
    && validPositiveSafeInteger(source.documentVersion);
}

function validDocumentShape(document: DocumentAccessMetadata): boolean {
  return Boolean(
    document
    && typeof document === "object"
    && validUuid(document.id)
    && validUuid(document.tenantId)
    && validOptionalUuid(document.industryContextId)
    && validScopeOwnership(document.scopeClass, document.industryContextId)
    && validPositiveSafeInteger(document.versionNo)
    && typeof document.residencyRegion === "string"
    && SENSITIVITY_RANK.has(document.sensitivityClass),
  );
}

/**
 * Re-evaluates only migration-0031's optional RAGSource -> DocumentMeta
 * id/version/scope/ACTIVE-CLEAN/sensitivity/residency relationship.
 *
 * A true result is not Document ACL authorization, source currentness,
 * chunk/retrieval/embedding authority, grounding or AI execution.
 */
export function matchesAIRAGSourceDocumentBindingFloors(
  source: PersistedAIRAGSource,
  document?: DocumentAccessMetadata,
): boolean {
  if (!validSourceShape(source)) return false;

  if (source.documentId === undefined) {
    return document === undefined;
  }

  if (!document || !validDocumentShape(document)) return false;
  if (document.id !== source.documentId) return false;
  if (document.versionNo !== source.documentVersion) return false;
  if (document.tenantId !== source.tenantId) return false;
  if (document.industryContextId !== source.industryContextId) return false;
  if (document.scopeClass !== source.scopeClass) return false;
  if (document.status !== "ACTIVE" || document.virusScanStatus !== "CLEAN") {
    return false;
  }
  if (document.residencyRegion !== source.residencyRegion) return false;

  const sourceRank = SENSITIVITY_RANK.get(source.sensitivityClass);
  const documentRank = SENSITIVITY_RANK.get(document.sensitivityClass);
  return sourceRank !== undefined
    && documentRank !== undefined
    && sourceRank >= documentRank;
}
