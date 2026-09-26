export type PrincipalType =
  | "HUMAN"
  | "API_CLIENT"
  | "SERVICE"
  | "PLATFORM_OPERATOR";

export type AuthStrength = "PASSWORD" | "MFA" | "SSO" | "PHISHING_RESISTANT";

export interface VerifiedIdentityEvidence {
  readonly principalId: string;
  readonly principalType: PrincipalType;
  readonly providerSubject: string;
  readonly providerSessionId: string;
  readonly providerSessionCreatedAtMs: number;
  readonly authEpoch: number;
  readonly authStrength: AuthStrength;
  readonly sessionVersion?: number;
  readonly deviceId?: string;
}

export type MachineAllowedScopeClass =
  | "PLATFORM_GLOBAL"
  | "TENANT_CORE"
  | "TENANT_INDUSTRY";

export interface VerifiedMachineEvidence {
  readonly principalId: string;
  readonly principalType: "API_CLIENT" | "SERVICE";
  readonly credentialId: string;
  readonly credentialVersion: number;
  readonly boundTenantId?: string;
  readonly allowedIndustryContextIds: readonly string[];
  readonly allowedScopeClasses: readonly MachineAllowedScopeClass[];
}

export type AuthenticationInput =
  | {
      readonly kind: "HUMAN";
      readonly credential: string;
      readonly deviceRegistrationId?: string;
    }
  | { readonly kind: "MACHINE"; readonly credential: string };

export interface IdentityPort {
  verifyHumanSession(
    credential: string,
    deviceRegistrationId?: string,
  ): Promise<VerifiedIdentityEvidence>;
  verifyMachineCredential(credential: string): Promise<VerifiedMachineEvidence>;
  revokeProviderSession(reference: string): Promise<void>;
  getAuthStrength(evidence: VerifiedIdentityEvidence): AuthStrength;
  getProviderSubject(evidence: VerifiedIdentityEvidence): string;
}
