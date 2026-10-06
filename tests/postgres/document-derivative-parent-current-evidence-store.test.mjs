import test, {before, after} from "node:test";
import assert from "node:assert/strict";
import {randomBytes, randomUUID} from "node:crypto";
import pg from "pg";

import {PostgresDocumentDatabase} from "../../dist/server/database/postgres-document-database.js";
import {RequestScopedSql} from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresDocumentDerivativeParentCurrentEvidenceStore,
} from "../../dist/server/document/postgres-document-derivative-parent-current-evidence-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin=new pg.Pool({
  connectionString:process.env.SBG_POSTGRES_TEST_URL,
  max:1,
});
const role="sbg_document_derivative_"+randomBytes(8).toString("hex");
const password=randomBytes(24).toString("hex");
const f=Object.fromEntries([
  "home","tenant","principal","membership","industry","sibling",
  "industryParentObject","industryDerivativeObject",
  "siblingParentObject","siblingDerivativeObject",
  "tenantParentObject","tenantDerivativeObject",
  "industryParent","industryDerivative",
  "siblingParent","siblingDerivative",
  "tenantParent","tenantDerivative",
].map(key=>[key,randomUUID()]));

let pool;
let store;

function context(industryContextId=f.industry){
  return Object.freeze({
    requestId:randomUUID(),
    correlationId:randomUUID(),
    tenantId:f.tenant,
    industryContextId,
    dataHomeId:f.home,
    regionCode:"IN-DERIVATIVE",
    principalId:f.principal,
    principalType:"HUMAN",
    membershipId:f.membership,
    orgUnitPath:Object.freeze([]),
    roleIds:Object.freeze([]),
    scopeClass:"TENANT_INDUSTRY",
  });
}

function tenantContext(){
  return Object.freeze({
    ...context(),
    industryContextId:undefined,
    scopeClass:"TENANT_CORE",
  });
}

