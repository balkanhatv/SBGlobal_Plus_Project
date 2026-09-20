import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import { randomBytes,randomUUID } from "node:crypto";
import pg from "pg";

import {
  CommercialAdjustmentSourceError,
  CommercialAdjustmentSourceService,
} from "../../dist/core/index.js";
import { PostgresCommercialAdjustmentSourceStore } from "../../dist/server/commercial/postgres-commercial-adjustment-source-store.js";
import { PostgresCommercialTransitionCompilerDatabase } from "../../dist/server/database/postgres-commercial-transition-compiler-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);
const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const loginRole="sbg_adjustment_source_"+randomBytes(8).toString("hex");
const password=randomBytes(24).toString("hex");

const f=Object.fromEntries([
  "home","tenantA","tenantB","industryA","industryB","actor","route",
  "oldPlan","oldPlanVersion","targetPlan","targetPlanVersion",
  "subscriptionA","subscriptionB","addOn","tenantAddOnActive","tenantAddOnExpired",
  "definition","overrideActive","overrideExpired","overrideSibling",
].map(key=>[key,randomUUID()]));

let pool,store,service,database;
function context(){
  return Object.freeze({
    requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenantA,
    dataHomeId:f.home,regionCode:"IN-ADJUSTMENT-SOURCE",
    principalId:f.actor,principalType:"SERVICE",
    orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"TENANT_CORE",
  });
}

