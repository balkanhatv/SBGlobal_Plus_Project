import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import {
  CommercialPublicationError,
  CommercialPublicationService,
} from "../../dist/core/index.js";
import { PostgresCommercialTransitionCompilerDatabase } from "../../dist/server/database/postgres-commercial-transition-compiler-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresCommercialPublicationStore } from "../../dist/server/commercial/postgres-commercial-publication-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);
const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const loginRole="sbg_commercial_publish_"+randomBytes(8).toString("hex");
const password=randomBytes(24).toString("hex");
const f=Object.fromEntries([
  "home","tenant","industry","actor","route","oldPlan","oldPlanVersion","newPlan","newPlanVersion",
  "subscription","oldSnapshot","definitionTenant","definitionIndustry","planChangeRequest",
].map(key=>[key,randomUUID()]));

let pool,service,database;

function context(){
  return Object.freeze({
    requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenant,
    dataHomeId:f.home,regionCode:"IN-COMMERCIAL-PUBLISH",
    principalId:f.actor,principalType:"SERVICE",
    entitlementSnapshotId:f.oldSnapshot,entitlementSnapshotVersion:7,
    orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"TENANT_CORE",
  });
}

before(async()=>{
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query("CREATE ROLE "+loginRole+" LOGIN PASSWORD '"+password+"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS");
    await c.query("GRANT sbg_commercial_transition_compiler_rw TO "+loginRole);
    await c.query("INSERT INTO platform_directory.data_home(id,code,region_code,jurisdiction_code,topology_class,status) VALUES ($1::uuid,$1::uuid::text,'IN-COMMERCIAL-PUBLISH','IN','SHARED','ACTIVE')",[f.home]);
    await c.query("INSERT INTO core_tenancy.tenant(id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at) VALUES ($1::uuid,$1::uuid::text,'Publish fixture','Publish fixture','ACTIVE','RTL',$2::uuid,'IN-COMMERCIAL-PUBLISH',now(),now())",[f.tenant,f.home]);
    await c.query("INSERT INTO core_tenancy.industry_context(id,tenant_id,industry_code,status,is_primary,created_at,updated_at) VALUES ($1,$2,'RTL','ACTIVE',true,now(),now())",[f.industry,f.tenant]);
    await c.query("INSERT INTO core_identity.platform_principal(id,principal_type,status,display_name,service_code,owning_module,allowed_scope_classes,created_at,updated_at) VALUES ($1,'SERVICE','ACTIVE','Commercial publisher','COMMERCIAL_PUBLISH','Commercial',ARRAY['TENANT_CORE'],now(),now())",[f.actor]);
    await c.query("INSERT INTO core_commercial.commercial_route_policy(id,code,self_serve_enabled,sales_assisted_enabled,market_scope_json,approval_required,version,status,created_at) VALUES ($1::uuid,$1::uuid::text,true,false,'{}',false,1,'ACTIVE',now())",[f.route]);
    for(const [plan,version,name] of [[f.oldPlan,f.oldPlanVersion,"Old"],[f.newPlan,f.newPlanVersion,"New"]]){
      await c.query("INSERT INTO core_commercial.plan(id,code,name,status,created_at,updated_at) VALUES ($1::uuid,$1::uuid::text,$2,'ACTIVE',now(),now())",[plan,name]);
      await c.query("INSERT INTO core_commercial.plan_version(id,plan_id,version_no,status,effective_from,route_policy_id,entitlement_template_json,limit_set_json,billing_policy_json,support_class,published_at,created_by,created_at) VALUES ($1,$2,1,'ACTIVE',now()-interval '1 day',$3,'{}','{}','{}','TEST',now(),$4,now())",[version,plan,f.route,f.actor]);
    }
    await c.query("INSERT INTO core_commercial.subscription(id,tenant_id,plan_version_id,state,billing_timezone,version,created_at,updated_at) VALUES ($1,$2,$3,'ACTIVE','UTC',4,now(),now())",[f.subscription,f.tenant,f.oldPlanVersion]);
    await c.query("UPDATE core_tenancy.tenant SET current_subscription_id=$2 WHERE id=$1",[f.tenant,f.subscription]);
    await c.query("INSERT INTO core_commercial.entitlement_definition(id,code,category,value_type,scope_class,description,deny_semantics,version,status) VALUES ($1,'tenant.feature','FEATURE','BOOLEAN','TENANT_CORE','tenant feature','DENY_WINS',1,'ACTIVE'),($2,'rtl.feature','FEATURE','SET','TENANT_INDUSTRY','rtl feature','DENY_WINS',1,'ACTIVE')",[f.definitionTenant,f.definitionIndustry]);
    await c.query("INSERT INTO core_commercial.entitlement_snapshot(id,tenant_id,version,source_subscription_id,source_plan_version_id,compiled_at,valid_from,source_fingerprint,status,deny_set_json,metadata_json) VALUES ($1,$2,7,$3,$4,now(),now()-interval '1 minute','old-commercial-snapshot','CURRENT','[]','{}')",[f.oldSnapshot,f.tenant,f.subscription,f.oldPlanVersion]);
    await c.query("COMMIT");
  }catch(error){
    await c.query("ROLLBACK");
    throw error;
  }finally{c.release();}

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username=loginRole; url.password=password;
  pool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:5000});
  database=new PostgresCommercialTransitionCompilerDatabase(pool);
  const scoped=new RequestScopedSql(database,{dataHomeId:f.home,regionCode:"IN-COMMERCIAL-PUBLISH"});
  service=new CommercialPublicationService({
    store:new PostgresCommercialPublicationStore(scoped),
    ids:{nextId:randomUUID},
    runtime:{now(){return new Date();}},
  });
});

