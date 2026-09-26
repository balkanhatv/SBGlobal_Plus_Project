import test from "node:test";
import assert from "node:assert/strict";
import { createHash,randomUUID } from "node:crypto";
import {
  RateLimitRuntimeError,
  RateLimitService,
  SECURITY_RATE_POLICY_V1,
} from "../../dist/core/index.js";

const tenantId=randomUUID(),principalId=randomUUID(),credentialId=randomUUID();
const operation=Object.freeze({
  operationId:"rtl.pos.sale.view",module:"RTL-POS",scopeClass:"TENANT_INDUSTRY",kind:"QUERY",
  permissionCode:"rtl.pos.sale.view",inputSchemaVersion:1,outputSchemaVersion:1,
  idempotencyPolicy:"NONE",rateClass:"AUTH_STANDARD",auditClass:"STANDARD",
  domainService:"RetailSaleService.view",emittedEvents:[],errorCodes:[],
});
const context=Object.freeze({
  requestId:randomUUID(),correlationId:randomUUID(),tenantId,industryContextId:randomUUID(),
  dataHomeId:randomUUID(),regionCode:"IN",principalId,credentialId,principalType:"SERVICE",
  actorIpHash:"ip-hash-1",orgUnitPath:[],roleIds:[],scopeClass:"TENANT_INDUSTRY",
});
function fixture({result={allowed:true,leases:[]},overrides}={}){
  const calls=[];
  const service=new RateLimitService({
    store:{
      async acquire(input){calls.push(["acquire",input]);return result;},
      async release(input){calls.push(["release",input]);},
    },
    digest:{sha256(value){return createHash("sha256").update(value).digest("hex");}},
    runtime:{now(){return new Date("2026-09-18T10:00:00Z")},nextLeaseId:randomUUID},
    leasePolicy:{expiresAt(){return new Date("2026-09-18T10:05:00Z")}},
    signals:{async emitThrottle(input){calls.push(["signal",input]);}},
    ...(overrides?{overrides}:{}),
  });
  return {service,calls};
}

test("SecurityRatePolicy v1 locks DD-022 numeric defaults",()=>{
  assert.deepEqual(SECURITY_RATE_POLICY_V1.PUBLIC_LOW,
    {rateClass:"PUBLIC_LOW",maxRequests:30,windowSeconds:60,burstCapacity:10,concurrencyLimit:5});
  assert.deepEqual(SECURITY_RATE_POLICY_V1.AUTH_SECURITY,
    {rateClass:"AUTH_SECURITY",maxRequests:20,windowSeconds:300,burstCapacity:5,concurrencyLimit:3});
  assert.deepEqual(SECURITY_RATE_POLICY_V1.BULK,
    {rateClass:"BULK",maxRequests:30,windowSeconds:3600,burstCapacity:5,concurrencyLimit:2});
  assert.deepEqual(SECURITY_RATE_POLICY_V1.AI,
    {rateClass:"AI",maxRequests:60,windowSeconds:60,burstCapacity:12,concurrencyLimit:8});
  assert.deepEqual(SECURITY_RATE_POLICY_V1.API_CREDENTIAL,
    {rateClass:"API_CREDENTIAL",maxRequests:1200,windowSeconds:60,burstCapacity:240,concurrencyLimit:40});
  assert.deepEqual(SECURITY_RATE_POLICY_V1.TENANT_AGGREGATE,
    {rateClass:"TENANT_AGGREGATE",maxRequests:3000,windowSeconds:60,burstCapacity:600,concurrencyLimit:100});
});

