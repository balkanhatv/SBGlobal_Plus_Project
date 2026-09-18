import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import pg from "pg";

import { AuthorizationCompilerService, AuthorizationSourceCompilerService } from "../../dist/core/index.js";
import { PostgresAuthorizationCompilerDatabase } from "../../dist/server/database/postgres-authorization-compiler-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresAuthorizationCompilerWriteStore } from "../../dist/server/authorization/postgres-authorization-compiler-store.js";
import { PostgresAuthorizationCompilerSourceStore } from "../../dist/server/authorization/postgres-authorization-compiler-source-store.js";
import { Sha256AuthorizationCompilerFingerprint } from "../../dist/server/authorization/sha256-authorization-compiler-fingerprint.js";

assert.ok(process.env.SBG_POSTGRES_TEST_URL);
const admin=new pg.Pool({connectionString:process.env.SBG_POSTGRES_TEST_URL,max:1});
const loginRole=`sbg_authz_source_${randomBytes(8).toString("hex")}`;
const password=randomBytes(24).toString("hex");
const f=Object.fromEntries([
  "home","tenant","industry","sibling","target","membership","actor",
  "roleAllow","roleDeny","roleTenant","roleSibling","platformTarget","platformRole",
  "permView","permRefund","permTenant","permSibling","permPlatform",
  "assignAllow","assignDeny","assignTenant","assignSibling","assignPlatform",
].map(key=>[key,randomUUID()]));

let pool,service;

function tenantContext(){
  return Object.freeze({
    requestId:randomUUID(),correlationId:randomUUID(),tenantId:f.tenant,industryContextId:f.industry,
    dataHomeId:f.home,regionCode:"IN-AUTHZ-SOURCE",principalId:f.actor,principalType:"SERVICE",
    membershipId:f.membership,orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"TENANT_INDUSTRY",
  });
}
function platformContext(){
  return Object.freeze({
    requestId:randomUUID(),correlationId:randomUUID(),principalId:f.actor,principalType:"SERVICE",
    orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),scopeClass:"PLATFORM_GLOBAL",
  });
}
const target=()=>Object.freeze({
  tenantId:f.tenant,industryContextId:f.industry,principalId:f.target,membershipId:f.membership,scopeClass:"TENANT_INDUSTRY",
});

