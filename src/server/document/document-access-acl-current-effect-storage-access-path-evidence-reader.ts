import type { RequestContext } from "../../core/context/contracts.js";
import type { DocumentAccessMetadataPort } from "../../core/document/access-candidate.js";
import {
  classifyDocumentAclAccessPathEvidence,
} from "../../core/document/acl-access-path-evidence.js";
import type {
  DocumentAccessAclPathEvidence,
} from "../../core/document/acl-access-path-evidence.js";
export type {
  DocumentAccessAclPathEvidence,
} from "../../core/document/acl-access-path-evidence.js";
import {
  DocumentAclSubjectMatcher,
} from "../../core/document/acl-subject-match.js";
import type {
  DocumentAclPermission,
  DocumentAclReadPort,
} from "../../core/document/acl.js";
import {
  loadDocumentAccessAclCurrentEffectStorageBindingEvidence,
  type DocumentAccessAclCurrentEffectStorageBindingEvidence,
} from "./document-access-acl-current-effect-storage-binding-evidence-reader.js";
import type {
  DocumentStorageBindingReadPort,
} from "./document-access-storage-binding-evidence-reader.js";


export interface DocumentAccessAclCurrentEffectStorageAccessPathEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly documentId: string;
  readonly permission: DocumentAclPermission;
  readonly currentTimeIso: string;
}

export interface DocumentAccessAclCurrentEffectStorageAccessPathEvidence {
  readonly parent: DocumentAccessAclCurrentEffectStorageBindingEvidence;
  readonly accessPathEvidence: DocumentAccessAclPathEvidence;
}

/**
 * DD-568…DD-572: extend exact DD-567 ACL current-effect + physical binding
 * evidence with a pure three-way ACL access-path classification.
 *
 * This performs zero additional reads. EXPLICIT_ACL_DENY blocks
 * source-resource fallback at the ACL layer. EXPLICIT_ACL_ALLOW is positive
 * ACL-path evidence only. SOURCE_RESOURCE_AUTHORIZATION_REQUIRED means the
 * source-resource authorization path still needs to run. None of these values
 * is a full authorization/signing/storage-operation decision.
 */
export async function loadDocumentAccessAclCurrentEffectStorageAccessPathEvidence(
  input: DocumentAccessAclCurrentEffectStorageAccessPathEvidenceReadInput,
  metadataReader: DocumentAccessMetadataPort,
  aclReader: DocumentAclReadPort,
  bindingReader: DocumentStorageBindingReadPort,
  matcher: DocumentAclSubjectMatcher = new DocumentAclSubjectMatcher(),
): Promise<DocumentAccessAclCurrentEffectStorageAccessPathEvidence | null> {
  const parent = await loadDocumentAccessAclCurrentEffectStorageBindingEvidence(
    input,
    metadataReader,
    aclReader,
    bindingReader,
    matcher,
  );
  if (parent === null) return null;

  const accessPathEvidence: DocumentAccessAclPathEvidence =
    classifyDocumentAclAccessPathEvidence(parent.parent.effectEvidence);

  return Object.freeze({
    parent,
    accessPathEvidence,
  });
}
