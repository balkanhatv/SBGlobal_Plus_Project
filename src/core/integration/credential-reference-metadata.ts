import type { RequestContext } from "../context/contracts.js";

export interface CredentialReferenceMetadata {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly secretStoreProvider: string;
  readonly credentialType: string;
  readonly keyVersion: number;
  readonly status: string;
  readonly rotatedAt?: string;
  readonly expiresAt?: string;
  readonly createdAt: string;
}

export interface CredentialReferenceMetadataReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly credentialReferenceId: string;
  }): Promise<CredentialReferenceMetadata | null>;
}
