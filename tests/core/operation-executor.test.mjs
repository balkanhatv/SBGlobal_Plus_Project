import test from "node:test";
import assert from "node:assert/strict";
import {
  DomainOperationError,
  DomainOperationRegistry,
  GuardPipelineError,
  IdempotencyRuntimeError,
  OperationExecutionError,
  OperationExecutor,
  OperationRegistry,
  OperationSchemaRegistry,
  RateLimitRuntimeError,
} from "../../dist/core/index.js";

const operation={
  operationId:"test.sale.create",module:"TEST",scopeClass:"TENANT_INDUSTRY",kind:"COMMAND",
  permissionCode:"test.sale.create",inputSchemaVersion:1,outputSchemaVersion:1,
  resourceResolver:"test.sale",idempotencyPolicy:"REQUIRED",rateClass:"AUTH_STANDARD",
  auditClass:"STANDARD",domainService:"TestSaleService.create",
  emittedEvents:["test.sale.created"],errorCodes:["DOMAIN_CONFLICT"],
};
const context={
  requestId:"11111111-1111-4111-8111-111111111111",
  correlationId:"22222222-2222-4222-8222-222222222222",
  tenantId:"33333333-3333-4333-8333-333333333333",
  industryContextId:"44444444-4444-4444-8444-444444444444",
  principalId:"55555555-5555-4555-8555-555555555555",
  principalType:"HUMAN",orgUnitPath:[],roleIds:[],scopeClass:"TENANT_INDUSTRY",
};
const started={
  kind:"STARTED",recordId:"66666666-6666-4666-8666-666666666666",
  requestFingerprint:"a".repeat(64),expiresAt:"2026-09-19T00:00:00.000Z",
};

function fixture(options={}){
  const calls=[];
  const operations=new OperationRegistry();
  operations.register(options.operation??operation);
  const schemas=new OperationSchemaRegistry();
  schemas.register({
    operationId:(options.operation??operation).operationId,
    inputSchemaVersion:(options.operation??operation).inputSchemaVersion,
    outputSchemaVersion:(options.operation??operation).outputSchemaVersion,
    parseInput(raw){calls.push("schema.input"); if(options.inputFail) throw new Error("bad"); return {amount:raw.amount,resourceId:raw.resourceId};},
    parseOutput(raw){calls.push("schema.output"); if(options.outputFail) throw new Error("bad output"); return raw;},
    extractResourceReference(input){return {saleId:input.resourceId};},
  });
  const domains=new DomainOperationRegistry();
  domains.register((options.operation??operation).domainService,{
    async execute(input){
      calls.push("domain");
      if(options.domainError) throw options.domainError;
      return {output:{ok:true,id:input.input.resourceId},responseStatus:"201",responseReference:"sale:1"};
    },
  });
  const ports={
    operations,
    schemas,
    contexts:{
      async resolve(input){calls.push(["context",input]); if(options.contextError) throw options.contextError; return context;},
    },
    rateLimits:{
      async acquire(){calls.push("rate.acquire"); if(options.rateError) throw options.rateError; return {leases:[{leaseId:"l1",bucketKeyHash:"h1"}]};},
      async release(){calls.push("rate.release"); if(options.releaseError) throw new Error("release failed");},
    },
    guards:{
      async authorize(input){calls.push(["guard",input]); if(options.guardError) throw options.guardError; return {decisionId:"d1"};},
    },
    idempotency:{
      async begin(input){calls.push(["idem.begin",input]); if(options.beginError) throw options.beginError; return options.beginResult??started;},
      async completeSuccess(input){calls.push(["idem.success",input]); if(options.successError) throw options.successError;},
      async completeFailure(input){calls.push(["idem.failure",input]); if(options.failureError) throw options.failureError;},
    },
    domains,
  };
  return {executor:new OperationExecutor(ports),calls,ports};
}

