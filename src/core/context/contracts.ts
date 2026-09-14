import type {
  AuthStrength,
  PrincipalType,
  VerifiedIdentityEvidence,
  VerifiedMachineEvidence,
  AuthenticationInput,
} from "../identity/contracts.js";

export type ScopeClass =
  | "PLATFORM_GLOBAL"
  | "TENANT_CORE"
  | "TENANT_INDUSTRY"
  | "EXPLICIT_CROSS_CONTEXT"
  | "PUBLIC";

export interface TenantRecord {
  readonly id: string;
  readonly displayKey: string;
  readonly displayName: string;
  readonly status: "PROVISIONING" | "ACTIVE" | "SUSPENDED" | "OFFBOARDING" | "ARCHIVED" | "PURGED";
}

export interface MembershipRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly principalId: string;
  readonly status: "INVITED" | "ACTIVE" | "SUSPENDED" | "REVOKED";
  readonly defaultOrgUnitId?: string;
  readonly membershipVersion: number;
}

export interface IndustryContextRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly industryCode: string;
  readonly displayKey: string;
  readonly displayName: string;
  readonly status: "PENDING" | "ACTIVE" | "SUSPENDED" | "DISABLED";
}

export interface OrgUnitRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly path: readonly string[];
  readonly status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
}

export interface DataHomeRecord {
  readonly id: string;
  readonly regionCode: string;
  readonly routingVersion: number;
}

export interface RoleContext {
  readonly roleIds: readonly string[];
  readonly permissionVersion: number;
}

export interface CommercialContext {
  readonly entitlementSnapshotId: string;
  readonly entitlementSnapshotVersion: number;
}

export interface SecurityContext {
  readonly authStrength?: AuthStrength;
  readonly deviceTrust?: "TRUSTED" | "UNTRUSTED" | "NOT_APPLICABLE";
  readonly riskLevel: "LOW" | "MEDIUM" | "HIGH";
  readonly attributes: Readonly<Record<string, unknown>>;
}

export interface RequestContext {
  readonly requestId: string;
  readonly correlationId: string;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly dataHomeId?: string;
  readonly regionCode?: string;
  readonly principalId?: string;
  readonly principalType?: PrincipalType;
  readonly membershipId?: string;
  readonly orgUnitId?: string;
  readonly orgUnitPath: readonly string[];
  readonly roleIds: readonly string[];
  readonly permissionVersion?: number;
  readonly entitlementSnapshotId?: string;
  readonly entitlementSnapshotVersion?: number;
  readonly deviceId?: string;
  readonly credentialId?: string;
  readonly sessionVersion?: number;
  readonly authStrength?: AuthStrength;
  readonly securityContext?: SecurityContext;
  readonly scopeClass: ScopeClass;
  readonly actorIpHash?: string;
  readonly networkContext?: string;
}

export interface ContextResolutionInput {
  readonly requestId: string;
  readonly correlationId?: string;
  readonly scopeClass: ScopeClass;
  readonly authentication?: AuthenticationInput;
  readonly tenantSelector?: string;
  readonly industrySelector?: string;
  readonly orgUnitSelector?: string;
  readonly actorIpHash?: string;
  readonly networkContext?: string;
}

export interface ClientWorkspaceContext {
  readonly tenant: {
    readonly displayKey: string;
    readonly displayName: string;
  };
  readonly selectedIndustry?: {
    readonly displayKey: string;
    readonly displayName: string;
  };
  readonly orgUnitId?: string;
  readonly entitlementSnapshotVersion?: number;
  readonly sessionVersion?: number;
}

export interface WorkerContextInput {
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly servicePrincipalId: string;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly dataHomeId: string;
  readonly scopeClass: Exclude<ScopeClass, "PUBLIC" | "PLATFORM_GLOBAL">;
}

export type VerifiedAuthentication =
  | { readonly kind: "HUMAN"; readonly evidence: VerifiedIdentityEvidence }
  | { readonly kind: "MACHINE"; readonly evidence: VerifiedMachineEvidence };
