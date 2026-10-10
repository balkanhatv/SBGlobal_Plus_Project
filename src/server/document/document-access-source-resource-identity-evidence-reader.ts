import type { RequestContext } from "../../core/context/contracts.js";
import type {
  DocumentAccessMetadataPort,
  DocumentScopeClass,
} from "../../core/document/access-candidate.js";
import {
  DocumentAclSubjectMatcher,
} from "../../core/document/acl-subject-match.js";
import type {
  DocumentAclPermission,
  DocumentAclReadPort,
} from "../../core/document/acl.js";
import {
  loadDocumentAccessAclCurrentEffectStorageAccessPathEvidence,
  type DocumentAccessAclCurrentEffectStorageAccessPathEvidence,
} from "./document-access-acl-current-effect-storage-access-path-evidence-reader.js";
import type {
  DocumentStorageBindingReadPort,
} from "./document-access-storage-binding-evidence-reader.js";

export interface DocumentSourceResourceIdentityEvidence {
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly scopeClass: DocumentScopeClass;
  readonly sourceModule: string;
  readonly sourceResourceType: string;
  readonly sourceResourceId: string;
}

export interface DocumentAccessSourceResourceIdentityEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly documentId: string;
  readonly permission: DocumentAclPermission;
  readonly currentTimeIso: string;
}

export interface DocumentAccessSourceResourceIdentityParentOnlyEvidence {
  readonly parent: DocumentAccessAclCurrentEffectStorageAccessPathEvidence;
  readonly sourceResourceIdentity?: never;
}

export interface DocumentAccessSourceResourceIdentityRequiredEvidence {
  readonly parent: DocumentAccessAclCurrentEffectStorageAccessPathEvidence;
  readonly sourceResourceIdentity: DocumentSourceResourceIdentityEvidence;
}

export type DocumentAccessSourceResourceIdentityEvidence =
  | DocumentAccessSourceResourceIdentityParentOnlyEvidence
  | DocumentAccessSourceResourceIdentityRequiredEvidence;

/**
 * DD-573…DD-577: extend exact DD-572 access-path evidence only with an
 * immutable projection of the already-validated persisted source-resource
 * identity when source-resource authorization is required.
 *
 * This performs zero additional reads. It deliberately does not construct a
 * DD-03 ResourceDescriptor, map an OperationContract/permission, resolve or
 * authorize the source resource, or create signing/storage authority.
 */
export async function loadDocumentAccessSourceResourceIdentityEvidence(
  input: DocumentAccessSourceResourceIdentityEvidenceReadInput,
  metadataReader: DocumentAccessMetadataPort,
  aclReader: DocumentAclReadPort,
  bindingReader: DocumentStorageBindingReadPort,
  matcher: DocumentAclSubjectMatcher = new DocumentAclSubjectMatcher(),
): Promise<DocumentAccessSourceResourceIdentityEvidence | null> {
  const parent = await loadDocumentAccessAclCurrentEffectStorageAccessPathEvidence(
    input,
    metadataReader,
    aclReader,
    bindingReader,
    matcher,
  );
  if (parent === null) return null;

  if (parent.accessPathEvidence !== "SOURCE_RESOURCE_AUTHORIZATION_REQUIRED") {
    return Object.freeze({ parent });
  }

  const candidate = parent.parent.parent.parent.candidate;
  const sourceResourceIdentity = Object.freeze({
    tenantId: candidate.tenantId,
    ...(candidate.industryContextId !== undefined
      ? { industryContextId: candidate.industryContextId }
      : {}),
    scopeClass: candidate.scopeClass,
    sourceModule: candidate.sourceModule,
    sourceResourceType: candidate.sourceResourceType,
    sourceResourceId: candidate.sourceResourceId,
  });

  return Object.freeze({
    parent,
    sourceResourceIdentity,
  });
}
