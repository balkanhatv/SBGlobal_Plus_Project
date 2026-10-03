import type {
  IndustryContextActivationReadPort,
  IndustryContextActivationStatus,
  PersistedIndustryContextActivationEvidence,
} from "../../core/tenancy/industry-context-activation.js";
import { PostgresContextBootstrapDatabase } from "../database/postgres-context-bootstrap-database.js";
import type { SqlTransaction } from "../database/contracts.js";

interface IndustryContextActivationRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly status: string;
  readonly activation_version: string;
}

export class IndustryContextActivationPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IndustryContextActivationPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BIGINT_TEXT_PATTERN = /^(?:0|[1-9][0-9]*|-[1-9][0-9]*)$/;
const STATUSES = new Set<IndustryContextActivationStatus>([
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "DISABLED",
]);

function invalid(message: string): never {
  throw new IndustryContextActivationPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted IndustryContext activation ${field} is invalid.`);
  }
  return value;
}

function status(value: unknown): IndustryContextActivationStatus {
  if (typeof value !== "string" || !STATUSES.has(value as IndustryContextActivationStatus)) {
    invalid("Persisted IndustryContext activation status is invalid.");
  }
  return value as IndustryContextActivationStatus;
}

function bigintText(value: unknown): string {
  if (typeof value !== "string" || !BIGINT_TEXT_PATTERN.test(value)) {
    invalid("Persisted IndustryContext activationVersion is invalid.");
  }
  return value;
}

function parseRow(
  row: IndustryContextActivationRow,
): PersistedIndustryContextActivationEvidence {
  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    status: status(row.status),
    activationVersion: bigintText(row.activation_version),
  });
}

async function readExact(
  transaction: SqlTransaction,
  tenantId: string,
  industryContextId: string,
): Promise<PersistedIndustryContextActivationEvidence | null> {
  const result = await transaction.query<IndustryContextActivationRow>(
    `SELECT id::text,
            tenant_id::text,
            status::text,
            activation_version::text
       FROM core_tenancy.industry_context
      WHERE tenant_id=$1::uuid
        AND id=$2::uuid`,
    [tenantId, industryContextId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted IndustryContext activation evidence is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresIndustryContextActivationStore
implements IndustryContextActivationReadPort {
  constructor(private readonly database: PostgresContextBootstrapDatabase) {}

  async loadExact(input: {
    readonly tenantId: string;
    readonly industryContextId: string;
  }): Promise<PersistedIndustryContextActivationEvidence | null> {
    if (!UUID_PATTERN.test(input.tenantId)) {
      invalid("IndustryContext activation Tenant id is invalid.");
    }
    if (!UUID_PATTERN.test(input.industryContextId)) {
      invalid("IndustryContext activation id is invalid.");
    }

    return this.database.transaction(
      (transaction) => readExact(
        transaction,
        input.tenantId,
        input.industryContextId,
      ),
    );
  }
}