test("executor enforces context->schema->rate->guard->idempotency->domain->output->completion and route-bound scope",async()=>{
  const {executor,calls}=fixture();
  const result=await executor.execute({
    operationId:operation.operationId,
    rawInput:{resourceId:"sale-1",amount:10},
    context:{
      requestId:"transport-request",
      scopeClass:"PUBLIC",
      tenantSelector:"tenant-a",
      industrySelector:"retail",
    },
    idempotencyKey:"key-1",
  });
  assert.equal(result.kind,"EXECUTED");
  assert.deepEqual(result.data,{id:"sale-1",ok:true});
  assert.equal(calls[0][0],"context");
  assert.equal(calls[0][1].scopeClass,"TENANT_INDUSTRY");
  assert.deepEqual(
    calls.map(x=>Array.isArray(x)?x[0]:x),
    ["context","schema.input","rate.acquire","guard","idem.begin","domain","schema.output","idem.success","rate.release"],
  );
  const guardCall=calls.find(x=>Array.isArray(x)&&x[0]==="guard")[1];
  assert.deepEqual(guardCall.resourceReference,{saleId:"sale-1"});
  const idemCall=calls.find(x=>Array.isArray(x)&&x[0]==="idem.begin")[1];
  assert.equal(idemCall.canonicalValidatedInput,'{"amount":10,"resourceId":"sale-1"}');
});

test("idempotent replay still passes current rate+guard but never calls domain/output",async()=>{
  const {executor,calls}=fixture({beginResult:{
    kind:"REPLAY",recordId:"r1",responseStatus:"201",responseReference:"sale:existing",
  }});
  const result=await executor.execute({
    operationId:operation.operationId,rawInput:{resourceId:"sale-1",amount:10},
    context:{requestId:"r",tenantSelector:"t",industrySelector:"i"},idempotencyKey:"same",
  });
  assert.equal(result.kind,"IDEMPOTENT_REPLAY");
  assert.equal(result.responseReference,"sale:existing");
  assert.deepEqual(calls.map(x=>Array.isArray(x)?x[0]:x),
    ["context","schema.input","rate.acquire","guard","idem.begin","rate.release"]);
});

test("rate denial stops before guard/idempotency/domain",async()=>{
  const {executor,calls}=fixture({rateError:new RateLimitRuntimeError({
    code:"RATE_LIMITED",message:"limited",retryAfterSeconds:7,rateClass:"AUTH_STANDARD",dimension:"PRINCIPAL",
  })});
  await assert.rejects(
    executor.execute({
      operationId:operation.operationId,rawInput:{resourceId:"s",amount:1},
      context:{requestId:"r",tenantSelector:"t",industrySelector:"i"},idempotencyKey:"k",
    }),
    error=>error instanceof OperationExecutionError
      && error.code==="RATE_LIMITED"
      && error.retryAfterSeconds===7
      && error.retryable===true,
  );
  assert.deepEqual(calls.map(x=>Array.isArray(x)?x[0]:x),["context","schema.input","rate.acquire"]);
});

test("guard denial releases acquired rate capacity and does not claim idempotency",async()=>{
  const {executor,calls}=fixture({guardError:new GuardPipelineError({
    code:"PERMISSION_DENIED",messageSafe:"Denied.",decisionId:"d-deny",
  })});
  await assert.rejects(
    executor.execute({
      operationId:operation.operationId,rawInput:{resourceId:"s",amount:1},
      context:{requestId:"r",tenantSelector:"t",industrySelector:"i"},idempotencyKey:"k",
    }),
    error=>error.code==="PERMISSION_DENIED" && error.decisionId==="d-deny",
  );
  assert.deepEqual(calls.map(x=>Array.isArray(x)?x[0]:x),
    ["context","schema.input","rate.acquire","guard","rate.release"]);
});

