import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  CommercialAdjustmentPrecedenceError,
  applyCommercialAdjustmentPrecedenceV1,
} from "../../dist/core/index.js";

function base(){
  return {
    entitlements:[
      {code:"feature.a",valueType:"BOOLEAN",grantMode:"NOT_INCLUDED"},
      {code:"storage.limit",valueType:"DECIMAL",grantMode:"INCLUDED",value:100},
      {code:"seats.limit",valueType:"INTEGER",grantMode:"INCLUDED",value:10},
    ],
    limits:[
      {entitlementCode:"storage.limit",meterCode:"storage",mode:"FINITE",value:100},
      {entitlementCode:"seats.limit",meterCode:"seats",mode:"FINITE",value:10},
    ],
  };
}
function prepared(overrides=[],eligibleAddOns=[]){
  return {
    subscriptionId:randomUUID(),subscriptionVersion:1,
    sourcePlanVersionId:randomUUID(),targetPlanVersionId:randomUUID(),
    eligibleAddOns,ineligibleAddOns:[],overrides,
  };
}
function eligibleDelta(delta){
  return {
    tenantAddOnId:randomUUID(),addOnId:randomUUID(),addOnCode:"pack",
    eligibility:{status:"ELIGIBLE",policyVersion:"v1",evidenceReference:"e:1"},
    quotaDeltas:[delta],
  };
}

test("precedence applies ALLOW, LIMIT_SET then eligible additive quota deterministically",()=>{
  const preview=applyCommercialAdjustmentPrecedenceV1({
    baseline:base(),
    adjustments:prepared([
      {id:randomUUID(),entitlementCode:"feature.a",overrideType:"ALLOW",valueType:"BOOLEAN",value:true},
      {id:randomUUID(),entitlementCode:"storage.limit",overrideType:"LIMIT_SET",valueType:"DECIMAL",value:80},
    ],[
      eligibleDelta({
        entitlementCode:"storage.limit",meterCode:"storage",
        scope:{kind:"TENANT"},valueType:"DECIMAL",amount:20,
      }),
    ]),
    industryContexts:[],
  });
  assert.deepEqual(preview.entitlements.find(x=>x.code==="feature.a"),{
    code:"feature.a",valueType:"BOOLEAN",state:"VALUE",value:true,
  });
  assert.equal(preview.limits.find(x=>x.meterCode==="storage")?.value,100);
  assert.deepEqual(preview.tenantDenySet,[]);
});

test("DENY wins over ALLOW and Industry DENY becomes only a scoped disabled fact",()=>{
  const industryContextId=randomUUID().toLowerCase();
  const baseline={
    entitlements:[
      {code:"feature.a",valueType:"BOOLEAN",grantMode:"INCLUDED",value:true},
      {code:"feature.a",valueType:"BOOLEAN",industryContextId,grantMode:"INCLUDED",value:true},
    ],
    limits:[],
  };
  const preview=applyCommercialAdjustmentPrecedenceV1({
    baseline,
    adjustments:prepared([
      {id:randomUUID(),entitlementCode:"feature.a",overrideType:"ALLOW",valueType:"BOOLEAN",value:true},
      {id:randomUUID(),entitlementCode:"feature.a",overrideType:"DENY",valueType:"BOOLEAN",representation:"TENANT_DENY_SET",disabledValue:false},
      {id:randomUUID(),industryContextId,entitlementCode:"feature.a",overrideType:"DENY",valueType:"BOOLEAN",representation:"SCOPED_DISABLED_FACT",disabledValue:false},
    ]),
    industryContexts:[{id:industryContextId,industryCode:"RTL",status:"ACTIVE"}],
  });
  assert.deepEqual(preview.tenantDenySet,["feature.a"]);
  assert.equal(
    preview.entitlements.find(x=>x.industryContextId===industryContextId)?.value,
    false,
  );
});

