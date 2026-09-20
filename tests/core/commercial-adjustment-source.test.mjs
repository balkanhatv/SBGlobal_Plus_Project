import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  CommercialAdjustmentSourceError,
  CommercialAdjustmentSourceService,
} from "../../dist/core/index.js";

function context(){
  return Object.freeze({
    requestId:randomUUID(),correlationId:randomUUID(),tenantId:randomUUID(),
    dataHomeId:randomUUID(),regionCode:"IN-ADJUSTMENT",
    principalId:randomUUID(),principalType:"SERVICE",
    orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"TENANT_CORE",
  });
}

test("adjustment source service requires resolver eligibility before applying add-on deltas",async()=>{
  const c=context(),subscriptionId=randomUUID(),source=randomUUID(),target=randomUUID();
  const eligibleId=randomUUID(),ineligibleId=randomUUID();
  const store={
    async load(){
      return {
        subscriptionId,subscriptionVersion:7,sourcePlanVersionId:source,targetPlanVersionId:target,
        targetPlanPolicies:{trialPolicy:null,billingPolicy:{opaque:true}},
        addOns:[
          {
            tenantAddOnId:eligibleId,tenantAddOnVersion:2,addOnId:randomUUID(),
            addOnCode:"storage.pack",addOnVersion:1,quantity:2,
            effectiveFrom:new Date("2026-09-20T00:00:00Z"),
            entitlementDeltaDocument:{
              schemaVersion:1,
              quotaDeltas:[{
                entitlementCode:"storage.gb",meterCode:"storage.gb",
                scope:{kind:"TENANT"},valueType:"DECIMAL",amount:25,
              }],
            },
            eligibilityDocument:{opaque:"server-owned"},
          },
          {
            tenantAddOnId:ineligibleId,tenantAddOnVersion:1,addOnId:randomUUID(),
            addOnCode:"seat.pack",addOnVersion:1,quantity:5,
            effectiveFrom:new Date("2026-09-20T00:00:00Z"),
            entitlementDeltaDocument:{
              schemaVersion:1,
              quotaDeltas:[{
                entitlementCode:"seats.limit",meterCode:"seats",
                scope:{kind:"TENANT"},valueType:"INTEGER",amount:1,
              }],
            },
            eligibilityDocument:{opaque:"server-owned"},
          },
        ],
        overrides:[{
          id:randomUUID(),entitlementCode:"feature.a",overrideType:"DENY",
          valueType:"BOOLEAN",value:true,reasonCode:"GOVERNED",
          effectiveFrom:new Date("2026-09-20T00:00:00Z"),
        }],
      };
    },
  };
  const seen=[];
  const service=new CommercialAdjustmentSourceService({
    store,
    eligibility:{
      async evaluate(input){
        seen.push(input);
        return {
          status:input.addOn.tenantAddOnId===eligibleId?"ELIGIBLE":"INELIGIBLE",
          policyVersion:"plan-addon-v1",
          evidenceReference:"policy:evidence:"+input.addOn.addOnCode,
        };
      },
    },
  });

  const result=await service.prepare({
    requestContext:c,subscriptionId,expectedSubscriptionVersion:7,
    expectedSourcePlanVersionId:source,targetPlanVersionId:target,
    effectiveAt:new Date("2026-09-20T01:00:00Z"),
  });

  assert.equal(seen.length,2);
  assert.equal(result.eligibleAddOns.length,1);
  assert.equal(result.ineligibleAddOns.length,1);
  assert.deepEqual(result.eligibleAddOns[0].quotaDeltas.map(x=>x.amount),[50]);
  assert.equal(result.overrides[0].overrideType,"DENY");
  assert.equal(result.overrides[0].representation,"TENANT_DENY_SET");
});

test("adjustment source service fails closed on unsafe context, stale store binding and invalid resolver evidence",async()=>{
  const c=context(),subscriptionId=randomUUID(),source=randomUUID(),target=randomUUID();
  const base={
    requestContext:c,subscriptionId,expectedSubscriptionVersion:2,
    expectedSourcePlanVersionId:source,targetPlanVersionId:target,
    effectiveAt:new Date("2026-09-20T01:00:00Z"),
  };
  const makeService=(load,evaluate)=>new CommercialAdjustmentSourceService({
    store:{load},
    eligibility:{evaluate},
  });

  await assert.rejects(
    makeService(async()=>{throw new Error("unreachable");},async()=>({status:"ELIGIBLE"}))
      .prepare({...base,requestContext:{...c,principalType:"HUMAN"}}),
    e=>e instanceof CommercialAdjustmentSourceError
      && e.code==="COMMERCIAL_ADJUSTMENT_SOURCE_SCOPE_INVALID",
  );

  await assert.rejects(
    makeService(async()=>({
      subscriptionId,subscriptionVersion:3,sourcePlanVersionId:source,targetPlanVersionId:target,
      targetPlanPolicies:{trialPolicy:null,billingPolicy:{}},addOns:[],overrides:[],
    }),async()=>({status:"ELIGIBLE",policyVersion:"v1",evidenceReference:"e:1"}))
      .prepare(base),
    e=>e instanceof CommercialAdjustmentSourceError
      && e.code==="COMMERCIAL_ADJUSTMENT_SOURCE_STALE",
  );

  await assert.rejects(
    makeService(async()=>({
      subscriptionId,subscriptionVersion:2,sourcePlanVersionId:source,targetPlanVersionId:target,
      targetPlanPolicies:{trialPolicy:null,billingPolicy:{}},
      addOns:[{
        tenantAddOnId:randomUUID(),tenantAddOnVersion:1,addOnId:randomUUID(),
        addOnCode:"storage.pack",addOnVersion:1,quantity:1,
        effectiveFrom:new Date("2026-09-20T00:00:00Z"),
        entitlementDeltaDocument:{schemaVersion:1,quotaDeltas:[]},
        eligibilityDocument:{},
      }],
      overrides:[],
    }),async()=>({status:"ELIGIBLE",policyVersion:"",evidenceReference:"bad"}))
      .prepare(base),
    e=>e instanceof CommercialAdjustmentSourceError
      && e.code==="COMMERCIAL_ADJUSTMENT_ELIGIBILITY_INVALID",
  );
});
