import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  CommercialTargetPreviewError,
  materializeCommercialFinalTargetPreviewV1,
} from "../../dist/core/index.js";

function ids(){ return randomUUID().toLowerCase(); }
function precedence(industryContextId=ids()){
  return {
    entitlements:[
      {code:"api.access",valueType:"BOOLEAN",state:"VALUE",value:true},
      {code:"reports",valueType:"BOOLEAN",industryContextId,state:"VALUE",value:true},
      {code:"storage",valueType:"INTEGER",industryContextId,state:"VALUE",value:10},
    ],
    limits:[
      {entitlementCode:"api.access",meterCode:"api.calls",mode:"FINITE",value:100},
      {entitlementCode:"storage",meterCode:"storage.bytes",industryContextId,mode:"NOT_INCLUDED"},
    ],
    tenantDenySet:[],
  };
}
function restrictions(targetPlanVersionId,industryContextId=undefined,extra={}){
  return {
    targetPlanVersionId,
    policyVersion:"security:v1",
    evidenceReference:"security-evidence:1",
    restrictions:[
      {effect:"DENY",entitlementCode:industryContextId?"reports":"api.access",
        ...(industryContextId?{industryContextId}:{}),controlCode:"SEC-001"},
    ],
    ...extra,
  };
}
function usage(targetPlanVersionId,industryContextId,usedStorage=0){
  return {
    targetPlanVersionId,
    selectionPolicyVersion:"period:v1",
    evidenceReference:"usage-evidence:1",
    impacts:[
      {entitlementCode:"api.access",meterCode:"api.calls",targetMode:"FINITE",
        targetValue:100,periodKey:"2026-09",usedValue:50,status:"WITHIN_TARGET"},
      {entitlementCode:"storage",meterCode:"storage.bytes",industryContextId,
        targetMode:"NOT_INCLUDED",targetValue:0,periodKey:"2026-09",usedValue:usedStorage,
        status:usedStorage>0?"EXCEEDS_TARGET":"WITHIN_TARGET"},
    ],
    hasBlockingUsage:usedStorage>0,
  };
}
function lifecycle(state="ACTIVE"){
  const map={
    ACTIVE:["FULL_ACCESS",true,true,false],
    GRACE:["FULL_ACCESS",true,true,false],
    SUSPENDED:["RESTRICTED",false,false,true],
  };
  const [posture,generic,writes,dedicated]=map[state];
  return {
    subscriptionState:state,posture,
    genericProtectedOperationsAllowed:generic,
    ordinaryBusinessWritesAllowed:writes,
    requiresDedicatedNonGenericPath:dedicated,
    dataPreservationRequired:true,
  };
}

test("Tenant compliance/security DENY joins the final Tenant deny set",()=>{
  const target=ids(), industry=ids();
  const result=materializeCommercialFinalTargetPreviewV1({
    targetPlanVersionId:target,
    precedence:precedence(industry),
    restrictions:restrictions(target),
    usageImpact:usage(target,industry),
    lifecycle:lifecycle(),
  });
  assert.deepEqual(result.tenantDenySet,["api.access"]);
  assert.equal(result.entitlements.find(x=>x.code==="api.access").value,true);
});

test("Industry compliance/security DENY becomes exact type-specific disabled scoped fact",()=>{
  const target=ids(), industry=ids();
  const result=materializeCommercialFinalTargetPreviewV1({
    targetPlanVersionId:target,
    precedence:precedence(industry),
    restrictions:restrictions(target,industry),
    usageImpact:usage(target,industry),
    lifecycle:lifecycle(),
  });
  const fact=result.entitlements.find(x=>x.code==="reports");
  assert.deepEqual(fact,{
    code:"reports",valueType:"BOOLEAN",industryContextId:industry,state:"VALUE",value:false,
  });
  assert.deepEqual(result.tenantDenySet,[]);
});

test("multiple controls may deny the same exact target without widening semantics",()=>{
  const target=ids(), industry=ids();
  const input=restrictions(target);
  input.restrictions=[
    {effect:"DENY",entitlementCode:"api.access",controlCode:"SEC-002"},
    {effect:"DENY",entitlementCode:"api.access",controlCode:"SEC-001"},
  ];
  const result=materializeCommercialFinalTargetPreviewV1({
    targetPlanVersionId:target,precedence:precedence(industry),
    restrictions:input,usageImpact:usage(target,industry),lifecycle:lifecycle(),
  });
  assert.deepEqual(result.tenantDenySet,["api.access"]);
  assert.deepEqual(result.appliedRestrictions.map(x=>x.controlCode),["SEC-001","SEC-002"]);
});

test("usage impact remains exact-target evidence and blocking usage is preserved",()=>{
  const target=ids(), industry=ids();
  const result=materializeCommercialFinalTargetPreviewV1({
    targetPlanVersionId:target,precedence:precedence(industry),
    restrictions:{...restrictions(target),restrictions:[]},
    usageImpact:usage(target,industry,1),lifecycle:lifecycle(),
  });
  assert.equal(result.usageImpact.hasBlockingUsage,true);
  assert.equal(result.usageImpact.impacts.find(x=>x.meterCode==="storage.bytes").status,"EXCEEDS_TARGET");
});

