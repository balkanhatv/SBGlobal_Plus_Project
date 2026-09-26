import type { RequestContext } from "../../core/context/contracts.js";
import {
  AuthorizationReadError,
  type ActiveAbacPolicyRead,
  type AuthorizationReadScopeClass,
  type AuthorizationReadState,
  type AuthorizationReadStorePort,
  type CompiledPermissionSnapshotRead,
} from "../../core/authorization/read-store.js";
import {
  AuthorizationPolicyGrammarError,
  parseAbacExpressionV1,
  parsePermissionPatternV1,
  parsePermissionSetV1,
  type AbacExpressionV1,
} from "../../core/authorization/policy-grammar.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface SnapshotRow {
  readonly permission_version: string | number;
  readonly role_ids: readonly string[];
  readonly permission_schema_version: number;
  readonly permission_set_json: unknown;
  readonly source_fingerprint: string;
}

interface AbacPolicyRow {
  readonly id: string;
  readonly code: string;
  readonly tenant_id: string | null;
  readonly industry_context_id: string | null;
  readonly applies_to_permission_pattern: string;
  readonly priority: number;
  readonly effect: string;
  readonly expression_version: number;
  readonly expression_ast_json: unknown;
}

function stateInvalid(message: string): never {
  throw new AuthorizationReadError("AUTHORIZATION_STATE_INVALID", message);
}

function positiveSafeInteger(value: string | number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    stateInvalid(`Persisted Authorization ${field} is invalid.`);
  }
  return parsed;
}

function validatePermissionCode(permissionCode: string): string {
  try {
    parsePermissionSetV1({ permissions: [{ code: permissionCode, effect: "DENY" }] });
    return permissionCode;
  } catch (error) {
    if (error instanceof AuthorizationPolicyGrammarError) {
      stateInvalid("Operation permission code is outside Permission Set v1 grammar.");
    }
    throw error;
  }
}

function permissionPatternMatches(patternInput: unknown, permissionCode: string): string | null {
  let pattern: string;
  try {
    pattern = parsePermissionPatternV1(patternInput);
  } catch (error) {
    if (error instanceof AuthorizationPolicyGrammarError) {
      stateInvalid("Persisted ACTIVE ABAC permission pattern is invalid.");
    }
    throw error;
  }

  if (pattern === permissionCode) return pattern;
  if (!pattern.endsWith(".*")) return null;
  const prefix = pattern.slice(0, -1);
  return permissionCode.startsWith(prefix) ? pattern : null;
}

function parseSnapshot(
  row: SnapshotRow,
  scopeClass: AuthorizationReadScopeClass,
): CompiledPermissionSnapshotRead {
  const permissionVersion = positiveSafeInteger(row.permission_version, "permission version");
  if (row.permission_schema_version !== 1) {
    stateInvalid("Persisted compiled permission schema version is unsupported.");
  }

  try {
    const permissionSet = parsePermissionSetV1(row.permission_set_json);
    return Object.freeze({
      scopeClass,
      permissionVersion,
      roleIds: Object.freeze([...(row.role_ids ?? [])]),
      permissionSet,
      sourceFingerprint: row.source_fingerprint,
    });
  } catch (error) {
    if (error instanceof AuthorizationPolicyGrammarError) {
      stateInvalid("Persisted compiled permission payload is invalid.");
    }
    throw error;
  }
}

function parseApplicablePolicies(
  rows: readonly AbacPolicyRow[],
  permissionCode: string,
): readonly ActiveAbacPolicyRead[] {
  const policies: ActiveAbacPolicyRead[] = [];

  for (const row of rows) {
    const permissionPattern = permissionPatternMatches(
      row.applies_to_permission_pattern,
      permissionCode,
    );
    if (!permissionPattern) continue;

    if (row.expression_version !== 1) {
      stateInvalid("Applicable ACTIVE ABAC expression version is unsupported.");
    }
    if (row.effect !== "DENY" && row.effect !== "RESTRICT") {
      stateInvalid("Applicable ACTIVE ABAC effect is invalid.");
    }
    const effect: "DENY" | "RESTRICT" = row.effect;
    if (!Number.isSafeInteger(row.priority)) {
      stateInvalid("Applicable ACTIVE ABAC priority is invalid.");
    }

    let expression: AbacExpressionV1;
    try {
      expression = parseAbacExpressionV1(row.expression_ast_json);
    } catch (error) {
      if (error instanceof AuthorizationPolicyGrammarError) {
        stateInvalid("Applicable ACTIVE ABAC expression payload is invalid.");
      }
      throw error;
    }

    policies.push(Object.freeze({
      id: row.id,
      code: row.code,
      ...(row.tenant_id ? { tenantId: row.tenant_id } : {}),
      ...(row.industry_context_id ? { industryContextId: row.industry_context_id } : {}),
      permissionPattern,
      priority: row.priority,
      effect,
      expressionVersion: 1 as const,
      expression,
    }));
  }

  return Object.freeze(policies);
}

function assertReadableScope(context: RequestContext): AuthorizationReadScopeClass {
  if (context.scopeClass === "PLATFORM_GLOBAL") {
    if (!context.principalId || context.tenantId || context.industryContextId) {
      throw new AuthorizationReadError(
        "AUTHORIZATION_SCOPE_UNSUPPORTED",
        "Platform Authorization read scope is invalid.",
      );
    }
    return context.scopeClass;
  }

  if (context.scopeClass === "TENANT_CORE") {
    if (!context.tenantId || !context.principalId || context.industryContextId) {
      throw new AuthorizationReadError(
        "AUTHORIZATION_SCOPE_UNSUPPORTED",
        "Tenant Core Authorization read scope is invalid.",
      );
    }
    return context.scopeClass;
  }

  if (context.scopeClass === "TENANT_INDUSTRY") {
    if (!context.tenantId || !context.industryContextId || !context.principalId) {
      throw new AuthorizationReadError(
        "AUTHORIZATION_SCOPE_UNSUPPORTED",
        "Tenant Industry Authorization read scope is invalid.",
      );
    }
    return context.scopeClass;
  }

  throw new AuthorizationReadError(
    "AUTHORIZATION_SCOPE_UNSUPPORTED",
    "Authorization read store does not support this scope class.",
  );
}

