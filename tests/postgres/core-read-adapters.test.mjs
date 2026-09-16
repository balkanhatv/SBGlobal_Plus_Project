import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import pg from "pg";
import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresAuthorizationContextAdapter,
  PostgresEffectiveRoleReadAdapter,
} from "../../dist/server/authorization/postgres-authorization-context.js";
import { PostgresIndustryPresentationCatalogAdapter } from "../../dist/server/tenancy/postgres-industry-presentation.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL, "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database");
const admin = new pg.Pool({ connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1 });
const role = `sbg_read_${randomBytes(8).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "home","tenant","principal","membership","industry","industrySibling","org","subject","snapshot","snapshot2","roleId",
].map((key) => [key, randomUUID()]));
let pool, database, scoped;

function provisional(industryContextId = f.industry) {
  return {
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenant,
    industryContextId,
    principalId: f.principal,
    membershipId: f.membership,
    orgUnitId: f.org,
    orgUnitPath: [f.org],
    dataHomeId: f.home,
    regionCode: "IN-READ",
    scopeClass: "TENANT_INDUSTRY",
  };
}

before(async () => {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(`CREATE ROLE ${role} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
    await client.query(`GRANT sbg_app_rw TO ${role}`);
    await client.query(`INSERT INTO platform_directory.data_home
      (id,code,region_code,jurisdiction_code,topology_class,status)
      VALUES ($1,$1::text,'IN-READ','IN','SHARED','ACTIVE')`,[f.home]);
    await client.query(`INSERT INTO core_tenancy.tenant
      (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
      VALUES ($1,$1::text,'Read adapter fixture','Read adapter fixture','ACTIVE','RTL',$2,'IN-READ',now(),now())`,[f.tenant,f.home]);
    await client.query(`INSERT INTO core_identity.platform_principal
      (id,principal_type,status,created_at,updated_at) VALUES ($1,'HUMAN','ACTIVE',now(),now())`,[f.principal]);
    await client.query(`INSERT INTO core_identity.tenant_membership
      (id,tenant_id,principal_id,status,created_at,updated_at)
      VALUES ($1,$2,$3,'ACTIVE',now(),now())`,[f.membership,f.tenant,f.principal]);
    await client.query(`INSERT INTO core_tenancy.org_unit
      (id,tenant_id,unit_type,code,name,path_key,status,created_at,updated_at)
      VALUES ($1,$2,'BRANCH','READ','Read branch',$1::text,'ACTIVE',now(),now())`,[f.org,f.tenant]);
    for (const [id,code,isPrimary] of [[f.industry,"RTL",true],[f.industrySibling,"MFG",false]]) {
      await client.query(`INSERT INTO core_tenancy.industry_context
        (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
        VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`,[id,f.tenant,code,isPrimary]);
    }
    await client.query(`INSERT INTO core_authz.role_template
      (id,code,owner_scope,tenant_id,industry_context_id,industry_code,name,version,status,created_at,updated_at)
      VALUES ($1,'READ-ROLE','INDUSTRY',$2,$3,'RTL','Read role',1,'ACTIVE',now(),now())`,[f.roleId,f.tenant,f.industry]);
    await client.query(`INSERT INTO core_authz.compiled_permission_subject
      (id,tenant_id,industry_context_id,principal_id,membership_id,org_unit_id,scope_class,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,'TENANT_INDUSTRY',now(),now())`,
      [f.subject,f.tenant,f.industry,f.principal,f.membership,f.org]);
    await client.query(`INSERT INTO core_authz.compiled_permission_snapshot
      (id,subject_id,version,status,role_ids,permission_set_json,source_fingerprint,compiled_at)
      VALUES ($1,$2,1,'CURRENT',$3::uuid[],$4::jsonb,$5,now())`,
      [f.snapshot,f.subject,[f.roleId],JSON.stringify({"rtl.pos.sale.view":{"effect":"ALLOW"}}),"0123456789abcdef-read-v1"]);
    await client.query(`UPDATE core_authz.compiled_permission_subject
      SET current_snapshot_id=$2,current_version=1 WHERE id=$1`,[f.subject,f.snapshot]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }

  const url = new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username = role; url.password = password;
  pool = new pg.Pool({ connectionString: url.toString(), max: 1, connectionTimeoutMillis: 5000 });
  database = new PostgresDatabase(pool);
  scoped = new RequestScopedSql(database,{dataHomeId:f.home,regionCode:"IN-READ"});
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM core_authz.compiled_permission_snapshot WHERE subject_id=$1",[f.subject]);
    await client.query("DELETE FROM core_authz.compiled_permission_subject WHERE id=$1",[f.subject]);
    await client.query("DELETE FROM core_authz.role_template WHERE id=$1",[f.roleId]);
    await client.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id=$1",[f.tenant]);
    await client.query("DELETE FROM core_tenancy.org_unit WHERE tenant_id=$1",[f.tenant]);
    await client.query("DELETE FROM core_identity.tenant_membership WHERE tenant_id=$1",[f.tenant]);
    await client.query("DELETE FROM core_identity.platform_principal WHERE id=$1",[f.principal]);
    await client.query("DELETE FROM core_tenancy.tenant WHERE id=$1",[f.tenant]);
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
    await client.query(`DROP ROLE IF EXISTS ${role}`);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); await admin.end(); }
});

