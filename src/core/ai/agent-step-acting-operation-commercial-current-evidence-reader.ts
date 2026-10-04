import type { OperationRegistry } from "../api/operation-registry.js";
import type { RequestContext } from "../context/contracts.js";
import type { AuthorizationReadStorePort } from "../authorization/read-store.js";
import type {
  CommercialGuardPort,
  CommercialGuardResult,
} from "../authorization/guard-ports.js";
import type { AIAgentDefinitionReadPort } from "./agent-definition.js";
import type { AIAgentApprovalReadPort } from "./agent-approval.js";
import type { AIAgentRunReadPort } from "./agent-run.js";
import {
  loadAIAgentStepActingOperationRbacCurrentEvidence,
  type AIAgentStepActingOperationRbacCurrentEvidence,
} from "./agent-step-acting-operation-rbac-current-evidence-reader.js";
import type { AIAgentStepReadPort } from "./agent-step.js";
import type {
  AICapabilityCatalogMetadataByCodeReadPort,
} from "./capability-catalog-metadata.js";
import type {
  AIToolDefinitionCatalogMetadataReadPort,
} from "./tool-definition-catalog-metadata.js";
import type { AIToolSetMemberReadPort } from "./tool-set-member.js";
import type { AIToolSetReadPort } from "./tool-set.js";

type CommercialAllowResult = Extract<
  CommercialGuardResult,
  { readonly allowed: true }
>;

export interface AIAgentStepActingOperationCommercialCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentStepId: string;
  readonly approverRequestContext?: RequestContext;
}

export interface AIAgentStepActingOperationCommercialParentOnlyEvidence {
  readonly parent: AIAgentStepActingOperationRbacCurrentEvidence;
  readonly commercialResult?: never;
}

export interface AIAgentStepActingOperationCommercialToolEvidence {
  readonly parent: AIAgentStepActingOperationRbacCurrentEvidence;
  readonly commercialResult: CommercialAllowResult;
}

export type AIAgentStepActingOperationCommercialCurrentEvidence =
  | AIAgentStepActingOperationCommercialParentOnlyEvidence
  | AIAgentStepActingOperationCommercialToolEvidence;

/**
 * DD-458…DD-462: extend exact DD-457 evidence only when a canonical
 * OperationContract is already preserved for the TOOL step.
 *
 * The exact acting RequestContext + canonical OperationContract are passed to
 * the source-owned CommercialGuard once. A Commercial denial fails closed.
 * Success is necessary current Commercial evidence only; it is not full
 * authorization, approval satisfaction, limit reservation or execution
 * authority.
 */
export async function loadAIAgentStepActingOperationCommercialCurrentEvidence(
  input: AIAgentStepActingOperationCommercialCurrentEvidenceReadInput,
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
): Promise<AIAgentStepActingOperationCommercialCurrentEvidence | null> {
  const parent = await loadAIAgentStepActingOperationRbacCurrentEvidence(
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
    parent.parent.parent.parent.parent.parent.operationContract;
  if (operationContract === undefined) {
    return Object.freeze({ parent });
  }

  const commercialResult = await commercialGuard.validateCurrent({
    requestContext: input.requestContext,
    operation: operationContract,
  });
  if (!commercialResult.allowed) return null;

  return Object.freeze({
    parent,
    commercialResult,
  });
}
