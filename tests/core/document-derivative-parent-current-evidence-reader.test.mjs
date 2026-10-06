import test from "node:test";
import assert from "node:assert/strict";

import {
  loadDocumentDerivativeParentCurrentEvidence,
} from "../../dist/core/index.js";

const ids=Object.freeze({
  tenant:"11111111-1111-4111-8111-111111111111",
  industry:"22222222-2222-4222-8222-222222222222",
  sibling:"23232323-2323-4232-8232-232323232323",
  derivative:"33333333-3333-4333-8333-333333333333",
  parent:"44444444-4444-4444-8444-444444444444",
  otherParent:"45454545-4545-4545-8545-454545454545",
  principal:"55555555-5555-4555-8555-555555555555",
  correlation:"66666666-6666-4666-8666-666666666666",
});

function context(overrides={}) {
  return Object.freeze({
    requestId:"request-1",
    correlationId:ids.correlation,
    tenantId:ids.tenant,
    industryContextId:ids.industry,
    dataHomeId:"77777777-7777-4777-8777-777777777777",
    regionCode:"IN-CENTRAL",
    principalId:ids.principal,
    principalType:"HUMAN",
    orgUnitPath:Object.freeze([]),
    roleIds:Object.freeze([]),
    scopeClass:"TENANT_INDUSTRY",
    ...overrides,
  });
}

function relationship(overrides={}) {
  const derivative=Object.freeze({
    id:ids.derivative,
    tenantId:ids.tenant,
    industryContextId:ids.industry,
    scopeClass:"TENANT_INDUSTRY",
    parentDocumentId:ids.parent,
    derivativeType:"THUMBNAIL",
    sensitivityClass:"PUBLIC",
    residencyRegion:"IN-CENTRAL",
    status:"SCANNING",
    virusScanStatus:"PENDING",
    ...(overrides.derivative ?? {}),
  });
  const parent=Object.freeze({
    id:ids.parent,
    tenantId:ids.tenant,
    industryContextId:ids.industry,
    scopeClass:"TENANT_INDUSTRY",
    sensitivityClass:"REGULATED",
    residencyRegion:"IN-CENTRAL",
    status:"ACTIVE",
    virusScanStatus:"CLEAN",
    ...(overrides.parent ?? {}),
  });
  return Object.freeze({derivative,parent});
}

function fixture(overrides={}) {
  const calls=[];
  const value=Object.hasOwn(overrides,"value") ? overrides.value : relationship();
  return {
    calls,
    value,
    reader:{
      async load(input){
        calls.push(input);
        if(overrides.error) throw overrides.error;
        return value;
      },
    },
  };
}

async function load(f,inputOverrides={}) {
  return loadDocumentDerivativeParentCurrentEvidence(
    {
      requestContext:context(),
      derivativeDocumentId:ids.derivative,
      parentDocumentId:ids.parent,
      ...inputOverrides,
    },
    f.reader,
  );
}

test("DOC-DERIV-BASE-001 exact RequestContext and derivative/parent ids cause exactly one relationship read",async()=>{
  const f=fixture();
  const ctx=context();
  const result=await load(f,{requestContext:ctx});
  assert.ok(result);
  assert.equal(f.calls.length,1);
  assert.equal(f.calls[0].requestContext,ctx);
  assert.equal(f.calls[0].derivativeDocumentId,ids.derivative);
  assert.equal(f.calls[0].parentDocumentId,ids.parent);
});

test("DOC-DERIV-BASE-002 null remains null and dependency errors propagate unchanged",async()=>{
  const hidden=fixture({value:null});
  assert.equal(await load(hidden),null);
  assert.equal(hidden.calls.length,1);

  const expected=new Error("relationship-unavailable");
  const broken=fixture({error:expected});
  await assert.rejects(load(broken),error=>error===expected);
  assert.equal(broken.calls.length,1);
});

