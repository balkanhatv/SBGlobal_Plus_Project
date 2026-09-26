import type { PersistedAIAgentApproval } from "./agent-approval.js";
import type { PersistedAIAgentStep } from "./agent-step.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/**
 * Re-evaluates only migration-0031's optional AgentStep -> AgentApproval
 * persisted backlink: exact approval id, same run and same step.
 *
 * A true result is not approval satisfaction, approver authorization,
 * AgentRun resume or tool execution authority.
 */
export function matchesAIAgentStepApprovalBacklinkFloors(
  step: PersistedAIAgentStep,
  approval?: PersistedAIAgentApproval,
): boolean {
  if (!isUuid(step.id) || !isUuid(step.runId)) return false;

  if (step.approvalId === undefined) {
    return approval === undefined;
  }

  if (
    !isUuid(step.approvalId)
    || approval === undefined
    || !isUuid(approval.id)
    || !isUuid(approval.runId)
    || !isUuid(approval.stepId)
  ) {
    return false;
  }

  return approval.id === step.approvalId
    && approval.runId === step.runId
    && approval.stepId === step.id;
}
