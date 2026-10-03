import type { RequestContext } from "../context/contracts.js";
import type { PersistedAIAgentApproval } from "./agent-approval.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

/**
 * DD-418: persisted APPROVED checkpoint evidence only.
 *
 * Migration 0013 owns the requirement that APPROVED carries an approver
 * principal and approvedAt. This floor deliberately does not order approvedAt
 * against createdAt or interpret approval type/permission/policy semantics.
 */
export function matchesAIAgentApprovalPersistedApprovedFloor(
  approval: PersistedAIAgentApproval,
): boolean {
  return Boolean(
    approval
    && typeof approval === "object"
    && isUuid(approval.id)
    && isUuid(approval.runId)
    && isUuid(approval.stepId)
    && isUuid(approval.tenantId)
    && (
      approval.industryContextId === undefined
      || isUuid(approval.industryContextId)
    )
    && isUuid(approval.correlationId)
    && approval.status === "APPROVED"
    && isUuid(approval.approverPrincipalId)
    && isTimestamp(approval.approvedAt)
  );
}

/**
 * DD-419: current approver identity/Tenant/Industry continuity against one
 * already-trusted DD-02 RequestContext.
 *
 * This does not construct a RequestContext and does not evaluate
 * AgentApproval.requiredPermission. A true result is not approval
 * authorization/satisfaction.
 */
export function matchesAIAgentApprovalApproverContextFloor(
  approval: PersistedAIAgentApproval,
  approverRequestContext: RequestContext,
): boolean {
  if (!matchesAIAgentApprovalPersistedApprovedFloor(approval)) return false;

  if (
    !approverRequestContext
    || typeof approverRequestContext !== "object"
    || !isUuid(approverRequestContext.principalId)
    || approverRequestContext.principalId !== approval.approverPrincipalId
    || !isUuid(approverRequestContext.tenantId)
    || approverRequestContext.tenantId !== approval.tenantId
  ) {
    return false;
  }

  if (approval.industryContextId !== undefined) {
    return approverRequestContext.scopeClass === "TENANT_INDUSTRY"
      && isUuid(approverRequestContext.industryContextId)
      && approverRequestContext.industryContextId === approval.industryContextId;
  }

  if (approverRequestContext.scopeClass === "TENANT_CORE") {
    return approverRequestContext.industryContextId === undefined;
  }

  if (approverRequestContext.scopeClass === "TENANT_INDUSTRY") {
    return isUuid(approverRequestContext.industryContextId);
  }

  return false;
}
