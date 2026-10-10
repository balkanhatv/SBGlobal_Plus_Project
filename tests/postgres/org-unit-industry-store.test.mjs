import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresOrgUnitIndustryStore } from "../../dist/server/tenancy/postgres-org-unit-industry-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_org_unit_industry_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const suffix = randomBytes(8).toString("hex");

const f = Object.fromEntries([
  "home","tenantA","tenantB","principalA","principalB","platformService",
  "industryA1","industryA2","industryB1",
  "orgA","orgA2","orgB","missingOrg",
].map((key) => [key, randomUUID()]));

let pool;
let scoped;
let store;

function industryA(industryContextId = f.industryA1) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-ORG-INDUSTRY",
    principalId: f.principalA,
    principalType: "HUMAN",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_INDUSTRY",
  });
}

function industryB() {
  return Object.freeze({
    ...industryA(f.industryB1),
    tenantId: f.tenantB,
    principalId: f.principalB,
  });
}

function tenantCoreA() {
  return Object.freeze({
    ...industryA(),
    industryContextId: undefined,
    scopeClass: "TENANT_CORE",
  });
}

function platformContext() {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    principalId: f.platformService,
    principalType: "SERVICE",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "PLATFORM_GLOBAL",
  });
}

before(async () => {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "CREATE ROLE " + role
        + " LOGIN PASSWORD '" + password
        + "' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS",
    );
    await client.query("GRANT sbg_app_rw TO " + role);

    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-ORG-INDUSTRY','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "OrgIndustry tenant A"],
      [f.tenantB, "EDU", "OrgIndustry tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-ORG-INDUSTRY',now(),now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [id, tenantId, code, primary] of [
      [f.industryA1, f.tenantA, "RTL", true],
      [f.industryA2, f.tenantA, "MFG", false],
      [f.industryB1, f.tenantB, "EDU", true],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.industry_context
          (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`,
        [id, tenantId, code, primary],
      );
    }

    for (const [id, tenantId, code, status] of [
      [f.orgA, f.tenantA, "ORG-A-" + suffix, "ACTIVE"],
      [f.orgA2, f.tenantA, "ORG-A2-" + suffix, "SUSPENDED"],
      [f.orgB, f.tenantB, "ORG-B-" + suffix, "ACTIVE"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.org_unit
          (id,tenant_id,parent_id,unit_type,code,name,path_key,status,row_version,created_at,updated_at)
         VALUES ($1,$2,NULL,'BRANCH',$3,$3,$3,$4,1,now(),now())`,
        [id, tenantId, code, status],
      );
    }

    await client.query(
      `INSERT INTO core_tenancy.org_unit_industry
        (tenant_id,org_unit_id,industry_context_id,status,config_json)
       VALUES
        ($1,$3,$5,'ACTIVE','{"feature":"alpha","nested":{"raw":1}}'::jsonb),
        ($1,$3,$6,'SUSPENDED','{"feature":"","array":["x",null,"x"]}'::jsonb),
        ($1,$4,$5,'ARCHIVED','{"archived":true}'::jsonb),
        ($2,$7,$8,'ACTIVE','{"feature":"beta"}'::jsonb)`,
      [f.tenantA,f.tenantB,f.orgA,f.orgA2,f.industryA1,f.industryA2,f.orgB,f.industryB1],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const url = new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username = role;
  url.password = password;
  pool = new pg.Pool({
    connectionString: url.toString(),
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  scoped = new RequestScopedSql(
    new PostgresDatabase(pool),
    {dataHomeId: f.home, regionCode: "IN-ORG-INDUSTRY"},
  );
  store = new PostgresOrgUnitIndustryStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_tenancy.org_unit_industry WHERE tenant_id=ANY($1::uuid[])",
      [[f.tenantA,f.tenantB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.org_unit WHERE id=ANY($1::uuid[])",
      [[f.orgA,f.orgA2,f.orgB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1,f.industryA2,f.industryB1]],
    );
    await client.query(
      "DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",
      [[f.tenantA,f.tenantB]],
    );
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1", [f.home]);
    await client.query("DROP ROLE IF EXISTS " + role);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await admin.end();
  }
});

test("ORGIND-PG-001 exact Industry link preserves immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: industryA(),
    orgUnitId: f.orgA,
  });

  assert.ok(row);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.orgUnitId, f.orgA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.status, "ACTIVE");
  assert.deepEqual(row.config, {feature:"alpha",nested:{raw:1}});
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.config), true);
  assert.equal(Object.isFrozen(row.config.nested), true);
});

