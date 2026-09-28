import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIAgentApprovalStore } from "../../dist/server/ai/postgres-ai-agent-approval-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);

const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const role="sbg_ai_agent_approval_reader_"+randomBytes(8).toString("hex");
const password=randomBytes(24).toString("hex");
const suffix=randomBytes(8).toString("hex");
const toolSetCode="AI_AGENT_APPROVAL_TOOLSET_"+suffix;
const agentCode="AI_AGENT_APPROVAL_DEF_"+suffix;
const serviceCode="ai-agent-approval-reader-"+suffix;

const f=Object.fromEntries([
  "home","tenantA","tenantB","principalA","principalA2","principalB","platformService",
  "membershipA","membershipA2","membershipB","industryA1","industryA2","industryB1",
  "toolSet","agentDefinition","approvalPolicy","budgetPolicy",
  "runA1","runA2","runTenantA","runB1",
  "stepA1","stepA2","stepTenantA","stepB1",
  "approvalA1","approvalA2","approvalTenantA","approvalB1","missingApproval"
].map(k=>[k,randomUUID()]));

let pool,scoped,store;

function tenantCoreA(principalId=f.principalA,membershipId=f.membershipA){return Object.freeze({
  requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenantA,dataHomeId:f.home,
  regionCode:"IN-AI-AGENT-APP",principalId,principalType:"HUMAN",membershipId,
  orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"TENANT_CORE"
});}
function industryA1(principalId=f.principalA,membershipId=f.membershipA){return Object.freeze({
  ...tenantCoreA(principalId,membershipId),industryContextId:f.industryA1,scopeClass:"TENANT_INDUSTRY"
});}
function industryA2(){return Object.freeze({
  ...tenantCoreA(),industryContextId:f.industryA2,scopeClass:"TENANT_INDUSTRY"
});}
function industryB1(){return Object.freeze({
  ...tenantCoreA(f.principalB,f.membershipB),tenantId:f.tenantB,industryContextId:f.industryB1,
  scopeClass:"TENANT_INDUSTRY"
});}
function platformContext(){return Object.freeze({
  requestId:randomUUID(),correlationId:randomUUID(),principalId:f.platformService,
  principalType:"SERVICE",orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),
  scopeClass:"PLATFORM_GLOBAL"
});}

