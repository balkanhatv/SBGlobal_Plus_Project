import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIAgentRunStore } from "../../dist/server/ai/postgres-ai-agent-run-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);

const admin = new pg.Pool({ connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1 });
const role = "sbg_ai_agent_run_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const suffix = randomBytes(8).toString("hex");
const platformToolSetCode = "AI_AGENT_RUN_TOOLSET_" + suffix;
const platformAgentCode = "AI_AGENT_RUN_DEF_" + suffix;
const platformServiceCode = "ai-agent-run-reader-" + suffix;

const f = Object.fromEntries([
  "home","tenantA","tenantB","principalA","principalA2","principalB","platformService",
  "membershipA","membershipA2","membershipB","industryA1","industryA2","industryB1",
  "toolSet","agentDefinition","approvalPolicy","budgetPolicy",
  "runIndustryA1","runIndustryA2","runPrincipalA2","runTenantA","runTenantB","missingRun"
].map((key)=>[key,randomUUID()]));

let pool;
let scoped;
let store;

function tenantCoreA(principalId=f.principalA,membershipId=f.membershipA){
  return Object.freeze({
    requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenantA,
    dataHomeId:f.home,regionCode:"IN-AI-AGENT-RUN",principalId,principalType:"HUMAN",
    membershipId,orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"TENANT_CORE"
  });
}
function industryA1(principalId=f.principalA,membershipId=f.membershipA){
  return Object.freeze({...tenantCoreA(principalId,membershipId),industryContextId:f.industryA1,scopeClass:"TENANT_INDUSTRY"});
}
function industryA2(){return Object.freeze({...tenantCoreA(),industryContextId:f.industryA2,scopeClass:"TENANT_INDUSTRY"});}
function industryB1(){return Object.freeze({...tenantCoreA(f.principalB,f.membershipB),tenantId:f.tenantB,industryContextId:f.industryB1,scopeClass:"TENANT_INDUSTRY"});}
function platformContext(){return Object.freeze({
  requestId:randomUUID(),correlationId:randomUUID(),principalId:f.platformService,principalType:"SERVICE",
  orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"PLATFORM_GLOBAL"
});}

