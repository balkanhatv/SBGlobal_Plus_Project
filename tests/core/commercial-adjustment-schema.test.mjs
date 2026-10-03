import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  CommercialAdjustmentSchemaError,
  normalizeTenantOverrideV1,
  parseAddOnEntitlementDeltaV1,
  scaleAddOnQuotaDeltasV1,
} from "../../dist/core/index.js";

test("add-on delta v1 is quota-only, deterministic and quantity-scaled",()=>{
  const parsed=parseAddOnEntitlementDeltaV1({
    schemaVersion:1,
    quotaDeltas:[
      {
        entitlementCode:"storage.gb",meterCode:"storage.gb",
        scope:{kind:"TENANT"},valueType:"DECIMAL",amount:25.5,
      },
      {
        entitlementCode:"seats.limit",meterCode:"seats",
        scope:{kind:"LICENSED_INDUSTRIES"},valueType:"INTEGER",amount:2,
      },
    ],
  });
  const scaled=scaleAddOnQuotaDeltasV1(parsed,3);
  assert.deepEqual(
    scaled.map(x=>[x.entitlementCode,x.amount]),
    [["seats.limit",6],["storage.gb",76.5]],
  );
});

test("tenant override normalization fixes Tenant-vs-Industry deny representation",()=>{
  const tenantDeny=normalizeTenantOverrideV1({
    id:randomUUID(),entitlementCode:"feature.a",overrideType:"DENY",
    valueType:"BOOLEAN",value:true,
  });
  assert.equal(tenantDeny.representation,"TENANT_DENY_SET");
  assert.equal(tenantDeny.disabledValue,false);

  const industryDeny=normalizeTenantOverrideV1({
    id:randomUUID(),industryContextId:randomUUID(),entitlementCode:"quota.a",
    overrideType:"DENY",valueType:"INTEGER",value:true,
  });
  assert.equal(industryDeny.representation,"SCOPED_DISABLED_FACT");
  assert.equal(industryDeny.disabledValue,0);

  const allow=normalizeTenantOverrideV1({
    id:randomUUID(),industryContextId:randomUUID(),entitlementCode:"feature.set",
    overrideType:"ALLOW",valueType:"SET",value:["b","a"],
  });
  assert.deepEqual(allow.value,["a","b"]);

  const delta=normalizeTenantOverrideV1({
    id:randomUUID(),entitlementCode:"storage.gb",overrideType:"LIMIT_DELTA",
    valueType:"DECIMAL",value:-10.5,
  });
  assert.equal(delta.delta,-10.5);
});

test("adjustment v1 fails closed on non-quota add-ons and malformed override values",()=>{
  assert.throws(
    ()=>parseAddOnEntitlementDeltaV1({
      schemaVersion:1,
      quotaDeltas:[{
        entitlementCode:"feature.a",meterCode:"feature.a",scope:{kind:"TENANT"},
        valueType:"BOOLEAN",amount:1,
      }],
    }),
    e=>e instanceof CommercialAdjustmentSchemaError
      && e.code==="COMMERCIAL_ADJUSTMENT_SCHEMA_INVALID",
  );
  assert.throws(
    ()=>normalizeTenantOverrideV1({
      id:randomUUID(),entitlementCode:"feature.a",overrideType:"DENY",
      valueType:"BOOLEAN",value:false,
    }),
    e=>e instanceof CommercialAdjustmentSchemaError
      && e.code==="COMMERCIAL_ADJUSTMENT_SCHEMA_INVALID",
  );
  assert.throws(
    ()=>normalizeTenantOverrideV1({
      id:randomUUID(),entitlementCode:"feature.a",overrideType:"LIMIT_SET",
      valueType:"BOOLEAN",value:1,
    }),
    e=>e instanceof CommercialAdjustmentSchemaError
      && e.code==="COMMERCIAL_ADJUSTMENT_SCHEMA_INVALID",
  );
  const integer=parseAddOnEntitlementDeltaV1({
    schemaVersion:1,
    quotaDeltas:[{
      entitlementCode:"seats.limit",meterCode:"seats",scope:{kind:"TENANT"},
      valueType:"INTEGER",amount:1,
    }],
  });
  assert.throws(
    ()=>scaleAddOnQuotaDeltasV1(integer,1.5),
    e=>e instanceof CommercialAdjustmentSchemaError
      && e.code==="COMMERCIAL_ADJUSTMENT_SCHEMA_INVALID",
  );
});
