import type { RequestContext } from "../context/contracts.js";

export type WorkflowInstanceScopeClass =
  | "TENANT_CORE"
  | "TENANT_INDUSTRY";

export type WorkflowLifecycleState =
  | "OPEN"
  | "WAITING"
  | "COMPLETED"
  | "CANCELLED";

export interface PersistedWorkflowInstance {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly scopeClass: WorkflowInstanceScopeClass;
  readonly workflowDefinitionId: string;
  readonly workflowDefinitionVersion: number;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly currentState: string;
  readonly lifecycleState: WorkflowLifecycleState;
  readonly rowVersion: string;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkflowInstanceReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly workflowInstanceId: string;
  }): Promise<PersistedWorkflowInstance | null>;
}
