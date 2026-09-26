import type { JsonValue } from "../api/schema-registry.js";

export interface AIProviderCatalogMetadata {
  readonly id: string;
  readonly code: string;
  readonly status: string;
  readonly adapterType: string;
  readonly supportedRegions: readonly (string | null)[];
  readonly supportedCapabilities: readonly (string | null)[];
  readonly securityClass: string;
  readonly residencyMetadata: JsonValue;
  readonly healthState: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AIProviderCatalogMetadataReadPort {
  loadById(id: string): Promise<AIProviderCatalogMetadata | null>;
}
