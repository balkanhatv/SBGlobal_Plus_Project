export type IndustryContextActivationStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "DISABLED";

export interface PersistedIndustryContextActivationEvidence {
  readonly id: string;
  readonly tenantId: string;
  readonly status: IndustryContextActivationStatus;
  readonly activationVersion: string;
}

export interface IndustryContextActivationReadPort {
  loadExact(input: {
    readonly tenantId: string;
    readonly industryContextId: string;
  }): Promise<PersistedIndustryContextActivationEvidence | null>;
}
