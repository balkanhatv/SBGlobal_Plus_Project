import type {
  OutboxEventEvidence,
  OutboxEventReadPort,
  OutboxEventScopeClass,
  OutboxEventStatus,
} from "../../core/integration/outbox-event.js";
import type { JsonObject, JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface OutboxEventRow {
  readonly id: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly scope_class: string;
  readonly event_type: string;
  readonly event_version: string | number;
  readonly aggregate_type: string;
  readonly aggregate_id: string;
  readonly aggregate_version: string | number | null;
  readonly envelope_jsonb: unknown;
  readonly status: string;
  readonly attempt_count: string | number;
  readonly available_at: string | Date;
  readonly locked_at: string | Date | null;
  readonly locked_by: string | null;
  readonly dispatched_at: string | Date | null;
  readonly last_error_code: string | null;
  readonly created_at: string | Date;
}

export class OutboxEventPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OutboxEventPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES = new Set<OutboxEventStatus>([
  "PENDING",
  "DISPATCHING",
  "DISPATCHED",
  "DEAD",
]);

const SCOPES = new Set<OutboxEventScopeClass>([
  "PLATFORM_GLOBAL",
  "TENANT_CORE",
  "TENANT_INDUSTRY",
  "EXPLICIT_CROSS_CONTEXT",
]);

function invalid(message: string): never {
  throw new OutboxEventPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted Outbox Event ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted Outbox Event ${field} is invalid.`);
  }
  return value;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted Outbox Event ${field} is invalid.`);
  }
  return date.toISOString();
}

function positiveInteger(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted Outbox Event ${field} is invalid.`);
  }
  return parsed;
}

function nonNegativeInteger(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    invalid(`Persisted Outbox Event ${field} is invalid.`);
  }
  return parsed;
}

function bigintText(value: string | number, field: string): string {
  const text = String(value);
  if (!/^-?(0|[1-9][0-9]*)$/.test(text)) {
    invalid(`Persisted Outbox Event ${field} is invalid.`);
  }
  return text;
}

function status(value: string): OutboxEventStatus {
  if (!STATUSES.has(value as OutboxEventStatus)) {
    invalid("Persisted Outbox Event status is invalid.");
  }
  return value as OutboxEventStatus;
}

function scope(value: string): OutboxEventScopeClass {
  if (!SCOPES.has(value as OutboxEventScopeClass)) {
    invalid("Persisted Outbox Event scope is invalid.");
  }
  return value as OutboxEventScopeClass;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted Outbox Event envelope is invalid at ${path}.`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry, index) => normalizeJson(entry, `${path}[${index}]`)));
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      invalid(`Persisted Outbox Event envelope is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted Outbox Event envelope is invalid at ${path}.${key}.`);
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
  invalid(`Persisted Outbox Event envelope is invalid at ${path}.`);
}

function envelopeObject(value: unknown): JsonObject {
  const normalized = normalizeJson(value);
  if (normalized === null || Array.isArray(normalized) || typeof normalized !== "object") {
    invalid("Persisted Outbox Event envelope must be an object.");
  }
  return normalized as JsonObject;
}

function parseRow(row: OutboxEventRow): OutboxEventEvidence {
  const parsedScope = scope(row.scope_class);
  const tenantId = row.tenant_id === null ? undefined : uuid(row.tenant_id, "Tenant id");
  const industryContextId = row.industry_context_id === null
    ? undefined
    : uuid(row.industry_context_id, "Industry Context id");

  const physicalShapeValid =
    (parsedScope === "PLATFORM_GLOBAL" && !tenantId && !industryContextId)
    || (parsedScope === "TENANT_CORE" && !!tenantId && !industryContextId)
    || (parsedScope === "TENANT_INDUSTRY" && !!tenantId && !!industryContextId)
    || (parsedScope === "EXPLICIT_CROSS_CONTEXT" && !!tenantId && !industryContextId);
  if (!physicalShapeValid) {
    invalid("Persisted Outbox Event ownership shape is invalid.");
  }

  return Object.freeze({
    id: uuid(row.id, "id"),
    ...(tenantId ? {tenantId} : {}),
    ...(industryContextId ? {industryContextId} : {}),
    scopeClass: parsedScope,
    eventType: textValue(row.event_type, "event type"),
    eventVersion: positiveInteger(row.event_version, "event version"),
    aggregateType: textValue(row.aggregate_type, "aggregate type"),
    aggregateId: textValue(row.aggregate_id, "aggregate id"),
    ...(row.aggregate_version !== null
      ? {aggregateVersion: bigintText(row.aggregate_version, "aggregate version")}
      : {}),
    envelopeJson: envelopeObject(row.envelope_jsonb),
    status: status(row.status),
    attemptCount: nonNegativeInteger(row.attempt_count, "attempt count"),
    availableAt: timestamp(row.available_at, "availableAt"),
    ...(row.locked_at !== null ? {lockedAt: timestamp(row.locked_at, "lockedAt")} : {}),
    ...(row.locked_by !== null ? {lockedBy: textValue(row.locked_by, "lockedBy")} : {}),
    ...(row.dispatched_at !== null
      ? {dispatchedAt: timestamp(row.dispatched_at, "dispatchedAt")}
      : {}),
    ...(row.last_error_code !== null
      ? {lastErrorCode: textValue(row.last_error_code, "lastErrorCode")}
      : {}),
    createdAt: timestamp(row.created_at, "createdAt"),
  });
}

async function readEvent(
  transaction: SqlTransaction,
  eventId: string,
): Promise<OutboxEventEvidence | null> {
  const result = await transaction.query<OutboxEventRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            scope_class,
            event_type,
            event_version,
            aggregate_type,
            aggregate_id,
            aggregate_version,
            envelope_jsonb,
            status::text,
            attempt_count,
            available_at,
            locked_at,
            locked_by,
            dispatched_at,
            last_error_code,
            created_at
       FROM core_integration.outbox_event
      WHERE id=$1::uuid`,
    [eventId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted Outbox Event is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresOutboxEventStore implements OutboxEventReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly eventId: string;
  }): Promise<OutboxEventEvidence | null> {
    if (!UUID_PATTERN.test(input.eventId)) {
      invalid("Outbox Event id is invalid.");
    }
    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readEvent(transaction, input.eventId),
    );
  }
}
