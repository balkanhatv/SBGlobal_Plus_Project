import type { RequestContext } from "../context/contracts.js";
import type { AuthorizationReadState } from "../authorization/read-store.js";
import type { CompiledPermissionV1 } from "../authorization/policy-grammar.js";
import { selectCurrentTenantRbacAllow } from "../authorization/current-tenant-rbac-current-allow.js";

/**
 * DD-450 stable AI compatibility wrapper.
 *
 * DD-475 moves the reusable mechanics to Authorization ownership so non-AI
 * protected-Tenant callers can share the exact same floor without importing
 * from the AI domain.
 */
export function selectAICurrentTenantRbacAllow(
  requestContext: RequestContext,
  authorizationState: AuthorizationReadState,
  permissionCode: string,
): CompiledPermissionV1 | null {
  return selectCurrentTenantRbacAllow(
    requestContext,
    authorizationState,
    permissionCode,
  );
}