before(async()=>{
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query("CREATE ROLE "+loginRole+" LOGIN PASSWORD '"+password+"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS");
    await c.query("GRANT sbg_commercial_transition_compiler_rw TO "+loginRole);

    await c.query(
      "INSERT INTO platform_directory.data_home(id,code,region_code,jurisdiction_code,topology_class,status)"+
      " VALUES ($1::uuid,$1::uuid::text,'IN-ADJUSTMENT-SOURCE','IN','SHARED','ACTIVE')",
      [f.home],
    );

    for(const [tenant,industry,code] of [
      [f.tenantA,f.industryA,"RTL"],
      [f.tenantB,f.industryB,"EDU"],
    ]){
      await c.query(
        "INSERT INTO core_tenancy.tenant("+
        "id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at"+
        ") VALUES ($1::uuid,$1::uuid::text,'Adjustment fixture','Adjustment fixture','PROVISIONING',$3,$2::uuid,'IN-ADJUSTMENT-SOURCE',now(),now())",
        [tenant,f.home,code],
      );
      await c.query(
        "INSERT INTO core_tenancy.industry_context("+
        "id,tenant_id,industry_code,status,is_primary,activated_at,created_at,updated_at"+
        ") VALUES ($1::uuid,$2::uuid,$3,'ACTIVE',true,now(),now(),now())",
        [industry,tenant,code],
      );
      await c.query(
        "UPDATE core_tenancy.tenant SET status='ACTIVE',updated_at=now() WHERE id=$1::uuid",
        [tenant],
      );
    }

    await c.query(
      "INSERT INTO core_identity.platform_principal("+
      "id,principal_type,status,display_name,service_code,owning_module,allowed_scope_classes,created_at,updated_at"+
      ") VALUES ($1::uuid,'SERVICE','ACTIVE','Adjustment source service','COMMERCIAL_ADJUSTMENT_SOURCE','Commercial',ARRAY['TENANT_CORE'],now(),now())",
      [f.actor],
    );
    await c.query(
      "INSERT INTO core_commercial.commercial_route_policy("+
      "id,code,self_serve_enabled,sales_assisted_enabled,market_scope_json,approval_required,version,status,created_at"+
      ") VALUES ($1::uuid,$1::uuid::text,true,true,'{}',false,1,'ACTIVE',now())",
      [f.route],
    );

    for(const [plan,version,name] of [
      [f.oldPlan,f.oldPlanVersion,"Old"],
      [f.targetPlan,f.targetPlanVersion,"Target"],
    ]){
      await c.query(
        "INSERT INTO core_commercial.plan(id,code,name,status,created_at,updated_at)"+
        " VALUES ($1::uuid,$1::uuid::text,$2,'ACTIVE',now(),now())",
        [plan,name],
      );
      await c.query(
        "INSERT INTO core_commercial.plan_version("+
        "id,plan_id,version_no,status,effective_from,route_policy_id,entitlement_template_json,limit_set_json,"+
        "trial_policy_json,billing_policy_json,support_class,published_at,created_by,created_at"+
        ") VALUES ($1::uuid,$2::uuid,1,'ACTIVE',now()-interval '1 day',$3::uuid,"+
        "'{\"schemaVersion\":1,\"facts\":[]}'::jsonb,'{\"schemaVersion\":1,\"limits\":[]}'::jsonb,"+
        "'{\"trial\":\"opaque\"}'::jsonb,'{\"addOnRules\":\"opaque\"}'::jsonb,'TEST',now(),$4::uuid,now())",
        [version,plan,f.route,f.actor],
      );
    }

    await c.query(
      "INSERT INTO core_commercial.subscription("+
      "id,tenant_id,plan_version_id,state,billing_timezone,version,created_at,updated_at"+
      ") VALUES ($1::uuid,$2::uuid,$3::uuid,'ACTIVE','UTC',4,now(),now())",
      [f.subscriptionA,f.tenantA,f.oldPlanVersion],
    );
    await c.query(
      "INSERT INTO core_commercial.subscription("+
      "id,tenant_id,plan_version_id,state,billing_timezone,version,created_at,updated_at"+
      ") VALUES ($1::uuid,$2::uuid,$3::uuid,'ACTIVE','UTC',1,now(),now())",
      [f.subscriptionB,f.tenantB,f.oldPlanVersion],
    );
    await c.query(
      "UPDATE core_tenancy.tenant SET current_subscription_id=$2::uuid WHERE id=$1::uuid",
      [f.tenantA,f.subscriptionA],
    );
    await c.query(
      "UPDATE core_tenancy.tenant SET current_subscription_id=$2::uuid WHERE id=$1::uuid",
      [f.tenantB,f.subscriptionB],
    );

    await c.query(
      "INSERT INTO core_commercial.add_on("+
      "id,code,entitlement_delta_json,eligibility_json,status,version"+
      ") VALUES ($1::uuid,'storage.pack',"+
      "'{\"schemaVersion\":1,\"quotaDeltas\":[{\"entitlementCode\":\"storage.gb\",\"meterCode\":\"storage.gb\",\"scope\":{\"kind\":\"TENANT\"},\"valueType\":\"DECIMAL\",\"amount\":25}]}'::jsonb,"+
      "'{\"opaquePolicy\":\"server-owned\"}'::jsonb,'ACTIVE',2)",
      [f.addOn],
    );
    await c.query(
      "INSERT INTO core_commercial.tenant_add_on("+
      "id,tenant_id,add_on_id,subscription_id,status,quantity,effective_from,effective_to,version"+
      ") VALUES "+
      "($1::uuid,$3::uuid,$4::uuid,$5::uuid,'ACTIVE',2,now()-interval '1 hour',NULL,3),"+
      "($2::uuid,$3::uuid,$4::uuid,$5::uuid,'ACTIVE',5,now()-interval '2 days',now()-interval '1 day',1)",
      [f.tenantAddOnActive,f.tenantAddOnExpired,f.tenantA,f.addOn,f.subscriptionA],
    );

    await c.query(
      "INSERT INTO core_commercial.entitlement_definition("+
      "id,code,category,value_type,scope_class,description,deny_semantics,version,status"+
      ") VALUES ($1::uuid,'feature.a','FEATURE','BOOLEAN','TENANT_CORE','fixture','DENY_WINS',1,'ACTIVE')",
      [f.definition],
    );

    await c.query(
      "INSERT INTO core_commercial.tenant_override("+
      "id,tenant_id,industry_context_id,entitlement_code,override_type,value_json,reason_code,approved_by,effective_from,expires_at,status,created_at"+
      ") VALUES "+
      "($1::uuid,$4::uuid,NULL,'feature.a','DENY','true'::jsonb,'ACTIVE_FIXTURE',$7::uuid,now()-interval '1 hour',NULL,'ACTIVE',now()),"+
      "($2::uuid,$4::uuid,NULL,'feature.a','ALLOW','true'::jsonb,'EXPIRED_FIXTURE',$7::uuid,now()-interval '2 days',now()-interval '1 day','ACTIVE',now()),"+
      "($3::uuid,$5::uuid,$6::uuid,'feature.a','ALLOW','true'::jsonb,'SIBLING_FIXTURE',$7::uuid,now()-interval '1 hour',NULL,'ACTIVE',now())",
      [
        f.overrideActive,f.overrideExpired,f.overrideSibling,
        f.tenantA,f.tenantB,f.industryB,f.actor,
      ],
    );

    await c.query("COMMIT");
  }catch(error){
    await c.query("ROLLBACK");
    throw error;
  }finally{c.release();}

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username=loginRole;
  url.password=password;
  pool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:5000});
  database=new PostgresCommercialTransitionCompilerDatabase(pool);
  const sql=new RequestScopedSql(database,{
    dataHomeId:f.home,regionCode:"IN-ADJUSTMENT-SOURCE",
  });
  store=new PostgresCommercialAdjustmentSourceStore(sql);
  service=new CommercialAdjustmentSourceService({
    store,
    eligibility:{
      async evaluate(input){
        assert.equal(input.addOn.eligibilityDocument.opaquePolicy,"server-owned");
        assert.equal(input.targetPlanPolicies.billingPolicy.addOnRules,"opaque");
        return {
          status:"ELIGIBLE",
          policyVersion:"fixture-policy-v1",
          evidenceReference:"fixture:eligibility:1",
        };
      },
    },
  });
});