test("compiled Authorization context reads exact CURRENT snapshot/version under Tenant+Industry RLS", async () => {
  const adapter = new PostgresAuthorizationContextAdapter(scoped);
  const result = await adapter.loadRoleContext(provisional());
  assert.equal(result.permissionVersion,1);
  assert.deepEqual(result.roleIds,[f.roleId]);

  await assert.rejects(adapter.loadRoleContext(provisional(f.industrySibling)),
    (error) => error.code==="DEPENDENCY_UNAVAILABLE");
});

test("roles read adapter uses caller TENANT_CORE scope and current compiled subject", async () => {
  const client = await admin.connect();
  const coreSubject=randomUUID(), coreSnapshot=randomUUID();
  try {
    await client.query("BEGIN");
    await client.query(`INSERT INTO core_authz.compiled_permission_subject
      (id,tenant_id,principal_id,membership_id,org_unit_id,scope_class,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,'TENANT_CORE',now(),now())`,
      [coreSubject,f.tenant,f.principal,f.membership,f.org]);
    await client.query(`INSERT INTO core_authz.compiled_permission_snapshot
      (id,subject_id,version,status,role_ids,permission_set_json,source_fingerprint,compiled_at)
      VALUES ($1,$2,1,'CURRENT',$3::uuid[],'{}'::jsonb,$4,now())`,
      [coreSnapshot,coreSubject,[f.roleId],"0123456789abcdef-core-v1"]);
    await client.query(`UPDATE core_authz.compiled_permission_subject
      SET current_snapshot_id=$2,current_version=1 WHERE id=$1`,[coreSubject,coreSnapshot]);
    await client.query("COMMIT");

    const context={
      requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenant,
      dataHomeId:f.home,regionCode:"IN-READ",principalId:f.principal,principalType:"HUMAN",
      membershipId:f.membership,orgUnitId:f.org,orgUnitPath:[f.org],roleIds:[],
      scopeClass:"TENANT_CORE",
    };
    const adapter=new PostgresEffectiveRoleReadAdapter(scoped);
    const result=await adapter.listEffective({requestContext:context,principalId:f.principal,membershipId:f.membership});
    assert.equal(result.permissionVersion,1);
    assert.deepEqual(result.roleIds,[f.roleId]);
  } finally {
    await client.query("DELETE FROM core_authz.compiled_permission_snapshot WHERE subject_id=$1",[coreSubject]);
    await client.query("DELETE FROM core_authz.compiled_permission_subject WHERE id=$1",[coreSubject]);
    client.release();
  }
});

test("compiled permission current pointer advances monotonically and old snapshot is ignored", async () => {
  const client=await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE core_authz.compiled_permission_snapshot
      SET status='SUPERSEDED',superseded_at=now() WHERE id=$1`,[f.snapshot]);
    await client.query(`INSERT INTO core_authz.compiled_permission_snapshot
      (id,subject_id,version,status,role_ids,permission_set_json,source_fingerprint,compiled_at)
      VALUES ($1,$2,2,'CURRENT','{}'::uuid[],'{}'::jsonb,$3,now())`,
      [f.snapshot2,f.subject,"0123456789abcdef-read-v2"]);
    await client.query(`UPDATE core_authz.compiled_permission_subject
      SET current_snapshot_id=$2,current_version=2 WHERE id=$1`,[f.subject,f.snapshot2]);
    await client.query("COMMIT");
  } catch(error){await client.query("ROLLBACK");throw error;} finally {client.release();}

  const result=await new PostgresAuthorizationContextAdapter(scoped).loadRoleContext(provisional());
  assert.equal(result.permissionVersion,2);
  assert.deepEqual(result.roleIds,[]);
});

test("Current Supported Industry presentation catalog is global read-only runtime data", async () => {
  const catalog=new PostgresIndustryPresentationCatalogAdapter(database);
  const rtl=await catalog.getCurrentByCode("RTL");
  assert.deepEqual(rtl,{
    industryCode:"RTL",displayKey:"retail",displayName:"Retail & Commerce",
    routeSlug:"retail",sortOrder:3,iconKey:"industry-retail",
    experiencePackageKey:"industry.rtl",version:1,
  });
  assert.equal(await catalog.getCurrentByCode("FUT"),null);
  assert.equal(await catalog.getCurrentByCode("rtl"),null);

  await assert.rejects(database.transaction((tx)=>tx.query(
    "UPDATE core_master.current_supported_industry SET display_name='forbidden' WHERE industry_code='RTL'")),
    (error)=>error.code==="DATABASE_QUERY_FAILED");
  await assert.rejects(scoped.withContext({
    requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenant,industryContextId:f.industry,
    dataHomeId:f.home,regionCode:"IN-READ",principalId:f.principal,scopeClass:"TENANT_INDUSTRY",
    orgUnitPath:[],roleIds:[],
  },(tx)=>tx.query("UPDATE core_authz.compiled_permission_subject SET row_version=row_version+1 WHERE id=$1",[f.subject])),
  (error)=>error.code==="DATABASE_QUERY_FAILED");
});
