import type { JsonValue } from "../../core/api/schema-registry.js";
import type {
  CountryPackReadPort,
  CountryPackStatus,
  PersistedCountryPack,
} from "../../core/config/country-pack.js";
import type { SqlDatabase, SqlTransaction } from "../database/contracts.js";

interface CountryPackRow {
  readonly id: string;
  readonly country_code: string;
  readonly code: string;
  readonly version: string | number;
  readonly status: string;
  readonly locale_codes: unknown;
  readonly default_currency_code: string | null;
  readonly default_timezone: string | null;
  readonly default_date_format: string | null;
  readonly address_schema_json: unknown | null;
  readonly phone_schema_json: unknown | null;
  readonly reference_bundle_ref: string | null;
  readonly metadata_json: unknown;
  readonly created_at: string | Date;
  readonly approved_by: string | null;
  readonly effective_from: string | Date | null;
}

export class CountryPackPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CountryPackPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set<CountryPackStatus>([
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ACTIVE",
  "RETIRED",
]);

function invalid(message: string): never {
  throw new CountryPackPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted CountryPack ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted CountryPack ${field} is invalid.`);
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return textValue(value, field);
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted CountryPack ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted CountryPack ${field} is invalid.`);
  }
  return date.toISOString();
}

function optionalTimestamp(
  value: string | Date | null | undefined,
  field: string,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  return timestamp(value, field);
}

function status(value: string): CountryPackStatus {
  if (!STATUSES.has(value as CountryPackStatus)) {
    invalid("Persisted CountryPack status is invalid.");
  }
  return value as CountryPackStatus;
}

function rawTextArray(value: unknown, field: string): readonly (string | null)[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted CountryPack ${field} is invalid.`);
  }
  return Object.freeze(value.map((entry) => {
    if (entry !== null && typeof entry !== "string") {
      invalid(`Persisted CountryPack ${field} is invalid.`);
    }
    return entry;
  }));
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted CountryPack JSON is invalid at ${path}.`);
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
      invalid(`Persisted CountryPack JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted CountryPack JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted CountryPack JSON is invalid at ${path}.`);
}

function optionalJson(value: unknown | null | undefined): JsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  return normalizeJson(value);
}

function parseRow(row: CountryPackRow): PersistedCountryPack {
  const defaultCurrencyCode = optionalText(row.default_currency_code, "defaultCurrencyCode");
  const defaultTimezone = optionalText(row.default_timezone, "defaultTimezone");
  const defaultDateFormat = optionalText(row.default_date_format, "defaultDateFormat");
  const addressSchema = optionalJson(row.address_schema_json);
  const phoneSchema = optionalJson(row.phone_schema_json);
  const referenceBundleRef = optionalText(row.reference_bundle_ref, "referenceBundleRef");
  const approvedBy = optionalUuid(row.approved_by, "approvedBy");
  const effectiveFrom = optionalTimestamp(row.effective_from, "effectiveFrom");

  return Object.freeze({
    id: uuid(row.id, "id"),
    countryCode: textValue(row.country_code, "countryCode"),
    code: textValue(row.code, "code"),
    version: positiveInteger(row.version, "version"),
    status: status(row.status),
    localeCodes: rawTextArray(row.locale_codes, "localeCodes"),
    ...(defaultCurrencyCode !== undefined ? {defaultCurrencyCode} : {}),
    ...(defaultTimezone !== undefined ? {defaultTimezone} : {}),
    ...(defaultDateFormat !== undefined ? {defaultDateFormat} : {}),
    ...(addressSchema !== undefined ? {addressSchema} : {}),
    ...(phoneSchema !== undefined ? {phoneSchema} : {}),
    ...(referenceBundleRef !== undefined ? {referenceBundleRef} : {}),
    metadata: normalizeJson(row.metadata_json),
    createdAt: timestamp(row.created_at, "createdAt"),
    ...(approvedBy ? {approvedBy} : {}),
    ...(effectiveFrom ? {effectiveFrom} : {}),
  });
}

async function readCountryPack(
  transaction: SqlTransaction,
  countryPackId: string,
): Promise<PersistedCountryPack | null> {
  const result = await transaction.query<CountryPackRow>(
    `SELECT id,
            country_code::text,
            code,
            version,
            status::text,
            locale_codes,
            default_currency_code::text,
            default_timezone,
            default_date_format,
            address_schema_json,
            phone_schema_json,
            reference_bundle_ref,
            metadata_json,
            created_at,
            approved_by,
            effective_from
       FROM core_config.country_pack
      WHERE id=$1::uuid`,
    [countryPackId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted CountryPack is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresCountryPackStore implements CountryPackReadPort {
  constructor(private readonly database: SqlDatabase) {}

  async loadById(input: {
    readonly countryPackId: string;
  }): Promise<PersistedCountryPack | null> {
    if (!UUID_PATTERN.test(input.countryPackId)) {
      invalid("CountryPack id is invalid.");
    }
    return this.database.transaction(
      (transaction) => readCountryPack(transaction, input.countryPackId),
    );
  }
}
