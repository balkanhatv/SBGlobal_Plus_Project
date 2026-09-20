import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  PlanVersionBaselineError,
  expandPlanVersionBaselineV1,
  parsePlanEntitlementTemplateV1,
  parsePlanLimitSetV1,
} from "../../dist/core/index.js";

function license(industryContextId,effective=true){
  return Object.freeze({
    id:randomUUID(),
    licenseType:"INDUSTRY",
    subjectKey:"industry",
    industryContextId,
    isEffective:effective,
  });
}

test("PlanVersion baseline expands Tenant and licensed active Industry selectors deterministically",()=>{
  const rtl=randomUUID(),mfg=randomUUID(),disabled=randomUUID();
  const template=parsePlanEntitlementTemplateV1({
    schemaVersion:1,
    facts:[
      {code:"core.reporting",valueType:"BOOLEAN",scope:{kind:"TENANT"},grantMode:"INCLUDED",value:true},
      {code:"industry.analytics",valueType:"BOOLEAN",scope:{kind:"LICENSED_INDUSTRIES"},grantMode:"INCLUDED",value:true},
      {code:"rtl.pos",valueType:"BOOLEAN",scope:{kind:"INDUSTRY_CODE",industryCode:"RTL"},grantMode:"ADD_ON_ONLY"},
    ],
  });
  const limits=parsePlanLimitSetV1({
    schemaVersion:1,
    limits:[
      {entitlementCode:"seats.limit",meterCode:"seats",scope:{kind:"TENANT"},mode:"FINITE",value:10},
      {entitlementCode:"storage.limit",meterCode:"storage",scope:{kind:"LICENSED_INDUSTRIES"},mode:"UNLIMITED"},
    ],
  });

  const preview=expandPlanVersionBaselineV1({
    template,limitSet:limits,
    industryContexts:[
      {id:mfg,industryCode:"MFG",status:"ACTIVE"},
      {id:disabled,industryCode:"EDU",status:"DISABLED"},
      {id:rtl,industryCode:"RTL",status:"ACTIVE"},
    ],
    licenses:[license(mfg),license(rtl),license(disabled,false)],
  });

  const resolvedIndustryIds=[mfg.toLowerCase(),rtl.toLowerCase()].sort();
  assert.deepEqual(
    preview.entitlements.map(x=>[x.code,x.industryContextId ?? null,x.grantMode]),
    [
      ["core.reporting",null,"INCLUDED"],
      ["industry.analytics",resolvedIndustryIds[0],"INCLUDED"],
      ["industry.analytics",resolvedIndustryIds[1],"INCLUDED"],
      ["rtl.pos",rtl.toLowerCase(),"ADD_ON_ONLY"],
    ],
  );
  assert.deepEqual(
    preview.limits.map(x=>[x.entitlementCode,x.industryContextId ?? null,x.mode]),
    [
      ["seats.limit",null,"FINITE"],
      ["storage.limit",resolvedIndustryIds[0],"UNLIMITED"],
      ["storage.limit",resolvedIndustryIds[1],"UNLIMITED"],
    ],
  );
});

test("PlanVersion baseline never instantiates Industry-scoped plan facts without an effective Industry license",()=>{
  const rtl=randomUUID();
  const template=parsePlanEntitlementTemplateV1({
    schemaVersion:1,
    facts:[
      {code:"rtl.pos",valueType:"BOOLEAN",scope:{kind:"INDUSTRY_CODE",industryCode:"RTL"},grantMode:"INCLUDED",value:true},
      {code:"tenant.branding",valueType:"BOOLEAN",scope:{kind:"TENANT"},grantMode:"INCLUDED",value:true},
    ],
  });
  const preview=expandPlanVersionBaselineV1({
    template,
    limitSet:parsePlanLimitSetV1({schemaVersion:1,limits:[]}),
    industryContexts:[{id:rtl,industryCode:"RTL",status:"ACTIVE"}],
    licenses:[license(rtl,false)],
  });
  assert.deepEqual(preview.entitlements.map(x=>x.code),["tenant.branding"]);
});

