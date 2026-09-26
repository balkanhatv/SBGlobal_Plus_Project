import type {
  AuthorizationCompilerInvalidationResult,
  AuthorizationCompilerPublicationResult,
  AuthorizationCompilerWriteStorePort,
  PlatformAuthorizationCompilerTarget,
  TenantAuthorizationCompilerTarget,
} from "../../core/authorization/compiler-write.js";
import { AuthorizationCompilerWriteError } from "../../core/authorization/compiler-write.js";
import { canonicalPermissionSetJsonV1 } from "../../core/authorization/policy-grammar.js";
import type { RequestContext } from "../../core/context/contracts.js";
import type { SqlTransaction } from "../database/contracts.js";
import { RequestScopedSql } from "../database/request-scoped-sql.js";

interface SubjectRow {
  readonly id: string;
  readonly current_snapshot_id: string | null;
  readonly current_version: string | number;
}

function stateError(message: string): never {
  throw new AuthorizationCompilerWriteError(
    "AUTHORIZATION_COMPILER_STATE_UNAVAILABLE",
    message,
  );
}

function issuedVersion(value: string | number): number {
  const version = Number(value);
  if (!Number.isSafeInteger(version) || version < 0 || version >= Number.MAX_SAFE_INTEGER) {
    stateError("Persisted Authorization compiler version is invalid.");
  }
  return version;
}

function exactSubject(
  rows: readonly SubjectRow[],
  name: string,
): SubjectRow {
  const row = rows[0];
  if (rows.length !== 1 || !row) stateError(`${name} compiler subject is unavailable or ambiguous.`);
  return row;
}

async function supersedeCurrent(
  transaction: SqlTransaction,
  table: "compiled_permission_snapshot" | "compiled_platform_permission_snapshot",
  subject: SubjectRow,
): Promise<void> {
  if (!subject.current_snapshot_id) return;
  const result = await transaction.query(
    `UPDATE core_authz.${table}
        SET status='SUPERSEDED',superseded_at=CURRENT_TIMESTAMP
      WHERE id=$1::uuid AND subject_id=$2::uuid
        AND version=$3::bigint AND status='CURRENT'`,
    [subject.current_snapshot_id, subject.id, issuedVersion(subject.current_version)],
  );
  if (result.rowCount !== 1) stateError("Current compiled Authorization snapshot could not be superseded.");
}

async function invalidateCurrent(
  transaction: SqlTransaction,
  input: {
    readonly subjectTable: "compiled_permission_subject" | "compiled_platform_permission_subject";
    readonly snapshotTable: "compiled_permission_snapshot" | "compiled_platform_permission_snapshot";
    readonly subject: SubjectRow;
  },
): Promise<AuthorizationCompilerInvalidationResult> {
  const version = issuedVersion(input.subject.current_version);
  if (!input.subject.current_snapshot_id) {
    return Object.freeze({
      subjectId: input.subject.id,
      permissionVersion: version,
      invalidated: false,
    });
  }

  const snapshot = await transaction.query(
    `UPDATE core_authz.${input.snapshotTable}
        SET status='INVALIDATED',invalidated_at=CURRENT_TIMESTAMP
      WHERE id=$1::uuid AND subject_id=$2::uuid
        AND version=$3::bigint AND status='CURRENT'`,
    [input.subject.current_snapshot_id, input.subject.id, version],
  );
  if (snapshot.rowCount !== 1) stateError("Current compiled Authorization snapshot could not be invalidated.");

  const subject = await transaction.query(
    `UPDATE core_authz.${input.subjectTable}
        SET current_snapshot_id=NULL
      WHERE id=$1::uuid
        AND current_version=$2::bigint
        AND current_snapshot_id=$3::uuid`,
    [input.subject.id, version, input.subject.current_snapshot_id],
  );
  if (subject.rowCount !== 1) stateError("Compiled Authorization current pointer could not be cleared.");

  await transaction.query("SET CONSTRAINTS ALL IMMEDIATE");
  return Object.freeze({
    subjectId: input.subject.id,
    permissionVersion: version,
    invalidated: true,
  });
}

