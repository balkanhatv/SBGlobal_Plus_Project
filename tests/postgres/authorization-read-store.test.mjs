import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import pg from "pg";
import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAuthorizationReadStore } from "../../dist/server/authorization/postgres-authorization-read-store.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL, "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database");
const admin = new pg.Pool({ connectionString: process.env.SBG_POSTGRES_TEST_URL, max: 1 });
const role = `sbg_authz_reader_${randomBytes(8).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "home","tenant","principal","membership","industry","sibling","org","roleId","subject","snapshot",
  "tenantPolicy","industryPolicy","siblingPolicy","expiredPolicy",
  "platformPrincipal","platformRole","platformSubject","platformSnapshot","platformPolicy",
].map((key) => [key, randomUUID()]));
let pool, scoped;

function tenantContext(industryContextId = f.industry) {
  return {
    requestId: randomUUID(), correlationId: randomUUID(), tenantId: f.tenant,
    industryContextId, dataHomeId: f.home, regionCode: "IN-AUTHZ-READ",
    principalId: f.principal, principalType: "HUMAN", membershipId: f.membership,
    orgUnitId: f.org, orgUnitPath: [f.org], roleIds: [], scopeClass: "TENANT_INDUSTRY",
  };
}

function platformContext() {
  return {
    requestId: randomUUID(), correlationId: randomUUID(), principalId: f.platformPrincipal,
    principalType: "PLATFORM_OPERATOR", orgUnitPath: [], roleIds: [], scopeClass: "PLATFORM_GLOBAL",
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
      VALUES ($1::uuid,$1::uuid::text,'IN-AUTHZ-READ','IN','SHARED','ACTIVE')`,[f.home]);
    await client.query(`INSERT INTO core_tenancy.tenant
      (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
      VALUES ($1::uuid,$1::uuid::text,'Authz reader fixture','Authz reader fixture','ACTIVE','RTL',$2::uuid,'IN-AUTHZ-READ',now(),now())`,[f.tenant,f.home]);
    await client.query(`INSERT INTO core_identity.platform_principal
      (id,principal_type,status,created_at,updated_at) VALUES ($1,'HUMAN','ACTIVE',now(),now())`,[f.principal]);
    await client.query(`INSERT INTO core_identity.platform_principal
      (id,principal_type,status,created_at,updated_at) VALUES ($1,'PLATFORM_OPERATOR','ACTIVE',now(),now())`,[f.platformPrincipal]);
    await client.query(`INSERT INTO core_identity.tenant_membership
      (id,tenant_id,principal_id,status,created_at,updated_at)
      VALUES ($1,$2,$3,'ACTIVE',now(),now())`,[f.membership,f.tenant,f.principal]);
    await client.query(`INSERT INTO core_tenancy.org_unit
      (id,tenant_id,unit_type,code,name,path_key,status,created_at,updated_at)
      VALUES ($1::uuid,$2::uuid,'BRANCH','AUTHZ','Authz branch',$1::uuid::text,'ACTIVE',now(),now())`,[f.org,f.tenant]);
    for (const [id,code,isPrimary] of [[f.industry,"RTL",true],[f.sibling,"MFG",false]]) {
      await client.query(`INSERT INTO core_tenancy.industry_context
        (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
        VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`,[id,f.tenant,code,isPrimary]);
    }
    await client.query(`INSERT INTO core_authz.role_template
      (id,code,owner_scope,tenant_id,industry_context_id,industry_code,name,version,status,created_at,updated_at)
      VALUES ($1,'AUTHZ-READ-ROLE','INDUSTRY',$2,$3,'RTL','Authz read role',1,'ACTIVE',now(),now())`,[f.roleId,f.tenant,f.industry]);
    await client.query(`INSERT INTO core_authz.role_template
      (id,code,owner_scope,name,version,status,created_at,updated_at)
      VALUES ($1,'PLATFORM-AUTHZ-READ','PLATFORM','Platform authz read role',1,'ACTIVE',now(),now())`,[f.platformRole]);

    await client.query(`INSERT INTO core_authz.compiled_permission_subject
      (id,tenant_id,industry_context_id,principal_id,membership_id,org_unit_id,scope_class,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,'TENANT_INDUSTRY',now(),now())`,
      [f.subject,f.tenant,f.industry,f.principal,f.membership,f.org]);
    await client.query(`INSERT INTO core_authz.compiled_permission_snapshot
      (id,subject_id,version,status,role_ids,permission_schema_version,permission_set_json,source_fingerprint,compiled_at)
      VALUES ($1,$2,1,'CURRENT',$3::uuid[],1,$4::jsonb,$5,now())`,
      [f.snapshot,f.subject,[f.roleId],JSON.stringify({permissions:[{code:"rtl.pos.sale.view",effect:"ALLOW"}]}),"0123456789abcdef-tenant-reader"]);
    await client.query(`UPDATE core_authz.compiled_permission_subject
      SET current_snapshot_id=$2,current_version=1 WHERE id=$1`,[f.subject,f.snapshot]);

    await client.query(`INSERT INTO core_authz.compiled_platform_permission_subject
      (id,principal_id,created_at,updated_at) VALUES ($1,$2,now(),now())`,[f.platformSubject,f.platformPrincipal]);
    await client.query(`INSERT INTO core_authz.compiled_platform_permission_snapshot
      (id,subject_id,version,status,role_ids,permission_schema_version,permission_set_json,source_fingerprint,compiled_at)
      VALUES ($1,$2,1,'CURRENT',$3::uuid[],1,$4::jsonb,$5,now())`,
      [f.platformSnapshot,f.platformSubject,[f.platformRole],JSON.stringify({permissions:[{code:"core.identity.role.assign",effect:"ALLOW"}]}),"0123456789abcdef-platform-reader"]);
    await client.query(`UPDATE core_authz.compiled_platform_permission_subject
      SET current_snapshot_id=$2,current_version=1 WHERE id=$1`,[f.platformSubject,f.platformSnapshot]);

    const expression = JSON.stringify({op:"eq",attribute:"environment.risk",value:"HIGH"});
    await client.query(`INSERT INTO core_authz.abac_policy
      (id,code,tenant_id,applies_to_permission_pattern,priority,effect,expression_version,expression_ast_json,status,created_at,updated_at)
      VALUES ($1,'TENANT-BASE',$2,'rtl.*',10,'DENY',1,$3::jsonb,'ACTIVE',now(),now())`,[f.tenantPolicy,f.tenant,expression]);
    await client.query(`INSERT INTO core_authz.abac_policy
      (id,code,tenant_id,industry_context_id,applies_to_permission_pattern,priority,effect,expression_version,expression_ast_json,status,created_at,updated_at)
      VALUES ($1,'INDUSTRY-EXACT',$2,$3,'rtl.pos.sale.view',20,'RESTRICT',1,$4::jsonb,'ACTIVE',now(),now())`,[f.industryPolicy,f.tenant,f.industry,expression]);
    await client.query(`INSERT INTO core_authz.abac_policy
      (id,code,tenant_id,industry_context_id,applies_to_permission_pattern,priority,effect,expression_version,expression_ast_json,status,created_at,updated_at)
      VALUES ($1,'SIBLING-DENY',$2,$3,'rtl.*',30,'DENY',1,$4::jsonb,'ACTIVE',now(),now())`,[f.siblingPolicy,f.tenant,f.sibling,expression]);
    await client.query(`INSERT INTO core_authz.abac_policy
      (id,code,tenant_id,applies_to_permission_pattern,priority,effect,expression_version,expression_ast_json,valid_until,status,created_at,updated_at)
      VALUES ($1,'EXPIRED-DENY',$2,'rtl.*',40,'DENY',1,$3::jsonb,now()-interval '1 hour','ACTIVE',now(),now())`,[f.expiredPolicy,f.tenant,expression]);
    await client.query(`INSERT INTO core_authz.abac_policy
      (id,code,applies_to_permission_pattern,priority,effect,expression_version,expression_ast_json,status,created_at,updated_at)
      VALUES ($1,'PLATFORM-DENY','core.*',5,'DENY',1,$2::jsonb,'ACTIVE',now(),now())`,[f.platformPolicy,expression]);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }

  const url = new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username = role; url.password = password;
  pool = new pg.Pool({ connectionString: url.toString(), max: 1, connectionTimeoutMillis: 5000 });
  scoped = new RequestScopedSql(new PostgresDatabase(pool),{dataHomeId:f.home,regionCode:"IN-AUTHZ-READ"});
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM core_authz.abac_policy WHERE id=ANY($1::uuid[])",[[f.tenantPolicy,f.industryPolicy,f.siblingPolicy,f.expiredPolicy,f.platformPolicy]]);
    await client.query("UPDATE core_authz.compiled_permission_subject SET current_snapshot_id=NULL WHERE id=$1",[f.subject]);
    await client.query("DELETE FROM core_authz.compiled_permission_snapshot WHERE subject_id=$1",[f.subject]);
    await client.query("DELETE FROM core_authz.compiled_permission_subject WHERE id=$1",[f.subject]);
    await client.query("UPDATE core_authz.compiled_platform_permission_subject SET current_snapshot_id=NULL WHERE id=$1",[f.platformSubject]);
    await client.query("DELETE FROM core_authz.compiled_platform_permission_snapshot WHERE subject_id=$1",[f.platformSubject]);
    await client.query("DELETE FROM core_authz.compiled_platform_permission_subject WHERE id=$1",[f.platformSubject]);
    await client.query("DELETE FROM core_authz.role_template WHERE id=ANY($1::uuid[])",[[f.roleId,f.platformRole]]);
    await client.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id=$1",[f.tenant]);
    await client.query("DELETE FROM core_tenancy.org_unit WHERE tenant_id=$1",[f.tenant]);
    await client.query("DELETE FROM core_identity.tenant_membership WHERE tenant_id=$1",[f.tenant]);
    await client.query("DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",[[f.principal,f.platformPrincipal]]);
    await client.query("DELETE FROM core_tenancy.tenant WHERE id=$1",[f.tenant]);
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
    await client.query(`DROP ROLE IF EXISTS ${role}`);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); await admin.end(); }
});

