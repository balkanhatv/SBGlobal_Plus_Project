import type { RequestContext } from "../context/contracts.js";

export interface NotificationDeliveryAttempt {
  readonly id: string;
  readonly deliveryId: string;
  readonly attemptNo: number;
  readonly providerMessageRef?: string;
  readonly normalizedStatus: string;
  readonly normalizedErrorCode?: string;
  readonly startedAt: string;
  readonly completedAt?: string;
}

export interface NotificationDeliveryAttemptReadPort {
  loadForDelivery(input: {
    readonly requestContext: RequestContext;
    readonly notificationDeliveryId: string;
  }): Promise<readonly NotificationDeliveryAttempt[]>;
}
