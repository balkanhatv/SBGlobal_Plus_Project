import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import {
  OperationSchemaError,
  OperationSchemaRegistry,
  ZodOperationDtoRegistry,
} from "../../dist/core/index.js";

const operation=Object.freeze({
  operationId:"test.order.create",module:"TEST",scopeClass:"TENANT_INDUSTRY",kind:"COMMAND",
  permissionCode:"test.order.create",inputSchemaVersion:1,outputSchemaVersion:2,
  resourceResolver:"test.order",idempotencyPolicy:"REQUIRED",rateClass:"AUTH_STANDARD",
  auditClass:"STANDARD",domainService:"TestOrderService.create",emittedEvents:[],errorCodes:[],
});

test("Zod DTO definition is the same schema source used by executor and future transport projection",()=>{
  const inputSchema=z.object({
    orderId:z.string().uuid(),
    quantity:z.coerce.number().int().positive(),
    note:z.string().default("default-note"),
  }).strict();
  const outputSchema=z.object({ok:z.literal(true),orderId:z.string().uuid()}).strict();

  const dtos=new ZodOperationDtoRegistry();
  dtos.register({
    operationId:operation.operationId,inputSchemaVersion:1,outputSchemaVersion:2,
    inputSchema,outputSchema,
    extractResourceReference(input){return {orderId:input.orderId};},
  });

  const exposed=dtos.get(operation);
  assert.equal(exposed.inputSchema,inputSchema);
  assert.equal(exposed.outputSchema,outputSchema);

  const schemas=new OperationSchemaRegistry();
  dtos.install(operation,schemas);
  const id="11111111-1111-4111-8111-111111111111";
  const validated=schemas.validateInput(operation,{orderId:id,quantity:"2"});
  assert.deepEqual(validated.value,{note:"default-note",orderId:id,quantity:2});
  assert.equal(validated.canonical,
    '{"note":"default-note","orderId":"11111111-1111-4111-8111-111111111111","quantity":2}');
  assert.deepEqual(validated.resourceReference,{orderId:id});
  assert.deepEqual(schemas.validateOutput(operation,{ok:true,orderId:id}),{ok:true,orderId:id});
});

test("Zod validation exposes only deterministic field paths and issue codes, not raw values/messages",()=>{
  const dtos=new ZodOperationDtoRegistry();
  dtos.register({
    operationId:operation.operationId,inputSchemaVersion:1,outputSchemaVersion:2,
    inputSchema:z.object({
      email:z.string().email(),
      nested:z.object({count:z.number().int().positive()}),
    }).strict(),
    outputSchema:z.object({ok:z.boolean()}),
    extractResourceReference(){return {orderId:"fixed"};},
  });
  const schemas=new OperationSchemaRegistry();
  dtos.install(operation,schemas);

  assert.throws(
    ()=>schemas.validateInput(operation,{email:"secret-invalid",nested:{count:-4}}),
    error=>{
      assert.equal(error instanceof OperationSchemaError,true);
      assert.equal(error.code,"INPUT_INVALID");
      assert.equal(error.message,"The request input is invalid.");
      assert.deepEqual(Object.keys(error.fieldErrors),["/email","/nested/count"]);
      assert.equal(JSON.stringify(error.fieldErrors).includes("secret-invalid"),false);
      assert.equal(JSON.stringify(error.fieldErrors).includes("-4"),false);
      return true;
    },
  );
});

test("Zod DTO registry fails closed on operation/schema version mismatch",()=>{
  const dtos=new ZodOperationDtoRegistry();
  dtos.register({
    operationId:operation.operationId,inputSchemaVersion:1,outputSchemaVersion:2,
    inputSchema:z.object({}),outputSchema:z.object({}),
  });
  assert.throws(
    ()=>dtos.get({...operation,inputSchemaVersion:2}),
    error=>error.code==="SCHEMA_UNAVAILABLE",
  );
});