test("ORGIND-PG-002 sibling Industry Context hides the link while owner can read it", async () => {
  const owner = await store.loadForContext({
    requestContext: industryA(),
    orgUnitId: f.orgA,
  });
  const sibling = await store.loadForContext({
    requestContext: industryA(f.industryA2),
    orgUnitId: f.orgA,
  });

  assert.ok(owner);
  assert.ok(sibling);
  assert.equal(owner.industryContextId, f.industryA1);
  assert.equal(owner.status, "ACTIVE");
  assert.equal(sibling.industryContextId, f.industryA2);
  assert.equal(sibling.status, "SUSPENDED");
  assert.notDeepEqual(sibling.config, owner.config);
});

test("ORGIND-PG-003 Tenant-Core, foreign-Tenant, and PLATFORM_GLOBAL contexts cannot bypass exact Industry scope", async () => {
  await assert.rejects(store.loadForContext({
    requestContext: tenantCoreA(),
    orgUnitId: f.orgA,
  }));

  assert.equal(await store.loadForContext({
    requestContext: industryB(),
    orgUnitId: f.orgA,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: platformContext(),
    orgUnitId: f.orgA,
  }));
});

test("ORGIND-PG-004 statuses and arbitrary config JSON remain raw non-authorizing evidence", async () => {
  const suspended = await store.loadForContext({
    requestContext: industryA(f.industryA2),
    orgUnitId: f.orgA,
  });
  const archived = await store.loadForContext({
    requestContext: industryA(),
    orgUnitId: f.orgA2,
  });

  assert.ok(suspended);
  assert.ok(archived);
  assert.equal(suspended.status, "SUSPENDED");
  assert.deepEqual(suspended.config, {array:["x",null,"x"],feature:""});
  assert.equal(archived.status, "ARCHIVED");
  assert.deepEqual(archived.config, {archived:true});
  assert.equal("effective" in suspended, false);
  assert.equal("authorized" in suspended, false);
  assert.equal("orgUnitActive" in suspended, false);
  assert.equal("industryActive" in suspended, false);
});

test("ORGIND-PG-005 same OrgUnit has independent exact-context links without cross-Industry fallback", async () => {
  const a1 = await store.loadForContext({
    requestContext: industryA(f.industryA1),
    orgUnitId: f.orgA,
  });
  const a2 = await store.loadForContext({
    requestContext: industryA(f.industryA2),
    orgUnitId: f.orgA,
  });

  assert.ok(a1);
  assert.ok(a2);
  assert.equal(a1.orgUnitId, a2.orgUnitId);
  assert.notEqual(a1.industryContextId, a2.industryContextId);
  assert.notEqual(a1.status, a2.status);

  assert.equal(await store.loadForContext({
    requestContext: industryA(f.industryA2),
    orgUnitId: f.orgA2,
  }), null);
});

test("ORGIND-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA(),
    orgUnitId: f.missingOrg,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: industryA(),
    orgUnitId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {...industryA(), dataHomeId: randomUUID()},
    orgUnitId: f.orgA,
  }));
});

test("ORGIND-PG-007 database DML and immutable Tenant/Industry ownership remain schema-owned while port adds no activation/authorization authority", async () => {
  const privileges = await scoped.withContext(industryA(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_tenancy.org_unit_industry','SELECT') AS can_select,
            has_table_privilege(current_user,'core_tenancy.org_unit_industry','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_tenancy.org_unit_industry','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_tenancy.org_unit_industry','DELETE') AS can_delete`,
  ));

  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_app_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, true);
  assert.equal(privileges.rows[0].can_update, true);
  assert.equal(privileges.rows[0].can_delete, true);

  await assert.rejects(scoped.withContext(industryA(), (tx) => tx.query(
    "UPDATE core_tenancy.org_unit_industry SET industry_context_id=$1::uuid WHERE tenant_id=$2::uuid AND org_unit_id=$3::uuid AND industry_context_id=$4::uuid",
    [f.industryA2,f.tenantA,f.orgA,f.industryA1],
  )));

  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.list, "undefined");
  assert.equal(typeof store.activate, "undefined");
  assert.equal(typeof store.deactivate, "undefined");
  assert.equal(typeof store.resolveHierarchy, "undefined");
  assert.equal(typeof store.resolveConfig, "undefined");
  assert.equal(typeof store.authorizeDocument, "undefined");
  assert.equal(typeof store.authorizeWorkflowAssignment, "undefined");
});
