import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type {
  FormFieldDefinitionReadPort,
  FormFieldType,
  PersistedFormFieldDefinition,
} from "../../core/config/form-field-definition.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface FormFieldDefinitionRow {
  readonly id: string;
  readonly form_definition_id: string;
  readonly field_key: string;
  readonly field_type: string;
  readonly label_key: string;
  readonly required: boolean;
  readonly read_only: boolean;
  readonly visibility_rule_ref: string | null;
  readonly validation_schema_json: unknown;
  readonly reference_catalog_ref: string | null;
  readonly sort_order: string | number;
  readonly sensitivity_class: string;
  readonly created_at: string | Date;
}

export class FormFieldDefinitionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormFieldDefinitionPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIELD_TYPES = new Set<FormFieldType>([
  "TEXT","NUMBER","DECIMAL","DATE","DATETIME","BOOLEAN",
  "SELECT","MULTISELECT","REFERENCE","FILE","JSON_STRUCTURED",
]);

function invalid(message: string): never {
  throw new FormFieldDefinitionPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted FormFieldDefinition ${field} is invalid.`);
  }
  return value;
}

function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted FormFieldDefinition ${field} is invalid.`);
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return textValue(value, field);
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    invalid(`Persisted FormFieldDefinition ${field} is invalid.`);
  }
  return value;
}

function integer(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    invalid(`Persisted FormFieldDefinition ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted FormFieldDefinition ${field} is invalid.`);
  }
  return date.toISOString();
}

function fieldType(value: string): FormFieldType {
  if (!FIELD_TYPES.has(value as FormFieldType)) {
    invalid("Persisted FormFieldDefinition field type is invalid.");
  }
  return value as FormFieldType;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      invalid(`Persisted FormFieldDefinition validation JSON is invalid at ${path}.`);
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
      invalid(`Persisted FormFieldDefinition validation JSON is invalid at ${path}.`);
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        invalid(`Persisted FormFieldDefinition validation JSON is invalid at ${path}.${key}.`);
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
  invalid(`Persisted FormFieldDefinition validation JSON is invalid at ${path}.`);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("FormFieldDefinition reads require a resolved principal context.");
  }
  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("FormFieldDefinition platform reads require trusted platform-global context.");
    }
    return;
  }
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("FormFieldDefinition reads require a resolved private context.");
  }
}

function parseRow(row: FormFieldDefinitionRow): PersistedFormFieldDefinition {
  const visibilityRuleRef = optionalText(row.visibility_rule_ref, "visibilityRuleRef");
  const referenceCatalogRef = optionalText(row.reference_catalog_ref, "referenceCatalogRef");
  return Object.freeze({
    id: uuid(row.id, "id"),
    formDefinitionId: uuid(row.form_definition_id, "formDefinitionId"),
    fieldKey: textValue(row.field_key, "fieldKey"),
    fieldType: fieldType(row.field_type),
    labelKey: textValue(row.label_key, "labelKey"),
    required: booleanValue(row.required, "required"),
    readOnly: booleanValue(row.read_only, "readOnly"),
    ...(visibilityRuleRef !== undefined ? {visibilityRuleRef} : {}),
    validationSchema: normalizeJson(row.validation_schema_json),
    ...(referenceCatalogRef !== undefined ? {referenceCatalogRef} : {}),
    sortOrder: integer(row.sort_order, "sortOrder"),
    sensitivityClass: textValue(row.sensitivity_class, "sensitivityClass"),
    createdAt: timestamp(row.created_at, "createdAt"),
  });
}

async function readFormFieldDefinition(
  transaction: SqlTransaction,
  formFieldDefinitionId: string,
): Promise<PersistedFormFieldDefinition | null> {
  const result = await transaction.query<FormFieldDefinitionRow>(
    `SELECT id,
            form_definition_id,
            field_key,
            field_type::text,
            label_key,
            required,
            read_only,
            visibility_rule_ref,
            validation_schema_json,
            reference_catalog_ref,
            sort_order,
            sensitivity_class,
            created_at
       FROM core_config.form_field_definition
      WHERE id=$1::uuid`,
    [formFieldDefinitionId],
  );
  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted FormFieldDefinition is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresFormFieldDefinitionStore implements FormFieldDefinitionReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly formFieldDefinitionId: string;
  }): Promise<PersistedFormFieldDefinition | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.formFieldDefinitionId)) {
      invalid("FormFieldDefinition id is invalid.");
    }
    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readFormFieldDefinition(transaction, input.formFieldDefinitionId),
    );
  }
}
