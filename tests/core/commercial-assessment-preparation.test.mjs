import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  CommercialAssessmentPreparationError,
  CommercialInitialAssessmentPreparationService,
} from "../../dist/core/index.js";

const id=()=>randomUUID().toLowerCase();

function context(overrides={}){
  return {
    requestId:id(),correlationId:id(),tenantId:id(),
    dataHomeId:id(),regionCode:"IN-CENTRAL",
    principalId:id(),principalType:"SERVICE",
    orgUnitPath:[],roleIds:[],scopeClass:"TENANT_CORE",
    ...overrides,
  };
}
function preview(targetPlanVersionId,{blockingUsage=false}={}){
  return {
    targetPlanVersionId,
    entitlements:[],
    limits:[],
    tenantDenySet:[],
    restrictionPolicyVersion:"security:v1",
    restrictionEvidenceReference:"security-evidence:1",
    appliedRestrictions:[],
    usageImpact:{
      targetPlanVersionId,
      selectionPolicyVersion:"period:v1",
      evidenceReference:"usage-evidence:1",
      impacts:[],
      hasBlockingUsage:blockingUsage,
    },
    lifecycle:{
      subscriptionState:"ACTIVE",
      posture:"FULL_ACCESS",
      genericProtectedOperationsAllowed:true,
      ordinaryBusinessWritesAllowed:true,
      requiresDedicatedNonGenericPath:false,
      dataPreservationRequired:true,
    },
  };
}
function decision(targetPlanVersionId,overrides={}){
  return {
    targetPlanVersionId,
    routeClass:"SELF_SERVE",
    routePolicyId:id(),
    routePolicyVersion:3,
    impactReference:"impact:server:1",
    entitlementDiffReference:"diff:server:1",
    blockingImpactCodes:[],
    sourceFingerprint:"0123456789abcdef0123456789abcdef",
    ...overrides,
  };
}
function input(targetPlanVersionId,{blockingUsage=false}={}){
  return {
    requestContext:context(),
    subscriptionId:id(),
    sourcePlanVersionId:id(),
    targetPlanVersionId,
    expectedSubscriptionVersion:7,
    effectiveTiming:"IMMEDIATE",
    finalPreview:preview(targetPlanVersionId,{blockingUsage}),
  };
}

test("initial assessment preparation derives NOT_REQUIRED only when no blockers exist",async()=>{
  const target=id();
  const service=new CommercialInitialAssessmentPreparationService({
    evaluate:async()=>decision(target),
  });
  const result=await service.prepare(input(target));
  assert.equal(result.assessmentVersion,1);
  assert.equal(result.remediationState,"NOT_REQUIRED");
  assert.deepEqual(result.blockingImpactCodes,[]);
  assert.equal(result.targetPlanVersionId,target);
});

test("blocking codes are sorted and derive PENDING remediation",async()=>{
  const target=id();
  const service=new CommercialInitialAssessmentPreparationService({
    evaluate:async()=>decision(target,{blockingImpactCodes:["Z_LIMIT","A_POLICY"]}),
  });
  const result=await service.prepare(input(target));
  assert.deepEqual(result.blockingImpactCodes,["A_POLICY","Z_LIMIT"]);
  assert.equal(result.remediationState,"PENDING");
});

test("DD-073 blocking usage cannot disappear from assessment blockers",async()=>{
  const target=id();
  const service=new CommercialInitialAssessmentPreparationService({
    evaluate:async()=>decision(target,{blockingImpactCodes:[]}),
  });
  await assert.rejects(
    ()=>service.prepare(input(target,{blockingUsage:true})),
    error=>error instanceof CommercialAssessmentPreparationError
      && error.code==="COMMERCIAL_ASSESSMENT_PREPARATION_USAGE_BLOCKER_MISSING",
  );
});

test("non-usage governed blockers may still require remediation",async()=>{
  const target=id();
  const service=new CommercialInitialAssessmentPreparationService({
    evaluate:async()=>decision(target,{blockingImpactCodes:["GOVERNED_OTHER_BLOCKER"]}),
  });
  const result=await service.prepare(input(target,{blockingUsage:false}));
  assert.equal(result.remediationState,"PENDING");
});

