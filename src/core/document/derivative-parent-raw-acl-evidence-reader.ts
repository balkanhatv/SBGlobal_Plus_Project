import type { RequestContext } from "../context/contracts.js";
import type {
  DocumentAclEntry,
  DocumentAclReadPort,
} from "./acl.js";
import {
  loadDocumentDerivativeParentCurrentEvidence,
  type DocumentDerivativeParentCurrentEvidence,
  type DocumentDerivativeParentCurrentEvidenceReadPort,
} from "./derivative-parent-current-evidence-reader.js";

export interface DocumentDerivativeParentRawAclEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly derivativeDocumentId: string;
  readonly parentDocumentId: string;
}

export interface DocumentDerivativeParentRawAclEvidence {
  readonly parent: DocumentDerivativeParentCurrentEvidence;
  readonly derivativeAclEntries: readonly DocumentAclEntry[];
  readonly parentAclEntries: readonly DocumentAclEntry[];
}

function rowsBelongToDocument(
  entries: readonly DocumentAclEntry[],
  documentId: string,
): boolean {
  return entries.every((entry) => entry.documentId === documentId);
}

/**
 * DD-583…DD-587: extend exact DD-582 derivative-parent current evidence with
 * the two raw DD-084 ACL arrays only.
 *
 * This intentionally does not compare, merge, inherit or reduce the ACL sets
 * and does not establish derivative ACL non-widening or access authority.
 */
export async function loadDocumentDerivativeParentRawAclEvidence(
  input: DocumentDerivativeParentRawAclEvidenceReadInput,
  relationshipReader: DocumentDerivativeParentCurrentEvidenceReadPort,
  aclReader: DocumentAclReadPort,
): Promise<DocumentDerivativeParentRawAclEvidence | null> {
  const parent = await loadDocumentDerivativeParentCurrentEvidence(
    input,
    relationshipReader,
  );
  if (parent === null) return null;

  const derivativeDocumentId = parent.relationship.derivative.id;
  const parentDocumentId = parent.relationship.parent.id;

  const derivativeAclEntries = await aclReader.loadForDocument({
    requestContext: input.requestContext,
    documentId: derivativeDocumentId,
  });
  if (!rowsBelongToDocument(derivativeAclEntries, derivativeDocumentId)) {
    return null;
  }

  const parentAclEntries = await aclReader.loadForDocument({
    requestContext: input.requestContext,
    documentId: parentDocumentId,
  });
  if (!rowsBelongToDocument(parentAclEntries, parentDocumentId)) {
    return null;
  }

  return Object.freeze({
    parent,
    derivativeAclEntries,
    parentAclEntries,
  });
}
