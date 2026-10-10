import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type {
  FormDefinitionOwnerScope,
  FormDefinitionReadPort,
  FormDefinitionStatus,
  PersistedFormDefinition,
} from "../../core/config/form-definition.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface FormDefinitionRow {
  readonly id: string;
  readonly owner_scope: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly code: string;
  readonly version: string | number;
  readonly status: string;
  readonly schema_version: string | number;
  readonly purpose_code: string;
  readonly submit_operation_id: string | null;
  readonly layout_schema_json: unknown;
  readonly validation_rule_refs: unknown;
  readonly localization_key_prefix: string | null;
  readonly allowed_surface_classes: unknown;
  readonly created_by: string;
  readonly approved_by: string | null;
  readonly effective_from: string | Date | null;
  readonly effective_to: string | Date | null;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class FormDefinitionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormDefinitionPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set<FormDefinitionStatus>(["DRAFT","REVIEW","PUBLISHED","ACTIVE","RETIRED"]);

function invalid(message: string): never {
  throw new FormDefinitionPersistenceError(message);
}
function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) invalid(`Persisted FormDefinition ${field} is invalid.`);
  return value;
}
function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}
function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") invalid(`Persisted FormDefinition ${field} is invalid.`);
  return value;
}
function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return textValue(value, field);
}
function positiveInteger(value: string | number, field: string): number {
  const parsed=Number(value);
  if (!Number.isSafeInteger(parsed) || parsed<1) invalid(`Persisted FormDefinition ${field} is invalid.`);
  return parsed;
}
function timestamp(value: string | Date, field: string): string {
  const date=value instanceof Date?value:new Date(value);
  if (!Number.isFinite(date.getTime())) invalid(`Persisted FormDefinition ${field} is invalid.`);
  return date.toISOString();
}
function optionalTimestamp(value: string | Date | null | undefined, field: string): string | undefined {
  if (value===null || value===undefined) return undefined;
  return timestamp(value,field);
}
function ownerScope(value: string): FormDefinitionOwnerScope {
  if (value!=="PLATFORM" && value!=="TENANT" && value!=="INDUSTRY") invalid("Persisted FormDefinition owner scope is invalid.");
  return value;
}
function status(value: string): FormDefinitionStatus {
  if (!STATUSES.has(value as FormDefinitionStatus)) invalid("Persisted FormDefinition status is invalid.");
  return value as FormDefinitionStatus;
}
function rawTextArray(value: unknown, field: string): readonly (string | null)[] {
  if (!Array.isArray(value)) invalid(`Persisted FormDefinition ${field} is invalid.`);
  const result=value.map((entry)=>{
    if (entry!==null && typeof entry!=="string") invalid(`Persisted FormDefinition ${field} is invalid.`);
    return entry;
  });
  return Object.freeze(result);
}
function normalizeJson(value: unknown, path="$"): JsonValue {
  if (value===null || typeof value==="string" || typeof value==="boolean") return value;
  if (typeof value==="number") {
    if (!Number.isFinite(value)) invalid(`Persisted FormDefinition layout JSON is invalid at ${path}.`);
    return Object.is(value,-0)?0:value;
  }
  if (Array.isArray(value)) return Object.freeze(value.map((entry,index)=>normalizeJson(entry,`${path}[${index}]`)));
  if (typeof value==="object") {
    const prototype=Object.getPrototypeOf(value);
    if (prototype!==Object.prototype && prototype!==null) invalid(`Persisted FormDefinition layout JSON is invalid at ${path}.`);
    const source=value as Record<string,unknown>;
    const normalized:Record<string,JsonValue>={};
    for (const key of Object.keys(source).sort()) {
      const entry=source[key];
      if (entry===undefined) invalid(`Persisted FormDefinition layout JSON is invalid at ${path}.${key}.`);
      Object.defineProperty(normalized,key,{
        value:normalizeJson(entry,`${path}.${key}`),
        enumerable:true, configurable:false, writable:false,
      });
    }
    return Object.freeze(normalized);
  }
  invalid(`Persisted FormDefinition layout JSON is invalid at ${path}.`);
}
function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) invalid("FormDefinition reads require a resolved principal context.");
  if (context.scopeClass==="PLATFORM_GLOBAL") {
    if ((context.principalType!=="PLATFORM_OPERATOR" && context.principalType!=="SERVICE")
      || context.tenantId || context.industryContextId) {
      invalid("FormDefinition platform reads require trusted platform-global context.");
    }
    return;
  }
  if ((context.scopeClass!=="TENANT_CORE" && context.scopeClass!=="TENANT_INDUSTRY")
    || !context.tenantId || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass==="TENANT_CORE" && context.industryContextId)
    || (context.scopeClass==="TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("FormDefinition reads require a resolved private context.");
  }
}

