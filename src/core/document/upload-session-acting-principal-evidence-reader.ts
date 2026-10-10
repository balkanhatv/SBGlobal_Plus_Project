import type { RequestContext } from "../context/contracts.js";
import type {
  DocumentUploadSession,
  DocumentUploadSessionReadPort,
} from "./upload-session.js";

export interface DocumentUploadSessionActingPrincipalEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly uploadSessionId: string;
}

export interface DocumentUploadSessionActingPrincipalEvidence {
  readonly session: DocumentUploadSession;
}

function matchesProtectedTenantScope(
  requestContext: RequestContext,
  session: DocumentUploadSession,
): boolean {
  if (
    session.tenantId !== requestContext.tenantId
    || session.scopeClass !== requestContext.scopeClass
  ) {
    return false;
  }

  if (session.scopeClass === "TENANT_CORE") {
    return session.industryContextId === undefined
      && requestContext.industryContextId === undefined;
  }

  return session.industryContextId !== undefined
    && requestContext.industryContextId !== undefined
    && session.industryContextId === requestContext.industryContextId;
}

/**
 * DD-553…DD-557: compose only raw DD-087 upload-session evidence with the
 * exact Tenant/scope/Industry and acting-principal ownership floors already
 * enforced by migration 0006.
 *
 * This is evidence only. It does not interpret expiry, status progression,
 * media/size policy, checksum/temp-object validity, current principal activity,
 * authorization or StoragePort/upload mutation authority.
 */
export async function loadDocumentUploadSessionActingPrincipalEvidence(
  input: DocumentUploadSessionActingPrincipalEvidenceReadInput,
  sessionReader: DocumentUploadSessionReadPort,
): Promise<DocumentUploadSessionActingPrincipalEvidence | null> {
  const session = await sessionReader.loadForContext({
    requestContext: input.requestContext,
    uploadSessionId: input.uploadSessionId,
  });
  if (session === null) return null;

  if (!matchesProtectedTenantScope(input.requestContext, session)) {
    return null;
  }

  if (session.principalId !== input.requestContext.principalId) {
    return null;
  }

  return Object.freeze({session});
}
