import type { RequestContext } from "../context/contracts.js";

export type DocumentUploadSessionScopeClass =
  | "TENANT_CORE"
  | "TENANT_INDUSTRY";

export type DocumentUploadSessionStatus =
  | "CREATED"
  | "UPLOADING"
  | "UPLOADED"
  | "VALIDATING"
  | "SCANNING"
  | "ACTIVATED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export interface DocumentUploadSession {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly scopeClass: DocumentUploadSessionScopeClass;
  readonly principalId: string;
  readonly expectedMediaTypes: readonly string[];
  readonly maxSizeClass: string;
  readonly expiresAt: string;
  readonly status: DocumentUploadSessionStatus;
  readonly tempObjectRef?: string;
  readonly checksumExpected?: string;
  readonly createdAt: string;
}

export interface DocumentUploadSessionReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly uploadSessionId: string;
  }): Promise<DocumentUploadSession | null>;
}