test("multiple ALLOW or same-scope limit overrides fail closed instead of inventing order",()=>{
  const common={id:randomUUID(),entitlementCode:"feature.a",overrideType:"ALLOW",valueType:"BOOLEAN",value:true};
  assert.throws(
    ()=>applyCommercialAdjustmentPrecedenceV1({
      baseline:base(),adjustments:prepared([common,{...common,id:randomUUID()}]),industryContexts:[],
    }),
    error=>error instanceof CommercialAdjustmentPrecedenceError
      && error.code==="COMMERCIAL_ADJUSTMENT_PRECEDENCE_AMBIGUOUS",
  );
  assert.throws(
    ()=>applyCommercialAdjustmentPrecedenceV1({
      baseline:base(),
      adjustments:prepared([
        {id:randomUUID(),entitlementCode:"storage.limit",overrideType:"LIMIT_SET",valueType:"DECIMAL",value:90},
        {id:randomUUID(),entitlementCode:"storage.limit",overrideType:"LIMIT_DELTA",valueType:"DECIMAL",delta:5},
      ]),
      industryContexts:[],
    }),
    error=>error instanceof CommercialAdjustmentPrecedenceError
      && error.code==="COMMERCIAL_ADJUSTMENT_PRECEDENCE_AMBIGUOUS",
  );
});

test("LIMIT_DELTA requires exactly one finite meter target and non-negative result",()=>{
  const ambiguousBase={
    entitlements:[{code:"storage.limit",valueType:"DECIMAL",grantMode:"INCLUDED",value:100}],
    limits:[
      {entitlementCode:"storage.limit",meterCode:"storage.a",mode:"FINITE",value:100},
      {entitlementCode:"storage.limit",meterCode:"storage.b",mode:"FINITE",value:100},
    ],
  };
  const delta={id:randomUUID(),entitlementCode:"storage.limit",overrideType:"LIMIT_DELTA",valueType:"DECIMAL",delta:-10};
  assert.throws(
    ()=>applyCommercialAdjustmentPrecedenceV1({
      baseline:ambiguousBase,adjustments:prepared([delta]),industryContexts:[],
    }),
    error=>error instanceof CommercialAdjustmentPrecedenceError
      && error.code==="COMMERCIAL_ADJUSTMENT_PRECEDENCE_AMBIGUOUS",
  );
  assert.throws(
    ()=>applyCommercialAdjustmentPrecedenceV1({
      baseline:base(),
      adjustments:prepared([{...delta,id:randomUUID(),delta:-101}]),
      industryContexts:[],
    }),
    error=>error instanceof CommercialAdjustmentPrecedenceError
      && error.code==="COMMERCIAL_ADJUSTMENT_PRECEDENCE_INVALID",
  );
});

test("eligible add-ons sum quota after override and ADD_ON_ONLY starts from zero",()=>{
  const baseline={
    entitlements:[
      {code:"storage.limit",valueType:"DECIMAL",grantMode:"INCLUDED",value:0},
      {code:"seats.limit",valueType:"INTEGER",grantMode:"ADD_ON_ONLY"},
    ],
    limits:[
      {entitlementCode:"storage.limit",meterCode:"storage",mode:"FINITE",value:10},
      {entitlementCode:"seats.limit",meterCode:"seats",mode:"ADD_ON_ONLY"},
    ],
  };
  const preview=applyCommercialAdjustmentPrecedenceV1({
    baseline,
    adjustments:prepared([],[
      eligibleDelta({entitlementCode:"storage.limit",meterCode:"storage",scope:{kind:"TENANT"},valueType:"DECIMAL",amount:5}),
      eligibleDelta({entitlementCode:"storage.limit",meterCode:"storage",scope:{kind:"TENANT"},valueType:"DECIMAL",amount:2.5}),
      eligibleDelta({entitlementCode:"seats.limit",meterCode:"seats",scope:{kind:"TENANT"},valueType:"INTEGER",amount:3}),
    ]),
    industryContexts:[],
  });
  assert.equal(preview.limits.find(x=>x.meterCode==="storage")?.value,17.5);
  assert.deepEqual(preview.limits.find(x=>x.meterCode==="seats"),{
    entitlementCode:"seats.limit",meterCode:"seats",mode:"FINITE",value:3,
  });
});

