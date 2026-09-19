import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import {
  DomainOperationRegistry,
  IdentityRoleQueryService,
  WorkspaceService,
  OperationExecutionError,
  OperationRegistry,
  OperationSchemaRegistry,
  TransportEnvelopeProjector,
  ZodOperationDtoRegistry,
} from "../../dist/core/index.js";
import {
  CORE_IDENTITY_ROLES_LIST_EFFECTIVE_INPUT_V1,
  CORE_TENANCY_WORKSPACE_RESOLVE_INPUT_V1,
  createFirstPartyCoreRouter,
  registerCoreIdentityRolesListEffective,
  registerCoreTenancyWorkspaceResolve,
} from "../../dist/server/api/trpc/core-identity-router.js";
import {
  createFirstPartyQueryProcedure,
  createProtectedFirstPartyTrpcContext,
  firstPartyTrpc,
} from "../../dist/server/api/trpc/first-party-trpc.js";

function identityFixture(calls){
  return {
    async verifyHumanSession(credential){
      calls.push(["verifyHumanSession",credential]);
      if(credential!=="valid") throw new Error("bad");
      return {
        principalId:randomUUID(),principalType:"HUMAN",providerSubject:"u",
        providerSessionId:"s",providerSessionCreatedAtMs:1,authEpoch:1,
        authStrength:"MFA",
      };
    },
    async verifyMachineCredential(){throw new Error("unused")},
    async revokeProviderSession(){},
    getAuthStrength(e){return e.authStrength},
    getProviderSubject(e){return e.providerSubject},
  };
}

test("protected tRPC context preflights authentication and normalizes correlation before procedure input",async()=>{
  const calls=[];
  const generated=[randomUUID(),randomUUID()];
  const ctx=await createProtectedFirstPartyTrpcContext({
    identity:identityFixture(calls),
    ids:{nextId(){return generated.shift()}},
    authentication:{kind:"HUMAN",credential:"valid"},
    advisoryCorrelationId:"not-a-valid-correlation",
    tenantSelector:"  tenant-a  ",
    actorIpHash:"ip-hash",
  });
  assert.deepEqual(calls,[["verifyHumanSession","valid"]]);
  assert.match(ctx.executionContext.requestId,/^[0-9a-f-]{36}$/);
  assert.match(ctx.executionContext.correlationId,/^[0-9a-f-]{36}$/);
  assert.equal(ctx.executionContext.tenantSelector,"tenant-a");
  assert.equal(ctx.executionContext.authentication.credential,"valid");
});

test("core.identity.roles.listEffective binds the exact registered Zod object and fixed operation ID",async()=>{
  const operations=new OperationRegistry();
  const dtos=new ZodOperationDtoRegistry();
  const schemas=new OperationSchemaRegistry();
  const domains=new DomainOperationRegistry();
  const roleService=new IdentityRoleQueryService({
    async listEffective(){return null;},
  });
  registerCoreIdentityRolesListEffective({operations,dtos,schemas,domains,service:roleService});
  registerCoreTenancyWorkspaceResolve({
    operations,dtos,schemas,domains,
    service:new WorkspaceService({
      async findMembership(){return null},
      async getTenantById(){return null},
      async resolveIndustryContext(){return null},
    }),
  });

  const seen=[];
  const router=createFirstPartyCoreRouter({
    ports:{
      dtos,schemas,projector:new TransportEnvelopeProjector(),
      executor:{
        async execute(input){
          seen.push(input);
          return {
            kind:"EXECUTED",
            data:{
              principalId:"11111111-1111-4111-8111-111111111111",
              roleIds:[],
              permissionVersion:7,
            },
            meta:{
              requestId:input.context.requestId,
              correlationId:input.context.correlationId,
              operationId:input.operationId,
              outputSchemaVersion:1,
            },
          };
        },
      },
    },
  });
  assert.equal(
    dtos.get(operations.get("core.identity.roles.listEffective")).inputSchema,
    CORE_IDENTITY_ROLES_LIST_EFFECTIVE_INPUT_V1,
  );

  const caller=router.createCaller({
    executionContext:{
      requestId:randomUUID(),correlationId:randomUUID(),
      authentication:{kind:"HUMAN",credential:"already-preflighted"},
      tenantSelector:"tenant-a",
    },
  });
  const result=await caller.core.identity.roles.listEffective({});
  assert.equal(result.kind,"SUCCESS");
  assert.equal(result.envelope.data.permissionVersion,7);
  assert.equal(seen.length,1);
  assert.equal(seen[0].operationId,"core.identity.roles.listEffective");
  assert.equal(seen[0].preparedInput.operationId,"core.identity.roles.listEffective");
  assert.equal(seen[0].preparedInput.canonical,"{}");
});


