export type ApiCredentialVerificationMaterialStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED"
  | "EXPIRED";

export interface ApiCredentialVerificationMaterial {
  readonly id: string;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly principalId: string;
  readonly keyPrefix: string;
  /** Opaque one-way verifier material. Never serialize, log, or expose to Core DTOs. */
  readonly secretHash: string;
  readonly status: ApiCredentialVerificationMaterialStatus;
  readonly permissionProfileId?: string;
  readonly expiresAt?: string;
  readonly lastUsedAt?: string;
  readonly allowedCidrs?: readonly string[];
  readonly credentialVersion: string;
  readonly createdAt: string;
  readonly revokedAt?: string;
  readonly allowedIndustryContextIds: readonly string[];
}

export interface ApiCredentialVerificationMaterialReadPort {
  loadByKeyPrefix(input: {
    readonly keyPrefix: string;
  }): Promise<ApiCredentialVerificationMaterial | null>;
}
