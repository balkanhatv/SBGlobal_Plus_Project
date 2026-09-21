import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  CommercialComplianceSecurityRestrictionInputService,
  CommercialRestrictionInputError,
} from "../../dist/core/index.js";

function context(overrides={}){
  return {
    requestId:randomUUID(),
    correlationId:randomUUID(),
    tenantId:randomUUID(),
    dataHomeId:randomUUID(),
    regionCode:"IN-CENTRAL",
    principalId:randomUUID(),
    principalType:"SERVICE",
    orgUnitPath:[],
    roleIds:[],
    scopeClass:"TENANT_CORE",
    ...overrides,
  };
}

function preview(industryContextId=randomUUID().toLowerCase()){
  return {
    entitlements:[
      {code:"feature.a",valueType:"BOOLEAN",state:"VALUE",value:true},
      {code:"feature.b",valueType:"BOOLEAN",industryContextId,state:"VALUE",value:true},
    ],
    limits:[
      {entitlementCode:"storage.limit",meterCode:"storage",mode:"FINITE",value:100},
    ],
    tenantDenySet:[],
  };
}

function decision(targetPlanVersionId,restrictions=[]){
  return {
    targetPlanVersionId,
    policyVersion:"security-policy:v7",
    evidenceReference:"security-evidence:123",
    restrictions,
  };
}

test("restriction input requires SERVICE + TENANT_CORE before resolver execution",async()=>{
  let calls=0;
  const service=new CommercialComplianceSecurityRestrictionInputService({
    async evaluate(){ calls+=1; return decision(randomUUID()); },
  });
  await assert.rejects(
    ()=>service.prepare({
      requestContext:context({principalType:"HUMAN"}),
      targetPlanVersionId:randomUUID(),
      preview:preview(),
    }),
    error=>error instanceof CommercialRestrictionInputError
      && error.code==="COMMERCIAL_RESTRICTION_SCOPE_INVALID",
  );
  assert.equal(calls,0);
});

test("server-owned resolver receives exact target preview and empty restriction result remains authoritative",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  const targetPreview=preview();
  let observed;
  const service=new CommercialComplianceSecurityRestrictionInputService({
    async evaluate(input){
      observed=input;
      return decision(targetPlanVersionId,[]);
    },
  });
  const output=await service.prepare({
    requestContext:context(),
    targetPlanVersionId,
    preview:targetPreview,
  });
  assert.equal(observed.targetPlanVersionId,targetPlanVersionId);
  assert.equal(observed.preview,targetPreview);
  assert.deepEqual(output,{
    targetPlanVersionId,
    policyVersion:"security-policy:v7",
    evidenceReference:"security-evidence:123",
    restrictions:[],
  });
  assert.ok(Object.isFrozen(output));
  assert.ok(Object.isFrozen(output.restrictions));
});

test("exact Tenant and Industry DENY restrictions are validated and deterministically sorted",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  const industryContextId=randomUUID().toLowerCase();
  const service=new CommercialComplianceSecurityRestrictionInputService({
    async evaluate(){
      return decision(targetPlanVersionId,[
        {effect:"DENY",entitlementCode:"feature.b",industryContextId,controlCode:"CTRL-20"},
        {effect:"DENY",entitlementCode:"feature.a",controlCode:"CTRL-10"},
        {effect:"DENY",entitlementCode:"feature.a",controlCode:"CTRL-09"},
      ]);
    },
  });
  const output=await service.prepare({
    requestContext:context(),
    targetPlanVersionId,
    preview:preview(industryContextId),
  });
  assert.deepEqual(output.restrictions,[
    {effect:"DENY",entitlementCode:"feature.a",controlCode:"CTRL-09"},
    {effect:"DENY",entitlementCode:"feature.a",controlCode:"CTRL-10"},
    {effect:"DENY",entitlementCode:"feature.b",industryContextId,controlCode:"CTRL-20"},
  ]);
  assert.ok(output.restrictions.every(Object.isFrozen));
});