test("core.tenancy.workspace.resolve has no Tenant-authority DTO field and binds optional Industry selection only",async()=>{
  const operations=new OperationRegistry();
  const dtos=new ZodOperationDtoRegistry();
  const schemas=new OperationSchemaRegistry();
  const domains=new DomainOperationRegistry();
  const workspaceCalls=[];
  const service={
    async resolve(input){
      workspaceCalls.push(input);
      return {
        tenant:{displayKey:"tenant-a",displayName:"Tenant A"},
        selectedIndustry:input.industrySelector
          ? {displayKey:"retail",displayName:"Retail"}:undefined,
        orgUnitId:"11111111-1111-4111-8111-111111111111",
        entitlementSnapshotVersion:5,
        sessionVersion:3,
      };
    },
  };
  registerCoreTenancyWorkspaceResolve({operations,dtos,schemas,domains,service});
  registerCoreIdentityRolesListEffective({
    operations,dtos,schemas,domains,
    service:new IdentityRoleQueryService({async listEffective(){return null;}}),
  });

  assert.equal(
    dtos.get(operations.get("core.tenancy.workspace.resolve")).inputSchema,
    CORE_TENANCY_WORKSPACE_RESOLVE_INPUT_V1,
  );
  assert.equal(
    CORE_TENANCY_WORKSPACE_RESOLVE_INPUT_V1.safeParse({tenantId:"bad"}).success,
    false,
  );

  const seen=[];
  const router=createFirstPartyCoreRouter({
    includeWorkspaceResolve:true,
    ports:{
      dtos,schemas,projector:new TransportEnvelopeProjector(),
      executor:{
        async execute(input){
          seen.push(input);
          return {
            kind:"EXECUTED",
            data:{
              tenant:{displayKey:"tenant-a",displayName:"Tenant A"},
              selectedIndustry:{displayKey:"retail",displayName:"Retail"},
              orgUnitId:"11111111-1111-4111-8111-111111111111",
              entitlementSnapshotVersion:5,
              sessionVersion:3,
            },
            meta:{
              requestId:input.context.requestId,
              correlationId:input.context.correlationId,
              operationId:input.operationId,
              outputSchemaVersion:1,
            },
          };
        },
      },
    },
  });
  const caller=router.createCaller({
    executionContext:{
      requestId:randomUUID(),correlationId:randomUUID(),
      authentication:{kind:"HUMAN",credential:"already-preflighted"},
      tenantSelector:"trusted-host-tenant",
    },
  });
  const result=await caller.core.tenancy.workspace.resolve({industrySelector:" retail "});
  assert.equal(result.kind,"SUCCESS");
  assert.equal(result.envelope.data.selectedIndustry.displayKey,"retail");
  assert.equal(seen[0].operationId,"core.tenancy.workspace.resolve");
  assert.equal(seen[0].context.tenantSelector,"trusted-host-tenant");
  assert.equal(seen[0].preparedInput.canonical,'{"industrySelector":"retail"}');

  const invocationContext={
    requestId:randomUUID(),correlationId:randomUUID(),
    tenantId:randomUUID(),principalId:randomUUID(),membershipId:randomUUID(),
    orgUnitPath:[],roleIds:[],scopeClass:"TENANT_CORE",
  };
  await domains.execute("WorkspaceService.resolve",{
    requestContext:invocationContext,
    operation:operations.get("core.tenancy.workspace.resolve"),
    input:{industrySelector:"retail"},
    guard:{decisionId:randomUUID()},
  });
  assert.equal(workspaceCalls.length,1);
  assert.equal(workspaceCalls[0].requestContext,invocationContext);
  assert.equal(workspaceCalls[0].industrySelector,"retail");
});

