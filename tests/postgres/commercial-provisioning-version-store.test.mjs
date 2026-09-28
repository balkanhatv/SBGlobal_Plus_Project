import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import pg from "pg";

import {PostgresDatabase} from "../../dist/server/database/postgres-database.js";
import {RequestScopedSql} from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresCommercialProvisioningVersionStore,
} from "../../dist/server/commercial/postgres-commercial-provisioning-version-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);
const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const role=`sbg_comprovver_${randomBytes(8).toString("hex")}`;
const password=randomBytes(24).toString("hex");
const f=Object.fromEntries([
  "home","tenantA","tenantB","principal","industryA","industryB","route","plan","planVersion",
  "subscriptionA","snapshotCurrent","snapshotOld"
].map(key=>[key,randomUUID()]));
let pool,store;

function context(tenantId=f.tenantA,industryContextId){
  return {
    requestId:randomUUID(),
    correlationId:randomUUID(),
    tenantId,
    ...(industryContextId?{industryContextId}:{}),
    dataHomeId:f.home,
    regionCode:"IN-COMPROVVER",
    principalId:f.principal,
    principalType:"HUMAN",
    orgUnitPath:[],
    roleIds:[],
    scopeClass:industryContextId?"TENANT_INDUSTRY":"TENANT_CORE",
  };
}

