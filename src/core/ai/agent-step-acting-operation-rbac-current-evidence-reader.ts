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
  loadAIAgentStepActingToolRbacCurrentEvidence,
  type AIAgentStepActingToolRbacCurrentEvidence,
} from "./agent-step-acting-tool-rbac-current-evidence-reader.js";
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

export interface AIAgentStepActingOperationRbacCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentStepId: string;
  readonly approverRequestContext?: RequestContext;
}

export interface AIAgentStepActingOperationRbacParentOnlyEvidence {
  readonly parent: AIAgentStepActingToolRbacCurrentEvidence;
  readonly operationAuthorizationState?: never;
  readonly operationPermission?: never;
}

export interface AIAgentStepActingOperationRbacToolEvidence {
  readonly parent: AIAgentStepActingToolRbacCurrentEvidence;
  readonly operationAuthorizationState: AuthorizationReadState;
  readonly operationPermission: CompiledPermissionV1;
}

export type AIAgentStepActingOperationRbacCurrentEvidence =
  | AIAgentStepActingOperationRbacParentOnlyEvidence
  | AIAgentStepActingOperationRbacToolEvidence;

/**
 * DD-453…DD-457: extend exact DD-452 evidence only when a canonical
 * OperationContract is already preserved for the TOOL step.
 *
 * This performs one additional acting-principal current Authorization read for
 * OperationContract.permissionCode and applies the shared protected-Tenant
 * compiled-RBAC necessary floor. It does not compare permission metadata or
 * create full authorization, admission, approval-satisfaction or execution
 * authority.
 */
export async function loadAIAgentStepActingOperationRbacCurrentEvidence(
  input: AIAgentStepActingOperationRbacCurrentEvidenceReadInput,
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
): Promise<AIAgentStepActingOperationRbacCurrentEvidence | null> {
  const parent = await loadAIAgentStepActingToolRbacCurrentEvidence(
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

  const operationContract =
    parent.parent.parent.parent.parent.operationContract;
  if (operationContract === undefined) {
    return Object.freeze({ parent });
  }

  const operationAuthorizationState = await authorizationReader.load({
    requestContext: input.requestContext,
    permissionCode: operationContract.permissionCode,
  });

  const operationPermission = selectAICurrentTenantRbacAllow(
    input.requestContext,
    operationAuthorizationState,
    operationContract.permissionCode,
  );
  if (operationPermission === null) return null;

  return Object.freeze({
    parent,
    operationAuthorizationState,
    operationPermission,
  });
}
