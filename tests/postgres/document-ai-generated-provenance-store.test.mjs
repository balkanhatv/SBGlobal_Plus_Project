import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";

import { PostgresDocumentDatabase } from "../../dist/server/database/postgres-document-database.js";
import { RequestScopedSql } from "../../dist/server/database/request-scoped-sql.js";
import {
  PostgresDocumentAIGeneratedProvenanceStore,
} from "../../dist/server/document/postgres-document-ai-generated-provenance-store.js";

assert.ok(
  process.env.SBG_POSTGRES_TEST_URL,
  "SBG_POSTGRES_TEST_URL must identify a disposable migrated test database",
);

const admin = new pg.Pool({
  connectionString: process.env.SBG_POSTGRES_TEST_URL,
  max: 1,
});
const role = "sbg_document_ai_prov_" + randomBytes(8).toString("hex");
const password = randomBytes(24).toString("hex");
const capabilityCode = "DOC_AI_PROV_" + randomUUID();
const providerCode = "DOC_AI_PROV_PROVIDER_" + randomUUID();
const modelCode = "DOC_AI_PROV_MODEL_" + randomUUID();

const f = Object.fromEntries([
  "home",
  "tenantA",
  "tenantB",
  "principalA",
  "principalB",
  "membershipA",
  "membershipB",
  "industryA1",
  "industryA2",
  "industryB1",
  "capability",
  "provider",
  "model",
  "requestA1",
  "requestA2",
  "requestB1",
  "objectGeneratedA1",
  "objectGeneratedA2",
  "objectGeneratedB1",
  "objectPlainA1",
  "objectTenantA",
  "docGeneratedA1",
  "docGeneratedA2",
  "docGeneratedB1",
  "docPlainA1",
  "docTenantA",
  "missingDocument",
].map((key) => [key, randomUUID()]));

let pool;
let scoped;
let store;

function industryContext(
  industryContextId = f.industryA1,
  principalId = f.principalA,
  membershipId = f.membershipA,
) {
  return Object.freeze({
    requestId: randomUUID(),
    correlationId: randomUUID(),
    tenantId: f.tenantA,
    industryContextId,
    dataHomeId: f.home,
    regionCode: "IN-DOCAIPROV",
    principalId,
    principalType: "HUMAN",
    membershipId,
    orgUnitPath: Object.freeze([]),
    roleIds: Object.freeze([]),
    scopeClass: "TENANT_INDUSTRY",
  });
}

function tenantCoreContext() {
  return Object.freeze({
    ...industryContext(),
    industryContextId: undefined,
    scopeClass: "TENANT_CORE",
  });
}

