import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export interface PersistedAIMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly role: string;
  readonly contentRefOrEncryptedContent: string;
  readonly sourceRefs?: JsonValue;
  readonly modelRouteId?: string;
  readonly createdAt: string;
  readonly deletedAt?: string;
}

export interface AIMessageReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly messageId: string;
  }): Promise<PersistedAIMessage | null>;
}
