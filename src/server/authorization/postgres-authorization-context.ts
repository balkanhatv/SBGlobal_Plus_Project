import type { EffectiveRoleReadPort, EffectiveRoleSummary } from "../../core/identity/roles-query-service.js";
import type { AuthorizationContextPort } from "../../core/context/ports.js";
import type { RequestContext, RoleContext } from "../../core/context/contracts.js";
import { ContextResolutionError } from "../../core/context/errors.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface SnapshotRow {
  readonly permission_version: string | number;
  readonly role_ids: readonly string[];
}

async function readCurrentSnapshot(
  transaction: SqlTransaction,
  input: {
    readonly tenantId: string;
    readonly industryContextId?: string;
    readonly principalId: string;
    readonly membershipId?: string;
    readonly orgUnitId?: string;
    readonly scopeClass: "TENANT_CORE" | "TENANT_INDUSTRY";
  },
): Promise<RoleContext | null> {
  const result = await transaction.query<SnapshotRow>(
    `SELECT subject.current_version AS permission_version,
            snapshot.role_ids
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
      input.tenantId,
      input.industryContextId ?? null,
      input.principalId,
      input.membershipId ?? null,
      input.orgUnitId ?? null,
      input.scopeClass,
    ],
  );

  if (result.rowCount !== 1) return null;
  const row = result.rows[0];
  if (!row) return null;
  const permissionVersion = Number(row.permission_version);
  if (!Number.isSafeInteger(permissionVersion) || permissionVersion <= 0) {
    throw new ContextResolutionError("DEPENDENCY_UNAVAILABLE", "Authorization context is unavailable.");
  }

  return Object.freeze({
    roleIds: Object.freeze([...(row.role_ids ?? [])]),
    permissionVersion,
  });
}

export class PostgresAuthorizationContextAdapter implements AuthorizationContextPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadRoleContext(
    input: Parameters<AuthorizationContextPort["loadRoleContext"]>[0],
  ): Promise<RoleContext> {
    const scopeClass = input.scopeClass;
    if (scopeClass === "EXPLICIT_CROSS_CONTEXT") {
      throw new ContextResolutionError(
        "DEPENDENCY_UNAVAILABLE",
        "Cross-context authorization requires a dedicated governed path.",
      );
    }

    const persistenceContext: RequestContext = Object.freeze({
      requestId: input.requestId,
      correlationId: input.correlationId,
      tenantId: input.tenantId,
      industryContextId: input.industryContextId,
      dataHomeId: input.dataHomeId,
      regionCode: input.regionCode,
      principalId: input.principalId,
      membershipId: input.membershipId,
      orgUnitId: input.orgUnitId,
      orgUnitPath: Object.freeze([...input.orgUnitPath]),
      roleIds: Object.freeze([]),
      scopeClass,
    });

    const context = await this.scopedSql.withContext(
      persistenceContext,
      (transaction) => readCurrentSnapshot(transaction, {
        tenantId: input.tenantId,
        industryContextId: input.industryContextId,
        principalId: input.principalId,
        membershipId: input.membershipId,
        orgUnitId: input.orgUnitId,
        scopeClass,
      }),
    );
    if (!context) {
      throw new ContextResolutionError("DEPENDENCY_UNAVAILABLE", "Authorization context is unavailable.");
    }
    return context;
  }
}

export class PostgresEffectiveRoleReadAdapter implements EffectiveRoleReadPort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async listEffective(input: {
    readonly requestContext: RequestContext;
    readonly principalId: string;
    readonly membershipId?: string;
  }): Promise<EffectiveRoleSummary | null> {
    const context = input.requestContext;
    if (context.scopeClass !== "TENANT_CORE" || !context.tenantId) return null;

    const roleContext = await this.scopedSql.withContext(
      context,
      (transaction) => readCurrentSnapshot(transaction, {
        tenantId: context.tenantId!,
        principalId: input.principalId,
        membershipId: input.membershipId,
        orgUnitId: context.orgUnitId,
        scopeClass: "TENANT_CORE",
      }),
    );
    if (!roleContext) return null;
    return Object.freeze({
      principalId: input.principalId,
      membershipId: input.membershipId,
      roleIds: roleContext.roleIds,
      permissionVersion: roleContext.permissionVersion,
    });
  }
}
