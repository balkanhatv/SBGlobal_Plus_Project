export type ContextErrorCode =
  | "AUTH_REQUIRED"
  | "TENANT_INVALID"
  | "MEMBERSHIP_INVALID"
  | "INDUSTRY_CONTEXT_REQUIRED"
  | "INDUSTRY_CONTEXT_MISMATCH"
  | "SUBSCRIPTION_RESTRICTED"
  | "LICENSE_INVALID"
  | "SESSION_INVALID"
  | "DEVICE_UNTRUSTED"
  | "CREDENTIAL_INVALID"
  | "CREDENTIAL_REVOKED"
  | "ENTITLEMENT_MISSING"
  | "RESOURCE_SCOPE_DENY"
  | "DEPENDENCY_UNAVAILABLE";

export class ContextResolutionError extends Error {
  readonly code: ContextErrorCode;
  readonly revealResourceExistence = false;

  constructor(code: ContextErrorCode, messageSafe: string) {
    super(messageSafe);
    this.name = "ContextResolutionError";
    this.code = code;
  }
}
