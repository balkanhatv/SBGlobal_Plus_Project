import type { RequestContext } from "../context/contracts.js";

export interface PersistedAITokenUsage {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly principalId?: string;
  readonly capabilityCode: string;
  readonly providerId: string;
  readonly modelId: string;
  readonly inputUnits: string;
  readonly outputUnits: string;
  readonly mediaUnits?: string;
  readonly occurredAt: string;
  readonly correlationId: string;
}

export interface AITokenUsageReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly tokenUsageId: string;
  }): Promise<PersistedAITokenUsage | null>;
}
