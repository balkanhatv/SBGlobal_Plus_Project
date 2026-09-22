import type {
  IntegrationCapabilityDirection,
  IntegrationCapabilityReadPort,
  PersistedIntegrationCapability,
} from "../../core/integration/integration-capability.js";
import type { SqlDatabase, SqlTransaction } from "../database/contracts.js";

interface IntegrationCapabilityRow {
  readonly id: string;
  readonly integration_definition_id: string;
  readonly capability_code: string;
  readonly direction: string;
  readonly operation_contract_id: string | null;
  readonly event_types: string[];
  readonly data_class: string;
  readonly idempotency_class: string;
  readonly rate_class: string;
  readonly status: string;
}

export class IntegrationCapabilityPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrationCapabilityPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DIRECTIONS = new Set<IntegrationCapabilityDirection>([
  "INBOUND",
  "OUTBOUND",
  "BIDIRECTIONAL",
]);

function invalid(message: string): never {
  throw new IntegrationCapabilityPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted IntegrationCapability ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`Persisted IntegrationCapability ${field} is invalid.`);
  }
  return value;
}

function direction(value: string): IntegrationCapabilityDirection {
  if (!DIRECTIONS.has(value as IntegrationCapabilityDirection)) {
    invalid("Persisted IntegrationCapability direction is invalid.");
  }
  return value as IntegrationCapabilityDirection;
}

function stringArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted IntegrationCapability ${field} is invalid.`);
  }
  return Object.freeze(value.map((entry) => textValue(entry, field)));
}

function parseRow(row: IntegrationCapabilityRow): PersistedIntegrationCapability {
  return Object.freeze({
    id: uuid(row.id, "id"),
    integrationDefinitionId: uuid(
      row.integration_definition_id,
      "IntegrationDefinition id",
    ),
    capabilityCode: textValue(row.capability_code, "capability code"),
    direction: direction(row.direction),
    ...(row.operation_contract_id !== null
      ? {operationContractId: textValue(row.operation_contract_id, "OperationContract id")}
      : {}),
    eventTypes: stringArray(row.event_types, "event types"),
    dataClass: textValue(row.data_class, "data class"),
    idempotencyClass: textValue(row.idempotency_class, "idempotency class"),
    rateClass: textValue(row.rate_class, "rate class"),
    status: textValue(row.status, "status"),
  });
}

async function readExact(
  transaction: SqlTransaction,
  input: {
    readonly integrationDefinitionId: string;
    readonly capabilityCode: string;
  },
): Promise<PersistedIntegrationCapability | null> {
  const result = await transaction.query<IntegrationCapabilityRow>(
    `SELECT id,
            integration_definition_id,
            capability_code,
            direction::text,
            operation_contract_id,
            event_types,
            data_class,
            idempotency_class,
            rate_class,
            status
       FROM core_integration.integration_capability
      WHERE integration_definition_id=$1::uuid
        AND capability_code=$2`,
    [input.integrationDefinitionId, input.capabilityCode],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted IntegrationCapability tuple is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresIntegrationCapabilityStore
implements IntegrationCapabilityReadPort {
  constructor(private readonly database: SqlDatabase) {}

  async loadExact(input: {
    readonly integrationDefinitionId: string;
    readonly capabilityCode: string;
  }): Promise<PersistedIntegrationCapability | null> {
    if (!UUID_PATTERN.test(input.integrationDefinitionId)) {
      invalid("IntegrationCapability definition id is invalid.");
    }
    textValue(input.capabilityCode, "capability code");

    return this.database.transaction(
      (transaction) => readExact(transaction, input),
    );
  }
}
