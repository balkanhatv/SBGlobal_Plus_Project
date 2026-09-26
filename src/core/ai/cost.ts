import type { RequestContext } from "../context/contracts.js";

export interface PersistedAICost {
  readonly usageId: string;
  readonly costCurrency: string;
  readonly estimatedMinorUnits: string;
  readonly providerRateVersion: string;
  readonly billableClass: string;
  readonly finalizedAt?: string;
}

export interface AICostReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly usageId: string;
  }): Promise<PersistedAICost | null>;
}
