import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import {
  CommercialApplyEvidenceGateError,
  CommercialApplyEvidenceGateService,
  PlanChangeEvidenceService,
} from "../../dist/core/index.js";
import { PostgresCommercialTransitionCompilerDatabase } from "../../dist/server/database/postgres-commercial-transition-compiler-database.js";
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
import { PostgresCommercialApplyEvidenceStore } from "../../dist/server/commercial/postgres-commercial-apply-evidence-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);
const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const loginRole="sbg_apply_gate_"+randomBytes(8).toString("hex");
const password=randomBytes(24).toString("hex");
const f=Object.fromEntries([
  "home","tenant","actor","route","oldPlan","oldPlanVersion","newPlan","newPlanVersion","subscription",
].map(k=>[k,randomUUID()]));

let pool,evidenceService,gate,clock;
function context(){
  return Object.freeze({
    requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenant,
    dataHomeId:f.home,regionCode:"IN-APPLY-GATE",principalId:f.actor,principalType:"SERVICE",
    orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"TENANT_CORE",
  });
}
function assessmentInput(overrides={}){
  return {
    requestContext:context(),assessmentVersion:1,subscriptionId:f.subscription,
    sourcePlanVersionId:f.oldPlanVersion,targetPlanVersionId:f.newPlanVersion,
    effectiveTiming:"IMMEDIATE",expectedSubscriptionVersion:4,routeClass:"SELF_SERVE",
    routePolicyId:f.route,routePolicyVersion:1,impactReference:"impact:pg:1",
    entitlementDiffReference:"diff:pg:1",blockingImpactCodes:[],remediationState:"NOT_REQUIRED",
    sourceFingerprint:"commercial-apply-evidence-postgres-v1",...overrides,
  };
}
function gateInput(a,overrides={}){
  return {
    requestContext:context(),assessmentId:a.assessmentId,assessmentVersion:a.assessmentVersion,
    subscriptionId:f.subscription,expectedSubscriptionVersion:4,
    sourcePlanVersionId:f.oldPlanVersion,targetPlanVersionId:f.newPlanVersion,
    sourceFingerprint:"commercial-apply-evidence-postgres-v1",...overrides,
  };
}

before(async()=>{
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query("CREATE ROLE "+loginRole+" LOGIN PASSWORD '"+password+"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS");
    await c.query("GRANT sbg_commercial_transition_compiler_rw,sbg_commercial_plan_change_evidence_rw,sbg_billing_plan_change_evidence_rw,sbg_workflow_worker_rw TO "+loginRole);
    await c.query("INSERT INTO platform_directory.data_home(id,code,region_code,jurisdiction_code,topology_class,status) VALUES ($1,$1::text,'IN-APPLY-GATE','IN','SHARED','ACTIVE')",[f.home]);
    await c.query("INSERT INTO core_tenancy.tenant(id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at) VALUES ($1,$1::text,'Apply gate','Apply gate','ACTIVE','RTL',$2,'IN-APPLY-GATE',now(),now())",[f.tenant,f.home]);
    await c.query("INSERT INTO core_identity.platform_principal(id,principal_type,status,display_name,service_code,owning_module,allowed_scope_classes,created_at,updated_at) VALUES ($1,'SERVICE','ACTIVE','Apply gate service','APPLY_GATE','Commercial',ARRAY['TENANT_CORE'],now(),now())",[f.actor]);
    await c.query("INSERT INTO core_commercial.commercial_route_policy(id,code,self_serve_enabled,sales_assisted_enabled,market_scope_json,approval_required,version,status,created_at) VALUES ($1,$1::text,true,true,'{}',false,1,'ACTIVE',now())",[f.route]);
    for(const [plan,version,name] of [[f.oldPlan,f.oldPlanVersion,"Old"],[f.newPlan,f.newPlanVersion,"New"]]){
      await c.query("INSERT INTO core_commercial.plan(id,code,name,status,created_at,updated_at) VALUES ($1,$1::text,$2,'ACTIVE',now(),now())",[plan,name]);
      await c.query("INSERT INTO core_commercial.plan_version(id,plan_id,version_no,status,effective_from,route_policy_id,entitlement_template_json,limit_set_json,billing_policy_json,support_class,published_at,created_by,created_at) VALUES ($1,$2,1,'ACTIVE',now()-interval '1 day',$3,'{}','{}','{}','TEST',now(),$4,now())",[version,plan,f.route,f.actor]);
    }
    await c.query("INSERT INTO core_commercial.subscription(id,tenant_id,plan_version_id,state,billing_timezone,version,created_at,updated_at) VALUES ($1,$2,$3,'ACTIVE','UTC',4,now(),now())",[f.subscription,f.tenant,f.oldPlanVersion]);
    await c.query("UPDATE core_tenancy.tenant SET current_subscription_id=$2 WHERE id=$1",[f.tenant,f.subscription]);
    await c.query("COMMIT");
  }catch(e){await c.query("ROLLBACK");throw e;}finally{c.release();}

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username=loginRole;url.password=password;
  pool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:5000});

  const commercialSql=new RequestScopedSql(
    new PostgresCommercialPlanChangeEvidenceDatabase(pool),
    {dataHomeId:f.home,regionCode:"IN-APPLY-GATE"},
  );
  const billingSql=new RequestScopedSql(
    new PostgresBillingPlanChangeEvidenceDatabase(pool),
    {dataHomeId:f.home,regionCode:"IN-APPLY-GATE"},
  );
  const workflowSql=new RequestScopedSql(
    new PostgresWorkflowPlanChangeEvidenceDatabase(pool),
    {dataHomeId:f.home,regionCode:"IN-APPLY-GATE"},
  );
  const commercialStore=new PostgresPlanChangeAssessmentStore(commercialSql);
  evidenceService=new PlanChangeEvidenceService({
    assessmentStore:commercialStore,remediationStore:commercialStore,
    billingResolutionStore:new PostgresPlanChangeResolutionStore(billingSql),
    workflowResolutionStore:new PostgresPlanChangeResolutionStore(workflowSql),
    ids:{nextId:randomUUID},runtime:{now(){return new Date();}},
  });

  const compilerSql=new RequestScopedSql(
    new PostgresCommercialTransitionCompilerDatabase(pool),
    {dataHomeId:f.home,regionCode:"IN-APPLY-GATE"},
  );
  clock=new Date();
  gate=new CommercialApplyEvidenceGateService({
    store:new PostgresCommercialApplyEvidenceStore(compilerSql),
    runtime:{now(){return new Date(clock);}},
  });
});

