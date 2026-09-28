import type { JsonValue } from "../../core/api/schema-registry.js";
import type {
  AIProviderCatalogMetadata,
  AIProviderCatalogMetadataReadPort,
} from "../../core/ai/provider-catalog-metadata.js";
import type { SqlDatabase, SqlTransaction } from "../database/contracts.js";

interface AIProviderCatalogMetadataRow {
  readonly id: string;
  readonly code: string;
  readonly status: string;
  readonly adapter_type: string;
  readonly supported_regions: Array<string | null>;
  readonly supported_capabilities: Array<string | null>;
  readonly security_class: string;
  readonly residency_metadata: unknown;
  readonly health_state: string;
  readonly version: string | number;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class AIProviderCatalogPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderCatalogPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new AIProviderCatalogPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIProvider ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIProvider ${field} is invalid.`);
  }
  return value;
}

function textArray(value: unknown, field: string): readonly (string | null)[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted AIProvider ${field} is invalid.`);
  }
  const normalized = value.map((entry) => {
    if (entry !== null && typeof entry !== "string") {
      invalid(`Persisted AIProvider ${field} is invalid.`);
    }
    return entry;
  });
  return Object.freeze(normalized);
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted AIProvider ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIProvider ${field} is invalid.`);
  }
  return date.toISOString();
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted AIProvider JSON is invalid at ${path}.`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry, index) => normalizeJson(entry, `${path}[${index}]`)));
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      invalid(`Persisted AIProvider JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted AIProvider JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted AIProvider JSON is invalid at ${path}.`);
}

function parseRow(row: AIProviderCatalogMetadataRow): AIProviderCatalogMetadata {
  return Object.freeze({
    id: uuid(row.id, "id"),
    code: textValue(row.code, "code"),
    status: textValue(row.status, "status"),
    adapterType: textValue(row.adapter_type, "adapter type"),
    supportedRegions: textArray(row.supported_regions, "supported regions"),
    supportedCapabilities: textArray(row.supported_capabilities, "supported capabilities"),
    securityClass: textValue(row.security_class, "security class"),
    residencyMetadata: normalizeJson(row.residency_metadata),
    healthState: textValue(row.health_state, "health state"),
    version: positiveInteger(row.version, "version"),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readById(
  transaction: SqlTransaction,
  id: string,
): Promise<AIProviderCatalogMetadata | null> {
  const result = await transaction.query<AIProviderCatalogMetadataRow>(
    `SELECT id,
            code,
            status,
            adapter_type,
            supported_regions,
            supported_capabilities,
            security_class,
            residency_metadata,
            health_state,
            version,
            created_at,
            updated_at
       FROM core_ai.ai_provider
      WHERE id=$1::uuid`,
    [id],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIProvider is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIProviderCatalogMetadataStore
implements AIProviderCatalogMetadataReadPort {
  constructor(private readonly database: SqlDatabase) {}

  async loadById(id: string): Promise<AIProviderCatalogMetadata | null> {
    if (!UUID_PATTERN.test(id)) {
      invalid("AIProvider id is invalid.");
    }
    return this.database.transaction((transaction) => readById(transaction, id));
  }
}
