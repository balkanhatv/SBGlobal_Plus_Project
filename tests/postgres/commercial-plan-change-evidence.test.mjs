import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import {
  PlanChangeEvidenceError,
  PlanChangeEvidenceService,
} from "../../dist/core/index.js";
import {
  PostgresBillingPlanChangeEvidenceDatabase,
  PostgresCommercialPlanChangeEvidenceDatabase,
  PostgresWorkflowPlanChangeEvidenceDatabase,
} from "../../dist/server/database/postgres-plan-change-evidence-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresPlanChangeAssessmentStore,
  PostgresPlanChangeResolutionStore,
} from "../../dist/server/commercial/postgres-plan-change-evidence-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);
const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const loginRole="sbg_plan_evidence_"+randomBytes(8).toString("hex");
const password=randomBytes(24).toString("hex");
const f=Object.fromEntries([
  "home","tenant","industry","actor","route","oldPlan","oldPlanVersion","newPlan","newPlanVersion","subscription",
].map(key=>[key,randomUUID()]));

let pool,service,commercialSql,billingSql;
function context(){
  return Object.freeze({
    requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenant,
    dataHomeId:f.home,regionCode:"IN-PLAN-EVIDENCE",
    principalId:f.actor,principalType:"SERVICE",
    orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"TENANT_CORE",
  });
}
function assessmentInput(overrides={}){
  return {
    requestContext:context(),
    assessmentVersion:1,
    subscriptionId:f.subscription,
    sourcePlanVersionId:f.oldPlanVersion,
    targetPlanVersionId:f.newPlanVersion,
    effectiveTiming:"IMMEDIATE",
    expectedSubscriptionVersion:4,
    routeClass:"SELF_SERVE",
    routePolicyId:f.route,
    routePolicyVersion:1,
    impactReference:"impact:server:1",
    entitlementDiffReference:"entitlement-diff:server:1",
    blockingImpactCodes:[],
    remediationState:"NOT_REQUIRED",
    sourceFingerprint:"plan-change-evidence-postgres-fingerprint-v1",
    ...overrides,
  };
}

before(async()=>{
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query("CREATE ROLE "+loginRole+" LOGIN PASSWORD '"+password+"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS");
    await c.query("GRANT sbg_commercial_plan_change_evidence_rw,sbg_billing_plan_change_evidence_rw,sbg_workflow_worker_rw TO "+loginRole);
    await c.query("INSERT INTO platform_directory.data_home(id,code,region_code,jurisdiction_code,topology_class,status) VALUES ($1::uuid,$1::uuid::text,'IN-PLAN-EVIDENCE','IN','SHARED','ACTIVE')",[f.home]);
    await c.query("INSERT INTO core_tenancy.tenant(id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at) VALUES ($1::uuid,$1::uuid::text,'Evidence fixture','Evidence fixture','PROVISIONING','RTL',$2::uuid,'IN-PLAN-EVIDENCE',now(),now())",[f.tenant,f.home]);
    await c.query("INSERT INTO core_tenancy.industry_context(id,tenant_id,industry_code,status,is_primary,activated_at,created_at,updated_at) VALUES ($1::uuid,$2::uuid,'RTL','ACTIVE',true,now(),now(),now())",[f.industry,f.tenant]);
    await c.query("UPDATE core_tenancy.tenant SET status='ACTIVE',updated_at=now() WHERE id=$1::uuid",[f.tenant]);
    await c.query("INSERT INTO core_identity.platform_principal(id,principal_type,status,display_name,service_code,owning_module,allowed_scope_classes,created_at,updated_at) VALUES ($1::uuid,'SERVICE','ACTIVE','Plan evidence service','PLAN_EVIDENCE','Commercial',ARRAY['TENANT_CORE'],now(),now())",[f.actor]);
    await c.query("INSERT INTO core_commercial.commercial_route_policy(id,code,self_serve_enabled,sales_assisted_enabled,market_scope_json,approval_required,version,status,created_at) VALUES ($1::uuid,$1::uuid::text,true,true,'{}',false,1,'ACTIVE',now())",[f.route]);
    for(const [plan,version,name] of [[f.oldPlan,f.oldPlanVersion,"Old"],[f.newPlan,f.newPlanVersion,"New"]]){
      await c.query("INSERT INTO core_commercial.plan(id,code,name,status,created_at,updated_at) VALUES ($1::uuid,$1::uuid::text,$2,'ACTIVE',now(),now())",[plan,name]);
      await c.query("INSERT INTO core_commercial.plan_version(id,plan_id,version_no,status,effective_from,route_policy_id,entitlement_template_json,limit_set_json,billing_policy_json,support_class,published_at,created_by,created_at) VALUES ($1::uuid,$2::uuid,1,'ACTIVE',now()-interval '1 day',$3::uuid,'{}','{}','{}','TEST',now(),$4::uuid,now())",[version,plan,f.route,f.actor]);
    }
    await c.query("INSERT INTO core_commercial.subscription(id,tenant_id,plan_version_id,state,billing_timezone,version,created_at,updated_at) VALUES ($1::uuid,$2::uuid,$3::uuid,'ACTIVE','UTC',4,now(),now())",[f.subscription,f.tenant,f.oldPlanVersion]);
    await c.query("UPDATE core_tenancy.tenant SET current_subscription_id=$2::uuid WHERE id=$1::uuid",[f.tenant,f.subscription]);
    await c.query("COMMIT");
  }catch(error){await c.query("ROLLBACK");throw error;}finally{c.release();}

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username=loginRole; url.password=password;
  pool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:5000});

  commercialSql=new RequestScopedSql(
    new PostgresCommercialPlanChangeEvidenceDatabase(pool),
    {dataHomeId:f.home,regionCode:"IN-PLAN-EVIDENCE"},
  );
  billingSql=new RequestScopedSql(
    new PostgresBillingPlanChangeEvidenceDatabase(pool),
    {dataHomeId:f.home,regionCode:"IN-PLAN-EVIDENCE"},
  );
  const workflowSql=new RequestScopedSql(
    new PostgresWorkflowPlanChangeEvidenceDatabase(pool),
    {dataHomeId:f.home,regionCode:"IN-PLAN-EVIDENCE"},
  );
  const commercialStore=new PostgresPlanChangeAssessmentStore(commercialSql);
  service=new PlanChangeEvidenceService({
    assessmentStore:commercialStore,
    remediationStore:commercialStore,
    billingResolutionStore:new PostgresPlanChangeResolutionStore(billingSql),
    workflowResolutionStore:new PostgresPlanChangeResolutionStore(workflowSql),
    ids:{nextId:randomUUID},
    runtime:{now(){return new Date();}},
  });
});

