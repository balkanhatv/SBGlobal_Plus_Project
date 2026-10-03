import type { RequestContext } from "../context/contracts.js";

export interface PersistedSyncCursor {
  readonly id: string;
  readonly tenantIntegrationId: string;
  readonly capabilityCode: string;
  readonly industryContextId?: string;
  readonly cursorEncryptedOrOpaque: string;
  readonly watermarkTime?: string;
  readonly sourceVersion?: string;
  readonly updatedAt: string;
}

export interface SyncCursorReadPort {
  loadExact(input: {
    readonly requestContext: RequestContext;
    readonly tenantIntegrationId: string;
    readonly capabilityCode: string;
    readonly industryContextId?: string;
  }): Promise<PersistedSyncCursor | null>;
}
