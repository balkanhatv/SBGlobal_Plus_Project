export type ApiCredentialMetadataStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED"
  | "EXPIRED";

export interface ApiCredentialMetadata {
  readonly id: string;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly principalId: string;
  readonly keyPrefix: string;
  readonly status: ApiCredentialMetadataStatus;
  readonly permissionProfileId?: string;
  readonly expiresAt?: string;
  readonly lastUsedAt?: string;
  readonly allowedCidrs: readonly string[];
  readonly credentialVersion: string;
  readonly createdAt: string;
  readonly revokedAt?: string;
  readonly allowedIndustryContextIds: readonly string[];
}

export interface ApiCredentialMetadataReadPort {
  loadById(input: {
    readonly apiCredentialId: string;
  }): Promise<ApiCredentialMetadata | null>;
}
