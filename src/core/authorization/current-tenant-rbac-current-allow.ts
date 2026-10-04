import type { RequestContext } from "../context/contracts.js";
import type { AuthorizationReadState } from "./read-store.js";
import type { CompiledPermissionV1 } from "./policy-grammar.js";

function isPositiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function equalStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

/**
 * DD-475 Authorization-owned generic protected-Tenant current compiled RBAC
 * necessary floor.
 *
 * It selects one exact canonical ALLOW entry only after current
 * scope/permissionVersion/ordered-role continuity. It does not evaluate ABAC,
 * commercial/entitlement/resource facts or create a full AuthorizationDecision.
 */
export function selectCurrentTenantRbacAllow(
  requestContext: RequestContext,
  authorizationState: AuthorizationReadState,
  permissionCode: string,
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

  const matches = snapshot.permissionSet.permissions
    .filter((entry) => entry.code === permissionCode);
  const permission = matches[0];

  if (
    matches.length !== 1
    || permission === undefined
    || permission.effect !== "ALLOW"
  ) {
    return null;
  }

  return permission;
}