test("tRPC Zod transform runs exactly once before canonical preparation",async()=>{
  let transforms=0;
  const operation={
    operationId:"test.transport.once",module:"TEST",scopeClass:"TENANT_CORE",kind:"QUERY",
    permissionCode:"test.transport.once",inputSchemaVersion:1,outputSchemaVersion:1,
    idempotencyPolicy:"NONE",rateClass:"AUTH_STANDARD",auditClass:"STANDARD",
    domainService:"Test.once",emittedEvents:[],errorCodes:[],
  };
  const inputSchema=z.object({
    value:z.string().transform(value=>{transforms++;return value.trim();}),
  });
  const outputSchema=z.object({ok:z.boolean()});
  const dtos=new ZodOperationDtoRegistry();
  const schemas=new OperationSchemaRegistry();
  dtos.register({
    operationId:operation.operationId,inputSchemaVersion:1,outputSchemaVersion:1,
    inputSchema,outputSchema,
  });
  dtos.install(operation,schemas);

  const procedure=createFirstPartyQueryProcedure({
    ports:{
      dtos,schemas,projector:new TransportEnvelopeProjector(),
      executor:{
        async execute(input){
          assert.equal(input.preparedInput.canonical,'{"value":"x"}');
          return {
            kind:"EXECUTED",data:{ok:true},
            meta:{
              requestId:input.context.requestId,
              correlationId:input.context.correlationId,
              operationId:input.operationId,outputSchemaVersion:1,
            },
          };
        },
      },
    },
    operation,inputSchema,outputSchema,
  });
  const router=firstPartyTrpc.router({once:procedure});
  const caller=router.createCaller({
    executionContext:{
      requestId:randomUUID(),correlationId:randomUUID(),
      authentication:{kind:"HUMAN",credential:"x"},tenantSelector:"t",
    },
  });
  const result=await caller.once({value:" x "});
  assert.equal(result.kind,"SUCCESS");
  assert.equal(transforms,1);
});

test("tRPC maps shared RATE_LIMITED projection without leaking a parallel error taxonomy",async()=>{
  const operation={
    operationId:"test.transport.rate",module:"TEST",scopeClass:"TENANT_CORE",kind:"QUERY",
    permissionCode:"test.transport.rate",inputSchemaVersion:1,outputSchemaVersion:1,
    idempotencyPolicy:"NONE",rateClass:"AUTH_STANDARD",auditClass:"STANDARD",
    domainService:"Test.rate",emittedEvents:[],errorCodes:[],
  };
  const inputSchema=z.object({});
  const outputSchema=z.object({ok:z.boolean()});
  const dtos=new ZodOperationDtoRegistry();
  const schemas=new OperationSchemaRegistry();
  dtos.register({
    operationId:operation.operationId,inputSchemaVersion:1,outputSchemaVersion:1,
    inputSchema,outputSchema,
  });
  dtos.install(operation,schemas);
  const procedure=createFirstPartyQueryProcedure({
    ports:{
      dtos,schemas,projector:new TransportEnvelopeProjector(),
      executor:{
        async execute(){
          throw new OperationExecutionError({
            code:"RATE_LIMITED",messageSafe:"The request rate limit has been exceeded.",
            retryable:true,retryAfterSeconds:9,
          });
        },
      },
    },
    operation,inputSchema,outputSchema,
  });
  const router=firstPartyTrpc.router({rate:procedure});
  const caller=router.createCaller({
    executionContext:{
      requestId:randomUUID(),correlationId:randomUUID(),
      authentication:{kind:"HUMAN",credential:"x"},tenantSelector:"t",
    },
  });

  await assert.rejects(
    caller.rate({}),
    error=>error.code==="TOO_MANY_REQUESTS"
      && error.cause?.projection?.envelope?.error?.code==="RATE_LIMITED"
      && error.cause?.projection?.retryAfterSeconds===9,
  );
});