after(async()=>{
  if(pool) await pool.end();
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query("DELETE FROM core_commercial.plan_change_route_resolution WHERE tenant_id=$1",[f.tenant]);
    await c.query("DELETE FROM core_commercial.plan_change_remediation_evidence WHERE tenant_id=$1",[f.tenant]);
    await c.query("DELETE FROM core_commercial.plan_change_assessment WHERE tenant_id=$1",[f.tenant]);
    await c.query("UPDATE core_tenancy.tenant SET current_subscription_id=NULL WHERE id=$1",[f.tenant]);
    await c.query("DELETE FROM core_commercial.subscription WHERE tenant_id=$1",[f.tenant]);
    await c.query("DELETE FROM core_commercial.plan_version WHERE id=ANY($1::uuid[])",[[f.oldPlanVersion,f.newPlanVersion]]);
    await c.query("DELETE FROM core_commercial.plan WHERE id=ANY($1::uuid[])",[[f.oldPlan,f.newPlan]]);
    await c.query("DELETE FROM core_commercial.commercial_route_policy WHERE id=$1",[f.route]);
    await c.query("DELETE FROM core_identity.platform_principal WHERE id=$1",[f.actor]);
    await c.query("DELETE FROM core_tenancy.tenant WHERE id=$1",[f.tenant]);
    await c.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
    await c.query("DROP ROLE IF EXISTS "+loginRole);
    await c.query("COMMIT");
  }catch(e){await c.query("ROLLBACK");throw e;}finally{c.release();await admin.end();}
});

test("compiler role reads current satisfied self-serve evidence and gate allows",async()=>{
  const a=await evidenceService.recordAssessment(assessmentInput());
  await evidenceService.recordSelfServeResolution({
    requestContext:context(),assessmentId:a.assessmentId,assessmentVersion:1,
    evidenceVersion:1,resolutionState:"SATISFIED",
    evidenceReference:"billing:paid:pg",billingPreviewReference:"billing:preview:pg",
  });
  const result=await gate.evaluate(gateInput(a));
  assert.equal(result.status,"ALLOW_APPLY_GATE");
  assert.equal(result.routeEvidenceReference,"billing:paid:pg");
});

