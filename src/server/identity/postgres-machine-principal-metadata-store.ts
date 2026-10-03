import type {
  MachinePrincipalMetadata,
  MachinePrincipalMetadataReadPort,
  MachinePrincipalMetadataStatus,
  MachinePrincipalMetadataType,
  MachinePrincipalPersistedScopeClass,
} from "./machine-principal-metadata.js";
import type { SqlDatabase, SqlTransaction } from "../database/contracts.js";

interface PrincipalRow {
  readonly id: string;
  readonly principal_type: string;
  readonly status: string;
  readonly auth_epoch: string;
  readonly service_code: string | null;
  readonly owning_module: string | null;
  readonly allowed_scope_classes: readonly string[] | null;
}

export class MachinePrincipalMetadataPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MachinePrincipalMetadataPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BIGINT_TEXT_PATTERN = /^-?\d+$/;
const TYPES = new Set<MachinePrincipalMetadataType>([
  "HUMAN",
  "API_CLIENT",
  "SERVICE",
  "PLATFORM_OPERATOR",
]);
const STATUSES = new Set<MachinePrincipalMetadataStatus>([
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "REVOKED",
]);
const SCOPES = new Set<MachinePrincipalPersistedScopeClass>([
  "PLATFORM_GLOBAL",
  "TENANT_CORE",
  "TENANT_INDUSTRY",
  "EXPLICIT_CROSS_CONTEXT",
]);

function invalid(message: string): never {
  throw new MachinePrincipalMetadataPersistenceError(message);
}

function uuid(value: unknown): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid("Persisted machine Principal id is invalid.");
  }
  return value;
}

function principalType(value: unknown): MachinePrincipalMetadataType {
  if (typeof value !== "string"
    || !TYPES.has(value as MachinePrincipalMetadataType)) {
    invalid("Persisted machine Principal type is invalid.");
  }
  return value as MachinePrincipalMetadataType;
}

function status(value: unknown): MachinePrincipalMetadataStatus {
  if (typeof value !== "string"
    || !STATUSES.has(value as MachinePrincipalMetadataStatus)) {
    invalid("Persisted machine Principal status is invalid.");
  }
  return value as MachinePrincipalMetadataStatus;
}

function bigintText(value: unknown): string {
  if (typeof value !== "string" || !BIGINT_TEXT_PATTERN.test(value)) {
    invalid("Persisted machine Principal auth epoch is invalid.");
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") {
    invalid(`Persisted machine Principal ${field} is invalid.`);
  }
  return value;
}

function optionalScopes(
  value: unknown,
): readonly MachinePrincipalPersistedScopeClass[] | undefined {
  if (value === null || value === undefined) return undefined;
  if (!Array.isArray(value)) {
    invalid("Persisted machine Principal allowed scopes are invalid.");
  }
  const scopes=value.map((item) => {
    if (typeof item !== "string"
      || !SCOPES.has(item as MachinePrincipalPersistedScopeClass)) {
      invalid("Persisted machine Principal allowed scope is invalid.");
    }
    return item as MachinePrincipalPersistedScopeClass;
  });
  return Object.freeze(scopes);
}

function parseRow(row: PrincipalRow): MachinePrincipalMetadata {
  return Object.freeze({
    id: uuid(row.id),
    principalType: principalType(row.principal_type),
    status: status(row.status),
    authEpoch: bigintText(row.auth_epoch),
    ...(row.service_code !== null
      ? {serviceCode: optionalText(row.service_code, "service code")}
      : {}),
    ...(row.owning_module !== null
      ? {owningModule: optionalText(row.owning_module, "owning module")}
      : {}),
    ...(row.allowed_scope_classes !== null
      ? {allowedScopeClasses: optionalScopes(row.allowed_scope_classes)}
      : {}),
  });
}

async function readById(
  transaction: SqlTransaction,
  principalId: string,
): Promise<MachinePrincipalMetadata | null> {
  const result=await transaction.query<PrincipalRow>(
    `SELECT id::text,
            principal_type::text,
            status::text,
            auth_epoch::text AS auth_epoch,
            service_code,
            owning_module,
            allowed_scope_classes
       FROM core_identity.platform_principal
      WHERE id=$1::uuid`,
    [principalId],
  );
  if (result.rowCount===0) return null;
  if (result.rowCount!==1 || !result.rows[0]) {
    invalid("Persisted machine Principal is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresMachinePrincipalMetadataStore
implements MachinePrincipalMetadataReadPort {
  constructor(private readonly database: SqlDatabase) {}

  async loadById(input: {
    readonly principalId: string;
  }): Promise<MachinePrincipalMetadata | null> {
    if (!UUID_PATTERN.test(input.principalId)) {
      invalid("Machine Principal id is invalid.");
    }
    return this.database.transaction(
      (transaction) => readById(transaction, input.principalId),
    );
  }
}
