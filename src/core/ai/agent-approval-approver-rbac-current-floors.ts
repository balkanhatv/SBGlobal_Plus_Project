import type { RequestContext } from "../context/contracts.js";
import type { AuthorizationReadState } from "../authorization/read-store.js";
import type { CompiledPermissionV1 } from "../authorization/policy-grammar.js";

function isPositiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function equalStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

/**
 * DD-445 shared floor: select the exact current compiled RBAC ALLOW evidence
 * for one persisted approval permission under one already-trusted approver
 * RequestContext.
 *
 * This is a necessary RBAC evidence floor only. It does not evaluate ABAC,
 * commercial/entitlement/resource facts or create a full AuthorizationDecision.
 */
export function selectAIAgentApprovalApproverRbacCurrentAllow(
  requestContext: RequestContext,
  authorizationState: AuthorizationReadState,
  requiredPermission: string,
): CompiledPermissionV1 | null {
  const snapshot = authorizationState.permissionSnapshot;

  if (snapshot.scopeClass !== requestContext.scopeClass) return null;
  if (
    requestContext.scopeClass !== "TENANT_CORE"
    && requestContext.scopeClass !== "TENANT_INDUSTRY"
  ) {
    return null;
  }

  if (
    !isPositiveSafeInteger(requestContext.permissionVersion)
    || requestContext.permissionVersion !== snapshot.permissionVersion
    || !equalStrings(requestContext.roleIds, snapshot.roleIds)
  ) {
    return null;
  }

  const matchingPermissions = snapshot.permissionSet.permissions
    .filter((entry) => entry.code === requiredPermission);
  const permission = matchingPermissions[0];

  if (
    matchingPermissions.length !== 1
    || permission === undefined
    || permission.effect !== "ALLOW"
  ) {
    return null;
  }

  return permission;
}
