import test from "node:test";
import assert from "node:assert/strict";

import {
  loadSyncCursorCurrentBindingEvidence,
} from "../../dist/core/index.js";

const ids=Object.freeze({
  tenant:"11111111-1111-4111-8111-111111111111",
  industry:"22222222-2222-4222-8222-222222222222",
  integration:"33333333-3333-4333-8333-333333333333",
  definition:"44444444-4444-4444-8444-444444444444",
  credential:"55555555-5555-4555-8555-555555555555",
  cursor:"66666666-6666-4666-8666-666666666666",
  capability:"77777777-7777-4777-8777-777777777777",
});

const requestContext=Object.freeze({
  requestId:"request-1",correlationId:"correlation-1",
  tenantId:ids.tenant,industryContextId:ids.industry,
  principalId:"principal-1",principalType:"HUMAN",
  orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),
  permissionVersion:1,entitlementSnapshotVersion:1,
  scopeClass:"TENANT_INDUSTRY",
});

function cursor(overrides={}) {
  return Object.freeze({
    id:ids.cursor,
    tenantIntegrationId:ids.integration,
    capabilityCode:"orders.read",
    industryContextId:ids.industry,
    cursorEncryptedOrOpaque:"opaque:abc",
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
    config:Object.freeze({raw:true}),enabledCapabilities:Object.freeze(["orders.read"]),
    permissionProfileId:"raw-profile",healthState:"UNAVAILABLE",version:1,
    createdAt:"2026-10-01T00:00:00.000Z",updatedAt:"2026-10-05T00:00:00.000Z",
    ...overrides,
  });
}
function capability(overrides={}) {
  return Object.freeze({
    id:ids.capability,integrationDefinitionId:ids.definition,
    capabilityCode:"orders.read",direction:"INBOUND",
    operationContractId:"operation.raw",eventTypes:Object.freeze(["RAW.EVENT"]),
    dataClass:"INTERNAL",idempotencyClass:"STANDARD",
    rateClass:"AUTH_STANDARD",status:"ACTIVE",...overrides,
  });
}

function fixture(overrides={}) {
  const order=[];
  const calls={cursor:[],integration:[],capability:[]};
  const values={
    cursor:Object.hasOwn(overrides,"cursor")?overrides.cursor:cursor(),
    integration:Object.hasOwn(overrides,"integration")?overrides.integration:integration(),
    capability:Object.hasOwn(overrides,"capability")?overrides.capability:capability(),
  };
  return {
    order,calls,values,
    cursorReader:{async loadExact(input){order.push("cursor");calls.cursor.push(input);if(overrides.cursorError)throw overrides.cursorError;return values.cursor;}},
    integrationReader:{async loadForContext(input){order.push("integration");calls.integration.push(input);if(overrides.integrationError)throw overrides.integrationError;return values.integration;}},
    capabilityReader:{async loadExact(input){order.push("capability");calls.capability.push(input);if(overrides.capabilityError)throw overrides.capabilityError;return values.capability;}},
  };
}

async function load(f,inputOverrides={}) {
  return loadSyncCursorCurrentBindingEvidence(
    {
      requestContext,
      tenantIntegrationId:ids.integration,
      capabilityCode:"orders.read",
      industryContextId:ids.industry,
      ...inputOverrides,
    },
    f.cursorReader,f.integrationReader,f.capabilityReader,
  );
}

test("SYNC-EVID-BASE-001 exact tuple reaches SyncCursor read first; null/error short-circuits dependencies",async()=>{
  const f=fixture(); assert.ok(await load(f));
  assert.deepEqual(f.calls.cursor,[{
    requestContext,tenantIntegrationId:ids.integration,
    capabilityCode:"orders.read",industryContextId:ids.industry,
  }]);
  assert.equal(f.order[0],"cursor");

  const hidden=fixture({cursor:null});
  assert.equal(await load(hidden),null);
  assert.deepEqual(hidden.order,["cursor"]);

  const expected=new Error("cursor-failed");
  const broken=fixture({cursorError:expected});
  await assert.rejects(load(broken),error=>error===expected);
  assert.deepEqual(broken.order,["cursor"]);
});

