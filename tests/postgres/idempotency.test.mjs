import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import pg from "pg";

import { IdempotencyRuntimeError, IdempotencyService } from "../../dist/core/index.js";
import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresIdempotencyStore } from "../../dist/server/api/postgres-idempotency-store.js";
import { Sha256IdempotencyDigest } from "../../dist/server/api/sha256-idempotency-digest.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);
const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const loginRole=`sbg_idem_${randomBytes(8).toString("hex")}`, password=randomBytes(24).toString("hex");
const f=Object.fromEntries(["home","tenant","industry","sibling","principal","membership"].map(k=>[k,randomUUID()]));
let pool,service,scoped;

const operation=Object.freeze({
  operationId:"rtl.pos.sale.create",module:"RTL-POS",scopeClass:"TENANT_INDUSTRY",kind:"COMMAND",
  permissionCode:"rtl.pos.sale.create",inputSchemaVersion:1,outputSchemaVersion:1,
  idempotencyPolicy:"REQUIRED",rateClass:"AUTH_STANDARD",auditClass:"STANDARD",
  domainService:"RetailSaleService.create",emittedEvents:[],errorCodes:[],
});
function context(industryContextId=f.industry,scopeClass="TENANT_INDUSTRY"){
  return Object.freeze({
    requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenant,
    ...(industryContextId?{industryContextId}:{}),dataHomeId:f.home,regionCode:"IN-IDEMP",
    principalId:f.principal,principalType:"HUMAN",membershipId:f.membership,
    orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass,
  });
}
function makeService(){
  return new IdempotencyService({
    store:new PostgresIdempotencyStore(scoped),
    digest:new Sha256IdempotencyDigest(),
    runtime:{now:()=>new Date("2026-09-18T08:00:00Z"),nextId:randomUUID},
    window:{expiresAt:()=>new Date("2026-09-19T08:00:00Z")},
  });
}

