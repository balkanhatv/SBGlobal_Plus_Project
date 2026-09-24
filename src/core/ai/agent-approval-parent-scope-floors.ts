import type { PersistedAIAgentApproval } from "./agent-approval.js";
import type { PersistedAIAgentRun } from "./agent-run.js";
import type { PersistedAIAgentStep } from "./agent-step.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Re-evaluates only migration-0031's AgentApproval -> AgentRun/AgentStep
 * parent chain and Tenant/nullable-Industry relationship.
 *
 * A true result is not approval satisfaction, approver authorization,
 * AgentRun resume or tool execution authority.
 */
export function matchesAIAgentApprovalParentScopeFloors(
  approval: PersistedAIAgentApproval,
  run: PersistedAIAgentRun,
  step: PersistedAIAgentStep,
): boolean {
  if (
    !isUuid(approval.id)
    || !isUuid(approval.runId)
    || !isUuid(approval.stepId)
    || !isUuid(approval.tenantId)
    || (approval.industryContextId !== undefined && !isUuid(approval.industryContextId))
  ) {
    return false;
  }

  if (
    !isUuid(run.id)
    || !isUuid(run.tenantId)
    || (run.industryContextId !== undefined && !isUuid(run.industryContextId))
    || !isUuid(step.id)
    || !isUuid(step.runId)
  ) {
    return false;
  }

  return run.id === approval.runId
    && step.id === approval.stepId
    && step.runId === approval.runId
    && run.tenantId === approval.tenantId
    && run.industryContextId === approval.industryContextId;
}
