import type {
  PersistedProviderAdapter,
  ProviderAdapterReadPort,
} from "../../core/integration/provider-adapter.js";
import type { SqlDatabase, SqlTransaction } from "../database/contracts.js";

interface ProviderAdapterRow {
  readonly id: string;
  readonly definition_id: string;
  readonly adapter_code: string;
  readonly contract_version: string;
  readonly auth_method: string;
  readonly timeout_class: string;
  readonly retry_class: string;
  readonly circuit_class: string;
  readonly health_probe_class: string;
  readonly normalized_error_map_version: string;
  readonly status: string;
}

export class ProviderAdapterPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderAdapterPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new ProviderAdapterPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted ProviderAdapter ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted ProviderAdapter ${field} is invalid.`);
  }
  return value;
}

function parseRow(row: ProviderAdapterRow): PersistedProviderAdapter {
  return Object.freeze({
    id: uuid(row.id, "id"),
    definitionId: uuid(row.definition_id, "definition id"),
    adapterCode: textValue(row.adapter_code, "adapter code"),
    contractVersion: textValue(row.contract_version, "contract version"),
    authMethod: textValue(row.auth_method, "auth method"),
    timeoutClass: textValue(row.timeout_class, "timeout class"),
    retryClass: textValue(row.retry_class, "retry class"),
    circuitClass: textValue(row.circuit_class, "circuit class"),
    healthProbeClass: textValue(row.health_probe_class, "health-probe class"),
    normalizedErrorMapVersion: textValue(
      row.normalized_error_map_version,
      "normalized error-map version",
    ),
    status: textValue(row.status, "status"),
  });
}

async function readExact(
  transaction: SqlTransaction,
  input: {
    readonly definitionId: string;
    readonly adapterCode: string;
    readonly contractVersion: string;
  },
): Promise<PersistedProviderAdapter | null> {
  const result = await transaction.query<ProviderAdapterRow>(
    `SELECT id,
            definition_id,
            adapter_code,
            contract_version,
            auth_method,
            timeout_class,
            retry_class,
            circuit_class,
            health_probe_class,
            normalized_error_map_version,
            status
       FROM core_integration.provider_adapter
      WHERE definition_id=$1::uuid
        AND adapter_code=$2
        AND contract_version=$3`,
    [input.definitionId, input.adapterCode, input.contractVersion],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted ProviderAdapter tuple is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresProviderAdapterStore implements ProviderAdapterReadPort {
  constructor(private readonly database: SqlDatabase) {}

  async loadExact(input: {
    readonly definitionId: string;
    readonly adapterCode: string;
    readonly contractVersion: string;
  }): Promise<PersistedProviderAdapter | null> {
    if (!UUID_PATTERN.test(input.definitionId)) {
      invalid("ProviderAdapter definition id is invalid.");
    }
    textValue(input.adapterCode, "adapter code");
    textValue(input.contractVersion, "contract version");

    return this.database.transaction(
      (transaction) => readExact(transaction, input),
    );
  }
}
