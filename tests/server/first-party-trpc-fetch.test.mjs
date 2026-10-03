import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  DomainOperationRegistry,
  IdentityRoleQueryService,
  OperationExecutionError,
  OperationRegistry,
  OperationSchemaRegistry,
  TransportEnvelopeProjector,
  ZodOperationDtoRegistry,
} from "../../dist/core/index.js";
import {
  createFirstPartyCoreRouter,
  registerCoreIdentityRolesListEffective,
} from "../../dist/server/api/trpc/core-identity-router.js";
import {
  FirstPartyTrpcHttpPreflightError,
  createFirstPartyTrpcFetchHandler,
} from "../../dist/server/api/trpc/fetch-handler.js";

function identity(){
  return {
    async verifyHumanSession(credential){
      if(credential!=="valid") throw new Error("invalid");
      return {
        principalId:randomUUID(),principalType:"HUMAN",
        providerSubject:"u",providerSessionId:"s",
        providerSessionCreatedAtMs:1,authEpoch:1,authStrength:"MFA",
      };
    },
    async verifyMachineCredential(){throw new Error("unused")},
    async revokeProviderSession(){},
    getAuthStrength(e){return e.authStrength},
    getProviderSubject(e){return e.providerSubject},
  };
}

function harness(executor){
  const operations=new OperationRegistry();
  const dtos=new ZodOperationDtoRegistry();
  const schemas=new OperationSchemaRegistry();
  const domains=new DomainOperationRegistry();
  registerCoreIdentityRolesListEffective({
    operations,dtos,schemas,domains,
    service:new IdentityRoleQueryService({async listEffective(){return null}}),
  });
  const projector=new TransportEnvelopeProjector();
  const router=createFirstPartyCoreRouter({
    ports:{executor,schemas,dtos,projector},
  });
  const ids=[];
  for(let i=0;i<20;i++) ids.push(randomUUID());
  const calls=[];
  const handler=createFirstPartyTrpcFetchHandler({
    endpoint:"/api/trpc",
    router,
    identity:identity(),
    projector,
    ids:{nextId(){return ids.shift()}},
    edgePolicy:{async verify(meta){calls.push(["edge",meta.method])}},
    authorization:{
      async resolve({authorizationHeader}){
        calls.push(["authorization",authorizationHeader]);
        return {kind:"HUMAN",credential:authorizationHeader.replace(/^Bearer\s+/i,"")};
      },
    },
    selectors:{
      async resolve(){
        calls.push(["selectors"]);
        return {tenantSelector:"tenant-a"};
      },
    },
    network:{
      async resolve(){
        calls.push(["network"]);
        return {actorIpHash:"ip-hash"};
      },
    },
  });
  return {handler,calls};
}

function queryRequest(headers={}){
  const input=encodeURIComponent("{}");
  return new Request(
    `https://example.test/api/trpc/core.identity.roles.listEffective?input=${input}`,
    {method:"GET",headers},
  );
}

test("physical fetch handler executes the real nested tRPC path with normalized correlation",async()=>{
  const correlation=randomUUID();
  const seen=[];
  const {handler,calls}=harness({
    async execute(input){
      seen.push(input);
      return {
        kind:"EXECUTED",
        data:{
          principalId:"11111111-1111-4111-8111-111111111111",
          roleIds:[],
          permissionVersion:3,
        },
        meta:{
          requestId:input.context.requestId,
          correlationId:input.context.correlationId,
          operationId:input.operationId,
          outputSchemaVersion:1,
        },
      };
    },
  });
  const response=await handler(queryRequest({
    authorization:"Bearer valid",
    "x-correlation-id":correlation,
  }));
  assert.equal(response.status,200);
  assert.equal(response.headers.get("x-correlation-id"),correlation);
  assert.equal(response.headers.get("cache-control"),"no-store");
  const body=await response.json();
  assert.equal(body.result.data.kind,"SUCCESS");
  assert.equal(body.result.data.envelope.data.permissionVersion,3);
  assert.equal(seen.length,1);
  assert.equal(seen[0].operationId,"core.identity.roles.listEffective");
  assert.deepEqual(calls.map(call=>call[0]),["edge","authorization","selectors","network"]);
});

