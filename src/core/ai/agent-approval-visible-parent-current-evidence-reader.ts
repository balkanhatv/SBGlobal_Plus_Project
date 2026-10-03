import type { RequestContext } from "../context/contracts.js";
import type {
  AIAgentApprovalReadPort,
  PersistedAIAgentApproval,
} from "./agent-approval.js";
import {
  matchesAIAgentApprovalParentScopeFloors,
} from "./agent-approval-parent-scope-floors.js";
import type {
  AIAgentRunReadPort,
  PersistedAIAgentRun,
} from "./agent-run.js";
import type {
  AIAgentStepReadPort,
  PersistedAIAgentStep,
} from "./agent-step.js";

export interface AIAgentApprovalParentCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentApprovalId: string;
}

export interface AIAgentApprovalParentCurrentEvidence {
  readonly approval: PersistedAIAgentApproval;
  readonly run: PersistedAIAgentRun;
  readonly step: PersistedAIAgentStep;
}

/**
 * DD-423…DD-427: read one exact visible AgentApproval and follow only its
 * persisted runId/stepId through the existing same-RequestContext raw readers,
 * then re-apply DD-184 parent/scope continuity.
 *
 * This is historical relationship evidence only. It deliberately does not
 * require APPROVED state, a reciprocal step.approvalId backlink, current
 * approver context/permission, AgentRun transitions or tool/AI execution.
 */
export async function loadAIAgentApprovalParentCurrentEvidence(
  input: AIAgentApprovalParentCurrentEvidenceReadInput,
  approvalReader: AIAgentApprovalReadPort,
  runReader: AIAgentRunReadPort,
  stepReader: AIAgentStepReadPort,
): Promise<AIAgentApprovalParentCurrentEvidence | null> {
  const approval = await approvalReader.loadForContext({
    requestContext: input.requestContext,
    agentApprovalId: input.agentApprovalId,
  });
  if (approval === null) return null;

  const run = await runReader.loadForContext({
    requestContext: input.requestContext,
    agentRunId: approval.runId,
  });
  if (run === null) return null;

  const step = await stepReader.loadForContext({
    requestContext: input.requestContext,
    agentStepId: approval.stepId,
  });
  if (step === null) return null;

  if (!matchesAIAgentApprovalParentScopeFloors(approval, run, step)) {
    return null;
  }

  return Object.freeze({
    approval,
    run,
    step,
  });
}
