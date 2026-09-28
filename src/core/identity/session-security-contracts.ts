import type {
  PrincipalType,
  VerifiedMachineEvidence,
} from "./contracts.js";

export type IdentityProviderCode = "CLERK" | "AUTHJS" | "OTHER_APPROVED";

export interface HumanProviderIdentityRecord {
  readonly principalId: string;
  readonly principalType: Extract<PrincipalType, "HUMAN" | "PLATFORM_OPERATOR">;
  readonly authEpoch: number;
}

export interface SessionVersionRecord {
  readonly version: number;
  readonly changedAtMs: number;
}

export interface DeviceSecurityRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly principalId: string;
  readonly status: "PENDING" | "TRUSTED" | "REVOKED" | "RISK_HOLD";
  readonly riskLevel: string;
  readonly registrationVersion: number;
}

export interface IdentitySecurityStorePort {
  resolveHumanProviderIdentity(input: {
    readonly provider: IdentityProviderCode;
    readonly providerSubject: string;
  }): Promise<HumanProviderIdentityRecord | null>;

  getSessionVersion(input: {
    readonly principalId: string;
    readonly tenantId?: string;
  }): Promise<SessionVersionRecord | null>;

  getDeviceRegistration(input: {
    readonly deviceId: string;
    readonly principalId: string;
    readonly tenantId: string;
  }): Promise<DeviceSecurityRecord | null>;
}

export interface MachineCredentialVerifierPort {
  verifyMachineCredential(credential: string): Promise<VerifiedMachineEvidence>;
}