before(async()=>{
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query(`CREATE ROLE ${loginRole} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
    await c.query(`GRANT sbg_authorization_compiler_rw TO ${loginRole}`);
    await c.query(`INSERT INTO platform_directory.data_home
      (id,code,region_code,jurisdiction_code,topology_class,status)
      VALUES ($1,$1::text,'IN-AUTHZ-SOURCE','IN','SHARED','ACTIVE')`,[f.home]);
    await c.query(`INSERT INTO core_tenancy.tenant
      (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
      VALUES ($1,$1::text,'Source compiler','Source compiler','ACTIVE','RTL',$2,'IN-AUTHZ-SOURCE',now(),now())`,[f.tenant,f.home]);
    await c.query(`INSERT INTO core_identity.platform_principal(id,principal_type,status,created_at,updated_at)
      VALUES ($1,'HUMAN','ACTIVE',now(),now()),($2,'PLATFORM_OPERATOR','ACTIVE',now(),now())`,
      [f.target,f.platformTarget]);
    await c.query(`INSERT INTO core_identity.tenant_membership
      (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
      VALUES ($1,$2,$3,'ACTIVE',1,now(),now())`,[f.membership,f.tenant,f.target]);
    await c.query(`INSERT INTO core_tenancy.industry_context
      (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
      VALUES ($1,$3,'RTL','ACTIVE',true,now(),now()),($2,$3,'MFG','ACTIVE',false,now(),now())`,
      [f.industry,f.sibling,f.tenant]);

    const perms=[
      [f.permView,"rtl.pos.sale.view","TENANT_INDUSTRY"],
      [f.permRefund,"rtl.pos.sale.refund","TENANT_INDUSTRY"],
      [f.permTenant,"core.tenant.settings.view","TENANT_CORE"],
      [f.permSibling,"mfg.production.order.view","TENANT_INDUSTRY"],
      [f.permPlatform,"core.platform.tenant.view","PLATFORM_GLOBAL"],
    ];
    for(const [id,code,scope] of perms) await c.query(`INSERT INTO core_authz.permission_definition
      (id,code,domain,module,resource_or_capability,action,scope_class,sensitivity_ceiling,description,status,version)
      VALUES ($1,$2,'test','test','test','view',$3,'INTERNAL','fixture','ACTIVE',1)`,[id,code,scope]);

    const roles=[
      [f.roleAllow,"INDUSTRY",f.tenant,f.industry,"RTL","ALLOW"],
      [f.roleDeny,"INDUSTRY",f.tenant,f.industry,"RTL","DENY"],
      [f.roleTenant,"TENANT",f.tenant,null,null,"TENANT"],
      [f.roleSibling,"INDUSTRY",f.tenant,f.sibling,"MFG","SIBLING"],
      [f.platformRole,"PLATFORM",null,null,null,"PLATFORM"],
    ];
    for(const [id,owner,tenant,industry,industryCode,code] of roles) await c.query(`INSERT INTO core_authz.role_template
      (id,code,owner_scope,tenant_id,industry_context_id,industry_code,name,immutable_seed,version,status,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$2,false,1,'ACTIVE',now(),now())`,
      [id,code,owner,tenant,industry,industryCode]);

    const rps=[
      [f.roleAllow,f.permView,"ALLOW",{}],
      [f.roleAllow,f.permRefund,"ALLOW",{ownerOnly:true}],
      [f.roleDeny,f.permView,"DENY",{}],
      [f.roleTenant,f.permTenant,"ALLOW",{}],
      [f.roleSibling,f.permSibling,"ALLOW",{}],
      [f.platformRole,f.permPlatform,"ALLOW",{}],
    ];
    for(const [role,perm,effect,constraints] of rps) await c.query(`INSERT INTO core_authz.role_permission
      (role_id,permission_id,effect,constraints_json,version) VALUES ($1,$2,$3,$4::jsonb,1)`,
      [role,perm,effect,JSON.stringify(constraints)]);

    const ras=[
      [f.assignAllow,f.industry,f.roleAllow],
      [f.assignDeny,f.industry,f.roleDeny],
      [f.assignTenant,null,f.roleTenant],
      [f.assignSibling,f.sibling,f.roleSibling],
    ];
    for(const [id,industry,role] of ras) await c.query(`INSERT INTO core_authz.role_assignment
      (id,tenant_id,industry_context_id,membership_id,principal_id,role_id,status,created_by,created_at)
      VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE',$5,now())`,
      [id,f.tenant,industry,f.membership,f.target,role]);
    await c.query(`INSERT INTO core_authz.platform_role_assignment
      (id,principal_id,role_id,status,created_by,created_at)
      VALUES ($1,$2,$3,'ACTIVE',$2,now())`,[f.assignPlatform,f.platformTarget,f.platformRole]);
    await c.query("COMMIT");
  }catch(e){await c.query("ROLLBACK");throw e}finally{c.release()}

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL); url.username=loginRole; url.password=password;
  pool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:5000});
  const db=new PostgresAuthorizationCompilerDatabase(pool);
  const scoped=new RequestScopedSql(db,{dataHomeId:f.home,regionCode:"IN-AUTHZ-SOURCE"});
  const publisher=new AuthorizationCompilerService({
    store:new PostgresAuthorizationCompilerWriteStore(scoped),
    ids:{nextId:randomUUID},
  });
  service=new AuthorizationSourceCompilerService({
    sourceStore:new PostgresAuthorizationCompilerSourceStore(scoped),
    publisher,
    fingerprint:new Sha256AuthorizationCompilerFingerprint(),
  });
});