after(async()=>{
  if(pool) await pool.end();
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query("DELETE FROM core_commercial.plan_change_route_resolution WHERE tenant_id=$1::uuid",[f.tenant]);
    await c.query("DELETE FROM core_commercial.plan_change_remediation_evidence WHERE tenant_id=$1::uuid",[f.tenant]);
    await c.query("DELETE FROM core_commercial.plan_change_assessment WHERE tenant_id=$1::uuid",[f.tenant]);
    await c.query("UPDATE core_tenancy.tenant SET current_subscription_id=NULL WHERE id=$1::uuid",[f.tenant]);
    await c.query("DELETE FROM core_commercial.subscription WHERE tenant_id=$1::uuid",[f.tenant]);
    await c.query("DELETE FROM core_commercial.plan_version WHERE id=ANY($1::uuid[])",[[f.oldPlanVersion,f.newPlanVersion]]);
    await c.query("DELETE FROM core_commercial.plan WHERE id=ANY($1::uuid[])",[[f.oldPlan,f.newPlan]]);
    await c.query("DELETE FROM core_commercial.commercial_route_policy WHERE id=$1::uuid",[f.route]);
    await c.query("DELETE FROM core_identity.platform_principal WHERE id=$1::uuid",[f.actor]);
    await c.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id=$1::uuid",[f.tenant]);
    await c.query("DELETE FROM core_tenancy.tenant WHERE id=$1::uuid",[f.tenant]);
    await c.query("DELETE FROM platform_directory.data_home WHERE id=$1::uuid",[f.home]);
    await c.query("DROP ROLE IF EXISTS "+loginRole);
    await c.query("COMMIT");
  }catch(error){await c.query("ROLLBACK");throw error;}finally{c.release();await admin.end();}
});

