import type { RequestContext } from "../context/contracts.js";

export type AIRAGSourceScopeClass =
  | "TENANT_CORE"
  | "TENANT_INDUSTRY";

export type AIRAGSourceSensitivityClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SENSITIVE_PERSONAL"
  | "REGULATED";

export interface PersistedAIRAGSource {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly scopeClass: AIRAGSourceScopeClass;
  readonly sourceModule: string;
  readonly managementSystemId?: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly documentId?: string;
  readonly documentVersion?: number;
  readonly sensitivityClass: AIRAGSourceSensitivityClass;
  readonly residencyRegion: string;
  readonly retentionClass: string;
  readonly aclPolicyRef?: string;
  readonly status: string;
  readonly sourceVersion: string;
  readonly chunkingPolicyVersion: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AIRAGSourceReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly ragSourceId: string;
  }): Promise<PersistedAIRAGSource | null>;
}
