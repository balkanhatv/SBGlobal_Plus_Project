export type OperatorElevationStatus =
  | "PENDING"
  | "ACTIVE"
  | "REVOKED"
  | "EXPIRED";

export interface OperatorElevationMetadata {
  readonly id: string;
  readonly operatorPrincipalId: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly purposeCode: string;
  readonly ticketReference?: string;
  readonly approvedBy?: string;
  readonly startsAt: string;
  readonly expiresAt: string;
  readonly status: OperatorElevationStatus;
  readonly permissionProfileId: string;
  readonly createdAt: string;
  readonly revokedAt?: string;
}

export interface OperatorElevationMetadataReadPort {
  loadById(input: {
    readonly operatorElevationId: string;
  }): Promise<OperatorElevationMetadata | null>;
}
