import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresAIGatewayDatabase } from "../../dist/server/database/postgres-ai-gateway-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAIMemoryRecordStore } from "../../dist/server/ai/postgres-ai-memory-record-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);

const admin = new pg.Pool({ connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1 });
const role = "sbg_ai_memory_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const serviceCode = "ai-memory-reader-" + randomBytes(8).toString("hex");

const f = Object.fromEntries([
  "home","tenantA","tenantB","principalA","principalA2","principalB","platformService",
  "membershipA","membershipA2","membershipB","industryA1","industryA2","industryB1",
  "memoryOldA1","memoryCurrentA1","memoryIndustryA2","memorySharedA1","memoryTenantA",
  "memoryTenantB","missingMemory"
].map((key)=>[key,randomUUID()]));

let pool;
let scoped;
let store;

function tenantCoreA(principalId=f.principalA,membershipId=f.membershipA){
  return Object.freeze({
    requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenantA,
    dataHomeId:f.home,regionCode:"IN-AI-MEMORY",principalId,principalType:"HUMAN",
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
      VALUES ($1::uuid,$1::uuid::text,'IN-AI-MEMORY','IN','SHARED','ACTIVE')`,[f.home]);

    for(const [tenantId,industry,label] of [
      [f.tenantA,"RTL","AI Memory tenant A"],[f.tenantB,"EDU","AI Memory tenant B"]
    ]){
      await client.query(`INSERT INTO core_tenancy.tenant
        (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
        VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,'IN-AI-MEMORY',now(),now())`,
        [tenantId,label,industry,f.home]);
    }

    for(const [principalId,type,label,svc,module] of [
      [f.principalA,"HUMAN","AI Memory principal A",null,null],
      [f.principalA2,"HUMAN","AI Memory principal A2",null,null],
      [f.principalB,"HUMAN","AI Memory principal B",null,null],
      [f.platformService,"SERVICE","AI Memory platform service",serviceCode,"AI"]
    ]){
      await client.query(`INSERT INTO core_identity.platform_principal
        (id,principal_type,status,display_name,service_code,owning_module,created_at,updated_at)
        VALUES ($1,$2,'ACTIVE',$3,$4,$5,now(),now())`,[principalId,type,label,svc,module]);
    }

    for(const [membershipId,tenantId,principalId] of [
      [f.membershipA,f.tenantA,f.principalA],[f.membershipA2,f.tenantA,f.principalA2],[f.membershipB,f.tenantB,f.principalB]
    ]){
      await client.query(`INSERT INTO core_identity.tenant_membership
        (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
        VALUES ($1,$2,$3,'ACTIVE',1,now(),now())`,[membershipId,tenantId,principalId]);
    }

    for(const [id,tenantId,code,primary] of [
      [f.industryA1,f.tenantA,"RTL",true],[f.industryA2,f.tenantA,"MFG",false],[f.industryB1,f.tenantB,"EDU",true]
    ]){
      await client.query(`INSERT INTO core_tenancy.industry_context
        (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
        VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`,[id,tenantId,code,primary]);
    }

    await client.query(`INSERT INTO core_ai.ai_memory_record
      (id,tenant_id,industry_context_id,principal_id,assistant_definition_id,memory_class,
       content_ref_or_encrypted_content,source_ref,sensitivity_class,retention_class,
       acl_policy_ref,status,created_at,expires_at,supersedes_id)
      VALUES
      ($1,$7,$9,$8,NULL,'WORKING_CONTEXT','enc://old','source://old','CONFIDENTIAL','',
       'acl://principal-a','SUPERSEDED','2026-01-01T00:00:00Z','2027-01-01T00:00:00Z',NULL),
      ($2,$7,$9,$8,NULL,'WORKING_CONTEXT','enc://current','source://current','REGULATED','LONG',
       'acl://principal-a','ACTIVE','2026-02-01T00:00:00Z','2027-02-01T00:00:00Z',$1),
      ($3,$7,$10,$8,NULL,'SESSION','industry-a2',NULL,'INTERNAL','SESSION',
       NULL,'ACTIVE','2026-03-01T00:00:00Z',NULL,NULL),
      ($4,$7,$9,NULL,NULL,'INDUSTRY_KNOWLEDGE','shared-industry',NULL,'PUBLIC','KNOWLEDGE',
       'acl://shared','EXPIRED','2025-01-01T00:00:00Z','2026-01-01T00:00:00Z',NULL),
      ($5,$7,NULL,$8,NULL,'USER_PREFERENCE','','','SENSITIVE_PERSONAL','',
       NULL,'ERASED','2026-04-01T00:00:00Z',NULL,NULL),
      ($6,$11,$12,$13,NULL,'INDUSTRY_KNOWLEDGE','tenant-b',NULL,'REGULATED','KNOWLEDGE',
       NULL,'ACTIVE','2026-05-01T00:00:00Z',NULL,NULL)`,
      [f.memoryOldA1,f.memoryCurrentA1,f.memoryIndustryA2,f.memorySharedA1,f.memoryTenantA,f.memoryTenantB,
       f.tenantA,f.principalA,f.industryA1,f.industryA2,f.tenantB,f.industryB1,f.principalB]);

    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL); url.username=role; url.password=password;
  pool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:5000});
  scoped=new RequestScopedSql(new PostgresAIGatewayDatabase(pool),{dataHomeId:f.home,regionCode:"IN-AI-MEMORY"});
  store=new PostgresAIMemoryRecordStore(scoped);
});

after(async()=>{
  if(pool) await pool.end();
  const client=await admin.connect();
  try{
    await client.query("BEGIN");
    await client.query("DELETE FROM core_ai.ai_memory_record WHERE id=ANY($1::uuid[])",[[
      f.memoryCurrentA1,f.memoryOldA1,f.memoryIndustryA2,f.memorySharedA1,f.memoryTenantA,f.memoryTenantB
    ]]);
    await client.query("DELETE FROM core_identity.tenant_membership WHERE id=ANY($1::uuid[])",[[f.membershipA,f.membershipA2,f.membershipB]]);
    await client.query("DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",[[f.industryA1,f.industryA2,f.industryB1]]);
    await client.query("DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",[[f.principalA,f.principalA2,f.principalB,f.platformService]]);
    await client.query("DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",[[f.tenantA,f.tenantB]]);
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
    await client.query("DROP ROLE IF EXISTS "+role);
    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();await admin.end();}
});

test("AIMEM-PG-001 exact principal-owned Industry memory preserves immutable raw evidence",async()=>{
  const row=await store.loadForContext({requestContext:industryA1(),memoryRecordId:f.memoryCurrentA1});
  assert.ok(row);
  assert.equal(row.id,f.memoryCurrentA1);
  assert.equal(row.tenantId,f.tenantA);
  assert.equal(row.industryContextId,f.industryA1);
  assert.equal(row.principalId,f.principalA);
  assert.equal(row.assistantDefinitionId,undefined);
  assert.equal(row.memoryClass,"WORKING_CONTEXT");
  assert.equal(row.contentRefOrEncryptedContent,"enc://current");
  assert.equal(row.sourceRef,"source://current");
  assert.equal(row.sensitivityClass,"REGULATED");
  assert.equal(row.retentionClass,"LONG");
  assert.equal(row.aclPolicyRef,"acl://principal-a");
  assert.equal(row.status,"ACTIVE");
  assert.equal(row.supersedesId,f.memoryOldA1);
  assert.equal(Object.isFrozen(row),true);
  assert.equal("current" in row,false);
  assert.equal("authorized" in row,false);
  assert.equal("decryptedContent" in row,false);
});

test("AIMEM-PG-002 sibling Industry cannot expose Industry memory",async()=>{
  assert.equal(await store.loadForContext({requestContext:industryA2(),memoryRecordId:f.memoryCurrentA1}),null);
  assert.ok(await store.loadForContext({requestContext:industryA1(),memoryRecordId:f.memoryCurrentA1}));
});

test("AIMEM-PG-003 principal-owned memory is private while null-principal memory is scope-shared",async()=>{
  assert.equal(await store.loadForContext({
    requestContext:industryA1(f.principalA2,f.membershipA2),memoryRecordId:f.memoryCurrentA1
  }),null);
  const shared=await store.loadForContext({
    requestContext:industryA1(f.principalA2,f.membershipA2),memoryRecordId:f.memorySharedA1
  });
  assert.ok(shared);
  assert.equal(shared.principalId,undefined);
  assert.equal(shared.memoryClass,"INDUSTRY_KNOWLEDGE");
  assert.equal(shared.status,"EXPIRED");
  assert.equal(shared.expiresAt,"2026-01-01T00:00:00.000Z");
});

test("AIMEM-PG-004 Tenant-Core raw row is same-principal visible from Core and Industry without becoming automatic history carry",async()=>{
  const fromCore=await store.loadForContext({requestContext:tenantCoreA(),memoryRecordId:f.memoryTenantA});
  const fromIndustry=await store.loadForContext({requestContext:industryA1(),memoryRecordId:f.memoryTenantA});
  assert.ok(fromCore);
  assert.ok(fromIndustry);
  assert.equal(fromCore.industryContextId,undefined);
  assert.equal(fromCore.contentRefOrEncryptedContent,"");
  assert.equal(fromCore.sourceRef,"");
  assert.equal(fromCore.retentionClass,"");
  assert.equal(fromCore.status,"ERASED");
  assert.equal(typeof store.listHistory,"undefined");
  assert.equal(typeof store.carryAcrossContext,"undefined");
});

test("AIMEM-PG-005 foreign Tenant and PLATFORM_GLOBAL cannot bypass MemoryRecord RLS",async()=>{
  assert.equal(await store.loadForContext({requestContext:industryA1(),memoryRecordId:f.memoryTenantB}),null);
  assert.ok(await store.loadForContext({requestContext:industryB1(),memoryRecordId:f.memoryTenantB}));
  assert.equal(await store.loadForContext({requestContext:platformContext(),memoryRecordId:f.memoryCurrentA1}),null);
});

test("AIMEM-PG-006 missing, malformed, and route-mismatched reads fail safely",async()=>{
  assert.equal(await store.loadForContext({requestContext:industryA1(),memoryRecordId:f.missingMemory}),null);
  await assert.rejects(store.loadForContext({requestContext:industryA1(),memoryRecordId:"not-a-uuid"}));
  await assert.rejects(store.loadForContext({
    requestContext:{...industryA1(),dataHomeId:randomUUID()},memoryRecordId:f.memoryCurrentA1
  }));
});

test("AIMEM-PG-007 raw memory lifecycle/ACL/supersession evidence adds no current/retrieval/retention/execution authority",async()=>{
  const old=await store.loadForContext({requestContext:industryA1(),memoryRecordId:f.memoryOldA1});
  const current=await store.loadForContext({requestContext:industryA1(),memoryRecordId:f.memoryCurrentA1});
  assert.ok(old); assert.ok(current);
  assert.equal(old.status,"SUPERSEDED");
  assert.equal(current.status,"ACTIVE");
  assert.equal(current.supersedesId,f.memoryOldA1);

  const privileges=await scoped.withContext(industryA1(),tx=>tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_ai.ai_memory_record','SELECT') AS can_select,
            has_table_privilege(current_user,'core_ai.ai_memory_record','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_ai.ai_memory_record','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_ai.ai_memory_record','DELETE') AS can_delete`
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
  assert.equal(typeof store.resolveSupersession,"undefined");
  assert.equal(typeof store.evaluateAcl,"undefined");
  assert.equal(typeof store.decrypt,"undefined");
  assert.equal(typeof store.applyRetention,"undefined");
  assert.equal(typeof store.execute,"undefined");
});
