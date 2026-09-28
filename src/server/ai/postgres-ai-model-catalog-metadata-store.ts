import type { JsonValue } from "../../core/api/schema-registry.js";
import type {
  AIModelCatalogMetadata,
  AIModelCatalogMetadataReadPort,
  AIModelSensitivityCeiling,
} from "../../core/ai/model-catalog-metadata.js";
import type { SqlDatabase, SqlTransaction } from "../database/contracts.js";

interface AIModelCatalogMetadataRow {
  readonly id: string;
  readonly provider_id: string;
  readonly model_code: string;
  readonly display_name: string;
  readonly capabilities: Array<string | null>;
  readonly context_window_class: string;
  readonly input_modalities: Array<string | null>;
  readonly output_modalities: Array<string | null>;
  readonly residency_regions: Array<string | null>;
  readonly sensitivity_ceiling: string;
  readonly cost_class: string;
  readonly latency_class: string;
  readonly status: string;
  readonly version: string | number;
  readonly metadata_json: unknown;
}

export class AIModelCatalogPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIModelCatalogPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SENSITIVITY_CEILINGS = new Set<AIModelSensitivityCeiling>([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
]);

function invalid(message: string): never {
  throw new AIModelCatalogPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIModel ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIModel ${field} is invalid.`);
  }
  return value;
}

function textArray(value: unknown, field: string): readonly (string | null)[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted AIModel ${field} is invalid.`);
  }
  const normalized = value.map((entry) => {
    if (entry !== null && typeof entry !== "string") {
      invalid(`Persisted AIModel ${field} is invalid.`);
    }
    return entry;
  });
  return Object.freeze(normalized);
}

function sensitivityCeiling(value: unknown): AIModelSensitivityCeiling {
  if (typeof value !== "string" || !SENSITIVITY_CEILINGS.has(value as AIModelSensitivityCeiling)) {
    invalid("Persisted AIModel sensitivity ceiling is invalid.");
  }
  return value as AIModelSensitivityCeiling;
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted AIModel ${field} is invalid.`);
  }
  return parsed;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted AIModel JSON is invalid at ${path}.`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry, index) => normalizeJson(entry, `${path}[${index}]`)));
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      invalid(`Persisted AIModel JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted AIModel JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted AIModel JSON is invalid at ${path}.`);
}

function parseRow(row: AIModelCatalogMetadataRow): AIModelCatalogMetadata {
  return Object.freeze({
    id: uuid(row.id, "id"),
    providerId: uuid(row.provider_id, "provider id"),
    modelCode: textValue(row.model_code, "model code"),
    displayName: textValue(row.display_name, "display name"),
    capabilities: textArray(row.capabilities, "capabilities"),
    contextWindowClass: textValue(row.context_window_class, "context window class"),
    inputModalities: textArray(row.input_modalities, "input modalities"),
    outputModalities: textArray(row.output_modalities, "output modalities"),
    residencyRegions: textArray(row.residency_regions, "residency regions"),
    sensitivityCeiling: sensitivityCeiling(row.sensitivity_ceiling),
    costClass: textValue(row.cost_class, "cost class"),
    latencyClass: textValue(row.latency_class, "latency class"),
    status: textValue(row.status, "status"),
    version: positiveInteger(row.version, "version"),
    metadata: normalizeJson(row.metadata_json),
  });
}

async function readById(
  transaction: SqlTransaction,
  id: string,
): Promise<AIModelCatalogMetadata | null> {
  const result = await transaction.query<AIModelCatalogMetadataRow>(
    `SELECT id,
            provider_id,
            model_code,
            display_name,
            capabilities,
            context_window_class,
            input_modalities,
            output_modalities,
            residency_regions,
            sensitivity_ceiling,
            cost_class,
            latency_class,
            status,
            version,
            metadata_json
       FROM core_ai.ai_model
      WHERE id=$1::uuid`,
    [id],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIModel is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIModelCatalogMetadataStore
implements AIModelCatalogMetadataReadPort {
  constructor(private readonly database: SqlDatabase) {}

  async loadById(id: string): Promise<AIModelCatalogMetadata | null> {
    if (!UUID_PATTERN.test(id)) {
      invalid("AIModel id is invalid.");
    }
    return this.database.transaction((transaction) => readById(transaction, id));
  }
}
