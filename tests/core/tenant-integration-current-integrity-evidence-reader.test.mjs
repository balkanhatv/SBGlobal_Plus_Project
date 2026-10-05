import test from "node:test";
import assert from "node:assert/strict";

import {
  loadTenantIntegrationCurrentIntegrityEvidence,
} from "../../dist/core/index.js";

const ids=Object.freeze({
  tenant:"11111111-1111-4111-8111-111111111111",
  industry:"22222222-2222-4222-8222-222222222222",
  integration:"33333333-3333-4333-8333-333333333333",
  definition:"44444444-4444-4444-8444-444444444444",
  credential:"55555555-5555-4555-8555-555555555555",
  cap1:"66666666-6666-4666-8666-666666666666",
  cap2:"77777777-7777-4777-8777-777777777777",
});

const requestContext=Object.freeze({
  requestId:"request-1",correlationId:"correlation-1",
  tenantId:ids.tenant,industryContextId:ids.industry,
  principalId:"principal-1",principalType:"HUMAN",
  orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),
  permissionVersion:1,entitlementSnapshotVersion:1,
  scopeClass:"TENANT_INDUSTRY",
});

const evaluatedAt="2026-10-05T04:00:00.000Z";

function integration(overrides={}) {
  return Object.freeze({
    id:ids.integration,tenantId:ids.tenant,industryContextId:ids.industry,
    integrationDefinitionId:ids.definition,scopeClass:"TENANT_INDUSTRY",
    displayName:"ERP Integration",status:"PAUSED",
    credentialReferenceId:ids.credential,
    config:Object.freeze({mode:"safe"}),
    enabledCapabilities:Object.freeze(["orders.read","orders.write"]),
    permissionProfileId:"raw-profile",
    healthState:"UNAVAILABLE",version:3,
    createdAt:"2026-10-01T00:00:00.000Z",
    updatedAt:"2026-10-05T00:00:00.000Z",
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
const capRead=Object.freeze({
  id:ids.cap1,integrationDefinitionId:ids.definition,capabilityCode:"orders.read",
  direction:"INBOUND",operationContractId:"operation.read",
  eventTypes:Object.freeze([]),dataClass:"INTERNAL",
  idempotencyClass:"STANDARD",rateClass:"AUTH_STANDARD",status:"ACTIVE",
});
const capWrite=Object.freeze({
  id:ids.cap2,integrationDefinitionId:ids.definition,capabilityCode:"orders.write",
  direction:"OUTBOUND",operationContractId:"operation.write",
  eventTypes:Object.freeze(["ORDER.WRITTEN"]),dataClass:"INTERNAL",
  idempotencyClass:"REQUIRED",rateClass:"AUTH_STANDARD",status:"ACTIVE",
});

function fixture(overrides={}) {
  const order=[];
  const calls={integration:[],credential:[],definition:[],capability:[]};
  const values={
    integration:Object.hasOwn(overrides,"integration")?overrides.integration:integration(),
    credential:Object.hasOwn(overrides,"credential")?overrides.credential:credential(),
    definition:Object.hasOwn(overrides,"definition")?overrides.definition:definition(),
  };
  const capabilityMap=overrides.capabilityMap ?? {
    "orders.read":capRead,
    "orders.write":capWrite,
  };
  return {
    order,calls,values,
    integrationReader:{async loadForContext(input){order.push("integration");calls.integration.push(input);if(overrides.integrationError)throw overrides.integrationError;return values.integration;}},
    credentialReader:{async loadForContext(input){order.push("credential");calls.credential.push(input);if(overrides.credentialError)throw overrides.credentialError;return values.credential;}},
    definitionReader:{async loadById(id){order.push("definition");calls.definition.push(id);if(overrides.definitionError)throw overrides.definitionError;return values.definition;}},
    capabilityReader:{async loadExact(input){order.push("capability");calls.capability.push(input);if(overrides.capabilityError)throw overrides.capabilityError;if(overrides.nullCapability===input.capabilityCode)return null;return capabilityMap[input.capabilityCode]??null;}},
  };
}

async function load(f,inputOverrides={}) {
  return loadTenantIntegrationCurrentIntegrityEvidence(
    {requestContext,tenantIntegrationId:ids.integration,evaluatedAt,...inputOverrides},
    f.integrationReader,f.credentialReader,f.definitionReader,f.capabilityReader,
  );
}

test("INT-EVID-BASE-001 exact visible TenantIntegration read occurs first and null/error short-circuits dependencies",async()=>{
  const ok=fixture(); assert.ok(await load(ok));
  assert.equal(ok.calls.integration.length,1);
  assert.equal(ok.calls.integration[0].requestContext,requestContext);
  assert.equal(ok.calls.integration[0].tenantIntegrationId,ids.integration);
  assert.equal(ok.order[0],"integration");

  const hidden=fixture({integration:null});
  assert.equal(await load(hidden),null);
  assert.deepEqual(hidden.order,["integration"]);

  const expected=new Error("integration-failed");
  const broken=fixture({integrationError:expected});
  await assert.rejects(load(broken),error=>error===expected);
  assert.deepEqual(broken.order,["integration"]);
});

test("INT-EVID-CRED-001 exact same-context CredentialReference read is singular and fail-closed",async()=>{
  const f=fixture(); assert.ok(await load(f));
  assert.equal(f.calls.credential.length,1);
  assert.equal(f.calls.credential[0].requestContext,requestContext);
  assert.equal(f.calls.credential[0].credentialReferenceId,ids.credential);

  const hidden=fixture({credential:null}); assert.equal(await load(hidden),null);
  const expected=new Error("credential-failed");
  const broken=fixture({credentialError:expected});
  await assert.rejects(load(broken),error=>error===expected);
});

test("INT-EVID-DEF-001 exact IntegrationDefinition read is singular and fail-closed",async()=>{
  const f=fixture(); assert.ok(await load(f));
  assert.deepEqual(f.calls.definition,[ids.definition]);

  const hidden=fixture({definition:null}); assert.equal(await load(hidden),null);
  const expected=new Error("definition-failed");
  const broken=fixture({definitionError:expected});
  await assert.rejects(load(broken),error=>error===expected);
});

test("INT-EVID-CAP-001 enabled Capability reads preserve persisted order with no normalization dedupe or fallback",async()=>{
  const f=fixture(); assert.ok(await load(f));
  assert.deepEqual(f.calls.capability,[
    {integrationDefinitionId:ids.definition,capabilityCode:"orders.read"},
    {integrationDefinitionId:ids.definition,capabilityCode:"orders.write"},
  ]);

  const empty=fixture({integration:integration({enabledCapabilities:Object.freeze([])})});
  const emptyResult=await load(empty); assert.ok(emptyResult);
  assert.deepEqual(empty.calls.capability,[]);
  assert.deepEqual(emptyResult.capabilities,[]);

  const duplicate=fixture({integration:integration({enabledCapabilities:Object.freeze(["orders.read","orders.read"])})});
  assert.equal(await load(duplicate),null);
  assert.equal(duplicate.calls.capability.length,2);

  const missing=fixture({nullCapability:"orders.write"});
  assert.equal(await load(missing),null);

  const expected=new Error("capability-failed");
  const broken=fixture({capabilityError:expected});
  await assert.rejects(load(broken),error=>error===expected);
});

test("INT-EVID-FLOOR-001 exact DD-167 current-integrity evidence passes with supplied evaluation instant",async()=>{
  const f=fixture();
  const result=await load(f);
  assert.ok(result);
  assert.equal(result.integration,f.values.integration);
  assert.equal(result.credential,f.values.credential);
  assert.equal(result.definition,f.values.definition);
  assert.equal(result.capabilities[0],capRead);
  assert.equal(result.capabilities[1],capWrite);
  assert.equal(result.evaluatedAt,evaluatedAt);
});

test("INT-EVID-FLOOR-002 credential or Definition/config/capability current-integrity mismatch fails closed",async()=>{
  const cases=[
    fixture({credential:credential({status:"REVOKED"})}),
    fixture({credential:credential({expiresAt:evaluatedAt})}),
    fixture({definition:definition({status:"RETIRED"})}),
    fixture({integration:integration({config:Object.freeze([])})}),
    fixture({capabilityMap:{"orders.read":capRead,"orders.write":Object.freeze({...capWrite,status:"RETIRED"})}}),
  ];
  for(const f of cases) assert.equal(await load(f),null);
});

test("INT-EVID-EVID-001 success returns frozen exact-reference evidence and leaves inputs unchanged",async()=>{
  const f=fixture();
  const input=Object.freeze({requestContext,tenantIntegrationId:ids.integration,evaluatedAt});
  const before=JSON.stringify([input,f.values.integration,f.values.credential,f.values.definition,capRead,capWrite]);
  const result=await loadTenantIntegrationCurrentIntegrityEvidence(
    input,f.integrationReader,f.credentialReader,f.definitionReader,f.capabilityReader,
  );
  assert.ok(result);
  assert.equal(Object.isFrozen(result),true);
  assert.equal(Object.isFrozen(result.capabilities),true);
  assert.equal(result.integration,f.values.integration);
  assert.equal(result.credential,f.values.credential);
  assert.equal(result.definition,f.values.definition);
  assert.equal(result.capabilities[0],capRead);
  assert.equal(result.capabilities[1],capWrite);
  assert.equal(JSON.stringify([input,f.values.integration,f.values.credential,f.values.definition,capRead,capWrite]),before);
});

test("INT-EVID-BOUND-001 current-integrity evidence grants no lifecycle health profile secret provider operation sync network or mutation authority",async()=>{
  const result=await load(fixture()); assert.ok(result);
  for(const forbidden of [
    "executable","statusApproved","healthApproved","permissionProfile",
    "secretReference","secretMaterial","provider","providerAdapter",
    "operationAuthorized","eventAuthorized","syncAuthorized","callbackAuthorized",
    "networkAuthorized","guardResult","dispatchAuthorized","mutation","eventEmitted",
  ]) assert.equal(forbidden in result,false);
});