async function loadTenantSubject(
  transaction: SqlTransaction,
  target: TenantAuthorizationCompilerTarget,
): Promise<SubjectRow> {
  const result = await transaction.query<SubjectRow>(
    `SELECT id::text,current_snapshot_id::text,current_version
       FROM core_authz.compiled_permission_subject
      WHERE tenant_id=$1::uuid
        AND industry_context_id IS NOT DISTINCT FROM $2::uuid
        AND principal_id=$3::uuid
        AND membership_id IS NOT DISTINCT FROM $4::uuid
        AND org_unit_id IS NOT DISTINCT FROM $5::uuid
        AND scope_class=$6
      FOR UPDATE`,
    [
      target.tenantId,
      target.industryContextId ?? null,
      target.principalId,
      target.membershipId ?? null,
      target.orgUnitId ?? null,
      target.scopeClass,
    ],
  );
  return exactSubject(result.rows, "Tenant");
}

async function loadPlatformSubject(
  transaction: SqlTransaction,
  target: PlatformAuthorizationCompilerTarget,
): Promise<SubjectRow> {
  const result = await transaction.query<SubjectRow>(
    `SELECT id::text,current_snapshot_id::text,current_version
       FROM core_authz.compiled_platform_permission_subject
      WHERE principal_id=$1::uuid
      FOR UPDATE`,
    [target.principalId],
  );
  return exactSubject(result.rows, "Platform");
}

function assertStoreContext(context: RequestContext): void {
  if (!context.principalId || context.principalType !== "SERVICE") {
    throw new AuthorizationCompilerWriteError(
      "AUTHORIZATION_COMPILER_SCOPE_INVALID",
      "Authorization compiler SQL requires a trusted service context.",
    );
  }
}

