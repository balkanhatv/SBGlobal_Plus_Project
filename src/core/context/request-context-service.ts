import type { IdentityPort } from "../identity/contracts.js";
import type {
  ContextResolutionInput,
  IndustryContextRecord,
  RequestContext,
  TenantRecord,
  VerifiedAuthentication,
} from "./contracts.js";
import { ContextResolutionError } from "./errors.js";
import type {
  AuthorizationContextPort,
  CommercialContextPort,
  SessionSecurityPort,
  TenantContextPort,
} from "./ports.js";

export interface IdGeneratorPort {
  nextId(): string;
}

export interface RequestContextServicePorts {
  readonly identity: IdentityPort;
  readonly tenancy: TenantContextPort;
  readonly authorization: AuthorizationContextPort;
  readonly commercial: CommercialContextPort;
  readonly security: SessionSecurityPort;
  readonly ids: IdGeneratorPort;
}

function requiresTenant(scopeClass: ContextResolutionInput["scopeClass"]): boolean {
  return scopeClass === "TENANT_CORE"
    || scopeClass === "TENANT_INDUSTRY"
    || scopeClass === "EXPLICIT_CROSS_CONTEXT";
}

function requiresIndustry(scopeClass: ContextResolutionInput["scopeClass"]): boolean {
  return scopeClass === "TENANT_INDUSTRY"
    || scopeClass === "EXPLICIT_CROSS_CONTEXT";
}

function freezeContext(context: RequestContext): RequestContext {
  if (context.securityContext) {
    Object.freeze(context.securityContext.attributes);
    Object.freeze(context.securityContext);
  }
  Object.freeze(context.orgUnitPath);
  Object.freeze(context.roleIds);
  return Object.freeze(context);
}

export class RequestContextService {
  constructor(private readonly ports: RequestContextServicePorts) {}

  async resolve(input: ContextResolutionInput): Promise<RequestContext> {
    const correlationId = input.correlationId ?? this.ports.ids.nextId();

    if (input.scopeClass === "PUBLIC") {
      return freezeContext({
        requestId: input.requestId,
        correlationId,
        orgUnitPath: Object.freeze([]),
        roleIds: Object.freeze([]),
        scopeClass: "PUBLIC",
        actorIpHash: input.actorIpHash,
        networkContext: input.networkContext,
      });
    }

    const authentication = await this.verifyAuthentication(input);
    const principalId = authentication.evidence.principalId;
    const principalType = authentication.evidence.principalType;

    if (input.scopeClass === "PLATFORM_GLOBAL") {
      this.assertPlatformGlobalPrincipal(authentication);
      const securityContext = await this.ports.security.validateAndResolve({
        authentication,
        actorIpHash: input.actorIpHash,
        networkContext: input.networkContext,
      });

      return freezeContext({
        requestId: input.requestId,
        correlationId,
        principalId,
        principalType,
        deviceId: authentication.kind === "HUMAN"
          ? authentication.evidence.deviceId
          : undefined,
        credentialId: authentication.kind === "MACHINE"
          ? authentication.evidence.credentialId
          : undefined,
        sessionVersion: authentication.kind === "HUMAN"
          ? securityContext.sessionVersion ?? authentication.evidence.sessionVersion
          : undefined,
        authStrength: authentication.kind === "HUMAN"
          ? authentication.evidence.authStrength
          : undefined,
        securityContext,
        orgUnitPath: Object.freeze([]),
        roleIds: Object.freeze([]),
        scopeClass: "PLATFORM_GLOBAL",
        actorIpHash: input.actorIpHash,
        networkContext: input.networkContext,
      });
    }

    if (!requiresTenant(input.scopeClass)) {
      throw new ContextResolutionError("TENANT_INVALID", "Unsupported protected scope.");
    }

    if (authentication.kind === "MACHINE"
      && (!Array.isArray(authentication.evidence.allowedScopeClasses)
        || !authentication.evidence.allowedScopeClasses.some(scope => scope === input.scopeClass))) {
      throw new ContextResolutionError(
        "CREDENTIAL_INVALID",
        "The machine credential is not authorized for the requested scope.",
      );
    }

    const machineBoundTenantId = authentication.kind === "MACHINE"
      ? authentication.evidence.boundTenantId
      : undefined;

    if (authentication.kind === "MACHINE" && !machineBoundTenantId) {
      throw new ContextResolutionError(
        "CREDENTIAL_INVALID",
        "Tenant-scoped machine access requires a fixed tenant binding.",
      );
    }

    const tenant = await this.ports.tenancy.resolveTenant({
      selector: input.tenantSelector,
      principalId,
      machineBoundTenantId,
    });
    this.assertTenant(tenant, machineBoundTenantId);

    const membershipRequired = principalType === "HUMAN" || principalType === "SERVICE";
    const membership = membershipRequired
      ? await this.ports.tenancy.findMembership({ tenantId: tenant.id, principalId })
      : null;

    if (membershipRequired && (!membership || membership.status !== "ACTIVE"
      || membership.tenantId !== tenant.id || membership.principalId !== principalId)) {
      throw new ContextResolutionError("MEMBERSHIP_INVALID", "Active tenant membership is required.");
    }

    let industryContext: IndustryContextRecord | undefined;
    if (requiresIndustry(input.scopeClass)) {
      if (!input.industrySelector) {
        throw new ContextResolutionError(
          "INDUSTRY_CONTEXT_REQUIRED",
          "An active Industry Context is required.",
        );
      }

      const resolved = await this.ports.tenancy.resolveIndustryContext({
        tenantId: tenant.id,
        selector: input.industrySelector,
      });

      if (!resolved
        || resolved.tenantId !== tenant.id
        || resolved.status !== "ACTIVE") {
        throw new ContextResolutionError(
          "INDUSTRY_CONTEXT_MISMATCH",
          "The selected Industry Context is not available.",
        );
      }

      if (authentication.kind === "MACHINE"
        && !authentication.evidence.allowedIndustryContextIds.includes(resolved.id)) {
        throw new ContextResolutionError(
          "CREDENTIAL_INVALID",
          "The credential is not bound to the selected Industry Context.",
        );
      }

      industryContext = resolved;
    }

    const orgUnit = await this.ports.tenancy.resolveOrgUnit({
      tenantId: tenant.id,
      selector: input.orgUnitSelector,
      membership: membership ?? undefined,
    });

    if (((input.orgUnitSelector || membership?.defaultOrgUnitId) && !orgUnit)
      || (orgUnit && (orgUnit.status !== "ACTIVE" || orgUnit.tenantId !== tenant.id))) {
      throw new ContextResolutionError(
        "RESOURCE_SCOPE_DENY",
        "The selected organization unit is not available.",
      );
    }

    const dataHome = await this.ports.tenancy.resolveDataHome(tenant.id);

    const roleContext = await this.ports.authorization.loadRoleContext({
      requestId: input.requestId,
      correlationId,
      tenantId: tenant.id,
      industryContextId: industryContext?.id,
      principalId,
      membershipId: membership?.id,
      orgUnitId: orgUnit?.id,
      orgUnitPath: Object.freeze([...(orgUnit?.path ?? [])]),
      dataHomeId: dataHome.id,
      regionCode: dataHome.regionCode,
      scopeClass: input.scopeClass,
    });

    const commercial = await this.ports.commercial.validateAndLoad({
      requestId: input.requestId,
      correlationId,
      tenantId: tenant.id,
      industryContextId: industryContext?.id,
      dataHomeId: dataHome.id,
      regionCode: dataHome.regionCode,
      principalId,
      principalType,
      scopeClass: input.scopeClass,
    });

    const securityContext = await this.ports.security.validateAndResolve({
      authentication,
      tenantId: tenant.id,
      industryContextId: industryContext?.id,
      actorIpHash: input.actorIpHash,
      networkContext: input.networkContext,
    });

    return freezeContext({
      requestId: input.requestId,
      correlationId,
      tenantId: tenant.id,
      industryContextId: industryContext?.id,
      dataHomeId: dataHome.id,
      regionCode: dataHome.regionCode,
      principalId,
      principalType,
      membershipId: membership?.id,
      orgUnitId: orgUnit?.id,
      orgUnitPath: Object.freeze([...(orgUnit?.path ?? [])]),
      roleIds: Object.freeze([...roleContext.roleIds]),
      permissionVersion: roleContext.permissionVersion,
      entitlementSnapshotId: commercial.entitlementSnapshotId,
      entitlementSnapshotVersion: commercial.entitlementSnapshotVersion,
      deviceId: authentication.kind === "HUMAN"
        ? authentication.evidence.deviceId
        : undefined,
      credentialId: authentication.kind === "MACHINE"
        ? authentication.evidence.credentialId
        : undefined,
      sessionVersion: authentication.kind === "HUMAN"
        ? securityContext.sessionVersion ?? authentication.evidence.sessionVersion
        : undefined,
      authStrength: authentication.kind === "HUMAN"
        ? authentication.evidence.authStrength
        : undefined,
      securityContext,
      scopeClass: input.scopeClass,
      actorIpHash: input.actorIpHash,
      networkContext: input.networkContext,
    });
  }

