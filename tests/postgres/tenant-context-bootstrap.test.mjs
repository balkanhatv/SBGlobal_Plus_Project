import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import { randomBytes,randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresContextBootstrapDatabase } from "../../dist/server/database/postgres-context-bootstrap-database.js";
import { PostgresTenantContextAdapter } from "../../dist/server/tenancy/postgres-tenant-context.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);
const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const loginRole=`sbg_ctx_boot_${randomBytes(8).toString("hex")}`;
const password=randomBytes(24).toString("hex");
const f=Object.fromEntries([
 "home","tenantA","tenantB","industryA","industryB","orgRoot","orgChild",
 "principal","membershipA","membershipB"
].map(key=>[key,randomUUID()]));
let pool,adapter;

before(async()=>{
 const c=await admin.connect();
 try{
  await c.query("BEGIN");
  await c.query(`CREATE ROLE ${loginRole} LOGIN PASSWORD '${password}'
    NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
  await c.query(`GRANT sbg_context_bootstrap_ro TO ${loginRole}`);
  await c.query(`INSERT INTO platform_directory.data_home
    (id,code,region_code,jurisdiction_code,topology_class,status,routing_version,metadata_json)
    VALUES ($1::uuid,$1::uuid::text,'IN-CTX','IN','SHARED','ACTIVE',7,'{}')`,[f.home]);
  await c.query(`INSERT INTO core_tenancy.tenant
    (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
    VALUES
    ($1,'CTX-A','A','Tenant A','PROVISIONING','RTL',$3,'IN-CTX',now(),now()),
    ($2,'CTX-B','B','Tenant B','PROVISIONING','MFG',$3,'IN-CTX',now(),now())`,
    [f.tenantA,f.tenantB,f.home]);
  await c.query(`INSERT INTO core_tenancy.industry_context
    (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
    VALUES
    ($1,$3,'RTL','ACTIVE',true,now(),now()),
    ($2,$4,'MFG','ACTIVE',true,now(),now())`,
    [f.industryA,f.industryB,f.tenantA,f.tenantB]);
  await c.query(`INSERT INTO core_identity.platform_principal
    (id,principal_type,status,display_name,auth_epoch,created_at,updated_at)
    VALUES ($1,'HUMAN','ACTIVE','Context User',1,now(),now())`,[f.principal]);
  await c.query(`INSERT INTO core_tenancy.org_unit
    (id,tenant_id,parent_id,unit_type,code,name,path_key,status,row_version,created_at,updated_at)
    VALUES
    ($1,$3,NULL,'BRANCH','ROOT','Root','root','ACTIVE',1,now(),now()),
    ($2,$3,$1,'DEPARTMENT','CHILD','Child','root/child','ACTIVE',1,now(),now())`,
    [f.orgRoot,f.orgChild,f.tenantA]);
  await c.query(`INSERT INTO core_identity.tenant_membership
    (id,tenant_id,principal_id,status,default_org_unit_id,membership_version,created_at,updated_at)
    VALUES
    ($1,$3,$5,'ACTIVE',$6,1,now(),now()),
    ($2,$4,$5,'ACTIVE',NULL,1,now(),now())`,
    [f.membershipA,f.membershipB,f.tenantA,f.tenantB,f.principal,f.orgChild]);
  await c.query(`UPDATE core_tenancy.tenant SET status='ACTIVE'
    WHERE id IN ($1,$2)`,[f.tenantA,f.tenantB]);
  await c.query("SET CONSTRAINTS ALL IMMEDIATE");
  await c.query("COMMIT");
 }catch(error){await c.query("ROLLBACK");throw error}finally{c.release()}

 const url=new URL(process.env.SBG_POSTGRES_TEST_URL);
 url.username=loginRole;url.password=password;
 pool=new pg.Pool({connectionString:url.toString(),max:4,connectionTimeoutMillis:5000});
 adapter=new PostgresTenantContextAdapter(new PostgresContextBootstrapDatabase(pool));
});

after(async()=>{
 if(pool) await pool.end();
 const c=await admin.connect();
 try{
  await c.query("BEGIN");
  await c.query("DELETE FROM core_identity.tenant_membership WHERE principal_id=$1",[f.principal]);
  await c.query("DELETE FROM core_tenancy.org_unit WHERE tenant_id=$1",[f.tenantA]);
  await c.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id IN ($1,$2)",[f.tenantA,f.tenantB]);
  await c.query("DELETE FROM core_identity.platform_principal WHERE id=$1",[f.principal]);
  await c.query("DELETE FROM core_tenancy.tenant WHERE id IN ($1,$2)",[f.tenantA,f.tenantB]);
  await c.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
  await c.query(`DROP ROLE IF EXISTS ${loginRole}`);
  await c.query("COMMIT");
 }catch(error){await c.query("ROLLBACK");throw error}finally{c.release();await admin.end()}
});

test("human with multiple memberships requires an explicit Tenant selector",async()=>{
 assert.equal(await adapter.resolveTenant({principalId:f.principal}),null);
 const selected=await adapter.resolveTenant({principalId:f.principal,selector:"CTX-A"});
 assert.equal(selected.id,f.tenantA);
 assert.equal(selected.displayKey,"CTX-A");
 assert.equal(selected.displayName,"Tenant A");
});

test("human selector cannot resolve a Tenant without membership and machine binding stays exact",async()=>{
 const stranger=randomUUID();
 assert.equal(await adapter.resolveTenant({principalId:stranger,selector:"CTX-A"}),null);
 assert.equal(await adapter.resolveTenant({
   principalId:f.principal,machineBoundTenantId:f.tenantA,selector:"CTX-B",
 }),null);
 const machine=await adapter.resolveTenant({
   principalId:f.principal,machineBoundTenantId:f.tenantA,selector:f.tenantA,
 });
 assert.equal(machine.id,f.tenantA);
});

test("membership, Industry selector and sibling Tenant isolation are exact",async()=>{
 const membership=await adapter.findMembership({tenantId:f.tenantA,principalId:f.principal});
 assert.equal(membership.id,f.membershipA);
 assert.equal(membership.defaultOrgUnitId,f.orgChild);

 const industry=await adapter.resolveIndustryContext({tenantId:f.tenantA,selector:"retail"});
 assert.equal(industry.id,f.industryA);
 assert.equal(industry.tenantId,f.tenantA);
 assert.equal(industry.industryCode,"RTL");

 assert.equal(await adapter.resolveIndustryContext({
   tenantId:f.tenantA,selector:f.industryB,
 }),null);
});

test("default and explicit OrgUnit resolution returns server-derived root-to-leaf UUID path",async()=>{
 const membership=await adapter.findMembership({tenantId:f.tenantA,principalId:f.principal});
 const byDefault=await adapter.resolveOrgUnit({tenantId:f.tenantA,membership});
 assert.deepEqual(byDefault.path,[f.orgRoot,f.orgChild]);
 const explicit=await adapter.resolveOrgUnit({tenantId:f.tenantA,selector:"CHILD"});
 assert.deepEqual(explicit.path,[f.orgRoot,f.orgChild]);
});

test("DataHome is read from server directory with routing version",async()=>{
 const home=await adapter.resolveDataHome(f.tenantA);
 assert.deepEqual(home,{id:f.home,regionCode:"IN-CTX",routingVersion:7});
});

test("bootstrap role is read-only and cannot access API credentials",async()=>{
 const client=await pool.connect();
 try{
   await client.query("SET ROLE sbg_context_bootstrap_ro");
   await assert.rejects(
     client.query("UPDATE core_tenancy.tenant SET display_name='x' WHERE id=$1",[f.tenantA]),
     error=>String(error.code)==="42501",
   );
   await assert.rejects(
     client.query("SELECT count(*) FROM core_identity.api_credential"),
     error=>String(error.code)==="42501",
   );
 }finally{
   await client.query("RESET ROLE").catch(()=>undefined);
   client.release();
 }
});
