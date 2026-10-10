import type { RequestContext } from "../context/contracts.js";
import type { OperationContract } from "../api/operation-contract.js";
import type {
  AccessDecision,
  BaseAccessDecisionInput,
  ResourceAccessDecisionInput,
  ResourceDescriptor,
} from "./contracts.js";

export type CommercialGuardResult =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      readonly code: "SUBSCRIPTION_INVALID" | "LICENSE_INVALID" | "ENTITLEMENT_DENIED";
      readonly reasonCode:
        | "SUBSCRIPTION_RESTRICTED"
        | "LICENSE_INVALID"
        | "ENTITLEMENT_MISSING"
        | "LIMIT_EXCEEDED";
      readonly upgradeTarget?: string;
    };

export interface CommercialGuardPort {
  validateCurrent(input: {
    readonly requestContext: RequestContext;
    readonly operation: OperationContract;
  }): Promise<CommercialGuardResult>;
}

export interface AuthorizationDecisionPort {
  evaluateBase(input: BaseAccessDecisionInput): Promise<AccessDecision>;
  evaluateResource(input: ResourceAccessDecisionInput): Promise<AccessDecision>;
}

export interface ResourceResolverPort {
  resolve(input: {
    readonly resolverKey: string;
    readonly requestContext: RequestContext;
    readonly reference: Readonly<Record<string, unknown>>;
  }): Promise<ResourceDescriptor | null>;
}


export type ResourceBusinessRuleResult =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      readonly reasonCode: "RESOURCE_SCOPE_DENY" | "WORKFLOW_STATE_DENY";
    };

export interface ResourceBusinessRulePort {
  validateCurrent(input: {
    readonly requestContext: RequestContext;
    readonly operation: OperationContract;
    readonly resourceDescriptor: ResourceDescriptor;
  }): Promise<ResourceBusinessRuleResult>;
}
