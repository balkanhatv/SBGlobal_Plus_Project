import type { RequestContext } from "../../core/context/contracts.js";
import {
  loadDocumentAccessAclCurrentEffectEvidence,
  type DocumentAccessAclCurrentEffectEvidence,
} from "../../core/document/access-acl-current-effect-evidence-reader.js";
import type { DocumentAccessMetadataPort } from "../../core/document/access-candidate.js";
import { DocumentAclSubjectMatcher } from "../../core/document/acl-subject-match.js";
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

export interface DocumentAccessAclCurrentEffectStorageBindingEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly documentId: string;
  readonly permission: DocumentAclPermission;
  readonly currentTimeIso: string;
}

export interface DocumentAccessAclCurrentEffectStorageBindingEvidence {
  readonly parent: DocumentAccessAclCurrentEffectEvidence;
  readonly binding: DocumentStorageBinding;
}

/**
 * DD-563…DD-567: extend exact DD-562 current ACL-layer effect evidence with
 * one DD-086 physical StorageObject binding read using only the exact candidate
 * linkage already preserved inside DD-562.
 *
 * This remains internal evidence only. It does not choose source-resource
 * inheritance, establish final authorization, select/decrypt a provider, sign
 * access, dispatch StoragePort operations or mutate Document/Storage/ACL state.
 */
export async function loadDocumentAccessAclCurrentEffectStorageBindingEvidence(
  input: DocumentAccessAclCurrentEffectStorageBindingEvidenceReadInput,
  metadataReader: DocumentAccessMetadataPort,
  aclReader: DocumentAclReadPort,
  bindingReader: DocumentStorageBindingReadPort,
  matcher: DocumentAclSubjectMatcher = new DocumentAclSubjectMatcher(),
): Promise<DocumentAccessAclCurrentEffectStorageBindingEvidence | null> {
  const parent = await loadDocumentAccessAclCurrentEffectEvidence(
    {
      requestContext: input.requestContext,
      documentId: input.documentId,
      permission: input.permission,
      currentTimeIso: input.currentTimeIso,
    },
    metadataReader,
    aclReader,
    matcher,
  );

  const binding = await bindingReader.load({
    requestContext: input.requestContext,
    documentId: parent.parent.candidate.documentId,
    storageObjectId: parent.parent.candidate.storageObjectId,
  });
  if (binding === null) return null;

  return Object.freeze({
    parent,
    binding,
  });
}
