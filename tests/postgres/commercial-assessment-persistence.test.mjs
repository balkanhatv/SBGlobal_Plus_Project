import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import {
  CommercialInitialAssessmentPersistenceService,
  PlanChangeEvidenceError,
  PlanChangeEvidenceService,
} from "../../dist/core/index.js";
import { PostgresCommercialPlanChangeEvidenceDatabase } from "../../dist/server/database/postgres-plan-change-evidence-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresPlanChangeAssessmentStore } from "../../dist/server/commercial/postgres-plan-change-evidence-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);
const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const loginRole="sbg_assess_persist_"+randomBytes(8).toString("hex");
const password=randomBytes(24).toString("hex");
const f=Object.fromEntries([
  "home","tenant","industry","actor","route","sourcePlan","sourceVersion",
  "targetPlan","targetVersion","subscription",
].map(key=>[key,randomUUID()]));

let pool,service;
function context(){
  return Object.freeze({
    requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenant,
    dataHomeId:f.home,regionCode:"IN-ASSESS-PERSIST",
    principalId:f.actor,principalType:"SERVICE",
    orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"TENANT_CORE",
  });
}
function prepared(overrides={}){
  return {
    assessmentVersion:1,
    subscriptionId:f.subscription,
    sourcePlanVersionId:f.sourceVersion,
    targetPlanVersionId:f.targetVersion,
    effectiveTiming:"IMMEDIATE",
    expectedSubscriptionVersion:4,
    routeClass:"SELF_SERVE",
    routePolicyId:f.route,
    routePolicyVersion:1,
    impactReference:"impact:postgres:1",
    entitlementDiffReference:"diff:postgres:1",
    blockingImpactCodes:[],
    remediationState:"NOT_REQUIRED",
    sourceFingerprint:"postgres-prepared-assessment-fingerprint-v1",
    ...overrides,
  };
}

before(async()=>{
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query("CREATE ROLE "+loginRole+" LOGIN PASSWORD '"+password+"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS");
    await c.query("GRANT sbg_commercial_plan_change_evidence_rw TO "+loginRole);
    await c.query(
      "INSERT INTO platform_directory.data_home(id,code,region_code,jurisdiction_code,topology_class,status)"+
      " VALUES ($1::uuid,$1::uuid::text,'IN-ASSESS-PERSIST','IN','SHARED','ACTIVE')",
      [f.home],
    );
    await c.query(
      "INSERT INTO core_tenancy.tenant(id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)"+
      " VALUES ($1::uuid,$1::uuid::text,'Assessment persistence','Assessment persistence','PROVISIONING','RTL',$2::uuid,'IN-ASSESS-PERSIST',now(),now())",
      [f.tenant,f.home],
    );
    await c.query(
      "INSERT INTO core_tenancy.industry_context(id,tenant_id,industry_code,status,is_primary,activated_at,created_at,updated_at)"+
      " VALUES ($1::uuid,$2::uuid,'RTL','ACTIVE',true,now(),now(),now())",
      [f.industry,f.tenant],
    );
    await c.query("UPDATE core_tenancy.tenant SET status='ACTIVE',updated_at=now() WHERE id=$1::uuid",[f.tenant]);
    await c.query(
      "INSERT INTO core_identity.platform_principal(id,principal_type,status,display_name,service_code,owning_module,allowed_scope_classes,created_at,updated_at)"+
      " VALUES ($1::uuid,'SERVICE','ACTIVE','Assessment persistence','ASSESS_PERSIST','Commercial',ARRAY['TENANT_CORE'],now(),now())",
      [f.actor],
    );
    await c.query(
      "INSERT INTO core_commercial.commercial_route_policy(id,code,self_serve_enabled,sales_assisted_enabled,market_scope_json,approval_required,version,status,created_at)"+
      " VALUES ($1::uuid,$1::uuid::text,true,false,'{}',false,1,'ACTIVE',now())",
      [f.route],
    );
    for(const [plan,version,name] of [
      [f.sourcePlan,f.sourceVersion,"Source"],
      [f.targetPlan,f.targetVersion,"Target"],
    ]){
      await c.query(
        "INSERT INTO core_commercial.plan(id,code,name,status,created_at,updated_at)"+
        " VALUES ($1::uuid,$1::uuid::text,$2,'ACTIVE',now(),now())",
        [plan,name],
      );
      await c.query(
        "INSERT INTO core_commercial.plan_version(id,plan_id,version_no,status,effective_from,route_policy_id,entitlement_template_json,limit_set_json,billing_policy_json,support_class,published_at,created_by,created_at)"+
        " VALUES ($1::uuid,$2::uuid,1,'ACTIVE',now()-interval '1 day',$3::uuid,'{}','{}','{}','TEST',now(),$4::uuid,now())",
        [version,plan,f.route,f.actor],
      );
    }
    await c.query(
      "INSERT INTO core_commercial.subscription(id,tenant_id,plan_version_id,state,billing_timezone,version,created_at,updated_at)"+
      " VALUES ($1::uuid,$2::uuid,$3::uuid,'ACTIVE','UTC',4,now(),now())",
      [f.subscription,f.tenant,f.sourceVersion],
    );
    await c.query(
      "UPDATE core_tenancy.tenant SET current_subscription_id=$2::uuid WHERE id=$1::uuid",
      [f.tenant,f.subscription],
    );
    await c.query("COMMIT");
  }catch(error){
    await c.query("ROLLBACK");
    throw error;
  }finally{c.release();}

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username=loginRole;url.password=password;
  pool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:5000});
  const sql=new RequestScopedSql(
    new PostgresCommercialPlanChangeEvidenceDatabase(pool),
    {dataHomeId:f.home,regionCode:"IN-ASSESS-PERSIST"},
  );
  const store=new PostgresPlanChangeAssessmentStore(sql);
  const evidence=new PlanChangeEvidenceService({
    assessmentStore:store,
    remediationStore:store,
    billingResolutionStore:{async recordResolution(){throw new Error("unused");}},
    workflowResolutionStore:{async recordResolution(){throw new Error("unused");}},
    ids:{nextId:randomUUID},
    runtime:{now(){return new Date();}},
  });
  service=new CommercialInitialAssessmentPersistenceService(evidence);
});

