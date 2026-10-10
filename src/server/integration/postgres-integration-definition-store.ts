import type { JsonValue } from "../../core/api/schema-registry.js";
import type {
  IntegrationDefinitionOwnerScope,
  IntegrationDefinitionReadPort,
  PersistedIntegrationDefinition,
} from "../../core/integration/integration-definition.js";
import type { SqlDatabase, SqlTransaction } from "../database/contracts.js";

interface IntegrationDefinitionRow {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly provider_family: string;
  readonly capability_codes: string[];
  readonly adapter_contract_version: string;
  readonly owner_scope: string;
  readonly status: string;
  readonly data_transfer_class: string;
  readonly residency_metadata_json: unknown;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class IntegrationDefinitionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrationDefinitionPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const OWNER_SCOPES = new Set<IntegrationDefinitionOwnerScope>([
  "PLATFORM",
  "TENANT",
  "INDUSTRY",
]);

function invalid(message: string): never {
  throw new IntegrationDefinitionPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted IntegrationDefinition ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted IntegrationDefinition ${field} is invalid.`);
  }
  return value;
}

function ownerScope(value: string): IntegrationDefinitionOwnerScope {
  if (!OWNER_SCOPES.has(value as IntegrationDefinitionOwnerScope)) {
    invalid("Persisted IntegrationDefinition owner scope is invalid.");
  }
  return value as IntegrationDefinitionOwnerScope;
}

function stringArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted IntegrationDefinition ${field} is invalid.`);
  }
  return Object.freeze(value.map((entry) => textValue(entry, field)));
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted IntegrationDefinition ${field} is invalid.`);
  }
  return date.toISOString();
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted IntegrationDefinition JSON is invalid at ${path}.`);
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
      invalid(`Persisted IntegrationDefinition JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted IntegrationDefinition JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted IntegrationDefinition JSON is invalid at ${path}.`);
}

function parseRow(row: IntegrationDefinitionRow): PersistedIntegrationDefinition {
  return Object.freeze({
    id: uuid(row.id, "id"),
    code: textValue(row.code, "code"),
    name: textValue(row.name, "name"),
    providerFamily: textValue(row.provider_family, "provider family"),
    capabilityCodes: stringArray(row.capability_codes, "capability codes"),
    adapterContractVersion: textValue(
      row.adapter_contract_version,
      "adapter contract version",
    ),
    ownerScope: ownerScope(row.owner_scope),
    status: textValue(row.status, "status"),
    dataTransferClass: textValue(row.data_transfer_class, "data transfer class"),
    residencyMetadata: normalizeJson(row.residency_metadata_json),
    createdAt: timestamp(row.created_at, "createdAt"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readById(
  transaction: SqlTransaction,
  id: string,
): Promise<PersistedIntegrationDefinition | null> {
  const result = await transaction.query<IntegrationDefinitionRow>(
    `SELECT id,
            code,
            name,
            provider_family,
            capability_codes,
            adapter_contract_version,
            owner_scope::text,
            status,
            data_transfer_class,
            residency_metadata_json,
            created_at,
            updated_at
       FROM core_integration.integration_definition
      WHERE id=$1::uuid`,
    [id],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted IntegrationDefinition is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresIntegrationDefinitionStore
implements IntegrationDefinitionReadPort {
  constructor(private readonly database: SqlDatabase) {}

  async loadById(id: string): Promise<PersistedIntegrationDefinition | null> {
    if (!UUID_PATTERN.test(id)) {
      invalid("IntegrationDefinition id is invalid.");
    }
    return this.database.transaction(
      (transaction) => readById(transaction, id),
    );
  }
}
