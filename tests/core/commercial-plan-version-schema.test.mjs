import test from "node:test";
import assert from "node:assert/strict";

import {
  PlanVersionSchemaError,
  parsePlanEntitlementTemplateV1,
  parsePlanLimitSetV1,
} from "../../dist/core/index.js";

test("PlanVersion entitlement-template v1 normalizes deterministic facts and explicit markers",()=>{
  const parsed=parsePlanEntitlementTemplateV1({
    schemaVersion:1,
    facts:[
      {
        code:"rtl.pos.enabled",
        valueType:"BOOLEAN",
        scope:{kind:"INDUSTRY_CODE",industryCode:"RTL"},
        grantMode:"INCLUDED",
        value:true,
      },
      {
        code:"api.rate.class",
        valueType:"TEXT",
        scope:{kind:"TENANT"},
        grantMode:"INCLUDED",
        value:"standard",
      },
      {
        code:"industry.optional",
        valueType:"BOOLEAN",
        scope:{kind:"LICENSED_INDUSTRIES"},
        grantMode:"ADD_ON_ONLY",
      },
      {
        code:"features.set",
        valueType:"SET",
        scope:{kind:"TENANT"},
        grantMode:"INCLUDED",
        value:["b","a"],
      },
    ],
  });
  assert.equal(parsed.schemaVersion,1);
  assert.deepEqual(parsed.facts.map(f=>f.code),[
    "api.rate.class","features.set","industry.optional","rtl.pos.enabled",
  ]);
  assert.deepEqual(parsed.facts[1].value,["a","b"]);
  assert.equal(parsed.facts[2].grantMode,"ADD_ON_ONLY");
  assert.equal("value" in parsed.facts[2],false);
});

test("PlanVersion limit-set v1 preserves finite/unlimited/not-included/add-on-only semantics",()=>{
  const parsed=parsePlanLimitSetV1({
    schemaVersion:1,
    limits:[
      {
        entitlementCode:"storage.gb",
        meterCode:"storage.gb",
        scope:{kind:"TENANT"},
        mode:"FINITE",
        value:100,
      },
      {
        entitlementCode:"api.requests",
        meterCode:"api.requests",
        scope:{kind:"TENANT"},
        mode:"UNLIMITED",
      },
      {
        entitlementCode:"ai.tokens",
        meterCode:"ai.tokens",
        scope:{kind:"TENANT"},
        mode:"ADD_ON_ONLY",
      },
      {
        entitlementCode:"branches.count",
        meterCode:"branches.count",
        scope:{kind:"TENANT"},
        mode:"NOT_INCLUDED",
      },
    ],
  });
  assert.equal(parsed.limits.length,4);
  assert.equal(parsed.limits.find(x=>x.entitlementCode==="storage.gb").value,100);
  assert.equal(
    "value" in parsed.limits.find(x=>x.entitlementCode==="api.requests"),
    false,
  );
});

test("PlanVersion v1 fails closed on unknown versions, fields, duplicates and marker/value conflicts",()=>{
  assert.throws(
    ()=>parsePlanEntitlementTemplateV1({schemaVersion:2,facts:[]}),
    e=>e instanceof PlanVersionSchemaError && e.code==="PLAN_VERSION_SCHEMA_UNSUPPORTED",
  );
  assert.throws(
    ()=>parsePlanEntitlementTemplateV1({
      schemaVersion:1,
      facts:[{
        code:"x",valueType:"BOOLEAN",scope:{kind:"TENANT"},
        grantMode:"NOT_INCLUDED",value:false,
      }],
    }),
    e=>e instanceof PlanVersionSchemaError && e.code==="PLAN_VERSION_SCHEMA_INVALID",
  );
  assert.throws(
    ()=>parsePlanEntitlementTemplateV1({
      schemaVersion:1,
      facts:[
        {code:"x",valueType:"BOOLEAN",scope:{kind:"TENANT"},grantMode:"INCLUDED",value:true},
        {code:"x",valueType:"BOOLEAN",scope:{kind:"TENANT"},grantMode:"INCLUDED",value:false},
      ],
    }),
    e=>e instanceof PlanVersionSchemaError && e.code==="PLAN_VERSION_SCHEMA_INVALID",
  );
  assert.throws(
    ()=>parsePlanLimitSetV1({
      schemaVersion:1,
      limits:[{
        entitlementCode:"x",meterCode:"x",scope:{kind:"TENANT"},
        mode:"UNLIMITED",value:1,
      }],
    }),
    e=>e instanceof PlanVersionSchemaError && e.code==="PLAN_VERSION_SCHEMA_INVALID",
  );
  assert.throws(
    ()=>parsePlanLimitSetV1({
      schemaVersion:1,limits:[],unexpected:true,
    }),
    e=>e instanceof PlanVersionSchemaError && e.code==="PLAN_VERSION_SCHEMA_INVALID",
  );
});
