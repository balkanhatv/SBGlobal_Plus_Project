import type { RequestContext } from "../../core/context/contracts.js";
import type { DocumentAccessMetadataPort } from "../../core/document/access-candidate.js";
import {
  loadDocumentAccessAclSubjectEvidence,
  type DocumentAccessAclSubjectEvidence,
} from "../../core/document/access-acl-subject-evidence-reader.js";
import {
  DocumentAclSubjectMatcher,
} from "../../core/document/acl-subject-match.js";
import type {
  DocumentAclPermission,
  DocumentAclReadPort,
} from "../../core/document/acl.js";
import type {
  DocumentStorageBindingReadPort,
} from "./document-access-storage-binding-evidence-reader.js";
import type {
  DocumentStorageBinding,
} from "./postgres-document-storage-binding-store.js";

export interface DocumentAccessAclStorageBindingEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly documentId: string;
  readonly permission: DocumentAclPermission;
}

export interface DocumentAccessAclStorageBindingEvidence {
  readonly parent: DocumentAccessAclSubjectEvidence;
  readonly binding: DocumentStorageBinding;
}

/**
 * DD-548…DD-552: extend exact DD-542 Document candidate/raw-ACL/subject
 * evidence with one DD-086 physical StorageObject binding read using only the
 * exact candidate linkage already preserved by DD-542.
 *
 * This is internal evidence only. It does not interpret ACL effectiveness,
 * authorize a Document operation, select/decrypt a provider, sign access,
 * dispatch StoragePort operations or mutate Document/Storage/ACL state.
 */
export async function loadDocumentAccessAclStorageBindingEvidence(
  input: DocumentAccessAclStorageBindingEvidenceReadInput,
  metadataReader: DocumentAccessMetadataPort,
  aclReader: DocumentAclReadPort,
  bindingReader: DocumentStorageBindingReadPort,
  matcher: DocumentAclSubjectMatcher = new DocumentAclSubjectMatcher(),
): Promise<DocumentAccessAclStorageBindingEvidence | null> {
  const parent = await loadDocumentAccessAclSubjectEvidence(
    input,
    metadataReader,
    aclReader,
    matcher,
  );

  const binding = await bindingReader.load({
    requestContext: input.requestContext,
    documentId: parent.candidate.documentId,
    storageObjectId: parent.candidate.storageObjectId,
  });
  if (binding === null) return null;

  return Object.freeze({
    parent,
    binding,
  });
}
