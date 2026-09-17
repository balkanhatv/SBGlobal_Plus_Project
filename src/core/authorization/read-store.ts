import type { RequestContext } from "../context/contracts.js";
import type { AbacExpressionV1, PermissionSetV1 } from "./policy-grammar.js";

export type AuthorizationReadScopeClass =
  | "PLATFORM_GLOBAL"
  | "TENANT_CORE"
  | "TENANT_INDUSTRY";

export interface CompiledPermissionSnapshotRead {
  readonly scopeClass: AuthorizationReadScopeClass;
  readonly permissionVersion: number;
  readonly roleIds: readonly string[];
  readonly permissionSet: PermissionSetV1;
  readonly sourceFingerprint: string;
}

export interface ActiveAbacPolicyRead {
  readonly id: string;
  readonly code: string;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly permissionPattern: string;
  readonly priority: number;
  readonly effect: "DENY" | "RESTRICT";
  readonly expressionVersion: 1;
  readonly expression: AbacExpressionV1;
}

export interface AuthorizationReadState {
  readonly permissionSnapshot: CompiledPermissionSnapshotRead;
  readonly policies: readonly ActiveAbacPolicyRead[];
}

export type AuthorizationReadErrorCode =
  | "AUTHORIZATION_SCOPE_UNSUPPORTED"
  | "AUTHORIZATION_STATE_UNAVAILABLE"
  | "AUTHORIZATION_STATE_INVALID";

export class AuthorizationReadError extends Error {
  readonly code: AuthorizationReadErrorCode;

  constructor(code: AuthorizationReadErrorCode, message: string) {
    super(message);
    this.name = "AuthorizationReadError";
    this.code = code;
  }
}

export interface AuthorizationReadStorePort {
  load(input: {
    readonly requestContext: RequestContext;
    readonly permissionCode: string;
  }): Promise<AuthorizationReadState>;
}
