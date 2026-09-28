import type { RequestContext } from "../context/contracts.js";

export type NotificationScopeClass = "TENANT_CORE" | "TENANT_INDUSTRY";

export type NotificationChannel =
  | "EMAIL"
  | "SMS"
  | "WHATSAPP"
  | "PUSH"
  | "IN_APP";

export type NotificationDeliveryStatus =
  | "QUEUED"
  | "SENDING"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "SUPPRESSED"
  | "CANCELLED";

export interface PersistedNotificationDelivery {
  readonly id: string;
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly scopeClass: NotificationScopeClass;
  readonly templateId?: string;
  readonly templateVersion?: number;
  readonly recipientPrincipalId?: string;
  readonly recipientReference?: string;
  readonly channel: NotificationChannel;
  readonly tenantIntegrationId?: string;
  readonly correlationId: string;
  readonly sourceEventId?: string;
  readonly status: NotificationDeliveryStatus;
  readonly queuedAt: string;
  readonly sentAt?: string;
  readonly deliveredAt?: string;
  readonly lastErrorCode?: string;
  readonly rowVersion: number;
}

export interface NotificationDeliveryReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly notificationDeliveryId: string;
  }): Promise<PersistedNotificationDelivery | null>;
}