export class PostgresAuthorizationCompilerWriteStore
implements AuthorizationCompilerWriteStorePort {
  constructor(private readonly scopedSql: RequestScopedSql) {}

  async publishTenant(
    input: Parameters<AuthorizationCompilerWriteStorePort["publishTenant"]>[0],
  ): Promise<AuthorizationCompilerPublicationResult> {
    assertStoreContext(input.requestContext);
    try {
      const permissionJson = canonicalPermissionSetJsonV1(input.publication.permissionSet);
      return await this.scopedSql.withContext(input.requestContext, async (transaction) => {
        await transaction.query(
          `INSERT INTO core_authz.compiled_permission_subject
           (id,tenant_id,industry_context_id,principal_id,membership_id,org_unit_id,
            scope_class,current_version,created_at,updated_at)
           VALUES
           ($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5::uuid,$6::uuid,$7,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
           ON CONFLICT DO NOTHING`,
          [
            input.subjectCreateId,
            input.target.tenantId,
            input.target.industryContextId ?? null,
            input.target.principalId,
            input.target.membershipId ?? null,
            input.target.orgUnitId ?? null,
            input.target.scopeClass,
          ],
        );

        const subject = await loadTenantSubject(transaction, input.target);
        const currentVersion = issuedVersion(subject.current_version);
        const nextVersion = currentVersion + 1;

        await transaction.query("SET CONSTRAINTS ALL DEFERRED");
        await supersedeCurrent(transaction, "compiled_permission_snapshot", subject);

        const inserted = await transaction.query(
          `INSERT INTO core_authz.compiled_permission_snapshot
           (id,subject_id,version,status,role_ids,permission_schema_version,
            permission_set_json,source_fingerprint,compiled_at)
           VALUES ($1::uuid,$2::uuid,$3::bigint,'CURRENT',$4::uuid[],1,$5::jsonb,$6,CURRENT_TIMESTAMP)`,
          [
            input.snapshotId,
            subject.id,
            nextVersion,
            input.publication.roleIds,
            permissionJson,
            input.publication.sourceFingerprint,
          ],
        );
        if (inserted.rowCount !== 1) stateError("Compiled Tenant Authorization snapshot was not inserted.");

        const updated = await transaction.query(
          `UPDATE core_authz.compiled_permission_subject
              SET current_snapshot_id=$2::uuid,current_version=$3::bigint
            WHERE id=$1::uuid
              AND current_version=$4::bigint
              AND current_snapshot_id IS NOT DISTINCT FROM $5::uuid`,
          [subject.id, input.snapshotId, nextVersion, currentVersion, subject.current_snapshot_id],
        );
        if (updated.rowCount !== 1) stateError("Compiled Tenant Authorization pointer did not advance.");

        await transaction.query("SET CONSTRAINTS ALL IMMEDIATE");
        return Object.freeze({
          subjectId: subject.id,
          snapshotId: input.snapshotId,
          permissionVersion: nextVersion,
        });
      });
    } catch (error) {
      if (error instanceof AuthorizationCompilerWriteError) throw error;
      stateError("Tenant Authorization compiler persistence is unavailable.");
    }
  }

  async invalidateTenant(
    input: Parameters<AuthorizationCompilerWriteStorePort["invalidateTenant"]>[0],
  ): Promise<AuthorizationCompilerInvalidationResult> {
    assertStoreContext(input.requestContext);
    try {
      return await this.scopedSql.withContext(input.requestContext, async (transaction) => {
        await transaction.query("SET CONSTRAINTS ALL DEFERRED");
        const subject = await loadTenantSubject(transaction, input.target);
        return invalidateCurrent(transaction, {
          subjectTable: "compiled_permission_subject",
          snapshotTable: "compiled_permission_snapshot",
          subject,
        });
      });
    } catch (error) {
      if (error instanceof AuthorizationCompilerWriteError) throw error;
      stateError("Tenant Authorization invalidation is unavailable.");
    }
  }

  async publishPlatform(
    input: Parameters<AuthorizationCompilerWriteStorePort["publishPlatform"]>[0],
  ): Promise<AuthorizationCompilerPublicationResult> {
    assertStoreContext(input.requestContext);
    try {
      const permissionJson = canonicalPermissionSetJsonV1(input.publication.permissionSet);
      return await this.scopedSql.withContext(input.requestContext, async (transaction) => {
        await transaction.query(
          `INSERT INTO core_authz.compiled_platform_permission_subject
           (id,principal_id,current_version,created_at,updated_at)
           VALUES ($1::uuid,$2::uuid,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
           ON CONFLICT DO NOTHING`,
          [input.subjectCreateId, input.target.principalId],
        );

        const subject = await loadPlatformSubject(transaction, input.target);
        const currentVersion = issuedVersion(subject.current_version);
        const nextVersion = currentVersion + 1;

        await transaction.query("SET CONSTRAINTS ALL DEFERRED");
        await supersedeCurrent(transaction, "compiled_platform_permission_snapshot", subject);

        const inserted = await transaction.query(
          `INSERT INTO core_authz.compiled_platform_permission_snapshot
           (id,subject_id,version,status,role_ids,permission_schema_version,
            permission_set_json,source_fingerprint,compiled_at)
           VALUES ($1::uuid,$2::uuid,$3::bigint,'CURRENT',$4::uuid[],1,$5::jsonb,$6,CURRENT_TIMESTAMP)`,
          [
            input.snapshotId,
            subject.id,
            nextVersion,
            input.publication.roleIds,
            permissionJson,
            input.publication.sourceFingerprint,
          ],
        );
        if (inserted.rowCount !== 1) stateError("Compiled Platform Authorization snapshot was not inserted.");

        const updated = await transaction.query(
          `UPDATE core_authz.compiled_platform_permission_subject
              SET current_snapshot_id=$2::uuid,current_version=$3::bigint
            WHERE id=$1::uuid
              AND current_version=$4::bigint
              AND current_snapshot_id IS NOT DISTINCT FROM $5::uuid`,
          [subject.id, input.snapshotId, nextVersion, currentVersion, subject.current_snapshot_id],
        );
        if (updated.rowCount !== 1) stateError("Compiled Platform Authorization pointer did not advance.");

        await transaction.query("SET CONSTRAINTS ALL IMMEDIATE");
        return Object.freeze({
          subjectId: subject.id,
          snapshotId: input.snapshotId,
          permissionVersion: nextVersion,
        });
      });
    } catch (error) {
      if (error instanceof AuthorizationCompilerWriteError) throw error;
      stateError("Platform Authorization compiler persistence is unavailable.");
    }
  }

  async invalidatePlatform(
    input: Parameters<AuthorizationCompilerWriteStorePort["invalidatePlatform"]>[0],
  ): Promise<AuthorizationCompilerInvalidationResult> {
    assertStoreContext(input.requestContext);
    try {
      return await this.scopedSql.withContext(input.requestContext, async (transaction) => {
        await transaction.query("SET CONSTRAINTS ALL DEFERRED");
        const subject = await loadPlatformSubject(transaction, input.target);
        return invalidateCurrent(transaction, {
          subjectTable: "compiled_platform_permission_subject",
          snapshotTable: "compiled_platform_permission_snapshot",
          subject,
        });
      });
    } catch (error) {
      if (error instanceof AuthorizationCompilerWriteError) throw error;
      stateError("Platform Authorization invalidation is unavailable.");
    }
  }
}