test("declared domain failure completes STARTED idempotency before returning safe error",async()=>{
  const {executor,calls}=fixture({domainError:new DomainOperationError({
    code:"DOMAIN_CONFLICT",messageSafe:"Conflict.",retryable:false,responseReference:"sale:1",
  })});
  await assert.rejects(
    executor.execute({
      operationId:operation.operationId,rawInput:{resourceId:"s",amount:1},
      context:{requestId:"r",tenantSelector:"t",industrySelector:"i"},idempotencyKey:"k",
    }),
    error=>error.code==="DOMAIN_CONFLICT" && error.retryable===false,
  );
  const failure=calls.find(x=>Array.isArray(x)&&x[0]==="idem.failure")[1];
  assert.equal(failure.retryable,false);
  assert.equal(failure.responseStatus,"DOMAIN_CONFLICT");
  assert.equal(failure.responseReference,"sale:1");
  assert.equal(calls.at(-1),"rate.release");
});

test("output-schema failure becomes final idempotency failure",async()=>{
  const {executor,calls}=fixture({outputFail:true});
  await assert.rejects(
    executor.execute({
      operationId:operation.operationId,rawInput:{resourceId:"s",amount:1},
      context:{requestId:"r",tenantSelector:"t",industrySelector:"i"},idempotencyKey:"k",
    }),
    error=>error.code==="OUTPUT_INVALID" && error.retryable===false,
  );
  const failure=calls.find(x=>Array.isArray(x)&&x[0]==="idem.failure")[1];
  assert.equal(failure.retryable,false);
  assert.equal(failure.responseStatus,"OUTPUT_INVALID");
});

test("post-domain idempotency success failure never converts the record to retryable failure",async()=>{
  const {executor,calls}=fixture({successError:new IdempotencyRuntimeError(
    "IDEMPOTENCY_DEPENDENCY_UNAVAILABLE","completion unavailable",
  )});
  await assert.rejects(
    executor.execute({
      operationId:operation.operationId,rawInput:{resourceId:"s",amount:1},
      context:{requestId:"r",tenantSelector:"t",industrySelector:"i"},idempotencyKey:"k",
    }),
    error=>error.code==="IDEMPOTENCY_DEPENDENCY_UNAVAILABLE" && error.retryable===true,
  );
  assert.equal(calls.some(x=>Array.isArray(x)&&x[0]==="idem.failure"),false);
  assert.equal(calls.at(-1),"rate.release");
});

test("rate release cleanup failure does not rewrite an already completed result",async()=>{
  const {executor}=fixture({releaseError:true});
  const result=await executor.execute({
    operationId:operation.operationId,rawInput:{resourceId:"s",amount:1},
    context:{requestId:"r",tenantSelector:"t",industrySelector:"i"},idempotencyKey:"k",
  });
  assert.equal(result.kind,"EXECUTED");
});

test("undeclared DomainOperationError is normalized without exposing private details",async()=>{
  const {executor,calls}=fixture({domainError:new DomainOperationError({
    code:"PRIVATE_DB_FAILURE",messageSafe:"private",retryable:true,
  })});
  await assert.rejects(
    executor.execute({
      operationId:operation.operationId,rawInput:{resourceId:"s",amount:1},
      context:{requestId:"r",tenantSelector:"t",industrySelector:"i"},idempotencyKey:"k",
    }),
    error=>error.code==="DEPENDENCY_UNAVAILABLE"
      && error.retryable===true
      && !error.message.includes("private"),
  );
  assert.equal(calls.find(x=>Array.isArray(x)&&x[0]==="idem.failure")[1].retryable,true);
});

test("unknown post-dispatch domain exception is non-retryable because mutation outcome is ambiguous",async()=>{
  const {executor,calls}=fixture({domainError:new Error("socket closed after commit")});
  await assert.rejects(
    executor.execute({
      operationId:operation.operationId,rawInput:{resourceId:"s",amount:1},
      context:{requestId:"r",tenantSelector:"t",industrySelector:"i"},idempotencyKey:"k",
    }),
    error=>error.code==="DEPENDENCY_UNAVAILABLE"
      && error.retryable===false
      && !error.message.includes("socket"),
  );
  const failure=calls.find(x=>Array.isArray(x)&&x[0]==="idem.failure")[1];
  assert.equal(failure.retryable,false);
  assert.equal(failure.responseStatus,"DEPENDENCY_UNAVAILABLE");
});
