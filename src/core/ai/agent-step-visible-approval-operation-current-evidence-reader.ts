import type { OperationContract } from "../api/operation-contract.js";
import type { OperationRegistry } from "../api/operation-registry.js";
import type { RequestContext } from "../context/contracts.js";
import type { AIAgentDefinitionReadPort } from "./agent-definition.js";
import type { AIAgentApprovalReadPort } from "./agent-approval.js";
import type { AIAgentRunReadPort } from "./agent-run.js";
import {
  loadAIAgentStepApprovalCurrentEvidence,
  type AIAgentStepApprovalCurrentEvidence,
} from "./agent-step-visible-approval-current-evidence-reader.js";
import type { AIAgentStepReadPort } from "./agent-step.js";
import type {
  AIToolDefinitionCatalogMetadataReadPort,
} from "./tool-definition-catalog-metadata.js";
import type { AIToolSetMemberReadPort } from "./tool-set-member.js";
import type { AIToolSetReadPort } from "./tool-set.js";

export interface AIAgentStepApprovalOperationCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentStepId: string;
}

export interface AIAgentStepApprovalOperationCurrentEvidence {
  readonly parent: AIAgentStepApprovalCurrentEvidence;
  readonly operationContract?: OperationContract;
}

/**
 * DD-408…DD-412: extend exact DD-407 AgentStep/approval evidence with only
 * the canonical OperationContract registry record referenced by an already
 * bound TOOL definition.
 *
 * Registry presence is evidence only. This boundary does not interpret
 * ToolDefinition/OperationContract compatibility, authorize the current
 * RequestContext, decide approval satisfaction, dispatch or execute a tool.
 */
export async function loadAIAgentStepApprovalOperationCurrentEvidence(
  input: AIAgentStepApprovalOperationCurrentEvidenceReadInput,
  stepReader: AIAgentStepReadPort,
  runReader: AIAgentRunReadPort,
  definitionReader: AIAgentDefinitionReadPort,
  toolSetReader: AIToolSetReadPort,
  memberReader: AIToolSetMemberReadPort,
  toolDefinitionReader: AIToolDefinitionCatalogMetadataReadPort,
  approvalReader: AIAgentApprovalReadPort,
  operationRegistry: OperationRegistry,
): Promise<AIAgentStepApprovalOperationCurrentEvidence | null> {
  const parent = await loadAIAgentStepApprovalCurrentEvidence(
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
    approvalReader,
  );
  if (parent === null) return null;

  if (parent.parent.step.stepType !== "TOOL") {
    return Object.freeze({
      parent,
    });
  }

  const toolDefinition = parent.parent.toolDefinition;
  if (toolDefinition === undefined) return null;

  const operationContract = operationRegistry.get(
    toolDefinition.operationContractId,
  );

  return Object.freeze({
    parent,
    operationContract,
  });
}
