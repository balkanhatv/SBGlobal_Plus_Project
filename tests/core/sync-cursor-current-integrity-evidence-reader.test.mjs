import test from "node:test";
import assert from "node:assert/strict";

import {
  loadSyncCursorCurrentIntegrityEvidence,
} from "../../dist/core/index.js";

const ids=Object.freeze({
  tenant:"11111111-1111-4111-8111-111111111111",
  industry:"22222222-2222-4222-8222-222222222222",
  integration:"33333333-3333-4333-8333-333333333333",
  definition:"44444444-4444-4444-8444-444444444444",
  credential:"55555555-5555-4555-8555-555555555555",
  cursor:"66666666-6666-4666-8666-666666666666",
  capRead:"77777777-7777-4777-8777-777777777777",
  capWrite:"88888888-8888-4888-8888-888888888888",
});

const requestContext=Object.freeze({
  requestId:"request-1",correlationId:"correlation-1",
  tenantId:ids.tenant,industryContextId:ids.industry,
  principalId:"principal-1",principalType:"HUMAN",
  orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),
  permissionVersion:1,entitlementSnapshotVersion:1,
  scopeClass:"TENANT_INDUSTRY",
});
const evaluatedAt="2026-10-05T05:00:00.000Z";

function cursor(overrides={}) {
  return Object.freeze({
    id:ids.cursor,
    tenantIntegrationId:ids.integration,
    capabilityCode:"orders.read",
    industryContextId:ids.industry,
    cursorEncryptedOrOpaque:"opaque:cursor",
    watermarkTime:"2026-10-05T04:00:00.000Z",
    sourceVersion:"raw-v1",
    updatedAt:"2026-10-05T04:01:00.000Z",
    ...overrides,
  });
}
function integration(overrides={}) {
  return Object.freeze({
    id:ids.integration,tenantId:ids.tenant,industryContextId:ids.industry,
    integrationDefinitionId:ids.definition,scopeClass:"TENANT_INDUSTRY",
    displayName:"ERP",status:"ACTIVE",credentialReferenceId:ids.credential,
    config:Object.freeze({mode:"safe"}),
    enabledCapabilities:Object.freeze(["orders.read","orders.write"]),
    permissionProfileId:"raw-profile",healthState:"UNAVAILABLE",version:1,
    createdAt:"2026-10-01T00:00:00.000Z",updatedAt:"2026-10-05T00:00:00.000Z",
    ...overrides,
  });
}
function credential(overrides={}) {
  return Object.freeze({
    id:ids.credential,tenantId:ids.tenant,industryContextId:ids.industry,
    secretStoreProvider:"vault",credentialType:"API_KEY",keyVersion:7,
    status:"ACTIVE",rotatedAt:"2026-10-01T00:00:00.000Z",
    expiresAt:"2026-10-06T00:00:00.000Z",
    createdAt:"2026-09-01T00:00:00.000Z",...overrides,
  });
}
function definition(overrides={}) {
  return Object.freeze({
    id:ids.definition,code:"erp",name:"ERP",providerFamily:"example",
    capabilityCodes:Object.freeze(["orders.read","orders.write"]),
    adapterContractVersion:"v1",ownerScope:"PLATFORM",status:"ACTIVE",
    dataTransferClass:"INTERNAL",residencyMetadata:Object.freeze({raw:true}),
    createdAt:"2026-09-01T00:00:00.000Z",
    updatedAt:"2026-10-01T00:00:00.000Z",...overrides,
  });
}
function capRead(overrides={}) {
  return Object.freeze({
    id:ids.capRead,integrationDefinitionId:ids.definition,capabilityCode:"orders.read",
    direction:"INBOUND",operationContractId:"operation.read",
    eventTypes:Object.freeze([]),dataClass:"INTERNAL",
    idempotencyClass:"STANDARD",rateClass:"AUTH_STANDARD",status:"ACTIVE",...overrides,
  });
}
function capWrite(overrides={}) {
  return Object.freeze({
    id:ids.capWrite,integrationDefinitionId:ids.definition,capabilityCode:"orders.write",
    direction:"OUTBOUND",operationContractId:"operation.write",
    eventTypes:Object.freeze(["ORDER.WRITTEN"]),dataClass:"INTERNAL",
    idempotencyClass:"REQUIRED",rateClass:"AUTH_STANDARD",status:"ACTIVE",...overrides,
  });
}