after(async()=>{
  if(pool) await pool.end();
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query("DELETE FROM core_commercial.plan_change_assessment WHERE tenant_id=$1::uuid",[f.tenant]);
    await c.query("UPDATE core_tenancy.tenant SET current_subscription_id=NULL WHERE id=$1::uuid",[f.tenant]);
    await c.query("DELETE FROM core_commercial.subscription WHERE tenant_id=$1::uuid",[f.tenant]);
    await c.query("DELETE FROM core_commercial.plan_version WHERE id=ANY($1::uuid[])",[[f.sourceVersion,f.targetVersion]]);
    await c.query("DELETE FROM core_commercial.plan WHERE id=ANY($1::uuid[])",[[f.sourcePlan,f.targetPlan]]);
    await c.query("DELETE FROM core_commercial.commercial_route_policy WHERE id=$1::uuid",[f.route]);
    await c.query("DELETE FROM core_identity.platform_principal WHERE id=$1::uuid",[f.actor]);
    await c.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id=$1::uuid",[f.tenant]);
    await c.query("DELETE FROM core_tenancy.tenant WHERE id=$1::uuid",[f.tenant]);
    await c.query("DELETE FROM platform_directory.data_home WHERE id=$1::uuid",[f.home]);
    await c.query("DROP ROLE IF EXISTS "+loginRole);
    await c.query("COMMIT");
  }catch(error){
    await c.query("ROLLBACK");
    throw error;
  }finally{c.release();await admin.end();}
});

test("DD-079 persists DD-076 prepared assessment through DD-066 producer boundary",async()=>{
  const c=context(),p=prepared();
  const record=await service.persist({requestContext:c,prepared:p});
  assert.match(record.assessmentId,/^[0-9a-f-]{36}$/);
  assert.equal(record.tenantId,f.tenant);
  assert.equal(record.correlationId,c.correlationId);

  const result=await admin.query(
    "SELECT assessment_version,tenant_id::text,subscription_id::text,source_plan_version_id::text,"+
    " target_plan_version_id::text,effective_timing::text,expected_subscription_version,"+
    " route_class::text,route_policy_id::text,route_policy_version,impact_reference,"+
    " entitlement_diff_reference,blocking_impact_codes,remediation_state::text,source_fingerprint,"+
    " correlation_id::text FROM core_commercial.plan_change_assessment"+
    " WHERE tenant_id=$1::uuid AND assessment_id=$2::uuid",
    [f.tenant,record.assessmentId],
  );
  assert.equal(result.rowCount,1);
  const row=result.rows[0];
  assert.equal(row.assessment_version,1);
  assert.equal(row.tenant_id,f.tenant);
  assert.equal(row.subscription_id,p.subscriptionId);
  assert.equal(row.source_plan_version_id,p.sourcePlanVersionId);
  assert.equal(row.target_plan_version_id,p.targetPlanVersionId);
  assert.equal(row.effective_timing,p.effectiveTiming);
  assert.equal(Number(row.expected_subscription_version),p.expectedSubscriptionVersion);
  assert.equal(row.route_class,p.routeClass);
  assert.equal(row.route_policy_id,p.routePolicyId);
  assert.equal(row.route_policy_version,p.routePolicyVersion);
  assert.equal(row.impact_reference,p.impactReference);
  assert.equal(row.entitlement_diff_reference,p.entitlementDiffReference);
  assert.deepEqual(row.blocking_impact_codes,[]);
  assert.equal(row.remediation_state,"NOT_REQUIRED");
  assert.equal(row.source_fingerprint,p.sourceFingerprint);
  assert.equal(row.correlation_id,c.correlationId);
});

test("DD-079 preserves DD-066 stale Subscription fail-closed behavior",async()=>{
  await assert.rejects(
    service.persist({requestContext:context(),prepared:prepared({expectedSubscriptionVersion:3})}),
    error=>error instanceof PlanChangeEvidenceError
      && error.code==="PLAN_CHANGE_EVIDENCE_STATE_UNAVAILABLE",
  );
});