after(async()=>{
  if(pool) await pool.end();
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query("DELETE FROM core_audit.audit_event WHERE tenant_id=$1",[f.tenant]);
    await c.query("DELETE FROM core_audit.audit_event_identity WHERE id NOT IN (SELECT id FROM core_audit.audit_event)");
    await c.query("DELETE FROM core_integration.outbox_event WHERE tenant_id=$1",[f.tenant]);
    await c.query("DELETE FROM core_integration.outbox_event_identity WHERE id NOT IN (SELECT id FROM core_integration.outbox_event)");
    await c.query("DELETE FROM core_commercial.entitlement_snapshot_fact WHERE tenant_id=$1",[f.tenant]);
    await c.query("DELETE FROM core_commercial.entitlement_snapshot WHERE tenant_id=$1",[f.tenant]);
    await c.query("DELETE FROM core_commercial.subscription_transition WHERE tenant_id=$1",[f.tenant]);
    await c.query("UPDATE core_tenancy.tenant SET current_subscription_id=NULL WHERE id=$1",[f.tenant]);
    await c.query("DELETE FROM core_commercial.subscription WHERE tenant_id=$1",[f.tenant]);
    await c.query("DELETE FROM core_commercial.plan_version WHERE id=ANY($1::uuid[])",[[f.oldPlanVersion,f.newPlanVersion]]);
    await c.query("DELETE FROM core_commercial.plan WHERE id=ANY($1::uuid[])",[[f.oldPlan,f.newPlan]]);
    await c.query("DELETE FROM core_commercial.commercial_route_policy WHERE id=$1",[f.route]);
    await c.query("DELETE FROM core_commercial.entitlement_definition WHERE id=ANY($1::uuid[])",[[f.definitionTenant,f.definitionIndustry]]);
    await c.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id=$1",[f.tenant]);
    await c.query("DELETE FROM core_identity.platform_principal WHERE id=$1",[f.actor]);
    await c.query("DELETE FROM core_tenancy.tenant WHERE id=$1",[f.tenant]);
    await c.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
    await c.query("DROP ROLE IF EXISTS "+loginRole);
    await c.query("COMMIT");
  }catch(error){
    await c.query("ROLLBACK");
    throw error;
  }finally{c.release();await admin.end();}
});

