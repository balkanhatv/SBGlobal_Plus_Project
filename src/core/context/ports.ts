import type { VerifiedAuthentication } from "./contracts.js";
import type {
  CommercialContext,
  DataHomeRecord,
  IndustryContextRecord,
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
    readonly tenantId: string;
    readonly industryContextId?: string;
    readonly principalId: string;
    readonly membershipId?: string;
    readonly orgUnitId?: string;
  }): Promise<RoleContext>;
}

export interface CommercialContextPort {
  validateAndLoad(input: {
    readonly tenantId: string;
    readonly industryContextId?: string;
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