after(async()=>{
  if(pool) await pool.end();
  const c=await admin.connect();
  try{
    await c.query("BEGIN");
    await c.query(`UPDATE core_authz.compiled_permission_subject SET current_snapshot_id=NULL
      WHERE tenant_id=$1 AND principal_id=$2`,[f.tenant,f.target]);
    await c.query(`DELETE FROM core_authz.compiled_permission_snapshot WHERE subject_id IN
      (SELECT id FROM core_authz.compiled_permission_subject WHERE tenant_id=$1 AND principal_id=$2)`,[f.tenant,f.target]);
    await c.query(`DELETE FROM core_authz.compiled_permission_subject WHERE tenant_id=$1 AND principal_id=$2`,[f.tenant,f.target]);
    await c.query(`UPDATE core_authz.compiled_platform_permission_subject SET current_snapshot_id=NULL WHERE principal_id=$1`,[f.platformTarget]);
    await c.query(`DELETE FROM core_authz.compiled_platform_permission_snapshot WHERE subject_id IN
      (SELECT id FROM core_authz.compiled_platform_permission_subject WHERE principal_id=$1)`,[f.platformTarget]);
    await c.query(`DELETE FROM core_authz.compiled_platform_permission_subject WHERE principal_id=$1`,[f.platformTarget]);
    await c.query("DELETE FROM core_authz.platform_role_assignment WHERE id=$1",[f.assignPlatform]);
    await c.query("DELETE FROM core_authz.role_assignment WHERE tenant_id=$1",[f.tenant]);
    await c.query("DELETE FROM core_authz.role_permission WHERE role_id=ANY($1::uuid[])",[[f.roleAllow,f.roleDeny,f.roleTenant,f.roleSibling,f.platformRole]]);
    await c.query("DELETE FROM core_authz.role_template WHERE id=ANY($1::uuid[])",[[f.roleAllow,f.roleDeny,f.roleTenant,f.roleSibling,f.platformRole]]);
    await c.query("DELETE FROM core_authz.permission_definition WHERE id=ANY($1::uuid[])",[[f.permView,f.permRefund,f.permTenant,f.permSibling,f.permPlatform]]);
    await c.query("DELETE FROM core_identity.tenant_membership WHERE id=$1",[f.membership]);
    await c.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id=$1",[f.tenant]);
    await c.query("DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",[[f.target,f.platformTarget]]);
    await c.query("DELETE FROM core_tenancy.tenant WHERE id=$1",[f.tenant]);
    await c.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
    await c.query(`DROP ROLE IF EXISTS ${loginRole}`);
    await c.query("COMMIT");
  }catch(e){await c.query("ROLLBACK");throw e}finally{c.release();await admin.end()}
});

test("source compiler reads only exact Industry assignments, applies DENY precedence and constraint fail-closed, then publishes",async()=>{
  const result=await service.compileTenant({requestContext:tenantContext(),target:target()});
  assert.equal(result.permissionVersion,1);
  const row=await admin.query(`SELECT role_ids,permission_set_json,source_fingerprint
    FROM core_authz.compiled_permission_snapshot WHERE id=$1`,[result.snapshotId]);
  assert.deepEqual([...row.rows[0].role_ids].sort(),[f.roleAllow,f.roleDeny].sort());
  assert.deepEqual(row.rows[0].permission_set_json,{
    permissions:[
      {code:"rtl.pos.sale.refund",effect:"DENY"},
      {code:"rtl.pos.sale.view",effect:"DENY"},
    ],
  });
  assert.match(row.rows[0].source_fingerprint,/^[0-9a-f]{64}$/);
  assert.equal(row.rows[0].role_ids.includes(f.roleTenant),false);
  assert.equal(row.rows[0].role_ids.includes(f.roleSibling),false);
});

test("platform compiler source-read policy permits exact target platform role and publishes independently",async()=>{
  const result=await service.compilePlatform({
    requestContext:platformContext(),
    target:{principalId:f.platformTarget},
  });
  const row=await admin.query(`SELECT role_ids,permission_set_json
    FROM core_authz.compiled_platform_permission_snapshot WHERE id=$1`,[result.snapshotId]);
  assert.deepEqual(row.rows[0].role_ids,[f.platformRole]);
  assert.deepEqual(row.rows[0].permission_set_json,{
    permissions:[{code:"core.platform.tenant.view",effect:"ALLOW"}],
  });
});

test("compiler source role remains unable to mutate source truth",async()=>{
  const db=new PostgresAuthorizationCompilerDatabase(pool);
  await assert.rejects(db.transaction(tx=>tx.query(
    "UPDATE core_authz.permission_definition SET description='forbidden' WHERE id=$1",[f.permView]
  )),error=>error.code==="DATABASE_QUERY_FAILED");
});
