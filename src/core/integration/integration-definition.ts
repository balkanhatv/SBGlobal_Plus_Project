import type { JsonValue } from "../api/schema-registry.js";

export type IntegrationDefinitionOwnerScope =
  | "PLATFORM"
  | "TENANT"
  | "INDUSTRY";

export interface PersistedIntegrationDefinition {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly providerFamily: string;
  readonly capabilityCodes: readonly string[];
  readonly adapterContractVersion: string;
  readonly ownerScope: IntegrationDefinitionOwnerScope;
  readonly status: string;
  readonly dataTransferClass: string;
  readonly residencyMetadata: JsonValue;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IntegrationDefinitionReadPort {
  loadById(id: string): Promise<PersistedIntegrationDefinition | null>;
}
