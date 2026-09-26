import type {
  WebhookDeliveryEvidence,
  WebhookDeliveryReadPort,
} from "../../core/integration/webhook-delivery.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface WebhookDeliveryRow {
  readonly id: string;
  readonly subscription_id: string;
  readonly event_id: string;
  readonly attempt_no: number | string;
  readonly endpoint_snapshot: string;
  readonly payload_digest: string;
  readonly status: string;
  readonly http_status: number | string | null;
  readonly started_at: string | Date;
  readonly completed_at: string | Date | null;
  readonly next_attempt_at: string | Date | null;
  readonly error_class: string | null;
  readonly correlation_id: string;
  readonly created_at: string | Date;
}

export class WebhookDeliveryPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookDeliveryPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new WebhookDeliveryPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted Webhook Delivery ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted Webhook Delivery ${field} is invalid.`);
  }
  return value;
}

function positiveInteger(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted Webhook Delivery ${field} is invalid.`);
  }
  return parsed;
}

function integer(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    invalid(`Persisted Webhook Delivery ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted Webhook Delivery ${field} is invalid.`);
  }
  return date.toISOString();
}

function assertTenantContext(context: RequestContext): void {
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !context.principalId
    || !UUID_PATTERN.test(context.tenantId)
    || !UUID_PATTERN.test(context.principalId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("Webhook Delivery reads require a resolved single-Tenant context.");
  }
}

function parseRow(row: WebhookDeliveryRow): WebhookDeliveryEvidence {
  const startedAt = timestamp(row.started_at, "startedAt");
  const completedAt = row.completed_at === null
    ? undefined
    : timestamp(row.completed_at, "completedAt");

  if (completedAt && Date.parse(completedAt) < Date.parse(startedAt)) {
    invalid("Persisted Webhook Delivery completion precedes start.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    subscriptionId: uuid(row.subscription_id, "subscription id"),
    eventId: uuid(row.event_id, "event id"),
    attemptNo: positiveInteger(row.attempt_no, "attempt number"),
    endpointSnapshot: textValue(row.endpoint_snapshot, "endpoint snapshot"),
    payloadDigest: textValue(row.payload_digest, "payload digest"),
    status: textValue(row.status, "status"),
    ...(row.http_status !== null
      ? {httpStatus: integer(row.http_status, "HTTP status")}
      : {}),
    startedAt,
    ...(completedAt ? {completedAt} : {}),
    ...(row.next_attempt_at !== null
      ? {nextAttemptAt: timestamp(row.next_attempt_at, "nextAttemptAt")}
      : {}),
    ...(row.error_class !== null
      ? {errorClass: textValue(row.error_class, "error class")}
      : {}),
    correlationId: uuid(row.correlation_id, "correlation id"),
    createdAt: timestamp(row.created_at, "createdAt"),
  });
}

async function readDelivery(
  transaction: SqlTransaction,
  deliveryId: string,
): Promise<WebhookDeliveryEvidence | null> {
  const result = await transaction.query<WebhookDeliveryRow>(
    `SELECT id,
            subscription_id,
            event_id,
            attempt_no,
            endpoint_snapshot,
            payload_digest,
            status,
            http_status,
            started_at,
            completed_at,
            next_attempt_at,
            error_class,
            correlation_id,
            created_at
       FROM core_integration.webhook_delivery
      WHERE id=$1::uuid`,
    [deliveryId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted Webhook Delivery is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresWebhookDeliveryStore implements WebhookDeliveryReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly deliveryId: string;
  }): Promise<WebhookDeliveryEvidence | null> {
    assertTenantContext(input.requestContext);
    if (!UUID_PATTERN.test(input.deliveryId)) {
      invalid("Webhook Delivery id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readDelivery(transaction, input.deliveryId),
    );
  }
}
