import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type AIPromptTemplateOwnerScope =
  | "PLATFORM"
  | "TENANT"
  | "INDUSTRY";

export type AIPromptTemplateStatus =
  | "DRAFT"
  | "REVIEW"
  | "PUBLISHED"
  | "ACTIVE"
  | "RETIRED";

export interface PersistedAIPromptTemplate {
  readonly id: string;
  readonly ownerScope: AIPromptTemplateOwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly code: string;
  readonly version: number;
  readonly systemTemplate: string;
  readonly variableSchema: JsonValue;
  readonly groundingRequired: boolean;
  readonly allowedOverrideFields: readonly string[];
  readonly status: AIPromptTemplateStatus;
  readonly createdBy: string;
  readonly approvedBy?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AIPromptTemplateReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly promptTemplateId: string;
  }): Promise<PersistedAIPromptTemplate | null>;
}
