import type { RequestContext } from "../context/contracts.js";
import type { AutomationDefinitionReadPort } from "./automation-definition.js";
import {
  matchesAutomationDefinitionWorkflowDefinitionContainmentFloors,
} from "./automation-definition-workflow-containment-floors.js";
import type {
  PersistedWorkflowDefinition,
  WorkflowDefinitionReadPort,
} from "./definition.js";
import type { AutomationRunReadPort } from "./automation-run.js";
import {
  loadAutomationRunDefinitionCurrentEvidence,
  type AutomationRunDefinitionCurrentEvidence,
} from "./automation-run-visible-definition-current-evidence-reader.js";

export interface AutomationRunDefinitionWorkflowCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly automationRunId: string;
}

export interface AutomationRunDefinitionWorkflowCurrentEvidence {
  readonly runDefinition: AutomationRunDefinitionCurrentEvidence;
  readonly workflowDefinition?: PersistedWorkflowDefinition;
}

/**
 * DD-378…DD-382: extend exact DD-372 AutomationRun/AutomationDefinition
 * current evidence with only the optional same-RequestContext
 * WorkflowDefinition containment evidence owned by DD-176.
 *
 * The AutomationDefinition is not re-read. A broader PLATFORM
 * WorkflowDefinition hidden from a Tenant RequestContext remains hidden.
 */
export async function loadAutomationRunDefinitionWorkflowCurrentEvidence(
  input: AutomationRunDefinitionWorkflowCurrentEvidenceReadInput,
  runReader: AutomationRunReadPort,
  definitionReader: AutomationDefinitionReadPort,
  workflowDefinitionReader: WorkflowDefinitionReadPort,
): Promise<AutomationRunDefinitionWorkflowCurrentEvidence | null> {
  const runDefinition = await loadAutomationRunDefinitionCurrentEvidence(
    {
      requestContext: input.requestContext,
      automationRunId: input.automationRunId,
    },
    runReader,
    definitionReader,
  );
  if (runDefinition === null) return null;

  const automationDefinition = runDefinition.definition;
  if (automationDefinition.workflowDefinitionId === undefined) {
    if (!matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automationDefinition,
      undefined,
    )) {
      return null;
    }

    return Object.freeze({
      runDefinition,
    });
  }

  const workflowDefinition = await workflowDefinitionReader.loadForContext({
    requestContext: input.requestContext,
    workflowDefinitionId: automationDefinition.workflowDefinitionId,
  });
  if (workflowDefinition === null) return null;

  if (!matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
    automationDefinition,
    workflowDefinition,
  )) {
    return null;
  }

  return Object.freeze({
    runDefinition,
    workflowDefinition,
  });
}
