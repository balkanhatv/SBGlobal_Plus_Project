import type { VerifiedAuthentication } from "./contracts.js";
import type {
  CommercialContext,
  DataHomeRecord,
  IndustryContextRecord,
  CurrentIndustryPresentationRecord,
  MembershipRecord,
  OrgUnitRecord,
  RoleContext,
  ScopeClass,
  SecurityContext,
  TenantRecord,
} from "./contracts.js";

export interface TenantContextPort {
  getTenantById(tenantId: string): Promise<TenantRecord | null>;

  resolveTenant(input: {
    readonly selector?: string;
    readonly principalId: string;
    readonly machineBoundTenantId?: string;
  }): Promise<TenantRecord | null>;

  findMembership(input: {
    readonly tenantId: string;
    readonly principalId: string;
  }): Promise<MembershipRecord | null>;

  resolveIndustryContext(input: {
    readonly tenantId: string;
    readonly selector: string;
  }): Promise<IndustryContextRecord | null>;

  resolveOrgUnit(input: {
    readonly tenantId: string;
    readonly selector?: string;
    readonly membership?: MembershipRecord;
  }): Promise<OrgUnitRecord | null>;

  resolveDataHome(tenantId: string): Promise<DataHomeRecord>;
}

export interface AuthorizationContextPort {
  loadRoleContext(input: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly tenantId: string;
    readonly industryContextId?: string;
    readonly principalId: string;
    readonly membershipId?: string;
    readonly orgUnitId?: string;
    readonly orgUnitPath: readonly string[];
    readonly dataHomeId: string;
    readonly regionCode: string;
    readonly scopeClass: Exclude<ScopeClass, "PUBLIC" | "PLATFORM_GLOBAL">;
  }): Promise<RoleContext>;
}

export interface IndustryPresentationCatalogPort {
  getCurrentByCode(industryCode: string): Promise<CurrentIndustryPresentationRecord | null>;
}

export interface CommercialContextPort {
  validateAndLoad(input: {
    readonly requestId: string;
    readonly correlationId: string;
    readonly tenantId: string;
    readonly industryContextId?: string;
    readonly dataHomeId: string;
    readonly regionCode: string;
    readonly principalId: string;
    readonly principalType: import("../identity/contracts.js").PrincipalType;
    readonly scopeClass: ScopeClass;
  }): Promise<CommercialContext>;
}

export interface SessionSecurityPort {
  validateAndResolve(input: {
    readonly authentication: VerifiedAuthentication;
    readonly tenantId?: string;
    readonly industryContextId?: string;
    readonly actorIpHash?: string;
    readonly networkContext?: string;
  }): Promise<SecurityContext>;
}
