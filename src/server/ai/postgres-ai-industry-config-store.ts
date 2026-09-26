import type { RequestContext } from "../../core/context/contracts.js";
import type {
  AIIndustryConfigReadPort,
  PersistedAIIndustryConfig,
} from "../../core/ai/industry-config.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIIndustryConfigRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string;
  readonly enabled: boolean;
  readonly allowed_capabilities: unknown;
  readonly allowed_provider_ids: unknown;
  readonly allowed_model_ids: unknown;
  readonly domain_prompt_set_id: string | null;
  readonly country_pack_refs: unknown;
  readonly localization_profile_ref: string | null;
  readonly version: string | number;
  readonly updated_at: string | Date;
}

export class AIIndustryConfigPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIIndustryConfigPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new AIIndustryConfigPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIIndustryConfig ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") {
    invalid(`Persisted AIIndustryConfig ${field} is invalid.`);
  }
  return value;
}

function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    invalid(`Persisted AIIndustryConfig ${field} is invalid.`);
  }
  return value;
}

function positiveInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    invalid(`Persisted AIIndustryConfig ${field} is invalid.`);
  }
  return parsed;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIIndustryConfig ${field} is invalid.`);
  }
  return date.toISOString();
}

function textArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted AIIndustryConfig ${field} is invalid.`);
  }
  return Object.freeze(value.map((entry, index) => {
    if (typeof entry !== "string") {
      invalid(`Persisted AIIndustryConfig ${field}[${index}] is invalid.`);
    }
    return entry;
  }));
}

function uuidArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted AIIndustryConfig ${field} is invalid.`);
  }
  return Object.freeze(value.map((entry, index) => uuid(entry, `${field}[${index}]`)));
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIIndustryConfig reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE") ||
      context.tenantId ||
      context.industryContextId
    ) {
      invalid("AIIndustryConfig platform reads require trusted platform-global context.");
    }
    return;
  }

  if (
    (context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY") ||
    !context.tenantId ||
    !UUID_PATTERN.test(context.tenantId) ||
    (context.scopeClass === "TENANT_CORE" && context.industryContextId) ||
    (
      context.scopeClass === "TENANT_INDUSTRY" &&
      (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId))
    )
  ) {
    invalid("AIIndustryConfig reads require a resolved private context.");
  }
}

function parseRow(row: AIIndustryConfigRow): PersistedAIIndustryConfig {
  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    industryContextId: uuid(row.industry_context_id, "Industry Context id"),
    enabled: booleanValue(row.enabled, "enabled"),
    allowedCapabilities: textArray(row.allowed_capabilities, "allowed capabilities"),
    allowedProviderIds: uuidArray(row.allowed_provider_ids, "allowed provider ids"),
    allowedModelIds: uuidArray(row.allowed_model_ids, "allowed model ids"),
    ...(row.domain_prompt_set_id === null
      ? {}
      : { domainPromptSetId: optionalUuid(row.domain_prompt_set_id, "domain PromptSet id") }),
    countryPackRefs: uuidArray(row.country_pack_refs, "country pack refs"),
    ...(row.localization_profile_ref === null
      ? {}
      : { localizationProfileRef: optionalText(row.localization_profile_ref, "localization profile ref") }),
    version: positiveInteger(row.version, "version"),
    updatedAt: timestamp(row.updated_at, "updatedAt"),
  });
}

async function readIndustryConfig(
  transaction: SqlTransaction,
  industryConfigId: string,
): Promise<PersistedAIIndustryConfig | null> {
  const result = await transaction.query<AIIndustryConfigRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            enabled,
            allowed_capabilities,
            allowed_provider_ids,
            allowed_model_ids,
            domain_prompt_set_id,
            country_pack_refs,
            localization_profile_ref,
            version,
            updated_at
       FROM core_ai.industry_ai_config
      WHERE id=$1::uuid`,
    [industryConfigId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIIndustryConfig is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIIndustryConfigStore implements AIIndustryConfigReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly industryConfigId: string;
  }): Promise<PersistedAIIndustryConfig | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.industryConfigId)) {
      invalid("AIIndustryConfig id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readIndustryConfig(transaction, input.industryConfigId),
    );
  }
}
