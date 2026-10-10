import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import pg from "pg";

import {PostgresDatabase} from "../../dist/server/database/postgres-database.js";
import {RequestScopedSql} from "../../dist/server/database/request-scoped-sql.js";
import {PostgresFormDefinitionStore} from "../../dist/server/config/postgres-form-definition-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database");

const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const role="sbg_form_definition_reader_"+randomBytes(8).toString("hex");
const password=randomBytes(24).toString("hex");
const platformCode="FORM_PLATFORM_"+randomBytes(8).toString("hex");
const f=Object.fromEntries([
  "home","tenantA","tenantB","principalA","principalB","platformService",
  "industryA1","industryA2","industryB1","createdBy","approvedBy",
  "formIndustryA1","formIndustryA2","formTenantA","formTenantB","formPlatform","missingForm",
].map((key)=>[key,randomUUID()]));

let pool,scoped,store;
function contextA(industryContextId=f.industryA1){return Object.freeze({
  requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenantA,industryContextId,
  dataHomeId:f.home,regionCode:"IN-FORM-DEF",principalId:f.principalA,principalType:"HUMAN",
  orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"TENANT_INDUSTRY",
});}
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
      VALUES ($1::uuid,$1::uuid::text,'IN-FORM-DEF','IN','SHARED','ACTIVE')`,[f.home]);
    for(const [tenantId,primaryIndustry,label] of [
      [f.tenantA,"RTL","FormDefinition tenant A"],[f.tenantB,"EDU","FormDefinition tenant B"],
    ]){
      await client.query(`INSERT INTO core_tenancy.tenant
        (id,tenant_code,legal_name,display_name,status,primary_industry_code,
         data_home_id,residency_region_code,created_at,updated_at)
        VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,'IN-FORM-DEF',now(),now())`,
        [tenantId,label,primaryIndustry,f.home]);
    }
    for(const [id,tenantId,code,primary] of [
      [f.industryA1,f.tenantA,"RTL",true],[f.industryA2,f.tenantA,"MFG",false],[f.industryB1,f.tenantB,"EDU",true],
    ]){
      await client.query(`INSERT INTO core_tenancy.industry_context
        (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
        VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`,[id,tenantId,code,primary]);
    }
    await client.query(`INSERT INTO core_config.form_definition
      (id,owner_scope,tenant_id,industry_context_id,code,version,status,schema_version,
       purpose_code,submit_operation_id,layout_schema_json,validation_rule_refs,
       localization_key_prefix,allowed_surface_classes,created_by,approved_by,
       effective_from,effective_to,created_at,updated_at)
      VALUES
      ($1,'INDUSTRY',$6,$8,'ORDER_FORM',2,'ACTIVE',3,'ORDER_CAPTURE','orders.submit',
       '{"sections":[{"id":"main","columns":2}]}'::jsonb,ARRAY['RULE_A','RULE_B']::text[],
       'forms.order',ARRAY['WEB','STAFF_MOBILE']::text[],$11,$12,
       now()-interval '10 days',now()+interval '10 days',now()-interval '20 days',now()-interval '1 day'),
      ($2,'INDUSTRY',$6,$9,'MAINT_FORM',1,'DRAFT',1,'MAINTENANCE',NULL,
       '{"raw":true}'::jsonb,ARRAY[]::text[],NULL,ARRAY['WEB']::text[],$11,NULL,
       NULL,NULL,now()-interval '8 days',now()-interval '2 days'),
      ($3,'TENANT',$6,NULL,'',3,'RETIRED',2,'','',
       '{"raw":{"empty":"","nullable":null}}'::jsonb,ARRAY['RULE_X',NULL,'RULE_X']::text[],
       '',ARRAY['WEB',NULL,'WEB']::text[],$11,NULL,
       now()+interval '5 days',now()-interval '5 days',now()-interval '12 days',now()-interval '3 days'),
      ($4,'TENANT',$7,NULL,'TENANT_B_FORM',1,'ACTIVE',1,'TENANT_B','tenant.b.submit',
       '{"tenant":"b"}'::jsonb,ARRAY['RULE_B']::text[],'tenant.b',ARRAY['USER_MOBILE']::text[],
       $11,$12,NULL,NULL,now()-interval '7 days',now()-interval '1 day'),
      ($5,'PLATFORM',NULL,NULL,$10,4,'PUBLISHED',4,'GLOBAL',NULL,
       '{"platform":true}'::jsonb,ARRAY['GLOBAL_RULE']::text[],NULL,ARRAY['WEB','DESKTOP']::text[],
       $11,$12,now()-interval '2 days',NULL,now()-interval '2 days',now()-interval '9 days')`,
      [f.formIndustryA1,f.formIndustryA2,f.formTenantA,f.formTenantB,f.formPlatform,
       f.tenantA,f.tenantB,f.industryA1,f.industryA2,platformCode,f.createdBy,f.approvedBy]);
    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
  const url=new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username=role;url.password=password;
  pool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:5000});
  scoped=new RequestScopedSql(new PostgresDatabase(pool),{dataHomeId:f.home,regionCode:"IN-FORM-DEF"});
  store=new PostgresFormDefinitionStore(scoped);
});

after(async()=>{
  if(pool) await pool.end();
  const client=await admin.connect();
  try{
    await client.query("BEGIN");
    await client.query("DELETE FROM core_config.form_definition WHERE id=ANY($1::uuid[])",
      [[f.formIndustryA1,f.formIndustryA2,f.formTenantA,f.formTenantB,f.formPlatform]]);
    await client.query("DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1,f.industryA2,f.industryB1]]);
    await client.query("DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",[[f.tenantA,f.tenantB]]);
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
    await client.query("DROP ROLE IF EXISTS "+role);
    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();await admin.end();}
});

test("FORMDEF-PG-001 exact Industry FormDefinition preserves immutable raw parent evidence",async()=>{
  const row=await store.loadForContext({requestContext:contextA(),formDefinitionId:f.formIndustryA1});
  assert.ok(row);assert.equal(row.ownerScope,"INDUSTRY");assert.equal(row.tenantId,f.tenantA);
  assert.equal(row.industryContextId,f.industryA1);assert.equal(row.code,"ORDER_FORM");
  assert.equal(row.version,2);assert.equal(row.status,"ACTIVE");assert.equal(row.schemaVersion,3);
  assert.equal(row.purposeCode,"ORDER_CAPTURE");assert.equal(row.submitOperationId,"orders.submit");
  assert.deepEqual(row.layoutSchema,{sections:[{columns:2,id:"main"}]});
  assert.deepEqual(row.validationRuleRefs,["RULE_A","RULE_B"]);
  assert.equal(row.localizationKeyPrefix,"forms.order");
  assert.deepEqual(row.allowedSurfaceClasses,["WEB","STAFF_MOBILE"]);
  assert.equal(row.createdBy,f.createdBy);assert.equal(row.approvedBy,f.approvedBy);
  assert.equal(Object.isFrozen(row),true);assert.equal(Object.isFrozen(row.layoutSchema),true);
  assert.equal(Object.isFrozen(row.validationRuleRefs),true);assert.equal(Object.isFrozen(row.allowedSurfaceClasses),true);
  assert.equal("fields" in row,false);assert.equal("selected" in row,false);assert.equal("rendered" in row,false);
  assert.equal("validated" in row,false);assert.equal("submitted" in row,false);
});

test("FORMDEF-PG-002 sibling Industry FormDefinition is hidden",async()=>{
  assert.equal(await store.loadForContext({requestContext:contextA(),formDefinitionId:f.formIndustryA2}),null);
  const sibling=await store.loadForContext({requestContext:contextA(f.industryA2),formDefinitionId:f.formIndustryA2});
  assert.ok(sibling);assert.equal(sibling.industryContextId,f.industryA2);assert.equal(sibling.status,"DRAFT");
});

test("FORMDEF-PG-003 Tenant FormDefinition is same-Tenant visible and raw arrays/text/timestamps stay raw",async()=>{
  const fromIndustry=await store.loadForContext({requestContext:contextA(),formDefinitionId:f.formTenantA});
  const fromTenant=await store.loadForContext({requestContext:tenantCoreA(),formDefinitionId:f.formTenantA});
  assert.ok(fromIndustry);assert.ok(fromTenant);
  assert.equal(fromIndustry.ownerScope,"TENANT");assert.equal(fromIndustry.industryContextId,undefined);
  assert.equal(fromIndustry.code,"");assert.equal(fromIndustry.purposeCode,"");assert.equal(fromIndustry.submitOperationId,"");
  assert.equal(fromIndustry.localizationKeyPrefix,"");
  assert.deepEqual(fromIndustry.validationRuleRefs,["RULE_X",null,"RULE_X"]);
  assert.deepEqual(fromIndustry.allowedSurfaceClasses,["WEB",null,"WEB"]);
  assert.deepEqual(fromIndustry.layoutSchema,{raw:{empty:"",nullable:null}});
  assert.equal(fromIndustry.approvedBy,undefined);
  assert.ok(Date.parse(fromIndustry.effectiveTo)<Date.parse(fromIndustry.effectiveFrom));
  assert.equal(fromTenant.id,f.formTenantA);
});

test("FORMDEF-PG-004 PLATFORM FormDefinition is not Tenant fallback and needs PLATFORM_GLOBAL",async()=>{
  assert.equal(await store.loadForContext({requestContext:tenantCoreA(),formDefinitionId:f.formPlatform}),null);
  const platform=await store.loadForContext({requestContext:platformContext(),formDefinitionId:f.formPlatform});
  assert.ok(platform);assert.equal(platform.ownerScope,"PLATFORM");assert.equal(platform.status,"PUBLISHED");
  assert.equal(platform.submitOperationId,undefined);assert.equal(platform.localizationKeyPrefix,undefined);
  assert.equal(platform.effectiveTo,undefined);assert.ok(Date.parse(platform.updatedAt)<Date.parse(platform.createdAt));
});

test("FORMDEF-PG-005 foreign Tenant FormDefinition is hidden",async()=>{
  assert.equal(await store.loadForContext({requestContext:tenantCoreA(),formDefinitionId:f.formTenantB}),null);
  const own=await store.loadForContext({requestContext:tenantCoreB(),formDefinitionId:f.formTenantB});
  assert.ok(own);assert.equal(own.tenantId,f.tenantB);assert.equal(own.submitOperationId,"tenant.b.submit");
});

test("FORMDEF-PG-006 missing, malformed, and route-mismatched reads fail safely",async()=>{
  assert.equal(await store.loadForContext({requestContext:tenantCoreA(),formDefinitionId:f.missingForm}),null);
  await assert.rejects(store.loadForContext({requestContext:tenantCoreA(),formDefinitionId:"not-a-uuid"}));
  await assert.rejects(store.loadForContext({
    requestContext:{...tenantCoreA(),dataHomeId:randomUUID()},formDefinitionId:f.formTenantA,
  }));
});

test("FORMDEF-PG-007 raw form evidence adds no field/render/validation/submit authority and role privileges remain schema-owned",async()=>{
  const privileges=await scoped.withContext(platformContext(),(tx)=>tx.query(
    `SELECT current_user AS user_name,
      has_table_privilege(current_user,'core_config.form_definition','SELECT') AS can_select,
      has_table_privilege(current_user,'core_config.form_definition','INSERT') AS can_insert,
      has_table_privilege(current_user,'core_config.form_definition','UPDATE') AS can_update,
      has_table_privilege(current_user,'core_config.form_definition','DELETE') AS can_delete`));
  assert.equal(privileges.rowCount,1);assert.equal(privileges.rows[0].user_name,"sbg_app_rw");
  assert.equal(privileges.rows[0].can_select,true);assert.equal(privileges.rows[0].can_insert,true);
  assert.equal(privileges.rows[0].can_update,true);assert.equal(privileges.rows[0].can_delete,true);
  assert.equal(typeof store.create,"undefined");assert.equal(typeof store.update,"undefined");
  assert.equal(typeof store.delete,"undefined");assert.equal(typeof store.selectActive,"undefined");
  assert.equal(typeof store.listFields,"undefined");assert.equal(typeof store.compile,"undefined");
  assert.equal(typeof store.render,"undefined");assert.equal(typeof store.validate,"undefined");
  assert.equal(typeof store.submit,"undefined");
});
