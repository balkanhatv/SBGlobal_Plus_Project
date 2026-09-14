import type { RequestContext } from "../context/contracts.js";
import type { OperationContract } from "../api/operation-contract.js";
import type {
  AccessDecision,
  BaseAccessDecisionInput,
  ResourceAccessDecisionInput,
  ResourceDescriptor,
} from "./contracts.js";

export interface CommercialGuardPort {
  validateCurrent(input: {
    readonly requestContext: RequestContext;
    readonly operation: OperationContract;
  }): Promise<void>;
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
