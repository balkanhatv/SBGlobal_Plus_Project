import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";
import type { NotificationChannel } from "./delivery.js";

export type NotificationTemplateOwnerScope =
  | "PLATFORM"
  | "TENANT"
  | "INDUSTRY";

export type NotificationTemplateStatus =
  | "DRAFT"
  | "REVIEW"
  | "PUBLISHED"
  | "ACTIVE"
  | "RETIRED";

export interface PersistedNotificationTemplate {
  readonly id: string;
  readonly ownerScope: NotificationTemplateOwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly code: string;
  readonly channel: NotificationChannel;
  readonly localeCode: string;
  readonly version: number;
  readonly status: NotificationTemplateStatus;
  readonly subjectTemplate?: string;
  readonly bodyTemplate: string;
  readonly safePreviewTemplate?: string;
  readonly variableSchema: JsonValue;
  readonly createdBy: string;
  readonly approvedBy?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NotificationTemplateReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly notificationTemplateId: string;
  }): Promise<PersistedNotificationTemplate | null>;
}