before(async()=>{
  const client=await admin.connect();
  try{
    await client.query("BEGIN");
    await client.query("CREATE ROLE "+role+" LOGIN PASSWORD '"+password+"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS");
    await client.query("GRANT sbg_ai_gateway_rw TO "+role);

    await client.query(`INSERT INTO platform_directory.data_home
      (id,code,region_code,jurisdiction_code,topology_class,status)
      VALUES($1::uuid,$1::uuid::text,'IN-AI-AGENT-APP','IN','SHARED','ACTIVE')`,[f.home]);

    for(const [id,industry,label] of [[f.tenantA,"RTL","AI AgentApproval A"],[f.tenantB,"EDU","AI AgentApproval B"]]){
      await client.query(`INSERT INTO core_tenancy.tenant
        (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
        VALUES($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,'IN-AI-AGENT-APP','2025-01-01T00:00:00Z','2025-01-01T00:00:00Z')`,
        [id,label,industry,f.home]);
    }

    for(const [id,type,label,svc,module] of [
      [f.principalA,"HUMAN","AI AgentApproval principal A",null,null],
      [f.principalA2,"HUMAN","AI AgentApproval principal A2",null,null],
      [f.principalB,"HUMAN","AI AgentApproval principal B",null,null],
      [f.platformService,"SERVICE","AI AgentApproval service",serviceCode,"AI"]
    ]){
      await client.query(`INSERT INTO core_identity.platform_principal
        (id,principal_type,status,display_name,service_code,owning_module,created_at,updated_at)
        VALUES($1,$2,'ACTIVE',$3,$4,$5,'2025-01-01T00:00:00Z','2025-01-01T00:00:00Z')`,
        [id,type,label,svc,module]);
    }

    for(const [id,tenant,principal] of [
      [f.membershipA,f.tenantA,f.principalA],
      [f.membershipA2,f.tenantA,f.principalA2],
      [f.membershipB,f.tenantB,f.principalB]
    ]){
      await client.query(`INSERT INTO core_identity.tenant_membership
        (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
        VALUES($1,$2,$3,'ACTIVE',1,'2025-01-01T00:00:00Z','2025-01-01T00:00:00Z')`,
        [id,tenant,principal]);
    }

    for(const [id,tenant,code,primary] of [
      [f.industryA1,f.tenantA,"RTL",true],[f.industryA2,f.tenantA,"MFG",false],[f.industryB1,f.tenantB,"EDU",true]
    ]){
      await client.query(`INSERT INTO core_tenancy.industry_context
        (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
        VALUES($1,$2,$3,'ACTIVE',$4,'2025-01-01T00:00:00Z','2025-01-01T00:00:00Z')`,
        [id,tenant,code,primary]);
    }

    await client.query(`INSERT INTO core_ai.ai_tool_set
      (id,owner_scope,tenant_id,industry_context_id,code,version,status,created_at,updated_at)
      VALUES($1,'PLATFORM',NULL,NULL,$2,1,'ACTIVE','2025-01-01T00:00:00Z','2025-01-02T00:00:00Z')`,
      [f.toolSet,toolSetCode]);

    await client.query(`INSERT INTO core_ai.agent_definition
      (id,owner_scope,tenant_id,industry_context_id,code,objective_class,allowed_tool_set_id,
       max_risk_class,approval_policy_id,budget_policy_id,version,status,created_at,updated_at)
      VALUES($1,'PLATFORM',NULL,NULL,$2,'RAW_APPROVAL',$3,'',$4,$5,1,'ACTIVE',
       '2025-01-03T00:00:00Z','2025-01-04T00:00:00Z')`,
      [f.agentDefinition,agentCode,f.toolSet,f.approvalPolicy,f.budgetPolicy]);

    const runRows=[
      [f.runA1,f.tenantA,f.industryA1,f.principalA,f.membershipA],
      [f.runA2,f.tenantA,f.industryA2,f.principalA,f.membershipA],
      [f.runTenantA,f.tenantA,null,f.principalA,f.membershipA],
      [f.runB1,f.tenantB,f.industryB1,f.principalB,f.membershipB]
    ];
    for(const [id,tenant,industry,principal,membership] of runRows){
      await client.query(`INSERT INTO core_ai.agent_run
        (id,agent_definition_id,tenant_id,industry_context_id,acting_principal_id,membership_id,
         entitlement_snapshot_version,permission_version,requested_resource_scope_json,status,
         step_budget_class,token_budget_class,started_at,completed_at,correlation_id)
        VALUES($1,$2,$3,$4,$5,$6,1,1,'{}'::jsonb,'WAITING_APPROVAL','','',
         '2026-01-01T00:00:00Z',NULL,$7)`,
        [id,f.agentDefinition,tenant,industry,principal,membership,randomUUID()]);
    }

    await client.query(`INSERT INTO core_ai.agent_step
      (id,run_id,ordinal,step_type,input_ref,output_ref,tool_binding_id,approval_id,status,started_at,completed_at,audit_ref)
      VALUES
      ($1,$5,0,'APPROVAL',NULL,NULL,NULL,NULL,'PENDING','2026-01-01T00:01:00Z',NULL,NULL),
      ($2,$6,0,'APPROVAL',NULL,NULL,NULL,NULL,'PENDING','2026-01-01T00:02:00Z',NULL,NULL),
      ($3,$7,0,'APPROVAL',NULL,NULL,NULL,NULL,'PENDING','2026-01-01T00:03:00Z',NULL,NULL),
      ($4,$8,0,'APPROVAL',NULL,NULL,NULL,NULL,'PENDING','2026-01-01T00:04:00Z',NULL,NULL)`,
      [f.stepA1,f.stepA2,f.stepTenantA,f.stepB1,f.runA1,f.runA2,f.runTenantA,f.runB1]);

    await client.query(`INSERT INTO core_ai.agent_approval
      (id,run_id,step_id,tenant_id,industry_context_id,requested_by_agent,approval_type,
       required_permission,approver_principal_id,status,request_summary_safe,approved_at,reason,
       correlation_id,created_at)
      VALUES
      ($1,$5,$9,$13,$15,true,'HIGH_RISK','resource.write',$17,'APPROVED','Safe approval summary',
       '2026-01-01T00:20:00Z','approved',$19,'2026-01-01T00:10:00Z'),
      ($2,$6,$10,$13,$16,true,'MANUAL','resource.read',NULL,'PENDING','',NULL,NULL,$20,'2026-01-01T00:11:00Z'),
      ($3,$7,$11,$13,NULL,false,'','',NULL,'REJECTED','',NULL,'',$21,'2026-01-01T00:12:00Z'),
      ($4,$8,$12,$14,$18,false,'TIMEOUT','resource.write',NULL,'EXPIRED','expired',NULL,NULL,$22,'2026-01-01T00:13:00Z')`,
      [
        f.approvalA1,f.approvalA2,f.approvalTenantA,f.approvalB1,
        f.runA1,f.runA2,f.runTenantA,f.runB1,
        f.stepA1,f.stepA2,f.stepTenantA,f.stepB1,
        f.tenantA,f.tenantB,f.industryA1,f.industryA2,
        f.principalA,f.industryB1,
        randomUUID(),randomUUID(),randomUUID(),randomUUID()
      ]);

    await client.query(`UPDATE core_ai.agent_step
      SET approval_id=CASE id
        WHEN $1::uuid THEN $5::uuid
        WHEN $2::uuid THEN $6::uuid
        WHEN $3::uuid THEN $7::uuid
        WHEN $4::uuid THEN $8::uuid
      END
      WHERE id=ANY($9::uuid[])`,
      [f.stepA1,f.stepA2,f.stepTenantA,f.stepB1,
       f.approvalA1,f.approvalA2,f.approvalTenantA,f.approvalB1,
       [f.stepA1,f.stepA2,f.stepTenantA,f.stepB1]]);

    await client.query("COMMIT");
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL);url.username=role;url.password=password;
  pool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:5000});
  scoped=new RequestScopedSql(new PostgresAIGatewayDatabase(pool),{dataHomeId:f.home,regionCode:"IN-AI-AGENT-APP"});
  store=new PostgresAIAgentApprovalStore(scoped);
});

