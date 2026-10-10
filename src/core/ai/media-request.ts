import type { RequestContext } from "../context/contracts.js";

export type AIMediaType =
  | "IMAGE"
  | "SVG"
  | "ICON"
  | "INFOGRAPHIC"
  | "PRESENTATION"
  | "VIDEO"
  | "ANIMATION"
  | "VOICE"
  | "AUDIO";

export type AIMediaSensitivityClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SENSITIVE_PERSONAL"
  | "REGULATED";

export interface PersistedAIMediaRequest {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly principalId: string;
  readonly capabilityCode: string;
  readonly mediaType: AIMediaType;
  readonly promptTemplateId?: string;
  readonly promptVersion?: number;
  readonly brandConfigVersion?: string;
  readonly localizationProfileRef?: string;
  readonly inputDocumentRefs: readonly string[];
  readonly sensitivityClass: AIMediaSensitivityClass;
  readonly residencyRequirement: string;
  readonly moderationPolicyRef: string;
  readonly status: string;
  readonly createdAt: string;
  readonly completedAt?: string;
}

export interface AIMediaRequestReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly mediaRequestId: string;
  }): Promise<PersistedAIMediaRequest | null>;
}
