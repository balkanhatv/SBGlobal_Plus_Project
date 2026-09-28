import type { OperationContract } from "../api/operation-contract.js";
import type { RequestContext } from "../context/contracts.js";
import type { AccessDecision, ResourceDescriptor } from "./contracts.js";

export type AuthorizationAuditOutcome = "SUCCESS" | "DENIED";

export interface AuthorizationAuditInput {
  readonly requestContext: RequestContext;
  readonly operation: OperationContract;
  readonly outcome: AuthorizationAuditOutcome;
  readonly reasonCode?: string;
  readonly accessDecision?: AccessDecision;
  readonly resourceDescriptor?: ResourceDescriptor;
}

export interface AuthorizationAuditPort {
  append(input: AuthorizationAuditInput): Promise<void>;
}

export class AuthorizationAuditError extends Error {
  readonly code = "AUTHORIZATION_AUDIT_UNAVAILABLE" as const;

  constructor(message = "Authorization audit persistence is unavailable.") {
    super(message);
    this.name = "AuthorizationAuditError";
  }
}
