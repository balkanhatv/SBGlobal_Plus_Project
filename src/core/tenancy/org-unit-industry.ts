import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type OrgUnitIndustryStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";

export interface PersistedOrgUnitIndustry {
  readonly tenantId: string;
  readonly orgUnitId: string;
  readonly industryContextId: string;
  readonly status: OrgUnitIndustryStatus;
  readonly config: JsonValue;
}

export interface OrgUnitIndustryReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly orgUnitId: string;
  }): Promise<PersistedOrgUnitIndustry | null>;
}