test("Industry selectors apply only to exact resolved baseline targets",()=>{
  const rtl=randomUUID().toLowerCase(),mfg=randomUUID().toLowerCase();
  const baseline={
    entitlements:[
      {code:"storage.limit",valueType:"DECIMAL",industryContextId:rtl,grantMode:"INCLUDED",value:10},
      {code:"storage.limit",valueType:"DECIMAL",industryContextId:mfg,grantMode:"INCLUDED",value:10},
    ],
    limits:[
      {entitlementCode:"storage.limit",meterCode:"storage",industryContextId:rtl,mode:"FINITE",value:10},
      {entitlementCode:"storage.limit",meterCode:"storage",industryContextId:mfg,mode:"FINITE",value:10},
    ],
  };
  const preview=applyCommercialAdjustmentPrecedenceV1({
    baseline,
    adjustments:prepared([],[
      eligibleDelta({entitlementCode:"storage.limit",meterCode:"storage",scope:{kind:"INDUSTRY_CODE",industryCode:"RTL"},valueType:"DECIMAL",amount:5}),
      eligibleDelta({entitlementCode:"storage.limit",meterCode:"storage",scope:{kind:"LICENSED_INDUSTRIES"},valueType:"DECIMAL",amount:2}),
    ]),
    industryContexts:[
      {id:rtl,industryCode:"RTL",status:"ACTIVE"},
      {id:mfg,industryCode:"MFG",status:"ACTIVE"},
    ],
  });
  assert.deepEqual(
    preview.limits.map(x=>[x.industryContextId,x.value]),
    [[mfg,12],[rtl,17]].sort((a,b)=>String(a[0]).localeCompare(String(b[0]))),
  );
});

test("missing targets, type mismatches and non-additive limit modes fail closed",()=>{
  assert.throws(
    ()=>applyCommercialAdjustmentPrecedenceV1({
      baseline:base(),
      adjustments:prepared([{id:randomUUID(),entitlementCode:"missing",overrideType:"ALLOW",valueType:"BOOLEAN",value:true}]),
      industryContexts:[],
    }),
    error=>error instanceof CommercialAdjustmentPrecedenceError
      && error.code==="COMMERCIAL_ADJUSTMENT_PRECEDENCE_INVALID",
  );
  assert.throws(
    ()=>applyCommercialAdjustmentPrecedenceV1({
      baseline:base(),
      adjustments:prepared([],[
        eligibleDelta({entitlementCode:"storage.limit",meterCode:"storage",scope:{kind:"TENANT"},valueType:"INTEGER",amount:1}),
      ]),
      industryContexts:[],
    }),
    error=>error instanceof CommercialAdjustmentPrecedenceError
      && error.code==="COMMERCIAL_ADJUSTMENT_PRECEDENCE_INVALID",
  );
  const unlimited={
    entitlements:[{code:"storage.limit",valueType:"DECIMAL",grantMode:"INCLUDED",value:0}],
    limits:[{entitlementCode:"storage.limit",meterCode:"storage",mode:"UNLIMITED"}],
  };
  assert.throws(
    ()=>applyCommercialAdjustmentPrecedenceV1({
      baseline:unlimited,
      adjustments:prepared([],[
        eligibleDelta({entitlementCode:"storage.limit",meterCode:"storage",scope:{kind:"TENANT"},valueType:"DECIMAL",amount:1}),
      ]),
      industryContexts:[],
    }),
    error=>error instanceof CommercialAdjustmentPrecedenceError
      && error.code==="COMMERCIAL_ADJUSTMENT_PRECEDENCE_INVALID",
  );
});


test("limit-only baseline dimensions remain valid precedence targets",()=>{
  const preview=applyCommercialAdjustmentPrecedenceV1({
    baseline:{
      entitlements:[],
      limits:[{entitlementCode:"api.calls",meterCode:"api.calls",mode:"FINITE",value:100}],
    },
    adjustments:prepared([
      {id:randomUUID(),entitlementCode:"api.calls",overrideType:"LIMIT_SET",valueType:"INTEGER",value:80},
    ],[
      eligibleDelta({entitlementCode:"api.calls",meterCode:"api.calls",scope:{kind:"TENANT"},valueType:"INTEGER",amount:20}),
    ]),
    industryContexts:[],
  });
  assert.deepEqual(preview.limits,[{
    entitlementCode:"api.calls",meterCode:"api.calls",mode:"FINITE",value:100,
  }]);
});
