import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIAgentStepStore } from "../../dist/server/ai/postgres-ai-agent-step-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);

const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const role="sbg_ai_agent_step_reader_"+randomBytes(8).toString("hex");
const password=randomBytes(24).toString("hex");
const suffix=randomBytes(8).toString("hex");
const toolSetCode="AI_AGENT_STEP_TOOLSET_"+suffix;
const agentCode="AI_AGENT_STEP_DEF_"+suffix;
const serviceCode="ai-agent-step-reader-"+suffix;

const f=Object.fromEntries([
"home","tenantA","tenantB","principalA","principalA2","principalB","platformService",
"membershipA","membershipA2","membershipB","industryA1","industryA2","industryB1",
"toolSet","agentDefinition","approvalPolicy","budgetPolicy",
"runA1","runA2","runA2Principal","runTenantA","runB1",
"stepA1","stepA2","stepA2Principal","stepTenantA","stepB1","missingStep"
].map(k=>[k,randomUUID()]));

let pool,scoped,store;

function tenantCoreA(principalId=f.principalA,membershipId=f.membershipA){return Object.freeze({
 requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenantA,dataHomeId:f.home,
 regionCode:"IN-AI-AGENT-STEP",principalId,principalType:"HUMAN",membershipId,
 orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"TENANT_CORE"
});}
function industryA1(principalId=f.principalA,membershipId=f.membershipA){return Object.freeze({...tenantCoreA(principalId,membershipId),industryContextId:f.industryA1,scopeClass:"TENANT_INDUSTRY"});}
function industryA2(){return Object.freeze({...tenantCoreA(),industryContextId:f.industryA2,scopeClass:"TENANT_INDUSTRY"});}
function industryB1(){return Object.freeze({...tenantCoreA(f.principalB,f.membershipB),tenantId:f.tenantB,industryContextId:f.industryB1,scopeClass:"TENANT_INDUSTRY"});}
function platformContext(){return Object.freeze({requestId:randomUUID(),correlationId:randomUUID(),principalId:f.platformService,principalType:"SERVICE",orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"PLATFORM_GLOBAL"});}