before(async()=>{
 const c=await admin.connect();
 try{
  await c.query("BEGIN");
  await c.query(`CREATE ROLE ${loginRole} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
  await c.query(`GRANT sbg_app_rw TO ${loginRole}`);
  await c.query(`INSERT INTO platform_directory.data_home
    (id,code,region_code,jurisdiction_code,topology_class,status)
    VALUES ($1::uuid,$1::uuid::text,'IN-IDEMP','IN','SHARED','ACTIVE')`,[f.home]);
  await c.query(`INSERT INTO core_tenancy.tenant
    (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
    VALUES ($1::uuid,$1::uuid::text,'Idempotency','Idempotency','ACTIVE','RTL',$2::uuid,'IN-IDEMP',now(),now())`,[f.tenant,f.home]);
  await c.query(`INSERT INTO core_identity.platform_principal(id,principal_type,status,created_at,updated_at)
    VALUES ($1::uuid,'HUMAN','ACTIVE',now(),now())`,[f.principal]);
  await c.query(`INSERT INTO core_identity.tenant_membership
    (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
    VALUES ($1,$2,$3,'ACTIVE',1,now(),now())`,[f.membership,f.tenant,f.principal]);
  await c.query(`INSERT INTO core_tenancy.industry_context
    (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
    VALUES ($1,$3,'RTL','ACTIVE',true,now(),now()),($2,$3,'MFG','ACTIVE',false,now(),now())`,
    [f.industry,f.sibling,f.tenant]);
  await c.query("COMMIT");
 }catch(e){await c.query("ROLLBACK");throw e}finally{c.release()}

 const url=new URL(process.env.SBG_POSTGRES_TEST_URL);url.username=loginRole;url.password=password;
 pool=new pg.Pool({connectionString:url.toString(),max:4,connectionTimeoutMillis:5000});
 scoped=new RequestScopedSql(new PostgresDatabase(pool),{dataHomeId:f.home,regionCode:"IN-IDEMP"});
 service=makeService();
});

after(async()=>{
 if(pool) await pool.end();
 const c=await admin.connect();
 try{
  await c.query("BEGIN");
  await c.query("DELETE FROM core_integration.idempotency_record WHERE tenant_id=$1",[f.tenant]);
  await c.query("DELETE FROM core_identity.tenant_membership WHERE id=$1",[f.membership]);
  await c.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id=$1",[f.tenant]);
  await c.query("DELETE FROM core_identity.platform_principal WHERE id=$1",[f.principal]);
  await c.query("DELETE FROM core_tenancy.tenant WHERE id=$1",[f.tenant]);
  await c.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
  await c.query(`DROP ROLE IF EXISTS ${loginRole}`);
  await c.query("COMMIT");
 }catch(e){await c.query("ROLLBACK");throw e}finally{c.release();await admin.end()}
});

test("idempotency starts, blocks duplicate in-progress, completes, then replays reference",async()=>{
 const first=await service.begin({requestContext:context(),operation,idempotencyKey:"pay-1",canonicalValidatedInput:'{"amount":10}'});
 assert.equal(first.kind,"STARTED");
 const second=await service.begin({requestContext:context(),operation,idempotencyKey:"pay-1",canonicalValidatedInput:'{"amount":10}'});
 assert.equal(second.kind,"IN_PROGRESS");
 await service.completeSuccess({requestContext:context(),started:first,responseStatus:"201",responseReference:"sale:1"});
 const replay=await service.begin({requestContext:context(),operation,idempotencyKey:"pay-1",canonicalValidatedInput:'{"amount":10}'});
 assert.deepEqual({kind:replay.kind,status:replay.responseStatus,reference:replay.responseReference},
  {kind:"REPLAY",status:"201",reference:"sale:1"});
});

test("same scoped key with different canonical request conflicts",async()=>{
 const started=await service.begin({requestContext:context(),operation,idempotencyKey:"pay-conflict",canonicalValidatedInput:'{"amount":10}'});
 assert.equal(started.kind,"STARTED");
 await assert.rejects(service.begin({
   requestContext:context(),operation,idempotencyKey:"pay-conflict",canonicalValidatedInput:'{"amount":11}',
 }),e=>e instanceof IdempotencyRuntimeError && e.code==="IDEMPOTENCY_CONFLICT");
});

test("retryable failure can be reclaimed but final failure remains final",async()=>{
 const retry=await service.begin({requestContext:context(),operation,idempotencyKey:"retry",canonicalValidatedInput:'{}'});
 await service.completeFailure({requestContext:context(),started:retry,retryable:true,responseStatus:"503"});
 const reclaimed=await service.begin({requestContext:context(),operation,idempotencyKey:"retry",canonicalValidatedInput:'{}'});
 assert.equal(reclaimed.kind,"STARTED");

 const final=await service.begin({requestContext:context(),operation,idempotencyKey:"final",canonicalValidatedInput:'{}'});
 await service.completeFailure({requestContext:context(),started:final,retryable:false,responseStatus:"422",responseReference:"error:validation"});
 const again=await service.begin({requestContext:context(),operation,idempotencyKey:"final",canonicalValidatedInput:'{}'});
 assert.deepEqual({kind:again.kind,status:again.responseStatus,reference:again.responseReference},
  {kind:"FINAL_FAILURE",status:"422",reference:"error:validation"});
});

test("Tenant Industry RLS cannot see Tenant Core null-Industry idempotency rows",async()=>{
 const keyHash=createHash("sha256").update("core-key").digest("hex");
 const fingerprint=createHash("sha256").update("core-request").digest("hex");
 await scoped.withContext(context(null,"TENANT_CORE"),async tx=>{
   await tx.query(`INSERT INTO core_integration.idempotency_record
    (id,tenant_id,industry_context_id,credential_or_principal_id,operation_id,idempotency_key_hash,request_fingerprint,state,expires_at,created_at,updated_at)
    VALUES ($1,$2,NULL,$3,'core.test.command',$4,$5,'IN_PROGRESS','2026-09-19T08:00:00Z','2026-09-18T08:00:00Z','2026-09-18T08:00:00Z')`,
    [randomUUID(),f.tenant,f.principal,keyHash,fingerprint]);
 });
 const count=await scoped.withContext(context(),async tx=>{
   const r=await tx.query(`SELECT count(*)::int AS count FROM core_integration.idempotency_record WHERE industry_context_id IS NULL`);
   return r.rows[0].count;
 });
 assert.equal(count,0);
});

test("concurrent identical claims produce one STARTED and one IN_PROGRESS",async()=>{
 const [a,b]=await Promise.all([
   service.begin({requestContext:context(),operation,idempotencyKey:"concurrent",canonicalValidatedInput:'{"x":1}'}),
   service.begin({requestContext:context(),operation,idempotencyKey:"concurrent",canonicalValidatedInput:'{"x":1}'}),
 ]);
 assert.deepEqual([a.kind,b.kind].sort(),["IN_PROGRESS","STARTED"]);
});

test("application runtime may update but cannot delete idempotency state",async()=>{
 await assert.rejects(scoped.withContext(context(),tx=>
   tx.query("DELETE FROM core_integration.idempotency_record WHERE tenant_id=$1",[f.tenant])
 ),error=>error.code==="DATABASE_QUERY_FAILED");
});
