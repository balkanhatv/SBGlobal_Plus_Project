import type { RequestContext } from "../context/contracts.js";

export type WorkflowTaskType = "APPROVAL" | "REVIEW" | "ACTION";
export type WorkflowTaskSubjectType = "PRINCIPAL" | "ROLE" | "ORG_UNIT";
export type WorkflowTaskState =
  | "PENDING"
  | "CLAIMED"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export interface PersistedWorkflowTask {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly workflowInstanceId: string;
  readonly taskType: WorkflowTaskType;
  readonly assignedSubjectType: WorkflowTaskSubjectType;
  readonly assignedSubjectId: string;
  readonly permissionCode: string;
  readonly state: WorkflowTaskState;
  readonly dueAt?: string;
  readonly claimedBy?: string;
  readonly completedBy?: string;
  readonly completedAt?: string;
  readonly rowVersion: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkflowTaskReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly workflowTaskId: string;
  }): Promise<PersistedWorkflowTask | null>;
}
