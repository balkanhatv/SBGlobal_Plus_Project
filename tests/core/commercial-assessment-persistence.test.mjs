import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  CommercialAssessmentPersistenceError,
  CommercialInitialAssessmentPersistenceService,
} from "../../dist/core/index.js";

const id=()=>randomUUID().toLowerCase();
function context(overrides={}){
  return {
    requestId:id(),correlationId:id(),tenantId:id(),dataHomeId:id(),
    regionCode:"IN-ASSESS-PERSIST",principalId:id(),principalType:"SERVICE",
    orgUnitPath:[],roleIds:[],scopeClass:"TENANT_CORE",...overrides,
  };
}
function prepared(overrides={}){
  return {
    assessmentVersion:1,
    subscriptionId:id(),
    sourcePlanVersionId:id(),
    targetPlanVersionId:id(),
    effectiveTiming:"IMMEDIATE",
    expectedSubscriptionVersion:4,
    routeClass:"SELF_SERVE",
    routePolicyId:id(),
    routePolicyVersion:2,
    impactReference:"impact:prepared:1",
    entitlementDiffReference:"diff:prepared:1",
    blockingImpactCodes:[],
    remediationState:"NOT_REQUIRED",
    sourceFingerprint:"prepared-source-fingerprint-v1",
    ...overrides,
  };
}
function persisted(c,p,overrides={}){
  return {
    assessmentId:id(),
    assessmentVersion:1,
    tenantId:c.tenantId,
    subscriptionId:p.subscriptionId,
    sourcePlanVersionId:p.sourcePlanVersionId,
    targetPlanVersionId:p.targetPlanVersionId,
    effectiveTiming:p.effectiveTiming,
    expectedSubscriptionVersion:p.expectedSubscriptionVersion,
    routeClass:p.routeClass,
    routePolicyId:p.routePolicyId,
    routePolicyVersion:p.routePolicyVersion,
    impactReference:p.impactReference,
    entitlementDiffReference:p.entitlementDiffReference,
    blockingImpactCodes:p.blockingImpactCodes,
    remediationState:p.remediationState,
    sourceFingerprint:p.sourceFingerprint,
    correlationId:c.correlationId,
    createdAt:new Date("2026-09-21T08:40:00.000Z"),
    ...overrides,
  };
}

test("DD-079 forwards every prepared field exactly and leaves assessment identity/time to DD-066",async()=>{
  const c=context(),p=prepared();
  let seen;
  const service=new CommercialInitialAssessmentPersistenceService({
    async recordAssessment(input){
      seen=input;
      return persisted(c,p);
    },
  });
  const result=await service.persist({requestContext:c,prepared:p});
  assert.equal("assessmentId" in seen,false);
  assert.deepEqual({...seen,requestContext:undefined},{
    requestContext:undefined,
    assessmentVersion:1,
    subscriptionId:p.subscriptionId,
    sourcePlanVersionId:p.sourcePlanVersionId,
    targetPlanVersionId:p.targetPlanVersionId,
    effectiveTiming:p.effectiveTiming,
    expectedSubscriptionVersion:p.expectedSubscriptionVersion,
    routeClass:p.routeClass,
    routePolicyId:p.routePolicyId,
    routePolicyVersion:p.routePolicyVersion,
    impactReference:p.impactReference,
    entitlementDiffReference:p.entitlementDiffReference,
    blockingImpactCodes:p.blockingImpactCodes,
    remediationState:p.remediationState,
    sourceFingerprint:p.sourceFingerprint,
  });
  assert.equal(seen.requestContext,c);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.blockingImpactCodes));
});

test("PENDING DD-076 blockers are persisted without reinterpretation",async()=>{
  const c=context();
  const p=prepared({
    blockingImpactCodes:["LIMIT_A","LIMIT_B"],
    remediationState:"PENDING",
  });
  const service=new CommercialInitialAssessmentPersistenceService({
    async recordAssessment(input){
      assert.deepEqual(input.blockingImpactCodes,["LIMIT_A","LIMIT_B"]);
      assert.equal(input.remediationState,"PENDING");
      return persisted(c,p);
    },
  });
  const result=await service.persist({requestContext:c,prepared:p});
  assert.deepEqual(result.blockingImpactCodes,["LIMIT_A","LIMIT_B"]);
  assert.equal(result.remediationState,"PENDING");
});

test("malformed or non-DD-076 prepared input fails before recorder",async()=>{
  const c=context();
  const invalid=[
    prepared({assessmentVersion:2}),
    prepared({blockingImpactCodes:["B","A"],remediationState:"PENDING"}),
    prepared({blockingImpactCodes:["A"],remediationState:"NOT_REQUIRED"}),
    prepared({sourcePlanVersionId:"not-a-uuid"}),
    prepared({routeClass:"UNKNOWN"}),
  ];
  for(const p of invalid){
    let calls=0;
    const service=new CommercialInitialAssessmentPersistenceService({
      async recordAssessment(){calls++;throw new Error("must not run");},
    });
    await assert.rejects(
      ()=>service.persist({requestContext:c,prepared:p}),
      error=>error instanceof CommercialAssessmentPersistenceError
        && error.code==="COMMERCIAL_ASSESSMENT_PERSISTENCE_PREPARED_INVALID",
    );
    assert.equal(calls,0);
  }
});

test("unsafe caller scope fails before recorder",async()=>{
  const p=prepared();
  for(const c of [
    context({principalType:"HUMAN"}),
    context({scopeClass:"TENANT_INDUSTRY",industryContextId:id()}),
    context({tenantId:undefined}),
  ]){
    let calls=0;
    const service=new CommercialInitialAssessmentPersistenceService({
      async recordAssessment(){calls++;throw new Error("must not run");},
    });
    await assert.rejects(
      ()=>service.persist({requestContext:c,prepared:p}),
      error=>error instanceof CommercialAssessmentPersistenceError
        && error.code==="COMMERCIAL_ASSESSMENT_PERSISTENCE_SCOPE_INVALID",
    );
    assert.equal(calls,0);
  }
});

test("persisted adapter drift fails closed",async()=>{
  const c=context(),p=prepared();
  const drift=[
    {tenantId:id()},
    {correlationId:id()},
    {targetPlanVersionId:id()},
    {assessmentVersion:2},
    {blockingImpactCodes:["OTHER"]},
    {sourceFingerprint:"different-source-fingerprint-v1"},
    {createdAt:new Date("invalid")},
  ];
  for(const patch of drift){
    const service=new CommercialInitialAssessmentPersistenceService({
      async recordAssessment(){return persisted(c,p,patch);},
    });
    await assert.rejects(
      ()=>service.persist({requestContext:c,prepared:p}),
      error=>error instanceof CommercialAssessmentPersistenceError
        && error.code==="COMMERCIAL_ASSESSMENT_PERSISTENCE_PERSISTED_MISMATCH",
    );
  }
});

test("DD-066 recorder errors remain authoritative",async()=>{
  const c=context(),p=prepared();
  const expected=new Error("authoritative recorder failure");
  const service=new CommercialInitialAssessmentPersistenceService({
    async recordAssessment(){throw expected;},
  });
  await assert.rejects(()=>service.persist({requestContext:c,prepared:p}),error=>error===expected);
});
