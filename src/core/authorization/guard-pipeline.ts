import type { OperationContract } from "../api/operation-contract.js";
import type { RequestContext } from "../context/contracts.js";
import { CommercialStateError } from "../commercial/current-state.js";
import {
  AuthorizationDecisionError,
  type AccessDecision,
  type ResourceDescriptor,
} from "./contracts.js";
import type {
  AuthorizationDecisionPort,
  CommercialGuardPort,
  ResourceResolverPort,
} from "./guard-ports.js";

export type NormalizedGuardErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "TENANT_INVALID"
  | "INDUSTRY_CONTEXT_REQUIRED"
  | "INDUSTRY_CONTEXT_MISMATCH"
  | "SUBSCRIPTION_INVALID"
  | "LICENSE_INVALID"
  | "CREDENTIAL_INVALID"
  | "ENTITLEMENT_DENIED"
  | "PERMISSION_DENIED"
  | "POLICY_DENIED"
  | "RESOURCE_NOT_FOUND"
  | "RESOURCE_STATE_INVALID"
  | "DEPENDENCY_UNAVAILABLE";

export class GuardPipelineError extends Error {
  readonly code: NormalizedGuardErrorCode;
  readonly decisionId?: string;
  readonly reasonCode?: string;
  readonly upgradeTarget?: string;
  readonly revealResourceExistence = false;

  constructor(input: {
    readonly code: NormalizedGuardErrorCode;
    readonly messageSafe: string;
    readonly decisionId?: string;
    readonly reasonCode?: string;
    readonly upgradeTarget?: string;
  }) {
    super(input.messageSafe);
    this.name = "GuardPipelineError";
    this.code = input.code;
    this.decisionId = input.decisionId;
    this.reasonCode = input.reasonCode;
    this.upgradeTarget = input.upgradeTarget;
  }
}

export interface GuardResult {
  readonly decisionId: string;
  readonly resourceDescriptor?: ResourceDescriptor;
  readonly restrictionSet?: Readonly<Record<string, unknown>>;
}

export interface GuardPipelinePorts {
  readonly commercial: CommercialGuardPort;
  readonly authorization: AuthorizationDecisionPort;
  readonly resources: ResourceResolverPort;
}

