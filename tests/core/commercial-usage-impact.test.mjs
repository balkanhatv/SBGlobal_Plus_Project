import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  CommercialUsageImpactError,
  CommercialUsageImpactService,
} from "../../dist/core/index.js";

function context(overrides={}){
  return {
    requestId:randomUUID(),correlationId:randomUUID(),
    tenantId:randomUUID(),dataHomeId:randomUUID(),regionCode:"IN-CENTRAL",
    principalId:randomUUID(),principalType:"SERVICE",
    orgUnitPath:[],roleIds:[],scopeClass:"TENANT_CORE",
    ...overrides,
  };
}
function preview(industryContextId=randomUUID().toLowerCase()){
  return {
    entitlements:[],
    limits:[
      {entitlementCode:"api.calls",meterCode:"api.calls",mode:"FINITE",value:100},
      {entitlementCode:"storage.bytes",meterCode:"storage",industryContextId,mode:"NOT_INCLUDED"},
      {entitlementCode:"ai.tokens",meterCode:"ai.tokens",mode:"ADD_ON_ONLY"},
      {entitlementCode:"reports",meterCode:"reports",mode:"UNLIMITED"},
    ],
    tenantDenySet:[],
  };
}
function bundle(targetPlanVersionId,measurements){
  return {
    targetPlanVersionId,
    selectionPolicyVersion:"usage-period:v1",
    evidenceReference:"usage-evidence:123",
    measurements,
  };
}
function measurement(overrides={}){
  return {
    entitlementCode:"api.calls",meterCode:"api.calls",
    periodKey:"2026-09",usedValue:80,reservedValue:0,version:2,
    ...overrides,
  };
}

test("usage impact requires SERVICE + TENANT_CORE before source execution",async()=>{
  let calls=0;
  const service=new CommercialUsageImpactService({
    async load(){ calls+=1; return bundle(randomUUID(),[]); },
  });
  await assert.rejects(
    ()=>service.evaluate({
      requestContext:context({principalType:"HUMAN"}),
      targetPlanVersionId:randomUUID(),
      effectiveAt:new Date(),
      preview:preview(),
    }),
    error=>error instanceof CommercialUsageImpactError
      && error.code==="COMMERCIAL_USAGE_IMPACT_SCOPE_INVALID",
  );
  assert.equal(calls,0);
});

test("source receives exact deterministic target limits and server-owned effective time",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  const industryContextId=randomUUID().toLowerCase();
  const targetPreview=preview(industryContextId);
  const effectiveAt=new Date("2026-10-01T00:00:00.000Z");
  let observed;
  const service=new CommercialUsageImpactService({
    async load(input){
      observed=input;
      return bundle(targetPlanVersionId,[
        measurement(),
        measurement({entitlementCode:"storage.bytes",meterCode:"storage",industryContextId,usedValue:0}),
        measurement({entitlementCode:"ai.tokens",meterCode:"ai.tokens",usedValue:0}),
      ]);
    },
  });
  await service.evaluate({
    requestContext:context(),targetPlanVersionId,effectiveAt,preview:targetPreview,
  });
  assert.equal(observed.targetPlanVersionId,targetPlanVersionId);
  assert.equal(observed.effectiveAt.toISOString(),effectiveAt.toISOString());
  assert.deepEqual(
    observed.targetLimits.map(x=>[x.entitlementCode,x.meterCode,x.industryContextId??"",x.mode]),
    [
      ["ai.tokens","ai.tokens","","ADD_ON_ONLY"],
      ["api.calls","api.calls","","FINITE"],
      ["reports","reports","","UNLIMITED"],
      ["storage.bytes","storage",industryContextId,"NOT_INCLUDED"],
    ],
  );
});

test("FINITE usage compares persisted used_value to exact target and reports blocker",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  const p={entitlements:[],limits:[
    {entitlementCode:"api.calls",meterCode:"api.calls",mode:"FINITE",value:100},
    {entitlementCode:"storage.bytes",meterCode:"storage",mode:"FINITE",value:50},
  ],tenantDenySet:[]};
  const service=new CommercialUsageImpactService({
    async load(){
      return bundle(targetPlanVersionId,[
        measurement({usedValue:100}),
        measurement({entitlementCode:"storage.bytes",meterCode:"storage",usedValue:51}),
      ]);
    },
  });
  const result=await service.evaluate({
    requestContext:context(),targetPlanVersionId,effectiveAt:new Date(),preview:p,
  });
  assert.equal(result.hasBlockingUsage,true);
  assert.deepEqual(result.impacts.map(x=>[x.meterCode,x.status,x.targetValue,x.usedValue]),[
    ["api.calls","WITHIN_TARGET",100,100],
    ["storage","EXCEEDS_TARGET",50,51],
  ]);
});