function fixture(overrides={}) {
  const order=[];
  const calls={cursor:[],integration:[],capability:[],credential:[],definition:[]};
  const values={
    cursor:Object.hasOwn(overrides,"cursor")?overrides.cursor:cursor(),
    integration:Object.hasOwn(overrides,"integration")?overrides.integration:integration(),
    cursorCapability:Object.hasOwn(overrides,"cursorCapability")?overrides.cursorCapability:capRead(),
    credential:Object.hasOwn(overrides,"credential")?overrides.credential:credential(),
    definition:Object.hasOwn(overrides,"definition")?overrides.definition:definition(),
    writeCapability:Object.hasOwn(overrides,"writeCapability")?overrides.writeCapability:capWrite(),
  };
  return {
    order,calls,values,
    cursorReader:{async loadExact(input){order.push("cursor");calls.cursor.push(input);if(overrides.cursorError)throw overrides.cursorError;return values.cursor;}},
    integrationReader:{async loadForContext(input){order.push("integration");calls.integration.push(input);if(overrides.integrationError)throw overrides.integrationError;return values.integration;}},
    capabilityReader:{async loadExact(input){
      order.push("capability");calls.capability.push(input);
      if(overrides.capabilityError && input.capabilityCode===overrides.capabilityErrorCode)throw overrides.capabilityError;
      if(overrides.nullCapability===input.capabilityCode)return null;
      if(input.capabilityCode==="orders.read")return values.cursorCapability;
      if(input.capabilityCode==="orders.write")return values.writeCapability;
      return null;
    }},
    credentialReader:{async loadForContext(input){order.push("credential");calls.credential.push(input);if(overrides.credentialError)throw overrides.credentialError;return values.credential;}},
    definitionReader:{async loadById(id){order.push("definition");calls.definition.push(id);if(overrides.definitionError)throw overrides.definitionError;return values.definition;}},
  };
}

async function load(f,inputOverrides={}) {
  return loadSyncCursorCurrentIntegrityEvidence(
    {
      requestContext,
      tenantIntegrationId:ids.integration,
      capabilityCode:"orders.read",
      industryContextId:ids.industry,
      evaluatedAt,
      ...inputOverrides,
    },
    f.cursorReader,
    f.integrationReader,
    f.capabilityReader,
    f.credentialReader,
    f.definitionReader,
  );
}

test("SYNC-INTCUR-BASE-001 exact DD-502 parent executes first with unchanged input and read ports",async()=>{
  const f=fixture();
  const result=await load(f);
  assert.ok(result);
  assert.deepEqual(f.order,[
    "cursor","integration","capability","credential","definition","capability",
  ]);
  assert.deepEqual(f.calls.cursor,[{
    requestContext,tenantIntegrationId:ids.integration,
    capabilityCode:"orders.read",industryContextId:ids.industry,
  }]);
  assert.equal(result.parent.cursor,f.values.cursor);
  assert.equal(result.parent.integration,f.values.integration);
  assert.equal(result.parent.capability,f.values.cursorCapability);
});

test("SYNC-INTCUR-BASE-002 DD-502 null/error short-circuits or propagates before integrity dependency reads",async()=>{
  const hidden=fixture({cursor:null});
  assert.equal(await load(hidden),null);
  assert.deepEqual(hidden.order,["cursor"]);
  assert.deepEqual(hidden.calls.credential,[]);
  assert.deepEqual(hidden.calls.definition,[]);

  const expected=new Error("cursor-failed");
  const broken=fixture({cursorError:expected});
  await assert.rejects(load(broken),error=>error===expected);
  assert.deepEqual(broken.order,["cursor"]);
  assert.deepEqual(broken.calls.credential,[]);
});

test("SYNC-INTCUR-CRED-001 exact same-context CredentialReference metadata read uses preserved parent credential id",async()=>{
  const f=fixture(); assert.ok(await load(f));
  assert.deepEqual(f.calls.credential,[{
    requestContext,credentialReferenceId:ids.credential,
  }]);

  const hidden=fixture({credential:null});
  assert.equal(await load(hidden),null);
  assert.deepEqual(hidden.order,["cursor","integration","capability","credential"]);

  const expected=new Error("credential-failed");
  const broken=fixture({credentialError:expected});
  await assert.rejects(load(broken),error=>error===expected);
});

test("SYNC-INTCUR-DEF-001 exact IntegrationDefinition read uses preserved parent definition id and fails closed",async()=>{
  const f=fixture(); assert.ok(await load(f));
  assert.deepEqual(f.calls.definition,[ids.definition]);

  const hidden=fixture({definition:null});
  assert.equal(await load(hidden),null);
  assert.deepEqual(hidden.order,["cursor","integration","capability","credential","definition"]);

  const expected=new Error("definition-failed");
  const broken=fixture({definitionError:expected});
  await assert.rejects(load(broken),error=>error===expected);
});

test("SYNC-INTCUR-CAP-001 persisted capability order reuses exact DD-502 cursor capability with zero duplicate read",async()=>{
  const f=fixture();
  const result=await load(f);
  assert.ok(result);
  assert.deepEqual(f.calls.capability,[
    {integrationDefinitionId:ids.definition,capabilityCode:"orders.read"},
    {integrationDefinitionId:ids.definition,capabilityCode:"orders.write"},
  ]);
  assert.equal(result.integrationCurrentIntegrity.capabilities[0],f.values.cursorCapability);
  assert.equal(result.integrationCurrentIntegrity.capabilities[1],f.values.writeCapability);
  assert.equal(result.parent.capability,result.integrationCurrentIntegrity.capabilities[0]);

  const onlyCursor=fixture({
    integration:integration({enabledCapabilities:Object.freeze(["orders.read"])}),
    definition:definition({capabilityCodes:Object.freeze(["orders.read"])}),
  });
  const onlyResult=await load(onlyCursor);
  assert.ok(onlyResult);
  assert.equal(onlyCursor.calls.capability.length,1);
  assert.equal(onlyResult.integrationCurrentIntegrity.capabilities[0],onlyCursor.values.cursorCapability);
});