function parseRow(row: FormDefinitionRow): PersistedFormDefinition {
  const parsedOwnerScope=ownerScope(row.owner_scope);
  const tenantId=optionalUuid(row.tenant_id,"Tenant id");
  const industryContextId=optionalUuid(row.industry_context_id,"Industry Context id");
  if ((parsedOwnerScope==="PLATFORM" && (tenantId||industryContextId))
    || (parsedOwnerScope==="TENANT" && (!tenantId||industryContextId))
    || (parsedOwnerScope==="INDUSTRY" && (!tenantId||!industryContextId))) {
    invalid("Persisted FormDefinition ownership shape is invalid.");
  }
  const submitOperationId=optionalText(row.submit_operation_id,"submitOperationId");
  const localizationKeyPrefix=optionalText(row.localization_key_prefix,"localizationKeyPrefix");
  const approvedBy=optionalUuid(row.approved_by,"approvedBy");
  const effectiveFrom=optionalTimestamp(row.effective_from,"effectiveFrom");
  const effectiveTo=optionalTimestamp(row.effective_to,"effectiveTo");

  return Object.freeze({
    id:uuid(row.id,"id"),
    ownerScope:parsedOwnerScope,
    ...(tenantId?{tenantId}:{}),
    ...(industryContextId?{industryContextId}:{}),
    code:textValue(row.code,"code"),
    version:positiveInteger(row.version,"version"),
    status:status(row.status),
    schemaVersion:positiveInteger(row.schema_version,"schemaVersion"),
    purposeCode:textValue(row.purpose_code,"purposeCode"),
    ...(submitOperationId!==undefined?{submitOperationId}:{}),
    layoutSchema:normalizeJson(row.layout_schema_json),
    validationRuleRefs:rawTextArray(row.validation_rule_refs,"validationRuleRefs"),
    ...(localizationKeyPrefix!==undefined?{localizationKeyPrefix}:{}),
    allowedSurfaceClasses:rawTextArray(row.allowed_surface_classes,"allowedSurfaceClasses"),
    createdBy:uuid(row.created_by,"createdBy"),
    ...(approvedBy?{approvedBy}:{}),
    ...(effectiveFrom?{effectiveFrom}:{}),
    ...(effectiveTo?{effectiveTo}:{}),
    createdAt:timestamp(row.created_at,"createdAt"),
    updatedAt:timestamp(row.updated_at,"updatedAt"),
  });
}

async function readFormDefinition(
  transaction: SqlTransaction,
  formDefinitionId: string,
): Promise<PersistedFormDefinition|null> {
  const result=await transaction.query<FormDefinitionRow>(
    `SELECT id,owner_scope::text,tenant_id,industry_context_id,code,version,status::text,
            schema_version,purpose_code,submit_operation_id,layout_schema_json,
            validation_rule_refs,localization_key_prefix,allowed_surface_classes,
            created_by,approved_by,effective_from,effective_to,created_at,updated_at
       FROM core_config.form_definition
      WHERE id=$1::uuid`,
    [formDefinitionId],
  );
  if (result.rowCount===0) return null;
  if (result.rowCount!==1 || !result.rows[0]) invalid("Persisted FormDefinition is ambiguous.");
  return parseRow(result.rows[0]);
}

export class PostgresFormDefinitionStore implements FormDefinitionReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}
  async loadForContext(input:{
    readonly requestContext:RequestContext;
    readonly formDefinitionId:string;
  }):Promise<PersistedFormDefinition|null>{
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.formDefinitionId)) invalid("FormDefinition id is invalid.");
    return this.scopedSql.withContext(
      input.requestContext,
      (transaction)=>readFormDefinition(transaction,input.formDefinitionId),
    );
  }
}
