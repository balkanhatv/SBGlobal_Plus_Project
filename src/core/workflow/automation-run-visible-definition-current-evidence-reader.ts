import type { RequestContext } from "../context/contracts.js";
import type {
  AutomationDefinitionReadPort,
  PersistedAutomationDefinition,
} from "./automation-definition.js";
import type {
  AutomationRunReadPort,
  PersistedAutomationRun,
} from "./automation-run.js";
import {
  matchesAutomationRunDefinitionBindingFloors,
} from "./automation-run-definition-binding-floors.js";

export interface AutomationRunDefinitionCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly automationRunId: string;
}

export interface AutomationRunDefinitionCurrentEvidence {
  readonly run: PersistedAutomationRun;
  readonly definition: PersistedAutomationDefinition;
}

/**
 * DD-368…DD-372: compose only the already-governed AutomationRun raw reader,
 * same-RequestContext AutomationDefinition raw reader and DD-175 relationship
 * floor.
 *
 * This is deliberately not a cross-scope definition resolver. In particular,
 * it never switches a Tenant request to PLATFORM_GLOBAL to recover a hidden
 * PLATFORM AutomationDefinition.
 */
export async function loadAutomationRunDefinitionCurrentEvidence(
  input: AutomationRunDefinitionCurrentEvidenceReadInput,
  runReader: AutomationRunReadPort,
  definitionReader: AutomationDefinitionReadPort,
): Promise<AutomationRunDefinitionCurrentEvidence | null> {
  const run = await runReader.loadForContext({
    requestContext: input.requestContext,
    automationRunId: input.automationRunId,
  });
  if (run === null) return null;

  const definition = await definitionReader.loadForContext({
    requestContext: input.requestContext,
    automationDefinitionId: run.automationDefinitionId,
  });
  if (definition === null) return null;

  if (!matchesAutomationRunDefinitionBindingFloors(run, definition)) {
    return null;
  }

  return Object.freeze({
    run,
    definition,
  });
}