function normalizeDecision(decision: AccessDecision): GuardPipelineError {
  const reason = decision.reasonCode;

  if (decision.decision === "UPGRADE_CTA") {
    return new GuardPipelineError({
      code: "ENTITLEMENT_DENIED",
      messageSafe: "The requested capability is not available.",
      decisionId: decision.decisionId,
      reasonCode: reason ?? "ENTITLEMENT_MISSING",
      upgradeTarget: decision.upgradeTarget,
    });
  }

  switch (reason) {
    case "AUTH_REQUIRED":
      return new GuardPipelineError({
        code: "AUTHENTICATION_REQUIRED",
        messageSafe: "Authentication is required.",
        decisionId: decision.decisionId,
        reasonCode: reason,
      });
    case "TENANT_INVALID":
    case "MEMBERSHIP_INVALID":
      return new GuardPipelineError({
        code: "TENANT_INVALID",
        messageSafe: "Tenant access is unavailable.",
        decisionId: decision.decisionId,
        reasonCode: reason,
      });
    case "INDUSTRY_CONTEXT_REQUIRED":
      return new GuardPipelineError({
        code: "INDUSTRY_CONTEXT_REQUIRED",
        messageSafe: "An Industry Context is required.",
        decisionId: decision.decisionId,
        reasonCode: reason,
      });
    case "INDUSTRY_CONTEXT_MISMATCH":
      return new GuardPipelineError({
        code: "INDUSTRY_CONTEXT_MISMATCH",
        messageSafe: "The resource is not available in the active Industry Context.",
        decisionId: decision.decisionId,
        reasonCode: reason,
      });
    case "SUBSCRIPTION_RESTRICTED":
      return new GuardPipelineError({
        code: "SUBSCRIPTION_INVALID",
        messageSafe: "Subscription state does not permit this operation.",
        decisionId: decision.decisionId,
        reasonCode: reason,
      });
    case "LICENSE_INVALID":
      return new GuardPipelineError({
        code: "LICENSE_INVALID",
        messageSafe: "A required license is not active.",
        decisionId: decision.decisionId,
        reasonCode: reason,
      });
    case "CREDENTIAL_REVOKED":
    case "SESSION_INVALID":
    case "DEVICE_UNTRUSTED":
    case "STEP_UP_REQUIRED":
      return new GuardPipelineError({
        code: "CREDENTIAL_INVALID",
        messageSafe: "Current authentication context does not permit this operation.",
        decisionId: decision.decisionId,
        reasonCode: reason,
      });
    case "ENTITLEMENT_MISSING":
    case "LIMIT_EXCEEDED":
      return new GuardPipelineError({
        code: "ENTITLEMENT_DENIED",
        messageSafe: "The requested capability is not available.",
        decisionId: decision.decisionId,
        reasonCode: reason,
      });
    case "RBAC_DENY":
      return new GuardPipelineError({
        code: "PERMISSION_DENIED",
        messageSafe: "Permission denied.",
        decisionId: decision.decisionId,
        reasonCode: reason,
      });
    case "ABAC_DENY":
    case "RESIDENCY_DENY":
    case "SENSITIVITY_DENY":
    case "WORKFLOW_STATE_DENY":
      return new GuardPipelineError({
        code: "POLICY_DENIED",
        messageSafe: "Policy denied the requested operation.",
        decisionId: decision.decisionId,
        reasonCode: reason,
      });
    case "RESOURCE_SCOPE_DENY":
      return new GuardPipelineError({
        code: "RESOURCE_NOT_FOUND",
        messageSafe: "Resource not found.",
        decisionId: decision.decisionId,
        reasonCode: reason,
      });
    default:
      return new GuardPipelineError({
        code: "POLICY_DENIED",
        messageSafe: "The requested operation is not permitted.",
        decisionId: decision.decisionId,
        reasonCode: reason,
      });
  }
}