  private async verifyAuthentication(
    input: ContextResolutionInput,
  ): Promise<VerifiedAuthentication> {
    if (!input.authentication) {
      throw new ContextResolutionError("AUTH_REQUIRED", "Authentication is required.");
    }

    if (input.authentication.kind === "HUMAN") {
      const evidence = await this.ports.identity.verifyHumanSession(
        input.authentication.credential,
        input.authentication.deviceRegistrationId,
      );
      return { kind: "HUMAN", evidence };
    }

    const evidence = await this.ports.identity.verifyMachineCredential(
      input.authentication.credential,
    );
    return { kind: "MACHINE", evidence };
  }

  private assertPlatformGlobalPrincipal(authentication: VerifiedAuthentication): void {
    if (authentication.kind === "HUMAN") {
      if (authentication.evidence.principalType !== "PLATFORM_OPERATOR") {
        throw new ContextResolutionError(
          "RESOURCE_SCOPE_DENY",
          "The principal is not authorized for platform-global scope.",
        );
      }
      return;
    }

    if (authentication.evidence.principalType !== "SERVICE"
      || authentication.evidence.boundTenantId
      || !authentication.evidence.allowedScopeClasses.includes("PLATFORM_GLOBAL")) {
      throw new ContextResolutionError(
        "CREDENTIAL_INVALID",
        "The machine credential is not authorized for platform-global scope.",
      );
    }
  }

  private assertTenant(
    tenant: TenantRecord | null,
    machineBoundTenantId?: string,
  ): asserts tenant is TenantRecord {
    if (!tenant || tenant.status !== "ACTIVE") {
      throw new ContextResolutionError("TENANT_INVALID", "The tenant is not available.");
    }

    if (machineBoundTenantId && tenant.id !== machineBoundTenantId) {
      throw new ContextResolutionError("TENANT_INVALID", "The tenant selector is invalid.");
    }
  }
}
