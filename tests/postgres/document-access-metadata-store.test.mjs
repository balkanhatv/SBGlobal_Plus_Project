import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import {
  DocumentAccessCandidateError,
  DocumentAccessCandidateService,
} from "../../dist/core/index.js";
import { PostgresDocumentDatabase } from "../../dist/server/database/postgres-document-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresDocumentAccessMetadataStore,
} from "../../dist/server/document/postgres-document-access-metadata-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});
const role = "sbg_document_reader_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const f = Object.fromEntries([
  "home",
  "tenant",
  "principal",
  "membership",
  "industry",
  "sibling",
  "industryObject",
  "siblingObject",
  "tenantObject",
  "unsafeObject",
  "industryDocument",
  "siblingDocument",
  "tenantDocument",
  "unsafeDocument",
].map((key) => [key, randomUUID()]));

let pool;
let store;
let service;

function context(industryContextId = f.industry) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenant,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-DOCUMENT-READER",
    principalId: f.principal,
    principalType: "HUMAN",
    membershipId: f.membership,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_INDUSTRY",
  });
}

function tenantContext() {
  return Object.freeze({
    ...context(),
    industryContextId: undefined,
    scopeClass: "TENANT_CORE",
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
    await client.query("GRANT sbg_document_service_rw TO " + role);

    await client.query(
      `INSERT INTO platform_directory.data_home
        (id,code,region_code,jurisdiction_code,topology_class,status)
       VALUES ($1::uuid,$1::uuid::text,'IN-DOCUMENT-READER','IN','SHARED','ACTIVE')`,
      [f.home],
    );
    await client.query(
      `INSERT INTO core_tenancy.tenant
        (id,tenant_code,legal_name,display_name,status,primary_industry_code,
         data_home_id,residency_region_code,created_at,updated_at)
       VALUES ($1::uuid,$1::uuid::text,'Document reader fixture','Document reader fixture',
         'ACTIVE','RTL',$2::uuid,'IN-DOCUMENT-READER',now(),now())`,
      [f.tenant, f.home],
    );
    await client.query(
      `INSERT INTO core_identity.platform_principal
        (id,principal_type,status,display_name,created_at,updated_at)
       VALUES ($1,'HUMAN','ACTIVE','Document reader principal',now(),now())`,
      [f.principal],
    );
    await client.query(
      `INSERT INTO core_identity.tenant_membership
        (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
       VALUES ($1,$2,$3,'ACTIVE',1,now(),now())`,
      [f.membership, f.tenant, f.principal],
    );
    for (const [id, code, primary] of [
      [f.industry, "RTL", true],
      [f.sibling, "MFG", false],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.industry_context
          (id,tenant_id,industry_code,status,is_primary,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`,
        [id, f.tenant, code, primary],
      );
    }

    const objects = [
      [f.industryObject, "industry", "checksum-industry", "ACTIVE"],
      [f.siblingObject, "sibling", "checksum-sibling", "ACTIVE"],
      [f.tenantObject, "tenant", "checksum-tenant", "ACTIVE"],
      [f.unsafeObject, "unsafe", "checksum-unsafe", "QUARANTINED"],
    ];
    for (const [id, key, checksum, status] of objects) {
      await client.query(
        `INSERT INTO core_document.storage_object
          (id,data_home_id,bucket_class,object_key,size_bytes,checksum_sha256,
           encryption_key_ref,status,created_at)
         VALUES ($1,$2,'PRIVATE',$3,64,$4,'kms:test',$5,now())`,
        [id, f.home, "doc/" + key, checksum, status],
      );
    }

    const documents = [
      [f.industryDocument, f.industry, "TENANT_INDUSTRY", f.industryObject, "checksum-industry", "industry.pdf", "ACTIVE", "CLEAN"],
      [f.siblingDocument, f.sibling, "TENANT_INDUSTRY", f.siblingObject, "checksum-sibling", "sibling.pdf", "ACTIVE", "CLEAN"],
      [f.tenantDocument, null, "TENANT_CORE", f.tenantObject, "checksum-tenant", "tenant.pdf", "ACTIVE", "CLEAN"],
      [f.unsafeDocument, f.industry, "TENANT_INDUSTRY", f.unsafeObject, "checksum-unsafe", "unsafe.pdf", "QUARANTINED", "INFECTED"],
    ];
    for (const [id, industryContextId, scopeClass, objectId, checksum, filename, status, virus] of documents) {
      await client.query(
        `INSERT INTO core_document.document_meta
          (id,tenant_id,industry_context_id,scope_class,source_module,
           source_resource_type,source_resource_id,filename_display,media_type,
           size_bytes,checksum_sha256,storage_object_id,owner_principal_id,
           sensitivity_class,retention_class,residency_region,status,virus_scan_status,
           version_no,created_at,created_by,updated_at,updated_by)
         VALUES ($1,$2,$3,$4,'Documents','CaseFile',$5,$6,'application/pdf',
           64,$7,$8,$9,'CONFIDENTIAL','STANDARD','IN-DOCUMENT-READER',$10,$11,
           1,now(),$9,now(),$9)`,
        [
          id,
          f.tenant,
          industryContextId,
          scopeClass,
          "case:" + id,
          filename,
          checksum,
          objectId,
          f.principal,
          status,
          virus,
        ],
      );
    }
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
  const scoped = new RequestScopedSql(new PostgresDocumentDatabase(pool), {
    dataHomeId: f.home,
    regionCode: "IN-DOCUMENT-READER",
  });
  store = new PostgresDocumentAccessMetadataStore(scoped);
  service = new DocumentAccessCandidateService(store);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_document.document_meta WHERE tenant_id=$1",
      [f.tenant],
    );
    await client.query(
      "DELETE FROM core_document.storage_object WHERE id=ANY($1::uuid[])",
      [[f.industryObject, f.siblingObject, f.tenantObject, f.unsafeObject]],
    );
    await client.query(
      "DELETE FROM core_identity.tenant_membership WHERE id=$1",
      [f.membership],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE tenant_id=$1",
      [f.tenant],
    );
    await client.query(
      "DELETE FROM core_identity.platform_principal WHERE id=$1",
      [f.principal],
    );
    await client.query(
      "DELETE FROM core_tenancy.tenant WHERE id=$1",
      [f.tenant],
    );
    await client.query(
      "DELETE FROM platform_directory.data_home WHERE id=$1",
      [f.home],
    );
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

test("DOC-PG-001 PostgreSQL reader maps exact in-scope Industry DocumentMeta", async () => {
  const row = await store.loadForContext({
    requestContext: context(),
    documentId: f.industryDocument,
  });

  assert.ok(row);
  assert.equal(row.id, f.industryDocument);
  assert.equal(row.tenantId, f.tenant);
  assert.equal(row.industryContextId, f.industry);
  assert.equal(row.scopeClass, "TENANT_INDUSTRY");
  assert.equal(row.storageObjectId, f.industryObject);
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.virusScanStatus, "CLEAN");
  assert.equal("objectKey" in row, false);
  assert.equal("providerRef" in row, false);
});

test("DOC-PG-002 FORCE-RLS hides sibling Industry metadata", async () => {
  const hidden = await store.loadForContext({
    requestContext: context(),
    documentId: f.siblingDocument,
  });
  assert.equal(hidden, null);

  const sibling = await store.loadForContext({
    requestContext: context(f.sibling),
    documentId: f.siblingDocument,
  });
  assert.ok(sibling);
  assert.equal(sibling.industryContextId, f.sibling);
});

test("DOC-PG-003 Tenant Core metadata is tenant-visible from Industry and Tenant Core contexts", async () => {
  const fromIndustry = await store.loadForContext({
    requestContext: context(),
    documentId: f.tenantDocument,
  });
  const fromTenant = await store.loadForContext({
    requestContext: tenantContext(),
    documentId: f.tenantDocument,
  });

  assert.ok(fromIndustry);
  assert.ok(fromTenant);
  assert.equal(fromIndustry.scopeClass, "TENANT_CORE");
  assert.equal(fromIndustry.industryContextId, undefined);
  assert.equal(fromTenant.id, f.tenantDocument);
});

test("DOC-PG-004 real PostgreSQL metadata composes with DD-082 ACTIVE/CLEAN gate", async () => {
  await assert.rejects(
    service.prepare({
      requestContext: context(),
      documentId: f.unsafeDocument,
    }),
    (error) => error instanceof DocumentAccessCandidateError
      && error.code === "RESOURCE_STATE_INVALID",
  );
});

test("DOC-PG-005 route/context mismatch fails closed before metadata disclosure", async () => {
  await assert.rejects(
    store.loadForContext({
      requestContext: {
        ...context(),
        dataHomeId: randomUUID(),
      },
      documentId: f.industryDocument,
    }),
  );
});