test("evaluator receives exact server binding and DD-075 preview",async()=>{
  const target=id();
  const request=input(target);
  let observed;
  const service=new CommercialInitialAssessmentPreparationService({
    evaluate:async value=>{
      observed=value;
      return decision(target);
    },
  });
  await service.prepare(request);
  assert.equal(observed.subscriptionId,request.subscriptionId);
  assert.equal(observed.sourcePlanVersionId,request.sourcePlanVersionId);
  assert.equal(observed.targetPlanVersionId,target);
  assert.equal(observed.expectedSubscriptionVersion,7);
  assert.equal(observed.effectiveTiming,"IMMEDIATE");
  assert.equal(observed.finalPreview,request.finalPreview);
  assert.equal(observed.requestContext,request.requestContext);
});

test("preview and evaluator target PlanVersion mismatches fail closed",async()=>{
  const target=id();
  const service=new CommercialInitialAssessmentPreparationService({
    evaluate:async()=>decision(id()),
  });
  await assert.rejects(
    ()=>service.prepare(input(target)),
    error=>error instanceof CommercialAssessmentPreparationError
      && error.code==="COMMERCIAL_ASSESSMENT_PREPARATION_TARGET_MISMATCH",
  );

  const request=input(target);
  request.finalPreview={...request.finalPreview,targetPlanVersionId:id()};
  const matchingService=new CommercialInitialAssessmentPreparationService({
    evaluate:async()=>decision(target),
  });
  await assert.rejects(
    ()=>matchingService.prepare(request),
    error=>error instanceof CommercialAssessmentPreparationError
      && error.code==="COMMERCIAL_ASSESSMENT_PREPARATION_TARGET_MISMATCH",
  );
});

test("duplicate or malformed blocking impact codes fail closed",async()=>{
  const target=id();
  for(const codes of [["A","A"],["bad code"],Array(65).fill(0).map((_,i)=>"B"+i)]){
    const service=new CommercialInitialAssessmentPreparationService({
      evaluate:async()=>decision(target,{blockingImpactCodes:codes}),
    });
    await assert.rejects(
      ()=>service.prepare(input(target)),
      error=>error instanceof CommercialAssessmentPreparationError
        && error.code==="COMMERCIAL_ASSESSMENT_PREPARATION_EVALUATOR_INVALID",
    );
  }
});

test("malformed evaluator references, fingerprint, route or policy version fail closed",async()=>{
  const target=id();
  const patches=[
    {impactReference:""},
    {entitlementDiffReference:""},
    {sourceFingerprint:"short"},
    {routeClass:"UNKNOWN"},
    {routePolicyId:"not-a-uuid"},
    {routePolicyVersion:0},
  ];
  for(const patch of patches){
    const service=new CommercialInitialAssessmentPreparationService({
      evaluate:async()=>decision(target,patch),
    });
    await assert.rejects(
      ()=>service.prepare(input(target)),
      error=>error instanceof CommercialAssessmentPreparationError
        && error.code==="COMMERCIAL_ASSESSMENT_PREPARATION_EVALUATOR_INVALID",
    );
  }
});

test("HUMAN, Industry-scoped and unresolved Tenant contexts cannot prepare assessment",async()=>{
  const target=id();
  for(const requestContext of [
    context({principalType:"HUMAN"}),
    context({scopeClass:"TENANT_INDUSTRY",industryContextId:id()}),
    context({tenantId:undefined}),
  ]){
    const service=new CommercialInitialAssessmentPreparationService({
      evaluate:async()=>decision(target),
    });
    await assert.rejects(
      ()=>service.prepare({...input(target),requestContext}),
      error=>error instanceof CommercialAssessmentPreparationError
        && error.code==="COMMERCIAL_ASSESSMENT_PREPARATION_SCOPE_INVALID",
    );
  }
});

test("invalid input binding fails before evaluator authority is consulted",async()=>{
  const target=id();
  let calls=0;
  const service=new CommercialInitialAssessmentPreparationService({
    evaluate:async()=>{ calls++; return decision(target); },
  });
  await assert.rejects(
    ()=>service.prepare({...input(target),sourcePlanVersionId:target}),
    error=>error instanceof CommercialAssessmentPreparationError
      && error.code==="COMMERCIAL_ASSESSMENT_PREPARATION_INPUT_INVALID",
  );
  assert.equal(calls,0);
});

test("prepared initial assessment is deterministic and immutable for equal evidence",async()=>{
  const target=id(), route=id();
  const request=input(target);
  const evaluator={
    evaluate:async()=>decision(target,{
      routePolicyId:route,
      blockingImpactCodes:["B","A"],
    }),
  };
  const service=new CommercialInitialAssessmentPreparationService(evaluator);
  const a=await service.prepare(request);
  const b=await service.prepare(request);
  assert.deepEqual(a,b);
  assert.ok(Object.isFrozen(a));
  assert.ok(Object.isFrozen(a.blockingImpactCodes));
});