test("invalid authentication is rejected before tRPC can parse a malformed request body",async()=>{
  const {handler}=harness({
    async execute(){throw new Error("must not execute")},
  });
  const response=await handler(new Request(
    "https://example.test/api/trpc/core.identity.roles.listEffective",
    {
      method:"POST",
      headers:{
        authorization:"Bearer invalid",
        "content-type":"application/json",
      },
      body:"{not-json",
    },
  ));
  assert.equal(response.status,401);
  const body=await response.json();
  assert.equal(body.error.code,"AUTHENTICATION_INVALID");
  assert.equal(body.error.class,"POLICY_DENIAL");
  assert.match(response.headers.get("x-correlation-id"),/^[0-9a-f-]{36}$/);
});

test("missing Authorization returns the canonical AUTH_REQUIRED envelope without invoking resolver",async()=>{
  let executed=false;
  const {handler,calls}=harness({
    async execute(){executed=true;throw new Error("must not execute")},
  });
  const response=await handler(queryRequest());
  assert.equal(response.status,401);
  const body=await response.json();
  assert.equal(body.error.code,"AUTH_REQUIRED");
  assert.equal(executed,false);
  assert.deepEqual(calls.map(call=>call[0]),["edge"]);
});

test("RATE_LIMITED uses shared projection and emits HTTP Retry-After metadata",async()=>{
  const {handler}=harness({
    async execute(){
      throw new OperationExecutionError({
        code:"RATE_LIMITED",
        messageSafe:"The request rate limit has been exceeded.",
        retryable:true,
        retryAfterSeconds:9,
      });
    },
  });
  const response=await handler(queryRequest({authorization:"Bearer valid"}));
  assert.equal(response.status,429);
  assert.equal(response.headers.get("retry-after"),"9");
  const body=await response.json();
  assert.equal(body.error.data.sbglobal.error.code,"RATE_LIMITED");
  assert.equal(body.error.data.retryAfterSeconds,9);
});

test("edge-policy denial is projected before authentication/body handling",async()=>{
  const operations=new OperationRegistry();
  const dtos=new ZodOperationDtoRegistry();
  const schemas=new OperationSchemaRegistry();
  const domains=new DomainOperationRegistry();
  registerCoreIdentityRolesListEffective({
    operations,dtos,schemas,domains,
    service:new IdentityRoleQueryService({async listEffective(){return null}}),
  });
  const projector=new TransportEnvelopeProjector();
  const router=createFirstPartyCoreRouter({
    ports:{
      executor:{async execute(){throw new Error("must not execute")}},
      schemas,dtos,projector,
    },
  });
  const handler=createFirstPartyTrpcFetchHandler({
    endpoint:"/api/trpc",router,identity:identity(),projector,
    ids:{nextId:randomUUID},
    edgePolicy:{
      async verify(){
        throw new FirstPartyTrpcHttpPreflightError({
          code:"TRANSPORT_POLICY_DENIED",
          messageSafe:"The request origin is not allowed.",
          status:403,
          retryable:false,
        });
      },
    },
    authorization:{
      async resolve(){throw new Error("must not resolve")},
    },
  });
  const response=await handler(new Request(
    "https://example.test/api/trpc/core.identity.roles.listEffective",
    {method:"POST",headers:{authorization:"Bearer valid"},body:"{not-json"},
  ));
  assert.equal(response.status,403);
  const body=await response.json();
  assert.equal(body.error.code,"TRANSPORT_POLICY_DENIED");
  assert.equal(body.error.messageSafe,"The request origin is not allowed.");
});
