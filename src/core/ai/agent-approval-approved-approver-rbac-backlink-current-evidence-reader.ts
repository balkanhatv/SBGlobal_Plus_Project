import type { RequestContext } from "../context/contracts.js";
import type { AuthorizationReadStorePort } from "../authorization/read-store.js";
import type { AIAgentApprovalReadPort } from "./agent-approval.js";
import {
  loadAIAgentApprovalApprovedApproverRbacCurrentEvidence,
  type AIAgentApprovalApprovedApproverRbacCurrentEvidence,
} from "./agent-approval-approved-approver-rbac-current-evidence-reader.js";
import type { AIAgentRunReadPort } from "./agent-run.js";
import {
  matchesAIAgentStepApprovalBacklinkFloors,
} from "./agent-step-approval-backlink-floors.js";
import type { AIAgentStepReadPort } from "./agent-step.js";

export interface AIAgentApprovalApprovedApproverRbacBacklinkCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentApprovalId: string;
  readonly approverRequestContext?: RequestContext;
}

export interface AIAgentApprovalApprovedApproverRbacBacklinkCurrentEvidence {
  readonly parent: AIAgentApprovalApprovedApproverRbacCurrentEvidence;
}

/**
 * DD-438…DD-442: extend exact DD-437 evidence only by re-applying DD-183's
 * reciprocal persisted AgentStep -> AgentApproval backlink floor to the exact
 * already-loaded step and approval references.
 *
 * This performs no additional reads and does not establish full
 * authorization, approval satisfaction, transition, dispatch or AI/tool
 * execution authority.
 */
export async function loadAIAgentApprovalApprovedApproverRbacBacklinkCurrentEvidence(
  input: AIAgentApprovalApprovedApproverRbacBacklinkCurrentEvidenceReadInput,
  approvalReader: AIAgentApprovalReadPort,
  runReader: AIAgentRunReadPort,
  stepReader: AIAgentStepReadPort,
  authorizationReader: AuthorizationReadStorePort,
): Promise<AIAgentApprovalApprovedApproverRbacBacklinkCurrentEvidence | null> {
  const parent = await loadAIAgentApprovalApprovedApproverRbacCurrentEvidence(
    input,
    approvalReader,
    runReader,
    stepReader,
    authorizationReader,
  );
  if (parent === null) return null;

  const approval = parent.parent.parent.approval;
  const step = parent.parent.parent.step;
  if (!matchesAIAgentStepApprovalBacklinkFloors(step, approval)) {
    return null;
  }

  return Object.freeze({ parent });
}