before(async()=>{
  const client=await admin.connect();
  try{
    await client.query("BEGIN");
    await client.query("CREATE ROLE "+role+" LOGIN PASSWORD '"+password+"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS");
    await client.query("GRANT sbg_ai_gateway_rw TO "+role);

    await client.query(`INSERT INTO platform_directory.data_home
      (id,code,region_code,jurisdiction_code,topology_class,status)
      VALUES ($1::uuid,$1::uuid::text,'IN-AI-AGENT-RUN','IN','SHARED','ACTIVE')`,[f.home]);

    for(const [tenantId,industry,label] of [
      [f.tenantA,"RTL","AI AgentRun tenant A"],[f.tenantB,"EDU","AI AgentRun tenant B"]
    ]){
      await client.query(`INSERT INTO core_tenancy.tenant
        (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
        VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,'IN-AI-AGENT-RUN',now(),now())`,
        [tenantId,label,industry,f.home]);
    }

    for(const [principalId,type,label,svc,module] of [
      [f.principalA,"HUMAN","AI AgentRun principal A",null,null],
      [f.principalA2,"HUMAN","AI AgentRun principal A2",null,null],
      [f.principalB,"HUMAN","AI AgentRun principal B",null,null],
      [f.platformService,"SERVICE","AI AgentRun platform service",platformServiceCode,"AI"]
    ]){
      await client.query(`INSERT INTO core_identity.platform_principal
        (id,principal_type,status,display_name,service_code,owning_module,created_at,updated_at)
        VALUES ($1,$2,'ACTIVE',$3,$4,$5,now(),now())`,[principalId,type,label,svc,module]);
    }

    for(const [membershipId,tenantId,principalId] of [
      [f.membershipA,f.tenantA,f.principalA],
      [f.membershipA2,f.tenantA,f.principalA2],
      [f.membershipB,f.tenantB,f.principalB]
    ]){
      await client.query(`INSERT INTO core_identity.tenant_membership
        (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
        VALUES ($1,$2,$3,'ACTIVE',1,now(),now())`,[membershipId,tenantId,principalId]);
    }

    for(const [id,tenantId,code,primary] of [
      [f.industryA1,f.tenantA,"RTL",true],
      [f.industryA2,f.tenantA,"MFG",false],
      [f.industryB1,f.tenantB,"EDU",true]
    ]){
      await client.query(`INSERT INTO core_tenancy.industry_context
        (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
        VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`,[id,tenantId,code,primary]);
    }

    await client.query(`INSERT INTO core_ai.ai_tool_set
      (id,owner_scope,tenant_id,industry_context_id,code,version,status,created_at,updated_at)
      VALUES ($1,'PLATFORM',NULL,NULL,$2,1,'ACTIVE','2025-01-01T00:00:00Z','2025-01-02T00:00:00Z')`,
      [f.toolSet,platformToolSetCode]);

    await client.query(`INSERT INTO core_ai.agent_definition
      (id,owner_scope,tenant_id,industry_context_id,code,objective_class,allowed_tool_set_id,
       max_risk_class,approval_policy_id,budget_policy_id,version,status,created_at,updated_at)
      VALUES ($1,'PLATFORM',NULL,NULL,$2,'RAW_EVIDENCE',$3,'',$4,$5,1,'ACTIVE',
       '2025-01-03T00:00:00Z','2025-01-04T00:00:00Z')`,
      [f.agentDefinition,platformAgentCode,f.toolSet,f.approvalPolicy,f.budgetPolicy]);

    await client.query(`INSERT INTO core_ai.agent_run
      (id,agent_definition_id,tenant_id,industry_context_id,acting_principal_id,membership_id,
       entitlement_snapshot_version,permission_version,requested_resource_scope_json,status,
       step_budget_class,token_budget_class,started_at,completed_at,correlation_id)
      VALUES
      ($1,$6,$7,$10,$8,$9,9223372036854775806,-7,
       '{"resource":{"ids":["a",""],"limit":3},"nullable":null}'::jsonb,'RUNNING','STEP-A','TOKEN-A',
       '2026-01-01T00:00:00Z',NULL,$15),
      ($2,$6,$7,$11,$8,$9,0,1,'{}'::jsonb,'PENDING','','',
       '2026-01-02T00:00:00Z',NULL,$16),
      ($3,$6,$7,$10,$12,$13,5,6,'{"otherPrincipal":true}'::jsonb,'FAILED','X','Y',
       '2026-01-03T00:00:00Z','2026-01-03T01:00:00Z',$17),
      ($4,$6,$7,NULL,$8,$9,-1,0,'[]'::jsonb,'WAITING_APPROVAL','','',
       '2026-01-04T00:00:00Z','2026-01-04T00:00:00Z',$18),
      ($5,$6,$14,$19,$20,$21,8,9,'{"tenant":"b"}'::jsonb,'SUCCEEDED','BSTEP','BTOKEN',
       '2026-01-05T00:00:00Z','2026-01-05T02:00:00Z',$22)`,
      [
        f.runIndustryA1,f.runIndustryA2,f.runPrincipalA2,f.runTenantA,f.runTenantB,
        f.agentDefinition,f.tenantA,f.principalA,f.membershipA,f.industryA1,f.industryA2,
        f.principalA2,f.membershipA2,f.tenantB,
        randomUUID(),randomUUID(),randomUUID(),randomUUID(),f.industryB1,f.principalB,f.membershipB,randomUUID()
      ]);

    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL); url.username=role; url.password=password;
  pool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:5000});
  scoped=new RequestScopedSql(new PostgresAIGatewayDatabase(pool),{dataHomeId:f.home,regionCode:"IN-AI-AGENT-RUN"});
  store=new PostgresAIAgentRunStore(scoped);
});

after(async()=>{
  if(pool) await pool.end();
  const client=await admin.connect();
  try{
    await client.query("BEGIN");
    await client.query("DELETE FROM core_ai.agent_run WHERE id=ANY($1::uuid[])",[[
      f.runIndustryA1,f.runIndustryA2,f.runPrincipalA2,f.runTenantA,f.runTenantB
    ]]);
    await client.query("DELETE FROM core_ai.agent_definition WHERE id=$1",[f.agentDefinition]);
    await client.query("DELETE FROM core_ai.ai_tool_set WHERE id=$1",[f.toolSet]);
    await client.query("DELETE FROM core_identity.tenant_membership WHERE id=ANY($1::uuid[])",[[
      f.membershipA,f.membershipA2,f.membershipB
    ]]);
    await client.query("DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",[[
      f.industryA1,f.industryA2,f.industryB1
    ]]);
    await client.query("DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",[[
      f.principalA,f.principalA2,f.principalB,f.platformService
    ]]);
    await client.query("DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",[[f.tenantA,f.tenantB]]);
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
    await client.query("DROP ROLE IF EXISTS "+role);
    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();await admin.end();}
});

test("AIAGENTRUN-PG-001 exact principal-owned Industry AgentRun preserves immutable raw evidence",async()=>{
  const row=await store.loadForContext({requestContext:industryA1(),agentRunId:f.runIndustryA1});
  assert.ok(row);
  assert.equal(row.id,f.runIndustryA1);
  assert.equal(row.agentDefinitionId,f.agentDefinition);
  assert.equal(row.tenantId,f.tenantA);
  assert.equal(row.industryContextId,f.industryA1);
  assert.equal(row.actingPrincipalId,f.principalA);
  assert.equal(row.membershipId,f.membershipA);
  assert.equal(row.entitlementSnapshotVersion,"9223372036854775806");
  assert.equal(row.permissionVersion,"-7");
  assert.deepEqual(row.requestedResourceScope,{nullable:null,resource:{ids:["a",""],limit:3}});
  assert.equal(Object.isFrozen(row),true);
  assert.equal(Object.isFrozen(row.requestedResourceScope),true);
  assert.equal(row.status,"RUNNING");
  assert.equal(row.stepBudgetClass,"STEP-A");
  assert.equal(row.tokenBudgetClass,"TOKEN-A");
  assert.equal(row.completedAt,undefined);
  assert.equal("authorized" in row,false);
  assert.equal("resumable" in row,false);
  assert.equal("executable" in row,false);
});

