import type {
  AIMediaRequestReadPort,
  AIMediaSensitivityClass,
  AIMediaType,
  PersistedAIMediaRequest,
} from "../../core/ai/media-request.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AIMediaRequestRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly industry_context_id: string | null;
  readonly principal_id: string;
  readonly capability_code: string;
  readonly media_type: string;
  readonly prompt_template_id: string | null;
  readonly prompt_version: string | number | null;
  readonly brand_config_version: string | null;
  readonly localization_profile_ref: string | null;
  readonly input_document_refs: unknown;
  readonly sensitivity_class: string;
  readonly residency_requirement: string;
  readonly moderation_policy_ref: string;
  readonly status: string;
  readonly created_at: string | Date;
  readonly completed_at: string | Date | null;
}

export class AIMediaRequestPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIMediaRequestPersistenceError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INTEGER_TEXT = /^-?\d+$/;

const MEDIA_TYPES = new Set<AIMediaType>([
  "IMAGE",
  "SVG",
  "ICON",
  "INFOGRAPHIC",
  "PRESENTATION",
  "VIDEO",
  "ANIMATION",
  "VOICE",
  "AUDIO",
]);

const SENSITIVITY_CLASSES = new Set<AIMediaSensitivityClass>([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE_PERSONAL",
  "REGULATED",
]);

function invalid(message: string): never {
  throw new AIMediaRequestPersistenceError(message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    invalid(`Persisted AIMediaRequest ${field} is invalid.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return uuid(value, field);
}

function rawText(value: unknown, field: string): string {
  if (typeof value !== "string") {
    invalid(`Persisted AIMediaRequest ${field} is invalid.`);
  }
  return value;
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  return rawText(value, field);
}

function safeInteger(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    invalid(`Persisted AIMediaRequest ${field} is invalid.`);
  }
  return parsed;
}

function optionalSafeInteger(value: unknown, field: string): number | undefined {
  if (value === null || value === undefined) return undefined;
  return safeInteger(value, field);
}

function optionalIntegerText(value: unknown, field: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string" || !INTEGER_TEXT.test(value)) {
    invalid(`Persisted AIMediaRequest ${field} is invalid.`);
  }
  return value;
}

function timestamp(value: string | Date, field: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    invalid(`Persisted AIMediaRequest ${field} is invalid.`);
  }
  return date.toISOString();
}

function optionalTimestamp(value: string | Date | null, field: string): string | undefined {
  if (value === null) return undefined;
  return timestamp(value, field);
}

function mediaType(value: unknown): AIMediaType {
  if (typeof value !== "string" || !MEDIA_TYPES.has(value as AIMediaType)) {
    invalid("Persisted AIMediaRequest media type is invalid.");
  }
  return value as AIMediaType;
}

function sensitivityClass(value: unknown): AIMediaSensitivityClass {
  if (
    typeof value !== "string"
    || !SENSITIVITY_CLASSES.has(value as AIMediaSensitivityClass)
  ) {
    invalid("Persisted AIMediaRequest sensitivity class is invalid.");
  }
  return value as AIMediaSensitivityClass;
}

function uniqueUuidArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value)) {
    invalid(`Persisted AIMediaRequest ${field} is invalid.`);
  }
  const parsed = value.map((entry) => uuid(entry, field));
  if (new Set(parsed).size !== parsed.length) {
    invalid(`Persisted AIMediaRequest ${field} is invalid.`);
  }
  return Object.freeze(parsed);
}

function assertContext(context: RequestContext): void {
  if (!context.principalId || !UUID_PATTERN.test(context.principalId)) {
    invalid("AIMediaRequest reads require a resolved principal context.");
  }

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (
      (context.principalType !== "PLATFORM_OPERATOR" && context.principalType !== "SERVICE")
      || context.tenantId
      || context.industryContextId
    ) {
      invalid("AIMediaRequest platform reads require trusted platform-global context.");
    }
    return;
  }

  if (
    (context.scopeClass !== "TENANT_CORE" && context.scopeClass !== "TENANT_INDUSTRY")
    || !context.tenantId
    || !UUID_PATTERN.test(context.tenantId)
    || (context.scopeClass === "TENANT_CORE" && context.industryContextId)
    || (
      context.scopeClass === "TENANT_INDUSTRY"
      && (!context.industryContextId || !UUID_PATTERN.test(context.industryContextId))
    )
  ) {
    invalid("AIMediaRequest reads require a resolved private context.");
  }
}

function parseRow(row: AIMediaRequestRow): PersistedAIMediaRequest {
  const industryContextId = optionalUuid(row.industry_context_id, "Industry Context id");
  const promptTemplateId = optionalUuid(row.prompt_template_id, "PromptTemplate id");
  const promptVersion = optionalSafeInteger(row.prompt_version, "prompt version");
  const brandConfigVersion = optionalIntegerText(
    row.brand_config_version,
    "brand config version",
  );
  const localizationProfileRef = optionalText(
    row.localization_profile_ref,
    "localization profile ref",
  );
  const completedAt = optionalTimestamp(row.completed_at, "completedAt");

  return Object.freeze({
    id: uuid(row.id, "id"),
    tenantId: uuid(row.tenant_id, "Tenant id"),
    ...(industryContextId ? { industryContextId } : {}),
    principalId: uuid(row.principal_id, "principal id"),
    capabilityCode: rawText(row.capability_code, "capability code"),
    mediaType: mediaType(row.media_type),
    ...(promptTemplateId ? { promptTemplateId } : {}),
    ...(promptVersion === undefined ? {} : { promptVersion }),
    ...(brandConfigVersion === undefined ? {} : { brandConfigVersion }),
    ...(localizationProfileRef === undefined ? {} : { localizationProfileRef }),
    inputDocumentRefs: uniqueUuidArray(row.input_document_refs, "input document refs"),
    sensitivityClass: sensitivityClass(row.sensitivity_class),
    residencyRequirement: rawText(row.residency_requirement, "residency requirement"),
    moderationPolicyRef: rawText(row.moderation_policy_ref, "moderation policy ref"),
    status: rawText(row.status, "status"),
    createdAt: timestamp(row.created_at, "createdAt"),
    ...(completedAt === undefined ? {} : { completedAt }),
  });
}

async function readMediaRequest(
  transaction: SqlTransaction,
  mediaRequestId: string,
): Promise<PersistedAIMediaRequest | null> {
  const result = await transaction.query<AIMediaRequestRow>(
    `SELECT id,
            tenant_id,
            industry_context_id,
            principal_id,
            capability_code,
            media_type::text AS media_type,
            prompt_template_id,
            prompt_version,
            brand_config_version::text AS brand_config_version,
            localization_profile_ref,
            input_document_refs,
            sensitivity_class,
            residency_requirement,
            moderation_policy_ref,
            status,
            created_at,
            completed_at
       FROM core_ai.ai_media_request
      WHERE id=$1::uuid`,
    [mediaRequestId],
  );

  if (result.rowCount === 0) return null;
  if (result.rowCount !== 1 || !result.rows[0]) {
    invalid("Persisted AIMediaRequest is ambiguous.");
  }
  return parseRow(result.rows[0]);
}

export class PostgresAIMediaRequestStore implements AIMediaRequestReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly mediaRequestId: string;
  }): Promise<PersistedAIMediaRequest | null> {
    assertContext(input.requestContext);
    if (!UUID_PATTERN.test(input.mediaRequestId)) {
      invalid("AIMediaRequest id is invalid.");
    }

    return this.scopedSql.withContext(
      input.requestContext,
      (transaction) => readMediaRequest(transaction, input.mediaRequestId),
    );
  }
}
