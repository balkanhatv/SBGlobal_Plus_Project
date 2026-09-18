import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import {
  IdempotencyRuntimeError,
  IdempotencyService,
} from "../../dist/core/index.js";

const tenantId=randomUUID(), industryContextId=randomUUID(), principalId=randomUUID(), credentialId=randomUUID();
const operation=Object.freeze({
  operationId:"rtl.pos.sale.create",module:"RTL-POS",scopeClass:"TENANT_INDUSTRY",kind:"COMMAND",
  permissionCode:"rtl.pos.sale.create",inputSchemaVersion:1,outputSchemaVersion:1,
  idempotencyPolicy:"REQUIRED",rateClass:"AUTH_STANDARD",auditClass:"STANDARD",
  domainService:"RetailSaleService.create",emittedEvents:[],errorCodes:[],
});
const context=Object.freeze({
  requestId:randomUUID(),correlationId:randomUUID(),tenantId,industryContextId,
  dataHomeId:randomUUID(),regionCode:"IN",principalId,credentialId,principalType:"SERVICE",
  orgUnitPath:[],roleIds:[],scopeClass:"TENANT_INDUSTRY",
});

function fixture(claim={kind:"STARTED",recordId:randomUUID(),expiresAt:new Date("2026-09-19T00:00:00Z")}){
  const calls=[];
  const service=new IdempotencyService({
    store:{
      async claim(input){calls.push(["claim",input]);return claim;},
      async completeSuccess(input){calls.push(["success",input]);},
      async completeFailure(input){calls.push(["failure",input]);},
    },
    digest:{sha256(value){return createHash("sha256").update(value).digest("hex");}},
    runtime:{now(){return new Date("2026-09-18T08:00:00Z")},nextId:randomUUID},
    window:{expiresAt(){return new Date("2026-09-19T00:00:00Z")}},
  });
  return {service,calls};
}

test("required idempotency rejects missing key and NONE bypasses persistence",async()=>{
  const {service,calls}=fixture();
  await assert.rejects(
    service.begin({requestContext:context,operation,canonicalValidatedInput:'{"a":1}'}),
    e=>e instanceof IdempotencyRuntimeError && e.code==="IDEMPOTENCY_REQUIRED",
  );
  const bypass=await service.begin({
    requestContext:context,
    operation:{...operation,idempotencyPolicy:"NONE"},
    idempotencyKey:"ignored",
    canonicalValidatedInput:'{"a":1}',
  });
  assert.equal(bypass.kind,"BYPASS");
  assert.equal(calls.length,0);
});

test("idempotency uses credential when present and hashes key/request before store",async()=>{
  const {service,calls}=fixture();
  const result=await service.begin({
    requestContext:context,operation,idempotencyKey:"client-key-1",canonicalValidatedInput:'{"amount":10}',
  });
  assert.equal(result.kind,"STARTED");
  const saved=calls[0][1];
  assert.equal(saved.actorId,credentialId);
  assert.match(saved.idempotencyKeyHash,/^[0-9a-f]{64}$/);
  assert.match(saved.requestFingerprint,/^[0-9a-f]{64}$/);
  assert.notEqual(saved.idempotencyKeyHash,"client-key-1");
  assert.notEqual(saved.requestFingerprint,'{"amount":10}');
});

test("same key with different fingerprint becomes deterministic conflict",async()=>{
  const {service}=fixture({kind:"CONFLICT",recordId:randomUUID()});
  await assert.rejects(
    service.begin({requestContext:context,operation,idempotencyKey:"same",canonicalValidatedInput:'{"amount":11}'}),
    e=>e instanceof IdempotencyRuntimeError && e.code==="IDEMPOTENCY_CONFLICT",
  );
});

test("optional command without key bypasses; query cannot require idempotency",async()=>{
  const {service}=fixture();
  assert.equal((await service.begin({
    requestContext:context,operation:{...operation,idempotencyPolicy:"OPTIONAL"},
    canonicalValidatedInput:'{}',
  })).kind,"BYPASS");
  await assert.rejects(service.begin({
    requestContext:context,operation:{...operation,kind:"QUERY"},idempotencyKey:"k",canonicalValidatedInput:'{}',
  }),e=>e.code==="IDEMPOTENCY_CONTRACT_INVALID");
});

test("completion persists only metadata through the STARTED lease",async()=>{
  const {service,calls}=fixture();
  const started=await service.begin({
    requestContext:context,operation,idempotencyKey:"k2",canonicalValidatedInput:'{"x":1}',
  });
  assert.equal(started.kind,"STARTED");
  await service.completeSuccess({
    requestContext:context,started,responseStatus:"200",responseReference:"sale:123",
  });
  assert.equal(calls.at(-1)[0],"success");
  assert.equal(calls.at(-1)[1].recordId,started.recordId);
  assert.equal(calls.at(-1)[1].responseReference,"sale:123");
});
