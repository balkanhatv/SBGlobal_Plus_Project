import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type WorkflowDefinitionOwnerScope =
  | "PLATFORM"
  | "TENANT"
  | "INDUSTRY";

export type WorkflowDefinitionStatus =
  | "DRAFT"
  | "REVIEW"
  | "PUBLISHED"
  | "ACTIVE"
  | "RETIRED";

export interface PersistedWorkflowDefinition {
  readonly id: string;
  readonly ownerScope: WorkflowDefinitionOwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly code: string;
  readonly version: number;
  readonly status: WorkflowDefinitionStatus;
  readonly schemaVersion: number;
  readonly stateMachine: JsonValue;
  readonly approvalPolicy: JsonValue;
  readonly ruleRefs: readonly string[];
  readonly createdBy: string;
  readonly approvedBy?: string;
  readonly effectiveFrom?: string;
  readonly effectiveTo?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkflowDefinitionReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly workflowDefinitionId: string;
  }): Promise<PersistedWorkflowDefinition | null>;
}
