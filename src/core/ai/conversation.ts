import type { RequestContext } from "../context/contracts.js";

export type AIConversationScopeClass = "TENANT_CORE" | "TENANT_INDUSTRY";

export type AIConversationSensitivityClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SENSITIVE_PERSONAL"
  | "REGULATED";

export interface PersistedAIConversation {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly scopeClass: AIConversationScopeClass;
  readonly ownerPrincipalId: string;
  readonly assistantDefinitionId?: string;
  readonly sensitivityClass: AIConversationSensitivityClass;
  readonly retentionClass: string;
  readonly status: string;
  readonly createdAt: string;
  readonly lastActivityAt: string;
}

export interface AIConversationReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly conversationId: string;
  }): Promise<PersistedAIConversation | null>;
}
