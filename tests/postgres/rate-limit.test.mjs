import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import { randomUUID,randomBytes } from "node:crypto";
import pg from "pg";

import { RateLimitRuntimeError,RateLimitService } from "../../dist/core/index.js";
import { PostgresRateLimiterDatabase } from "../../dist/server/database/postgres-rate-limiter-database.js";
import { PostgresRateLimitStore } from "../../dist/server/api/postgres-rate-limit-store.js";
import { Sha256RateLimitDigest } from "../../dist/server/api/sha256-rate-limit-digest.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);
const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const loginRole=`sbg_rate_test_${randomBytes(8).toString("hex")}`;
const appLoginRole=`sbg_rate_app_${randomBytes(8).toString("hex")}`;
const password=randomBytes(24).toString("hex");
let pool,service,store;
const tenantId=randomUUID(),principalId=randomUUID();

function context(overrides={}){
 return Object.freeze({
  requestId:randomUUID(),correlationId:randomUUID(),tenantId,industryContextId:randomUUID(),
  principalId,principalType:"HUMAN",actorIpHash:"rate-ip-a",
  orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"TENANT_INDUSTRY",
  ...overrides,
 });
}
function op(rateClass="AUTH_STANDARD"){
 return Object.freeze({
  operationId:"rtl.pos.sale.view",module:"RTL-POS",scopeClass:"TENANT_INDUSTRY",kind:"QUERY",
  permissionCode:"rtl.pos.sale.view",inputSchemaVersion:1,outputSchemaVersion:1,
  idempotencyPolicy:"NONE",rateClass,auditClass:"STANDARD",domainService:"x",emittedEvents:[],errorCodes:[],
 });
}
function build(overrides){
 return new RateLimitService({
  store,digest:new Sha256RateLimitDigest(),
  runtime:{now:()=>new Date("2026-09-18T10:00:00Z"),nextLeaseId:randomUUID},
  leasePolicy:{expiresAt:()=>new Date("2026-09-18T10:05:00Z")},
  signals:{async emitThrottle(){}},
  ...(overrides?{overrides}:{}),
 });
}

before(async()=>{
 const c=await admin.connect();
 try{
  await c.query("BEGIN");
  await c.query(`CREATE ROLE ${loginRole} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
  await c.query(`CREATE ROLE ${appLoginRole} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
  await c.query(`GRANT sbg_rate_limiter_rw TO ${loginRole}`);
  await c.query(`GRANT sbg_app_rw TO ${appLoginRole}`);
  await c.query("COMMIT");
 }catch(e){await c.query("ROLLBACK");throw e}finally{c.release()}
 const url=new URL(process.env.SBG_POSTGRES_TEST_URL);url.username=loginRole;url.password=password;
 pool=new pg.Pool({connectionString:url.toString(),max:12,connectionTimeoutMillis:5000});
 store=new PostgresRateLimitStore(new PostgresRateLimiterDatabase(pool));
 service=build();
});

after(async()=>{
 if(pool) await pool.end();
 const c=await admin.connect();
 try{
  await c.query("BEGIN");
  await c.query("DELETE FROM core_integration.rate_limit_concurrency_lease");
  await c.query("DELETE FROM core_integration.rate_limit_bucket");
  await c.query(`DROP ROLE IF EXISTS ${loginRole}`);
  await c.query(`DROP ROLE IF EXISTS ${appLoginRole}`);
  await c.query("COMMIT");
 }catch(e){await c.query("ROLLBACK");throw e}finally{c.release();await admin.end()}
});

test("PUBLIC_LOW token bucket allows burst 10 then throttles with retry metadata",async()=>{
 const publicContext=context({scopeClass:"PUBLIC",tenantId:undefined,industryContextId:undefined,
   principalId:undefined,actorIpHash:"public-ip-a"});
 const publicOp={...op("PUBLIC_LOW"),scopeClass:"PUBLIC"};
 for(let i=0;i<10;i++) await service.acquire({requestContext:publicContext,operation:publicOp});
 await assert.rejects(
  service.acquire({requestContext:publicContext,operation:publicOp}),
  error=>error instanceof RateLimitRuntimeError
    && error.code==="RATE_LIMITED"
    && error.retryAfterSeconds>=1,
 );
});

test("different hashed IP bucket remains isolated from an exhausted public bucket",async()=>{
 const publicOp={...op("PUBLIC_LOW"),scopeClass:"PUBLIC"};
 const other=context({scopeClass:"PUBLIC",tenantId:undefined,industryContextId:undefined,
   principalId:undefined,actorIpHash:"public-ip-b"});
 await assert.doesNotReject(service.acquire({requestContext:other,operation:publicOp}));
});

test("concurrent one-token override admits exactly one claimant",async()=>{
 const strictTenant=randomUUID();
 const strict=build({async resolve(){return [
  {rateClass:"AUTH_STANDARD",dimension:"PRINCIPAL",maxRequests:1,burstCapacity:1},
  {rateClass:"AUTH_STANDARD",dimension:"IP",maxRequests:1,burstCapacity:1},
  {rateClass:"TENANT_AGGREGATE",dimension:"TENANT",maxRequests:1,burstCapacity:1},
 ]}});
 const attempts=await Promise.allSettled([
  strict.acquire({requestContext:context({tenantId:strictTenant,actorIpHash:"concurrent-ip"}),operation:op()}),
  strict.acquire({requestContext:context({tenantId:strictTenant,actorIpHash:"concurrent-ip"}),operation:op()}),
 ]);
 assert.equal(attempts.filter(x=>x.status==="fulfilled").length,1);
 assert.equal(attempts.filter(x=>x.status==="rejected"
   && x.reason instanceof RateLimitRuntimeError
   && x.reason.code==="RATE_LIMITED").length,1);
});

test("AI tenant concurrency lease caps at 8, release reopens one slot",async()=>{
 const acquisitions=[];
 const aiOp=op("AI_COSTED");
 for(let i=0;i<8;i++) acquisitions.push(await service.acquire({
   requestContext:context({principalId:randomUUID(),actorIpHash:`ai-ip-${i}`}),operation:aiOp,
 }));
 await assert.rejects(
  service.acquire({requestContext:context({principalId:randomUUID(),actorIpHash:"ai-ip-9"}),operation:aiOp}),
  error=>error.code==="RATE_LIMITED" && error.rateClass==="AI" && error.dimension==="TENANT",
 );
 await service.release(acquisitions[0]);
 await assert.doesNotReject(service.acquire({
  requestContext:context({principalId:randomUUID(),actorIpHash:"ai-ip-10"}),operation:aiOp,
 }));
 for(const item of acquisitions.slice(1)) await service.release(item);
});

test("ordinary application role cannot read opaque limiter state",async()=>{
 const url=new URL(process.env.SBG_POSTGRES_TEST_URL);url.username=appLoginRole;url.password=password;
 const appPool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:5000});
 try{
  await assert.rejects(appPool.query("SET ROLE sbg_app_rw; SELECT count(*) FROM core_integration.rate_limit_bucket"),
    error=>String(error.code)==="42501");
 }finally{await appPool.end()}
});
