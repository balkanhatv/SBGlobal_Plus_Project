import type { JsonValue } from "../../core/api/schema-registry.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type {
  PersistedRuleDefinition,
  RuleDefinitionOwnerScope,
  RuleDefinitionReadPort,
  RuleDefinitionStatus,
  RuleSafetyClass,
} from "../../core/config/rule-definition.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface RuleDefinitionRow {
  readonly id: string;
  readonly owner_scope: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly code: string;
  readonly version: string | number;
  readonly status: string;
  readonly schema_version: string | number;
  readonly input_schema_json: unknown;
  readonly condition_ast_json: unknown;
  readonly decision_json: unknown;
  readonly priority: string | number;
  readonly safety_class: string;
  readonly required_permission: string | null;
  readonly created_by: string;
  readonly approved_by: string | null;
  readonly effective_from: string | Date | null;
  readonly effective_to: string | Date | null;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
}

export class RuleDefinitionPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuleDefinitionPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATUSES = new Set<RuleDefinitionStatus>(["DRAFT","REVIEW","PUBLISHED","ACTIVE","RETIRED"]);
const SAFETY_CLASSES = new Set<RuleSafetyClass>(["BUSINESS","CONFIGURATION","VALIDATION"]);

function invalid(message: string): never { throw new RuleDefinitionPersistenceError(message); }

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) invalid(`Persisted RuleDefinition ${field} is invalid.`);
  return value;
}
function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}
function textValue(value: unknown, field: string): string {
  if (typeof value !== "string") invalid(`Persisted RuleDefinition ${field} is invalid.`);
  return value;
}
function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return textValue(value, field);
}
function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) invalid(`Persisted RuleDefinition ${field} is invalid.`);
  return parsed;
}
function integer(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) invalid(`Persisted RuleDefinition ${field} is invalid.`);
  return parsed;
}
function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) invalid(`Persisted RuleDefinition ${field} is invalid.`);
  return date.toISOString();
}
function optionalTimestamp(value: string | Date | null | undefined, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return timestamp(value, field);
}
function ownerScope(value: string): RuleDefinitionOwnerScope {
  if (value !== "PLATFORM" && value !== "TENANT" && value !== "INDUSTRY") invalid("Persisted RuleDefinition owner scope is invalid.");
  return value;
}
function status(value: string): RuleDefinitionStatus {
  if (!STATUSES.has(value as RuleDefinitionStatus)) invalid("Persisted RuleDefinition status is invalid.");
  return value as RuleDefinitionStatus;
}
function safetyClass(value: string): RuleSafetyClass {
  if (!SAFETY_CLASSES.has(value as RuleSafetyClass)) invalid("Persisted RuleDefinition safety class is invalid.");
  return value as RuleSafetyClass;
}
function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) invalid(`Persisted RuleDefinition JSON is invalid at ${path}.`);
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) return Object.freeze(value.map((entry,index)=>normalizeJson(entry,`${path}[${index}]`)));
  if (typeof value === "object") {
    const prototype=Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) invalid(`Persisted RuleDefinition JSON is invalid at ${path}.`);
    const source=value as Record<string,unknown>;
    const normalized: Record<string,JsonValue>={};
    for (const key of Object.keys(source).sort()) {
      const entry=source[key];
      if (entry === undefined) invalid(`Persisted RuleDefinition JSON is invalid at ${path}.${key}.`);
      Object.defineProperty(normalized,key,{value:normalizeJson(entry,`${path}.${key}`),enumerable:true,configurable:false,writable:false});
    }
    return Object.freeze(normalized);
  }
  invalid(`Persisted RuleDefinition JSON is invalid at ${path}.`);
}
function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) invalid("RuleDefinition reads require a resolved principal context.");
  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if ((context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE") || context.tenantId || context.industryContextId) {
      invalid("RuleDefinition platform reads require trusted platform-global context.");
    }
    return;
  }
  if ((context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (context.scopeClass === "TENANT_INDUSTRY" && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId)))) {
    invalid("RuleDefinition reads require a resolved private context.");
  }
}

function parseRow(row: RuleDefinitionRow): PersistedRuleDefinition {
  const parsedOwnerScope=ownerScope(row.owner_scope);
  const tenantId=optionalUuid(row.tenant_id,"Tenant id");
  const industryContextId=optionalUuid(row.industry_context_id,"Industry Context id");
  if ((parsedOwnerScope==="PLATFORM"&&(tenantId||industryContextId))
    || (parsedOwnerScope==="TENANT"&&(!tenantId||industryContextId))
    || (parsedOwnerScope==="INDUSTRY"&&(!tenantId||!industryContextId))) invalid("Persisted RuleDefinition ownership shape is invalid.");

  const requiredPermission=optionalText(row.required_permission,"requiredPermission");
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
    inputSchema:normalizeJson(row.input_schema_json),
    conditionAst:normalizeJson(row.condition_ast_json),
    decision:normalizeJson(row.decision_json),
    priority:integer(row.priority,"priority"),
    safetyClass:safetyClass(row.safety_class),
    ...(requiredPermission!==undefined?{requiredPermission}:{}),
    createdBy:uuid(row.created_by,"createdBy"),
    ...(approvedBy?{approvedBy}:{}),
    ...(effectiveFrom?{effectiveFrom}:{}),
    ...(effectiveTo?{effectiveTo}:{}),
    createdAt:timestamp(row.created_at,"createdAt"),
    updatedAt:timestamp(row.updated_at,"updatedAt"),
  });
}

async function readRuleDefinition(transaction: SqlTransaction, ruleDefinitionId: string): Promise<PersistedRuleDefinition|null> {
  const result=await transaction.query<RuleDefinitionRow>(
    `SELECT id,owner_scope::text,tenant_id,industry_context_id,code,version,status::text,
            schema_version,input_schema_json,condition_ast_json,decision_json,priority,
            safety_class::text,required_permission,created_by,approved_by,effective_from,
            effective_to,created_at,updated_at
       FROM core_config.rule_definition
      WHERE id=$1::uuid`,[ruleDefinitionId]);
  if(result.rowCount===0) return null;
  if(result.rowCount!==1 || !result.rows[0]) invalid("Persisted RuleDefinition is ambiguous.");
  return parseRow(result.rows[0]);
}

export class PostgresRuleDefinitionStore implements RuleDefinitionReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}
  async loadForContext(input:{readonly requestContext:RequestContext;readonly ruleDefinitionId:string;}):Promise<PersistedRuleDefinition|null>{
    assertContext(input.requestContext);
    if(!UUID_PATTERN.test(input.ruleDefinitionId)) invalid("RuleDefinition id is invalid.");
    return this.scopedSql.withContext(input.requestContext,(transaction)=>readRuleDefinition(transaction,input.ruleDefinitionId));
  }
}
