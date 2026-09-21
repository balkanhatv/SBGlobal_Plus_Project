import type { JsonObject } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";

export type WebhookSubscriptionStatus =
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "PAUSED"
  | "REVOKED";

export interface WebhookSubscription {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly endpointUrl: string;
  readonly status: WebhookSubscriptionStatus;
  readonly secretVersion: number;
  readonly eventFilterJson: JsonObject;
  readonly allowedIndustryContextIds: readonly string[];
  readonly permissionProfileId?: string;
  readonly createdBy: string;
  readonly verifiedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WebhookSubscriptionReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly subscriptionId: string;
  }): Promise<WebhookSubscription | null>;
}
