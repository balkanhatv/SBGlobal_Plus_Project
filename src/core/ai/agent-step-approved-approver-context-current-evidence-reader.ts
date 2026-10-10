import type { OperationRegistry } from "../api/operation-registry.js";
import type { RequestContext } from "../context/contracts.js";
import type { AIAgentDefinitionReadPort } from "./agent-definition.js";
import type { AIAgentApprovalReadPort } from "./agent-approval.js";
import {
  matchesAIAgentApprovalApproverContextFloor,
} from "./agent-approval-approved-context-floors.js";
import type { AIAgentRunReadPort } from "./agent-run.js";
import {
  loadAIAgentStepApprovalOperationCapabilityCurrentEvidence,
  type AIAgentStepApprovalOperationCapabilityCurrentEvidence,
} from "./agent-step-visible-approval-operation-capability-current-evidence-reader.js";
import type { AIAgentStepReadPort } from "./agent-step.js";
import type {
  AICapabilityCatalogMetadataByCodeReadPort,
} from "./capability-catalog-metadata.js";
import type {
  AIToolDefinitionCatalogMetadataReadPort,
} from "./tool-definition-catalog-metadata.js";
import type { AIToolSetMemberReadPort } from "./tool-set-member.js";
import type { AIToolSetReadPort } from "./tool-set.js";

export interface AIAgentStepApprovedApproverContextCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentStepId: string;
  readonly approverRequestContext?: RequestContext;
}

export interface AIAgentStepApprovedApproverContextCurrentEvidence {
  readonly parent: AIAgentStepApprovalOperationCapabilityCurrentEvidence;
  readonly approverRequestContext?: RequestContext;
}

/**
 * DD-420…DD-422: extend exact DD-417 evidence only when a persisted approval
 * exists and an already-trusted current approver RequestContext matches its
 * recorded approver/Tenant/Industry context.
 *
 * Parent evidence with no AgentApproval is preserved as evidence only; that
 * does not mean approval is unnecessary. Required permission evaluation,
 * approval satisfaction, GuardPipeline admission and tool execution remain
 * separately governed.
 */
export async function loadAIAgentStepApprovedApproverContextCurrentEvidence(
  input: AIAgentStepApprovedApproverContextCurrentEvidenceReadInput,
  stepReader: AIAgentStepReadPort,
  runReader: AIAgentRunReadPort,
  definitionReader: AIAgentDefinitionReadPort,
  toolSetReader: AIToolSetReadPort,
  memberReader: AIToolSetMemberReadPort,
  toolDefinitionReader: AIToolDefinitionCatalogMetadataReadPort,
  approvalReader: AIAgentApprovalReadPort,
  operationRegistry: OperationRegistry,
  capabilityReader: AICapabilityCatalogMetadataByCodeReadPort,
): Promise<AIAgentStepApprovedApproverContextCurrentEvidence | null> {
  const parent = await loadAIAgentStepApprovalOperationCapabilityCurrentEvidence(
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
    operationRegistry,
    capabilityReader,
  );
  if (parent === null) return null;

  const approval = parent.parent.parent.approval;
  if (approval === undefined) {
    return Object.freeze({
      parent,
    });
  }

  if (
    input.approverRequestContext === undefined
    || !matchesAIAgentApprovalApproverContextFloor(
      approval,
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