after(async()=>{
  if(pool) await pool.end();
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query("DELETE FROM core_commercial.tenant_override WHERE id=ANY($1::uuid[])",[[
      f.overrideActive,f.overrideExpired,f.overrideSibling,
    ]]);
    await c.query("DELETE FROM core_commercial.entitlement_definition WHERE id=$1::uuid",[f.definition]);
    await c.query("DELETE FROM core_commercial.tenant_add_on WHERE id=ANY($1::uuid[])",[[
      f.tenantAddOnActive,f.tenantAddOnExpired,
    ]]);
    await c.query("DELETE FROM core_commercial.add_on WHERE id=$1::uuid",[f.addOn]);
    await c.query("UPDATE core_tenancy.tenant SET current_subscription_id=NULL WHERE id=ANY($1::uuid[])",[[
      f.tenantA,f.tenantB,
    ]]);
    await c.query("DELETE FROM core_commercial.subscription WHERE id=ANY($1::uuid[])",[[
      f.subscriptionA,f.subscriptionB,
    ]]);
    await c.query("DELETE FROM core_commercial.plan_version WHERE id=ANY($1::uuid[])",[[
      f.oldPlanVersion,f.targetPlanVersion,
    ]]);
    await c.query("DELETE FROM core_commercial.plan WHERE id=ANY($1::uuid[])",[[
      f.oldPlan,f.targetPlan,
    ]]);
    await c.query("DELETE FROM core_commercial.commercial_route_policy WHERE id=$1::uuid",[f.route]);
    await c.query("DELETE FROM core_identity.platform_principal WHERE id=$1::uuid",[f.actor]);
    await c.query("DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",[[
      f.industryA,f.industryB,
    ]]);
    await c.query("DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",[[
      f.tenantA,f.tenantB,
    ]]);
    await c.query("DELETE FROM platform_directory.data_home WHERE id=$1::uuid",[f.home]);
    await c.query("DROP ROLE IF EXISTS "+loginRole);
    await c.query("COMMIT");
  }catch(error){
    await c.query("ROLLBACK");
    throw error;
  }finally{c.release();await admin.end();}
});

test("adjustment source store reads only effective current-Tenant rows and preserves opaque eligibility for resolver",async()=>{
  const effectiveAt=new Date();
  const raw=await store.load({
    requestContext:context(),
    subscriptionId:f.subscriptionA,
    expectedSubscriptionVersion:4,
    expectedSourcePlanVersionId:f.oldPlanVersion,
    targetPlanVersionId:f.targetPlanVersion,
    effectiveAt,
  });
  assert.equal(raw.addOns.length,1);
  assert.equal(raw.addOns[0].tenantAddOnId,f.tenantAddOnActive);
  assert.equal(raw.addOns[0].tenantAddOnVersion,3);
  assert.equal(raw.addOns[0].quantity,2);
  assert.deepEqual(raw.addOns[0].eligibilityDocument,{opaquePolicy:"server-owned"});
  assert.deepEqual(raw.targetPlanPolicies.billingPolicy,{addOnRules:"opaque"});
  assert.equal(raw.overrides.length,1);
  assert.equal(raw.overrides[0].id,f.overrideActive);
  assert.equal(raw.overrides[0].overrideType,"DENY");

  const prepared=await service.prepare({
    requestContext:context(),
    subscriptionId:f.subscriptionA,
    expectedSubscriptionVersion:4,
    expectedSourcePlanVersionId:f.oldPlanVersion,
    targetPlanVersionId:f.targetPlanVersion,
    effectiveAt,
  });
  assert.equal(prepared.eligibleAddOns.length,1);
  assert.equal(prepared.ineligibleAddOns.length,0);
  assert.deepEqual(prepared.eligibleAddOns[0].quotaDeltas.map(x=>x.amount),[50]);
  assert.equal(prepared.overrides.length,1);
  assert.equal(prepared.overrides[0].representation,"TENANT_DENY_SET");
});

test("adjustment source store fails closed on stale Subscription version or removed current pointer",async()=>{
  const input={
    requestContext:context(),
    subscriptionId:f.subscriptionA,
    expectedSubscriptionVersion:3,
    expectedSourcePlanVersionId:f.oldPlanVersion,
    targetPlanVersionId:f.targetPlanVersion,
    effectiveAt:new Date(),
  };
  await assert.rejects(
    store.load(input),
    error=>error instanceof CommercialAdjustmentSourceError
      && error.code==="COMMERCIAL_ADJUSTMENT_SOURCE_STALE",
  );

  await admin.query(
    "UPDATE core_tenancy.tenant SET current_subscription_id=NULL WHERE id=$1::uuid",
    [f.tenantA],
  );
  try{
    await assert.rejects(
      store.load({...input,expectedSubscriptionVersion:4}),
      error=>error instanceof CommercialAdjustmentSourceError
        && error.code==="COMMERCIAL_ADJUSTMENT_SOURCE_STALE",
    );
  }finally{
    await admin.query(
      "UPDATE core_tenancy.tenant SET current_subscription_id=$2::uuid WHERE id=$1::uuid",
      [f.tenantA,f.subscriptionA],
    );
  }
});