before(async()=>{
  const client=await admin.connect();
  try{
    await client.query("BEGIN");
    await client.query(
      "CREATE ROLE "+role+" LOGIN PASSWORD '"+password+"' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS",
    );
    await client.query("GRANT sbg_document_service_rw TO "+role);

    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-DERIVATIVE','IN','SHARED','ACTIVE')`,
      [f.home],
    );
    await client.query(
      `INSERT INTO core_tenancy.tenant
        (id,tenant_code,legal_name,display_name,status,primary_industry_code,
         data_home_id,residency_region_code,created_at,updated_at)
       VALUES ($1::uuid,$1::uuid::text,'Derivative fixture','Derivative fixture',
         'ACTIVE','RTL',$2::uuid,'IN-DERIVATIVE',now(),now())`,
      [f.tenant,f.home],
    );
    await client.query(
      `INSERT INTO core_identity.platform_principal
        (id,principal_type,status,display_name,created_at,updated_at)
       VALUES ($1,'HUMAN','ACTIVE','Derivative principal',now(),now())`,
      [f.principal],
    );
    await client.query(
      `INSERT INTO core_identity.tenant_membership
        (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
       VALUES ($1,$2,$3,'ACTIVE',1,now(),now())`,
      [f.membership,f.tenant,f.principal],
    );
    for(const [id,code,primary] of [
      [f.industry,"RTL",true],
      [f.sibling,"MFG",false],
    ]){
      await client.query(
        `INSERT INTO core_tenancy.industry_context
          (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`,
        [id,f.tenant,code,primary],
      );
    }

    for(const [id,key] of [
      [f.industryParentObject,"industry-parent"],
      [f.industryDerivativeObject,"industry-derivative"],
      [f.siblingParentObject,"sibling-parent"],
      [f.siblingDerivativeObject,"sibling-derivative"],
      [f.tenantParentObject,"tenant-parent"],
      [f.tenantDerivativeObject,"tenant-derivative"],
    ]){
      await client.query(
        `INSERT INTO core_document.storage_object
          (id,data_home_id,bucket_class,object_key,size_bytes,checksum_sha256,
           encryption_key_ref,status,created_at)
         VALUES ($1,$2,'PRIVATE',$3,64,$4,'kms:test','ACTIVE',now())`,
        [id,f.home,"derivative/"+key,"checksum-"+key],
      );
    }

    const parents=[
      [f.industryParent,f.industry,"TENANT_INDUSTRY",f.industryParentObject,"industry-parent","REGULATED"],
      [f.siblingParent,f.sibling,"TENANT_INDUSTRY",f.siblingParentObject,"sibling-parent","CONFIDENTIAL"],
      [f.tenantParent,null,"TENANT_CORE",f.tenantParentObject,"tenant-parent","SENSITIVE_PERSONAL"],
    ];
    for(const [id,industryContextId,scopeClass,objectId,key,sensitivity] of parents){
      await client.query(
        `INSERT INTO core_document.document_meta
          (id,tenant_id,industry_context_id,scope_class,source_module,
           source_resource_type,source_resource_id,filename_display,media_type,
           size_bytes,checksum_sha256,storage_object_id,owner_principal_id,
           sensitivity_class,retention_class,residency_region,status,virus_scan_status,
           version_no,created_at,created_by,updated_at,updated_by)
         VALUES ($1,$2,$3,$4,'Documents','CaseFile',$5,$6,'application/pdf',
           64,$7,$8,$9,$10,'STANDARD','IN-DERIVATIVE','ACTIVE','CLEAN',
           1,now(),$9,now(),$9)`,
        [
          id,f.tenant,industryContextId,scopeClass,"case:"+id,key+".pdf",
          "checksum-"+key,objectId,f.principal,sensitivity,
        ],
      );
    }

    const derivatives=[
      [f.industryDerivative,f.industry,"TENANT_INDUSTRY",f.industryDerivativeObject,"industry-derivative",f.industryParent,"THUMBNAIL","PUBLIC"],
      [f.siblingDerivative,f.sibling,"TENANT_INDUSTRY",f.siblingDerivativeObject,"sibling-derivative",f.siblingParent,"PREVIEW","INTERNAL"],
      [f.tenantDerivative,null,"TENANT_CORE",f.tenantDerivativeObject,"tenant-derivative",f.tenantParent,"OCR_EXTRACT","CONFIDENTIAL"],
    ];
    for(const [id,industryContextId,scopeClass,objectId,key,parentId,derivativeType,sensitivity] of derivatives){
      await client.query(
        `INSERT INTO core_document.document_meta
          (id,tenant_id,industry_context_id,scope_class,source_module,
           source_resource_type,source_resource_id,filename_display,media_type,
           size_bytes,checksum_sha256,storage_object_id,owner_principal_id,
           sensitivity_class,retention_class,residency_region,status,virus_scan_status,
           version_no,parent_document_id,derivative_type,created_at,created_by,updated_at,updated_by)
         VALUES ($1,$2,$3,$4,'Documents','CaseFile',$5,$6,'application/pdf',
           64,$7,$8,$9,$10,'STANDARD','IN-DERIVATIVE','SCANNING','PENDING',
           1,$11,$12,now(),$9,now(),$9)`,
        [
          id,f.tenant,industryContextId,scopeClass,"case:"+id,key+".pdf",
          "checksum-"+key,objectId,f.principal,sensitivity,parentId,derivativeType,
        ],
      );
    }
    await client.query("COMMIT");
  }catch(error){
    await client.query("ROLLBACK");
    throw error;
  }finally{
    client.release();
  }

  const url=new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username=role;
  url.password=password;
  pool=new pg.Pool({
    connectionString:url.toString(),
    max:1,
    connectionTimeoutMillis:5000,
  });
  const scoped=new RequestScopedSql(new PostgresDocumentDatabase(pool),{
    dataHomeId:f.home,
    regionCode:"IN-DERIVATIVE",
  });
  store=new PostgresDocumentDerivativeParentCurrentEvidenceStore(scoped);
});

