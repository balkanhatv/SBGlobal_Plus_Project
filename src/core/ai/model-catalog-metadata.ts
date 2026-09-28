import type { JsonValue } from "../api/schema-registry.js";

export type AIModelSensitivityCeiling =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SENSITIVE_PERSONAL"
  | "REGULATED";

export interface AIModelCatalogMetadata {
  readonly id: string;
  readonly providerId: string;
  readonly modelCode: string;
  readonly displayName: string;
  readonly capabilities: readonly (string | null)[];
  readonly contextWindowClass: string;
  readonly inputModalities: readonly (string | null)[];
  readonly outputModalities: readonly (string | null)[];
  readonly residencyRegions: readonly (string | null)[];
  readonly sensitivityCeiling: AIModelSensitivityCeiling;
  readonly costClass: string;
  readonly latencyClass: string;
  readonly status: string;
  readonly version: number;
  readonly metadata: JsonValue;
}

export interface AIModelCatalogMetadataReadPort {
  loadById(id: string): Promise<AIModelCatalogMetadata | null>;
}
