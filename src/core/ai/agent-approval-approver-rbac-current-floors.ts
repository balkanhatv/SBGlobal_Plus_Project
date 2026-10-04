import type { RequestContext } from "../context/contracts.js";
import type { AuthorizationReadState } from "../authorization/read-store.js";
import type { CompiledPermissionV1 } from "../authorization/policy-grammar.js";
import { selectAICurrentTenantRbacAllow } from "./current-tenant-rbac-current-allow.js";

/**
 * DD-445 semantic wrapper for approval/approver current-RBAC evidence.
 *
 * DD-450 moves only the reusable protected-Tenant selection mechanics into
 * a generic helper. Approval-specific callers keep this stable semantic name.
 */
export function selectAIAgentApprovalApproverRbacCurrentAllow(
  requestContext: RequestContext,
  authorizationState: AuthorizationReadState,
  requiredPermission: string,
): CompiledPermissionV1 | null {
  return selectAICurrentTenantRbacAllow(
    requestContext,
    authorizationState,
    requiredPermission,
  );
}