async function readPlatformSnapshot(
  transaction: SqlTransaction,
  context: RequestContext,
): Promise<SnapshotRow | null> {
  const result = await transaction.query<SnapshotRow>(
    `SELECT subject.current_version AS permission_version,
            snapshot.role_ids,
            snapshot.permission_schema_version,
            snapshot.permission_set_json,
            snapshot.source_fingerprint
       FROM core_authz.compiled_platform_permission_subject subject
       JOIN core_authz.compiled_platform_permission_snapshot snapshot
         ON snapshot.id=subject.current_snapshot_id
        AND snapshot.subject_id=subject.id
        AND snapshot.version=subject.current_version
        AND snapshot.status='CURRENT'
      WHERE subject.principal_id=$1::uuid`,
    [context.principalId],
  );
  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  if (result.rowCount !== 1 || !row) {
    stateInvalid("Platform compiled permission subject is ambiguous.");
  }
  return row;
}

async function readTenantSnapshot(
  transaction: SqlTransaction,
  context: RequestContext,
): Promise<SnapshotRow | null> {
  const result = await transaction.query<SnapshotRow>(
    `SELECT subject.current_version AS permission_version,
            snapshot.role_ids,
            snapshot.permission_schema_version,
            snapshot.permission_set_json,
            snapshot.source_fingerprint
       FROM core_authz.compiled_permission_subject subject
       JOIN core_authz.compiled_permission_snapshot snapshot
         ON snapshot.id=subject.current_snapshot_id
        AND snapshot.subject_id=subject.id
        AND snapshot.version=subject.current_version
        AND snapshot.status='CURRENT'
      WHERE subject.tenant_id=$1::uuid
        AND subject.industry_context_id IS NOT DISTINCT FROM $2::uuid
        AND subject.principal_id=$3::uuid
        AND subject.membership_id IS NOT DISTINCT FROM $4::uuid
        AND subject.org_unit_id IS NOT DISTINCT FROM $5::uuid
        AND subject.scope_class=$6`,
    [
      context.tenantId,
      context.industryContextId ?? null,
      context.principalId,
      context.membershipId ?? null,
      context.orgUnitId ?? null,
      context.scopeClass,
    ],
  );
  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  if (result.rowCount !== 1 || !row) {
    stateInvalid("Tenant compiled permission subject is ambiguous.");
  }
  return row;
}

async function readActivePolicies(
  transaction: SqlTransaction,
  context: RequestContext,
): Promise<readonly AbacPolicyRow[]> {
  let scopePredicate: string;
  let parameters: readonly unknown[];

  if (context.scopeClass === "PLATFORM_GLOBAL") {
    scopePredicate = "tenant_id IS NULL AND industry_context_id IS NULL";
    parameters = [];
  } else if (context.scopeClass === "TENANT_CORE") {
    scopePredicate = "tenant_id=$1::uuid AND industry_context_id IS NULL";
    parameters = [context.tenantId];
  } else {
    scopePredicate = "tenant_id=$1::uuid AND (industry_context_id IS NULL OR industry_context_id=$2::uuid)";
    parameters = [context.tenantId, context.industryContextId];
  }

  const result = await transaction.query<AbacPolicyRow>(
    `SELECT id,code,tenant_id,industry_context_id,applies_to_permission_pattern,
            priority,effect::text,expression_version,expression_ast_json
       FROM core_authz.abac_policy
      WHERE status='ACTIVE'
        AND (valid_from IS NULL OR valid_from<=CURRENT_TIMESTAMP)
        AND (valid_until IS NULL OR valid_until>CURRENT_TIMESTAMP)
        AND ${scopePredicate}
      ORDER BY priority ASC,code ASC,expression_version ASC,id ASC`,
    parameters,
  );
  return result.rows;
}

export class PostgresAuthorizationReadStore implements AuthorizationReadStorePort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async load(input: {
    readonly requestContext: RequestContext;
    readonly permissionCode: string;
  }): Promise<AuthorizationReadState> {
    try {
      const scopeClass = assertReadableScope(input.requestContext);
      const permissionCode = validatePermissionCode(input.permissionCode);

      return await this.scopedSql.withContext(input.requestContext, async (transaction) => {
        const snapshotRow = scopeClass === "PLATFORM_GLOBAL"
          ? await readPlatformSnapshot(transaction, input.requestContext)
          : await readTenantSnapshot(transaction, input.requestContext);

        if (!snapshotRow) {
          throw new AuthorizationReadError(
            "AUTHORIZATION_STATE_UNAVAILABLE",
            "Current compiled Authorization snapshot is unavailable.",
          );
        }

        const permissionSnapshot = parseSnapshot(snapshotRow, scopeClass);
        const policyRows = await readActivePolicies(transaction, input.requestContext);
        const policies = parseApplicablePolicies(policyRows, permissionCode);

        return Object.freeze({ permissionSnapshot, policies });
      });
    } catch (error) {
      if (error instanceof AuthorizationReadError) throw error;
      throw new AuthorizationReadError(
        "AUTHORIZATION_STATE_UNAVAILABLE",
        "Authorization read state is unavailable.",
      );
    }
  }
}
