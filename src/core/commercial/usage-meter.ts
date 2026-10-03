import type { RequestContext } from "../context/contracts.js";

export interface PersistedUsageMeter {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly meterCode: string;
  readonly periodKey: string;
  readonly usedValue: string;
  readonly reservedValue: string;
  readonly version: string;
  readonly updatedAt: string;
}

export interface UsageMeterReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly usageMeterId: string;
  }): Promise<PersistedUsageMeter | null>;
}
