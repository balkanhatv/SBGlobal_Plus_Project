import type { RequestContext } from "../../core/context/contracts.js";
import type {
  AuthorizationCompilerSourcePermissionV1,
  AuthorizationCompilerSourceRoleV1,
  AuthorizationCompilerSourceStorePort,
  AuthorizationCompilerSourceV1,
} from "../../core/authorization/source-compiler.js";
import { AuthorizationSourceCompilerError } from "../../core/authorization/source-compiler.js";
import type {
  PlatformAuthorizationCompilerTarget,
  TenantAuthorizationCompilerTarget,
} from "../../core/authorization/compiler-write.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface AssignmentRow {
  readonly assignment_id: string;
  readonly role_id: string;
  readonly role_version: number;
}
interface PermissionRow {
  readonly role_id: string;
  readonly role_version: number;
  readonly permission_id: string;
  readonly role_permission_version: number;
  readonly permission_definition_version: number;
  readonly code: string;
  readonly scope_class: "PLATFORM_GLOBAL"|"TENANT_CORE"|"TENANT_INDUSTRY";
  readonly effect: "ALLOW"|"DENY";
  readonly constraints_json: unknown;
}

function unavailable(): never {
  throw new AuthorizationSourceCompilerError(
    "AUTHORIZATION_COMPILER_SOURCE_UNAVAILABLE",
    "Authorization compiler source state is unavailable.",
  );
}

function toSource(assignments: readonly AssignmentRow[], permissions: readonly PermissionRow[]): AuthorizationCompilerSourceV1 {
  const roleMap=new Map<string,AuthorizationCompilerSourceRoleV1>();
  for (const row of assignments) {
    const existing=roleMap.get(row.role_id);
    if (existing && existing.version!==row.role_version) unavailable();
    roleMap.set(row.role_id,Object.freeze({id:row.role_id,version:Number(row.role_version)}));
  }
  return Object.freeze({
    assignmentIds:Object.freeze(assignments.map(row=>row.assignment_id)),
    roles:Object.freeze([...roleMap.values()]),
    permissions:Object.freeze(permissions.map((row):AuthorizationCompilerSourcePermissionV1=>Object.freeze({
      roleId:row.role_id,
      roleVersion:Number(row.role_version),
      permissionId:row.permission_id,
      rolePermissionVersion:Number(row.role_permission_version),
      permissionDefinitionVersion:Number(row.permission_definition_version),
      code:row.code,
      scopeClass:row.scope_class,
      effect:row.effect,
      constraints:row.constraints_json,
    }))),
  });
}

async function permissionRows(
  sql: import("../database/contracts.js").SqlTransaction,
  roleIds: readonly string[],
): Promise<readonly PermissionRow[]> {
  if (roleIds.length===0) return Object.freeze([]);
  const result=await sql.query<PermissionRow>(
    `SELECT rp.role_id::text,rt.version AS role_version,rp.permission_id::text,
            rp.version AS role_permission_version,pd.version AS permission_definition_version,
            pd.code,pd.scope_class,rp.effect::text,constraints_json
       FROM core_authz.role_permission rp
       JOIN core_authz.role_template rt ON rt.id=rp.role_id
       JOIN core_authz.permission_definition pd ON pd.id=rp.permission_id
      WHERE rp.role_id=ANY($1::uuid[])
        AND pd.status='ACTIVE'
      ORDER BY pd.code,rp.role_id,rp.permission_id`,
    [roleIds],
  );
  return result.rows;
}

export class PostgresAuthorizationCompilerSourceStore implements AuthorizationCompilerSourceStorePort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async loadTenant(input: {
    readonly requestContext: RequestContext;
    readonly target: TenantAuthorizationCompilerTarget;
  }): Promise<AuthorizationCompilerSourceV1> {
    try {
      return await this.scopedSql.withContext(input.requestContext,async (sql)=>{
        const ownerScope=input.target.scopeClass==="TENANT_CORE" ? "TENANT" : "INDUSTRY";
        const assignments=await sql.query<AssignmentRow>(
          `SELECT a.id::text AS assignment_id,a.role_id::text,r.version AS role_version
             FROM core_authz.role_assignment a
             JOIN core_authz.role_template r ON r.id=a.role_id
            WHERE a.tenant_id=$1::uuid
              AND a.principal_id=$2::uuid
              AND a.industry_context_id IS NOT DISTINCT FROM $3::uuid
              AND (a.membership_id IS NULL OR ($4::uuid IS NOT NULL AND a.membership_id=$4::uuid))
              AND (a.org_unit_id IS NULL OR ($5::uuid IS NOT NULL AND a.org_unit_id=$5::uuid))
              AND a.status='ACTIVE'
              AND (a.valid_from IS NULL OR a.valid_from<=CURRENT_TIMESTAMP)
              AND (a.valid_until IS NULL OR a.valid_until>CURRENT_TIMESTAMP)
              AND r.status='ACTIVE'
              AND r.owner_scope=$6::core_authz.role_owner_scope
              AND r.tenant_id=$1::uuid
              AND r.industry_context_id IS NOT DISTINCT FROM $3::uuid
            ORDER BY a.id`,
          [
            input.target.tenantId,
            input.target.principalId,
            input.target.industryContextId ?? null,
            input.target.membershipId ?? null,
            input.target.orgUnitId ?? null,
            ownerScope,
          ],
        );
        const roleIds=[...new Set(assignments.rows.map(row=>row.role_id))].sort();
        const permissions=await permissionRows(sql,roleIds);
        return toSource(assignments.rows,permissions);
      });
    } catch (error) {
      if (error instanceof AuthorizationSourceCompilerError) throw error;
      unavailable();
    }
  }

  async loadPlatform(input: {
    readonly requestContext: RequestContext;
    readonly target: PlatformAuthorizationCompilerTarget;
  }): Promise<AuthorizationCompilerSourceV1> {
    try {
      return await this.scopedSql.withContext(input.requestContext,async (sql)=>{
        const assignments=await sql.query<AssignmentRow>(
          `SELECT a.id::text AS assignment_id,a.role_id::text,r.version AS role_version
             FROM core_authz.platform_role_assignment a
             JOIN core_authz.role_template r ON r.id=a.role_id
            WHERE a.principal_id=$1::uuid
              AND a.status='ACTIVE'
              AND (a.valid_from IS NULL OR a.valid_from<=CURRENT_TIMESTAMP)
              AND (a.valid_until IS NULL OR a.valid_until>CURRENT_TIMESTAMP)
              AND r.status='ACTIVE'
              AND r.owner_scope='PLATFORM'
              AND r.tenant_id IS NULL
              AND r.industry_context_id IS NULL
            ORDER BY a.id`,
          [input.target.principalId],
        );
        const roleIds=[...new Set(assignments.rows.map(row=>row.role_id))].sort();
        const permissions=await permissionRows(sql,roleIds);
        return toSource(assignments.rows,permissions);
      });
    } catch (error) {
      if (error instanceof AuthorizationSourceCompilerError) throw error;
      unavailable();
    }
  }
}
