import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresDatabase } from "../../dist/server/database/postgres-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import { PostgresDataExportRequestStore } from "../../dist/server/config/postgres-data-export-request-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});

const role = "sbg_data_export_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");

const f = Object.fromEntries([
  "home","tenantA","tenantB",
  "requesterA","subjectA","requesterB","platformService",
  "membershipRequesterA","membershipSubjectA","membershipRequesterB",
  "industryA1","industryA2","industryB1",
  "storageA1","documentA1",
  "exportIndustryA1","exportIndustryA2","exportTenantA","exportTenantB","missingExport",
].map((key) => [key, randomUUID()]));

let pool;
let scoped;
let store;

function industryA(industryContextId = f.industryA1, principalId = f.requesterA) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-DATA-EXPORT",
    principalId,
    principalType: "HUMAN",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_INDUSTRY",
  });
}

function tenantA(principalId = f.requesterA) {
  return Object.freeze({
    ...industryA(f.industryA1, principalId),
    industryContextId: undefined,
    scopeClass: "TENANT_CORE",
  });
}

function tenantB() {
  return Object.freeze({
    ...tenantA(f.requesterB),
    tenantId: f.tenantB,
  });
}

function platformContext() {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    principalId: f.platformService,
    principalType: "SERVICE",
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "PLATFORM_GLOBAL",
  });
}

