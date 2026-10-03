import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import pg from "pg";
import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";

// Mandatory disposable-database integration gate: absence is an error, never SKIP.
assert.ok(process.env.SBG_POSTGRES_TEST_URL, "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database");
const admin = new pg.Pool({ connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1 });
const role = `sbg_test_${randomBytes(8).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries(["home", "tenantA", "tenantB", "principalA", "principalB", "membershipA", "membershipB",
  "industryA1", "industryA2", "industryB1", "orgA", "orgB"].map((key) => [key, randomUUID()]));
let pool, database, scoped;

function context(tenantId = f.tenantA, industryContextId = f.industryA1) {
  return {
    requestId: randomUUID(), correlationId: randomUUID(), tenantId, industryContextId,
    principalId: tenantId === f.tenantA ? f.principalA : f.principalB, principalType: "HUMAN",
    scopeClass: industryContextId ? "TENANT_INDUSTRY" : "TENANT_CORE",
    dataHomeId: f.home, regionCode: "IN-TEST", roleIds: [], orgUnitPath: [],
  };
}

async function adminTransaction(work) {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await work(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

before(async () => {
  await adminTransaction(async (setup) => {
    // Only server-generated hex identifiers/secret are interpolated into role DDL.
    await setup.query(`CREATE ROLE ${role} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
    await setup.query(`GRANT sbg_app_rw TO ${role}`);
    await setup.query(`INSERT INTO platform_directory.data_home
      (id, code, region_code, jurisdiction_code, topology_class, status)
      VALUES ($1::uuid, $1::uuid::text, 'IN-TEST', 'IN', 'SHARED', 'ACTIVE')`, [f.home]);
    for (const [tenant, principal, membership, org] of [
      [f.tenantA, f.principalA, f.membershipA, f.orgA], [f.tenantB, f.principalB, f.membershipB, f.orgB],
    ]) {
      await setup.query(`INSERT INTO core_tenancy.tenant
        (id, tenant_code, legal_name, display_name, status, primary_industry_code, data_home_id, residency_region_code, created_at, updated_at)
        VALUES ($1::uuid, $1::uuid::text, 'Synthetic adapter fixture', 'Synthetic fixture', 'ACTIVE', 'RTL', $2, 'IN-TEST', now(), now())`, [tenant, f.home]);
      await setup.query(`INSERT INTO core_identity.platform_principal
        (id, principal_type, status, created_at, updated_at) VALUES ($1, 'HUMAN', 'ACTIVE', now(), now())`, [principal]);
      await setup.query(`INSERT INTO core_identity.tenant_membership
        (id, tenant_id, principal_id, status, created_at, updated_at) VALUES ($1, $2, $3, 'ACTIVE', now(), now())`, [membership, tenant, principal]);
      await setup.query(`INSERT INTO core_tenancy.org_unit
        (id, tenant_id, unit_type, code, name, path_key, status, created_at, updated_at)
        VALUES ($1::uuid, $2::uuid, 'BRANCH', 'TEST', 'Original fixture', $1::uuid::text, 'ACTIVE', now(), now())`, [org, tenant]);
    }
    for (const [industry, tenant, code, org] of [
      [f.industryA1, f.tenantA, "RTL", f.orgA], [f.industryA2, f.tenantA, "MFG", f.orgA], [f.industryB1, f.tenantB, "RTL", f.orgB],
    ]) {
      await setup.query(`INSERT INTO core_tenancy.industry_context
        (id, tenant_id, industry_code, status, is_primary, created_at, updated_at)
        VALUES ($1, $2, $3, 'ACTIVE', $4, now(), now())`, [industry, tenant, code, code === "RTL"]);
      await setup.query(`INSERT INTO core_tenancy.org_unit_industry
        (tenant_id, org_unit_id, industry_context_id, status) VALUES ($1, $2, $3, 'ACTIVE')`, [tenant, org, industry]);
    }
  });
  const url = new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username = role;
  url.password = password;
  pool = new pg.Pool({ connectionString: url.toString(), max: 1, connectionTimeoutMillis: 5000 });
  database = new PostgresDatabase(pool);
  scoped = new RequestScopedSql(database, { dataHomeId: f.home, regionCode: "IN-TEST" });
});

after(async () => {
  if (pool) await pool.end();
  try {
    await adminTransaction(async (cleanup) => {
      // Fixture IDs are unique to this run; no existing application records are targeted.
      await cleanup.query("DELETE FROM core_tenancy.org_unit_industry WHERE tenant_id = ANY($1::uuid[])", [[f.tenantA, f.tenantB]]);
      await cleanup.query("DELETE FROM core_tenancy.org_unit WHERE tenant_id = ANY($1::uuid[])", [[f.tenantA, f.tenantB]]);
      await cleanup.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id = ANY($1::uuid[])", [[f.tenantA, f.tenantB]]);
      await cleanup.query("DELETE FROM core_identity.tenant_membership WHERE tenant_id = ANY($1::uuid[])", [[f.tenantA, f.tenantB]]);
      await cleanup.query("DELETE FROM core_identity.platform_principal WHERE id = ANY($1::uuid[])", [[f.principalA, f.principalB]]);
      await cleanup.query("DELETE FROM core_tenancy.tenant WHERE id = ANY($1::uuid[])", [[f.tenantA, f.tenantB]]);
      await cleanup.query("DELETE FROM platform_directory.data_home WHERE id = $1", [f.home]);
      await cleanup.query(`DROP ROLE IF EXISTS ${role}`);
    });
  } finally {
    await admin.end();
  }
});

