import type { RequestContext } from "../context/contracts.js";
import type {
  AutomationDefinitionReadPort,
  PersistedAutomationDefinition,
} from "./automation-definition.js";
import {
  matchesAutomationDefinitionWorkflowDefinitionContainmentFloors,
} from "./automation-definition-workflow-containment-floors.js";
import type {
  PersistedWorkflowDefinition,
  WorkflowDefinitionReadPort,
} from "./definition.js";

export interface AutomationDefinitionWorkflowContainmentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly automationDefinitionId: string;
}

export interface AutomationDefinitionWorkflowContainmentEvidence {
  readonly automationDefinition: PersistedAutomationDefinition;
  readonly workflowDefinition?: PersistedWorkflowDefinition;
}

/**
 * DD-373…DD-377: compose only the existing AutomationDefinition raw reader,
 * optional same-RequestContext WorkflowDefinition raw reader and DD-176
 * containment floor.
 *
 * This is deliberately not a cross-scope WorkflowDefinition resolver.
 * A broader PLATFORM parent hidden from a Tenant RequestContext remains hidden.
 */
export async function loadAutomationDefinitionWorkflowContainmentEvidence(
  input: AutomationDefinitionWorkflowContainmentEvidenceReadInput,
  automationDefinitionReader: AutomationDefinitionReadPort,
  workflowDefinitionReader: WorkflowDefinitionReadPort,
): Promise<AutomationDefinitionWorkflowContainmentEvidence | null> {
  const automationDefinition = await automationDefinitionReader.loadForContext({
    requestContext: input.requestContext,
    automationDefinitionId: input.automationDefinitionId,
  });
  if (automationDefinition === null) return null;

  if (automationDefinition.workflowDefinitionId === undefined) {
    if (!matchesAutomationDefinitionWorkflowDefinitionContainmentFloors(
      automationDefinition,
      undefined,
    )) {
      return null;
    }

    return Object.freeze({
      automationDefinition,
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
    automationDefinition,
    workflowDefinition,
  });
}