test("AIAGENTRUN-PG-002 sibling Industry context cannot expose an Industry AgentRun",async()=>{
  assert.equal(await store.loadForContext({requestContext:industryA2(),agentRunId:f.runIndustryA1}),null);
  const sibling=await store.loadForContext({requestContext:industryA2(),agentRunId:f.runIndustryA2});
  assert.ok(sibling);
  assert.equal(sibling.industryContextId,f.industryA2);
  assert.equal(sibling.status,"PENDING");
  assert.equal(sibling.stepBudgetClass,"");
  assert.equal(sibling.tokenBudgetClass,"");
});

test("AIAGENTRUN-PG-003 another principal in the same Tenant/Industry cannot read the principal-owned run",async()=>{
  assert.equal(await store.loadForContext({
    requestContext:industryA1(f.principalA2,f.membershipA2),agentRunId:f.runIndustryA1
  }),null);
  const own=await store.loadForContext({
    requestContext:industryA1(f.principalA2,f.membershipA2),agentRunId:f.runPrincipalA2
  });
  assert.ok(own);
  assert.equal(own.actingPrincipalId,f.principalA2);
  assert.equal(own.status,"FAILED");
});

test("AIAGENTRUN-PG-004 Tenant-Core run is same-principal visible from Core and Industry without cross-context continuation authority",async()=>{
  const fromCore=await store.loadForContext({requestContext:tenantCoreA(),agentRunId:f.runTenantA});
  const fromIndustry=await store.loadForContext({requestContext:industryA1(),agentRunId:f.runTenantA});
  assert.ok(fromCore);
  assert.ok(fromIndustry);
  assert.equal(fromCore.industryContextId,undefined);
  assert.equal(fromCore.entitlementSnapshotVersion,"-1");
  assert.equal(fromCore.permissionVersion,"0");
  assert.deepEqual(fromCore.requestedResourceScope,[]);
  assert.equal(fromCore.status,"WAITING_APPROVAL");
  assert.equal(fromCore.completedAt,fromCore.startedAt);
  assert.equal(typeof store.continueAcrossContext,"undefined");
});

test("AIAGENTRUN-PG-005 foreign Tenant and PLATFORM_GLOBAL contexts cannot expose the run",async()=>{
  assert.equal(await store.loadForContext({requestContext:industryA1(),agentRunId:f.runTenantB}),null);
  const own=await store.loadForContext({requestContext:industryB1(),agentRunId:f.runTenantB});
  assert.ok(own);
  assert.equal(own.tenantId,f.tenantB);
  assert.equal(own.status,"SUCCEEDED");
  assert.equal(await store.loadForContext({requestContext:platformContext(),agentRunId:f.runIndustryA1}),null);
});

test("AIAGENTRUN-PG-006 missing, malformed, and route-mismatched reads fail safely",async()=>{
  assert.equal(await store.loadForContext({requestContext:industryA1(),agentRunId:f.missingRun}),null);
  await assert.rejects(store.loadForContext({requestContext:industryA1(),agentRunId:"not-a-uuid"}));
  await assert.rejects(store.loadForContext({
    requestContext:{...industryA1(),dataHomeId:randomUUID()},agentRunId:f.runIndustryA1
  }));
});

test("AIAGENTRUN-PG-007 startup versions/status/scope/budget evidence adds no current authorization/resume/step/tool execution authority",async()=>{
  const row=await store.loadForContext({requestContext:industryA1(),agentRunId:f.runIndustryA1});
  assert.ok(row);
  const privileges=await scoped.withContext(industryA1(),tx=>tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.agent_run','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.agent_run','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.agent_run','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.agent_run','DELETE') AS can_delete`
  ));
  assert.equal(privileges.rows[0].user_name,"sbg_ai_gateway_rw");
  assert.equal(privileges.rows[0].can_select,true);
  assert.equal(privileges.rows[0].can_insert,true);
  assert.equal(privileges.rows[0].can_update,true);
  assert.equal(privileges.rows[0].can_delete,true);

  assert.equal(typeof store.create,"undefined");
  assert.equal(typeof store.update,"undefined");
  assert.equal(typeof store.delete,"undefined");
  assert.equal(typeof store.list,"undefined");
  assert.equal(typeof store.selectCurrent,"undefined");
  assert.equal(typeof store.loadSteps,"undefined");
  assert.equal(typeof store.loadApprovals,"undefined");
  assert.equal(typeof store.resume,"undefined");
  assert.equal(typeof store.execute,"undefined");
});