test("PlanVersion baseline fails closed on stale license references and overlapping resolved selectors",()=>{
  const rtl=randomUUID();
  const template=parsePlanEntitlementTemplateV1({
    schemaVersion:1,
    facts:[
      {code:"x",valueType:"BOOLEAN",scope:{kind:"LICENSED_INDUSTRIES"},grantMode:"INCLUDED",value:true},
      {code:"x",valueType:"BOOLEAN",scope:{kind:"INDUSTRY_CODE",industryCode:"RTL"},grantMode:"NOT_INCLUDED"},
    ],
  });
  const limitSet=parsePlanLimitSetV1({schemaVersion:1,limits:[]});

  assert.throws(
    ()=>expandPlanVersionBaselineV1({
      template,limitSet,
      industryContexts:[{id:rtl,industryCode:"RTL",status:"ACTIVE"}],
      licenses:[license(rtl)],
    }),
    e=>e instanceof PlanVersionBaselineError
      && e.code==="PLAN_VERSION_BASELINE_AMBIGUOUS",
  );

  assert.throws(
    ()=>expandPlanVersionBaselineV1({
      template:parsePlanEntitlementTemplateV1({schemaVersion:1,facts:[]}),
      limitSet,
      industryContexts:[{id:rtl,industryCode:"RTL",status:"ACTIVE"}],
      licenses:[license(randomUUID())],
    }),
    e=>e instanceof PlanVersionBaselineError
      && e.code==="PLAN_VERSION_BASELINE_INVALID",
  );
});

test("pending and other inactive Industry contexts do not block or receive baseline grants",()=>{
  const active=randomUUID();
  const inactive=[
    {id:randomUUID(),industryCode:"EDU",status:"PENDING"},
    {id:randomUUID(),industryCode:"MFG",status:"SUSPENDED"},
    {id:randomUUID(),industryCode:"GOV",status:"DISABLED"},
  ];
  const template=parsePlanEntitlementTemplateV1({schemaVersion:1,facts:[
    {code:"tenant.branding",valueType:"BOOLEAN",scope:{kind:"TENANT"},grantMode:"INCLUDED",value:true},
    {code:"industry.analytics",valueType:"BOOLEAN",scope:{kind:"LICENSED_INDUSTRIES"},grantMode:"INCLUDED",value:true},
    {code:"education.feature",valueType:"BOOLEAN",scope:{kind:"INDUSTRY_CODE",industryCode:"EDU"},grantMode:"INCLUDED",value:true},
  ]});
  const limitSet=parsePlanLimitSetV1({schemaVersion:1,limits:[
    {entitlementCode:"industry.storage",meterCode:"storage",scope:{kind:"LICENSED_INDUSTRIES"},mode:"FINITE",value:10},
    {entitlementCode:"education.storage",meterCode:"storage",scope:{kind:"INDUSTRY_CODE",industryCode:"EDU"},mode:"FINITE",value:10},
  ]});
  const input={
    template,limitSet,
    industryContexts:[{id:active,industryCode:"RTL",status:"ACTIVE"},...inactive],
    // Even an effective license must never activate a non-ACTIVE Industry.
    licenses:[license(active),...inactive.map(item=>license(item.id))],
  };
  const preview=expandPlanVersionBaselineV1(input);
  assert.deepEqual(preview.entitlements.map(item=>[item.code,item.industryContextId ?? null]),[
    ["industry.analytics",active],
    ["tenant.branding",null],
  ]);
  assert.deepEqual(preview.limits.map(item=>[item.entitlementCode,item.industryContextId]),[
    ["industry.storage",active],
  ]);
  assert.throws(
    ()=>expandPlanVersionBaselineV1({...input,industryContexts:[{id:active,industryCode:"RTL",status:"UNKNOWN"}]}),
    error=>error instanceof PlanVersionBaselineError && error.code==="PLAN_VERSION_BASELINE_INVALID",
  );
});
