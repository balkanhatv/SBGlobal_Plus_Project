import type { RequestContext } from "../context/contracts.js";

export type AIAgentApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export interface PersistedAIAgentApproval {
  readonly id: string;
  readonly runId: string;
  readonly stepId: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly requestedByAgent: boolean;
  readonly approvalType: string;
  readonly requiredPermission: string;
  readonly approverPrincipalId?: string;
  readonly status: AIAgentApprovalStatus;
  readonly requestSummarySafe: string;
  readonly approvedAt?: string;
  readonly reason?: string;
  readonly correlationId: string;
  readonly createdAt: string;
}

export interface AIAgentApprovalReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly agentApprovalId: string;
  }): Promise<PersistedAIAgentApproval | null>;
}