before(async()=>{
 const client=await admin.connect();
 try{
  await client.query("BEGIN");
  await client.query("CREATE ROLE "+role+" LOGIN PASSWORD '"+password+"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS");
  await client.query("GRANT sbg_ai_gateway_rw TO "+role);
  await client.query(`INSERT INTO platform_directory.data_home(id,code,region_code,jurisdiction_code,topology_class,status)
    VALUES($1::uuid,$1::uuid::text,'IN-AI-AGENT-STEP','IN','SHARED','ACTIVE')`,[f.home]);
  for(const [id,industry,label] of [[f.tenantA,"RTL","AI AgentStep A"],[f.tenantB,"EDU","AI AgentStep B"]]){
   await client.query(`INSERT INTO core_tenancy.tenant
    (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
    VALUES($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,'IN-AI-AGENT-STEP',now(),now())`,[id,label,industry,f.home]);
  }
  for(const [id,type,label,svc,module] of [
   [f.principalA,"HUMAN","AI AgentStep principal A",null,null],
   [f.principalA2,"HUMAN","AI AgentStep principal A2",null,null],
   [f.principalB,"HUMAN","AI AgentStep principal B",null,null],
   [f.platformService,"SERVICE","AI AgentStep service",serviceCode,"AI"]
  ]){
   await client.query(`INSERT INTO core_identity.platform_principal
    (id,principal_type,status,display_name,service_code,owning_module,created_at,updated_at)
    VALUES($1,$2,'ACTIVE',$3,$4,$5,now(),now())`,[id,type,label,svc,module]);
  }
  for(const [id,tenant,principal] of [[f.membershipA,f.tenantA,f.principalA],[f.membershipA2,f.tenantA,f.principalA2],[f.membershipB,f.tenantB,f.principalB]]){
   await client.query(`INSERT INTO core_identity.tenant_membership
    (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
    VALUES($1,$2,$3,'ACTIVE',1,now(),now())`,[id,tenant,principal]);
  }
  for(const [id,tenant,code,primary] of [[f.industryA1,f.tenantA,"RTL",true],[f.industryA2,f.tenantA,"MFG",false],[f.industryB1,f.tenantB,"EDU",true]]){
   await client.query(`INSERT INTO core_tenancy.industry_context
    (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
    VALUES($1,$2,$3,'ACTIVE',$4,now(),now())`,[id,tenant,code,primary]);
  }
  await client.query(`INSERT INTO core_ai.ai_tool_set
   (id,owner_scope,tenant_id,industry_context_id,code,version,status,created_at,updated_at)
   VALUES($1,'PLATFORM',NULL,NULL,$2,1,'ACTIVE','2025-01-01T00:00:00Z','2025-01-02T00:00:00Z')`,[f.toolSet,toolSetCode]);
  await client.query(`INSERT INTO core_ai.agent_definition
   (id,owner_scope,tenant_id,industry_context_id,code,objective_class,allowed_tool_set_id,max_risk_class,
    approval_policy_id,budget_policy_id,version,status,created_at,updated_at)
   VALUES($1,'PLATFORM',NULL,NULL,$2,'RAW_STEP',$3,'',$4,$5,1,'ACTIVE','2025-01-03T00:00:00Z','2025-01-04T00:00:00Z')`,
   [f.agentDefinition,agentCode,f.toolSet,f.approvalPolicy,f.budgetPolicy]);

  const runRows=[
   [f.runA1,f.tenantA,f.industryA1,f.principalA,f.membershipA],
   [f.runA2,f.tenantA,f.industryA2,f.principalA,f.membershipA],
   [f.runA2Principal,f.tenantA,f.industryA1,f.principalA2,f.membershipA2],
   [f.runTenantA,f.tenantA,null,f.principalA,f.membershipA],
   [f.runB1,f.tenantB,f.industryB1,f.principalB,f.membershipB]
  ];
  for(const [id,tenant,industry,principal,membership] of runRows){
   await client.query(`INSERT INTO core_ai.agent_run
    (id,agent_definition_id,tenant_id,industry_context_id,acting_principal_id,membership_id,
     entitlement_snapshot_version,permission_version,requested_resource_scope_json,status,
     step_budget_class,token_budget_class,started_at,completed_at,correlation_id)
    VALUES($1,$2,$3,$4,$5,$6,1,1,'{}'::jsonb,'RUNNING','','','2026-01-01T00:00:00Z',NULL,$7)`,
    [id,f.agentDefinition,tenant,industry,principal,membership,randomUUID()]);
  }

  await client.query(`INSERT INTO core_ai.agent_step
   (id,run_id,ordinal,step_type,input_ref,output_ref,tool_binding_id,approval_id,status,started_at,completed_at,audit_ref)
   VALUES
   ($1,$6,0,'PLAN','',NULL,NULL,NULL,'RUNNING','2026-01-01T00:01:00Z',NULL,NULL),
   ($2,$7,1,'RAG','rag://in','rag://out',NULL,NULL,'SUCCEEDED','2026-01-01T00:02:00Z','2026-01-01T00:03:00Z',NULL),
   ($3,$8,2,'INFERENCE',NULL,'',NULL,NULL,'FAILED','2026-01-01T00:04:00Z','2026-01-01T00:05:00Z',NULL),
   ($4,$9,3,'APPROVAL',NULL,NULL,NULL,NULL,'PENDING','2026-01-01T00:06:00Z',NULL,NULL),
   ($5,$10,4,'PLAN','b',NULL,NULL,NULL,'SKIPPED','2026-01-01T00:07:00Z','2026-01-01T00:07:00Z',NULL)`,
   [f.stepA1,f.stepA2,f.stepA2Principal,f.stepTenantA,f.stepB1,f.runA1,f.runA2,f.runA2Principal,f.runTenantA,f.runB1]);

  await client.query("COMMIT");
 }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}

 const url=new URL(process.env.SBG_POSTGRES_TEST_URL);url.username=role;url.password=password;
 pool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:5000});
 scoped=new RequestScopedSql(new PostgresAIGatewayDatabase(pool),{dataHomeId:f.home,regionCode:"IN-AI-AGENT-STEP"});
 store=new PostgresAIAgentStepStore(scoped);
});

after(async()=>{
 if(pool) await pool.end();
 const client=await admin.connect();
 try{
  await client.query("BEGIN");
  await client.query("DELETE FROM core_ai.agent_step WHERE id=ANY($1::uuid[])",[[f.stepA1,f.stepA2,f.stepA2Principal,f.stepTenantA,f.stepB1]]);
  await client.query("DELETE FROM core_ai.agent_run WHERE id=ANY($1::uuid[])",[[f.runA1,f.runA2,f.runA2Principal,f.runTenantA,f.runB1]]);
  await client.query("DELETE FROM core_ai.agent_definition WHERE id=$1",[f.agentDefinition]);
  await client.query("DELETE FROM core_ai.ai_tool_set WHERE id=$1",[f.toolSet]);
  await client.query("DELETE FROM core_identity.tenant_membership WHERE id=ANY($1::uuid[])",[[f.membershipA,f.membershipA2,f.membershipB]]);
  await client.query("DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",[[f.industryA1,f.industryA2,f.industryB1]]);
  await client.query("DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",[[f.principalA,f.principalA2,f.principalB,f.platformService]]);
  await client.query("DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",[[f.tenantA,f.tenantB]]);
  await client.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
  await client.query("DROP ROLE IF EXISTS "+role);
  await client.query("COMMIT");
 }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();await admin.end();}
});

