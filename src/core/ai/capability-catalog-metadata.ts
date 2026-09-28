export type AICapabilityCategory =
  | "CHAT"
  | "EMBEDDING"
  | "EXTRACTION"
  | "CLASSIFICATION"
  | "RERANK"
  | "OCR"
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "PRESENTATION"
  | "DOCUMENT_INTELLIGENCE"
  | "AGENT"
  | "TOOL"
  | "API";

export interface AICapabilityCatalogMetadata {
  readonly id: string;
  readonly code: string;
  readonly category: AICapabilityCategory;
  readonly requiredEntitlement: string | null;
  readonly defaultPolicyClass: string;
  readonly schemaVersion: number;
  readonly status: string;
}

export interface AICapabilityCatalogMetadataReadPort {
  loadById(id: string): Promise<AICapabilityCatalogMetadata | null>;
}
