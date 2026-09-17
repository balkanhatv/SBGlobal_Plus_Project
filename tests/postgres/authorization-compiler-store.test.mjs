import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import pg from "pg";

import {
  AuthorizationCompilerService,
  AuthorizationCompilerWriteError,
} from "../../dist/core/index.js";
import { PostgresAuthorizationCompilerDatabase } from "../../dist/server/database/postgres-authorization-compiler-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAuthorizationCompilerWriteStore } from "../../dist/server/authorization/postgres-authorization-compiler-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL, "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database");
const admin = new pg.Pool({ connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1 });
const loginRole = `sbg_authz_compiler_${randomBytes(8).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "home","tenant","industry","sibling","tenantTarget","platformTarget","actor","roleA","roleB",
].map((key) => [key, randomUUID()]));

let pool;
let service;

function tenantContext(industryContextId = f.industry) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenant,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-AUTHZ-COMPILER",
    principalId: f.actor,
    principalType: "SERVICE",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_INDUSTRY",
  });
}

function platformContext() {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    principalId: f.actor,
    principalType: "SERVICE",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "PLATFORM_GLOBAL",
  });
}

const tenantTarget = () => Object.freeze({
  tenantId: f.tenant,
  industryContextId: f.industry,
  principalId: f.tenantTarget,
  scopeClass: "TENANT_INDUSTRY",
});

before(async () => {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(`CREATE ROLE ${loginRole} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
    await client.query(`GRANT sbg_authorization_compiler_rw TO ${loginRole}`);

    await client.query(`INSERT INTO platform_directory.data_home
      (id,code,region_code,jurisdiction_code,topology_class,status)
      VALUES ($1::uuid,$1::uuid::text,'IN-AUTHZ-COMPILER','IN','SHARED','ACTIVE')`,[f.home]);
    await client.query(`INSERT INTO core_tenancy.tenant
      (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
      VALUES ($1::uuid,$1::uuid::text,'Compiler fixture','Compiler fixture','ACTIVE','RTL',$2::uuid,'IN-AUTHZ-COMPILER',now(),now())`,
      [f.tenant,f.home]);

    await client.query(`INSERT INTO core_identity.platform_principal
      (id,principal_type,status,created_at,updated_at)
      VALUES ($1::uuid,'HUMAN','ACTIVE',now(),now()),
             ($2::uuid,'PLATFORM_OPERATOR','ACTIVE',now(),now())`,
      [f.tenantTarget,f.platformTarget]);

    for (const [id,code,isPrimary] of [[f.industry,"RTL",true],[f.sibling,"MFG",false]]) {
      await client.query(`INSERT INTO core_tenancy.industry_context
        (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
        VALUES ($1::uuid,$2::uuid,$3,'ACTIVE',$4,now(),now())`,
        [id,f.tenant,code,isPrimary]);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const url = new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username = loginRole;
  url.password = password;
  pool = new pg.Pool({ connectionString: url.toString(), max: 1, connectionTimeoutMillis: 5000 });

  const compilerDatabase = new PostgresAuthorizationCompilerDatabase(pool);
  const scopedSql = new RequestScopedSql(compilerDatabase, {
    dataHomeId: f.home,
    regionCode: "IN-AUTHZ-COMPILER",
  });
  service = new AuthorizationCompilerService({
    store: new PostgresAuthorizationCompilerWriteStore(scopedSql),
    ids: { nextId: randomUUID },
  });
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE core_authz.compiled_permission_subject
      SET current_snapshot_id=NULL
      WHERE tenant_id=$1::uuid AND principal_id=$2::uuid`,[f.tenant,f.tenantTarget]);
    await client.query(`DELETE FROM core_authz.compiled_permission_snapshot
      WHERE subject_id IN (SELECT id FROM core_authz.compiled_permission_subject WHERE tenant_id=$1::uuid AND principal_id=$2::uuid)`,
      [f.tenant,f.tenantTarget]);
    await client.query(`DELETE FROM core_authz.compiled_permission_subject
      WHERE tenant_id=$1::uuid AND principal_id=$2::uuid`,[f.tenant,f.tenantTarget]);

    await client.query(`UPDATE core_authz.compiled_platform_permission_subject
      SET current_snapshot_id=NULL WHERE principal_id=$1::uuid`,[f.platformTarget]);
    await client.query(`DELETE FROM core_authz.compiled_platform_permission_snapshot
      WHERE subject_id IN (SELECT id FROM core_authz.compiled_platform_permission_subject WHERE principal_id=$1::uuid)`,
      [f.platformTarget]);
    await client.query(`DELETE FROM core_authz.compiled_platform_permission_subject
      WHERE principal_id=$1::uuid`,[f.platformTarget]);

    await client.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id=$1::uuid",[f.tenant]);
    await client.query("DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",[[f.tenantTarget,f.platformTarget]]);
    await client.query("DELETE FROM core_tenancy.tenant WHERE id=$1::uuid",[f.tenant]);
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1::uuid",[f.home]);
    await client.query(`DROP ROLE IF EXISTS ${loginRole}`);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await admin.end();
  }
});

test("compiler publishes Tenant+Industry snapshots monotonically, invalidates without decrement, then resumes at next version", async () => {
  const first = await service.publishTenant({
    requestContext: tenantContext(),
    target: tenantTarget(),
    roleIds: [f.roleB,f.roleA],
    permissionSet: { permissions: [{ code: "rtl.pos.sale.view", effect: "ALLOW" }] },
    sourceFingerprint: "tenant-compiler-source-v1",
  });
  assert.equal(first.permissionVersion,1);

  const second = await service.publishTenant({
    requestContext: tenantContext(),
    target: tenantTarget(),
    roleIds: [f.roleA],
    permissionSet: { permissions: [{ code: "rtl.pos.sale.view", effect: "DENY" }] },
    sourceFingerprint: "tenant-compiler-source-v2",
  });
  assert.equal(second.permissionVersion,2);

  const invalidated = await service.invalidateTenant({
    requestContext: tenantContext(),
    target: tenantTarget(),
  });
  assert.deepEqual(
    { permissionVersion: invalidated.permissionVersion, invalidated: invalidated.invalidated },
    { permissionVersion: 2, invalidated: true },
  );

  const third = await service.publishTenant({
    requestContext: tenantContext(),
    target: tenantTarget(),
    roleIds: [],
    permissionSet: { permissions: [] },
    sourceFingerprint: "tenant-compiler-source-v3",
  });
  assert.equal(third.permissionVersion,3);

  const persisted = await admin.query(`SELECT current_version,current_snapshot_id::text
      FROM core_authz.compiled_permission_subject
      WHERE tenant_id=$1::uuid AND industry_context_id=$2::uuid AND principal_id=$3::uuid`,
    [f.tenant,f.industry,f.tenantTarget]);
  assert.equal(Number(persisted.rows[0].current_version),3);
  assert.equal(persisted.rows[0].current_snapshot_id,third.snapshotId);

  const statuses = await admin.query(`SELECT version,status::text
      FROM core_authz.compiled_permission_snapshot
      WHERE subject_id=$1::uuid ORDER BY version`,[third.subjectId]);
  assert.deepEqual(statuses.rows.map(r=>[Number(r.version),r.status]),[
    [1,"SUPERSEDED"],[2,"INVALIDATED"],[3,"CURRENT"],
  ]);
});

test("compiler rejects sibling target before SQL and platform path publishes/invalidate separately", async () => {
  await assert.rejects(
    service.publishTenant({
      requestContext: tenantContext(f.sibling),
      target: tenantTarget(),
      roleIds: [],
      permissionSet: { permissions: [] },
      sourceFingerprint: "sibling-mismatch-source",
    }),
    (error) => error instanceof AuthorizationCompilerWriteError
      && error.code === "AUTHORIZATION_COMPILER_SCOPE_INVALID",
  );

  const first = await service.publishPlatform({
    requestContext: platformContext(),
    target: { principalId: f.platformTarget },
    roleIds: [f.roleA],
    permissionSet: { permissions: [{ code: "core.platform.tenant.view", effect: "ALLOW" }] },
    sourceFingerprint: "platform-compiler-source-v1",
  });
  assert.equal(first.permissionVersion,1);

  const invalidated = await service.invalidatePlatform({
    requestContext: platformContext(),
    target: { principalId: f.platformTarget },
  });
  assert.equal(invalidated.permissionVersion,1);
  assert.equal(invalidated.invalidated,true);

  const second = await service.publishPlatform({
    requestContext: platformContext(),
    target: { principalId: f.platformTarget },
    roleIds: [],
    permissionSet: { permissions: [] },
    sourceFingerprint: "platform-compiler-source-v2",
  });
  assert.equal(second.permissionVersion,2);

  const persisted = await admin.query(`SELECT current_version,current_snapshot_id::text
      FROM core_authz.compiled_platform_permission_subject
      WHERE principal_id=$1::uuid`,[f.platformTarget]);
  assert.equal(Number(persisted.rows[0].current_version),2);
  assert.equal(persisted.rows[0].current_snapshot_id,second.snapshotId);
});

test("compiler database role cannot mutate Authorization source truth", async () => {
  const compilerDatabase = new PostgresAuthorizationCompilerDatabase(pool);
  await assert.rejects(
    compilerDatabase.transaction((tx) => tx.query(
      "UPDATE core_authz.role_template SET name='forbidden compiler rewrite'",
    )),
    (error) => error.code === "DATABASE_QUERY_FAILED",
  );
});