test("authenticated request enforces principal, credential, IP, tenant aggregate and API credential buckets",async()=>{
  const {service,calls}=fixture();
  await service.acquire({requestContext:context,operation});
  const rules=calls[0][1].rules;
  const pairs=rules.map(rule=>`${rule.rateClass}:${rule.dimension}`).sort();
  assert.deepEqual(pairs,[
    "API_CREDENTIAL:CREDENTIAL",
    "AUTH_STANDARD:CREDENTIAL",
    "AUTH_STANDARD:IP",
    "AUTH_STANDARD:PRINCIPAL",
    "TENANT_AGGREGATE:TENANT",
  ]);
  const principalRule=rules.find(rule=>rule.rateClass==="AUTH_STANDARD" && rule.dimension==="PRINCIPAL");
  const credentialRule=rules.find(rule=>rule.rateClass==="API_CREDENTIAL" && rule.dimension==="CREDENTIAL");
  const tenantRule=rules.find(rule=>rule.rateClass==="TENANT_AGGREGATE" && rule.dimension==="TENANT");
  assert.equal(principalRule.concurrencyLimit,20);
  assert.equal(credentialRule.concurrencyLimit,40);
  assert.equal(tenantRule.concurrencyLimit,100);
  assert.equal(rules.find(rule=>rule.rateClass==="AUTH_STANDARD" && rule.dimension==="IP").concurrencyLimit,undefined);
  assert.equal(rules.every(rule=>/^[0-9a-f]{64}$/.test(rule.bucketKeyHash)),true);
  assert.equal(JSON.stringify(rules).includes(principalId),false);
  assert.equal(JSON.stringify(rules).includes(tenantId),false);
});

test("stricter override is accepted but any relaxation is policy denied",async()=>{
  const strict=fixture({overrides:{async resolve(){return [{
    rateClass:"AUTH_STANDARD",dimension:"PRINCIPAL",maxRequests:60,burstCapacity:10,
  }]}}});
  await strict.service.acquire({requestContext:context,operation});
  const principal=strict.calls[0][1].rules.find(rule=>
    rule.rateClass==="AUTH_STANDARD" && rule.dimension==="PRINCIPAL");
  assert.equal(principal.capacity,10);
  assert.equal(principal.refillPerSecond,1);

  const weak=fixture({overrides:{async resolve(){return [{
    rateClass:"AUTH_STANDARD",dimension:"PRINCIPAL",maxRequests:601,
  }]}}});
  await assert.rejects(
    weak.service.acquire({requestContext:context,operation}),
    error=>error instanceof RateLimitRuntimeError && error.code==="POLICY_DENIED",
  );
});

test("store throttle becomes deterministic RATE_LIMITED with retry metadata",async()=>{
  const {service}=fixture({result:{
    allowed:false,retryAfterSeconds:7.2,rateClass:"AUTH_STANDARD",dimension:"PRINCIPAL",
  }});
  await assert.rejects(
    service.acquire({requestContext:context,operation}),
    error=>error instanceof RateLimitRuntimeError
      && error.code==="RATE_LIMITED"
      && error.retryAfterSeconds===8
      && error.rateClass==="AUTH_STANDARD",
  );
});

test("PUBLIC requires server-owned IP identity and webhook requires verified endpoint identity",async()=>{
  const {service}=fixture();
  const publicOp={...operation,scopeClass:"PUBLIC",rateClass:"PUBLIC_LOW"};
  await assert.rejects(
    service.acquire({requestContext:{...context,scopeClass:"PUBLIC",tenantId:undefined,industryContextId:undefined,
      principalId:undefined,credentialId:undefined,actorIpHash:undefined},operation:publicOp}),
    error=>error.code==="RATE_CONTEXT_INVALID",
  );
  await assert.rejects(
    service.acquire({requestContext:context,operation:{...operation,rateClass:"WEBHOOK_ADMIN"}}),
    error=>error.code==="RATE_CONTEXT_INVALID",
  );
});


test("throttle emits safe signal before RATE_LIMITED is returned",async()=>{
  const {service,calls}=fixture({result:{
    allowed:false,retryAfterSeconds:3,rateClass:"AUTH_STANDARD",dimension:"IP",
  }});
  await assert.rejects(
    service.acquire({requestContext:context,operation}),
    error=>error.code==="RATE_LIMITED",
  );
  const signal=calls.find(([name])=>name==="signal")?.[1];
  assert.deepEqual(signal,{
    requestId:context.requestId,
    correlationId:context.correlationId,
    scopeClass:"TENANT_INDUSTRY",
    operationId:operation.operationId,
    rateClass:"AUTH_STANDARD",
    dimension:"IP",
    retryAfterSeconds:3,
  });
});
