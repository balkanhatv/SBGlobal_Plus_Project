export type MachinePrincipalMetadataType =
  | "HUMAN"
  | "API_CLIENT"
  | "SERVICE"
  | "PLATFORM_OPERATOR";

export type MachinePrincipalMetadataStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "REVOKED";

export type MachinePrincipalPersistedScopeClass =
  | "PLATFORM_GLOBAL"
  | "TENANT_CORE"
  | "TENANT_INDUSTRY"
  | "EXPLICIT_CROSS_CONTEXT";

export interface MachinePrincipalMetadata {
  readonly id: string;
  readonly principalType: MachinePrincipalMetadataType;
  readonly status: MachinePrincipalMetadataStatus;
  readonly authEpoch: string;
  readonly serviceCode?: string;
  readonly owningModule?: string;
  readonly allowedScopeClasses?: readonly MachinePrincipalPersistedScopeClass[];
}

export interface MachinePrincipalMetadataReadPort {
  loadById(input: {
    readonly principalId: string;
  }): Promise<MachinePrincipalMetadata | null>;
}