test("Commercial publication atomically advances Subscription, snapshot, outbox and audit",async()=>{
  const effectiveAt=new Date(Date.now()-1000);
  const result=await service.publish({
    requestContext:context(),
    subscriptionId:f.subscription,
    expectedSubscriptionVersion:4,
    expectedSourcePlanVersionId:f.oldPlanVersion,
    targetPlanVersionId:f.newPlanVersion,
    effectiveAt,
    triggerCode:"PLAN_CHANGE_APPLIED",
    planChangeRequestId:f.planChangeRequest,
    reasonCode:"TEST_APPROVED",
    sourceFingerprint:"commercial-publication-postgres-v1",
    denySet:[],
    facts:[
      {
        code:"tenant.feature",valueType:"BOOLEAN",value:true,
        sourceType:"PLAN",sourceId:f.newPlanVersion,effectiveFrom:effectiveAt,
      },
      {
        code:"rtl.feature",valueType:"SET",value:["pos","inventory"],
        industryContextId:f.industry,sourceType:"PLAN",sourceId:f.newPlanVersion,
        effectiveFrom:effectiveAt,
      },
    ],
  });
  assert.equal(result.subscriptionVersion,5);
  assert.equal(result.snapshotVersion,8);

  const subscription=await admin.query("SELECT plan_version_id::text,version FROM core_commercial.subscription WHERE id=$1",[f.subscription]);
  assert.equal(subscription.rows[0].plan_version_id,f.newPlanVersion);
  assert.equal(Number(subscription.rows[0].version),5);

  const snapshots=await admin.query("SELECT id::text,version,status::text,source_plan_version_id::text FROM core_commercial.entitlement_snapshot WHERE tenant_id=$1 ORDER BY version",[f.tenant]);
  assert.deepEqual(snapshots.rows.map(row=>[Number(row.version),row.status,row.source_plan_version_id]),[
    [7,"SUPERSEDED",f.oldPlanVersion],
    [8,"CURRENT",f.newPlanVersion],
  ]);

  const facts=await admin.query("SELECT entitlement_code,industry_context_id::text,value_json FROM core_commercial.entitlement_snapshot_fact WHERE snapshot_id=$1 ORDER BY entitlement_code",[result.snapshotId]);
  assert.deepEqual(facts.rows.map(row=>[row.entitlement_code,row.industry_context_id,row.value_json]),[
    ["rtl.feature",f.industry,["inventory","pos"]],
    ["tenant.feature",null,true],
  ]);

  const events=await admin.query("SELECT event_type,scope_class,envelope_jsonb FROM core_integration.outbox_event WHERE tenant_id=$1 ORDER BY event_type",[f.tenant]);
  assert.deepEqual(events.rows.map(row=>row.event_type),["entitlement.recompiled","subscription.transitioned"]);
  assert.ok(events.rows.every(row=>row.scope_class==="TENANT_CORE"));
  assert.ok(events.rows.every(row=>row.envelope_jsonb.sourceModule==="Commercial"));

  const audit=await admin.query("SELECT source_module,action_code,outcome::text FROM core_audit.audit_event WHERE tenant_id=$1",[f.tenant]);
  assert.deepEqual(audit.rows,[{
    source_module:"Commercial",action_code:"commercial.plan_change.publish",outcome:"SUCCESS",
  }]);
});

test("stale expected Subscription version rolls back without partial publication",async()=>{
  const before=await admin.query("SELECT count(*)::int AS count FROM core_commercial.subscription_transition WHERE tenant_id=$1",[f.tenant]);
  const outboxBefore=await admin.query("SELECT count(*)::int AS count FROM core_integration.outbox_event WHERE tenant_id=$1",[f.tenant]);
  await assert.rejects(
    service.publish({
      requestContext:{...context(),entitlementSnapshotId:(await admin.query("SELECT id::text FROM core_commercial.entitlement_snapshot WHERE tenant_id=$1 AND status='CURRENT'",[f.tenant])).rows[0].id,entitlementSnapshotVersion:8},
      subscriptionId:f.subscription,
      expectedSubscriptionVersion:4,
      expectedSourcePlanVersionId:f.newPlanVersion,
      targetPlanVersionId:f.oldPlanVersion,
      effectiveAt:new Date(Date.now()-1000),
      triggerCode:"PLAN_CHANGE_APPLIED",
      sourceFingerprint:"commercial-publication-stale-v1",
      denySet:[],facts:[],
    }),
    error=>error instanceof CommercialPublicationError
      && error.code==="COMMERCIAL_PUBLICATION_STATE_CONFLICT",
  );
  const after=await admin.query("SELECT count(*)::int AS count FROM core_commercial.subscription_transition WHERE tenant_id=$1",[f.tenant]);
  const outboxAfter=await admin.query("SELECT count(*)::int AS count FROM core_integration.outbox_event WHERE tenant_id=$1",[f.tenant]);
  assert.equal(after.rows[0].count,before.rows[0].count);
  assert.equal(outboxAfter.rows[0].count,outboxBefore.rows[0].count);
});

test("dedicated Commercial database role cannot update Subscription state",async()=>{
  await assert.rejects(
    database.transaction(tx=>tx.query(
      "UPDATE core_commercial.subscription SET state='SUSPENDED' WHERE id=$1",
      [f.subscription],
    )),
    error=>error.code==="DATABASE_QUERY_FAILED",
  );
});
