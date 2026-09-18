import test from "node:test";
import assert from "node:assert/strict";
import {
  OperationSchemaError,
  OperationSchemaRegistry,
} from "../../dist/core/index.js";

const operation={
  operationId:"test.resource.update",module:"TEST",scopeClass:"TENANT_INDUSTRY",kind:"COMMAND",
  permissionCode:"test.resource.update",inputSchemaVersion:2,outputSchemaVersion:3,
  resourceResolver:"test.resource",idempotencyPolicy:"REQUIRED",rateClass:"AUTH_STANDARD",
  auditClass:"STANDARD",domainService:"TestResourceService.update",emittedEvents:[],errorCodes:[],
};

test("schema registry canonicalizes validated JSON recursively and derives resource reference only from parsed input",()=>{
  const registry=new OperationSchemaRegistry();
  registry.register({
    operationId:operation.operationId,inputSchemaVersion:2,outputSchemaVersion:3,
    parseInput(raw){
      assert.equal(raw.clientOnly,"ignored");
      return {z:2,resourceId:"r-1",nested:{b:true,a:1},defaulted:"server"};
    },
    parseOutput(raw){return raw;},
    extractResourceReference(input){return {resourceId:input.resourceId};},
  });
  const validated=registry.validateInput(operation,{clientOnly:"ignored"});
  assert.equal(validated.canonical,'{"defaulted":"server","nested":{"a":1,"b":true},"resourceId":"r-1","z":2}');
  assert.deepEqual(validated.resourceReference,{resourceId:"r-1"});
  assert.equal(Object.isFrozen(validated.value),true);
  assert.equal(Object.isFrozen(validated.value.nested),true);
});

test("schema registry normalizes parser failures and rejects non-JSON schema outputs",()=>{
  const inputFail=new OperationSchemaRegistry();
  inputFail.register({
    operationId:operation.operationId,inputSchemaVersion:2,outputSchemaVersion:3,
    parseInput(){throw new Error("private parser detail");},
    parseOutput(raw){return raw;},
    extractResourceReference(){return {resourceId:"r-1"};},
  });
  assert.throws(
    ()=>inputFail.validateInput(operation,{}),
    error=>error instanceof OperationSchemaError
      && error.code==="INPUT_INVALID"
      && !error.message.includes("private"),
  );

  const outputFail=new OperationSchemaRegistry();
  outputFail.register({
    operationId:operation.operationId,inputSchemaVersion:2,outputSchemaVersion:3,
    parseInput(){return {resourceId:"r-1"};},
    parseOutput(){return new Date();},
    extractResourceReference(){return {resourceId:"r-1"};},
  });
  assert.throws(
    ()=>outputFail.validateOutput(operation,{}),
    error=>error instanceof OperationSchemaError && error.code==="OUTPUT_INVALID",
  );
});

test("resource-bound operation without validated resource extractor fails closed",()=>{
  const registry=new OperationSchemaRegistry();
  registry.register({
    operationId:operation.operationId,inputSchemaVersion:2,outputSchemaVersion:3,
    parseInput(){return {resourceId:"r-1"};},
    parseOutput(raw){return raw;},
  });
  assert.throws(
    ()=>registry.validateInput(operation,{}),
    error=>error instanceof OperationSchemaError && error.code==="SCHEMA_CONTRACT_INVALID",
  );
});
