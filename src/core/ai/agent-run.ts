import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type AIAgentRunStatus =
  | "PENDING"
  | "RUNNING"
  | "WAITING_APPROVAL"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export interface PersistedAIAgentRun {
  readonly id: string;
  readonly agentDefinitionId: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly actingPrincipalId: string;
  readonly membershipId?: string;
  readonly entitlementSnapshotVersion: string;
  readonly permissionVersion: string;
  readonly requestedResourceScope: JsonValue;
  readonly status: AIAgentRunStatus;
  readonly stepBudgetClass: string;
  readonly tokenBudgetClass: string;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly correlationId: string;
}

export interface AIAgentRunReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly agentRunId: string;
  }): Promise<PersistedAIAgentRun | null>;
}
