import type {
  AICapabilityCatalogMetadata,
  AICapabilityCatalogMetadataReadPort,
  AICapabilityCategory,
} from "../../core/ai/capability-catalog-metadata.js";
import type { SqlDatabase, SqlTransaction } from "../database/contracts.js";

interface AICapabilityCatalogMetadataRow {
  readonly id: string;
  readonly code: string;
  readonly category: string;
  readonly required_entitlement: string | null;
  readonly default_policy_class: string;
  readonly schema_version: string | number;
  readonly status: string;
}

export class AICapabilityCatalogPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AICapabilityCatalogPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CAPABILITY_CATEGORIES = new Set<AICapabilityCategory>([
  "CHAT",
  "EMBEDDING",
  "EXTRACTION",
  "CLASSIFICATION",
  "RERANK",
  "OCR",
  "IMAGE",
  "VIDEO",
  "AUDIO",
  "PRESENTATION",
  "DOCUMENT_INTELLIGENCE",
  "AGENT",
  "TOOL",
  "API",
]);

function invalid(message: string): never {
  throw new AICapabilityCatalogPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AICapability ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AICapability ${field} is invalid.`);
  }
  return value;
}

function nullableText(value: unknown, field: string): string | null {
  if (value !== null && typeof value !== "string") {
    invalid(`Persisted AICapability ${field} is invalid.`);
  }
  return value;
}

function category(value: unknown): AICapabilityCategory {
  if (typeof value !== "string" || !CAPABILITY_CATEGORIES.has(value as AICapabilityCategory)) {
    invalid("Persisted AICapability category is invalid.");
  }
  return value as AICapabilityCategory;
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted AICapability ${field} is invalid.`);
  }
  return parsed;
}

function parseRow(row: AICapabilityCatalogMetadataRow): AICapabilityCatalogMetadata {
  return Object.freeze({
    id: uuid(row.id, "id"),
    code: textValue(row.code, "code"),
    category: category(row.category),
    requiredEntitlement: nullableText(row.required_entitlement, "required entitlement"),
    defaultPolicyClass: textValue(row.default_policy_class, "default policy class"),
    schemaVersion: positiveInteger(row.schema_version, "schema version"),
    status: textValue(row.status, "status"),
  });
}

async function readById(
  transaction: SqlTransaction,
  id: string,
): Promise<AICapabilityCatalogMetadata | null> {
  const result = await transaction.query<AICapabilityCatalogMetadataRow>(
    `SELECT id,
            code,
            category,
            required_entitlement,
            default_policy_class,
            schema_version,
            status
       FROM core_ai.ai_capability
      WHERE id=$1::uuid`,
    [id],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AICapability is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAICapabilityCatalogMetadataStore
implements AICapabilityCatalogMetadataReadPort {
  constructor(private readonly database: SqlDatabase) {}

  async loadById(id: string): Promise<AICapabilityCatalogMetadata | null> {
    if (!UUID_PATTERN.test(id)) {
      invalid("AICapability id is invalid.");
    }
    return this.database.transaction((transaction) => readById(transaction, id));
  }
}
