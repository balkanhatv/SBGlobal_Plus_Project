import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  OperationExecutionError,
  TransportEnvelopeProjector,
} from "../../dist/core/index.js";
import {
  RestTransportError,
  createRestFetchHandler,
} from "../../dist/server/api/rest/fetch-handler.js";

function executionMeta(input){
  return {
    requestId:input.context.requestId,
    correlationId:input.context.correlationId,
    operationId:input.operationId,
    outputSchemaVersion:1,
  };
}

function harness(overrides={}){
  const calls=[];
  const ids=Array.from({length:20},()=>randomUUID());
  const handler=createRestFetchHandler({
    projector:new TransportEnvelopeProjector(),
    ids:{nextId(){return ids.shift()}},
    edgePolicy:{async verify(){calls.push("edge")}},
    routes:{async resolve(){calls.push("route");return {
      operationId:"core.identity.roles.listEffective",
      tenantSelector:"tenant-path",
    }}},
    authorization:{async resolve(){calls.push("authorization");return {
      kind:"MACHINE",credential:"opaque",
    }}},
    contexts:{async authenticate(input){calls.push("context");return {
      executionContext:{
        requestId:input.requestId,
        correlationId:input.correlationId,
        authentication:input.authentication,
        tenantSelector:input.route.tenantSelector,
      },
      ...(input.idempotencyKey?{idempotencyKey:input.idempotencyKey}:{}),
    }}},
    bodyPolicy:{async prepare(request){calls.push("body");return request}},
    input:{async read(){calls.push("input");return {membershipId:"m-1"}}},
    executor:{async execute(input){calls.push("execute");return {
      kind:"EXECUTED",
      data:{permissionVersion:4},
      meta:executionMeta(input),
    }}},
    ...overrides,
  });
  return {handler,calls};
}

function request(headers={}){
  return new Request("https://api.example.test/api/v1/tenants/tenant-path/roles/effective",{
    method:"POST",
    headers:{authorization:"ApiKey opaque","content-type":"application/json",...headers},
    body:'{"membershipId":"m-1"}',
  });
}

test("REST-001 authenticates context before body preparation and input projection",async()=>{
  const {handler,calls}=harness();
  const response=await handler(request());
  assert.equal(response.status,200);
  assert.deepEqual(calls,["edge","route","authorization","context","body","input","execute"]);
});

test("REST-002 passes route selectors and transport metadata once to the shared executor",async()=>{
  const correlation=randomUUID();
  let seen;
  const {handler}=harness({
    executor:{async execute(input){seen=input;return {
      kind:"EXECUTED",data:{permissionVersion:7},meta:executionMeta(input),
    }}},
  });
  const response=await handler(request({
    "x-correlation-id":correlation,
    "idempotency-key":"retry-key",
    "x-tenant-id":"ignored-header",
  }));
  assert.equal(response.status,200);
  assert.equal(response.headers.get("cache-control"),"no-store");
  assert.equal(response.headers.get("x-correlation-id"),correlation);
  assert.equal(seen.operationId,"core.identity.roles.listEffective");
  assert.equal(seen.context.tenantSelector,"tenant-path");
  assert.equal(seen.context.correlationId,correlation);
  assert.equal(seen.idempotencyKey,"retry-key");
  assert.deepEqual(seen.rawInput,{membershipId:"m-1"});
  const body=await response.json();
  assert.equal(body.data.permissionVersion,7);
  assert.equal(body.meta.operationId,seen.operationId);
});

test("REST-003 projects RATE_LIMITED through canonical envelope and Retry-After",async()=>{
  const {handler}=harness({
    executor:{async execute(){throw new OperationExecutionError({
      code:"RATE_LIMITED",
      messageSafe:"The request rate limit has been exceeded.",
      retryable:true,
      retryAfterSeconds:2.2,
    })}},
  });
  const response=await handler(request());
  assert.equal(response.status,429);
  assert.equal(response.headers.get("retry-after"),"3");
  const body=await response.json();
  assert.equal(body.error.code,"RATE_LIMITED");
  assert.equal(body.error.class,"POLICY_DENIAL");
  assert.equal(Object.hasOwn(body.error,"retryAfterSeconds"),false);
});

test("REST-004 returns explicit idempotency controls without fabricated output data",async()=>{
  for(const [kind,status] of [
    ["IDEMPOTENT_REPLAY",200],
    ["IDEMPOTENCY_IN_PROGRESS",202],
    ["IDEMPOTENCY_FINAL_FAILURE",409],
  ]){
    const {handler}=harness({
      executor:{async execute(input){return {
        kind,
        meta:executionMeta(input),
        ...(kind==="IDEMPOTENT_REPLAY"?{responseReference:"existing:1"}:{recordId:"record-1"}),
      }}},
    });
    const response=await handler(request());
    assert.equal(response.status,status);
    const body=await response.json();
    assert.equal(body.kind,kind);
    assert.equal(Object.hasOwn(body,"data"),false);
    assert.equal(Object.hasOwn(body,"envelope"),false);
    if(kind==="IDEMPOTENT_REPLAY"){
      assert.equal(response.headers.get("x-idempotent-replay"),"true");
    }
  }
});

test("REST-005 normalizes unknown transport failures without leaking details",async()=>{
  const {handler}=harness({
    input:{async read(){throw new Error("secret provider detail")}},
  });
  const response=await handler(request());
  assert.equal(response.status,503);
  const body=await response.json();
  assert.equal(body.error.code,"DEPENDENCY_UNAVAILABLE");
  assert.equal(body.error.messageSafe,"The REST transport is unavailable.");
  assert.doesNotMatch(JSON.stringify(body),/secret provider detail/);
});

test("REST-006 missing auth and edge denials stop before body/input execution",async()=>{
  const missing=harness();
  const missingResponse=await missing.handler(new Request(
    "https://api.example.test/api/v1/tenants/t/roles/effective",
    {method:"GET"},
  ));
  assert.equal(missingResponse.status,401);
  assert.deepEqual(missing.calls,["edge","route"]);

  const denied=harness({
    edgePolicy:{async verify(){throw new RestTransportError({
      code:"TRANSPORT_POLICY_DENIED",
      messageSafe:"The request is not allowed.",
      status:403,
      retryable:false,
    })}},
  });
  const deniedResponse=await denied.handler(request());
  assert.equal(deniedResponse.status,403);
  assert.deepEqual(denied.calls,[]);
});

test("REST context cannot replace normalized request or correlation identity",async()=>{
  const {handler,calls}=harness({
    contexts:{async authenticate(input){calls.push("context");return {
      executionContext:{
        requestId:randomUUID(),
        correlationId:input.correlationId,
        authentication:input.authentication,
        tenantSelector:input.route.tenantSelector,
      },
    }}},
  });
  const response=await handler(request());
  assert.equal(response.status,503);
  const body=await response.json();
  assert.equal(body.error.code,"TRANSPORT_CONTEXT_INVALID");
  assert.deepEqual(calls,["edge","route","authorization","context"]);
});
