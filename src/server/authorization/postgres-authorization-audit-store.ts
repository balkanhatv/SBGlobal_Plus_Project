import type {
  AuthorizationAuditInput,
  AuthorizationAuditPort,
} from "../../core/authorization/audit.js";
import { AuthorizationAuditError } from "../../core/authorization/audit.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SENSITIVITY = new Set([
  "PUBLIC","INTERNAL","CONFIDENTIAL","SENSITIVE_PERSONAL","REGULATED",
]);

export interface AuthorizationAuditRuntimePort {
  now(): Date;
  nextAuditId(): string;
}

function fail(): never {
  throw new AuthorizationAuditError();
}

function requireUuid(value: string | undefined): string {
  if (!value || !UUID.test(value)) fail();
  return value;
}

function resolvedSensitivity(input: AuthorizationAuditInput): string {
  const value = input.resourceDescriptor?.sensitivityClass;
  if (value === undefined) return "INTERNAL";
  return SENSITIVITY.has(value) ? value : "REGULATED";
}

function evidence(input: AuthorizationAuditInput): Readonly<Record<string, unknown>> {
  const decision = input.accessDecision;
  return Object.freeze({
    auditClass: input.operation.auditClass,
    operationKind: input.operation.kind,
    ...(decision ? {
      pdpDecisionKind: decision.decision,
      policyIds: Object.freeze([...new Set(decision.policyIds)].sort()),
      permissionVersion: decision.permissionVersion,
      ...(decision.entitlementSnapshotVersion !== undefined
        ? { entitlementSnapshotVersion: decision.entitlementSnapshotVersion }
        : {}),
      restrictionPresent: decision.restrictionSet !== undefined,
    } : {}),
  });
}

export class PostgresAuthorizationAuditStore implements AuthorizationAuditPort {
  constructor(
    private readonly scopedSql: RequestScopedSql,
    private readonly runtime: AuthorizationAuditRuntimePort,
  ) {}

  async append(input: AuthorizationAuditInput): Promise<void> {
    const context = input.requestContext;
    if (context.scopeClass === "PUBLIC" || context.scopeClass === "EXPLICIT_CROSS_CONTEXT") fail();

    const occurredAt = this.runtime.now();
    const auditId = this.runtime.nextAuditId();
    if (!(occurredAt instanceof Date) || Number.isNaN(occurredAt.getTime())) fail();
    requireUuid(auditId);
    requireUuid(context.correlationId);
    if (context.principalId) requireUuid(context.principalId);
    if (input.accessDecision?.decisionId) requireUuid(input.accessDecision.decisionId);

    try {
      await this.scopedSql.withContext(context, async (transaction) => {
        await transaction.query(
          `INSERT INTO core_audit.audit_event_identity(id,occurred_at)
           VALUES ($1::uuid,$2::timestamptz)`,
          [auditId, occurredAt.toISOString()],
        );
        await transaction.query(
          `INSERT INTO core_audit.audit_event(
             id,tenant_id,industry_context_id,scope_class,occurred_at,
             actor_principal_id,actor_type,action_code,resource_type,resource_id,
             outcome,reason_code,permission_code,access_decision_id,source_module,
             correlation_id,request_id,data_home_id,region_code,sensitivity_class,
             evidence_json,schema_version
           ) VALUES (
             $1::uuid,$2::uuid,$3::uuid,$4,$5::timestamptz,
             $6::uuid,$7,$8,$9,$10,
             $11,$12,$13,$14::uuid,$15,
             $16::uuid,$17,$18::uuid,$19,$20,
             $21::jsonb,1
           )`,
          [
            auditId,
            context.tenantId ?? null,
            context.industryContextId ?? null,
            context.scopeClass,
            occurredAt.toISOString(),
            context.principalId ?? null,
            context.principalType ?? "UNKNOWN",
            input.operation.operationId,
            input.resourceDescriptor?.resourceType ?? null,
            input.resourceDescriptor?.resourceId ?? null,
            input.outcome,
            input.reasonCode ?? null,
            input.operation.permissionCode,
            input.accessDecision?.decisionId ?? null,
            input.operation.module,
            context.correlationId,
            context.requestId,
            context.dataHomeId ?? null,
            context.regionCode ?? null,
            resolvedSensitivity(input),
            JSON.stringify(evidence(input)),
          ],
        );
      });
    } catch (error) {
      if (error instanceof AuthorizationAuditError) throw error;
      fail();
    }
  }
}