test("SYNC-EVID-INT-001 one same-context TenantIntegration read uses exact persisted cursor parent and fails closed",async()=>{
  const f=fixture(); assert.ok(await load(f));
  assert.deepEqual(f.calls.integration,[{requestContext,tenantIntegrationId:ids.integration}]);

  const hidden=fixture({integration:null});
  assert.equal(await load(hidden),null);
  assert.deepEqual(hidden.order,["cursor","integration"]);

  const expected=new Error("integration-failed");
  const broken=fixture({integrationError:expected});
  await assert.rejects(load(broken),error=>error===expected);
  assert.deepEqual(broken.order,["cursor","integration"]);
});

test("SYNC-EVID-CAP-001 one exact capability read uses loaded parent Definition id and cursor code; null/error fails closed",async()=>{
  const f=fixture(); assert.ok(await load(f));
  assert.deepEqual(f.calls.capability,[{
    integrationDefinitionId:ids.definition,
    capabilityCode:"orders.read",
  }]);

  const hidden=fixture({capability:null});
  assert.equal(await load(hidden),null);

  const expected=new Error("capability-failed");
  const broken=fixture({capabilityError:expected});
  await assert.rejects(load(broken),error=>error===expected);
});

test("SYNC-EVID-FLOOR-001 exact DD-164 binding passes for active Tenant-Industry and Tenant-Core evidence",async()=>{
  assert.ok(await load(fixture()));

  const coreContext=Object.freeze({...requestContext,industryContextId:undefined,scopeClass:"TENANT_CORE"});
  const core=fixture({
    cursor:cursor({industryContextId:undefined}),
    integration:integration({industryContextId:undefined,scopeClass:"TENANT_CORE"}),
  });
  const result=await load(core,{requestContext:coreContext,industryContextId:undefined});
  assert.ok(result);
  assert.equal(result.cursor,core.values.cursor);
  assert.equal(result.integration,core.values.integration);
  assert.equal(result.capability,core.values.capability);
});

test("SYNC-EVID-FLOOR-002 inactive/mismatched parent or capability and malformed enabled/scope evidence fails closed",async()=>{
  const cases=[
    fixture({integration:integration({status:"PAUSED"})}),
    fixture({capability:capability({status:"RETIRED"})}),
    fixture({capability:capability({integrationDefinitionId:"88888888-8888-4888-8888-888888888888"})}),
    fixture({capability:capability({capabilityCode:"orders.write"})}),
    fixture({integration:integration({enabledCapabilities:Object.freeze(["orders.read","orders.read"])})}),
    fixture({integration:integration({industryContextId:"99999999-9999-4999-8999-999999999999"})}),
  ];
  for(const f of cases) assert.equal(await load(f),null);
});

test("SYNC-EVID-EVID-001 success returns frozen exact-reference evidence and leaves inputs unchanged",async()=>{
  const f=fixture();
  const input=Object.freeze({
    requestContext,tenantIntegrationId:ids.integration,
    capabilityCode:"orders.read",industryContextId:ids.industry,
  });
  const before=JSON.stringify([input,f.values.cursor,f.values.integration,f.values.capability]);
  const result=await loadSyncCursorCurrentBindingEvidence(
    input,f.cursorReader,f.integrationReader,f.capabilityReader,
  );
  assert.ok(result);
  assert.equal(Object.isFrozen(result),true);
  assert.equal(result.cursor,f.values.cursor);
  assert.equal(result.integration,f.values.integration);
  assert.equal(result.capability,f.values.capability);
  assert.equal(JSON.stringify([input,f.values.cursor,f.values.integration,f.values.capability]),before);
});

test("SYNC-EVID-OPAQUE-001 cursor payload watermark sourceVersion and updatedAt remain uninterpreted",async()=>{
  const f=fixture({cursor:cursor({
    cursorEncryptedOrOpaque:"",
    watermarkTime:"not-a-time",
    sourceVersion:"",
    updatedAt:"not-a-time",
  })});
  const result=await load(f);
  assert.ok(result);
  assert.equal(result.cursor,f.values.cursor);
});

test("SYNC-EVID-BOUND-001 output grants no cursor validity freshness resume provider secret health operation sync network dispatch or mutation authority",async()=>{
  const result=await load(fixture()); assert.ok(result);
  for(const forbidden of [
    "cursorValid","cursorFresh","resumable","resumeAuthorized","replayAuthorized",
    "syncAuthorized","provider","providerAdapter","secretReference","secretMaterial",
    "healthApproved","permissionProfile","operationAuthorized","eventAuthorized",
    "guardResult","commercialAllowed","networkAuthorized","dispatchAuthorized",
    "mutation","eventEmitted",
  ]) assert.equal(forbidden in result,false);
});
