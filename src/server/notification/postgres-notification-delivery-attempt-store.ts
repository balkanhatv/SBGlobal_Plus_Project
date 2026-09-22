import type { RequestContext } from "../../core/context/contracts.js";
import type {
  NotificationDeliveryAttempt,
  NotificationDeliveryAttemptReadPort,
} from "../../core/notification/delivery-attempt.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface NotificationDeliveryAttemptRow {
  readonly id: string;
  readonly delivery_id: string;
  readonly attempt_no: string | number;
  readonly provider_message_ref: string | null;
  readonly normalized_status: string;
  readonly normalized_error_code: string | null;
  readonly started_at: string | Date;
  readonly completed_at: string | Date | null;
}

export class NotificationDeliveryAttemptPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationDeliveryAttemptPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new NotificationDeliveryAttemptPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted NotificationDeliveryAttempt ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted NotificationDeliveryAttempt ${field} is invalid.`);
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return textValue(value, field);
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted NotificationDeliveryAttempt ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted NotificationDeliveryAttempt ${field} is invalid.`);
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

function assertContext(context: RequestContext): void {
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !context.principalId
    || !UUID_PATTERN.test(context.tenantId)
    || !UUID_PATTERN.test(context.principalId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("NotificationDeliveryAttempt reads require a resolved single-Tenant context.");
  }
}

function parseRow(row: NotificationDeliveryAttemptRow): NotificationDeliveryAttempt {
  const startedAt = timestamp(row.started_at, "startedAt");
  const completedAt = optionalTimestamp(row.completed_at, "completedAt");
  if (completedAt && Date.parse(completedAt) < Date.parse(startedAt)) {
    invalid("Persisted NotificationDeliveryAttempt completedAt is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    deliveryId: uuid(row.delivery_id, "delivery id"),
    attemptNo: positiveInteger(row.attempt_no, "attempt number"),
    ...(row.provider_message_ref !== null
      ? {providerMessageRef: optionalText(row.provider_message_ref, "provider message reference")}
      : {}),
    normalizedStatus: textValue(row.normalized_status, "normalized status"),
    ...(row.normalized_error_code !== null
      ? {normalizedErrorCode: optionalText(row.normalized_error_code, "normalized error code")}
      : {}),
    startedAt,
    ...(completedAt ? {completedAt} : {}),
  });
}

async function readAttempts(
  transaction: SqlTransaction,
  notificationDeliveryId: string,
): Promise<readonly NotificationDeliveryAttempt[]> {
  const result = await transaction.query<NotificationDeliveryAttemptRow>(
    `SELECT id,
            delivery_id,
            attempt_no,
            provider_message_ref,
            normalized_status,
            normalized_error_code,
            started_at,
            completed_at
       FROM core_notification.notification_delivery_attempt
      WHERE delivery_id=$1::uuid
      ORDER BY attempt_no ASC, id ASC`,
    [notificationDeliveryId],
  );

  return Object.freeze(result.rows.map(parseRow));
}

export class PostgresNotificationDeliveryAttemptStore
implements NotificationDeliveryAttemptReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForDelivery(input: {
    readonly requestContext: RequestContext;
    readonly notificationDeliveryId: string;
  }): Promise<readonly NotificationDeliveryAttempt[]> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.notificationDeliveryId)) {
      invalid("NotificationDelivery id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readAttempts(transaction, input.notificationDeliveryId),
    );
  }
}