test("AIAGENTSTEP-PG-001 exact visible step preserves immutable raw evidence",async()=>{
 const row=await store.loadForContext({requestContext:industryA1(),agentStepId:f.stepA1});
 assert.ok(row);
 assert.equal(row.id,f.stepA1);assert.equal(row.runId,f.runA1);assert.equal(row.ordinal,0);
 assert.equal(row.stepType,"PLAN");assert.equal(row.inputRef,"");assert.equal(row.outputRef,undefined);
 assert.equal(row.toolBindingId,undefined);assert.equal(row.approvalId,undefined);assert.equal(row.status,"RUNNING");
 assert.equal(row.completedAt,undefined);assert.equal(row.auditRef,undefined);assert.equal(Object.isFrozen(row),true);
 assert.equal("current" in row,false);assert.equal("authorized" in row,false);assert.equal("executable" in row,false);
});

test("AIAGENTSTEP-PG-002 sibling Industry cannot expose a step under its parent run",async()=>{
 assert.equal(await store.loadForContext({requestContext:industryA2(),agentStepId:f.stepA1}),null);
 const sibling=await store.loadForContext({requestContext:industryA2(),agentStepId:f.stepA2});
 assert.ok(sibling);assert.equal(sibling.stepType,"RAG");assert.equal(sibling.inputRef,"rag://in");assert.equal(sibling.outputRef,"rag://out");assert.equal(sibling.status,"SUCCEEDED");
});

test("AIAGENTSTEP-PG-003 another principal in same Tenant/Industry cannot read the step",async()=>{
 assert.equal(await store.loadForContext({requestContext:industryA1(f.principalA2,f.membershipA2),agentStepId:f.stepA1}),null);
 const own=await store.loadForContext({requestContext:industryA1(f.principalA2,f.membershipA2),agentStepId:f.stepA2Principal});
 assert.ok(own);assert.equal(own.stepType,"INFERENCE");assert.equal(own.outputRef,"");assert.equal(own.status,"FAILED");
});

test("AIAGENTSTEP-PG-004 Tenant-Core run step is same-principal visible from Core and Industry without continuation authority",async()=>{
 const core=await store.loadForContext({requestContext:tenantCoreA(),agentStepId:f.stepTenantA});
 const industry=await store.loadForContext({requestContext:industryA1(),agentStepId:f.stepTenantA});
 assert.ok(core);assert.ok(industry);assert.equal(core.stepType,"APPROVAL");assert.equal(core.status,"PENDING");
 assert.equal(typeof store.selectNext,"undefined");assert.equal(typeof store.continueRun,"undefined");
});

test("AIAGENTSTEP-PG-005 foreign Tenant and PLATFORM_GLOBAL cannot expose the step",async()=>{
 assert.equal(await store.loadForContext({requestContext:industryA1(),agentStepId:f.stepB1}),null);
 const own=await store.loadForContext({requestContext:industryB1(),agentStepId:f.stepB1});
 assert.ok(own);assert.equal(own.status,"SKIPPED");assert.equal(own.completedAt,own.startedAt);
 assert.equal(await store.loadForContext({requestContext:platformContext(),agentStepId:f.stepA1}),null);
});

test("AIAGENTSTEP-PG-006 missing, malformed, and route-mismatched reads fail safely",async()=>{
 assert.equal(await store.loadForContext({requestContext:industryA1(),agentStepId:f.missingStep}),null);
 await assert.rejects(store.loadForContext({requestContext:industryA1(),agentStepId:"not-a-uuid"}));
 await assert.rejects(store.loadForContext({requestContext:{...industryA1(),dataHomeId:randomUUID()},agentStepId:f.stepA1}));
});

test("AIAGENTSTEP-PG-007 raw step evidence adds no current eligibility/approval/execution authority",async()=>{
 const row=await store.loadForContext({requestContext:industryA1(),agentStepId:f.stepA1});assert.ok(row);
 const privileges=await scoped.withContext(industryA1(),tx=>tx.query(
  `SELECT current_user AS user_name,
   has_table_privilege(current_user,'core_ai.agent_step','SELECT') AS can_select,
   has_table_privilege(current_user,'core_ai.agent_step','INSERT') AS can_insert,
   has_table_privilege(current_user,'core_ai.agent_step','UPDATE') AS can_update,
   has_table_privilege(current_user,'core_ai.agent_step','DELETE') AS can_delete`
 ));
 assert.equal(privileges.rows[0].user_name,"sbg_ai_gateway_rw");
 assert.equal(privileges.rows[0].can_select,true);assert.equal(privileges.rows[0].can_insert,true);
 assert.equal(privileges.rows[0].can_update,true);assert.equal(privileges.rows[0].can_delete,true);
 assert.equal(typeof store.create,"undefined");assert.equal(typeof store.update,"undefined");assert.equal(typeof store.delete,"undefined");
 assert.equal(typeof store.list,"undefined");assert.equal(typeof store.plan,"undefined");assert.equal(typeof store.selectNext,"undefined");
 assert.equal(typeof store.resolveToolBinding,"undefined");assert.equal(typeof store.resolveApproval,"undefined");assert.equal(typeof store.execute,"undefined");
});