test("resolver cannot synthesize, fan out, or guess a missing entitlement target",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  const service=new CommercialComplianceSecurityRestrictionInputService({
    async evaluate(){
      return decision(targetPlanVersionId,[
        {effect:"DENY",entitlementCode:"missing.feature",controlCode:"CTRL-1"},
      ]);
    },
  });
  await assert.rejects(
    ()=>service.prepare({
      requestContext:context(),
      targetPlanVersionId,
      preview:preview(),
    }),
    error=>error instanceof CommercialRestrictionInputError
      && error.code==="COMMERCIAL_RESTRICTION_TARGET_INVALID",
  );
});

test("v1 rejects ALLOW and numeric/opaque restriction effects instead of inventing semantics",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  for(const restriction of [
    {effect:"ALLOW",entitlementCode:"feature.a",controlCode:"CTRL-1"},
    {effect:"LIMIT_CAP",entitlementCode:"feature.a",controlCode:"CTRL-1",maxValue:1},
  ]){
    const service=new CommercialComplianceSecurityRestrictionInputService({
      async evaluate(){ return decision(targetPlanVersionId,[restriction]); },
    });
    await assert.rejects(
      ()=>service.prepare({
        requestContext:context(),
        targetPlanVersionId,
        preview:preview(),
      }),
      error=>error instanceof CommercialRestrictionInputError
        && error.code==="COMMERCIAL_RESTRICTION_RESOLVER_INVALID",
    );
  }
});

test("duplicate control-target tuples fail closed while independent controls may deny the same target",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  const duplicate={effect:"DENY",entitlementCode:"feature.a",controlCode:"CTRL-1"};
  const service=new CommercialComplianceSecurityRestrictionInputService({
    async evaluate(){ return decision(targetPlanVersionId,[duplicate,{...duplicate}]); },
  });
  await assert.rejects(
    ()=>service.prepare({
      requestContext:context(),
      targetPlanVersionId,
      preview:preview(),
    }),
    error=>error instanceof CommercialRestrictionInputError
      && error.code==="COMMERCIAL_RESTRICTION_RESOLVER_INVALID",
  );

  const accepted=new CommercialComplianceSecurityRestrictionInputService({
    async evaluate(){
      return decision(targetPlanVersionId,[
        duplicate,
        {effect:"DENY",entitlementCode:"feature.a",controlCode:"CTRL-2"},
      ]);
    },
  });
  const output=await accepted.prepare({
    requestContext:context(),
    targetPlanVersionId,
    preview:preview(),
  });
  assert.equal(output.restrictions.length,2);
});

test("mismatched target PlanVersion or malformed policy evidence fails closed",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  for(const result of [
    decision(randomUUID(),[]),
    {...decision(targetPlanVersionId,[]),policyVersion:""},
    {...decision(targetPlanVersionId,[]),evidenceReference:"contains whitespace"},
  ]){
    const service=new CommercialComplianceSecurityRestrictionInputService({
      async evaluate(){ return result; },
    });
    await assert.rejects(
      ()=>service.prepare({
        requestContext:context(),
        targetPlanVersionId,
        preview:preview(),
      }),
      error=>error instanceof CommercialRestrictionInputError
        && error.code==="COMMERCIAL_RESTRICTION_RESOLVER_INVALID",
    );
  }
});

test("duplicate DD-071 entitlement targets are rejected before resolver use",async()=>{
  let calls=0;
  const targetPlanVersionId=randomUUID().toLowerCase();
  const base=preview();
  const service=new CommercialComplianceSecurityRestrictionInputService({
    async evaluate(){ calls+=1; return decision(targetPlanVersionId,[]); },
  });
  await assert.rejects(
    ()=>service.prepare({
      requestContext:context(),
      targetPlanVersionId,
      preview:{...base,entitlements:[base.entitlements[0],base.entitlements[0]]},
    }),
    error=>error instanceof CommercialRestrictionInputError
      && error.code==="COMMERCIAL_RESTRICTION_INPUT_INVALID",
  );
  assert.equal(calls,0);
});

test("resolver dependency failure is not converted into an allow-like empty restriction set",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  const service=new CommercialComplianceSecurityRestrictionInputService({
    async evaluate(){ throw new Error("restriction resolver unavailable"); },
  });
  await assert.rejects(
    ()=>service.prepare({
      requestContext:context(),
      targetPlanVersionId,
      preview:preview(),
    }),
    /restriction resolver unavailable/,
  );
});
