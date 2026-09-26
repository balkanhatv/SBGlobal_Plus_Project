import type { RequestContext } from "../context/contracts.js";
import type { OperationContract } from "../api/operation-contract.js";

export type AccessDecisionKind = "ALLOW" | "DENY" | "RESTRICT" | "UPGRADE_CTA";

export type AccessReasonCode =
  | "AUTH_REQUIRED"
  | "TENANT_INVALID"
  | "MEMBERSHIP_INVALID"
  | "INDUSTRY_CONTEXT_REQUIRED"
  | "INDUSTRY_CONTEXT_MISMATCH"
  | "SUBSCRIPTION_RESTRICTED"
  | "LICENSE_INVALID"
  | "SESSION_INVALID"
  | "DEVICE_UNTRUSTED"
  | "CREDENTIAL_REVOKED"
  | "ENTITLEMENT_MISSING"
  | "LIMIT_EXCEEDED"
  | "RBAC_DENY"
  | "ABAC_DENY"
  | "RESIDENCY_DENY"
  | "SENSITIVITY_DENY"
  | "RESOURCE_SCOPE_DENY"
  | "WORKFLOW_STATE_DENY"
  | "STEP_UP_REQUIRED";

export type AuthorizationDecisionErrorCode =
  | "AUTHORIZATION_STATE_UNAVAILABLE"
  | "AUTHORIZATION_CONTEXT_STALE"
  | "AUTHORIZATION_ATTRIBUTE_UNAVAILABLE"
  | "AUTHORIZATION_ATTRIBUTE_INVALID";

export class AuthorizationDecisionError extends Error {
  readonly code: AuthorizationDecisionErrorCode;

  constructor(code: AuthorizationDecisionErrorCode, message: string) {
    super(message);
    this.name = "AuthorizationDecisionError";
    this.code = code;
  }
}

export interface ResourceDescriptor {
  readonly resourceType: string;
  readonly resourceId: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly orgUnitId?: string;
  readonly ownerPrincipalId?: string;
  readonly state?: string;
  readonly sensitivityClass?: string;
  readonly residencyClass?: string;
}

export interface AccessDecision {
  readonly decision: AccessDecisionKind;
  readonly reasonCode?: AccessReasonCode;
  readonly policyIds: readonly string[];
  readonly permissionCode: string;
  readonly restrictionSet?: Readonly<Record<string, unknown>>;
  readonly upgradeTarget?: string;
  readonly decisionId: string;
  readonly auditRequired: boolean;
  readonly evaluatedAt: string;
  readonly permissionVersion: number;
  readonly entitlementSnapshotVersion?: number;
}

export interface BaseAccessDecisionInput {
  readonly requestContext: RequestContext;
  readonly operation: OperationContract;
}

export interface ResourceAccessDecisionInput extends BaseAccessDecisionInput {
  readonly resourceDescriptor: ResourceDescriptor;
}
