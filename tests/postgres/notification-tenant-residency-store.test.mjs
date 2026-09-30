import test, {before, after} from "node:test";
import assert from "node:assert/strict";
import {randomBytes, randomUUID} from "node:crypto";
import pg from "pg";

import {PostgresNotificationDatabase} from "../../dist/server/database/postgres-notification-database.js";
import {RequestScopedSql} from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresNotificationTenantResidencyStore,
} from "../../dist/server/notification/postgres-notification-tenant-residency-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1});
const role = "sbg_notification_residency_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "home","tenantA","tenantB","principalA","principalB","industryA1","industryA2","industryB1",
].map(key => [key, randomUUID()]));

let pool;
let store;

function contextA(industryContextId = f.industryA1) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-EVTRES",
    principalId: f.principalA,
    principalType: "HUMAN",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_INDUSTRY",
  });
}

function tenantCoreA() {
  return Object.freeze({...contextA(), industryContextId: undefined, scopeClass: "TENANT_CORE"});
}

before(async () => {
  const client=await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "CREATE ROLE "+role+" LOGIN PASSWORD '"+password+"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS",
    );
    await client.query("GRANT sbg_notification_worker_rw TO "+role);
    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-EVTRES','IN','SHARED','ACTIVE')`,
      [f.home],
    );
    for (const [tenantId,code,name,region] of [
      [f.tenantA,"RTL","Residency tenant A","IN-EVTRES"],
      [f.tenantB,"EDU","Residency tenant B","EU-EVTRES"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,$5,now(),now())`,
        [tenantId,name,code,f.home,region],
      );
    }
    for (const [principalId,name] of [
      [f.principalA,"Residency principal A"],
      [f.principalB,"Residency principal B"],
    ]) {
      await client.query(
        `INSERT INTO core_identity.platform_principal
          (id,principal_type,status,display_name,created_at,updated_at)
         VALUES ($1,'HUMAN','ACTIVE',$2,now(),now())`,
        [principalId,name],
      );
    }
    for (const [id,tenantId,code,primary] of [
      [f.industryA1,f.tenantA,"RTL",true],
      [f.industryA2,f.tenantA,"MFG",false],
      [f.industryB1,f.tenantB,"EDU",true],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.industry_context
          (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`,
        [id,tenantId,code,primary],
      );
    }
    await client.query("COMMIT");
  } catch(error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username=role;
  url.password=password;
  pool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:5000});
  store=new PostgresNotificationTenantResidencyStore(
    new RequestScopedSql(new PostgresNotificationDatabase(pool),{
      dataHomeId:f.home,
      regionCode:"IN-EVTRES",
    }),
  );
});

after(async () => {
  if(pool) await pool.end();
  const client=await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",[[f.industryA1,f.industryA2,f.industryB1]]);
    await client.query("DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",[[f.principalA,f.principalB]]);
    await client.query("DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",[[f.tenantA,f.tenantB]]);
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
    await client.query("DROP ROLE IF EXISTS "+role);
    await client.query("COMMIT");
  } catch(error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await admin.end();
  }
});

test("NOTIF-EVTRES-PG-001 exact Industry current Tenant residency read preserves immutable evidence", async () => {
  const result=await store.loadCurrentForContext({requestContext:contextA(),tenantId:f.tenantA});
  assert.ok(result);
  assert.equal(result.tenantId,f.tenantA);
  assert.equal(result.residencyRegionCode,"IN-EVTRES");
  assert.equal(Object.isFrozen(result),true);
});

test("NOTIF-EVTRES-PG-002 Tenant-Core and sibling-Industry contexts read the same Tenant residency", async () => {
  const core=await store.loadCurrentForContext({requestContext:tenantCoreA(),tenantId:f.tenantA});
  const sibling=await store.loadCurrentForContext({requestContext:contextA(f.industryA2),tenantId:f.tenantA});
  assert.ok(core);
  assert.ok(sibling);
  assert.equal(core.residencyRegionCode,"IN-EVTRES");
  assert.equal(sibling.residencyRegionCode,"IN-EVTRES");
});

test("NOTIF-EVTRES-PG-003 foreign-Tenant input/context cannot read another Tenant residency", async () => {
  await assert.rejects(store.loadCurrentForContext({
    requestContext:tenantCoreA(),
    tenantId:f.tenantB,
  }));
});

test("NOTIF-EVTRES-PG-004 malformed/mismatched context/id or database-route mismatch fails closed", async () => {
  await assert.rejects(store.loadCurrentForContext({
    requestContext:tenantCoreA(),
    tenantId:"not-a-uuid",
  }));

  await assert.rejects(store.loadCurrentForContext({
    requestContext:{...tenantCoreA(),dataHomeId:randomUUID()},
    tenantId:f.tenantA,
  }));
});
