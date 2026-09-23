import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type TenantCountryPackActivationStatus =
  | "PENDING"
  | "ACTIVE"
  | "DISABLED";

export interface PersistedTenantCountryPackActivation {
  readonly id: string;
  readonly tenantId: string;
  readonly countryPackId: string;
  readonly status: TenantCountryPackActivationStatus;
  readonly configOverride: JsonValue;
  readonly activatedAt?: string;
  readonly disabledAt?: string;
  readonly rowVersion: string;
}

export interface TenantCountryPackActivationReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly activationId: string;
  }): Promise<PersistedTenantCountryPackActivation | null>;
}
