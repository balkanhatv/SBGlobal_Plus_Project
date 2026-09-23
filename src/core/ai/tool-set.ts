import type { RequestContext } from "../context/contracts.js";

export type AIToolSetOwnerScope =
  | "PLATFORM"
  | "TENANT"
  | "INDUSTRY";

export type AIToolSetStatus =
  | "DRAFT"
  | "REVIEW"
  | "PUBLISHED"
  | "ACTIVE"
  | "RETIRED";

export interface PersistedAIToolSet {
  readonly id: string;
  readonly ownerScope: AIToolSetOwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly code: string;
  readonly version: number;
  readonly status: AIToolSetStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AIToolSetReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly toolSetId: string;
  }): Promise<PersistedAIToolSet | null>;
}
