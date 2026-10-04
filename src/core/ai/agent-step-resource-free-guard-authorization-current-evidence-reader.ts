import type { OperationContract } from "../api/operation-contract.js";
import type { OperationRegistry } from "../api/operation-registry.js";
import type { RequestContext } from "../context/contracts.js";
import type { AuthorizationReadStorePort } from "../authorization/read-store.js";
import type { GuardResult } from "../authorization/guard-pipeline.js";
import type { CommercialGuardPort } from "../authorization/guard-ports.js";
import type { AIAgentDefinitionReadPort } from "./agent-definition.js";
import type { AIAgentApprovalReadPort } from "./agent-approval.js";
import type { AIAgentRunReadPort } from "./agent-run.js";
import {
  loadAIAgentStepActingOperationCommercialCurrentEvidence,
  type AIAgentStepActingOperationCommercialCurrentEvidence,
} from "./agent-step-acting-operation-commercial-current-evidence-reader.js";
import type { AIAgentStepReadPort } from "./agent-step.js";
import type {
  AICapabilityCatalogMetadataByCodeReadPort,
} from "./capability-catalog-metadata.js";
import type {
  AIToolDefinitionCatalogMetadataReadPort,
} from "./tool-definition-catalog-metadata.js";
import type { AIToolSetMemberReadPort } from "./tool-set-member.js";
import type { AIToolSetReadPort } from "./tool-set.js";

export interface AIAgentStepResourceFreeGuardAuthorizationPort {
  authorize(input: {
    readonly requestContext: RequestContext;
    readonly operation: OperationContract;
    readonly resourceReference?: Readonly<Record<string, unknown>>;
  }): Promise<GuardResult>;
}

export interface AIAgentStepResourceFreeGuardAuthorizationCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentStepId: string;
  readonly approverRequestContext?: RequestContext;
}

export interface AIAgentStepResourceFreeGuardAuthorizationParentOnlyEvidence {
  readonly parent: AIAgentStepActingOperationCommercialCurrentEvidence;
  readonly guardResult?: never;
}

export interface AIAgentStepResourceFreeGuardAuthorizationEvidence {
  readonly parent: AIAgentStepActingOperationCommercialCurrentEvidence;
  readonly guardResult: GuardResult;
}

export type AIAgentStepResourceFreeGuardAuthorizationCurrentEvidence =
  | AIAgentStepResourceFreeGuardAuthorizationParentOnlyEvidence
  | AIAgentStepResourceFreeGuardAuthorizationEvidence;

/**
 * DD-463…DD-467: extend exact DD-462 evidence only for canonical operations
 * that require no resource resolver.
 *
 * Missing operations and resource-resolved operations remain frozen parent-only
 * evidence and perform zero GuardPipeline calls. Resource-free operations are
 * authorized exactly once through the existing GuardPipeline-compatible
 * surface using the unchanged acting RequestContext and exact canonical
 * OperationContract, with no resourceReference.
 *
 * GuardResult evidence is authoritative only for that generic protected
 * operation authorization call. It does not establish approval satisfaction,
 * usage-limit/budget satisfaction, dispatch, transition or AI/tool execution.
 */
export async function loadAIAgentStepResourceFreeGuardAuthorizationCurrentEvidence(
  input: AIAgentStepResourceFreeGuardAuthorizationCurrentEvidenceReadInput,
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
  commercialGuard: CommercialGuardPort,
  guardAuthorization: AIAgentStepResourceFreeGuardAuthorizationPort,
): Promise<AIAgentStepResourceFreeGuardAuthorizationCurrentEvidence | null> {
  const parent = await loadAIAgentStepActingOperationCommercialCurrentEvidence(
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
    commercialGuard,
  );
  if (parent === null) return null;

  const operationContract =
    parent.parent.parent.parent.parent.parent.parent.operationContract;
  if (
    operationContract === undefined
    || operationContract.resourceResolver !== undefined
  ) {
    return Object.freeze({ parent });
  }

  const guardResult = await guardAuthorization.authorize({
    requestContext: input.requestContext,
    operation: operationContract,
  });

  return Object.freeze({
    parent,
    guardResult,
  });
}
