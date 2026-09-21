import type {
  WebhookSubscription,
  WebhookSubscriptionReadPort,
  WebhookSubscriptionStatus,
} from "../../core/integration/webhook-subscription.js";
import type { JsonObject, JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface WebhookSubscriptionRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly name: string;
  readonly endpoint_url: string;
  readonly status: string;
  readonly secret_version: string | number;
  readonly event_filter_json: unknown;
  readonly allowed_industry_context_ids: string[];
  readonly permission_profile_id: string | null;
  readonly created_by: string;
  readonly verified_at: string | Date | null;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class WebhookSubscriptionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookSubscriptionPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES = new Set<WebhookSubscriptionStatus>([
  "PENDING_VERIFICATION",
  "ACTIVE",
  "PAUSED",
  "REVOKED",
]);

function invalid(message: string): never {
  throw new WebhookSubscriptionPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted Webhook Subscription ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted Webhook Subscription ${field} is invalid.`);
  }
  return value;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted Webhook Subscription ${field} is invalid.`);
  }
  return date.toISOString();
}

function status(value: string): WebhookSubscriptionStatus {
  if (!STATUSES.has(value as WebhookSubscriptionStatus)) {
    invalid("Persisted Webhook Subscription status is invalid.");
  }
  return value as WebhookSubscriptionStatus;
}

function positiveVersion(value: string | number): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid("Persisted Webhook Subscription secret version is invalid.");
  }
  return parsed;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) invalid(`Persisted Webhook filter is invalid at ${path}.`);
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry, index) => normalizeJson(entry, `${path}[${index}]`)));
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      invalid(`Persisted Webhook filter is invalid at ${path}.`);
    }
    const result: Record<string, JsonValue> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const entry = (value as Record<string, unknown>)[key];
      if (entry === undefined) invalid(`Persisted Webhook filter is invalid at ${path}.${key}.`);
      Object.defineProperty(result, key, {
        value: normalizeJson(entry, `${path}.${key}`),
        enumerable: true,
        writable: false,
        configurable: false,
      });
    }
    return Object.freeze(result);
  }
  invalid(`Persisted Webhook filter is invalid at ${path}.`);
}

function filterObject(value: unknown): JsonObject {
  const normalized = normalizeJson(value);
  if (normalized === null || Array.isArray(normalized) || typeof normalized !== "object") {
    invalid("Persisted Webhook Subscription event filter must be an object.");
  }
  return normalized as JsonObject;
}

function contextIds(values: unknown): readonly string[] {
  if (!Array.isArray(values)) {
    invalid("Persisted Webhook Subscription allowed Industry Contexts are invalid.");
  }
  const parsed = values.map((value) => uuid(value, "allowed Industry Context id"));
  if (new Set(parsed).size !== parsed.length) {
    invalid("Persisted Webhook Subscription allowed Industry Contexts are duplicated.");
  }
  return Object.freeze(parsed);
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
    invalid("Webhook Subscription reads require a resolved single-Tenant context.");
  }
}

function parseRow(row: WebhookSubscriptionRow): WebhookSubscription {
  const parsedStatus = status(row.status);
  const verifiedAt = row.verified_at === null
    ? undefined
    : timestamp(row.verified_at, "verifiedAt");
  if (parsedStatus === "ACTIVE" && !verifiedAt) {
    invalid("Persisted ACTIVE Webhook Subscription lacks verification evidence.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    name: textValue(row.name, "name"),
    endpointUrl: textValue(row.endpoint_url, "endpoint URL"),
    status: parsedStatus,
    secretVersion: positiveVersion(row.secret_version),
    eventFilterJson: filterObject(row.event_filter_json),
    allowedIndustryContextIds: contextIds(row.allowed_industry_context_ids),
    ...(row.permission_profile_id !== null
      ? {permissionProfileId: uuid(row.permission_profile_id, "permission profile id")}
      : {}),
    createdBy: uuid(row.created_by, "creator id"),
    ...(verifiedAt ? {verifiedAt} : {}),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readSubscription(
  transaction: SqlTransaction,
  subscriptionId: string,
): Promise<WebhookSubscription | null> {
  const result = await transaction.query<WebhookSubscriptionRow>(
    `SELECT id,
            tenant_id,
            name,
            endpoint_url,
            status::text,
            secret_version,
            event_filter_json,
            allowed_industry_context_ids,
            permission_profile_id,
            created_by,
            verified_at,
            created_at,
            updated_at
       FROM core_integration.webhook_subscription
      WHERE id=$1::uuid`,
    [subscriptionId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted Webhook Subscription is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresWebhookSubscriptionStore
implements WebhookSubscriptionReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly subscriptionId: string;
  }): Promise<WebhookSubscription | null> {
    assertTenantContext(input.requestContext);
    if (!UUID_PATTERN.test(input.subscriptionId)) {
      invalid("Webhook Subscription id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readSubscription(transaction, input.subscriptionId),
    );
  }
}
