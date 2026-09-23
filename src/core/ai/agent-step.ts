import type { RequestContext } from "../context/contracts.js";

export type AIAgentStepType =
  | "PLAN"
  | "RAG"
  | "TOOL"
  | "APPROVAL"
  | "INFERENCE";

export type AIAgentStepStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "SKIPPED"
  | "CANCELLED";

export interface PersistedAIAgentStep {
  readonly id: string;
  readonly runId: string;
  readonly ordinal: number;
  readonly stepType: AIAgentStepType;
  readonly inputRef?: string;
  readonly outputRef?: string;
  readonly toolBindingId?: string;
  readonly approvalId?: string;
  readonly status: AIAgentStepStatus;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly auditRef?: string;
}

export interface AIAgentStepReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly agentStepId: string;
  }): Promise<PersistedAIAgentStep | null>;
}