after(async()=>{
  if(pool) await pool.end();
  const client=await admin.connect();
  try{
    await client.query("BEGIN");
    await client.query("UPDATE core_ai.agent_step SET approval_id=NULL WHERE id=ANY($1::uuid[])",[[
      f.stepA1,f.stepA2,f.stepTenantA,f.stepB1
    ]]);
    await client.query("DELETE FROM core_ai.agent_approval WHERE id=ANY($1::uuid[])",[[
      f.approvalA1,f.approvalA2,f.approvalTenantA,f.approvalB1
    ]]);
    await client.query("DELETE FROM core_ai.agent_step WHERE id=ANY($1::uuid[])",[[
      f.stepA1,f.stepA2,f.stepTenantA,f.stepB1
    ]]);
    await client.query("DELETE FROM core_ai.agent_run WHERE id=ANY($1::uuid[])",[[
      f.runA1,f.runA2,f.runTenantA,f.runB1
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
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();await admin.end();}
});

test("AIAGENTAPP-PG-001 exact Industry approval preserves immutable raw evidence",async()=>{
  const row=await store.loadForContext({requestContext:industryA1(),agentApprovalId:f.approvalA1});
  assert.ok(row);
  assert.equal(row.id,f.approvalA1);assert.equal(row.runId,f.runA1);assert.equal(row.stepId,f.stepA1);
  assert.equal(row.tenantId,f.tenantA);assert.equal(row.industryContextId,f.industryA1);
  assert.equal(row.requestedByAgent,true);assert.equal(row.approvalType,"HIGH_RISK");
  assert.equal(row.requiredPermission,"resource.write");assert.equal(row.approverPrincipalId,f.principalA);
  assert.equal(row.status,"APPROVED");assert.equal(row.requestSummarySafe,"Safe approval summary");
  assert.equal(row.reason,"approved");assert.equal(typeof row.approvedAt,"string");
  assert.equal(typeof row.createdAt,"string");assert.equal(Object.isFrozen(row),true);
  assert.equal("approvalSatisfied" in row,false);assert.equal("authorized" in row,false);
  assert.equal("resumable" in row,false);assert.equal("executable" in row,false);
});

test("AIAGENTAPP-PG-002 sibling Industry cannot expose approval",async()=>{
  assert.equal(await store.loadForContext({requestContext:industryA2(),agentApprovalId:f.approvalA1}),null);
  const sibling=await store.loadForContext({requestContext:industryA2(),agentApprovalId:f.approvalA2});
  assert.ok(sibling);assert.equal(sibling.industryContextId,f.industryA2);
  assert.equal(sibling.status,"PENDING");assert.equal(sibling.requestSummarySafe,"");
  assert.equal(sibling.approverPrincipalId,undefined);assert.equal(sibling.approvedAt,undefined);
});

test("AIAGENTAPP-PG-003 Tenant-Core approval is same-Tenant visible and raw empty/nullable evidence stays raw",async()=>{
  const core=await store.loadForContext({requestContext:tenantCoreA(),agentApprovalId:f.approvalTenantA});
  const industry=await store.loadForContext({requestContext:industryA1(),agentApprovalId:f.approvalTenantA});
  assert.ok(core);assert.ok(industry);assert.equal(core.industryContextId,undefined);
  assert.equal(core.requestedByAgent,false);assert.equal(core.approvalType,"");
  assert.equal(core.requiredPermission,"");assert.equal(core.requestSummarySafe,"");
  assert.equal(core.reason,"");assert.equal(core.approverPrincipalId,undefined);
  assert.equal(core.approvedAt,undefined);assert.equal(core.status,"REJECTED");
});

test("AIAGENTAPP-PG-004 same-scope different principal can read evidence without approver authority",async()=>{
  const other=await store.loadForContext({
    requestContext:industryA1(f.principalA2,f.membershipA2),agentApprovalId:f.approvalA1
  });
  assert.ok(other);assert.equal(other.approverPrincipalId,f.principalA);
  assert.equal(other.status,"APPROVED");
  assert.equal("canApprove" in other,false);assert.equal("approvalSatisfied" in other,false);
});

test("AIAGENTAPP-PG-005 foreign Tenant and PLATFORM_GLOBAL cannot expose approval",async()=>{
  assert.equal(await store.loadForContext({requestContext:industryA1(),agentApprovalId:f.approvalB1}),null);
  const own=await store.loadForContext({requestContext:industryB1(),agentApprovalId:f.approvalB1});
  assert.ok(own);assert.equal(own.tenantId,f.tenantB);assert.equal(own.status,"EXPIRED");
  assert.equal(await store.loadForContext({requestContext:platformContext(),agentApprovalId:f.approvalA1}),null);
});

test("AIAGENTAPP-PG-006 missing, malformed, and route-mismatched reads fail safely",async()=>{
  assert.equal(await store.loadForContext({requestContext:industryA1(),agentApprovalId:f.missingApproval}),null);
  await assert.rejects(store.loadForContext({requestContext:industryA1(),agentApprovalId:"not-a-uuid"}));
  await assert.rejects(store.loadForContext({
    requestContext:{...industryA1(),dataHomeId:randomUUID()},agentApprovalId:f.approvalA1
  }));
});

test("AIAGENTAPP-PG-007 persisted approval evidence adds no current approval/resume/tool execution authority",async()=>{
  const row=await store.loadForContext({requestContext:industryA1(),agentApprovalId:f.approvalA1});
  assert.ok(row);assert.equal(row.status,"APPROVED");

  const privileges=await scoped.withContext(industryA1(),tx=>tx.query(
    `SELECT current_user AS user_name,
      has_table_privilege(current_user,'core_ai.agent_approval','SELECT') AS can_select,
      has_table_privilege(current_user,'core_ai.agent_approval','INSERT') AS can_insert,
      has_table_privilege(current_user,'core_ai.agent_approval','UPDATE') AS can_update,
      has_table_privilege(current_user,'core_ai.agent_approval','DELETE') AS can_delete`
  ));
  assert.equal(privileges.rows[0].user_name,"sbg_ai_gateway_rw");
  assert.equal(privileges.rows[0].can_select,true);assert.equal(privileges.rows[0].can_insert,true);
  assert.equal(privileges.rows[0].can_update,true);assert.equal(privileges.rows[0].can_delete,true);

  assert.equal(typeof store.create,"undefined");assert.equal(typeof store.update,"undefined");
  assert.equal(typeof store.delete,"undefined");assert.equal(typeof store.list,"undefined");
  assert.equal(typeof store.revalidateApprover,"undefined");assert.equal(typeof store.satisfyApproval,"undefined");
  assert.equal(typeof store.resumeRun,"undefined");assert.equal(typeof store.executeTool,"undefined");
});
