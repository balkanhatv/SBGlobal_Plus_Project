import type { OperationRegistry } from "../api/operation-registry.js";
import type { RequestContext } from "../context/contracts.js";
import type {
  AuthorizationReadState,
  AuthorizationReadStorePort,
} from "../authorization/read-store.js";
import type { CompiledPermissionV1 } from "../authorization/policy-grammar.js";
import type { AIAgentDefinitionReadPort } from "./agent-definition.js";
import type { AIAgentApprovalReadPort } from "./agent-approval.js";
import {
  selectAIAgentApprovalApproverRbacCurrentAllow,
} from "./agent-approval-approver-rbac-current-floors.js";
import type { AIAgentRunReadPort } from "./agent-run.js";
import {
  loadAIAgentStepApprovedApproverContextCurrentEvidence,
  type AIAgentStepApprovedApproverContextCurrentEvidence,
} from "./agent-step-approved-approver-context-current-evidence-reader.js";
import type { AIAgentStepReadPort } from "./agent-step.js";
import type {
  AICapabilityCatalogMetadataByCodeReadPort,
} from "./capability-catalog-metadata.js";
import type {
  AIToolDefinitionCatalogMetadataReadPort,
} from "./tool-definition-catalog-metadata.js";
import type { AIToolSetMemberReadPort } from "./tool-set-member.js";
import type { AIToolSetReadPort } from "./tool-set.js";

export interface AIAgentStepApprovedApproverRbacCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentStepId: string;
  readonly approverRequestContext?: RequestContext;
}

export interface AIAgentStepApprovedApproverRbacParentOnlyEvidence {
  readonly parent: AIAgentStepApprovedApproverContextCurrentEvidence;
  readonly authorizationState?: never;
  readonly permission?: never;
}

export interface AIAgentStepApprovedApproverRbacApprovalEvidence {
  readonly parent: AIAgentStepApprovedApproverContextCurrentEvidence;
  readonly authorizationState: AuthorizationReadState;
  readonly permission: CompiledPermissionV1;
}

export type AIAgentStepApprovedApproverRbacCurrentEvidence =
  | AIAgentStepApprovedApproverRbacParentOnlyEvidence
  | AIAgentStepApprovedApproverRbacApprovalEvidence;

/**
 * DD-443…DD-447: extend exact DD-422 step-centered evidence with current
 * approver RBAC necessary evidence only when a persisted AgentApproval exists.
 *
 * No-approval evidence performs zero Authorization reads and does not imply
 * approval is unnecessary. Approval evidence uses the exact already-trusted
 * approver RequestContext and persisted AgentApproval.requiredPermission.
 * ToolDefinition/OperationContract/capability metadata and ABAC policies remain
 * raw; no compatibility, full authorization, approval satisfaction, dispatch
 * or AI/tool execution authority is created.
 */
export async function loadAIAgentStepApprovedApproverRbacCurrentEvidence(
  input: AIAgentStepApprovedApproverRbacCurrentEvidenceReadInput,
  stepReader: AIAgentStepReadPort,
  runReader: AIAgentRunReadPort,
  definitionReader: AIAgentDefinitionReadPort,
  toolSetReader: AIToolSetReadPort,
  memberReader: AIToolSetMemberReadPort,
  toolDefinitionReader: AIToolDefinitionCatalogMetadataReadPort,
  approvalReader: AIAgentApprovalReadPort,
  operationRegistry: OperationRegistry,
  capabilityReader: AICapabilityCatalogMetadataByCodeReadPort,
  authorizationReader: AuthorizationReadStorePort,
): Promise<AIAgentStepApprovedApproverRbacCurrentEvidence | null> {
  const parent = await loadAIAgentStepApprovedApproverContextCurrentEvidence(
    input,
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

  const approval = parent.parent.parent.parent.approval;
  if (approval === undefined) {
    return Object.freeze({ parent });
  }

  const approverRequestContext = parent.approverRequestContext;
  if (approverRequestContext === undefined) return null;

  const authorizationState = await authorizationReader.load({
    requestContext: approverRequestContext,
    permissionCode: approval.requiredPermission,
  });

  const permission = selectAIAgentApprovalApproverRbacCurrentAllow(
    approverRequestContext,
    authorizationState,
    approval.requiredPermission,
  );
  if (permission === null) return null;

  return Object.freeze({
    parent,
    authorizationState,
    permission,
  });
}
