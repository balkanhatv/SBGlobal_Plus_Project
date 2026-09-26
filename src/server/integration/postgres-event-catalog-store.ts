import type { JsonValue } from "../../core/api/schema-registry.js";
import type {
  EventCatalogStatus,
  EventCatalogReadPort,
  PersistedEventCatalogEntry,
} from "../../core/integration/event-catalog.js";
import type {
  EventScopeClass,
  EventSensitivityClass,
} from "../../core/integration/event-envelope.js";
import type { SqlDatabase, SqlTransaction } from "../database/contracts.js";

interface EventCatalogRow {
  readonly event_type: string;
  readonly event_version: string | number;
  readonly producer_module: string;
  readonly scope_class: string;
  readonly payload_schema_json: unknown;
  readonly sensitivity_class: string;
  readonly ordering_key: string | null;
  readonly consumer_classes_json: unknown;
  readonly retention_audit_posture: string;
  readonly webhook_eligible: boolean;
  readonly backward_compatibility: string;
  readonly status: string;
  readonly created_at: string | Date;
}

export class EventCatalogPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EventCatalogPersistenceError";
  }
}

const SCOPES = new Set<EventScopeClass>([
  "PLATFORM_GLOBAL",
  "TENANT_CORE",
  "TENANT_INDUSTRY",
  "EXPLICIT_CROSS_CONTEXT",
]);
const SENSITIVITIES = new Set<EventSensitivityClass>([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
]);
const STATUSES = new Set<EventCatalogStatus>(["ACTIVE", "RETIRED"]);

function invalid(message: string): never {
  throw new EventCatalogPersistenceError(message);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted Event Catalog ${field} is invalid.`);
  }
  return value;
}

function positiveVersion(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid("Persisted Event Catalog version is invalid.");
  }
  return parsed;
}

function scope(value: string): EventScopeClass {
  if (!SCOPES.has(value as EventScopeClass)) {
    invalid("Persisted Event Catalog scope is invalid.");
  }
  return value as EventScopeClass;
}

function sensitivity(value: string): EventSensitivityClass {
  if (!SENSITIVITIES.has(value as EventSensitivityClass)) {
    invalid("Persisted Event Catalog sensitivity is invalid.");
  }
  return value as EventSensitivityClass;
}

function status(value: string): EventCatalogStatus {
  if (!STATUSES.has(value as EventCatalogStatus)) {
    invalid("Persisted Event Catalog status is invalid.");
  }
  return value as EventCatalogStatus;
}

function timestamp(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid("Persisted Event Catalog createdAt is invalid.");
  }
  return date.toISOString();
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted Event Catalog JSON is invalid at ${path}.`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry, index) => normalizeJson(entry, `${path}[${index}]`)));
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      invalid(`Persisted Event Catalog JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted Event Catalog JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted Event Catalog JSON is invalid at ${path}.`);
}

function parseRow(row: EventCatalogRow): PersistedEventCatalogEntry {
  return Object.freeze({
    eventType: textValue(row.event_type, "event type"),
    eventVersion: positiveVersion(row.event_version),
    producerModule: textValue(row.producer_module, "producer module"),
    scopeClass: scope(row.scope_class),
    payloadSchema: normalizeJson(row.payload_schema_json),
    sensitivityClass: sensitivity(row.sensitivity_class),
    ...(row.ordering_key !== null
      ? {orderingKey: textValue(row.ordering_key, "ordering key")}
      : {}),
    consumerClassesJson: normalizeJson(row.consumer_classes_json),
    retentionAuditPosture: textValue(row.retention_audit_posture, "retention/audit posture"),
    webhookEligible: row.webhook_eligible === true,
    backwardCompatibility: textValue(row.backward_compatibility, "backward compatibility"),
    status: status(row.status),
    createdAt: timestamp(row.created_at),
  });
}

async function readExact(
  transaction: SqlTransaction,
  input: {
    readonly eventType: string;
    readonly eventVersion: number;
    readonly scopeClass: EventScopeClass;
  },
): Promise<PersistedEventCatalogEntry | null> {
  const result = await transaction.query<EventCatalogRow>(
    `SELECT event_type,
            event_version,
            producer_module,
            scope_class,
            payload_schema_json,
            sensitivity_class,
            ordering_key,
            consumer_classes_json,
            retention_audit_posture,
            webhook_eligible,
            backward_compatibility,
            status,
            created_at
       FROM core_integration.event_catalog
      WHERE event_type=$1
        AND event_version=$2
        AND scope_class=$3`,
    [input.eventType, input.eventVersion, input.scopeClass],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted Event Catalog tuple is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresEventCatalogStore implements EventCatalogReadPort {
  constructor(private readonly database: SqlDatabase) {}

  async loadExact(input: {
    readonly eventType: string;
    readonly eventVersion: number;
    readonly scopeClass: EventScopeClass;
  }): Promise<PersistedEventCatalogEntry | null> {
    textValue(input.eventType, "event type");
    if (!Number.isSafeInteger(input.eventVersion) || input.eventVersion < 1) {
      invalid("Event Catalog version is invalid.");
    }
    if (!SCOPES.has(input.scopeClass)) {
      invalid("Event Catalog scope is invalid.");
    }

    return this.database.transaction(
      (transaction) => readExact(transaction, input),
    );
  }
}
