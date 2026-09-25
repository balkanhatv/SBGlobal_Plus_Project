import type { DocumentAccessMetadata } from "../document/access-candidate.js";
import type { PersistedAIMediaRequest } from "./media-request.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sensitivityClasses: readonly string[] = [
  "PUBLIC", "INTERNAL", "CONFIDENTIAL", "SENSITIVE_PERSONAL", "REGULATED",
];
const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID.test(value);

/** Migration-0031 input-document relationship only. This neither grants ACL or
 * storage access nor authorizes principal, prompt, provider or AI execution. */
export function matchesAIMediaRequestInputDocumentBindingFloors(
  request: PersistedAIMediaRequest,
  documents: readonly DocumentAccessMetadata[],
): boolean {
  if (!request || !isUuid(request.id) || !isUuid(request.tenantId)
    || (request.industryContextId !== undefined && !isUuid(request.industryContextId))
    || !Array.isArray(request.inputDocumentRefs) || !Array.isArray(documents)
    || typeof request.residencyRequirement !== "string") return false;

  const ceiling = sensitivityClasses.indexOf(request.sensitivityClass);
  if (ceiling < 0) return false;

  const references = new Set<string>();
  for (const id of request.inputDocumentRefs) {
    if (!isUuid(id) || references.has(id)) return false;
    references.add(id);
  }
  if (documents.length !== references.size) return false;

  const seen = new Set<string>();
  for (const document of documents) {
    if (!document || !isUuid(document.id) || !references.has(document.id)
      || seen.has(document.id) || !isUuid(document.tenantId)
      || (document.industryContextId !== undefined && !isUuid(document.industryContextId))
      || document.tenantId !== request.tenantId
      || document.industryContextId !== request.industryContextId
      || document.status !== "ACTIVE" || document.virusScanStatus !== "CLEAN"
      || typeof document.residencyRegion !== "string"
      || document.residencyRegion !== request.residencyRequirement) return false;

    const rank = sensitivityClasses.indexOf(document.sensitivityClass);
    if (rank < 0 || rank > ceiling) return false;
    seen.add(document.id);
  }
  return true;
}
