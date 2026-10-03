import type { OperationContract } from "../api/operation-contract.js";
import type { OperationRegistry } from "../api/operation-registry.js";
import type { RequestContext } from "../context/contracts.js";
import type { AutomationDefinitionReadPort } from "./automation-definition.js";
import type { WorkflowDefinitionReadPort } from "./definition.js";
import type { AutomationRunReadPort } from "./automation-run.js";
import {
  loadAutomationRunDefinitionWorkflowCurrentEvidence,
  type AutomationRunDefinitionWorkflowCurrentEvidence,
} from "./automation-run-visible-definition-workflow-current-evidence-reader.js";

export interface AutomationRunDefinitionWorkflowOperationCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly automationRunId: string;
}

export interface AutomationRunDefinitionWorkflowOperationCurrentEvidence {
  readonly runDefinitionWorkflow: AutomationRunDefinitionWorkflowCurrentEvidence;
  readonly operationContract?: OperationContract;
}

/**
 * DD-383…DD-387: extend DD-382 current evidence with only exact optional
 * OperationContract registry evidence.
 *
 * OperationContract metadata remains raw evidence here. This boundary does not
 * interpret scope/permission/entitlement/idempotency/rate/audit/domain-service
 * compatibility and never dispatches the operation.
 */
export async function loadAutomationRunDefinitionWorkflowOperationCurrentEvidence(
  input: AutomationRunDefinitionWorkflowOperationCurrentEvidenceReadInput,
  runReader: AutomationRunReadPort,
  definitionReader: AutomationDefinitionReadPort,
  workflowDefinitionReader: WorkflowDefinitionReadPort,
  operationRegistry: OperationRegistry,
): Promise<AutomationRunDefinitionWorkflowOperationCurrentEvidence | null> {
  const runDefinitionWorkflow =
    await loadAutomationRunDefinitionWorkflowCurrentEvidence(
      {
        requestContext: input.requestContext,
        automationRunId: input.automationRunId,
      },
      runReader,
      definitionReader,
      workflowDefinitionReader,
    );
  if (runDefinitionWorkflow === null) return null;

  const operationContractId =
    runDefinitionWorkflow.runDefinition.definition.operationContractId;

  if (operationContractId === undefined) {
    return Object.freeze({
      runDefinitionWorkflow,
    });
  }

  const operationContract = operationRegistry.get(operationContractId);

  return Object.freeze({
    runDefinitionWorkflow,
    operationContract,
  });
}
