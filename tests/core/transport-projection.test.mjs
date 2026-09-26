import test from "node:test";
import assert from "node:assert/strict";
import {
  OperationExecutionError,
  TransportEnvelopeProjector,
} from "../../dist/core/index.js";

const projector=new TransportEnvelopeProjector();
const meta={
  requestId:"11111111-1111-4111-8111-111111111111",
  correlationId:"22222222-2222-4222-8222-222222222222",
  operationId:"test.order.create",
  outputSchemaVersion:3,
};

test("executed result projects exactly to the canonical success envelope",()=>{
  const projected=projector.projectResult({
    kind:"EXECUTED",data:{ok:true},meta,responseStatus:"201",responseReference:"order:1",
  });
  assert.deepEqual(projected,{
    kind:"SUCCESS",
    envelope:{
      data:{ok:true},
      meta:{
        requestId:meta.requestId,correlationId:meta.correlationId,
        operationId:meta.operationId,version:3,
      },
    },
    responseStatus:"201",
    responseReference:"order:1",
  });
});

test("idempotency replay remains an explicit control result and never fabricates typed output data",()=>{
  const projected=projector.projectResult({
    kind:"IDEMPOTENT_REPLAY",meta,responseStatus:"201",responseReference:"order:existing",
  });
  assert.equal(projected.kind,"IDEMPOTENT_REPLAY");
  assert.equal(Object.hasOwn(projected,"envelope"),false);
  assert.equal(Object.hasOwn(projected,"data"),false);
  assert.equal(projected.responseReference,"order:existing");
});

test("error projector preserves A-01 classes, safe field codes and Retry-After metadata outside envelope",()=>{
  const input=new OperationExecutionError({
    code:"INPUT_INVALID",messageSafe:"The request input is invalid.",retryable:false,
    fieldErrors:{"/email":["invalid_format"]},
  });
  const projected=projector.projectError({
    error:input,requestId:meta.requestId,correlationId:meta.correlationId,
  });
  assert.deepEqual(projected.envelope.error,{
    code:"INPUT_INVALID",class:"USER_ERROR",messageSafe:"The request input is invalid.",
    retryable:false,fieldErrors:{"/email":["invalid_format"]},
  });

  const rate=projector.projectError({
    error:new OperationExecutionError({
      code:"RATE_LIMITED",messageSafe:"Rate limited.",retryable:true,retryAfterSeconds:9,
    }),
    requestId:meta.requestId,correlationId:meta.correlationId,
  });
  assert.equal(rate.envelope.error.class,"POLICY_DENIAL");
  assert.equal(rate.retryAfterSeconds,9);
  assert.equal(Object.hasOwn(rate.envelope.error,"retryAfterSeconds"),false);
});

test("entitlement and system failures project to distinct error taxonomy classes",()=>{
  const entitlement=projector.projectError({
    error:new OperationExecutionError({
      code:"ENTITLEMENT_DENIED",messageSafe:"Unavailable.",retryable:false,
    }),requestId:meta.requestId,correlationId:meta.correlationId,
  });
  assert.equal(entitlement.envelope.error.class,"ENTITLEMENT_DENIAL");

  const system=projector.projectError({
    error:new OperationExecutionError({
      code:"DEPENDENCY_UNAVAILABLE",messageSafe:"Unavailable.",retryable:true,
    }),requestId:meta.requestId,correlationId:meta.correlationId,
  });
  assert.equal(system.envelope.error.class,"SYSTEM_FAULT");
});
