import type { RequestContext } from "../context/contracts.js";

export interface WebhookDeliveryEvidence {
  readonly id: string;
  readonly subscriptionId: string;
  readonly eventId: string;
  readonly attemptNo: number;
  readonly endpointSnapshot: string;
  readonly payloadDigest: string;
  readonly status: string;
  readonly httpStatus?: number;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly nextAttemptAt?: string;
  readonly errorClass?: string;
  readonly correlationId: string;
  readonly createdAt: string;
}

export interface WebhookDeliveryReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly deliveryId: string;
  }): Promise<WebhookDeliveryEvidence | null>;
}