test("SYNC-INTCUR-DEP-001 missing or failed remaining capability evidence fails closed with no fallback",async()=>{
  const missing=fixture({nullCapability:"orders.write"});
  assert.equal(await load(missing),null);
  assert.deepEqual(missing.calls.capability,[
    {integrationDefinitionId:ids.definition,capabilityCode:"orders.read"},
    {integrationDefinitionId:ids.definition,capabilityCode:"orders.write"},
  ]);

  const expected=new Error("capability-failed");
  const broken=fixture({capabilityError:expected,capabilityErrorCode:"orders.write"});
  await assert.rejects(load(broken),error=>error===expected);
  assert.equal(broken.calls.capability.length,2);
});

test("SYNC-INTCUR-FLOOR-001 exact assembled evidence satisfying DD-167 passes with exact supplied evaluation instant",async()=>{
  const f=fixture();
  const result=await load(f);
  assert.ok(result);
  assert.equal(result.integrationCurrentIntegrity.integration,f.values.integration);
  assert.equal(result.integrationCurrentIntegrity.credential,f.values.credential);
  assert.equal(result.integrationCurrentIntegrity.definition,f.values.definition);
  assert.equal(result.integrationCurrentIntegrity.evaluatedAt,evaluatedAt);
});

test("SYNC-INTCUR-FLOOR-002 credential definition config or enabled-capability integrity mismatch fails closed",async()=>{
  const cases=[
    fixture({credential:credential({status:"REVOKED"})}),
    fixture({credential:credential({expiresAt:evaluatedAt})}),
    fixture({definition:definition({status:"RETIRED"})}),
    fixture({integration:integration({config:Object.freeze([])})}),
    fixture({writeCapability:capWrite({status:"RETIRED"})}),
  ];
  for(const f of cases) assert.equal(await load(f),null);
});

test("SYNC-INTCUR-EVID-001 success returns frozen exact-reference parent and integration-integrity evidence unchanged",async()=>{
  const f=fixture();
  const input=Object.freeze({
    requestContext,tenantIntegrationId:ids.integration,
    capabilityCode:"orders.read",industryContextId:ids.industry,evaluatedAt,
  });
  const before=JSON.stringify([
    input,f.values.cursor,f.values.integration,f.values.cursorCapability,
    f.values.credential,f.values.definition,f.values.writeCapability,
  ]);
  const result=await loadSyncCursorCurrentIntegrityEvidence(
    input,f.cursorReader,f.integrationReader,f.capabilityReader,
    f.credentialReader,f.definitionReader,
  );
  assert.ok(result);
  assert.equal(Object.isFrozen(result),true);
  assert.equal(Object.isFrozen(result.integrationCurrentIntegrity),true);
  assert.equal(Object.isFrozen(result.integrationCurrentIntegrity.capabilities),true);
  assert.equal(result.parent.cursor,f.values.cursor);
  assert.equal(result.parent.integration,f.values.integration);
  assert.equal(result.parent.capability,f.values.cursorCapability);
  assert.equal(result.integrationCurrentIntegrity.integration,f.values.integration);
  assert.equal(result.integrationCurrentIntegrity.credential,f.values.credential);
  assert.equal(result.integrationCurrentIntegrity.definition,f.values.definition);
  assert.equal(result.integrationCurrentIntegrity.capabilities[0],f.values.cursorCapability);
  assert.equal(result.integrationCurrentIntegrity.capabilities[1],f.values.writeCapability);
  assert.equal(JSON.stringify([
    input,f.values.cursor,f.values.integration,f.values.cursorCapability,
    f.values.credential,f.values.definition,f.values.writeCapability,
  ]),before);
});

test("SYNC-INTCUR-BOUND-001 output grants no cursor validity freshness resume provider secret health commercial sync network dispatch mutation or event authority",async()=>{
  const result=await load(fixture()); assert.ok(result);
  for(const target of [result,result.integrationCurrentIntegrity]) {
    for(const forbidden of [
      "cursorValid","cursorFresh","resumable","resumeAuthorized","replayAuthorized",
      "syncAuthorized","provider","providerAdapter","secretReference","secretMaterial",
      "healthApproved","permissionProfile","operationAuthorized","eventAuthorized",
      "guardResult","commercialAllowed","networkAuthorized","dispatchAuthorized",
      "mutation","eventEmitted",
    ]) assert.equal(forbidden in target,false);
  }
});