before(async () => {
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "CREATE ROLE " + role
        + " LOGIN PASSWORD '" + password
        + "' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS",
    );
    await client.query("GRANT sbg_app_rw TO " + role);

    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-DATA-EXPORT','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, primaryIndustry, label] of [
      [f.tenantA, "RTL", "Data export tenant A"],
      [f.tenantB, "EDU", "Data export tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-DATA-EXPORT',now()-interval '40 days',now())`,
        [tenantId, label, primaryIndustry, f.home],
      );
    }

    for (const [principalId, label] of [
      [f.requesterA, "Data export requester A"],
      [f.subjectA, "Data export subject A"],
      [f.requesterB, "Data export requester B"],
    ]) {
      await client.query(
        `INSERT INTO core_identity.platform_principal
          (id,principal_type,status,display_name,created_at,updated_at)
         VALUES ($1,'HUMAN','ACTIVE',$2,now()-interval '40 days',now())`,
        [principalId, label],
      );
    }

    for (const [membershipId, tenantId, principalId] of [
      [f.membershipRequesterA, f.tenantA, f.requesterA],
      [f.membershipSubjectA, f.tenantA, f.subjectA],
      [f.membershipRequesterB, f.tenantB, f.requesterB],
    ]) {
      await client.query(
        `INSERT INTO core_identity.tenant_membership
          (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',1,now()-interval '30 days',now())`,
        [membershipId, tenantId, principalId],
      );
    }

    for (const [id, tenantId, code, primary] of [
      [f.industryA1, f.tenantA, "RTL", true],
      [f.industryA2, f.tenantA, "MFG", false],
      [f.industryB1, f.tenantB, "EDU", true],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.industry_context
          (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',$4,now()-interval '30 days',now())`,
        [id, tenantId, code, primary],
      );
    }

    await client.query(
      `INSERT INTO core_document.storage_object
        (id,data_home_id,bucket_class,object_key,size_bytes,checksum_sha256,
         encryption_key_ref,status,created_at)
       VALUES ($1,$2,'PRIVATE','export/result-a1',64,'checksum-export-a1',
         'kms:test','ACTIVE',now()-interval '4 days')`,
      [f.storageA1, f.home],
    );

    await client.query(
      `INSERT INTO core_document.document_meta
        (id,tenant_id,industry_context_id,scope_class,source_module,
         source_resource_type,source_resource_id,filename_display,media_type,
         size_bytes,checksum_sha256,storage_object_id,owner_principal_id,
         sensitivity_class,retention_class,residency_region,status,virus_scan_status,
         version_no,created_at,created_by,updated_at,updated_by)
       VALUES ($1,$2,$3,'TENANT_INDUSTRY','DataGovernance','DataExportRequest',
         $4::uuid::text,'export-a1.zip','application/zip',64,'checksum-export-a1',
         $5,$6,'CONFIDENTIAL','STANDARD','IN-DATA-EXPORT','ACTIVE','CLEAN',
         1,now()-interval '3 days',$6,now()-interval '2 days',$6)`,
      [f.documentA1, f.tenantA, f.industryA1, f.exportIndustryA1, f.storageA1, f.requesterA],
    );

    await client.query(
      `INSERT INTO core_config.data_export_request
        (id,tenant_id,industry_context_id,requester_principal_id,subject_principal_id,
         scope_class,export_type,requested_resource_classes,residency_policy_version,
         sensitivity_ceiling,status,approval_ref,document_id,expires_at,created_at,updated_at)
       VALUES
        ($1,$5,$7,$9,$10,'TENANT_INDUSTRY','PORTABILITY',
          ARRAY['orders',NULL,'orders']::text[],'','CONFIDENTIAL','READY','',$11,
          now()-interval '1 day',now()-interval '2 days',now()),
        ($2,$5,$8,$9,NULL,'TENANT_INDUSTRY','DATA_ACCESS',
          ARRAY[]::text[],'res-v2','PUBLIC','REQUESTED',NULL,NULL,NULL,
          now()-interval '1 day',now()),
        ($3,$5,NULL,$9,NULL,'TENANT_CORE','ADMIN_EXPORT',
          ARRAY['','tenant']::text[],'res-v3','REGULATED','EXPIRED','approval:raw',NULL,
          now()-interval '5 days',now()-interval '10 days',now()-interval '1 day'),
        ($4,$6,NULL,$12,NULL,'TENANT_CORE','TENANT_EXPORT',
          ARRAY['profile']::text[],'res-b','INTERNAL','APPROVED',NULL,NULL,NULL,
          now()-interval '1 day',now())`,
      [
        f.exportIndustryA1,
        f.exportIndustryA2,
        f.exportTenantA,
        f.exportTenantB,
        f.tenantA,
        f.tenantB,
        f.industryA1,
        f.industryA2,
        f.requesterA,
        f.subjectA,
        f.documentA1,
        f.requesterB,
      ],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const url = new URL(process.env.SBG_POSTGRES_TEST_URL);
  url.username = role;
  url.password = password;
  pool = new pg.Pool({
    connectionString: url.toString(),
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  scoped = new RequestScopedSql(
    new PostgresDatabase(pool),
    {dataHomeId: f.home, regionCode: "IN-DATA-EXPORT"},
  );
  store = new PostgresDataExportRequestStore(scoped);
});

after(async () => {
  if (pool) await pool.end();
  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_config.data_export_request WHERE id=ANY($1::uuid[])",
      [[f.exportIndustryA1,f.exportIndustryA2,f.exportTenantA,f.exportTenantB]],
    );
    await client.query("DELETE FROM core_document.document_meta WHERE id=$1", [f.documentA1]);
    await client.query("DELETE FROM core_document.storage_object WHERE id=$1", [f.storageA1]);
    await client.query(
      "DELETE FROM core_identity.tenant_membership WHERE id=ANY($1::uuid[])",
      [[f.membershipRequesterA,f.membershipSubjectA,f.membershipRequesterB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1,f.industryA2,f.industryB1]],
    );
    await client.query(
      "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
      [[f.requesterA,f.subjectA,f.requesterB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",
      [[f.tenantA,f.tenantB]],
    );
    await client.query("DELETE FROM platform_directory.data_home WHERE id=$1", [f.home]);
    await client.query("DROP ROLE IF EXISTS " + role);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await admin.end();
  }
});

test("DATAEXPORT-PG-001 exact Tenant-Industry request preserves complete immutable raw evidence", async () => {
  const row = await store.loadForContext({
    requestContext: industryA(),
    exportRequestId: f.exportIndustryA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.exportIndustryA1);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.requesterPrincipalId, f.requesterA);
  assert.equal(row.subjectPrincipalId, f.subjectA);
  assert.equal(row.scopeClass, "TENANT_INDUSTRY");
  assert.equal(row.exportType, "PORTABILITY");
  assert.deepEqual(row.requestedResourceClasses, ["orders", null, "orders"]);
  assert.equal(row.residencyPolicyVersion, "");
  assert.equal(row.sensitivityCeiling, "CONFIDENTIAL");
  assert.equal(row.status, "READY");
  assert.equal(row.approvalRef, "");
  assert.equal(row.documentId, f.documentA1);
  assert.ok(Date.parse(row.expiresAt) < Date.now());
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.requestedResourceClasses), true);
});

test("DATAEXPORT-PG-002 sibling Industry context hides request", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryA(),
    exportRequestId: f.exportIndustryA2,
  }), null);

  const sibling = await store.loadForContext({
    requestContext: industryA(f.industryA2),
    exportRequestId: f.exportIndustryA2,
  });
  assert.ok(sibling);
  assert.equal(sibling.status, "REQUESTED");
  assert.deepEqual(sibling.requestedResourceClasses, []);
});