after(async()=>{
  if(pool) await pool.end();

  const client=await admin.connect();
  try{
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_document.document_meta WHERE tenant_id=$1",
      [f.tenant],
    );
    await client.query(
      `DELETE FROM core_document.storage_object
        WHERE id=ANY($1::uuid[])`,
      [[
        f.industryParentObject,f.industryDerivativeObject,
        f.siblingParentObject,f.siblingDerivativeObject,
        f.tenantParentObject,f.tenantDerivativeObject,
      ]],
    );
    await client.query("DELETE FROM core_identity.tenant_membership WHERE id=$1",[f.membership]);
    await client.query("DELETE FROM core_tenancy.industry_context WHERE tenant_id=$1",[f.tenant]);
    await client.query("DELETE FROM core_identity.platform_principal WHERE id=$1",[f.principal]);
    await client.query("DELETE FROM core_tenancy.tenant WHERE id=$1",[f.tenant]);
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1",[f.home]);
    await client.query("DROP ROLE IF EXISTS "+role);
    await client.query("COMMIT");
  }catch(error){
    await client.query("ROLLBACK");
    throw error;
  }finally{
    client.release();
    await admin.end();
  }
});

test("DOC-DERIV-PG-001 exact in-scope persisted derivative-parent relation is readable",async()=>{
  const result=await store.load({
    requestContext:context(),
    derivativeDocumentId:f.industryDerivative,
    parentDocumentId:f.industryParent,
  });

  assert.ok(result);
  assert.equal(result.derivative.id,f.industryDerivative);
  assert.equal(result.derivative.parentDocumentId,f.industryParent);
  assert.equal(result.derivative.derivativeType,"THUMBNAIL");
  assert.equal(result.derivative.status,"SCANNING");
  assert.equal(result.derivative.virusScanStatus,"PENDING");
  assert.equal(result.parent.id,f.industryParent);
  assert.equal(result.parent.status,"ACTIVE");
  assert.equal(result.parent.virusScanStatus,"CLEAN");
  assert.equal(Object.isFrozen(result),true);
});

test("DOC-DERIV-PG-002 wrong supplied parent id returns null with no alternate-parent lookup",async()=>{
  const result=await store.load({
    requestContext:context(),
    derivativeDocumentId:f.industryDerivative,
    parentDocumentId:f.siblingParent,
  });
  assert.equal(result,null);
});

test("DOC-DERIV-PG-003 sibling-Industry derivative-parent evidence remains RLS-hidden",async()=>{
  const hidden=await store.load({
    requestContext:context(),
    derivativeDocumentId:f.siblingDerivative,
    parentDocumentId:f.siblingParent,
  });
  assert.equal(hidden,null);

  const visible=await store.load({
    requestContext:context(f.sibling),
    derivativeDocumentId:f.siblingDerivative,
    parentDocumentId:f.siblingParent,
  });
  assert.ok(visible);
  assert.equal(visible.derivative.industryContextId,f.sibling);
  assert.equal(visible.parent.industryContextId,f.sibling);
});

test("DOC-DERIV-PG-004 Tenant Core derivative-parent relation remains same-Tenant visible",async()=>{
  const fromIndustry=await store.load({
    requestContext:context(),
    derivativeDocumentId:f.tenantDerivative,
    parentDocumentId:f.tenantParent,
  });
  const fromTenant=await store.load({
    requestContext:tenantContext(),
    derivativeDocumentId:f.tenantDerivative,
    parentDocumentId:f.tenantParent,
  });

  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.derivative.scopeClass,"TENANT_CORE");
  assert.equal(fromIndustry.derivative.industryContextId,undefined);
  assert.equal(fromTenant.parent.id,f.tenantParent);
});
