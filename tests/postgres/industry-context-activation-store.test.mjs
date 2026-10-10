import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import pg from "pg";

import {PostgresContextBootstrapDatabase} from "../../dist/server/database/postgres-context-bootstrap-database.js";
import {PostgresIndustryContextActivationStore} from "../../dist/server/tenancy/postgres-industry-context-activation-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);
const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const loginRole=`sbg_indctx_act_${randomBytes(8).toString("hex")}`;
const password=randomBytes(24).toString("hex");
const f=Object.fromEntries([
  "home","tenantA","tenantB","industryActive","industryPending",
  "industrySuspended","industryDisabled","industryB","missing"
].map(key=>[key,randomUUID()]));
let pool,store;

before(async()=>{
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query(`CREATE ROLE ${loginRole} LOGIN PASSWORD '${password}'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
    await c.query(`GRANT sbg_context_bootstrap_ro TO ${loginRole}`);
    await c.query(`INSERT INTO platform_directory.data_home
      (id,code,region_code,jurisdiction_code,topology_class,status,routing_version,metadata_json)
      VALUES ($1::uuid,$1::uuid::text,'IN-INDCTX-ACT','IN','SHARED','ACTIVE',1,'{}')`,[f.home]);
    await c.query(`INSERT INTO core_tenancy.tenant
      (id,tenant_code,legal_name,display_name,status,primary_industry_code,
       data_home_id,residency_region_code,created_at,updated_at)
      VALUES
      ($1,$1::uuid::text,'A','A','PROVISIONING','RTL',$3,'IN-INDCTX-ACT',now(),now()),
      ($2,$2::uuid::text,'B','B','PROVISIONING','MFG',$3,'IN-INDCTX-ACT',now(),now())`,
      [f.tenantA,f.tenantB,f.home]);
    await c.query(`INSERT INTO core_tenancy.industry_context
      (id,tenant_id,industry_code,status,is_primary,activation_version,created_at,updated_at)
      VALUES
      ($1,$6,'RTL','ACTIVE',true,'9223372036854775807'::bigint,now(),now()),
      ($2,$6,'EDU','PENDING',false,-7,now(),now()),
      ($3,$6,'MFG','SUSPENDED',false,0,now(),now()),
      ($4,$6,'HSP','DISABLED',false,3,now(),now()),
      ($5,$7,'MFG','ACTIVE',true,5,now(),now())`,
      [f.industryActive,f.industryPending,f.industrySuspended,f.industryDisabled,
       f.industryB,f.tenantA,f.tenantB]);
    await c.query("UPDATE core_tenancy.tenant SET status='ACTIVE' WHERE id IN ($1,$2)",[f.tenantA,f.tenantB]);
    await c.query("COMMIT");
  }catch(error){await c.query("ROLLBACK");throw error}finally{c.release()}

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username=loginRole;url.password=password;
  pool=new pg.Pool({connectionString:url.toString(),max:2,connectionTimeoutMillis:5000,statement_timeout:5000});
  store=new PostgresIndustryContextActivationStore(new PostgresContextBootstrapDatabase(pool));
});

after(async()=>{
  if(pool) await pool.end();
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id IN ($1,$2)",[f.tenantA,f.tenantB]);
    await c.query("DELETE FROM core_tenancy.tenant WHERE id IN ($1,$2)",[f.tenantA,f.tenantB]);
    await c.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
    await c.query(`DROP ROLE IF EXISTS ${loginRole}`);
    await c.query("COMMIT");
  }catch(error){await c.query("ROLLBACK");throw error}finally{c.release();await admin.end()}
});

test("INDCTX-ACT-PG-001 exact tuple returns frozen raw activation evidence",async()=>{
  const row=await store.loadExact({tenantId:f.tenantA,industryContextId:f.industryActive});
  assert.deepEqual(row,{
    id:f.industryActive,
    tenantId:f.tenantA,
    status:"ACTIVE",
    activationVersion:"9223372036854775807",
  });
  assert.equal(Object.isFrozen(row),true);
});

test("INDCTX-ACT-PG-002 foreign Tenant tuple hides an existing IndustryContext",async()=>{
  assert.equal(await store.loadExact({
    tenantId:f.tenantB,
    industryContextId:f.industryActive,
  }),null);
  const own=await store.loadExact({tenantId:f.tenantB,industryContextId:f.industryB});
  assert.ok(own);
  assert.equal(own.tenantId,f.tenantB);
});

test("INDCTX-ACT-PG-003 lifecycle and non-positive bigint versions remain raw",async()=>{
  const pending=await store.loadExact({tenantId:f.tenantA,industryContextId:f.industryPending});
  const suspended=await store.loadExact({tenantId:f.tenantA,industryContextId:f.industrySuspended});
  const disabled=await store.loadExact({tenantId:f.tenantA,industryContextId:f.industryDisabled});
  assert.deepEqual([pending.status,pending.activationVersion],["PENDING","-7"]);
  assert.deepEqual([suspended.status,suspended.activationVersion],["SUSPENDED","0"]);
  assert.deepEqual([disabled.status,disabled.activationVersion],["DISABLED","3"]);
});

test("INDCTX-ACT-PG-004 missing tuple returns null and malformed ids fail closed",async()=>{
  assert.equal(await store.loadExact({tenantId:f.tenantA,industryContextId:f.missing}),null);
  await assert.rejects(store.loadExact({tenantId:"bad",industryContextId:f.industryActive}));
  await assert.rejects(store.loadExact({tenantId:f.tenantA,industryContextId:"bad"}));
});

test("INDCTX-ACT-PG-005 fixed bootstrap role remains NOBYPASSRLS and SELECT-only",async()=>{
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    await client.query("SET LOCAL ROLE sbg_context_bootstrap_ro");
    const role=await client.query(`SELECT current_user AS role_name,rolbypassrls,rolsuper,
      has_table_privilege(current_user,'core_tenancy.industry_context','SELECT') AS can_select,
      has_table_privilege(current_user,'core_tenancy.industry_context','INSERT') AS can_insert,
      has_table_privilege(current_user,'core_tenancy.industry_context','UPDATE') AS can_update,
      has_table_privilege(current_user,'core_tenancy.industry_context','DELETE') AS can_delete
      FROM pg_roles WHERE rolname=current_user`);
    assert.equal(role.rows[0].role_name,"sbg_context_bootstrap_ro");
    assert.equal(role.rows[0].rolbypassrls,false);
    assert.equal(role.rows[0].rolsuper,false);
    assert.equal(role.rows[0].can_select,true);
    assert.equal(role.rows[0].can_insert,false);
    assert.equal(role.rows[0].can_update,false);
    assert.equal(role.rows[0].can_delete,false);
    await client.query("ROLLBACK");
  }finally{client.release()}
});

test("INDCTX-ACT-PG-006 port exposes no list current primary transition or mutation authority",()=>{
  assert.equal(typeof store.list,"undefined");
  assert.equal(typeof store.loadCurrent,"undefined");
  assert.equal(typeof store.loadPrimary,"undefined");
  assert.equal(typeof store.activate,"undefined");
  assert.equal(typeof store.deactivate,"undefined");
  assert.equal(typeof store.create,"undefined");
  assert.equal(typeof store.update,"undefined");
  assert.equal(typeof store.delete,"undefined");
});
