export type IntegrationCapabilityDirection =
  | "INBOUND"
  | "OUTBOUND"
  | "BIDIRECTIONAL";

export interface PersistedIntegrationCapability {
  readonly id: string;
  readonly integrationDefinitionId: string;
  readonly capabilityCode: string;
  readonly direction: IntegrationCapabilityDirection;
  readonly operationContractId?: string;
  readonly eventTypes: readonly string[];
  readonly dataClass: string;
  readonly idempotencyClass: string;
  readonly rateClass: string;
  readonly status: string;
}

export interface IntegrationCapabilityReadPort {
  loadExact(input: {
    readonly integrationDefinitionId: string;
    readonly capabilityCode: string;
  }): Promise<PersistedIntegrationCapability | null>;
}
