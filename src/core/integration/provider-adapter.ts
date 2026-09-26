export interface PersistedProviderAdapter {
  readonly id: string;
  readonly definitionId: string;
  readonly adapterCode: string;
  readonly contractVersion: string;
  readonly authMethod: string;
  readonly timeoutClass: string;
  readonly retryClass: string;
  readonly circuitClass: string;
  readonly healthProbeClass: string;
  readonly normalizedErrorMapVersion: string;
  readonly status: string;
}

export interface ProviderAdapterReadPort {
  loadExact(input: {
    readonly definitionId: string;
    readonly adapterCode: string;
    readonly contractVersion: string;
  }): Promise<PersistedProviderAdapter | null>;
}