test("DOC-DERIV-REL-001 exact persisted derivative id parent id and non-empty derivativeType relationship passes",async()=>{
  const f=fixture();
  const result=await load(f);
  assert.ok(result);
  assert.equal(result.relationship,f.value);
  assert.equal(result.relationship.derivative.id,ids.derivative);
  assert.equal(result.relationship.derivative.parentDocumentId,ids.parent);
  assert.equal(result.relationship.parent.id,ids.parent);
  assert.equal(result.relationship.derivative.derivativeType,"THUMBNAIL");
});

test("DOC-DERIV-REL-002 id mismatch malformed relationship or sibling/cross-scope evidence fails closed",async()=>{
  const cases=[
    relationship({derivative:{id:"not-a-uuid"}}),
    relationship({derivative:{parentDocumentId:ids.otherParent}}),
    relationship({parent:{id:ids.otherParent}}),
    relationship({derivative:{derivativeType:"   "}}),
    relationship({parent:{industryContextId:ids.sibling}}),
    relationship({parent:{scopeClass:"TENANT_CORE",industryContextId:undefined}}),
  ];
  for(const value of cases){
    const f=fixture({value});
    assert.equal(await load(f),null);
    assert.equal(f.calls.length,1);
  }
});

test("DOC-DERIV-SAFE-001 exact Tenant/scope/Industry/residency continuity plus parent ACTIVE/CLEAN passes",async()=>{
  assert.ok(await load(fixture()));

  const coreValue=relationship({
    derivative:{scopeClass:"TENANT_CORE",industryContextId:undefined},
    parent:{scopeClass:"TENANT_CORE",industryContextId:undefined},
  });
  const core=fixture({value:coreValue});
  const result=await load(core,{
    requestContext:context({scopeClass:"TENANT_CORE",industryContextId:undefined}),
  });
  assert.ok(result);
  assert.equal(result.relationship,coreValue);
});

test("DOC-DERIV-SAFE-002 unsafe parent or residency/context mismatch fails closed",async()=>{
  const cases=[
    relationship({parent:{status:"QUARANTINED"}}),
    relationship({parent:{virusScanStatus:"INFECTED"}}),
    relationship({parent:{residencyRegion:"US-EAST"}}),
    relationship({parent:{tenantId:"12121212-1212-4212-8212-121212121212"}}),
  ];
  for(const value of cases){
    assert.equal(await load(fixture({value})),null);
  }

  assert.equal(
    await load(fixture(),{
      requestContext:context({industryContextId:ids.sibling}),
    }),
    null,
  );
});

test("DOC-DERIV-EVID-001 success preserves exact raw lifecycle and sensitivity evidence without ranking or mutation",async()=>{
  const value=relationship({
    derivative:{
      sensitivityClass:"PUBLIC",
      status:"SCANNING",
      virusScanStatus:"PENDING",
    },
    parent:{
      sensitivityClass:"REGULATED",
      status:"ACTIVE",
      virusScanStatus:"CLEAN",
    },
  });
  const before=JSON.stringify(value);
  const result=await load(fixture({value}));

  assert.ok(result);
  assert.equal(Object.isFrozen(result),true);
  assert.equal(result.relationship,value);
  assert.equal(result.relationship.derivative.sensitivityClass,"PUBLIC");
  assert.equal(result.relationship.parent.sensitivityClass,"REGULATED");
  assert.equal(result.relationship.derivative.status,"SCANNING");
  assert.equal(result.relationship.derivative.virusScanStatus,"PENDING");
  assert.equal(JSON.stringify(value),before);
});

test("DOC-DERIV-BOUND-001 output grants no sensitivity ACL authorization signing storage mutation or event authority",async()=>{
  const result=await load(fixture());
  assert.ok(result);
  for(const forbidden of [
    "sensitivityRank",
    "sensitivityMonotonic",
    "aclNonWidening",
    "aclDecision",
    "authorizationDecision",
    "guardResult",
    "permissionAllowed",
    "entitlementAllowed",
    "provider",
    "signedUrl",
    "signedGrant",
    "downloadAuthorized",
    "shareAuthorized",
    "deleteAuthorized",
    "storageDispatch",
    "purgeAuthorized",
    "rebuildAuthorized",
    "mutation",
    "eventEmitted",
  ]) assert.equal(forbidden in result,false);
});