test("Commercial evidence versions remediation and route resolution through fixed producer roles",async()=>{
  const renewal=await service.recordAssessment(assessmentInput({
    effectiveTiming:"NEXT_RENEWAL",
    routeClass:"SELF_SERVE",
  }));
  await service.recordSelfServeResolution({
    requestContext:context(),assessmentId:renewal.assessmentId,assessmentVersion:1,
    evidenceVersion:1,resolutionState:"PENDING",
  });
  const effectiveAt=new Date(Date.now()+60*60*1000);
  await service.recordSelfServeResolution({
    requestContext:context(),assessmentId:renewal.assessmentId,assessmentVersion:1,
    evidenceVersion:2,resolutionState:"SATISFIED",
    evidenceReference:"billing:verified:1",
    billingPreviewReference:"billing:preview:opaque:1",
    effectiveAt,
  });

  const downgrade=await service.recordAssessment(assessmentInput({
    routeClass:"SALES_ASSISTED",
    blockingImpactCodes:["SEAT_LIMIT"],
    remediationState:"PENDING",
    impactReference:"impact:downgrade:1",
  }));
  await service.recordRemediationSatisfied({
    requestContext:context(),assessmentId:downgrade.assessmentId,assessmentVersion:1,
    evidenceVersion:1,evidenceReference:"commercial:remediation-check:1",
  });
  const reassessed=await service.recordAssessment(assessmentInput({
    assessmentId:downgrade.assessmentId,
    assessmentVersion:2,
    routeClass:"SALES_ASSISTED",
    blockingImpactCodes:[],
    remediationState:"SATISFIED",
    impactReference:"impact:downgrade:2",
    entitlementDiffReference:"entitlement-diff:downgrade:2",
  }));
  assert.equal(reassessed.assessmentVersion,2);
  await service.recordSalesAssistedResolution({
    requestContext:context(),assessmentId:reassessed.assessmentId,assessmentVersion:2,
    evidenceVersion:1,resolutionState:"SATISFIED",
    evidenceReference:"workflow:approval:1",
  });

  const rows=await admin.query(
    "SELECT assessment_id::text,assessment_version,route_class::text,remediation_state::text"+
    " FROM core_commercial.plan_change_assessment WHERE tenant_id=$1::uuid"+
    " ORDER BY assessment_id,assessment_version",
    [f.tenant],
  );
  assert.equal(rows.rowCount,3);

  const billing=await admin.query(
    "SELECT evidence_version,resolution_state::text,producer_module,effective_at"+
    " FROM core_commercial.plan_change_route_resolution"+
    " WHERE tenant_id=$1::uuid AND assessment_id=$2::uuid ORDER BY evidence_version",
    [f.tenant,renewal.assessmentId],
  );
  assert.deepEqual(billing.rows.map(r=>[r.evidence_version,r.resolution_state,r.producer_module]),[
    [1,"PENDING","Billing"],[2,"SATISFIED","Billing"],
  ]);
  assert.ok(billing.rows[1].effective_at);

  const workflow=await admin.query(
    "SELECT producer_module,resolution_state::text FROM core_commercial.plan_change_route_resolution"+
    " WHERE tenant_id=$1::uuid AND assessment_id=$2::uuid AND assessment_version=2",
    [f.tenant,downgrade.assessmentId],
  );
  assert.deepEqual(workflow.rows,[{producer_module:"Workflow",resolution_state:"SATISFIED"}]);
});

test("wrong producer, stale Subscription and mutation attempts fail closed",async()=>{
  const sales=await service.recordAssessment(assessmentInput({routeClass:"SALES_ASSISTED"}));
  await assert.rejects(
    billingSql.withContext(context(),tx=>tx.query(
      "INSERT INTO core_commercial.plan_change_route_resolution("+
      "id,tenant_id,assessment_id,assessment_version,route_class,resolution_state,"+
      "evidence_reference,producer_module,evidence_version,resolved_at,correlation_id,created_at)"+
      " VALUES ($1::uuid,$2::uuid,$3::uuid,1,'SALES_ASSISTED','SATISFIED',"+
      "'forbidden:billing','Workflow',1,now(),$4::uuid,now())",
      [randomUUID(),f.tenant,sales.assessmentId,randomUUID()],
    )),
    error=>error.code==="DATABASE_QUERY_FAILED",
  );

  await assert.rejects(
    service.recordAssessment(assessmentInput({expectedSubscriptionVersion:3})),
    error=>error instanceof PlanChangeEvidenceError
      && error.code==="PLAN_CHANGE_EVIDENCE_STATE_UNAVAILABLE",
  );

  await assert.rejects(
    commercialSql.withContext(context(),tx=>tx.query(
      "UPDATE core_commercial.plan_change_assessment SET impact_reference='tampered'"+
      " WHERE tenant_id=$1::uuid AND assessment_id=$2::uuid",
      [f.tenant,sales.assessmentId],
    )),
    error=>error.code==="DATABASE_QUERY_FAILED",
  );
});
