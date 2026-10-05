import type { RequestContext } from "../context/contracts.js";
import {
  DocumentAccessCandidateService,
  type DocumentAccessCandidate,
  type DocumentAccessMetadataPort,
} from "./access-candidate.js";
import {
  DocumentAclSubjectMatcher,
} from "./acl-subject-match.js";
import type {
  DocumentAclEntry,
  DocumentAclPermission,
  DocumentAclReadPort,
} from "./acl.js";

export interface DocumentAccessAclSubjectEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly documentId: string;
  readonly permission: DocumentAclPermission;
}

export interface DocumentAccessAclSubjectEvidence {
  readonly candidate: DocumentAccessCandidate;
  readonly rawAclEntries: readonly DocumentAclEntry[];
  readonly matchedEntries: readonly DocumentAclEntry[];
  readonly permission: DocumentAclPermission;
}

/**
 * DD-538…DD-542: compose only the already-governed DD-082 pre-sign
 * Document candidate, DD-084 raw ACL read and DD-085 subject matching.
 *
 * This is evidence only. ACL effect/expiry, DENY precedence, final
 * authorization, sensitivity/step-up/residency policy, storage signing and
 * download/share/delete authority remain separately governed.
 */
export async function loadDocumentAccessAclSubjectEvidence(
  input: DocumentAccessAclSubjectEvidenceReadInput,
  metadataReader: DocumentAccessMetadataPort,
  aclReader: DocumentAclReadPort,
  matcher: DocumentAclSubjectMatcher = new DocumentAclSubjectMatcher(),
): Promise<DocumentAccessAclSubjectEvidence> {
  const candidate = await new DocumentAccessCandidateService(metadataReader).prepare({
    requestContext: input.requestContext,
    documentId: input.documentId,
  });

  const rawAclEntries = await aclReader.loadForDocument({
    requestContext: input.requestContext,
    documentId: candidate.documentId,
  });

  const matchedEntries = matcher.match({
    requestContext: input.requestContext,
    documentId: candidate.documentId,
    permission: input.permission,
    entries: rawAclEntries,
  });

  return Object.freeze({
    candidate,
    rawAclEntries,
    matchedEntries,
    permission: input.permission,
  });
}
