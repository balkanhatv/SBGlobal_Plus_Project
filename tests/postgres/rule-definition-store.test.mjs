import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresRuleDefinitionStore } from "../../dist/server/config/postgres-rule-definition-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database");

const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const role="sbg_rule_definition_reader_"+randomBytes(8).toString("hex");
const password=randomBytes(24).toString("hex");
const platformCode="RULE_PLATFORM_"+randomBytes(8).toString("hex");
const f=Object.fromEntries([
  "home","tenantA","tenantB","principalA","principalB","platformService",
  "industryA1","industryA2","industryB1","createdBy","approvedBy",
  "ruleIndustryA1","ruleIndustryA2","ruleTenantA","ruleTenantB","rulePlatform","missingRule",
].map((key)=>[key,randomUUID()]));

let pool,scoped,store;

function contextA(industryContextId=f.industryA1){
  return Object.freeze({
    requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenantA,industryContextId,
    dataHomeId:f.home,regionCode:"IN-RULE-DEF",principalId:f.principalA,principalType:"HUMAN",
    orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"TENANT_INDUSTRY",
  });
}
function tenantCoreA(){return Object.freeze({...contextA(),industryContextId:undefined,scopeClass:"TENANT_CORE"});}
function tenantCoreB(){return Object.freeze({...contextA(),tenantId:f.tenantB,industryContextId:undefined,principalId:f.principalB,scopeClass:"TENANT_CORE"});}
function platformContext(){return Object.freeze({
  requestId:randomUUID(),correlationId:randomUUID(),principalId:f.platformService,principalType:"SERVICE",
  orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"PLATFORM_GLOBAL",
});}

before(async()=>{
  const client=await admin.connect();
  try{
    await client.query("BEGIN");
    await client.query("CREATE ROLE "+role+" LOGIN PASSWORD '"+password+"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS");
    await client.query("GRANT sbg_app_rw TO "+role);
    await client.query(`INSERT INTO platform_directory.data_home
      (id,code,region_code,jurisdiction_code,topology_class,status)
      VALUES ($1::uuid,$1::uuid::text,'IN-RULE-DEF','IN','SHARED','ACTIVE')`,[f.home]);

    for(const [tenantId,primaryIndustry,label] of [
      [f.tenantA,"RTL","RuleDefinition tenant A"],[f.tenantB,"EDU","RuleDefinition tenant B"],
    ]){
      await client.query(`INSERT INTO core_tenancy.tenant
        (id,tenant_code,legal_name,display_name,status,primary_industry_code,
         data_home_id,residency_region_code,created_at,updated_at)
        VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,'IN-RULE-DEF',now(),now())`,
        [tenantId,label,primaryIndustry,f.home]);
    }

    for(const [id,tenantId,code,primary] of [
      [f.industryA1,f.tenantA,"RTL",true],[f.industryA2,f.tenantA,"MFG",false],[f.industryB1,f.tenantB,"EDU",true],
    ]){
      await client.query(`INSERT INTO core_tenancy.industry_context
        (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
        VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`,[id,tenantId,code,primary]);
    }

    await client.query(`INSERT INTO core_config.rule_definition
      (id,owner_scope,tenant_id,industry_context_id,code,version,status,schema_version,
       input_schema_json,condition_ast_json,decision_json,priority,safety_class,
       required_permission,created_by,approved_by,effective_from,effective_to,created_at,updated_at)
      VALUES
      ($1,'INDUSTRY',$6,$8,'ORDER_RULE',2,'ACTIVE',3,
       '{"type":"object","properties":{"total":{"type":"number"}}}'::jsonb,
       '{"op":"gte","left":"total","right":100}'::jsonb,'{"action":"REVIEW"}'::jsonb,
       5,'BUSINESS','order.review',$11,$12,now()-interval '10 days',now()+interval '10 days',
       now()-interval '20 days',now()-interval '1 day'),
      ($2,'INDUSTRY',$6,$9,'MAINT_RULE',1,'DRAFT',1,'{}'::jsonb,
       '{"always":true}'::jsonb,'{"decision":"ALLOW"}'::jsonb,0,'VALIDATION',NULL,$11,NULL,
       NULL,NULL,now()-interval '8 days',now()-interval '2 days'),
      ($3,'TENANT',$6,NULL,'',3,'RETIRED',2,
       '{"raw":{"empty":"","nullable":null}}'::jsonb,'{"raw":["x",""]}'::jsonb,
       '{"raw":{"nested":true}}'::jsonb,-7,'CONFIGURATION','',$11,NULL,
       now()+interval '5 days',now()-interval '5 days',now()-interval '12 days',now()-interval '3 days'),
      ($4,'TENANT',$7,NULL,'TENANT_B_RULE',1,'ACTIVE',1,'{}'::jsonb,'{}'::jsonb,
       '{"tenant":"b"}'::jsonb,100,'BUSINESS','tenant.rule',$11,$12,NULL,NULL,
       now()-interval '7 days',now()-interval '1 day'),
      ($5,'PLATFORM',NULL,NULL,$10,4,'PUBLISHED',4,'{"platform":true}'::jsonb,
       '{"platform":true}'::jsonb,'{"platform":true}'::jsonb,42,'VALIDATION',NULL,$11,$12,
       now()-interval '2 days',NULL,now()-interval '2 days',now()-interval '9 days')`,
      [f.ruleIndustryA1,f.ruleIndustryA2,f.ruleTenantA,f.ruleTenantB,f.rulePlatform,
       f.tenantA,f.tenantB,f.industryA1,f.industryA2,platformCode,f.createdBy,f.approvedBy]);

    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username=role;url.password=password;
  pool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:5000});
  scoped=new RequestScopedSql(new PostgresDatabase(pool),{dataHomeId:f.home,regionCode:"IN-RULE-DEF"});
  store=new PostgresRuleDefinitionStore(scoped);
});

