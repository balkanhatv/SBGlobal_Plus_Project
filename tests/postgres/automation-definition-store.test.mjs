import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresWorkflowDatabase } from "../../dist/server/database/postgres-workflow-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresAutomationDefinitionStore,
} from "../../dist/server/workflow/postgres-automation-definition-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);

const admin = new pg.Pool({connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1});
const role = "sbg_automation_definition_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "home","tenantA","tenantB","principalA","principalB","platformService",
  "membershipA","membershipB","industryA1","industryA2","industryB1",
  "industryDefA1","industryDefA2","tenantDefA","tenantDefB","platformDef",
].map((key) => [key, randomUUID()]));

let pool;
let store;

function contextA(industryContextId = f.industryA1) {
  return Object.freeze({
    requestId: randomUUID(), correlationId: randomUUID(), tenantId: f.tenantA,
    industryContextId, dataHomeId: f.home, regionCode: "IN-AUTOMATION-DEFINITION",
    principalId: f.principalA, principalType: "HUMAN", membershipId: f.membershipA,
    orgUnitPath: Object.freeze([]), roleIds: Object.freeze([]), scopeClass: "TENANT_INDUSTRY",
  });
}
function tenantCoreA() { return Object.freeze({...contextA(), industryContextId: undefined, scopeClass: "TENANT_CORE"}); }
function tenantCoreB() { return Object.freeze({...contextA(), tenantId: f.tenantB, industryContextId: undefined, principalId: f.principalB, membershipId: f.membershipB, scopeClass: "TENANT_CORE"}); }
function platformContext() {
  return Object.freeze({
    requestId: randomUUID(), correlationId: randomUUID(), principalId: f.platformService,
    principalType: "SERVICE", orgUnitPath: Object.freeze([]), roleIds: Object.freeze([]),
    scopeClass: "PLATFORM_GLOBAL",
  });
}

