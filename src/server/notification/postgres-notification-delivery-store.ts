import type { RequestContext } from "../../core/context/contracts.js";
import type {
  NotificationChannel,
  NotificationDeliveryReadPort,
  NotificationDeliveryStatus,
  NotificationScopeClass,
  PersistedNotificationDelivery,
} from "../../core/notification/delivery.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface NotificationDeliveryRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly scope_class: string;
  readonly template_id: string | null;
  readonly template_version: string | number | null;
  readonly recipient_principal_id: string | null;
  readonly recipient_reference: string | null;
  readonly channel: string;
  readonly tenant_integration_id: string | null;
  readonly correlation_id: string;
  readonly source_event_id: string | null;
  readonly status: string;
  readonly queued_at: string | Date;
  readonly sent_at: string | Date | null;
  readonly delivered_at: string | Date | null;
  readonly last_error_code: string | null;
  readonly row_version: string | number;
}

export class NotificationDeliveryPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationDeliveryPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CHANNELS = new Set<NotificationChannel>([
  "EMAIL",
  "SMS",
  "WHATSAPP",
  "PUSH",
  "IN_APP",
]);

const STATUSES = new Set<NotificationDeliveryStatus>([
  "QUEUED",
  "SENDING",
  "SENT",
  "DELIVERED",
  "FAILED",
  "SUPPRESSED",
  "CANCELLED",
]);

function invalid(message: string): never {
  throw new NotificationDeliveryPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted NotificationDelivery ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted NotificationDelivery ${field} is invalid.`);
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return textValue(value, field);
}

function positiveInteger(
  value: string | number,
  field: string,
): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted NotificationDelivery ${field} is invalid.`);
  }
  return parsed;
}

function optionalPositiveInteger(
  value: string | number | null,
  field: string,
): number | undefined {
  if (value === null) return undefined;
  return positiveInteger(value, field);
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted NotificationDelivery ${field} is invalid.`);
  }
  return date.toISOString();
}

function optionalTimestamp(
  value: string | Date | null,
  field: string,
): string | undefined {
  if (value === null) return undefined;
  return timestamp(value, field);
}

function scope(value: string): NotificationScopeClass {
  if (value !== "TENANT_CORE" && value !== "TENANT_INDUSTRY") {
    invalid("Persisted NotificationDelivery scope is invalid.");
  }
  return value;
}

function channel(value: string): NotificationChannel {
  if (!CHANNELS.has(value as NotificationChannel)) {
    invalid("Persisted NotificationDelivery channel is invalid.");
  }
  return value as NotificationChannel;
}

function status(value: string): NotificationDeliveryStatus {
  if (!STATUSES.has(value as NotificationDeliveryStatus)) {
    invalid("Persisted NotificationDelivery status is invalid.");
  }
  return value as NotificationDeliveryStatus;
}

function assertContext(context: RequestContext): void {
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !context.principalId
    || !UUID_PATTERN.test(context.tenantId)
    || !UUID_PATTERN.test(context.principalId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("NotificationDelivery reads require a resolved single-Tenant context.");
  }
}

function parseRow(row: NotificationDeliveryRow): PersistedNotificationDelivery {
  const parsedScope = scope(row.scope_class);
  const industryContextId = optionalUuid(
    row.industry_context_id,
    "Industry Context id",
  );

  if ((parsedScope === "TENANT_CORE" && industryContextId)
    || (parsedScope === "TENANT_INDUSTRY" && !industryContextId)) {
    invalid("Persisted NotificationDelivery ownership shape is invalid.");
  }

  const templateId = optionalUuid(row.template_id, "template id");
  const templateVersion = optionalPositiveInteger(
    row.template_version,
    "template version",
  );
  if ((templateId === undefined) !== (templateVersion === undefined)) {
    invalid("Persisted NotificationDelivery template binding is invalid.");
  }

  const recipientPrincipalId = optionalUuid(
    row.recipient_principal_id,
    "recipient principal id",
  );
  const recipientReference = optionalText(
    row.recipient_reference,
    "recipient reference",
  );
  if (!recipientPrincipalId && !recipientReference) {
    invalid("Persisted NotificationDelivery recipient is invalid.");
  }

  const queuedAt = timestamp(row.queued_at, "queuedAt");
  const sentAt = optionalTimestamp(row.sent_at, "sentAt");
  const deliveredAt = optionalTimestamp(row.delivered_at, "deliveredAt");
  if (sentAt && Date.parse(sentAt) < Date.parse(queuedAt)) {
    invalid("Persisted NotificationDelivery sentAt is invalid.");
  }
  if (deliveredAt && !sentAt) {
    invalid("Persisted NotificationDelivery deliveredAt is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? {industryContextId} : {}),
    scopeClass: parsedScope,
    ...(templateId ? {templateId} : {}),
    ...(templateVersion !== undefined ? {templateVersion} : {}),
    ...(recipientPrincipalId ? {recipientPrincipalId} : {}),
    ...(recipientReference ? {recipientReference} : {}),
    channel: channel(row.channel),
    ...(row.tenant_integration_id !== null
      ? {tenantIntegrationId: uuid(row.tenant_integration_id, "TenantIntegration id")}
      : {}),
    correlationId: uuid(row.correlation_id, "correlation id"),
    ...(row.source_event_id !== null
      ? {sourceEventId: uuid(row.source_event_id, "source event id")}
      : {}),
    status: status(row.status),
    queuedAt,
    ...(sentAt ? {sentAt} : {}),
    ...(deliveredAt ? {deliveredAt} : {}),
    ...(row.last_error_code !== null
      ? {lastErrorCode: optionalText(row.last_error_code, "last error code")}
      : {}),
    rowVersion: positiveInteger(row.row_version, "row version"),
  });
}

async function readDelivery(
  transaction: SqlTransaction,
  notificationDeliveryId: string,
): Promise<PersistedNotificationDelivery | null> {
  const result = await transaction.query<NotificationDeliveryRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            scope_class,
            template_id,
            template_version,
            recipient_principal_id,
            recipient_reference,
            channel::text,
            tenant_integration_id,
            correlation_id,
            source_event_id,
            status::text,
            queued_at,
            sent_at,
            delivered_at,
            last_error_code,
            row_version
       FROM core_notification.notification_delivery
      WHERE id=$1::uuid`,
    [notificationDeliveryId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted NotificationDelivery is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresNotificationDeliveryStore
implements NotificationDeliveryReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly notificationDeliveryId: string;
  }): Promise<PersistedNotificationDelivery | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.notificationDeliveryId)) {
      invalid("NotificationDelivery id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readDelivery(transaction, input.notificationDeliveryId),
    );
  }
}