after(async()=>{
  if(pool) await pool.end();
  const client=await admin.connect();
  try{
    await client.query("BEGIN");
    await client.query("DELETE FROM core_config.rule_definition WHERE id=ANY($1::uuid[])",
      [[f.ruleIndustryA1,f.ruleIndustryA2,f.ruleTenantA,f.ruleTenantB,f.rulePlatform]]);
    await client.query("DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1,f.industryA2,f.industryB1]]);
    await client.query("DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",[[f.tenantA,f.tenantB]]);
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
    await client.query("DROP ROLE IF EXISTS "+role);
    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();await admin.end();}
});

test("RULEDEF-PG-001 exact Industry RuleDefinition preserves immutable raw evidence",async()=>{
  const row=await store.loadForContext({requestContext:contextA(),ruleDefinitionId:f.ruleIndustryA1});
  assert.ok(row);
  assert.equal(row.id,f.ruleIndustryA1);
  assert.equal(row.ownerScope,"INDUSTRY");
  assert.equal(row.tenantId,f.tenantA);
  assert.equal(row.industryContextId,f.industryA1);
  assert.equal(row.code,"ORDER_RULE");
  assert.equal(row.version,2);
  assert.equal(row.status,"ACTIVE");
  assert.equal(row.schemaVersion,3);
  assert.equal(row.priority,5);
  assert.equal(row.safetyClass,"BUSINESS");
  assert.equal(row.requiredPermission,"order.review");
  assert.equal(row.createdBy,f.createdBy);
  assert.equal(row.approvedBy,f.approvedBy);
  assert.deepEqual(row.conditionAst,{left:"total",op:"gte",right:100});
  assert.deepEqual(row.decision,{action:"REVIEW"});
  assert.equal(Object.isFrozen(row),true);
  assert.equal(Object.isFrozen(row.inputSchema),true);
  assert.equal(Object.isFrozen(row.conditionAst),true);
  assert.equal(Object.isFrozen(row.decision),true);
  assert.equal("selected" in row,false);
  assert.equal("evaluated" in row,false);
  assert.equal("authorized" in row,false);
  assert.equal("applied" in row,false);
});

test("RULEDEF-PG-002 sibling Industry RuleDefinition is hidden",async()=>{
  assert.equal(await store.loadForContext({requestContext:contextA(),ruleDefinitionId:f.ruleIndustryA2}),null);
  const sibling=await store.loadForContext({requestContext:contextA(f.industryA2),ruleDefinitionId:f.ruleIndustryA2});
  assert.ok(sibling);assert.equal(sibling.industryContextId,f.industryA2);assert.equal(sibling.status,"DRAFT");
});

test("RULEDEF-PG-003 Tenant RuleDefinition is same-Tenant visible and raw values stay raw",async()=>{
  const fromIndustry=await store.loadForContext({requestContext:contextA(),ruleDefinitionId:f.ruleTenantA});
  const fromTenant=await store.loadForContext({requestContext:tenantCoreA(),ruleDefinitionId:f.ruleTenantA});
  assert.ok(fromIndustry);assert.ok(fromTenant);
  assert.equal(fromIndustry.ownerScope,"TENANT");
  assert.equal(fromIndustry.industryContextId,undefined);
  assert.equal(fromIndustry.code,"");
  assert.equal(fromIndustry.priority,-7);
  assert.equal(fromIndustry.safetyClass,"CONFIGURATION");
  assert.equal(fromIndustry.requiredPermission,"");
  assert.deepEqual(fromIndustry.inputSchema,{raw:{empty:"",nullable:null}});
  assert.deepEqual(fromIndustry.conditionAst,{raw:["x",""]});
  assert.deepEqual(fromIndustry.decision,{raw:{nested:true}});
  assert.equal(fromIndustry.approvedBy,undefined);
  assert.ok(Date.parse(fromIndustry.effectiveTo)<Date.parse(fromIndustry.effectiveFrom));
  assert.equal(fromTenant.id,f.ruleTenantA);
});

test("RULEDEF-PG-004 PLATFORM RuleDefinition is not Tenant fallback and needs PLATFORM_GLOBAL",async()=>{
  assert.equal(await store.loadForContext({requestContext:tenantCoreA(),ruleDefinitionId:f.rulePlatform}),null);
  const platform=await store.loadForContext({requestContext:platformContext(),ruleDefinitionId:f.rulePlatform});
  assert.ok(platform);assert.equal(platform.ownerScope,"PLATFORM");assert.equal(platform.status,"PUBLISHED");
  assert.equal(platform.safetyClass,"VALIDATION");assert.equal(platform.effectiveTo,undefined);
  assert.ok(Date.parse(platform.updatedAt)<Date.parse(platform.createdAt));
});

test("RULEDEF-PG-005 foreign Tenant RuleDefinition is hidden",async()=>{
  assert.equal(await store.loadForContext({requestContext:tenantCoreA(),ruleDefinitionId:f.ruleTenantB}),null);
  const own=await store.loadForContext({requestContext:tenantCoreB(),ruleDefinitionId:f.ruleTenantB});
  assert.ok(own);assert.equal(own.tenantId,f.tenantB);assert.equal(own.requiredPermission,"tenant.rule");
});

test("RULEDEF-PG-006 missing, malformed, and route-mismatched reads fail safely",async()=>{
  assert.equal(await store.loadForContext({requestContext:tenantCoreA(),ruleDefinitionId:f.missingRule}),null);
  await assert.rejects(store.loadForContext({requestContext:tenantCoreA(),ruleDefinitionId:"not-a-uuid"}));
  await assert.rejects(store.loadForContext({
    requestContext:{...tenantCoreA(),dataHomeId:randomUUID()},ruleDefinitionId:f.ruleTenantA,
  }));
});

test("RULEDEF-PG-007 raw rule evidence adds no selection/evaluation/authorization/application authority and role DML remains schema-owned",async()=>{
  const privileges=await scoped.withContext(platformContext(),(tx)=>tx.query(
    `SELECT current_user AS user_name,
      has_table_privilege(current_user,'core_config.rule_definition','SELECT') AS can_select,
      has_table_privilege(current_user,'core_config.rule_definition','INSERT') AS can_insert,
      has_table_privilege(current_user,'core_config.rule_definition','UPDATE') AS can_update,
      has_table_privilege(current_user,'core_config.rule_definition','DELETE') AS can_delete`));
  assert.equal(privileges.rowCount,1);
  assert.equal(privileges.rows[0].user_name,"sbg_app_rw");
  assert.equal(privileges.rows[0].can_select,true);
  assert.equal(privileges.rows[0].can_insert,true);
  assert.equal(privileges.rows[0].can_update,true);
  assert.equal(privileges.rows[0].can_delete,true);
  assert.equal(typeof store.create,"undefined");
  assert.equal(typeof store.update,"undefined");
  assert.equal(typeof store.delete,"undefined");
  assert.equal(typeof store.selectActive,"undefined");
  assert.equal(typeof store.resolveEffective,"undefined");
  assert.equal(typeof store.evaluate,"undefined");
  assert.equal(typeof store.authorize,"undefined");
  assert.equal(typeof store.apply,"undefined");
});
