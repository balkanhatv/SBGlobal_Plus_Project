import type { RequestContext } from "../context/contracts.js";

export interface PersistedAIIndustryConfig {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId: string;
  readonly enabled: boolean;
  readonly allowedCapabilities: readonly string[];
  readonly allowedProviderIds: readonly string[];
  readonly allowedModelIds: readonly string[];
  readonly domainPromptSetId?: string;
  readonly countryPackRefs: readonly string[];
  readonly localizationProfileRef?: string;
  readonly version: number;
  readonly updatedAt: string;
}

export interface AIIndustryConfigReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly industryConfigId: string;
  }): Promise<PersistedAIIndustryConfig | null>;
}
