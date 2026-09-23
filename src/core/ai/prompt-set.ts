import type { RequestContext } from "../context/contracts.js";

export type AIPromptSetOwnerScope =
  | "PLATFORM"
  | "TENANT"
  | "INDUSTRY";

export type AIPromptSetStatus =
  | "DRAFT"
  | "REVIEW"
  | "PUBLISHED"
  | "ACTIVE"
  | "RETIRED";

export interface PersistedAIPromptSet {
  readonly id: string;
  readonly ownerScope: AIPromptSetOwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly code: string;
  readonly version: number;
  readonly status: AIPromptSetStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AIPromptSetReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly promptSetId: string;
  }): Promise<PersistedAIPromptSet | null>;
}
