import type { OperationRegistry } from "../api/operation-registry.js";
import type { RequestContext } from "../context/contracts.js";
import type {
  AuthorizationReadState,
  AuthorizationReadStorePort,
} from "../authorization/read-store.js";
import type { CompiledPermissionV1 } from "../authorization/policy-grammar.js";
import type { AIAgentDefinitionReadPort } from "./agent-definition.js";
import type { AIAgentApprovalReadPort } from "./agent-approval.js";
import type { AIAgentRunReadPort } from "./agent-run.js";
import {
  loadAIAgentStepApprovedApproverRbacCurrentEvidence,
  type AIAgentStepApprovedApproverRbacCurrentEvidence,
} from "./agent-step-approved-approver-rbac-current-evidence-reader.js";
import type { AIAgentStepReadPort } from "./agent-step.js";
import type {
  AICapabilityCatalogMetadataByCodeReadPort,
} from "./capability-catalog-metadata.js";
import {
  selectAICurrentTenantRbacAllow,
} from "./current-tenant-rbac-current-allow.js";
import type {
  AIToolDefinitionCatalogMetadataReadPort,
} from "./tool-definition-catalog-metadata.js";
import type { AIToolSetMemberReadPort } from "./tool-set-member.js";
import type { AIToolSetReadPort } from "./tool-set.js";

export interface AIAgentStepActingToolRbacCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentStepId: string;
  readonly approverRequestContext?: RequestContext;
}

export interface AIAgentStepActingToolRbacParentOnlyEvidence {
  readonly parent: AIAgentStepApprovedApproverRbacCurrentEvidence;
  readonly actingAuthorizationState?: never;
  readonly actingPermission?: never;
}

export interface AIAgentStepActingToolRbacToolEvidence {
  readonly parent: AIAgentStepApprovedApproverRbacCurrentEvidence;
  readonly actingAuthorizationState: AuthorizationReadState;
  readonly actingPermission: CompiledPermissionV1;
}

export type AIAgentStepActingToolRbacCurrentEvidence =
  | AIAgentStepActingToolRbacParentOnlyEvidence
  | AIAgentStepActingToolRbacToolEvidence;

/**
 * DD-448…DD-452: extend exact DD-447 evidence only for persisted TOOL steps
 * with a necessary current compiled-RBAC ALLOW floor for the acting principal
 * and exact already-preserved ToolDefinition.requiredPermission.
 *
 * Non-TOOL steps perform zero new acting Authorization reads. This does not
 * compare ToolDefinition permission metadata with OperationContract or
 * AgentApproval permission metadata and grants no execution authority.
 */
export async function loadAIAgentStepActingToolRbacCurrentEvidence(
  input: AIAgentStepActingToolRbacCurrentEvidenceReadInput,
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
): Promise<AIAgentStepActingToolRbacCurrentEvidence | null> {
  const parent = await loadAIAgentStepApprovedApproverRbacCurrentEvidence(
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
    authorizationReader,
  );
  if (parent === null) return null;

  const stepEvidence = parent.parent.parent.parent.parent;
  if (stepEvidence.step.stepType !== "TOOL") {
    return Object.freeze({ parent });
  }

  const toolDefinition = stepEvidence.toolDefinition;
  if (toolDefinition === undefined) return null;

  const actingAuthorizationState = await authorizationReader.load({
    requestContext: input.requestContext,
    permissionCode: toolDefinition.requiredPermission,
  });

  const actingPermission = selectAICurrentTenantRbacAllow(
    input.requestContext,
    actingAuthorizationState,
    toolDefinition.requiredPermission,
  );
  if (actingPermission === null) return null;

  return Object.freeze({
    parent,
    actingAuthorizationState,
    actingPermission,
  });
}