before(async () => {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query("CREATE ROLE " + role + " LOGIN PASSWORD '" + password + "' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS");
    await client.query("GRANT sbg_workflow_worker_rw TO " + role);
    await client.query(`INSERT INTO platform_directory.data_home
      (id,code,region_code,jurisdiction_code,topology_class,status)
      VALUES ($1,$1::text,'IN-AUTOMATION-DEFINITION','IN','SHARED','ACTIVE')`, [f.home]);

    for (const [tenantId, industry, label] of [[f.tenantA,"RTL","Automation A"],[f.tenantB,"EDU","Automation B"]]) {
      await client.query(`INSERT INTO core_tenancy.tenant
        (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
        VALUES ($1,$1::text,$2,$2,'ACTIVE',$3,$4,'IN-AUTOMATION-DEFINITION',now(),now())`,
        [tenantId,label,industry,f.home]);
    }
    for (const [id,type,label,serviceCode,module] of [
      [f.principalA,"HUMAN","Automation principal A",null,null],
      [f.principalB,"HUMAN","Automation principal B",null,null],
      [f.platformService,"SERVICE","Automation platform service","automation-reader","Automation"],
    ]) {
      await client.query(`INSERT INTO core_identity.platform_principal
        (id,principal_type,status,display_name,service_code,owning_module,created_at,updated_at)
        VALUES ($1,$2,'ACTIVE',$3,$4,$5,now(),now())`, [id,type,label,serviceCode,module]);
    }
    for (const [id,tenant,principal] of [[f.membershipA,f.tenantA,f.principalA],[f.membershipB,f.tenantB,f.principalB]]) {
      await client.query(`INSERT INTO core_identity.tenant_membership
        (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
        VALUES ($1,$2,$3,'ACTIVE',1,now(),now())`, [id,tenant,principal]);
    }
    for (const [id,tenant,code,primary] of [
      [f.industryA1,f.tenantA,"RTL",true],[f.industryA2,f.tenantA,"MFG",false],[f.industryB1,f.tenantB,"EDU",true],
    ]) {
      await client.query(`INSERT INTO core_tenancy.industry_context
        (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
        VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`, [id,tenant,code,primary]);
    }

    await client.query(`INSERT INTO core_workflow.automation_definition
      (id,owner_scope,tenant_id,industry_context_id,code,version,status,schema_version,
       trigger_type,trigger_config_json,condition_rule_ref,operation_contract_id,
       workflow_definition_id,config_json,created_by,approved_by,effective_from,effective_to,created_at,updated_at)
      VALUES
      ($1,'INDUSTRY',$6,$8,'ORDER_EVENT',2,'ACTIVE',3,'EVENT',
       '{"eventType":"order.created","version":1}'::jsonb,'rule.order.ready','core.order.process',NULL,
       '{"mode":"raw","enabled":true}'::jsonb,$10,$10,now()-interval '2 days',NULL,now()-interval '5 days',now()-interval '1 day'),
      ($2,'INDUSTRY',$6,$9,'MAINT_SCHEDULE',1,'DRAFT',1,'SCHEDULE',
       '{"cron":"raw-unparsed"}'::jsonb,NULL,'',NULL,'{}'::jsonb,$10,NULL,NULL,NULL,now()-interval '4 days',now()-interval '3 days'),
      ($3,'TENANT',$6,NULL,'',4,'RETIRED',2,'MANUAL','{}'::jsonb,'',NULL,NULL,
       '{"raw":[1,true,null]}'::jsonb,$10,$10,NULL,now()-interval '1 day',now()-interval '9 days',now()-interval '2 days'),
      ($4,'TENANT',$7,NULL,'TENANT_B_AUTO',1,'ACTIVE',1,'MANUAL','{}'::jsonb,NULL,'tenant.b.op',NULL,
       '{}'::jsonb,$11,$11,NULL,NULL,now()-interval '3 days',now()-interval '1 day'),
      ($5,'PLATFORM',NULL,NULL,'PLATFORM_AUTO',1,'PUBLISHED',1,'EVENT','{"topic":"platform"}'::jsonb,NULL,'platform.op',NULL,
       '{"platform":true}'::jsonb,$12,$12,NULL,NULL,now()-interval '20 days',now()-interval '30 days')`,
      [f.industryDefA1,f.industryDefA2,f.tenantDefA,f.tenantDefB,f.platformDef,
       f.tenantA,f.tenantB,f.industryA1,f.industryA2,f.principalA,f.principalB,f.platformService]);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK"); throw error;
  } finally { client.release(); }

  const url = new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username = role; url.password = password;
  pool = new pg.Pool({connectionString: url.toString(), max: 1, connectionTimeoutMillis: 5000});
  store = new PostgresAutomationDefinitionStore(new RequestScopedSql(
    new PostgresWorkflowDatabase(pool),
    {dataHomeId: f.home, regionCode: "IN-AUTOMATION-DEFINITION"},
  ));
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM core_workflow.automation_definition WHERE id=ANY($1::uuid[])", [[f.industryDefA1,f.industryDefA2,f.tenantDefA,f.tenantDefB,f.platformDef]]);
    await client.query("DELETE FROM core_identity.tenant_membership WHERE id=ANY($1::uuid[])", [[f.membershipA,f.membershipB]]);
    await client.query("DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])", [[f.industryA1,f.industryA2,f.industryB1]]);
    await client.query("DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])", [[f.principalA,f.principalB,f.platformService]]);
    await client.query("DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])", [[f.tenantA,f.tenantB]]);
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1", [f.home]);
    await client.query("DROP ROLE IF EXISTS " + role);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); await admin.end(); }
});

