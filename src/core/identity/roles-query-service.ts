import type { RequestContext } from "../context/contracts.js";
import { ContextResolutionError } from "../context/errors.js";

export interface EffectiveRoleSummary {
  readonly principalId: string;
  readonly membershipId?: string;
  readonly roleIds: readonly string[];
  readonly permissionVersion: number;
}

export interface EffectiveRoleReadPort {
  listEffective(input: {
    readonly tenantId: string;
    readonly industryContextId?: string;
    readonly principalId: string;
    readonly membershipId?: string;
  }): Promise<EffectiveRoleSummary | null>;
}

export class IdentityRoleQueryService {
  constructor(private readonly roles: EffectiveRoleReadPort) {}

  async listEffective(input: {
    readonly requestContext: RequestContext;
    readonly principalId?: string;
    readonly membershipId?: string;
  }): Promise<EffectiveRoleSummary> {
    const { requestContext } = input;

    if (requestContext.scopeClass !== "TENANT_CORE"
      || !requestContext.tenantId
      || !requestContext.principalId) {
      throw new ContextResolutionError(
        "TENANT_INVALID",
        "Tenant Core context is required.",
      );
    }

    const principalId = input.principalId ?? requestContext.principalId;
    const membershipId = input.membershipId
      ?? (principalId === requestContext.principalId
        ? requestContext.membershipId
        : undefined);

    const summary = await this.roles.listEffective({
      tenantId: requestContext.tenantId,
      principalId,
      membershipId,
    });

    if (!summary) {
      throw new ContextResolutionError(
        "RESOURCE_SCOPE_DENY",
        "Role assignment summary is not available.",
      );
    }

    return Object.freeze({
      ...summary,
      roleIds: Object.freeze([...summary.roleIds]),
    });
  }
}
