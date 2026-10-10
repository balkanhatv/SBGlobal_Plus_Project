import type { RequestContext } from "../context/contracts.js";

export type AIMemoryClass =
  | "SESSION"
  | "USER_PREFERENCE"
  | "TENANT_KNOWLEDGE"
  | "INDUSTRY_KNOWLEDGE"
  | "WORKING_CONTEXT";

export type AIMemoryStatus =
  | "ACTIVE"
  | "SUPERSEDED"
  | "ERASED"
  | "EXPIRED";

export type AIMemorySensitivityClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SENSITIVE_PERSONAL"
  | "REGULATED";

export interface PersistedAIMemoryRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly principalId?: string;
  readonly assistantDefinitionId?: string;
  readonly memoryClass: AIMemoryClass;
  readonly contentRefOrEncryptedContent: string;
  readonly sourceRef?: string;
  readonly sensitivityClass: AIMemorySensitivityClass;
  readonly retentionClass: string;
  readonly aclPolicyRef?: string;
  readonly status: AIMemoryStatus;
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly supersedesId?: string;
}

export interface AIMemoryRecordReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly memoryRecordId: string;
  }): Promise<PersistedAIMemoryRecord | null>;
}