test("latest pending or rejected route resolution blocks even after earlier SATISFIED evidence",async()=>{
  const a=await evidenceService.recordAssessment(assessmentInput());
  await evidenceService.recordSelfServeResolution({
    requestContext:context(),assessmentId:a.assessmentId,assessmentVersion:1,
    evidenceVersion:1,resolutionState:"SATISFIED",evidenceReference:"billing:first:ok",
  });
  await evidenceService.recordSelfServeResolution({
    requestContext:context(),assessmentId:a.assessmentId,assessmentVersion:1,
    evidenceVersion:2,resolutionState:"PENDING",
  });
  assert.equal((await gate.evaluate(gateInput(a))).status,"BLOCK_ROUTE_PENDING");
  await evidenceService.recordSelfServeResolution({
    requestContext:context(),assessmentId:a.assessmentId,assessmentVersion:1,
    evidenceVersion:3,resolutionState:"REJECTED",evidenceReference:"billing:rejected:latest",
  });
  assert.equal((await gate.evaluate(gateInput(a))).status,"BLOCK_ROUTE_REJECTED");
});

test("NEXT_RENEWAL is blocked until persisted server effectiveAt",async()=>{
  const a=await evidenceService.recordAssessment(assessmentInput({effectiveTiming:"NEXT_RENEWAL"}));
  const effectiveAt=new Date(Date.now()+60_000);
  await evidenceService.recordSelfServeResolution({
    requestContext:context(),assessmentId:a.assessmentId,assessmentVersion:1,
    evidenceVersion:1,resolutionState:"SATISFIED",evidenceReference:"billing:renewal:ok",effectiveAt,
  });
  clock=new Date(effectiveAt.getTime()-1_000);
  assert.equal((await gate.evaluate(gateInput(a))).status,"BLOCK_EFFECTIVE_TIME_PENDING");
  clock=new Date(effectiveAt.getTime()+1_000);
  assert.equal((await gate.evaluate(gateInput(a))).status,"ALLOW_APPLY_GATE");
});

test("remediation SATISFIED reassessment requires persisted prior Commercial evidence and latest assessment version",async()=>{
  const initial=await evidenceService.recordAssessment(assessmentInput({
    routeClass:"SALES_ASSISTED",blockingImpactCodes:["SEAT_LIMIT"],remediationState:"PENDING",
  }));
  await evidenceService.recordRemediationSatisfied({
    requestContext:context(),assessmentId:initial.assessmentId,assessmentVersion:1,
    evidenceVersion:1,evidenceReference:"commercial:remediated:pg",
  });
  const reassessed=await evidenceService.recordAssessment(assessmentInput({
    assessmentId:initial.assessmentId,assessmentVersion:2,routeClass:"SALES_ASSISTED",
    remediationState:"SATISFIED",blockingImpactCodes:[],
    impactReference:"impact:pg:2",entitlementDiffReference:"diff:pg:2",
  }));
  await evidenceService.recordSalesAssistedResolution({
    requestContext:context(),assessmentId:reassessed.assessmentId,assessmentVersion:2,
    evidenceVersion:1,resolutionState:"SATISFIED",evidenceReference:"workflow:approved:pg",
  });
  const result=await gate.evaluate(gateInput(reassessed,{assessmentVersion:2}));
  assert.equal(result.status,"ALLOW_APPLY_GATE");
  assert.equal(result.remediationEvidenceReference,"commercial:remediated:pg");

  await assert.rejects(
    ()=>gate.evaluate(gateInput(initial,{assessmentVersion:1})),
    e=>e instanceof CommercialApplyEvidenceGateError
      && e.code==="COMMERCIAL_APPLY_EVIDENCE_STATE_CONFLICT",
  );
});

test("stale Subscription/source binding and fingerprint mismatch fail closed",async()=>{
  const a=await evidenceService.recordAssessment(assessmentInput());
  await evidenceService.recordSelfServeResolution({
    requestContext:context(),assessmentId:a.assessmentId,assessmentVersion:1,
    evidenceVersion:1,resolutionState:"SATISFIED",evidenceReference:"billing:ok:stale-test",
  });
  await assert.rejects(
    ()=>gate.evaluate(gateInput(a,{sourceFingerprint:"another-fingerprint-value-123456"})),
    e=>e instanceof CommercialApplyEvidenceGateError
      && e.code==="COMMERCIAL_APPLY_EVIDENCE_STATE_CONFLICT",
  );

  await admin.query("UPDATE core_commercial.subscription SET version=5 WHERE id=$1",[f.subscription]);
  try{
    await assert.rejects(
      ()=>gate.evaluate(gateInput(a)),
      e=>e instanceof CommercialApplyEvidenceGateError
        && e.code==="COMMERCIAL_APPLY_EVIDENCE_STATE_CONFLICT",
    );
  }finally{
    await admin.query("UPDATE core_commercial.subscription SET version=4 WHERE id=$1",[f.subscription]);
  }
});
