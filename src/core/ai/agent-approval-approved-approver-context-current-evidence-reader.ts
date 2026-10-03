import type { RequestContext } from "../context/contracts.js";
import type { AIAgentApprovalReadPort } from "./agent-approval.js";
import {
  matchesAIAgentApprovalApproverContextFloor,
} from "./agent-approval-approved-context-floors.js";
import {
  loadAIAgentApprovalParentCurrentEvidence,
  type AIAgentApprovalParentCurrentEvidence,
} from "./agent-approval-visible-parent-current-evidence-reader.js";
import type { AIAgentRunReadPort } from "./agent-run.js";
import type { AIAgentStepReadPort } from "./agent-step.js";

export interface AIAgentApprovalApprovedApproverContextCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentApprovalId: string;
  readonly approverRequestContext?: RequestContext;
}

export interface AIAgentApprovalApprovedApproverContextCurrentEvidence {
  readonly parent: AIAgentApprovalParentCurrentEvidence;
  readonly approverRequestContext: RequestContext;
}

/**
 * DD-428…DD-432: extend exact DD-427 approval-parent evidence only when one
 * explicitly supplied, already-trusted current approver RequestContext matches
 * the persisted APPROVED approval under DD-419.
 *
 * This boundary does not construct approver context, evaluate
 * requiredPermission, decide approval satisfaction, invoke GuardPipeline,
 * transition AgentRun/AgentStep, dispatch tools or execute AI.
 */
export async function loadAIAgentApprovalApprovedApproverContextCurrentEvidence(
  input: AIAgentApprovalApprovedApproverContextCurrentEvidenceReadInput,
  approvalReader: AIAgentApprovalReadPort,
  runReader: AIAgentRunReadPort,
  stepReader: AIAgentStepReadPort,
): Promise<AIAgentApprovalApprovedApproverContextCurrentEvidence | null> {
  const parent = await loadAIAgentApprovalParentCurrentEvidence(
    {
      requestContext: input.requestContext,
      agentApprovalId: input.agentApprovalId,
    },
    approvalReader,
    runReader,
    stepReader,
  );
  if (parent === null) return null;

  if (
    input.approverRequestContext === undefined
    || !matchesAIAgentApprovalApproverContextFloor(
      parent.approval,
      input.approverRequestContext,
    )
  ) {
    return null;
  }

  return Object.freeze({
    parent,
    approverRequestContext: input.approverRequestContext,
  });
}