test("DATAEXPORT-PG-003 Tenant-Core request is same-Tenant visible and not requester-principal-private", async () => {
  const fromCore = await store.loadForContext({
    requestContext: tenantA(),
    exportRequestId: f.exportTenantA,
  });
  const fromIndustryAsSubject = await store.loadForContext({
    requestContext: industryA(f.industryA1, f.subjectA),
    exportRequestId: f.exportTenantA,
  });

  assert.ok(fromCore);
  assert.ok(fromIndustryAsSubject);
  assert.equal(fromCore.scopeClass, "TENANT_CORE");
  assert.equal(fromCore.industryContextId, undefined);
  assert.equal(fromIndustryAsSubject.id, f.exportTenantA);
  assert.equal(fromIndustryAsSubject.requesterPrincipalId, f.requesterA);
});

test("DATAEXPORT-PG-004 foreign Tenant and PLATFORM_GLOBAL contexts do not bypass export RLS", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantA(),
    exportRequestId: f.exportTenantB,
  }), null);

  const own = await store.loadForContext({
    requestContext: tenantB(),
    exportRequestId: f.exportTenantB,
  });
  assert.ok(own);
  assert.equal(own.tenantId, f.tenantB);

  assert.equal(await store.loadForContext({
    requestContext: platformContext(),
    exportRequestId: f.exportIndustryA1,
  }), null);
});

test("DATAEXPORT-PG-005 lifecycle/expiry/approval/document/resource/residency evidence remains raw and non-authorizing", async () => {
  const readyExpired = await store.loadForContext({
    requestContext: industryA(),
    exportRequestId: f.exportIndustryA1,
  });
  const expired = await store.loadForContext({
    requestContext: tenantA(),
    exportRequestId: f.exportTenantA,
  });

  assert.ok(readyExpired);
  assert.ok(expired);
  assert.equal(readyExpired.status, "READY");
  assert.ok(Date.parse(readyExpired.expiresAt) < Date.now());
  assert.equal(readyExpired.approvalRef, "");
  assert.equal(readyExpired.documentId, f.documentA1);
  assert.deepEqual(readyExpired.requestedResourceClasses, ["orders", null, "orders"]);
  assert.equal(readyExpired.residencyPolicyVersion, "");
  assert.equal(expired.status, "EXPIRED");
  assert.deepEqual(expired.requestedResourceClasses, ["", "tenant"]);
  assert.equal(expired.approvalRef, "approval:raw");
  assert.equal("authorized" in readyExpired, false);
  assert.equal("downloadable" in readyExpired, false);
  assert.equal("generated" in readyExpired, false);
  assert.equal("residencyPolicy" in readyExpired, false);
  assert.equal("documentAccess" in readyExpired, false);
});

test("DATAEXPORT-PG-006 missing, malformed, and route-mismatched reads fail safely", async () => {
  assert.equal(await store.loadForContext({
    requestContext: tenantA(),
    exportRequestId: f.missingExport,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: tenantA(),
    exportRequestId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {...tenantA(), dataHomeId: randomUUID()},
    exportRequestId: f.exportTenantA,
  }));
});

test("DATAEXPORT-PG-007 database DML/integrity/immutable scope remain schema-owned while port adds no export authority", async () => {
  const privileges = await scoped.withContext(tenantA(), (tx) => tx.query(
    `SELECT current_user AS user_name,
            has_table_privilege(current_user,'core_config.data_export_request','SELECT') AS can_select,
            has_table_privilege(current_user,'core_config.data_export_request','INSERT') AS can_insert,
            has_table_privilege(current_user,'core_config.data_export_request','UPDATE') AS can_update,
            has_table_privilege(current_user,'core_config.data_export_request','DELETE') AS can_delete`,
  ));
  assert.equal(privileges.rowCount, 1);
  assert.equal(privileges.rows[0].user_name, "sbg_app_rw");
  assert.equal(privileges.rows[0].can_select, true);
  assert.equal(privileges.rows[0].can_insert, true);
  assert.equal(privileges.rows[0].can_update, true);
  assert.equal(privileges.rows[0].can_delete, true);

  await assert.rejects(scoped.withContext(industryA(), (tx) => tx.query(
    "UPDATE core_config.data_export_request SET requester_principal_id=$1::uuid WHERE id=$2::uuid",
    [f.requesterB, f.exportIndustryA1],
  )));
  await assert.rejects(scoped.withContext(industryA(), (tx) => tx.query(
    "UPDATE core_config.data_export_request SET industry_context_id=$1::uuid WHERE id=$2::uuid",
    [f.industryA2, f.exportIndustryA1],
  )));

  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.list, "undefined");
  assert.equal(typeof store.approve, "undefined");
  assert.equal(typeof store.generate, "undefined");
  assert.equal(typeof store.download, "undefined");
  assert.equal(typeof store.authorize, "undefined");
  assert.equal(typeof store.revalidateDocument, "undefined");
  assert.equal(typeof store.resolveResidency, "undefined");
});
