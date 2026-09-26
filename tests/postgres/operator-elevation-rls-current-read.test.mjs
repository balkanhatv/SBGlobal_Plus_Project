import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const appRole = "sbg_opelev_rls_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");

const f = Object.fromEntries([
  "home",
  "tenant",
  "industry",
  "operator",
  "approver",
  "coreActive",
  "industryActive",
  "pending",
  "revoked",
  "expiredByTime",
  "wrongSelected",
  "wrongPrincipal",
  "wrongTenant",
  "wrongIndustry",
  "profileCore",
  "profileIndustry",
  "profilePending",
  "profileRevoked",
  "profileExpired",
].map((key) => [key, randomUUID()]));

let pool;
let database;

async function adminTransaction(work) {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await work(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function visible(rowId, {
  selectedElevationId = rowId,
  principalId = f.operator,
  tenantId = f.tenant,
  industryContextId,
} = {}) {
  return database.transaction(async (tx) => {
    await tx.query(
      `SELECT
         set_config('app.tenant_id',$1,true),
         set_config('app.industry_context_id',$2,true),
         set_config('app.scope_class',$3,true),
         set_config('app.principal_id',$4,true),
         set_config('app.operator_elevation_id',$5,true)`,
      [
        tenantId,
        industryContextId ?? "",
        industryContextId ? "TENANT_INDUSTRY" : "TENANT_CORE",
        principalId,
        selectedElevationId,
      ],
    );
    const result = await tx.query(
      "SELECT id::text FROM core_authz.operator_elevation WHERE id=$1::uuid",
      [rowId],
    );
    return result.rows.map((row) => row.id);
  });
}

before(async () => {
  await adminTransaction(async (setup) => {
    await setup.query(
      "CREATE ROLE " + appRole
        + " LOGIN PASSWORD '" + password
        + "' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS",
    );
    await setup.query("GRANT sbg_app_rw TO " + appRole);

    await setup.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-OPELEV-RLS','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    await setup.query(
      `INSERT INTO core_tenancy.tenant
        (id,tenant_code,legal_name,display_name,status,primary_industry_code,
         data_home_id,residency_region_code,created_at,updated_at)
       VALUES ($1::uuid,$1::uuid::text,'Operator elevation RLS fixture',
         'Operator elevation RLS fixture','ACTIVE','RTL',$2::uuid,
         'IN-OPELEV-RLS',now(),now())`,
      [f.tenant, f.home],
    );

    await setup.query(
      `INSERT INTO core_tenancy.industry_context
        (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
       VALUES ($1::uuid,$2::uuid,'RTL','ACTIVE',true,now(),now())`,
      [f.industry, f.tenant],
    );

    await setup.query(
      `INSERT INTO core_identity.platform_principal
        (id,principal_type,status,display_name,auth_epoch,created_at,updated_at)
       VALUES
        ($1::uuid,'PLATFORM_OPERATOR','ACTIVE','RLS operator',1,now(),now()),
        ($2::uuid,'PLATFORM_OPERATOR','ACTIVE','RLS approver',1,now(),now())`,
      [f.operator, f.approver],
    );

    await setup.query(
      `INSERT INTO core_authz.operator_elevation
        (id,operator_principal_id,tenant_id,industry_context_id,purpose_code,
         ticket_reference,approved_by,starts_at,expires_at,status,
         permission_profile_id,created_at,revoked_at)
       VALUES
        ($1::uuid,$6::uuid,$8::uuid,NULL,'SUPPORT',NULL,$7::uuid,
         now()-interval '1 hour',now()+interval '1 hour','ACTIVE',
         $10::uuid,now()-interval '2 hours',NULL),
        ($2::uuid,$6::uuid,$8::uuid,$9::uuid,'SUPPORT',NULL,$7::uuid,
         now()-interval '1 hour',now()+interval '1 hour','ACTIVE',
         $11::uuid,now()-interval '2 hours',NULL),
        ($3::uuid,$6::uuid,$8::uuid,NULL,'SUPPORT',NULL,NULL,
         now()+interval '1 hour',now()+interval '2 hours','PENDING',
         $12::uuid,now()-interval '2 hours',NULL),
        ($4::uuid,$6::uuid,$8::uuid,NULL,'SUPPORT',NULL,$7::uuid,
         now()-interval '1 hour',now()+interval '1 hour','REVOKED',
         $13::uuid,now()-interval '2 hours',now()-interval '30 minutes'),
        ($5::uuid,$6::uuid,$8::uuid,NULL,'SUPPORT',NULL,$7::uuid,
         now()-interval '2 hours',now()-interval '1 hour','ACTIVE',
         $14::uuid,now()-interval '3 hours',NULL)`,
      [
        f.coreActive,
        f.industryActive,
        f.pending,
        f.revoked,
        f.expiredByTime,
        f.operator,
        f.approver,
        f.tenant,
        f.industry,
        f.profileCore,
        f.profileIndustry,
        f.profilePending,
        f.profileRevoked,
        f.profileExpired,
      ],
    );
  });

  const url = new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username = appRole;
  url.password = password;
  pool = new pg.Pool({
    connectionString: url.toString(),
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  database = new PostgresDatabase(pool);
});

after(async () => {
  if (pool) await pool.end();
  try {
    await adminTransaction(async (cleanup) => {
      await cleanup.query(
        "DELETE FROM core_authz.operator_elevation WHERE id=ANY($1::uuid[])",
        [[f.coreActive,f.industryActive,f.pending,f.revoked,f.expiredByTime]],
      );
      await cleanup.query(
        "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
        [[f.operator, f.approver]],
      );
      await cleanup.query(
        "DELETE FROM core_tenancy.industry_context WHERE id=$1::uuid",
        [f.industry],
      );
      await cleanup.query(
        "DELETE FROM core_tenancy.tenant WHERE id=$1::uuid",
        [f.tenant],
      );
      await cleanup.query(
        "DELETE FROM platform_directory.data_home WHERE id=$1::uuid",
        [f.home],
      );
      await cleanup.query("DROP ROLE IF EXISTS " + appRole);
    });
  } finally {
    await admin.end();
  }
});

test("OPELEV-RLS-PG-001 exact selected id, principal, Tenant and current window expose Tenant-Core row", async () => {
  assert.deepEqual(await visible(f.coreActive), [f.coreActive]);
});

test("OPELEV-RLS-PG-002 Industry-targeted row is visible only under exact Industry setting", async () => {
  assert.deepEqual(
    await visible(f.industryActive, {industryContextId: f.industry}),
    [f.industryActive],
  );
  assert.deepEqual(
    await visible(f.industryActive, {industryContextId: f.wrongIndustry}),
    [],
  );
});

test("OPELEV-RLS-PG-003 wrong selected elevation id yields zero rows", async () => {
  assert.deepEqual(
    await visible(f.coreActive, {selectedElevationId: f.wrongSelected}),
    [],
  );
});

test("OPELEV-RLS-PG-004 wrong principal or Tenant yields zero rows", async () => {
  assert.deepEqual(
    await visible(f.coreActive, {principalId: f.wrongPrincipal}),
    [],
  );
  assert.deepEqual(
    await visible(f.coreActive, {tenantId: f.wrongTenant}),
    [],
  );
});

test("OPELEV-RLS-PG-005 missing/wrong Industry denies targeted row while NULL-Industry Tenant-Core row remains migration-compatible", async () => {
  assert.deepEqual(await visible(f.industryActive), []);
  assert.deepEqual(
    await visible(f.industryActive, {industryContextId: f.wrongIndustry}),
    [],
  );
  assert.deepEqual(
    await visible(f.coreActive, {industryContextId: f.industry}),
    [f.coreActive],
  );
});

test("OPELEV-RLS-PG-006 PENDING, REVOKED and expired-by-time rows remain invisible with otherwise exact settings", async () => {
  for (const rowId of [f.pending, f.revoked, f.expiredByTime]) {
    assert.deepEqual(await visible(rowId), []);
  }
});

test("OPELEV-RLS-PG-007 empty elevation scope closes app visibility and app role has no control-plane mutation privilege", async () => {
  const result = await database.transaction(async (tx) => {
    await tx.query(
      `SELECT
         set_config('app.tenant_id',$1,true),
         set_config('app.industry_context_id','',true),
         set_config('app.scope_class','TENANT_CORE',true),
         set_config('app.principal_id',$2,true),
         set_config('app.operator_elevation_id','',true)`,
      [f.tenant, f.operator],
    );
    const rows = await tx.query(
      "SELECT id::text FROM core_authz.operator_elevation WHERE id=$1::uuid",
      [f.coreActive],
    );
    const privileges = await tx.query(
      `SELECT
         has_table_privilege(current_user,'core_authz.operator_elevation','INSERT') AS can_insert,
         has_table_privilege(current_user,'core_authz.operator_elevation','UPDATE') AS can_update,
         has_table_privilege(current_user,'core_authz.operator_elevation','DELETE') AS can_delete`,
    );
    return {rows, privileges};
  });

  assert.equal(result.rows.rowCount, 0);
  assert.equal(result.privileges.rowCount, 1);
  assert.equal(result.privileges.rows[0].can_insert, false);
  assert.equal(result.privileges.rows[0].can_update, false);
  assert.equal(result.privileges.rows[0].can_delete, false);
});