test("tenant+industry Authorization reader returns exact current snapshot and only in-scope active applicable ABAC policies", async () => {
  const store = new PostgresAuthorizationReadStore(scoped);
  const state = await store.load({requestContext:tenantContext(),permissionCode:"rtl.pos.sale.view"});

  assert.equal(state.permissionSnapshot.scopeClass,"TENANT_INDUSTRY");
  assert.equal(state.permissionSnapshot.permissionVersion,1);
  assert.deepEqual(state.permissionSnapshot.roleIds,[f.roleId]);
  assert.deepEqual(state.permissionSnapshot.permissionSet.permissions,[{code:"rtl.pos.sale.view",effect:"ALLOW"}]);
  assert.deepEqual(state.policies.map((policy)=>policy.code),["TENANT-BASE","INDUSTRY-EXACT"]);

  await assert.rejects(
    store.load({requestContext:tenantContext(f.sibling),permissionCode:"rtl.pos.sale.view"}),
    (error)=>error.code==="AUTHORIZATION_STATE_UNAVAILABLE",
  );
});

test("platform Authorization reader uses dedicated platform snapshot and platform-global policy only", async () => {
  const state = await new PostgresAuthorizationReadStore(scoped).load({
    requestContext:platformContext(), permissionCode:"core.identity.role.assign",
  });

  assert.equal(state.permissionSnapshot.scopeClass,"PLATFORM_GLOBAL");
  assert.equal(state.permissionSnapshot.permissionVersion,1);
  assert.deepEqual(state.permissionSnapshot.roleIds,[f.platformRole]);
  assert.deepEqual(state.policies.map((policy)=>policy.code),["PLATFORM-DENY"]);
});
