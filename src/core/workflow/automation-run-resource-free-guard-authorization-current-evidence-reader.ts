import type { OperationRegistry } from "../api/operation-registry.js";
import type { RequestContext } from "../context/contracts.js";
import type { GuardResult } from "../authorization/guard-pipeline.js";
import type { AutomationDefinitionReadPort } from "./automation-definition.js";
import type { WorkflowDefinitionReadPort } from "./definition.js";
import type { AutomationRunReadPort } from "./automation-run.js";
import {
  loadAutomationRunDefinitionWorkflowOperationCurrentEvidence,
  type AutomationRunDefinitionWorkflowOperationCurrentEvidence,
} from "./automation-run-visible-definition-workflow-operation-current-evidence-reader.js";

export interface AutomationRunResourceFreeGuardAuthorizationPort {
  authorize(input: {
    readonly requestContext: RequestContext;
    readonly operation: NonNullable<
      AutomationRunDefinitionWorkflowOperationCurrentEvidence["operationContract"]
    >;
    readonly resourceReference?: Readonly<Record<string, unknown>>;
  }): Promise<GuardResult>;
}

export interface AutomationRunResourceFreeGuardAuthorizationCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly automationRunId: string;
}

export interface AutomationRunResourceFreeGuardAuthorizationParentOnlyEvidence {
  readonly parent: AutomationRunDefinitionWorkflowOperationCurrentEvidence;
  readonly guardResult?: never;
}

export interface AutomationRunResourceFreeGuardAuthorizationEvidence {
  readonly parent: AutomationRunDefinitionWorkflowOperationCurrentEvidence;
  readonly guardResult: GuardResult;
}

export type AutomationRunResourceFreeGuardAuthorizationCurrentEvidence =
  | AutomationRunResourceFreeGuardAuthorizationParentOnlyEvidence
  | AutomationRunResourceFreeGuardAuthorizationEvidence;

/**
 * DD-468…DD-472: extend exact DD-387 evidence only for canonical operations
 * that require no resource resolver.
 *
 * Missing operations and resource-resolved operations remain frozen parent-only
 * evidence and perform zero GuardPipeline calls. Resource-free operations are
 * authorized exactly once with the exact supplied RequestContext and canonical
 * OperationContract, with no resourceReference.
 *
 * GuardResult remains bounded protected-operation authorization evidence only;
 * no trigger/state-machine, transition, dispatch or execution authority is added.
 */
export async function loadAutomationRunResourceFreeGuardAuthorizationCurrentEvidence(
  input: AutomationRunResourceFreeGuardAuthorizationCurrentEvidenceReadInput,
  runReader: AutomationRunReadPort,
  definitionReader: AutomationDefinitionReadPort,
  workflowDefinitionReader: WorkflowDefinitionReadPort,
  operationRegistry: OperationRegistry,
  guardAuthorization: AutomationRunResourceFreeGuardAuthorizationPort,
): Promise<AutomationRunResourceFreeGuardAuthorizationCurrentEvidence | null> {
  const parent = await loadAutomationRunDefinitionWorkflowOperationCurrentEvidence(
    input,
    runReader,
    definitionReader,
    workflowDefinitionReader,
    operationRegistry,
  );
  if (parent === null) return null;

  const operationContract = parent.operationContract;
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