test("real PostgreSQL role and RLS enforce both Tenant and sibling Industry ownership", async () => {
  const rows = await scoped.withContext(context(), async (tx) => {
    const roleInfo = await tx.query("SELECT current_user AS role, current_setting('row_security') AS rls");
    assert.deepEqual(roleInfo.rows, [{ role: "sbg_app_rw", rls: "on" }]);
    for (const foreign of [f.industryA2, f.industryB1]) {
      assert.equal((await tx.query("SELECT * FROM core_tenancy.org_unit_industry WHERE industry_context_id=$1", [foreign])).rowCount, 0);
    }
    return (await tx.query("SELECT tenant_id,industry_context_id FROM core_tenancy.org_unit_industry")).rows;
  });
  assert.deepEqual(rows, [{ tenant_id: f.tenantA, industry_context_id: f.industryA1 }]);
});

test("Tenant Core/null Industry Context never expands to all Industry rows", async () => {
  await scoped.withContext({ ...context(), scopeClass: "TENANT_CORE", industryContextId: undefined }, async (tx) => {
    assert.equal((await tx.query("SELECT * FROM core_tenancy.org_unit_industry")).rowCount, 0);
    assert.deepEqual((await tx.query("SELECT id FROM core_tenancy.tenant")).rows, [{ id: f.tenantA }]);
  });
});

test("max-one-client pool alternates Tenants/Industries without stale scope or elevation", async () => {
  const pids = new Set();
  for (const [tenant, industry] of [[f.tenantA, f.industryA1], [f.tenantA, f.industryA2], [f.tenantB, f.industryB1], [f.tenantA, f.industryA1]]) {
    await scoped.withContext(context(tenant, industry), async (tx) => {
      pids.add((await tx.query("SELECT pg_backend_pid() AS pid")).rows[0].pid);
      const rows = await tx.query("SELECT tenant_id,industry_context_id FROM core_tenancy.org_unit_industry");
      assert.deepEqual(rows.rows, [{ tenant_id: tenant, industry_context_id: industry }]);
    });
    const client = await pool.connect();
    try {
      const settings = await client.query(`SELECT current_setting('app.tenant_id',true) AS tenant,
        current_setting('app.industry_context_id',true) AS industry,
        current_setting('app.principal_id',true) AS principal,
        current_setting('app.operator_elevation_id',true) AS elevation`);
      assert.ok(Object.values(settings.rows[0]).every((value) => !value));
    } finally { client.release(); }
  }
  assert.equal(pids.size, 1, "tests must actually reuse the same PostgreSQL backend");
  await database.transaction(async (tx) => {
    assert.equal((await tx.query("SELECT id FROM core_tenancy.tenant")).rowCount, 0);
    assert.equal((await tx.query("SELECT * FROM core_tenancy.org_unit_industry")).rowCount, 0);
  });
});

test("SQL failure and callback failure roll back mutations and leave the next request usable", async () => {
  for (const sqlFailure of [true, false]) {
    const domainError = new Error("business validation failed");
    await assert.rejects(scoped.withContext(context(), async (tx) => {
      await tx.query("UPDATE core_tenancy.org_unit SET name=$1 WHERE id=$2", ["Must rollback", f.orgA]);
      if (sqlFailure) await tx.query("SELECT 1/0 /* private diagnostic */");
      else throw domainError;
    }), (error) => sqlFailure
      ? error.code === "DATABASE_QUERY_FAILED" && !error.message.includes("private") && error.cause === undefined
      : error === domainError);
    assert.equal((await admin.query("SELECT name FROM core_tenancy.org_unit WHERE id=$1", [f.orgA])).rows[0].name, "Original fixture");
    assert.equal(await scoped.withContext(context(f.tenantB, f.industryB1), async (tx) =>
      (await tx.query("SELECT * FROM core_tenancy.org_unit_industry")).rowCount), 1);
  }
});

test("privileged logins are refused even after SET ROLE, and catalog writes stay forbidden", async () => {
  await assert.rejects(new PostgresDatabase(admin).transaction(async () => assert.fail("unsafe callback")),
    (error) => error.code === "DATABASE_ROLE_UNSAFE");
  await assert.rejects(scoped.withContext(context(), (tx) => tx.query("UPDATE core_commercial.plan SET name='forbidden'")),
    (error) => error.code === "DATABASE_QUERY_FAILED");
});

test("a swallowed SQL error cannot make an aborted transaction appear committed", async () => {
  await assert.rejects(scoped.withContext(context(), async (tx) => {
    try { await tx.query("SELECT 1/0"); } catch { /* deliberate hostile repository behavior */ }
    return "not committed";
  }), (error) => error.code === "DATABASE_TRANSACTION_FAILED");
});

test("parameter values stay data, and transaction handles expire after real commit", async () => {
  let leaked;
  const payload = "'; SET app.tenant_id = 'foreign'; --";
  const result = await scoped.withContext(context(), async (tx) => {
    leaked = tx;
    await tx.query("UPDATE core_tenancy.org_unit SET name=$1 WHERE id=$2", ["Committed fixture", f.orgA]);
    return (await tx.query("SELECT $1::text AS payload", [payload])).rows[0].payload;
  });
  assert.equal(result, payload);
  assert.equal((await admin.query("SELECT name FROM core_tenancy.org_unit WHERE id=$1", [f.orgA])).rows[0].name, "Committed fixture");
  await assert.rejects(leaked.query("SELECT * FROM core_tenancy.tenant"),
    (error) => error.code === "DATABASE_TRANSACTION_CLOSED");
});
