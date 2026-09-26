import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type AIRAGChunkScopeClass =
  | "TENANT_CORE"
  | "TENANT_INDUSTRY";

export type AIRAGChunkSensitivityClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SENSITIVE_PERSONAL"
  | "REGULATED";

export interface PersistedAIRAGChunkMetadata {
  readonly id: string;
  readonly sourceId: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly scopeClass: AIRAGChunkScopeClass;
  readonly chunkOrdinal: number;
  readonly textRefOrEncryptedText: string;
  readonly contentHash: string;
  readonly tokenCount: number;
  readonly aclProjection: JsonValue;
  readonly sensitivityClass: AIRAGChunkSensitivityClass;
  readonly residencyRegion: string;
  readonly retentionClass: string;
  readonly embeddingModelId: string;
  readonly embeddingVersion: string;
  readonly metadata: JsonValue;
  readonly createdAt: string;
}

export interface AIRAGChunkMetadataReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly ragChunkId: string;
  }): Promise<PersistedAIRAGChunkMetadata | null>;
}
