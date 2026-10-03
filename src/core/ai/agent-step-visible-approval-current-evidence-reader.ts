import type { RequestContext } from "../context/contracts.js";
import type { AIAgentDefinitionReadPort } from "./agent-definition.js";
import type {
  AIAgentApprovalReadPort,
  PersistedAIAgentApproval,
} from "./agent-approval.js";
import {
  matchesAIAgentApprovalParentScopeFloors,
} from "./agent-approval-parent-scope-floors.js";
import type { AIAgentRunReadPort } from "./agent-run.js";
import {
  matchesAIAgentStepApprovalBacklinkFloors,
} from "./agent-step-approval-backlink-floors.js";
import type { AIAgentStepReadPort } from "./agent-step.js";
import {
  loadAIAgentStepToolBindingCurrentEvidence,
  type AIAgentStepToolBindingCurrentEvidence,
} from "./agent-step-visible-tool-binding-current-evidence-reader.js";
import type {
  AIToolDefinitionCatalogMetadataReadPort,
} from "./tool-definition-catalog-metadata.js";
import type { AIToolSetMemberReadPort } from "./tool-set-member.js";
import type { AIToolSetReadPort } from "./tool-set.js";

export interface AIAgentStepApprovalCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentStepId: string;
}

export interface AIAgentStepApprovalCurrentEvidence {
  readonly parent: AIAgentStepToolBindingCurrentEvidence;
  readonly approval?: PersistedAIAgentApproval;
}

/**
 * DD-403…DD-407: extend exact DD-402 AgentStep parent/tool evidence with only
 * the optional same-RequestContext AgentApproval backlink and parent/scope
 * evidence owned by DD-183/DD-184.
 *
 * Persisted APPROVED status remains raw historical evidence. This reader does
 * not decide approval satisfaction/currentness, approver authorization,
 * AgentRun resume or tool/OperationContract execution.
 */
export async function loadAIAgentStepApprovalCurrentEvidence(
  input: AIAgentStepApprovalCurrentEvidenceReadInput,
  stepReader: AIAgentStepReadPort,
  runReader: AIAgentRunReadPort,
  definitionReader: AIAgentDefinitionReadPort,
  toolSetReader: AIToolSetReadPort,
  memberReader: AIToolSetMemberReadPort,
  toolDefinitionReader: AIToolDefinitionCatalogMetadataReadPort,
  approvalReader: AIAgentApprovalReadPort,
): Promise<AIAgentStepApprovalCurrentEvidence | null> {
  const parent = await loadAIAgentStepToolBindingCurrentEvidence(
    {
      requestContext: input.requestContext,
      agentStepId: input.agentStepId,
    },
    stepReader,
    runReader,
    definitionReader,
    toolSetReader,
    memberReader,
    toolDefinitionReader,
  );
  if (parent === null) return null;

  const step = parent.step;
  if (step.approvalId === undefined) {
    if (!matchesAIAgentStepApprovalBacklinkFloors(step, undefined)) {
      return null;
    }

    return Object.freeze({
      parent,
    });
  }

  const approval = await approvalReader.loadForContext({
    requestContext: input.requestContext,
    agentApprovalId: step.approvalId,
  });
  if (approval === null) return null;

  if (!matchesAIAgentStepApprovalBacklinkFloors(step, approval)) {
    return null;
  }

  if (!matchesAIAgentApprovalParentScopeFloors(
    approval,
    parent.parent.runDefinition.run,
    step,
  )) {
    return null;
  }

  return Object.freeze({
    parent,
    approval,
  });
}
