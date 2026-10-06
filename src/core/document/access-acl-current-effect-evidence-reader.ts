import type {
  DocumentAclPermission,
  DocumentAclReadPort,
} from "./acl.js";
import {
  DocumentAclSubjectMatcher,
} from "./acl-subject-match.js";
import {
  loadDocumentAccessAclSubjectEvidence,
  type DocumentAccessAclSubjectEvidence,
} from "./access-acl-subject-evidence-reader.js";
import {
  evaluateDocumentAclCurrentEffectEvidence,
  type DocumentAclCurrentEffectEvidence,
} from "./acl-current-effect.js";
export {
  DocumentAccessAclCurrentEffectEvidenceError,
} from "./acl-current-effect.js";
export type {
  DocumentAccessAclCurrentEffectEvidenceErrorCode,
  DocumentAclCurrentEffectEvidence,
} from "./acl-current-effect.js";
import type { DocumentAccessMetadataPort } from "./access-candidate.js";
import type { RequestContext } from "../context/contracts.js";

export interface DocumentAccessAclCurrentEffectEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly documentId: string;
  readonly permission: DocumentAclPermission;
  readonly currentTimeIso: string;
}

export interface DocumentAccessAclCurrentEffectEvidence {
  readonly parent: DocumentAccessAclSubjectEvidence;
  readonly currentTimeIso: string;
  readonly currentEntries: readonly import("./acl.js").DocumentAclEntry[];
  readonly expiredEntries: readonly import("./acl.js").DocumentAclEntry[];
  readonly effectEvidence: DocumentAclCurrentEffectEvidence;
}

/**
 * DD-558…DD-562: extend exact DD-542 matched-subject ACL evidence with only
 * validUntil currentness and DD-08 explicit-DENY-wins effect evidence.
 *
 * This remains an ACL-layer evidence result only. It does not choose
 * source-resource fallback or establish final authorization, signing, grant,
 * download/share/delete or mutation authority.
 */
export async function loadDocumentAccessAclCurrentEffectEvidence(
  input: DocumentAccessAclCurrentEffectEvidenceReadInput,
  metadataReader: DocumentAccessMetadataPort,
  aclReader: DocumentAclReadPort,
  matcher: DocumentAclSubjectMatcher = new DocumentAclSubjectMatcher(),
): Promise<DocumentAccessAclCurrentEffectEvidence> {
  const parent = await loadDocumentAccessAclSubjectEvidence(
    {
      requestContext: input.requestContext,
      documentId: input.documentId,
      permission: input.permission,
    },
    metadataReader,
    aclReader,
    matcher,
  );

  const evaluation = evaluateDocumentAclCurrentEffectEvidence({
    matchedEntries: parent.matchedEntries,
    currentTimeIso: input.currentTimeIso,
  });

  return Object.freeze({
    parent,
    currentTimeIso: input.currentTimeIso,
    currentEntries: evaluation.currentEntries,
    expiredEntries: evaluation.expiredEntries,
    effectEvidence: evaluation.effectEvidence,
  });
}