function mergeRestrictions(
  base?: Readonly<Record<string, unknown>>,
  resource?: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> | undefined {
  if (!base && !resource) return undefined;
  // Restriction keys have no generic merge algebra. Overwriting a base restriction
  // with a resource value could widen access; require a dedicated policy reducer.
  if (base && resource && Object.keys(base).some((key) => Object.hasOwn(resource, key))) {
    throw new GuardPipelineError({
      code: "POLICY_DENIED",
      messageSafe: "The combined restrictions cannot be safely applied.",
    });
  }
  return Object.freeze({ ...(base ?? {}), ...(resource ?? {}) });
}

export class GuardPipeline {
  constructor(private readonly ports: GuardPipelinePorts) {}

  async authorize(input: {
    readonly requestContext: RequestContext;
    readonly operation: OperationContract;
    readonly resourceReference?: Readonly<Record<string, unknown>>;
  }): Promise<GuardResult> {
    const { requestContext, operation } = input;
    this.assertScope(requestContext, operation);

    let commercial;
    try {
      commercial = await this.ports.commercial.validateCurrent({
        requestContext,
        operation,
      });
    } catch (error) {
      if (error instanceof CommercialStateError) {
        throw new GuardPipelineError({
          code: "DEPENDENCY_UNAVAILABLE",
          messageSafe: "Commercial access state is unavailable.",
        });
      }
      throw error;
    }

    if (!commercial.allowed) {
      throw new GuardPipelineError({
        code: commercial.code,
        messageSafe: commercial.code === "SUBSCRIPTION_INVALID"
          ? "Subscription state does not permit this operation."
          : commercial.code === "LICENSE_INVALID"
            ? "A required license is not active."
            : "The requested capability is not available.",
        reasonCode: commercial.reasonCode,
        upgradeTarget: commercial.upgradeTarget,
      });
    }

    const baseDecision = await this.evaluateAuthorization(
      () => this.ports.authorization.evaluateBase({ requestContext, operation }),
    );
    this.assertAllowed(baseDecision);

    let resourceDescriptor: ResourceDescriptor | undefined;
    let resourceDecision: AccessDecision | undefined;

    if (operation.resourceResolver) {
      if (!input.resourceReference) {
        throw new GuardPipelineError({
          code: "RESOURCE_NOT_FOUND",
          messageSafe: "Resource not found.",
        });
      }

      const resolved = await this.ports.resources.resolve({
        resolverKey: operation.resourceResolver,
        requestContext,
        reference: input.resourceReference,
      });

      if (!resolved) {
        throw new GuardPipelineError({
          code: "RESOURCE_NOT_FOUND",
          messageSafe: "Resource not found.",
        });
      }

      this.assertResourceContext(requestContext, resolved);
      resourceDescriptor = resolved;

      resourceDecision = await this.evaluateAuthorization(
        () => this.ports.authorization.evaluateResource({
          requestContext,
          operation,
          resourceDescriptor: resolved,
        }),
      );
      this.assertAllowed(resourceDecision);
    }

    return Object.freeze({
      decisionId: resourceDecision?.decisionId ?? baseDecision.decisionId,
      resourceDescriptor,
      restrictionSet: mergeRestrictions(
        baseDecision.restrictionSet,
        resourceDecision?.restrictionSet,
      ),
    });
  }

  private async evaluateAuthorization<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      if (error instanceof AuthorizationDecisionError) {
        throw new GuardPipelineError({
          code: "DEPENDENCY_UNAVAILABLE",
          messageSafe: "Authorization decision service is unavailable.",
        });
      }
      throw error;
    }
  }

  private assertAllowed(decision: AccessDecision): void {
    if (decision.decision === "ALLOW" || decision.decision === "RESTRICT") {
      return;
    }
    throw normalizeDecision(decision);
  }

  private assertScope(
    context: RequestContext,
    operation: OperationContract,
  ): void {
    if (context.scopeClass !== operation.scopeClass) {
      if (operation.scopeClass === "TENANT_INDUSTRY") {
        throw new GuardPipelineError({
          code: "INDUSTRY_CONTEXT_REQUIRED",
          messageSafe: "An Industry Context is required.",
        });
      }
      throw new GuardPipelineError({
        code: "POLICY_DENIED",
        messageSafe: "Operation scope is not permitted in the active context.",
      });
    }

    if ((operation.scopeClass === "TENANT_INDUSTRY"
        || operation.scopeClass === "EXPLICIT_CROSS_CONTEXT")
      && !context.industryContextId) {
      throw new GuardPipelineError({
        code: "INDUSTRY_CONTEXT_REQUIRED",
        messageSafe: "An Industry Context is required.",
      });
    }
  }

  private assertResourceContext(
    context: RequestContext,
    resource: ResourceDescriptor,
  ): void {
    if (!context.tenantId || resource.tenantId !== context.tenantId) {
      throw new GuardPipelineError({
        code: "RESOURCE_NOT_FOUND",
        messageSafe: "Resource not found.",
      });
    }

    if (context.scopeClass === "TENANT_CORE" && resource.industryContextId) {
      throw new GuardPipelineError({ code: "RESOURCE_NOT_FOUND", messageSafe: "Resource not found." });
    }

    if (context.scopeClass === "TENANT_INDUSTRY"
      && resource.industryContextId !== context.industryContextId) {
      throw new GuardPipelineError({
        code: "INDUSTRY_CONTEXT_MISMATCH",
        messageSafe: "The resource is not available in the active Industry Context.",
      });
    }
  }
}
