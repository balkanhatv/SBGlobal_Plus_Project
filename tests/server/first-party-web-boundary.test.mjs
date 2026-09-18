import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  DomainOperationRegistry,
  IdentityRoleQueryService,
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
  createFirstPartyTrpcFetchHandler,
} from "../../dist/server/api/trpc/fetch-handler.js";
import {
  BoundedFirstPartyTrpcBodyPolicy,
  ConfiguredFirstPartyWebEdgePolicy,
  ExactHostFirstPartySelectorResolver,
} from "../../dist/server/api/trpc/first-party-web-boundary.js";

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

function build(executor,{maxBodyBytes=1024,host="tenant-a.example.com"}={}){
  const operations=new OperationRegistry();
  const dtos=new ZodOperationDtoRegistry();
  const schemas=new OperationSchemaRegistry();
  const domains=new DomainOperationRegistry();
  registerCoreIdentityRolesListEffective({
    operations,dtos,schemas,domains,
    service:new IdentityRoleQueryService({async listEffective(){return null}}),
  });
  const projector=new TransportEnvelopeProjector();
  const router=createFirstPartyCoreRouter({ports:{executor,schemas,dtos,projector}});
  const selector=new ExactHostFirstPartySelectorResolver([
    {host,tenantSelector:"tenant-a"},
  ]);
  const edge=new ConfiguredFirstPartyWebEdgePolicy({
    allowedHosts:[host],
    allowedOrigins:[`https://${host}`],
    maxBodyBytes,
  });
  const handler=createFirstPartyTrpcFetchHandler({
    endpoint:"/api/trpc",router,identity:identity(),projector,
    ids:{nextId:randomUUID},
    edgePolicy:edge,
    bodyPolicy:new BoundedFirstPartyTrpcBodyPolicy(maxBodyBytes),
    authorization:{
      async resolve({authorizationHeader}){
        return {kind:"HUMAN",credential:authorizationHeader.replace(/^Bearer\s+/i,"")};
      },
    },
    selectors:selector,
  });
  return {handler,selector,edge};
}

function getRequest(host="tenant-a.example.com",headers={}){
  return new Request(
    `https://${host}/api/trpc/core.identity.roles.listEffective?input=${encodeURIComponent("{}")}`,
    {method:"GET",headers},
  );
}

test("exact host binding yields only server-configured tenant selector and ignores tenant authority headers",async()=>{
  const seen=[];
  const {handler}=build({
    async execute(input){
      seen.push(input);
      return {
        kind:"EXECUTED",
        data:{
          principalId:"11111111-1111-4111-8111-111111111111",
          roleIds:[],permissionVersion:1,
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
  const response=await handler(getRequest("tenant-a.example.com",{
    authorization:"Bearer valid",
    "x-tenant-id":"attacker-tenant",
    "x-industry-context-id":"attacker-industry",
  }));
  assert.equal(response.status,200);
  assert.equal(seen[0].context.tenantSelector,"tenant-a");
  assert.equal(seen[0].context.industrySelector,undefined);
});

test("unknown host and cross-site browser request fail before executor",async()=>{
  let calls=0;
  const {handler}=build({async execute(){calls++;throw new Error("must not execute")}});
  const unknown=await handler(getRequest("evil.example.com",{authorization:"Bearer valid"}));
  assert.equal(unknown.status,403);
  const crossSite=await handler(getRequest("tenant-a.example.com",{
    authorization:"Bearer valid",
    origin:"https://evil.example.com",
    "sec-fetch-site":"cross-site",
  }));
  assert.equal(crossSite.status,403);
  assert.equal(calls,0);
});

test("declared oversized request is denied by metadata edge policy before authentication",async()=>{
  let authCalls=0;
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
    edgePolicy:new ConfiguredFirstPartyWebEdgePolicy({
      allowedHosts:["tenant-a.example.com"],
      allowedOrigins:["https://tenant-a.example.com"],
      maxBodyBytes:1024,
    }),
    authorization:{
      async resolve(){authCalls++;return {kind:"HUMAN",credential:"valid"}},
    },
  });
  const response=await handler(new Request(
    "https://tenant-a.example.com/api/trpc/core.identity.roles.listEffective",
    {
      method:"POST",
      headers:{
        authorization:"Bearer valid",
        "content-type":"application/json",
        "content-length":"2048",
      },
      body:"{}",
    },
  ));
  assert.equal(response.status,413);
  assert.equal(authCalls,0);
});

test("streamed body ceiling denies oversized unknown-length payload after auth but before tRPC parsing",async()=>{
  let executed=false;
  const {handler}=build({async execute(){executed=true;throw new Error("must not execute")}},{maxBodyBytes:1024});
  const body=JSON.stringify({input:"x".repeat(1500)});
  const request=new Request(
    "https://tenant-a.example.com/api/trpc/core.identity.roles.listEffective",
    {
      method:"POST",
      headers:{
        authorization:"Bearer valid",
        "content-type":"application/json",
      },
      body,
    },
  );
  request.headers.delete("content-length");
  const response=await handler(request);
  assert.equal(response.status,413);
  assert.equal(executed,false);
});

test("same-origin browser metadata and bounded body pass through to native tRPC handling",async()=>{
  const seen=[];
  const {handler}=build({
    async execute(input){
      seen.push(input);
      return {
        kind:"EXECUTED",
        data:{
          principalId:"11111111-1111-4111-8111-111111111111",
          roleIds:[],permissionVersion:2,
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
  const response=await handler(getRequest("tenant-a.example.com",{
    authorization:"Bearer valid",
    origin:"https://tenant-a.example.com",
    "sec-fetch-site":"same-origin",
  }));
  assert.equal(response.status,200);
  assert.equal(seen.length,1);
});
