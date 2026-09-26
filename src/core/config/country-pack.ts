import type { JsonValue } from "../api/schema-registry.js";

export type CountryPackStatus =
  | "DRAFT"
  | "REVIEW"
  | "PUBLISHED"
  | "ACTIVE"
  | "RETIRED";

export interface PersistedCountryPack {
  readonly id: string;
  readonly countryCode: string;
  readonly code: string;
  readonly version: number;
  readonly status: CountryPackStatus;
  readonly localeCodes: readonly (string | null)[];
  readonly defaultCurrencyCode?: string;
  readonly defaultTimezone?: string;
  readonly defaultDateFormat?: string;
  readonly addressSchema?: JsonValue;
  readonly phoneSchema?: JsonValue;
  readonly referenceBundleRef?: string;
  readonly metadata: JsonValue;
  readonly createdAt: string;
  readonly approvedBy?: string;
  readonly effectiveFrom?: string;
}

export interface CountryPackReadPort {
  loadById(input: {
    readonly countryPackId: string;
  }): Promise<PersistedCountryPack | null>;
}