test("lifecycle posture is attached without mutating target entitlements or limits",()=>{
  const target=ids(), industry=ids();
  const p=precedence(industry);
  const result=materializeCommercialFinalTargetPreviewV1({
    targetPlanVersionId:target,precedence:p,
    restrictions:{...restrictions(target),restrictions:[]},
    usageImpact:usage(target,industry),lifecycle:lifecycle("SUSPENDED"),
  });
  assert.equal(result.lifecycle.posture,"RESTRICTED");
  assert.deepEqual(result.entitlements,p.entitlements);
  assert.deepEqual(result.limits,p.limits);
});

test("restriction and usage target PlanVersion mismatch fail closed",()=>{
  const target=ids(), industry=ids();
  for(const patch of ["restriction","usage"]){
    assert.throws(
      ()=>materializeCommercialFinalTargetPreviewV1({
        targetPlanVersionId:target,
        precedence:precedence(industry),
        restrictions:restrictions(patch==="restriction"?ids():target),
        usageImpact:usage(patch==="usage"?ids():target,industry),
        lifecycle:lifecycle(),
      }),
      error=>error instanceof CommercialTargetPreviewError
        && error.code==="COMMERCIAL_TARGET_PREVIEW_TARGET_MISMATCH",
    );
  }
});

test("unknown restriction target and duplicate control-target tuple fail closed",()=>{
  const target=ids(), industry=ids();
  for(const rows of [
    [{effect:"DENY",entitlementCode:"missing",controlCode:"SEC-001"}],
    [
      {effect:"DENY",entitlementCode:"api.access",controlCode:"SEC-001"},
      {effect:"DENY",entitlementCode:"api.access",controlCode:"SEC-001"},
    ],
  ]){
    assert.throws(
      ()=>materializeCommercialFinalTargetPreviewV1({
        targetPlanVersionId:target,precedence:precedence(industry),
        restrictions:{...restrictions(target),restrictions:rows},
        usageImpact:usage(target,industry),lifecycle:lifecycle(),
      }),
      error=>error instanceof CommercialTargetPreviewError
        && error.code==="COMMERCIAL_TARGET_PREVIEW_RESTRICTION_INVALID",
    );
  }
});

test("usage impact must exactly cover DD-071 target limits with consistent comparison",()=>{
  const target=ids(), industry=ids();
  const variants=[
    {...usage(target,industry),impacts:usage(target,industry).impacts.slice(0,1)},
    {...usage(target,industry),impacts:[
      {...usage(target,industry).impacts[0],targetValue:99},
      usage(target,industry).impacts[1],
    ]},
    {...usage(target,industry),hasBlockingUsage:true},
  ];
  for(const u of variants){
    assert.throws(
      ()=>materializeCommercialFinalTargetPreviewV1({
        targetPlanVersionId:target,precedence:precedence(industry),
        restrictions:{...restrictions(target),restrictions:[]},
        usageImpact:u,lifecycle:lifecycle(),
      }),
      error=>error instanceof CommercialTargetPreviewError
        && error.code==="COMMERCIAL_TARGET_PREVIEW_USAGE_INVALID",
    );
  }
});

test("tampered lifecycle overlay fails closed",()=>{
  const target=ids(), industry=ids();
  assert.throws(
    ()=>materializeCommercialFinalTargetPreviewV1({
      targetPlanVersionId:target,precedence:precedence(industry),
      restrictions:{...restrictions(target),restrictions:[]},
      usageImpact:usage(target,industry),
      lifecycle:{...lifecycle("SUSPENDED"),ordinaryBusinessWritesAllowed:true},
    }),
    error=>error instanceof CommercialTargetPreviewError
      && error.code==="COMMERCIAL_TARGET_PREVIEW_LIFECYCLE_INVALID",
  );
});

test("final target preview is deterministic, sorted and immutable",()=>{
  const target=ids(), industry=ids();
  const p=precedence(industry);
  const reversed={...p,entitlements:[...p.entitlements].reverse(),limits:[...p.limits].reverse()};
  const r={...restrictions(target),restrictions:[
    {effect:"DENY",entitlementCode:"api.access",controlCode:"SEC-002"},
    {effect:"DENY",entitlementCode:"api.access",controlCode:"SEC-001"},
  ]};
  const a=materializeCommercialFinalTargetPreviewV1({
    targetPlanVersionId:target,precedence:p,restrictions:r,
    usageImpact:usage(target,industry),lifecycle:lifecycle("GRACE"),
  });
  const b=materializeCommercialFinalTargetPreviewV1({
    targetPlanVersionId:target,precedence:reversed,
    restrictions:{...r,restrictions:[...r.restrictions].reverse()},
    usageImpact:{...usage(target,industry),impacts:[...usage(target,industry).impacts].reverse()},
    lifecycle:lifecycle("GRACE"),
  });
  assert.deepEqual(a,b);
  assert.ok(Object.isFrozen(a));
  assert.ok(Object.isFrozen(a.entitlements));
  assert.ok(Object.isFrozen(a.usageImpact.impacts));
});
