import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";
import type { DocumentSensitivityClass } from "./access-candidate.js";

export type DocumentAIProvenanceJsonObject = Readonly<Record<string, JsonValue>>;

export interface PersistedDocumentAIGeneratedProvenance {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly sensitivityClass: DocumentSensitivityClass;
  readonly residencyRegion: string;
  readonly aiGenerated: boolean;
  readonly aiMediaRequestId?: string;
  readonly aiProviderId?: string;
  readonly aiModelId?: string;
  readonly aiProvenance?: DocumentAIProvenanceJsonObject;
  readonly aiModerationResult?: DocumentAIProvenanceJsonObject;
  readonly aiLicensingUsage?: DocumentAIProvenanceJsonObject;
}

export interface DocumentAIGeneratedProvenanceReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly documentId: string;
  }): Promise<PersistedDocumentAIGeneratedProvenance | null>;
}
