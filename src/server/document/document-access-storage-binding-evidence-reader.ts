import type { RequestContext } from "../../core/context/contracts.js";
import {
  DocumentAccessCandidateService,
  type DocumentAccessCandidate,
  type DocumentAccessMetadataPort,
} from "../../core/document/access-candidate.js";
import type {
  DocumentStorageBinding,
} from "./postgres-document-storage-binding-store.js";

export interface DocumentStorageBindingReadPort {
  load(input: {
    readonly requestContext: RequestContext;
    readonly documentId: string;
    readonly storageObjectId: string;
  }): Promise<DocumentStorageBinding | null>;
}

export interface DocumentAccessStorageBindingEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly documentId: string;
}

export interface DocumentAccessStorageBindingEvidence {
  readonly candidate: DocumentAccessCandidate;
  readonly binding: DocumentStorageBinding;
}

/**
 * DD-543…DD-547: compose only the already-governed DD-082 pre-sign
 * Document access candidate and DD-086 exact physical StorageObject binding.
 *
 * This is server-internal evidence only. It does not evaluate ACL or other
 * authorization policy, decrypt provider metadata, select a provider, sign
 * storage access, dispatch StoragePort operations or expose route authority.
 */
export async function loadDocumentAccessStorageBindingEvidence(
  input: DocumentAccessStorageBindingEvidenceReadInput,
  metadataReader: DocumentAccessMetadataPort,
  bindingReader: DocumentStorageBindingReadPort,
): Promise<DocumentAccessStorageBindingEvidence | null> {
  const candidate = await new DocumentAccessCandidateService(metadataReader).prepare({
    requestContext: input.requestContext,
    documentId: input.documentId,
  });

  const binding = await bindingReader.load({
    requestContext: input.requestContext,
    documentId: candidate.documentId,
    storageObjectId: candidate.storageObjectId,
  });
  if (binding === null) return null;

  return Object.freeze({
    candidate,
    binding,
  });
}