before(async()=>{
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query(`CREATE ROLE ${role} LOGIN PASSWORD '${password}'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
    await c.query(`GRANT sbg_app_rw TO ${role}`);
    await c.query(`INSERT INTO platform_directory.data_home
      (id,code,region_code,jurisdiction_code,topology_class,status,routing_version,metadata_json)
      VALUES ($1,$1::uuid::text,'IN-COMPROVVER','IN','SHARED','ACTIVE',1,'{}')`,[f.home]);
    await c.query(`INSERT INTO core_tenancy.tenant
      (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
      VALUES
      ($1,$1::uuid::text,'A','A','ACTIVE','RTL',$3,'IN-COMPROVVER',now(),now()),
      ($2,$2::uuid::text,'B','B','ACTIVE','MFG',$3,'IN-COMPROVVER',now(),now())`,
      [f.tenantA,f.tenantB,f.home]);
    await c.query(`INSERT INTO core_identity.platform_principal
      (id,principal_type,status,created_at,updated_at)
      VALUES ($1,'HUMAN','ACTIVE',now(),now())`,[f.principal]);
    await c.query(`INSERT INTO core_tenancy.industry_context
      (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
      VALUES
      ($1,$3,'RTL','ACTIVE',true,now(),now()),
      ($2,$4,'MFG','ACTIVE',true,now(),now())`,
      [f.industryA,f.industryB,f.tenantA,f.tenantB]);
    await c.query(`INSERT INTO core_commercial.commercial_route_policy
      (id,code,self_serve_enabled,sales_assisted_enabled,version,status,created_at)
      VALUES ($1,$2,true,false,1,'ACTIVE',now())`,
      [f.route,`COMPROV-${f.route}`]);
    await c.query(`INSERT INTO core_commercial.plan
      (id,code,name,status,created_at,updated_at)
      VALUES ($1,$2,'Provisioning Versions','ACTIVE',now(),now())`,
      [f.plan,`PLAN-${f.plan}`]);
    await c.query(`INSERT INTO core_commercial.plan_version
      (id,plan_id,version_no,status,route_policy_id,entitlement_template_json,limit_set_json,
       billing_policy_json,support_class,published_at,created_by,created_at)
      VALUES ($1,$2,1,'ACTIVE',$3,'{}'::jsonb,'{}'::jsonb,'{}'::jsonb,'TEST',now(),$4,now())`,
      [f.planVersion,f.plan,f.route,f.principal]);
    await c.query(`INSERT INTO core_commercial.subscription
      (id,tenant_id,plan_version_id,state,billing_timezone,version,created_at,updated_at)
      VALUES ($1,$2,$3,'ACTIVE','Asia/Kolkata','9223372036854775807'::bigint,now(),now())`,
      [f.subscriptionA,f.tenantA,f.planVersion]);
    await c.query(`UPDATE core_tenancy.tenant SET current_subscription_id=$2,updated_at=now() WHERE id=$1`,
      [f.tenantA,f.subscriptionA]);
    await c.query(`INSERT INTO core_commercial.entitlement_snapshot
      (id,tenant_id,version,source_subscription_id,source_plan_version_id,compiled_at,valid_from,
       source_fingerprint,status,deny_set_json,metadata_json)
      VALUES
      ($1,$3,'9223372036854775807'::bigint,$4,$5,now(),now()+interval '30 days','current-future','CURRENT','[]','{}'),
      ($2,$3,7,$4,$5,now(),now()-interval '1 day','old','SUPERSEDED','[]','{}')`,
      [f.snapshotCurrent,f.snapshotOld,f.tenantA,f.subscriptionA,f.planVersion]);
    await c.query("COMMIT");
  }catch(error){await c.query("ROLLBACK");throw error}finally{c.release()}

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username=role;url.password=password;
  pool=new pg.Pool({connectionString:url.toString(),max:2,connectionTimeoutMillis:5000,statement_timeout:5000});
  store=new PostgresCommercialProvisioningVersionStore(
    new RequestScopedSql(new PostgresDatabase(pool),{dataHomeId:f.home,regionCode:"IN-COMPROVVER"}),
  );
});

after(async()=>{
  if(pool) await pool.end();
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query("DELETE FROM core_commercial.entitlement_snapshot WHERE tenant_id IN ($1,$2)",[f.tenantA,f.tenantB]);
    await c.query("UPDATE core_tenancy.tenant SET current_subscription_id=NULL,updated_at=now() WHERE id IN ($1,$2)",[f.tenantA,f.tenantB]);
    await c.query("DELETE FROM core_commercial.subscription WHERE tenant_id IN ($1,$2)",[f.tenantA,f.tenantB]);
    await c.query("DELETE FROM core_commercial.plan_version WHERE id=$1",[f.planVersion]);
    await c.query("DELETE FROM core_commercial.plan WHERE id=$1",[f.plan]);
    await c.query("DELETE FROM core_commercial.commercial_route_policy WHERE id=$1",[f.route]);
    await c.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id IN ($1,$2)",[f.tenantA,f.tenantB]);
    await c.query("DELETE FROM core_identity.platform_principal WHERE id=$1",[f.principal]);
    await c.query("DELETE FROM core_tenancy.tenant WHERE id IN ($1,$2)",[f.tenantA,f.tenantB]);
    await c.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
    await c.query(`DROP ROLE IF EXISTS ${role}`);
    await c.query("COMMIT");
  }catch(error){await c.query("ROLLBACK");throw error}finally{c.release();await admin.end()}
});

test("COMPROVVER-PG-001 Tenant Core returns frozen exact current version evidence",async()=>{
  const row=await store.loadForContext({requestContext:context()});
  assert.deepEqual(row,{
    tenantId:f.tenantA,
    currentSubscriptionId:f.subscriptionA,
    subscriptionVersion:"9223372036854775807",
    entitlementSnapshotId:f.snapshotCurrent,
    entitlementSnapshotVersion:"9223372036854775807",
  });
  assert.equal(Object.isFrozen(row),true);
});

test("COMPROVVER-PG-002 same-Tenant Industry context returns the same Tenant-owned evidence",async()=>{
  const core=await store.loadForContext({requestContext:context()});
  const industry=await store.loadForContext({requestContext:context(f.tenantA,f.industryA)});
  assert.deepEqual(industry,core);
});

test("COMPROVVER-PG-003 non-CURRENT snapshots are ignored and missing CURRENT remains absent",async()=>{
  const rowB=await store.loadForContext({requestContext:context(f.tenantB)});
  assert.deepEqual(rowB,{tenantId:f.tenantB});
  assert.equal("entitlementSnapshotId" in rowB,false);
  assert.equal("entitlementSnapshotVersion" in rowB,false);
});

test("COMPROVVER-PG-004 missing current Subscription pointer remains absent",async()=>{
  const row=await store.loadForContext({requestContext:context(f.tenantB,f.industryB)});
  assert.deepEqual(row,{tenantId:f.tenantB});
  assert.equal("currentSubscriptionId" in row,false);
  assert.equal("subscriptionVersion" in row,false);
});

test("COMPROVVER-PG-005 bigint versions preserve exact PostgreSQL decimal text",async()=>{
  const row=await store.loadForContext({requestContext:context()});
  assert.equal(row.subscriptionVersion,"9223372036854775807");
  assert.equal(row.entitlementSnapshotVersion,"9223372036854775807");
});

test("COMPROVVER-PG-006 malformed unsupported contexts fail closed and query is context-Tenant bound",async()=>{
  await assert.rejects(store.loadForContext({requestContext:{...context(),tenantId:"bad"}}));
  await assert.rejects(store.loadForContext({requestContext:{
    requestId:randomUUID(),correlationId:randomUUID(),principalId:f.principal,
    principalType:"PLATFORM_OPERATOR",orgUnitPath:[],roleIds:[],scopeClass:"PLATFORM_GLOBAL",
  }}));
  const a=await store.loadForContext({requestContext:context(f.tenantA)});
  const b=await store.loadForContext({requestContext:context(f.tenantB)});
  assert.equal(a.tenantId,f.tenantA);
  assert.equal(b.tenantId,f.tenantB);
  assert.notEqual(a.tenantId,b.tenantId);
});

test("COMPROVVER-PG-007 port exposes no list latest mutation compilation or authorization authority",()=>{
  for(const name of ["list","loadLatest","create","update","delete","compile","authorize"]){
    assert.equal(typeof store[name],"undefined",name);
  }
});
