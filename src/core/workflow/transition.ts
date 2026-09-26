import type { RequestContext } from "../context/contracts.js";

export interface PersistedWorkflowTransition {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly workflowInstanceId: string;
  readonly fromState: string;
  readonly actionCode: string;
  readonly toState: string;
  readonly actorPrincipalId: string;
  readonly reasonCode?: string;
  readonly expectedInstanceVersion: string;
  readonly resultingInstanceVersion: string;
  readonly occurredAt: string;
  readonly correlationId: string;
}

export interface WorkflowTransitionReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly workflowTransitionId: string;
  }): Promise<PersistedWorkflowTransition | null>;
}
