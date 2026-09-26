import type { PersistedAIMediaRequest } from "../ai/media-request.js";
import type {
  PersistedDocumentAIGeneratedProvenance,
} from "./ai-generated-provenance.js";

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

function sameOptionalString(left: string | undefined, right: string | undefined): boolean {
  return left === right;
}

function validCompletedAt(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validDocumentShape(document: PersistedDocumentAIGeneratedProvenance): boolean {
  if (
    !document
    || typeof document !== "object"
    || !validUuid(document.id)
    || !validUuid(document.tenantId)
    || !validOptionalUuid(document.industryContextId)
    || typeof document.residencyRegion !== "string"
    || !SENSITIVITY_RANK.has(document.sensitivityClass)
    || typeof document.aiGenerated !== "boolean"
  ) {
    return false;
  }

  if (!document.aiGenerated) {
    return document.aiMediaRequestId === undefined;
  }
  return validUuid(document.aiMediaRequestId);
}

function validMediaRequestShape(request: PersistedAIMediaRequest): boolean {
  return Boolean(
    request
    && typeof request === "object"
    && validUuid(request.id)
    && validUuid(request.tenantId)
    && validOptionalUuid(request.industryContextId)
    && typeof request.residencyRequirement === "string"
    && SENSITIVITY_RANK.has(request.sensitivityClass)
    && validCompletedAt(request.completedAt),
  );
}

export function matchesDocumentAIGeneratedMediaRequestProvenanceFloors(
  document: PersistedDocumentAIGeneratedProvenance,
  mediaRequest?: PersistedAIMediaRequest,
): boolean {
  if (!validDocumentShape(document)) return false;

  if (!document.aiGenerated) {
    return mediaRequest === undefined;
  }

  if (!mediaRequest || !validMediaRequestShape(mediaRequest)) return false;
  if (document.aiMediaRequestId !== mediaRequest.id) return false;
  if (document.tenantId !== mediaRequest.tenantId) return false;
  if (!sameOptionalString(document.industryContextId, mediaRequest.industryContextId)) {
    return false;
  }
  if (document.residencyRegion !== mediaRequest.residencyRequirement) return false;

  const documentRank = SENSITIVITY_RANK.get(document.sensitivityClass);
  const requestRank = SENSITIVITY_RANK.get(mediaRequest.sensitivityClass);
  return documentRank !== undefined
    && requestRank !== undefined
    && documentRank >= requestRank;
}
