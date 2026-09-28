import type { RequestContext } from "../context/contracts.js";

export type AIAgentDefinitionOwnerScope =
  | "PLATFORM"
  | "TENANT"
  | "INDUSTRY";

export interface PersistedAIAgentDefinition {
  readonly id: string;
  readonly ownerScope: AIAgentDefinitionOwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly code: string;
  readonly objectiveClass: string;
  readonly allowedToolSetId: string;
  readonly maxRiskClass: string;
  readonly approvalPolicyId: string;
  readonly budgetPolicyId: string;
  readonly version: number;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AIAgentDefinitionReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly agentDefinitionId: string;
  }): Promise<PersistedAIAgentDefinition | null>;
}