test("WFA-DEF-PG-001 exact Industry definition preserves raw trigger/config/reference evidence", async () => {
  const row = await store.loadForContext({requestContext: contextA(), automationDefinitionId: f.industryDefA1});
  assert.ok(row);
  assert.equal(row.ownerScope,"INDUSTRY");
  assert.equal(row.triggerType,"EVENT");
  assert.deepEqual(row.triggerConfig,{eventType:"order.created",version:1});
  assert.equal(row.conditionRuleRef,"rule.order.ready");
  assert.equal(row.operationContractId,"core.order.process");
  assert.deepEqual(row.config,{enabled:true,mode:"raw"});
  assert.equal(Object.isFrozen(row),true);
  assert.equal(Object.isFrozen(row.triggerConfig),true);
  assert.equal("selected" in row,false);
  assert.equal("executable" in row,false);
});

test("WFA-DEF-PG-002 owner-scope RLS hides sibling Industry definition", async () => {
  assert.equal(await store.loadForContext({requestContext:contextA(),automationDefinitionId:f.industryDefA2}),null);
  const own = await store.loadForContext({requestContext:contextA(f.industryA2),automationDefinitionId:f.industryDefA2});
  assert.ok(own); assert.equal(own.triggerType,"SCHEDULE"); assert.equal(own.operationContractId,"");
});

test("WFA-DEF-PG-003 Tenant definition remains same-Tenant visible and preserves schema-allowed raw values", async () => {
  const fromIndustry = await store.loadForContext({requestContext:contextA(),automationDefinitionId:f.tenantDefA});
  const fromTenant = await store.loadForContext({requestContext:tenantCoreA(),automationDefinitionId:f.tenantDefA});
  assert.ok(fromIndustry); assert.ok(fromTenant);
  assert.equal(fromIndustry.code,""); assert.equal(fromIndustry.status,"RETIRED");
  assert.equal(fromIndustry.conditionRuleRef,"");
  assert.equal(fromIndustry.operationContractId,undefined);
  assert.equal(fromIndustry.effectiveFrom,undefined);
  assert.equal(typeof fromIndustry.effectiveTo,"string");
});

test("WFA-DEF-PG-004 PLATFORM definition is not Tenant fallback and requires PLATFORM_GLOBAL context", async () => {
  assert.equal(await store.loadForContext({requestContext:tenantCoreA(),automationDefinitionId:f.platformDef}),null);
  const platform = await store.loadForContext({requestContext:platformContext(),automationDefinitionId:f.platformDef});
  assert.ok(platform); assert.equal(platform.ownerScope,"PLATFORM"); assert.equal(platform.status,"PUBLISHED");
  assert.ok(Date.parse(platform.updatedAt) < Date.parse(platform.createdAt));
});

test("WFA-DEF-PG-005 foreign Tenant definition is hidden and owning Tenant sees raw evidence", async () => {
  assert.equal(await store.loadForContext({requestContext:tenantCoreA(),automationDefinitionId:f.tenantDefB}),null);
  const own = await store.loadForContext({requestContext:tenantCoreB(),automationDefinitionId:f.tenantDefB});
  assert.ok(own); assert.equal(own.tenantId,f.tenantB); assert.equal(own.status,"ACTIVE");
});

test("WFA-DEF-PG-006 malformed id or database route/context mismatch fails closed", async () => {
  await assert.rejects(store.loadForContext({requestContext:tenantCoreA(),automationDefinitionId:"not-a-uuid"}));
  await assert.rejects(store.loadForContext({requestContext:{...tenantCoreA(),dataHomeId:randomUUID()},automationDefinitionId:f.tenantDefA}));
});

test("WFA-DEF-PG-007 Workflow worker role cannot mutate AutomationDefinition catalog", async () => {
  const scoped = new RequestScopedSql(new PostgresWorkflowDatabase(pool), {dataHomeId:f.home,regionCode:"IN-AUTOMATION-DEFINITION"});
  await assert.rejects(scoped.withContext(tenantCoreA(), (tx) => tx.query(
    "UPDATE core_workflow.automation_definition SET code='MUTATED' WHERE id=$1", [f.tenantDefA],
  )));
  const row = await store.loadForContext({requestContext:tenantCoreA(),automationDefinitionId:f.tenantDefA});
  assert.ok(row); assert.equal(row.code,"");
});
