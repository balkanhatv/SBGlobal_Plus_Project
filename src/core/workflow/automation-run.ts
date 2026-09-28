import type { RequestContext } from "../context/contracts.js";

export type AutomationRunStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export interface PersistedAutomationRun {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly automationDefinitionId: string;
  readonly triggerRef: string;
  readonly idempotencyKeyHash: string;
  readonly status: AutomationRunStatus;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly correlationId: string;
  readonly lastErrorCode?: string;
}

export interface AutomationRunReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly automationRunId: string;
  }): Promise<PersistedAutomationRun | null>;
}
