import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { NotificationChannel } from "../../core/notification/delivery.js";
import type {
  NotificationTemplateOwnerScope,
  NotificationTemplateReadPort,
  NotificationTemplateStatus,
  PersistedNotificationTemplate,
} from "../../core/notification/template.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface NotificationTemplateRow {
  readonly id: string;
  readonly owner_scope: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly code: string;
  readonly channel: string;
  readonly locale_code: string;
  readonly version: string | number;
  readonly status: string;
  readonly subject_template: string | null;
  readonly body_template: string;
  readonly safe_preview_template: string | null;
  readonly variable_schema_json: unknown;
  readonly created_by: string;
  readonly approved_by: string | null;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class NotificationTemplatePersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationTemplatePersistenceError";
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

const STATUSES = new Set<NotificationTemplateStatus>([
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ACTIVE",
  "RETIRED",
]);

function invalid(message: string): never {
  throw new NotificationTemplatePersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted NotificationTemplate ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted NotificationTemplate ${field} is invalid.`);
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
    invalid(`Persisted NotificationTemplate ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted NotificationTemplate ${field} is invalid.`);
  }
  return date.toISOString();
}

function ownerScope(value: string): NotificationTemplateOwnerScope {
  if (value !== "PLATFORM" && value !== "TENANT" && value !== "INDUSTRY") {
    invalid("Persisted NotificationTemplate owner scope is invalid.");
  }
  return value;
}

function channel(value: string): NotificationChannel {
  if (!CHANNELS.has(value as NotificationChannel)) {
    invalid("Persisted NotificationTemplate channel is invalid.");
  }
  return value as NotificationChannel;
}

function status(value: string): NotificationTemplateStatus {
  if (!STATUSES.has(value as NotificationTemplateStatus)) {
    invalid("Persisted NotificationTemplate status is invalid.");
  }
  return value as NotificationTemplateStatus;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted NotificationTemplate JSON is invalid at ${path}.`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(
      value.map((entry, index) => normalizeJson(entry, `${path}[${index}]`)),
    );
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      invalid(`Persisted NotificationTemplate JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted NotificationTemplate JSON is invalid at ${path}.${key}.`);
      }
      Object.defineProperty(normalized, key, {
        value: normalizeJson(entry, `${path}.${key}`),
        enumerable: true,
        configurable: false,
        writable: false,
      });
    }
    return Object.freeze(normalized);
  }
  invalid(`Persisted NotificationTemplate JSON is invalid at ${path}.`);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("NotificationTemplate reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("NotificationTemplate platform reads require trusted platform-global context.");
    }
    return;
  }

  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("NotificationTemplate reads require a resolved private context.");
  }
}

function parseRow(row: NotificationTemplateRow): PersistedNotificationTemplate {
  const parsedOwnerScope = ownerScope(row.owner_scope);
  const tenantId = optionalUuid(row.tenant_id, "Tenant id");
  const industryContextId = optionalUuid(
    row.industry_context_id,
    "Industry Context id",
  );

  if ((parsedOwnerScope === "PLATFORM" && (tenantId || industryContextId))
    || (parsedOwnerScope === "TENANT" && (!tenantId || industryContextId))
    || (parsedOwnerScope === "INDUSTRY" && (!tenantId || !industryContextId))) {
    invalid("Persisted NotificationTemplate ownership shape is invalid.");
  }

  const createdAt = timestamp(row.created_at, "createdAt");
  const updatedAt = timestamp(row.updated_at, "updatedAt");

  return Object.freeze({
    id: uuid(row.id, "id"),
    ownerScope: parsedOwnerScope,
    ...(tenantId ? {tenantId} : {}),
    ...(industryContextId ? {industryContextId} : {}),
    code: textValue(row.code, "code"),
    channel: channel(row.channel),
    localeCode: textValue(row.locale_code, "locale code"),
    version: positiveInteger(row.version, "version"),
    status: status(row.status),
    ...(row.subject_template !== null
      ? {subjectTemplate: optionalText(row.subject_template, "subject template")}
      : {}),
    bodyTemplate: textValue(row.body_template, "body template"),
    ...(row.safe_preview_template !== null
      ? {safePreviewTemplate: optionalText(row.safe_preview_template, "safe preview template")}
      : {}),
    variableSchema: normalizeJson(row.variable_schema_json),
    createdBy: uuid(row.created_by, "createdBy"),
    ...(row.approved_by !== null
      ? {approvedBy: uuid(row.approved_by, "approvedBy")}
      : {}),
    createdAt,
    updatedAt,
  });
}

async function readTemplate(
  transaction: SqlTransaction,
  notificationTemplateId: string,
): Promise<PersistedNotificationTemplate | null> {
  const result = await transaction.query<NotificationTemplateRow>(
    `SELECT id,
            owner_scope::text,
            tenant_id,
            industry_context_id,
            code,
            channel::text,
            locale_code,
            version,
            status::text,
            subject_template,
            body_template,
            safe_preview_template,
            variable_schema_json,
            created_by,
            approved_by,
            created_at,
            updated_at
       FROM core_notification.notification_template
      WHERE id=$1::uuid`,
    [notificationTemplateId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted NotificationTemplate is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresNotificationTemplateStore
implements NotificationTemplateReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly notificationTemplateId: string;
  }): Promise<PersistedNotificationTemplate | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.notificationTemplateId)) {
      invalid("NotificationTemplate id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readTemplate(transaction, input.notificationTemplateId),
    );
  }
}