test("NOT_INCLUDED and unresolved ADD_ON_ONLY are zero-capacity targets after DD-071",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  const industryContextId=randomUUID().toLowerCase();
  const service=new CommercialUsageImpactService({
    async load(){
      return bundle(targetPlanVersionId,[
        measurement({entitlementCode:"storage.bytes",meterCode:"storage",industryContextId,usedValue:1}),
        measurement({entitlementCode:"ai.tokens",meterCode:"ai.tokens",usedValue:0}),
        measurement(),
      ]);
    },
  });
  const result=await service.evaluate({
    requestContext:context(),targetPlanVersionId,effectiveAt:new Date(),
    preview:preview(industryContextId),
  });
  assert.equal(result.hasBlockingUsage,true);
  assert.deepEqual(
    result.impacts.filter(x=>x.targetMode!=="UNLIMITED").map(x=>[
      x.entitlementCode,x.targetValue,x.status,
    ]),
    [
      ["ai.tokens",0,"WITHIN_TARGET"],
      ["api.calls",100,"WITHIN_TARGET"],
      ["storage.bytes",0,"EXCEEDS_TARGET"],
    ],
  );
});

test("UNLIMITED target requires no measurement and never creates a usage blocker",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  const service=new CommercialUsageImpactService({
    async load(){ return bundle(targetPlanVersionId,[]); },
  });
  const result=await service.evaluate({
    requestContext:context(),targetPlanVersionId,effectiveAt:new Date(),
    preview:{entitlements:[],limits:[
      {entitlementCode:"reports",meterCode:"reports",mode:"UNLIMITED"},
    ],tenantDenySet:[]},
  });
  assert.deepEqual(result.impacts,[{
    entitlementCode:"reports",meterCode:"reports",targetMode:"UNLIMITED",status:"UNLIMITED",
  }]);
  assert.equal(result.hasBlockingUsage,false);
});

test("outstanding reserved usage fails closed because downgrade reservation semantics are unspecified",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  const service=new CommercialUsageImpactService({
    async load(){ return bundle(targetPlanVersionId,[measurement({reservedValue:1})]); },
  });
  await assert.rejects(
    ()=>service.evaluate({
      requestContext:context(),targetPlanVersionId,effectiveAt:new Date(),
      preview:{entitlements:[],limits:[
        {entitlementCode:"api.calls",meterCode:"api.calls",mode:"FINITE",value:100},
      ],tenantDenySet:[]},
    }),
    error=>error instanceof CommercialUsageImpactError
      && error.code==="COMMERCIAL_USAGE_IMPACT_RESERVATION_UNRESOLVED",
  );
});

test("missing, unknown or multiple selected period measurements fail closed",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  const target={entitlements:[],limits:[
    {entitlementCode:"api.calls",meterCode:"api.calls",mode:"FINITE",value:100},
  ],tenantDenySet:[]};
  for(const measurements of [
    [],
    [measurement({entitlementCode:"unknown"})],
    [measurement(),measurement({periodKey:"2026-10"})],
  ]){
    const service=new CommercialUsageImpactService({
      async load(){ return bundle(targetPlanVersionId,measurements); },
    });
    await assert.rejects(
      ()=>service.evaluate({
        requestContext:context(),targetPlanVersionId,effectiveAt:new Date(),preview:target,
      }),
      error=>error instanceof CommercialUsageImpactError
        && [
          "COMMERCIAL_USAGE_IMPACT_MEASUREMENT_MISSING",
          "COMMERCIAL_USAGE_IMPACT_TARGET_INVALID",
          "COMMERCIAL_USAGE_IMPACT_AMBIGUOUS",
        ].includes(error.code),
    );
  }
});

test("stale target binding, malformed evidence and invalid persisted measurements fail closed",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  const target={entitlements:[],limits:[
    {entitlementCode:"api.calls",meterCode:"api.calls",mode:"FINITE",value:100},
  ],tenantDenySet:[]};
  const bundles=[
    bundle(randomUUID(),[measurement()]),
    {...bundle(targetPlanVersionId,[measurement()]),selectionPolicyVersion:""},
    bundle(targetPlanVersionId,[measurement({usedValue:-1})]),
    bundle(targetPlanVersionId,[measurement({version:0})]),
  ];
  for(const sourceBundle of bundles){
    const service=new CommercialUsageImpactService({
      async load(){ return sourceBundle; },
    });
    await assert.rejects(
      ()=>service.evaluate({
        requestContext:context(),targetPlanVersionId,effectiveAt:new Date(),preview:target,
      }),
      error=>error instanceof CommercialUsageImpactError
        && error.code==="COMMERCIAL_USAGE_IMPACT_SOURCE_INVALID",
    );
  }
});

test("target and measurement input ordering do not change deterministic impact ordering",async()=>{
  const targetPlanVersionId=randomUUID().toLowerCase();
  const limits=[
    {entitlementCode:"z.limit",meterCode:"z",mode:"FINITE",value:5},
    {entitlementCode:"a.limit",meterCode:"a",mode:"FINITE",value:10},
  ];
  const measurements=[
    measurement({entitlementCode:"z.limit",meterCode:"z",usedValue:1}),
    measurement({entitlementCode:"a.limit",meterCode:"a",usedValue:2}),
  ];
  async function run(targets,rows){
    const service=new CommercialUsageImpactService({
      async load(){ return bundle(targetPlanVersionId,rows); },
    });
    return service.evaluate({
      requestContext:context(),targetPlanVersionId,effectiveAt:new Date(),
      preview:{entitlements:[],limits:targets,tenantDenySet:[]},
    });
  }
  const a=await run(limits,measurements);
  const b=await run([...limits].reverse(),[...measurements].reverse());
  assert.deepEqual(a.impacts,b.impacts);
  assert.deepEqual(a.impacts.map(x=>x.entitlementCode),["a.limit","z.limit"]);
});
