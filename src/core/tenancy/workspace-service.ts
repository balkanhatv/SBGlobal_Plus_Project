import type { ClientWorkspaceContext, RequestContext } from "../context/contracts.js";
import { ContextResolutionError } from "../context/errors.js";
import type { TenantContextPort } from "../context/ports.js";
import { toClientWorkspaceContext } from "../context/client-workspace.js";

export class WorkspaceService {
  constructor(private readonly tenancy: TenantContextPort) {}

  async resolve(input: {
    readonly requestContext: RequestContext;
    readonly industrySelector?: string;
  }): Promise<ClientWorkspaceContext> {
    const { requestContext } = input;

    if (requestContext.scopeClass !== "TENANT_CORE"
      || !requestContext.tenantId
      || !requestContext.principalId
      || !requestContext.membershipId) {
      throw new ContextResolutionError(
        "MEMBERSHIP_INVALID",
        "An active tenant membership is required.",
      );
    }

    const membership = await this.tenancy.findMembership({
      tenantId: requestContext.tenantId,
      principalId: requestContext.principalId,
    });
    if (!membership || membership.status !== "ACTIVE"
      || membership.id !== requestContext.membershipId
      || membership.tenantId !== requestContext.tenantId
      || membership.principalId !== requestContext.principalId) {
      throw new ContextResolutionError("MEMBERSHIP_INVALID", "An active tenant membership is required.");
    }

    const tenant = await this.tenancy.getTenantById(requestContext.tenantId);
    if (!tenant || tenant.id !== requestContext.tenantId || tenant.status !== "ACTIVE") {
      throw new ContextResolutionError(
        "TENANT_INVALID",
        "The tenant is not available.",
      );
    }

    if (!input.industrySelector) {
      return toClientWorkspaceContext(requestContext, tenant);
    }

    const industry = await this.tenancy.resolveIndustryContext({
      tenantId: requestContext.tenantId,
      selector: input.industrySelector,
    });

    if (!industry
      || industry.tenantId !== requestContext.tenantId
      || industry.status !== "ACTIVE") {
      throw new ContextResolutionError(
        "INDUSTRY_CONTEXT_MISMATCH",
        "The selected Industry Context is not available.",
      );
    }

    return toClientWorkspaceContext(requestContext, tenant, industry);
  }
}