function tenantBContext() {
  return Object.freeze({
    ...industryContext(f.industryB1, f.principalB, f.membershipB),
    tenantId: f.tenantB,
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
       VALUES ($1::uuid,$1::uuid::text,'IN-DOCAIPROV','IN','SHARED','ACTIVE')`,
      [f.home],
    );

    for (const [tenantId, industry, label] of [
      [f.tenantA, "RTL", "Document AI provenance tenant A"],
      [f.tenantB, "EDU", "Document AI provenance tenant B"],
    ]) {
      await client.query(
        `INSERT INTO core_tenancy.tenant
          (id,tenant_code,legal_name,display_name,status,primary_industry_code,
           data_home_id,residency_region_code,created_at,updated_at)
         VALUES ($1::uuid,$1::uuid::text,$2,$2,'ACTIVE',$3,$4::uuid,
           'IN-DOCAIPROV',now(),now())`,
        [tenantId, label, industry, f.home],
      );
    }

    for (const [principalId, label] of [
      [f.principalA, "Document AI provenance principal A"],
      [f.principalB, "Document AI provenance principal B"],
    ]) {
      await client.query(
        `INSERT INTO core_identity.platform_principal
          (id,principal_type,status,display_name,created_at,updated_at)
         VALUES ($1,'HUMAN','ACTIVE',$2,now(),now())`,
        [principalId, label],
      );
    }

    for (const [membershipId, tenantId, principalId] of [
      [f.membershipA, f.tenantA, f.principalA],
      [f.membershipB, f.tenantB, f.principalB],
    ]) {
      await client.query(
        `INSERT INTO core_identity.tenant_membership
          (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
         VALUES ($1,$2,$3,'ACTIVE',1,now(),now())`,
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
         VALUES ($1,$2,$3,'ACTIVE',$4,now(),now())`,
        [id, tenantId, code, primary],
      );
    }

    await client.query(
      `INSERT INTO core_ai.ai_capability
        (id,code,category,required_entitlement,default_policy_class,schema_version,status)
       VALUES ($1,$2,'IMAGE',NULL,'DOC_AI_PROV_TEST',1,'ACTIVE')`,
      [f.capability, capabilityCode],
    );

    await client.query(
      `INSERT INTO core_ai.ai_provider
        (id,code,status,adapter_type,supported_regions,supported_capabilities,
         security_class,residency_metadata,credential_ref,health_state,version,
         created_at,updated_at)
       VALUES ($1::uuid,$2,'ACTIVE','REST',ARRAY['IN-DOCAIPROV']::text[],
         ARRAY['IMAGE']::text[],'REGULATED','{}'::jsonb,
         'secret://document-ai-provenance','HEALTHY',1,now(),now())`,
      [f.provider, providerCode],
    );

    await client.query(
      `INSERT INTO core_ai.ai_model
        (id,provider_id,model_code,display_name,capabilities,context_window_class,
         input_modalities,output_modalities,residency_regions,sensitivity_ceiling,
         cost_class,latency_class,status,version,metadata_json)
       VALUES ($1::uuid,$2::uuid,$3,'Document AI provenance model',
         ARRAY['IMAGE']::text[],'MEDIA',ARRAY['TEXT']::text[],ARRAY['IMAGE']::text[],
         ARRAY['IN-DOCAIPROV']::text[],'REGULATED','TEST','TEST','ACTIVE',1,'{}'::jsonb)`,
      [f.model, f.provider, modelCode],
    );

    for (const [id, tenantId, industryContextId, principalId, completedAt] of [
      [f.requestA1, f.tenantA, f.industryA1, f.principalA, "2026-09-25T01:00:00Z"],
      [f.requestA2, f.tenantA, f.industryA2, f.principalA, "2026-09-25T01:01:00Z"],
      [f.requestB1, f.tenantB, f.industryB1, f.principalB, "2026-09-25T01:02:00Z"],
    ]) {
      await client.query(
        `INSERT INTO core_ai.ai_media_request
          (id,tenant_id,industry_context_id,principal_id,capability_code,media_type,
           prompt_template_id,prompt_version,brand_config_version,localization_profile_ref,
           input_document_refs,sensitivity_class,residency_requirement,moderation_policy_ref,
           status,created_at,completed_at)
         VALUES ($1,$2,$3,$4,$5,'IMAGE',NULL,NULL,NULL,NULL,
           '{}'::uuid[],'INTERNAL','IN-DOCAIPROV','moderation:raw','COMPLETE',
           '2026-09-25T00:00:00Z'::timestamptz,$6::timestamptz)`,
        [id, tenantId, industryContextId, principalId, capabilityCode, completedAt],
      );
    }

    for (const [id, key] of [
      [f.objectGeneratedA1, "generated-a1"],
      [f.objectGeneratedA2, "generated-a2"],
      [f.objectGeneratedB1, "generated-b1"],
      [f.objectPlainA1, "plain-a1"],
      [f.objectTenantA, "tenant-a"],
    ]) {
      await client.query(
        `INSERT INTO core_document.storage_object
          (id,data_home_id,bucket_class,object_key,size_bytes,checksum_sha256,
           encryption_key_ref,status,created_at)
         VALUES ($1,$2,'PRIVATE',$3,64,$4,'kms:test','ACTIVE',now())`,
        [id, f.home, "doc/" + key, "checksum-" + key],
      );
    }

    const docs = [
      [f.docGeneratedA1, f.tenantA, f.industryA1, "TENANT_INDUSTRY", f.objectGeneratedA1, "generated-a1", f.principalA, true, f.requestA1],
      [f.docGeneratedA2, f.tenantA, f.industryA2, "TENANT_INDUSTRY", f.objectGeneratedA2, "generated-a2", f.principalA, true, f.requestA2],
      [f.docGeneratedB1, f.tenantB, f.industryB1, "TENANT_INDUSTRY", f.objectGeneratedB1, "generated-b1", f.principalB, true, f.requestB1],
      [f.docPlainA1, f.tenantA, f.industryA1, "TENANT_INDUSTRY", f.objectPlainA1, "plain-a1", f.principalA, false, null],
      [f.docTenantA, f.tenantA, null, "TENANT_CORE", f.objectTenantA, "tenant-a", f.principalA, false, null],
    ];

    for (const [id, tenantId, industryContextId, scopeClass, objectId, key, principalId, generated, requestId] of docs) {
      await client.query(
        `INSERT INTO core_document.document_meta
          (id,tenant_id,industry_context_id,scope_class,source_module,
           source_resource_type,source_resource_id,filename_display,media_type,
           size_bytes,checksum_sha256,storage_object_id,owner_principal_id,
           sensitivity_class,retention_class,residency_region,status,virus_scan_status,
           version_no,created_at,created_by,updated_at,updated_by,
           ai_generated,ai_media_request_id,ai_provider_id,ai_model_id,
           ai_provenance_json,ai_moderation_result_json,ai_licensing_usage_json)
         VALUES ($1,$2,$3,$4,'Documents','GeneratedMedia',$5,$6,'image/png',
           64,$7,$8,$9,'CONFIDENTIAL','STANDARD','IN-DOCAIPROV','ACTIVE','CLEAN',
           1,now(),$9,now(),$9,
           $10,$11,$12,$13,$14::jsonb,$15::jsonb,$16::jsonb)`,
        [
          id,
          tenantId,
          industryContextId,
          scopeClass,
          "resource:" + id,
          key + ".png",
          "checksum-" + key,
          objectId,
          principalId,
          generated,
          requestId,
          generated ? f.provider : null,
          generated ? f.model : null,
          generated ? '{"generator":{"seed":7},"promptHash":"opaque"}' : null,
          generated ? '{"decision":"RAW","scores":[0.1,0.2]}' : null,
          generated ? '{"license":"RAW","uses":1}' : null,
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
  scoped = new RequestScopedSql(new PostgresDocumentDatabase(pool), {
    dataHomeId: f.home,
    regionCode: "IN-DOCAIPROV",
  });
  store = new PostgresDocumentAIGeneratedProvenanceStore(scoped);
});

after(async () => {
  if (pool) await pool.end();

  const client = await admin.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM core_document.document_meta WHERE id=ANY($1::uuid[])",
      [[f.docGeneratedA1, f.docGeneratedA2, f.docGeneratedB1, f.docPlainA1, f.docTenantA]],
    );
    await client.query(
      "DELETE FROM core_document.storage_object WHERE id=ANY($1::uuid[])",
      [[f.objectGeneratedA1, f.objectGeneratedA2, f.objectGeneratedB1, f.objectPlainA1, f.objectTenantA]],
    );
    await client.query(
      "DELETE FROM core_ai.ai_media_request WHERE id=ANY($1::uuid[])",
      [[f.requestA1, f.requestA2, f.requestB1]],
    );
    await client.query("DELETE FROM core_ai.ai_model WHERE id=$1", [f.model]);
    await client.query("DELETE FROM core_ai.ai_provider WHERE id=$1", [f.provider]);
    await client.query("DELETE FROM core_ai.ai_capability WHERE id=$1", [f.capability]);
    await client.query(
      "DELETE FROM core_identity.tenant_membership WHERE id=ANY($1::uuid[])",
      [[f.membershipA, f.membershipB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.industry_context WHERE id=ANY($1::uuid[])",
      [[f.industryA1, f.industryA2, f.industryB1]],
    );
    await client.query(
      "DELETE FROM core_identity.platform_principal WHERE id=ANY($1::uuid[])",
      [[f.principalA, f.principalB]],
    );
    await client.query(
      "DELETE FROM core_tenancy.tenant WHERE id=ANY($1::uuid[])",
      [[f.tenantA, f.tenantB]],
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

test("DOCAIPROV-PG-001 exact AI-generated Industry Document preserves raw provenance evidence", async () => {
  const row = await store.loadForContext({
    requestContext: industryContext(),
    documentId: f.docGeneratedA1,
  });

  assert.ok(row);
  assert.equal(row.id, f.docGeneratedA1);
  assert.equal(row.tenantId, f.tenantA);
  assert.equal(row.industryContextId, f.industryA1);
  assert.equal(row.sensitivityClass, "CONFIDENTIAL");
  assert.equal(row.residencyRegion, "IN-DOCAIPROV");
  assert.equal(row.aiGenerated, true);
  assert.equal(row.aiMediaRequestId, f.requestA1);
  assert.equal(row.aiProviderId, f.provider);
  assert.equal(row.aiModelId, f.model);
  assert.deepEqual(row.aiProvenance, {
    generator: {seed: 7},
    promptHash: "opaque",
  });
  assert.deepEqual(row.aiModerationResult, {
    decision: "RAW",
    scores: [0.1, 0.2],
  });
  assert.deepEqual(row.aiLicensingUsage, {
    license: "RAW",
    uses: 1,
  });
  assert.equal(Object.isFrozen(row), true);
  assert.equal(Object.isFrozen(row.aiProvenance), true);
  assert.equal(Object.isFrozen(row.aiModerationResult), true);
  assert.equal(Object.isFrozen(row.aiLicensingUsage), true);
});

test("DOCAIPROV-PG-002 non-AI Document preserves false with no optional AI evidence", async () => {
  const row = await store.loadForContext({
    requestContext: industryContext(),
    documentId: f.docPlainA1,
  });

  assert.ok(row);
  assert.equal(row.aiGenerated, false);
  assert.equal(row.aiMediaRequestId, undefined);
  assert.equal(row.aiProviderId, undefined);
  assert.equal(row.aiModelId, undefined);
  assert.equal(row.aiProvenance, undefined);
  assert.equal(row.aiModerationResult, undefined);
  assert.equal(row.aiLicensingUsage, undefined);
});

test("DOCAIPROV-PG-003 FORCE-RLS preserves sibling/foreign isolation and Tenant-Core visibility", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryContext(),
    documentId: f.docGeneratedA2,
  }), null);
  assert.equal(await store.loadForContext({
    requestContext: industryContext(),
    documentId: f.docGeneratedB1,
  }), null);

  const sibling = await store.loadForContext({
    requestContext: industryContext(f.industryA2),
    documentId: f.docGeneratedA2,
  });
  const foreignOwner = await store.loadForContext({
    requestContext: tenantBContext(),
    documentId: f.docGeneratedB1,
  });
  const tenantFromIndustry = await store.loadForContext({
    requestContext: industryContext(),
    documentId: f.docTenantA,
  });
  const tenantFromCore = await store.loadForContext({
    requestContext: tenantCoreContext(),
    documentId: f.docTenantA,
  });

  assert.ok(sibling);
  assert.ok(foreignOwner);
  assert.ok(tenantFromIndustry);
  assert.ok(tenantFromCore);
  assert.equal(tenantFromIndustry.industryContextId, undefined);
  assert.equal(tenantFromCore.id, f.docTenantA);
});

test("DOCAIPROV-PG-004 normalized JSON remains immutable raw data", async () => {
  const row = await store.loadForContext({
    requestContext: industryContext(),
    documentId: f.docGeneratedA1,
  });
  assert.ok(row);
  assert.ok(row.aiProvenance);
  assert.ok(row.aiModerationResult);
  assert.equal(Object.isFrozen(row.aiProvenance.generator), true);
  assert.equal(Object.isFrozen(row.aiModerationResult.scores), true);
  assert.throws(() => {
    row.aiProvenance.promptHash = "changed";
  }, TypeError);
});

test("DOCAIPROV-PG-005 invalid ids, contexts and Data Home routes fail before disclosure", async () => {
  assert.equal(await store.loadForContext({
    requestContext: industryContext(),
    documentId: f.missingDocument,
  }), null);

  await assert.rejects(store.loadForContext({
    requestContext: industryContext(),
    documentId: "not-a-uuid",
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...industryContext(),
      dataHomeId: randomUUID(),
    },
    documentId: f.docGeneratedA1,
  }));

  await assert.rejects(store.loadForContext({
    requestContext: {
      ...industryContext(),
      industryContextId: undefined,
    },
    documentId: f.docGeneratedA1,
  }));
});

test("DOCAIPROV-PG-006 raw reader exposes no mutation or execution surface", async () => {
  assert.equal(typeof store.create, "undefined");
  assert.equal(typeof store.update, "undefined");
  assert.equal(typeof store.delete, "undefined");
  assert.equal(typeof store.generate, "undefined");
  assert.equal(typeof store.moderate, "undefined");
  assert.equal(typeof store.publish, "undefined");
  assert.equal(typeof store.execute, "undefined");
});

test("DOCAIPROV-PG-007 raw provenance does not become completion/currentness/authorization", async () => {
  const row = await store.loadForContext({
    requestContext: industryContext(),
    documentId: f.docGeneratedA1,
  });

  assert.ok(row);
  assert.equal("requestCompleted" in row, false);
  assert.equal("providerActive" in row, false);
  assert.equal("modelActive" in row, false);
  assert.equal("moderationApproved" in row, false);
  assert.equal("licensingApproved" in row, false);
  assert.equal("authorized" in row, false);
  assert.equal("published" in row, false);
});
